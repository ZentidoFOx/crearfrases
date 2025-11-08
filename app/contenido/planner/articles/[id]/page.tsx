"use client"

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, BarChart3, Target, FileText, RefreshCw } from 'lucide-react'
import { CircularProgress } from '@/components/ui/circular-progress'
import { plannerArticlesService, type PlannerArticle } from '@/lib/api/planner-articles'
import { markdownToHtml, htmlToMarkdown } from '@/components/contenido/planner/parts/step3/utils'
import { WysiwygEditor } from '@/components/editor'
import { useOptimization } from '@/components/contenido/planner/parts/step3/hooks/useOptimization'
import { useWordPress } from '@/components/contenido/planner/parts/step3/hooks/useWordPress'
import { useLanguages } from '@/components/contenido/planner/parts/step3/hooks/useLanguages'
import { useWebsite } from '@/contexts/website-context'
import { publishToWordPress } from '@/lib/api/wordpress-publisher'
import { translatorService } from '@/lib/api/translator'
import { humanizerService } from '@/lib/api/humanizer'
import {
  ArticleHeader,
  AnalyticsTab,
  SEOTab,
  WordPressTab,
  GooglePreview
} from '../parts'

export default function ArticleEditorPage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<PlannerArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [editorKey, setEditorKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'analytics' | 'seo' | 'wordpress'>('analytics')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [postStatus, setPostStatus] = useState<'publish' | 'draft'>('publish')
  const [publishProgress, setPublishProgress] = useState(0)
  const [currentPublishStep, setCurrentPublishStep] = useState('')
  const [publishedPostId, setPublishedPostId] = useState<number>()
  const [publishedPostUrl, setPublishedPostUrl] = useState<string>()
  const [showGooglePreview, setShowGooglePreview] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<string>('es')
  const [loadingTranslation, setLoadingTranslation] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [currentTranslationStep, setCurrentTranslationStep] = useState('')
  const [targetLanguageName, setTargetLanguageName] = useState('')
  const [currentTranslationData, setCurrentTranslationData] = useState<any>(null)
  const [humanizing, setHumanizing] = useState(false)
  const [humanizeProgress, setHumanizeProgress] = useState(0)
  const [currentHumanizeStep, setCurrentHumanizeStep] = useState('')
  const [lastUpdateTime, setLastUpdateTime] = useState(0)

  const articleId = params?.id ? parseInt(params.id as string) : null
  const { activeWebsite } = useWebsite()
  
  // Datos del artículo actual (puede ser original o traducción)
  const displayArticle = currentTranslationData || article
  
  const optimization = useOptimization()
  const wordpress = useWordPress(
    article?.keywords_array || [], 
    activeWebsite?.url,
    displayArticle // Pasar datos del artículo para restaurar imagen y categorías
  )
  const languagesHook = useLanguages(activeWebsite?.url)

  useEffect(() => {
    if (articleId) loadArticle()
  }, [articleId])

  useEffect(() => {
    if (article?.content) {
      // Convertir markdown a HTML para el editor WYSIWYG
      const htmlContent = markdownToHtml(article.content)
      setEditedContent(htmlContent)
      setEditorKey(prev => prev + 1)
    }
  }, [article?.content])

  // Restaurar estado de publicación cuando se carga el artículo
  useEffect(() => {
    if (displayArticle?.wordpress_status) {
      setPostStatus(displayArticle.wordpress_status as 'publish' | 'draft')
      console.log('📋 Estado de publicación restaurado:', displayArticle.wordpress_status)
    }
  }, [displayArticle?.wordpress_status])

  const loadArticle = async () => {
    if (!articleId) return
    setLoading(true)
    setError(null)
    try {
      const data = await plannerArticlesService.getById(articleId)
      setArticle(data)
      
      // Establecer idioma actual al idioma principal del artículo
      setCurrentLanguage(data.language || 'es')
      
      // Convertir markdown a HTML para el editor
      const htmlContent = markdownToHtml(data.content || '')
      setEditedContent(htmlContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el artículo')
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = async (langCode: string) => {
    if (!article || !articleId) return
    
    // Si es el idioma principal, mostrar contenido del artículo original
    if (langCode === article.language) {
      setCurrentLanguage(langCode)
      setCurrentTranslationData(null) // Limpiar datos de traducción
      const htmlContent = markdownToHtml(article.content || '')
      setEditedContent(htmlContent)
      setEditorKey(prev => prev + 1)
      return
    }
    
    // Si es una traducción, cargarla
    setLoadingTranslation(true)
    try {
      const translation = await plannerArticlesService.getTranslation(articleId, langCode)
      setCurrentLanguage(langCode)
      
      // Crear objeto con datos de la traducción para mostrar en el UI
      setCurrentTranslationData({
        ...article,
        title: translation.title,
        h1_title: translation.h1_title,
        keyword: translation.keyword,
        objective_phrase: translation.objective_phrase,
        keywords_array: translation.keywords_array,
        meta_description: translation.meta_description,
        content: translation.content,
        seo_data: translation.seo_data,
        word_count: translation.word_count,
        language: translation.language
      })
      
      const htmlContent = markdownToHtml(translation.content || '')
      setEditedContent(htmlContent)
      setEditorKey(prev => prev + 1)
    } catch (error: any) {
      alert(`Error al cargar traducción: ${error.message}`)
    } finally {
      setLoadingTranslation(false)
    }
  }

  const handleSave = async () => {
    if (!articleId || !article) return
    setSaving(true)
    try {
      // 🔥 Obtener contenido actual del editor
      const editorElement = document.getElementById('wysiwyg-editor')
      const currentEditorContent = editorElement?.innerHTML || editedContent
      
      // Convertir HTML a markdown antes de guardar
      const markdownContent = htmlToMarkdown(currentEditorContent)
      
      // 🔥 Preparar datos de WordPress para guardar
      const wpData: any = {
        content: markdownContent
      }
      
      // Agregar imagen destacada si existe
      if (wordpress.wpFeaturedImage) {
        wpData.featured_image_url = wordpress.wpFeaturedImage
        console.log('💾 Guardando imagen destacada:', wordpress.wpFeaturedImage)
      }
      
      // Agregar categorías si existen
      if (wordpress.wpCategories.length > 0) {
        const categoriesForDB = wordpress.availableCategories
          .filter(cat => wordpress.wpCategories.includes(cat.name))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug
          }))
        
        if (categoriesForDB.length > 0) {
          wpData.wordpress_categories = categoriesForDB
          console.log('💾 Guardando categorías:', categoriesForDB)
        }
      }
      
      // Agregar estado de publicación
      if (postStatus) {
        wpData.wordpress_status = postStatus
        console.log('💾 Guardando estado de publicación:', postStatus)
      }
      
      // Verificar si estamos guardando una traducción o el artículo original
      const isTranslation = currentLanguage !== (article.language || 'es')
      
      if (isTranslation) {
        // Guardar traducción con imagen y categorías
        await plannerArticlesService.updateTranslation(articleId, currentLanguage, wpData)
        // Actualizar el estado local sin recargar
        if (currentTranslationData) {
          setCurrentTranslationData({
            ...currentTranslationData,
            ...wpData
          })
        }
      } else {
        // Guardar artículo original con imagen y categorías
        await plannerArticlesService.update(articleId, wpData)
        // Actualizar el estado local sin recargar
        setArticle(prev => prev ? { ...prev, ...wpData } : null)
      }
      
      console.log('✅ Artículo guardado con imagen y categorías')
    } catch (err) {
      alert('Error al guardar: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!articleId || !confirm('¿Eliminar este artículo permanentemente?')) return
    setDeleting(true)
    try {
      await plannerArticlesService.delete(articleId)
      router.push('/contenido/planner')
    } catch (err) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error desconocido'))
      setDeleting(false)
    }
  }

  const handleSubmit = async () => {
    if (!articleId || !confirm('¿Enviar este artículo para aprobación?')) return
    try {
      const updatedArticle = await plannerArticlesService.submit(articleId)
      // Actualizar estado local sin recargar
      setArticle(updatedArticle)
    } catch (err) {
      alert('Error al enviar: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    }
  }

  const handlePublishToWordPress = async () => {
    if (!activeWebsite?.url || !article) {
      alert('No hay sitio web activo seleccionado')
      return
    }

    const statusText = postStatus === 'publish' ? 'publicar' : 'guardar como borrador'
    if (!window.confirm(`¿${statusText.charAt(0).toUpperCase() + statusText.slice(1)} este artículo en WordPress?`)) return

    // Iniciar progreso
    setPublishProgress(0)
    wordpress.setIsPublishing(true)

    try {
      // Paso 1: Preparando contenido (0-15%)
      setCurrentPublishStep('preparing')
      setPublishProgress(5)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 🔥 Obtener contenido actual del editor
      const editorElement = document.getElementById('wysiwyg-editor')
      const currentEditorContent = editorElement?.innerHTML || editedContent
      const markdownContent = htmlToMarkdown(currentEditorContent)
      
      setPublishProgress(15)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Paso 2: Procesando categorías (15-30%)
      setCurrentPublishStep('categories')
      setPublishProgress(20)
      await new Promise(resolve => setTimeout(resolve, 400))
      setPublishProgress(30)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Paso 3: Procesando etiquetas (30-45%)
      setCurrentPublishStep('tags')
      setPublishProgress(35)
      await new Promise(resolve => setTimeout(resolve, 400))
      setPublishProgress(45)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Paso 4: Configurando imagen (45-60%)
      setCurrentPublishStep('image')
      setPublishProgress(50)
      await new Promise(resolve => setTimeout(resolve, 400))
      setPublishProgress(60)
      await new Promise(resolve => setTimeout(resolve, 300))
      // Paso 5: Publicando todos los idiomas en WordPress (60-90%)
      setCurrentPublishStep('publishing')
      setPublishProgress(60)
      
      // Obtener todos los idiomas disponibles
      const availableLanguages = article.available_languages || [article.language || 'es']
      console.log('🌍 Publicando todos los idiomas:', availableLanguages)
      
      const credentials = {
        siteUrl: activeWebsite.url,
        username: 'arturo',
        applicationPassword: 'zgHS Nmvp qnF9 0F70 Aw5s Jnir'
      }
      
      // Mapa para relacionar traducciones en WordPress
      const publishedPosts: { [langCode: string]: number } = {}
      
      // Calcular progreso por idioma (60-90%)
      const progressPerLanguage = 30 / availableLanguages.length
      let currentProgressValue = 60
      
      // Resultados de publicación
      const publishResults: Array<{ lang: string; success: boolean; postId?: number; error?: string }> = []
      
      // Publicar en cada idioma SECUENCIALMENTE
      for (let i = 0; i < availableLanguages.length; i++) {
        const langCode = availableLanguages[i]
        const isMainLanguage = langCode === (article.language || 'es')
        
        try {
          console.log(`\n📝 [${i + 1}/${availableLanguages.length}] Publicando en ${langCode.toUpperCase()}...`)
          setCurrentPublishStep(`publishing-${langCode}`)
          
          // Esperar un poco entre publicaciones para no saturar
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 800))
          }
          
          // Cargar datos del idioma
          let langData: any
          let langContent: string
          
          if (isMainLanguage) {
            langData = article
            langContent = markdownContent
          } else {
            // Cargar traducción desde la BD
            try {
              const translation = await plannerArticlesService.getTranslation(articleId!, langCode)
              
              console.log(`📋 Traducción ${langCode.toUpperCase()} cargada desde BD:`, {
                title: translation.title,
                h1: translation.h1_title,
                keyword: translation.keyword,
                contentLength: translation.content?.length || 0,
                contentPreview: translation.content?.substring(0, 100)
              })
              
              langData = {
                title: translation.title,
                h1_title: translation.h1_title,
                meta_description: translation.meta_description,
                keyword: translation.keyword
              }
              langContent = translation.content
            } catch (loadError: any) {
              console.error(`❌ Error cargando traducción ${langCode}:`, loadError)
              publishResults.push({ lang: langCode, success: false, error: 'No se pudo cargar la traducción' })
              continue // Saltar al siguiente idioma
            }
          }
          
          // Preparar datos para WordPress
          const publishData = {
            title: langData.title,
            h1Title: langData.h1_title || langData.title,
            content: langContent,
            metaDescription: langData.meta_description || '',
            focusKeyword: langData.keyword,
            categories: wordpress.wpCategories,
            tags: wordpress.wpTags,
            featuredImageUrl: wordpress.wpFeaturedImage,
            featuredImageId: wordpress.wpFeaturedImageId || undefined,
            language: langCode,
            translations: Object.keys(publishedPosts).length > 0 ? publishedPosts : undefined,
            status: postStatus
          }
          
          console.log(`🚀 Publicando ${langCode.toUpperCase()}:`, {
            title: publishData.title,
            h1Title: publishData.h1Title,
            language: publishData.language,
            focusKeyword: publishData.focusKeyword,
            contentLength: publishData.content?.length || 0,
            contentPreview: publishData.content?.substring(0, 150),
            linkedWith: publishData.translations
          })
          
          // VERIFICACIÓN: Asegurar que el idioma del contenido coincide con el langCode
          if (langCode !== 'es' && publishData.content?.toLowerCase().includes('descubre')) {
            console.warn(`⚠️ ADVERTENCIA: El contenido parece estar en ESPAÑOL pero se está publicando como ${langCode.toUpperCase()}`)
            console.warn(`   Título: ${publishData.title}`)
            console.warn(`   Preview: ${publishData.content?.substring(0, 200)}`)
          }
          
          // Publicar en WordPress con progreso en tiempo real
          const result = await publishToWordPress(
            publishData, 
            credentials,
            // 📊 Callback de progreso
            (step, progress, message) => {
              console.log(`📊 [${langCode.toUpperCase()}] ${step}: ${progress}% - ${message}`)
              setCurrentPublishStep(`${step}-${langCode}`)
              
              // Calcular progreso global considerando el idioma actual
              const baseProgress = currentProgressValue
              const stepProgress = (progress / 100) * progressPerLanguage
              setPublishProgress(Math.round(baseProgress + stepProgress))
            }
          )
          
          if (result.success && result.postId) {
            publishedPosts[langCode] = result.postId
            console.log(`✅ ${langCode.toUpperCase()} publicado - Post ID: ${result.postId}`)
            
            // Actualizar base de datos con wordpress_post_id, imagen y categorías
            try {
              // Convertir categorías a formato de BD
              const categoriesForDB = wordpress.availableCategories
                .filter(cat => wordpress.wpCategories.includes(cat.name))
                .map(cat => ({
                  id: cat.id,
                  name: cat.name,
                  slug: cat.slug
                }))
              
              if (isMainLanguage) {
                await plannerArticlesService.update(articleId!, {
                  wordpress_post_id: result.postId,
                  status: postStatus === 'publish' ? 'published' : 'pending',
                  featured_image_url: wordpress.wpFeaturedImage || undefined,
                  wordpress_categories: categoriesForDB.length > 0 ? categoriesForDB : undefined,
                  wordpress_status: postStatus
                })
              } else {
                await plannerArticlesService.updateTranslation(articleId!, langCode, {
                  wordpress_post_id: result.postId,
                  featured_image_url: wordpress.wpFeaturedImage || undefined,
                  wordpress_categories: categoriesForDB.length > 0 ? categoriesForDB : undefined,
                  wordpress_status: postStatus
                })
              }
              
              publishResults.push({ lang: langCode, success: true, postId: result.postId })
              
              // Guardar URL del primer post para mostrar
              if (i === 0) {
                setPublishedPostId(result.postId)
                setPublishedPostUrl(result.postUrl)
              }
            } catch (updateError: any) {
              console.error(`⚠️ Post ${langCode} publicado pero no se actualizó BD:`, updateError.message)
              publishResults.push({ lang: langCode, success: true, postId: result.postId, error: 'BD no actualizada' })
            }
          } else {
            console.error(`❌ Error publicando ${langCode}:`, result.error)
            publishResults.push({ lang: langCode, success: false, error: result.error })
          }
        } catch (langError: any) {
          console.error(`❌ Error general publicando ${langCode}:`, langError)
          publishResults.push({ lang: langCode, success: false, error: langError.message })
        }
        
        // Actualizar progreso
        currentProgressValue += progressPerLanguage
        setPublishProgress(Math.round(currentProgressValue))
      }

      // Paso 6: Completado (90-100%)
      setCurrentPublishStep('completed')
      setPublishProgress(95)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mostrar resumen
      const successCount = publishResults.filter(r => r.success).length
      const failCount = publishResults.filter(r => !r.success).length
      
      console.log('\n📊 Resumen de publicación:')
      console.log(`✅ Exitosos: ${successCount}`)
      console.log(`❌ Fallidos: ${failCount}`)
      publishResults.forEach(r => {
        if (r.success) {
          console.log(`  ✅ ${r.lang.toUpperCase()} - Post ID: ${r.postId}`)
        } else {
          console.log(`  ❌ ${r.lang.toUpperCase()} - Error: ${r.error}`)
        }
      })
      
      setPublishProgress(100)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Limpiar progreso
      setPublishProgress(0)
      setCurrentPublishStep('')
      
      // Mostrar resumen al usuario
      if (failCount > 0) {
        const failedLangs = publishResults.filter(r => !r.success).map(r => r.lang.toUpperCase()).join(', ')
        alert(`⚠️ Publicación parcial:\n\n✅ ${successCount} idioma(s) publicado(s)\n❌ ${failCount} idioma(s) fallido(s): ${failedLangs}\n\nRevisa la consola para más detalles.`)
      }
      
    } catch (error: any) {
      setPublishProgress(0)
      setCurrentPublishStep('')
      alert('Error al publicar: ' + error.message)
    } finally {
      wordpress.setIsPublishing(false)
      setPublishProgress(0)
      setCurrentPublishStep('')
    }
  }

  const handleTranslate = async (targetLangCode: string) => {
    if (!article || !articleId) return
    
    const targetLanguage = languagesHook.languages.find((l: any) => l.code === targetLangCode)
    if (!targetLanguage) return
    
    // Verificar si ya existe traducción
    if (article.available_languages?.includes(targetLangCode)) {
      alert(`Ya existe una traducción para ${targetLanguage.name}. Usa el selector para cambiar de idioma.`)
      return
    }
    
    if (!confirm(`¿Traducir este artículo a ${targetLanguage.name}?\n\n✨ Verás el contenido traducirse en TIEMPO REAL mientras la IA trabaja.\n\nSe creará una traducción vinculada a este artículo.`)) return
    
    setShowLanguageMenu(false)
    setTranslating(true)
    setTranslationProgress(0)
    setTargetLanguageName(targetLanguage.name)
    
    try {
      // Paso 1: Preparando y guardando artículo original (0-20%)
      setCurrentTranslationStep('preparing')
      setTranslationProgress(5)
      
      // 🔥 OBTENER EL CONTENIDO ACTUAL DEL EDITOR (incluyendo imágenes recién añadidas)
      const editorElement = document.getElementById('wysiwyg-editor')
      const currentEditorContent = editorElement?.innerHTML || editedContent
      const markdownWithImages = htmlToMarkdown(currentEditorContent)
      
      // 💾 GUARDAR EL CONTENIDO ACTUALIZADO EN EL ARTÍCULO ORIGINAL (con imágenes)
      setTranslationProgress(10)
      console.log('💾 Guardando contenido actualizado del artículo original...')
      await plannerArticlesService.update(articleId, { content: markdownWithImages })
      
      setTranslationProgress(15)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const translationData = {
        title: article.title,
        h1Title: article.h1_title || article.title,
        description: article.meta_description || '',
        keyword: article.keyword,
        objectivePhrase: article.objective_phrase || '',
        keywords: article.keywords_array || [],
        content: markdownWithImages
      }
      
      setTranslationProgress(20)
      setCurrentTranslationStep('translating-content')
      
      // 🔥 TRADUCIR CON STREAMING EN TIEMPO REAL
      let accumulatedTranslation = ''
      let streamingProgress = 20
      
      const translated = await translatorService.translateWithStreaming(
        translationData,
        targetLangCode,
        targetLanguage.name,
        // Callback que se llama con cada chunk de traducción
        (chunk, accumulated) => {
          accumulatedTranslation = accumulated
          
          // Actualizar progreso conforme avanza el streaming (20% a 80%)
          const progress = Math.min(80, 20 + (accumulated.length / markdownWithImages.length) * 60)
          streamingProgress = progress
          setTranslationProgress(Math.round(progress))
          
          // Extraer solo el contenido traducido del formato
          const contentMatch = accumulated.match(/CONTENT:\n([\s\S]+)/)
          if (contentMatch && contentMatch[1]) {
            const translatedMarkdown = contentMatch[1]
            
            // ✍️ EFECTO DE ESCRITURA: Actualizar cada 100ms para efecto typewriter visible
            const now = Date.now()
            if (now - lastUpdateTime >= 100) {
              setLastUpdateTime(now)
              
              // Actualizar editor con efecto de escritura
              const htmlContent = markdownToHtml(translatedMarkdown)
              setEditedContent(htmlContent)
              // El auto-scroll y efecto typewriter se manejan en WysiwygEditor
              
              console.log(`🌐 Traducción chunk: +${chunk.length} chars | Total: ${accumulated.length}`)
            }
          }
        }
      )
      
      // 🔥 Actualización FINAL forzada con el contenido completo
      const finalContentMatch = accumulatedTranslation.match(/CONTENT:\n([\s\S]+)/)
      if (finalContentMatch && finalContentMatch[1]) {
        const finalHtmlContent = markdownToHtml(finalContentMatch[1])
        setEditedContent(finalHtmlContent)
      }
      
      setTranslationProgress(80)
      
      // 🔍 VALIDACIÓN FINAL antes de guardar
      console.log('🔍 Validación final antes de guardar traducción:')
      console.log('  Idioma original:', article.language || 'es')
      console.log('  Idioma destino:', targetLangCode)
      console.log('  Título original:', article.title)
      console.log('  Título traducido:', translated.title)
      console.log('  Contenido original (primeros 100 chars):', markdownWithImages.substring(0, 100))
      console.log('  Contenido traducido (primeros 100 chars):', translated.content.substring(0, 100))
      
      // ⚠️ VALIDAR que el contenido NO sea el mismo
      if (translated.content === markdownWithImages) {
        throw new Error('❌ ERROR: La traducción es idéntica al original. No se guardará.')
      }
      
      // ⚠️ VALIDAR que el contenido traducido no esté en español si se tradujo a otro idioma
      if (targetLangCode !== 'es') {
        const spanishWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'en', 'que', 'descubre', 'artículo']
        const contentLower = translated.content.toLowerCase()
        const spanishWordCount = spanishWords.filter(word => contentLower.includes(word)).length
        
        if (spanishWordCount > 5) {
          console.warn(`⚠️ ADVERTENCIA: El contenido traducido parece contener ${spanishWordCount} palabras en español`)
          console.warn('Preview del contenido:', translated.content.substring(0, 300))
        }
      }
      
      console.log('✅ Validación pasada, guardando traducción...')
      
      // Paso 4: Guardando (80-100%)
      setCurrentTranslationStep('saving')
      setTranslationProgress(85)
      
      await plannerArticlesService.createTranslation(articleId, {
        language: targetLangCode,
        title: translated.title,
        h1_title: translated.h1Title,
        meta_description: translated.description,
        keyword: translated.keyword,
        objective_phrase: translated.objectivePhrase,
        keywords_array: translated.keywords,
        content: translated.content  // ✅ Contenido ya validado
      })
      
      setTranslationProgress(95)
      setCurrentTranslationStep('loading-translation')
      
      // 🔥 CAMBIAR AUTOMÁTICAMENTE AL IDIOMA DE LA TRADUCCIÓN RECIÉN CREADA
      // NO recargar todo el artículo, solo cambiar de idioma
      await loadArticle() // Solo para actualizar available_languages
      
      setTranslationProgress(100)
      setCurrentTranslationStep('completed')
      
      // Esperar un momento para que el usuario vea el progreso completado
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Cambiar automáticamente al idioma traducido
      if (handleLanguageChange) {
        await handleLanguageChange(targetLangCode)
      }
      
      // Esperar un poco antes de limpiar la barra de progreso
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTranslationProgress(0)
      setCurrentTranslationStep('')
      
    } catch (error: any) {
      console.error('Error traduciendo:', error)
      setTranslationProgress(0)
      setCurrentTranslationStep('')
      
      // Mostrar error específico
      const errorMessage = error.message || 'Error desconocido'
      alert(`❌ Error al traducir:\n\n${errorMessage}\n\nPor favor, verifica:\n- Tu conexión a internet\n- API key de Gemini configurada\n- Límite de cuota no excedido`)
    } finally {
      setTranslating(false)
    }
  }

  const handleDeleteTranslation = async () => {
    if (!article || !articleId) return
    
    const isTranslation = currentLanguage !== (article.language || 'es')
    if (!isTranslation) {
      alert('No puedes eliminar el idioma principal')
      return
    }
    
    if (!confirm(`¿Eliminar la traducción en ${currentLanguage.toUpperCase()}?\n\nEsta acción no se puede deshacer.`)) return
    
    setDeleting(true)
    try {
      await plannerArticlesService.deleteTranslation(articleId, currentLanguage)
      
      // Actualizar available_languages localmente
      setArticle(prev => prev ? {
        ...prev,
        available_languages: prev.available_languages?.filter(lang => lang !== currentLanguage)
      } : null)
      
      // Cambiar al idioma principal después de eliminar
      setCurrentLanguage(article.language || 'es')
      setCurrentTranslationData(null)
      
      // Recargar contenido del idioma principal
      const htmlContent = markdownToHtml(article.content || '')
      setEditedContent(htmlContent)
      setEditorKey(prev => prev + 1)
      
      alert('✅ Traducción eliminada correctamente')
    } catch (err) {
      alert('Error al eliminar traducción: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setDeleting(false)
    }
  }

  const handleHumanize = async () => {
    if (!article || !articleId) return
    
    if (!confirm('¿Humanizar el contenido generado por IA?\n\nVerás el contenido humanizándose en TIEMPO REAL mientras la IA trabaja.')) return
    
    setHumanizing(true)
    setHumanizeProgress(0)
    setCurrentHumanizeStep('Preparando contenido...')
    
    try {
      // Obtener contenido actual del editor
      const editorElement = document.getElementById('wysiwyg-editor')
      const currentEditorContent = editorElement?.innerHTML || editedContent
      const markdownContent = htmlToMarkdown(currentEditorContent)
      
      setHumanizeProgress(10)
      setCurrentHumanizeStep('Analizando patrones de IA...')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setHumanizeProgress(20)
      setCurrentHumanizeStep('Humanizando y optimizando contenido con IA...')
      
      // Determinar tono según el contexto
      const tone = article.meta_description?.includes('profesional') ? 'professional' : 'friendly'
      
      // 🚀 HUMANIZAR Y OPTIMIZAR - TODO EN UNO CON STREAMING
      let updateCount = 0
      
      const result = await humanizerService.humanizeAndOptimize(
        markdownContent,
        displayArticle.keyword || '',
        displayArticle.title || '',
        // Callback de progreso
        (step, progress) => {
          setCurrentHumanizeStep(step)
          // Asegurar que el progreso esté entre 0-100 y sea entero
          const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)))
          setHumanizeProgress(clampedProgress)
        },
        // 🔥 Callback de STREAMING - Mostrar contenido en tiempo real
        (chunk, accumulated) => {
          updateCount++
          
          // 🔥 Convertir markdown a HTML
          const htmlContent = markdownToHtml(accumulated)
          
          // 🔥 FORZAR ACTUALIZACIÓN INMEDIATA (sin batching de React)
          flushSync(() => {
            setEditedContent(htmlContent)
          })
          
          // Log cada 10 actualizaciones para no saturar la consola
          if (updateCount % 10 === 0) {
            console.log(`📝 Stream update #${updateCount}: +${chunk.length} chars | Total: ${accumulated.length} chars`)
          }
        },
        // Opciones
        {
          tone: tone,
          targetAudience: 'viajeros y amantes de la naturaleza'
        }
      )
      
      console.log(`✅ Streaming completado. Total de actualizaciones: ${updateCount}`)
      
      // 🔥 Actualización FINAL forzada con el contenido completo
      const finalHtmlContent = markdownToHtml(result.content)
      setEditedContent(finalHtmlContent)
      
      setHumanizeProgress(85)
      setCurrentHumanizeStep('Guardando cambios...')
      
      // Verificar si estamos humanizando traducción o original
      const isTranslation = currentLanguage !== (article.language || 'es')
      
      if (isTranslation) {
        // Guardar traducción humanizada
        const updatedTranslation = await plannerArticlesService.updateTranslation(articleId, currentLanguage, {
          content: result.content
        })
        
        setCurrentTranslationData({
          ...currentTranslationData,
          content: updatedTranslation.content
        })
      } else {
        // Guardar artículo original humanizado
        const updatedArticle = await plannerArticlesService.update(articleId, { 
          content: result.content 
        })
        setArticle(updatedArticle)
      }
      
      setHumanizeProgress(100)
      setCurrentHumanizeStep('¡Contenido humanizado y optimizado!')
      
      // Mostrar mejoras aplicadas
      setTimeout(() => {
        const seoInfo = result.seoIssuesFixed 
          ? `\n\n🔍 Problemas SEO corregidos: ${result.seoIssuesFixed}`
          : ''
        
        const improvementsText = result.improvements.length > 0 
          ? `\n\nMejoras aplicadas:\n${result.improvements.map(i => `✓ ${i}`).join('\n')}`
          : ''
        
        alert(`✅ ¡Contenido humanizado y optimizado!${seoInfo}${improvementsText}\n\nOriginal: ${result.originalLength} caracteres\nOptimizado: ${result.humanizedLength} caracteres`)
        
        // Resetear TODOS los estados
        setHumanizing(false)
        setHumanizeProgress(0)
        setCurrentHumanizeStep('')
        setEditorKey(prev => prev + 1) // Forzar re-render para mostrar negritas
      }, 1500)
      
    } catch (error: any) {
      console.error('Error humanizando:', error)
      // Asegurar reset de estados en caso de error
      setHumanizing(false)
      setHumanizeProgress(0)
      setCurrentHumanizeStep('')
      alert(`❌ Error al humanizar contenido:\n\n${error.message || 'Error desconocido'}`)
    } finally {
      // Backup: asegurar que el estado se desactive
      setTimeout(() => {
        setHumanizing(false)
      }, 100)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: '#009689' }} />
          <p className="text-base font-semibold" style={{ color: '#2b2b40' }}>Cargando artículo...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Artículo no encontrado'}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ArticleHeader
        article={article}
        saving={saving}
        deleting={deleting}
        humanizing={humanizing}
        currentLanguage={currentLanguage}
        loadingTranslation={loadingTranslation}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        showLanguageMenu={showLanguageMenu}
        setShowLanguageMenu={setShowLanguageMenu}
        languagesHook={languagesHook}
        onTranslate={handleTranslate}
        onLanguageChange={handleLanguageChange}
        onGooglePreview={() => setShowGooglePreview(true)}
        onDeleteTranslation={handleDeleteTranslation}
        onHumanize={handleHumanize}
      />

      <div className="flex h-[calc(100vh-60px)]">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-5xl mx-auto">
              <WysiwygEditor
                key={editorKey}
                initialContent={editedContent}
                onChange={setEditedContent}
                showImagePicker={true}
              />
            </div>
          </div>
        </div>

        <div className="w-96 border-l-2 border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <div className="flex mb-6 bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setActiveTab('analytics')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all border-r-2 border-gray-200"
                style={{
                  backgroundColor: activeTab === 'analytics' ? '#009689' : '#ffffff',
                  color: activeTab === 'analytics' ? '#ffffff' : '#2b2b40'
                }}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all border-r-2 border-gray-200"
                style={{
                  backgroundColor: activeTab === 'seo' ? '#009689' : '#ffffff',
                  color: activeTab === 'seo' ? '#ffffff' : '#2b2b40'
                }}
              >
                <Target className="h-4 w-4" />
                SEO
              </button>
              <button
                onClick={() => setActiveTab('wordpress')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all"
                style={{
                  backgroundColor: activeTab === 'wordpress' ? '#009689' : '#ffffff',
                  color: activeTab === 'wordpress' ? '#ffffff' : '#2b2b40'
                }}
              >
                <FileText className="h-4 w-4" />
                WordPress
              </button>
            </div>

            {activeTab === 'analytics' && (
              <AnalyticsTab
                article={displayArticle}
                editedContent={htmlToMarkdown(editedContent)}
                onContentUpdate={(newContent) => {
                  const htmlContent = markdownToHtml(newContent)
                  setEditedContent(htmlContent)
                  setEditorKey(prev => prev + 1)
                }}
              />
            )}

            {activeTab === 'seo' && (
              <SEOTab
                article={displayArticle}
                editedContent={htmlToMarkdown(editedContent)}
              />
            )}

            {activeTab === 'wordpress' && activeWebsite && (
              <WordPressTab
                activeWebsite={activeWebsite}
                article={displayArticle}
                wordpress={wordpress}
                postStatus={postStatus}
                setPostStatus={setPostStatus}
                onPublish={handlePublishToWordPress}
              />
            )}
          </div>
        </div>
      </div>

      {/* Google Preview Modal */}
      <GooglePreview
        isOpen={showGooglePreview}
        onClose={() => setShowGooglePreview(false)}
        title={displayArticle.title}
        metaDescription={displayArticle.meta_description || ''}
        keyword={displayArticle.keyword}
        websiteUrl={activeWebsite?.url?.replace(/^https?:\/\//, '') || 'www.ejemplo.com'}
      />

      {/* Indicadores de Progreso Circulares - Esquina inferior derecha */}
      
      {/* Progreso circular para TRADUCCIÓN */}
      <CircularProgress
        isActive={translating}
        type="translating"
        progress={translationProgress}
        currentStep={currentTranslationStep}
        targetLanguage={targetLanguageName}
      />

      {/* Progreso circular para HUMANIZACIÓN */}
      <CircularProgress
        isActive={humanizing}
        type="humanizing"
        progress={humanizeProgress}
        currentStep={currentHumanizeStep}
      />

      {/* Progreso circular para PUBLICACIÓN EN WORDPRESS */}
      <CircularProgress
        isActive={publishProgress > 0 && publishProgress < 100}
        type="publishing"
        progress={publishProgress}
        currentStep={currentPublishStep}
      />
    </div>
  )
}
