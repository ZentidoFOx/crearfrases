"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle, BarChart3, Target, FileText, RefreshCw } from 'lucide-react'
import { CircularProgress } from '@/components/ui/circular-progress'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { plannerArticlesService, type PlannerArticle } from '@/lib/api/planner-articles'
import { aiModelsService } from '@/lib/api/ai-models'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { useOptimization } from '@/components/contenido/planner/parts/step3/hooks/useOptimization'
import { useWordPress } from '@/components/contenido/planner/parts/step3/hooks/useWordPress'
import { useLanguages } from '@/components/contenido/planner/parts/step3/hooks/useLanguages'
import { useWebsite } from '@/contexts/website-context'
import { publishToWordPress } from '@/lib/api/wordpress-publisher'
import { translatorService } from '@/lib/api/translator'
import { humanizeContentService } from '@/lib/api/humanize-content'
// Removido: import { optimizeReadability } from '@/lib/api/readability-optimizer' - Ahora usamos completeOptimizerService
import { completeOptimizerService, type OptimizationResult } from '@/lib/api/complete-optimizer'
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
  const [publishedPostUrl, setPublishedPostUrl] = useState<string>()
  const [showGooglePreview, setShowGooglePreview] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<string>('es')
  const [loadingTranslation, setLoadingTranslation] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [currentTranslationStep, setCurrentTranslationStep] = useState('')
  const [isStreamingTranslation, setIsStreamingTranslation] = useState(false)
  const [humanizing, setHumanizing] = useState(false)
  const [humanizeProgress, setHumanizeProgress] = useState(0)
  const [currentHumanizeStep, setCurrentHumanizeStep] = useState('')
  const [isStreamingHumanize, setIsStreamingHumanize] = useState(false)
  const [optimizingReadability, setOptimizingReadability] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  const [currentTranslationData, setCurrentTranslationData] = useState<any>(null)
  const [targetLanguageName, setTargetLanguageName] = useState<string>('')
  const [selectedHumanizeModelId, setSelectedHumanizeModelId] = useState<number | null>(null)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [publishedPostId, setPublishedPostId] = useState<number>()
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

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
    loadModels()
  }, [])

  useEffect(() => {
    if (article?.content) {
      // El contenido ya viene en HTML desde el backend
      console.log('📄 Cargando contenido del artículo (HTML)')
      setEditedContent(article.content)
      setEditorKey(prev => prev + 1) // Forzar re-render del editor
    }
  }, [article?.content, articleId]) // Agregar articleId como dependencia para re-renderizar al cambiar de artículo

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
      
      // El contenido ya viene en HTML desde el backend
      setEditedContent(data.content || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el artículo')
    } finally {
      setLoading(false)
    }
  }

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const models = await aiModelsService.getActiveModels()
      setAvailableModels(models)
      
      // Seleccionar el primer modelo activo automáticamente
      if (models.length > 0 && !selectedHumanizeModelId) {
        setSelectedHumanizeModelId(models[0].id)
      }
    } catch (err) {
      console.error('Error loading models:', err)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleLanguageChange = async (langCode: string) => {
    if (!article || !articleId) return
    
    const originalLanguage = article.language || 'es'
    
    console.log('🌍 [LANGUAGE] Cambiando idioma:')
    console.log('  - Idioma original:', originalLanguage)
    console.log('  - Idioma solicitado:', langCode)
    console.log('  - Idiomas disponibles:', article.available_languages)
    
    // Si es el idioma principal, mostrar contenido del artículo original
    if (langCode === originalLanguage) {
      console.log('✅ [LANGUAGE] Mostrando artículo ORIGINAL')
      setCurrentLanguage(langCode)
      setCurrentTranslationData(null) // Limpiar datos de traducción
      setEditedContent(article.content || '')
      setEditorKey(prev => prev + 1)
      return
    }
    
    // 🛡️ PROTECCIÓN: Verificar que la traducción existe
    if (!article.available_languages?.includes(langCode)) {
      alert(`⛔ Error: No existe traducción para el idioma ${langCode}. Por favor, crea la traducción primero.`)
      console.error(`❌ [LANGUAGE] Traducción no encontrada para: ${langCode}`)
      return
    }
    
    // Si es una traducción, cargarla
    console.log('📥 [LANGUAGE] Cargando TRADUCCIÓN:', langCode)
    setLoadingTranslation(true)
    try {
      const translation = await plannerArticlesService.getTranslation(articleId, langCode)
      setCurrentLanguage(langCode)
      
      console.log('✅ [LANGUAGE] Traducción cargada correctamente:', {
        language: translation.language,
        title: translation.title?.substring(0, 50),
        contentLength: translation.content?.length
      })
      
      // Crear objeto con datos de la traducción para mostrar en el UI
      // 🔥 PRIORIZAR seo_data para campos traducidos
      setCurrentTranslationData({
        ...article,
        title: translation.title,
        h1_title: translation.h1_title,
        keyword: translation.seo_data?.focus_keyword || translation.keyword,
        objective_phrase: translation.objective_phrase,
        keywords_array: translation.keywords_array,
        meta_description: translation.seo_data?.meta_description || translation.meta_description,
        slug: translation.seo_data?.slug || translation.slug,
        content: translation.content,
        seo_data: translation.seo_data,
        word_count: translation.word_count,
        language: translation.language
      })
      
      setEditedContent(translation.content || '')
      setEditorKey(prev => prev + 1)
    } catch (error: any) {
      console.error('❌ [LANGUAGE] Error al cargar traducción:', error)
      alert(`Error al cargar traducción: ${error.message}`)
    } finally {
      setLoadingTranslation(false)
    }
  }

  const handleSave = async () => {
    if (!articleId || !article) return
    
    // 🛡️ PROTECCIÓN: Verificar que estamos en el idioma correcto
    const originalLanguage = article.language || 'es'
    const isTranslation = currentLanguage !== originalLanguage
    
    console.log('💾 [SAVE] Guardando artículo:')
    console.log('  - Idioma original del artículo:', originalLanguage)
    console.log('  - Idioma actual seleccionado:', currentLanguage)
    console.log('  - Es traducción:', isTranslation)
    
    setSaving(true)
    try {
      // 🔥 Obtener contenido actual del editor (ya es HTML)
      const htmlContent = editedContent
      
      // 🔥 Preparar datos de WordPress para guardar
      const wpData: any = {
        content: htmlContent
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
      
      // 🛡️ PROTECCIÓN ADICIONAL: Doble verificación antes de guardar
      if (isTranslation) {
        console.log(`💾 [SAVE] Guardando TRADUCCIÓN en idioma: ${currentLanguage}`)
        
        // Verificar que la traducción existe
        if (!article.available_languages?.includes(currentLanguage)) {
          throw new Error(`⛔ ERROR: No existe traducción para el idioma ${currentLanguage}. Crea la traducción primero.`)
        }
        
        // Guardar traducción con imagen y categorías
        await plannerArticlesService.updateTranslation(articleId, currentLanguage, wpData)
        console.log(`✅ [SAVE] Traducción ${currentLanguage} guardada correctamente`)
        
        // Actualizar el estado local sin recargar
        if (currentTranslationData) {
          setCurrentTranslationData({
            ...currentTranslationData,
            ...wpData
          })
        }
      } else {
        console.log(`💾 [SAVE] Guardando ARTÍCULO ORIGINAL en idioma: ${originalLanguage}`)
        
        // 🛡️ PROTECCIÓN: Solo guardar si realmente estamos en el idioma original
        if (currentLanguage !== originalLanguage) {
          throw new Error(`⛔ ERROR CRÍTICO: Intentando guardar en artículo original pero el idioma actual es ${currentLanguage} y el original es ${originalLanguage}. Operación cancelada.`)
        }
        
        // Guardar artículo original con imagen y categorías
        await plannerArticlesService.update(articleId, wpData)
        console.log(`✅ [SAVE] Artículo original (${originalLanguage}) guardado correctamente`)
        
        // Actualizar el estado local sin recargar
        setArticle(prev => prev ? { ...prev, ...wpData } : null)
      }
      
      console.log('✅ [SAVE] Guardado completado exitosamente')
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
      
      // 🔥 Obtener contenido actual del editor (ya es HTML)
      const htmlContent = editedContent
      
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
        username: 'ruben',
        applicationPassword: 'VUN3 Dy9I NU5Y PQcP TbJS h8nC'
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
            // 🔥 CRÍTICO: Si estamos viendo una traducción, NO usar editedContent
            // Siempre cargar el contenido original del artículo para el idioma principal
            const isViewingTranslation = currentLanguage !== (article.language || 'es')
            
            langData = article
            langContent = isViewingTranslation ? article.content : htmlContent
            
            console.log(`📋 Idioma principal ${langCode.toUpperCase()}:`, {
              viewingTranslation: isViewingTranslation,
              usingContentFrom: isViewingTranslation ? 'article.content (BD)' : 'htmlContent (editor)',
              contentLength: langContent?.length || 0
            })
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
    
    if (!confirm(`¿Traducir este artículo a ${targetLanguage.name}?\n\nSe creará una traducción completa del artículo.`)) return
    
    setShowLanguageMenu(false)
    setTranslating(true)
    setTranslationProgress(0)
    setTargetLanguageName(targetLanguage.name)
    
    try {
      setCurrentTranslationStep('preparing')
      setTranslationProgress(10)
      
      const htmlContent = editedContent
      
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('No hay contenido para traducir')
      }
      
      console.log('🚀 [TRANSLATE] Iniciando traducción en 2 PASOS')
      
      setCurrentTranslationStep('translating-seo')  // PASO 1: Campos SEO
      setTranslationProgress(10)
      
      const translationData = {
        title: article.title,
        seoTitle: article.seo_title || article.title,
        h1Title: article.h1_title || article.title,
        keyword: article.keyword,
        objectivePhrase: article.objective_phrase || '',
        keywords: article.keywords_array || [],
        relatedKeywords: article.related_keywords || [],
        slug: article.slug || '',
        description: article.meta_description || '',
        content: htmlContent
      }
      
      let translated: any
      let accumulatedTranslation = ''
      let usedStreaming = false
      
      try {
        // 🔥 PASO 2: Traducir contenido con STREAMING
        setCurrentTranslationStep('translating-content')  // PASO 2: Contenido
        setTranslationProgress(20)
        setIsStreamingTranslation(true) // ← Activar modo streaming (efecto typewriter)
        
        const translatedData = await translatorService.translateWithStreaming(
          translationData,
          targetLangCode,
          targetLanguage.name,
          (chunk, accumulated) => {
            accumulatedTranslation = accumulated
            usedStreaming = true
            
            // Actualizar progreso (20% a 75%)
            const progress = Math.min(75, 20 + (accumulated.length / htmlContent.length) * 55)
            setTranslationProgress(Math.round(progress))
            
            // 🔥 NUEVO: En el sistema de 2 pasos, accumulated ES directamente el HTML traducido
            // Actualizar editor con efecto typewriter en tiempo real
            if (accumulated && accumulated.length > 50) {
              setEditedContent(accumulated)
              console.log('📝 [STREAMING] Actualizando editor:', accumulated.length, 'chars')
            }
          },
          {
            modelId: selectedHumanizeModelId || 1,
            onFallbackToNormal: () => {
              console.log('⚠️ [TRANSLATE] Fallback a modo sin streaming - Mostrando skeleton')
              setIsStreamingTranslation(false) // Desactivar streaming, mostrar skeleton
            }
          }
        )
        
        translated = {
          title: translatedData.title,
          seoTitle: translatedData.seoTitle,
          h1Title: translatedData.h1Title,
          keyword: translatedData.keyword,
          objectivePhrase: translatedData.objectivePhrase,
          keywords: translatedData.keywords,
          relatedKeywords: translatedData.relatedKeywords,
          slug: translatedData.slug,
          description: translatedData.description,
          content: translatedData.content
        }
        
        console.log('✅ [TRANSLATE] Traducción con streaming completada')
        console.log('🔍 [TRANSLATE] Datos recibidos de la IA:', {
          keyword_original: article.keyword,
          keyword_traducido: translatedData.keyword,
          title_traducido: translatedData.title?.substring(0, 50),
          seoTitle_traducido: translatedData.seoTitle?.substring(0, 50),
          slug_traducido: translatedData.slug
        })
        
      } catch (streamError: any) {
        // Solo hacer fallback si es error de conexión, NO si es error de validación
        const isConnectionError = streamError.message?.includes('fetch') || 
                                   streamError.message?.includes('network') ||
                                   streamError.message?.includes('conexión')
        
        const isValidationError = streamError.message?.includes('keyword') ||
                                   streamError.message?.includes('Focus Keyword')
        
        if (isValidationError) {
          // Si es error de validación, propagar el error SIN fallback
          console.error('❌ [TRANSLATE] Error de validación, NO hacer fallback:', streamError.message)
          throw streamError
        }
        
        if (isConnectionError) {
          console.log('⚠️ [TRANSLATE] Error de conexión, usando método simple...', streamError)
          
          // 🔄 FALLBACK: Usar método simple sin streaming
          setIsStreamingTranslation(false)
          setTranslationProgress(30)
          
          translated = await translatorService.translateArticleSimple(
            article.title,
            article.keyword,
            htmlContent,
            targetLangCode,
            targetLanguage.name,
            selectedHumanizeModelId || 1
          )
          
          console.log('✅ [TRANSLATE] Traducción simple completada')
        } else {
          // Otro tipo de error, propagar
          throw streamError
        }
      }
      
      setTranslationProgress(80)
      
      console.log('📊 [TRANSLATE] Resultado final:', {
        title: translated.title,
        keyword: translated.keyword,
        contentLength: translated.content.length,
        usedStreaming
      })
      
      // Validar
      if (!translated.title || !translated.keyword || !translated.content) {
        throw new Error('Traducción incompleta')
      }
      
      setCurrentTranslationStep('saving')
      setTranslationProgress(90)
      
      // Validar que el keyword traducido no esté vacío
      if (!translated.keyword || translated.keyword.trim() === '') {
        console.error('❌ [TRANSLATE] ERROR: Keyword traducido está vacío')
        throw new Error('La traducción no incluyó el Focus Keyword. Por favor, intenta de nuevo.')
      }
      
      // Validar que el keyword aparezca en los campos clave
      const lowerKeyword = translated.keyword.toLowerCase()
      const lowerTitle = translated.title?.toLowerCase() || ''
      const lowerSeoTitle = translated.seoTitle?.toLowerCase() || ''
      const lowerH1 = translated.h1Title?.toLowerCase() || ''
      const lowerDescription = translated.description?.toLowerCase() || ''
      const lowerContent = translated.content?.toLowerCase() || ''
      
      const keywordInTitle = lowerTitle.includes(lowerKeyword)
      const keywordInSeoTitle = lowerSeoTitle.includes(lowerKeyword)
      const keywordInH1 = lowerH1.includes(lowerKeyword)
      const keywordInDescription = lowerDescription.includes(lowerKeyword)
      const keywordCount = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length
      
      console.log('🔍 [TRANSLATE] Validación de Focus Keyword:', {
        keyword: translated.keyword,
        en_title: keywordInTitle,
        en_seo_title: keywordInSeoTitle,
        en_h1: keywordInH1,
        en_description: keywordInDescription,
        veces_en_contenido: keywordCount
      })
      
      // Advertir si el keyword no aparece en lugares clave
      if (!keywordInSeoTitle && !keywordInTitle) {
        console.warn('⚠️ [TRANSLATE] ADVERTENCIA: Focus Keyword no aparece en SEO Title ni Title')
      }
      if (keywordCount < 3) {
        console.warn(`⚠️ [TRANSLATE] ADVERTENCIA: Focus Keyword solo aparece ${keywordCount} veces en el contenido (recomendado: 5-7)`)
      }
      
      // 🔥 VERIFICAR qué keyword traducido recibimos
      console.log('🔍 [TRANSLATE] VERIFICANDO KEYWORD RECIBIDO:')
      console.log('  - keyword original (español):', article.keyword)
      console.log('  - keyword traducido (IA):', translated.keyword)
      console.log('  - ¿Son iguales?:', translated.keyword === article.keyword)
      
      // Si el keyword NO fue traducido (sigue igual al original), hay un problema
      if (translated.keyword === article.keyword) {
        console.error('❌ [TRANSLATE] ERROR CRÍTICO: La IA NO tradujo el keyword!')
        console.error('   Se esperaba keyword en', targetLanguage.name)
        console.error('   Pero se recibió:', translated.keyword)
      }
      
      // Preparar seo_data JSON con todos los campos SEO adicionales
      const seoData = {
        seo_title: translated.seoTitle || translated.title,
        related_keywords: translated.relatedKeywords || [],
        focus_keyword: translated.keyword,  // ← Focus keyword traducido (DEBE estar en inglés)
        meta_description: translated.description || article.meta_description || '',
        slug: translated.slug || translated.keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
      }
      
      // Preparar datos de traducción con estructura correcta del backend
      const translationPayload = {
        language: targetLangCode,
        title: translated.title,
        h1_title: translated.h1Title || translated.title,
        keyword: translated.keyword,  // ← Focus keyword principal traducido
        content: translated.content,
        meta_description: translated.description || article.meta_description || '',
        objective_phrase: translated.objectivePhrase || article.objective_phrase || '',
        keywords_array: translated.keywords || article.keywords_array || [],
        slug: translated.slug || translated.keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, ''),
        seo_data: seoData,  // ← JSON con datos SEO adicionales
        word_count: translated.content.split(/\s+/).filter((w: string) => w.length > 0).length
      }
      
      // Log detallado COMPLETO antes de guardar
      console.log('💾 [TRANSLATE] ===== PAYLOAD COMPLETO A ENVIAR AL BACKEND =====')
      console.log('Language:', translationPayload.language)
      console.log('🎯 KEYWORD:', translationPayload.keyword)
      console.log('Title:', translationPayload.title)
      console.log('H1 Title:', translationPayload.h1_title)
      console.log('Meta Description:', translationPayload.meta_description)
      console.log('Slug:', translationPayload.slug)
      console.log('🔥 SEO_DATA (JSON):', JSON.stringify(translationPayload.seo_data, null, 2))
      console.log('Keywords Array:', translationPayload.keywords_array)
      console.log('Word Count:', translationPayload.word_count)
      console.log('Content Length:', translationPayload.content?.length)
      console.log('============================================')
      
      // Guardar traducción en BD
      console.log('📤 [TRANSLATE] Enviando al backend...')
      await plannerArticlesService.createTranslation(articleId, translationPayload)
      
      console.log('✅ [TRANSLATE] Traducción guardada correctamente en BD')
      
      setTranslationProgress(95)
      
      // Recargar artículo para obtener available_languages actualizado
      const reloadedArticle = await plannerArticlesService.getById(articleId)
      setArticle(reloadedArticle)
      
      setTranslationProgress(95)
      
      // Cargar la traducción recién creada desde el servidor
      console.log('📥 [TRANSLATE] Cargando traducción guardada desde BD...')
      const savedTranslation = await plannerArticlesService.getTranslation(articleId, targetLangCode)
      
      console.log('✅ [TRANSLATE] Traducción cargada desde BD:', {
        '🎯 KEYWORD PRINCIPAL': savedTranslation.keyword,
        'keyword_en_seo_data': savedTranslation.seo_data?.focus_keyword,
        title: savedTranslation.title?.substring(0, 50),
        h1_title: savedTranslation.h1_title?.substring(0, 50),
        meta_description: savedTranslation.meta_description?.substring(0, 50),
        slug: savedTranslation.slug,
        has_seo_data: !!savedTranslation.seo_data,
        seo_data_completo: savedTranslation.seo_data
      })
      
      setTranslationProgress(100)
      
      // Cambiar al idioma traducido con TODOS los datos
      setCurrentLanguage(targetLangCode)
      setEditedContent(savedTranslation.content)
      setEditorKey(prev => prev + 1)
      
      // Actualizar currentTranslationData con TODOS los campos de la traducción guardada
      // 🔥 USAR DATOS DE seo_data como prioridad para campos traducidos
      setCurrentTranslationData({
        ...reloadedArticle,
        title: savedTranslation.title,
        h1_title: savedTranslation.h1_title,
        keyword: savedTranslation.seo_data?.focus_keyword || savedTranslation.keyword,  // ← Priorizar seo_data
        objective_phrase: savedTranslation.objective_phrase,
        keywords_array: savedTranslation.keywords_array,
        meta_description: savedTranslation.seo_data?.meta_description || savedTranslation.meta_description,  // ← Priorizar seo_data
        slug: savedTranslation.seo_data?.slug || savedTranslation.slug,  // ← Priorizar seo_data
        content: savedTranslation.content,
        seo_data: savedTranslation.seo_data,  // ← CRÍTICO: incluir seo_data
        word_count: savedTranslation.word_count,
        language: targetLangCode
      })
      
      console.log('🎯 [TRANSLATE] Estado actualizado con traducción completa:', {
        keyword: savedTranslation.keyword,
        seo_data_focus_keyword: savedTranslation.seo_data?.focus_keyword,
        seo_data_seo_title: savedTranslation.seo_data?.seo_title?.substring(0, 50)
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTranslationProgress(0)
      setCurrentTranslationStep('')
      setIsStreamingTranslation(false)
      
      console.log('✅ [TRANSLATE] Todo completado')
      
    } catch (error: any) {
      console.error('❌ [TRANSLATE] Error:', error)
      setTranslationProgress(0)
      setCurrentTranslationStep('')
      setIsStreamingTranslation(false)
      alert(`Error al traducir: ${error.message}`)
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
      setEditedContent(article.content || '')
      setEditorKey(prev => prev + 1)
      
      alert('✅ Traducción eliminada correctamente')
    } catch (err) {
      alert('Error al eliminar traducción: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setDeleting(false)
    }
  }

  // REMOVIDO: analyzeSEOIssues - Ahora usamos completeOptimizerService

  const handleHumanize = async () => {
    if (!article || !articleId) return
    
    // Preguntar por el modelo AI primero
    if (!selectedHumanizeModelId) {
      alert('Por favor, selecciona un modelo de IA primero')
      setShowModelSelector(true)
      return
    }
    
    if (!confirm('¿Humanizar el contenido generado por IA?\n\nVerás el contenido humanizándose en TIEMPO REAL mientras la IA trabaja.')) return
    
    setHumanizing(true)
    setHumanizeProgress(0)
    setCurrentHumanizeStep('Preparando contenido...')
    setIsStreamingHumanize(true) // Activar modo streaming por defecto
    
    try {
      // Obtener contenido actual del editor (ya es HTML del WYSIWYG)
      const htmlContent = editedContent
      
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('No hay contenido para humanizar')
      }
      
      console.log('📝 [HUMANIZE] Contenido a humanizar:', {
        length: htmlContent.length,
        hasHTML: htmlContent.includes('<'),
        preview: htmlContent.substring(0, 100)
      })
      
      setHumanizeProgress(10)
      setCurrentHumanizeStep('Analizando patrones de IA...')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setHumanizeProgress(20)
      setCurrentHumanizeStep('Analizando problemas SEO...')
      
      // REMOVIDO: analyzeSEOIssues - Ahora usamos completeOptimizerService
      console.log('🔍 [HUMANIZE] Usando nuevo sistema de optimización')
      
      setCurrentHumanizeStep('Humanizando y optimizando contenido con IA...')
      
      // Determinar tono según el contexto
      const tone = article.meta_description?.includes('profesional') ? 'professional' : 'friendly'
      
      // 🚀 NUEVO SISTEMA - Humanizar con servicio limpio
      let lastUpdateTime = 0
      const UPDATE_THROTTLE_MS = 100
      
      const result = await humanizeContentService.humanize(htmlContent, {
        keyword: displayArticle.keyword || '',
        articleTitle: displayArticle.title || '',
        modelId: selectedHumanizeModelId,
        tone: tone,
        seoIssues: [], // REMOVIDO: Ahora usamos completeOptimizerService
        onProgress: (step: string, progress: number) => {
          setCurrentHumanizeStep(step)
          setHumanizeProgress(Math.round(progress))
        },
        onStreaming: (chunk: string, accumulated: string) => {
          const now = Date.now()
          if (now - lastUpdateTime >= UPDATE_THROTTLE_MS) {
            setEditedContent(accumulated)
            lastUpdateTime = now
          }
        },
        onFallback: () => {
          console.log('🔄 Activando modo sin streaming')
          setIsStreamingHumanize(false)
        }
      })
      
      console.log('✅ Humanización completada:', {
        secciones: result.stats.sectionsProcessed,
        negritas: result.stats.boldsAdded,
        keyword: result.stats.keywordCount,
        longitud: result.stats.humanizedLength
      })
      
      if (!result.content || result.content.trim().length === 0) {
        throw new Error('La humanización no generó contenido')
      }
      
      // 🔥 Actualización FINAL con el contenido completo humanizado
      setEditedContent(result.content)
      
      // Pequeña pausa para que React procese la última actualización
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setHumanizeProgress(85)
      setCurrentHumanizeStep('Guardando cambios...')
      
      console.log('💾 [DEBUG] Guardando contenido humanizado en BD...')
      
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
        const statsInfo = `\n\n📊 Estadísticas:
• Secciones procesadas: ${result.stats.sectionsProcessed}
• Negritas agregadas: ${result.stats.boldsAdded}
• Keyword aparece: ${result.stats.keywordCount} veces`
        
        const improvementsText = result.improvements.length > 0 
          ? `\n\n✅ Mejoras:\n${result.improvements.map(i => `• ${i}`).join('\n')}`
          : ''
        
        alert(`✅ ¡Contenido humanizado!${statsInfo}${improvementsText}\n\nOriginal: ${result.stats.originalLength} caracteres\nOptimizado: ${result.stats.humanizedLength} caracteres`)
        
        // Resetear estados
        setHumanizing(false)
        setHumanizeProgress(0)
        setCurrentHumanizeStep('')
        setEditorKey(prev => prev + 1)
      }, 1500)
      
    } catch (error: any) {
      console.error('Error humanizando contenido:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setHumanizing(false)
      setHumanizeProgress(0)
      setCurrentHumanizeStep('')
      setIsStreamingHumanize(false)
    }
  }

  /**
   * 🎯 OPTIMIZACIÓN COMPLETA YOAST SEO
   * 
   * Esta función usa el NUEVO SISTEMA COMPLETO de optimización que:
   * - Analiza TODOS los problemas de Yoast SEO
   * - Optimiza con IA especializada
   * - Aplica optimizaciones automáticas adicionales
   * - Soluciona: palabras de transición, longitud de oraciones, keywords en negrita
   * 
   * NO usa el sistema anterior de readability-optimizer
   */
  const handleOptimizeReadability = async () => {
    if (!article || !articleId) return

    try {
      setOptimizingReadability(true)
      
      const htmlContent = editedContent || article.content
      const keyword = article.keyword || ''
      const title = article.title || ''
      const metaDescription = article.meta_description || ''
      
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('No hay contenido para optimizar')
      }

      console.log('🎯 Iniciando optimización completa de Yoast SEO...')
      
      // 🔍 Analizar problemas actuales
      const issues = await completeOptimizerService.analyzeContent({
        content: htmlContent,
        keyword,
        title,
        metaDescription,
        language: displayArticle?.language || 'es'
      })
      
      console.log('📊 Problemas detectados:', issues.length)
      issues.forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.title}`)
      })
      
      // 🎯 Optimizar completamente
      const result = await completeOptimizerService.optimizeComplete({
        content: htmlContent,
        keyword,
        title,
        metaDescription,
        language: displayArticle?.language || 'es'
      }, selectedHumanizeModelId || 1)
      
      console.log('✅ Optimización completada:')
      console.log('  - Problemas solucionados:', result.issuesFixed.length)
      console.log('  - Problemas restantes:', result.remainingIssues.length)
      console.log('  - Mejoras aplicadas:', result.improvements)
      
      // Actualizar contenido en el editor
      setEditedContent(result.optimizedContent)
      setEditorKey(prev => prev + 1)
      
      // Actualizar artículo en base de datos
      if (currentLanguage !== (article.language || 'es')) {
        // Actualizar traducción
        await plannerArticlesService.updateTranslation(
          articleId,
          currentLanguage,
          { content: result.optimizedContent }
        )
      } else {
        // Actualizar artículo original
        await plannerArticlesService.update(articleId, { 
          content: result.optimizedContent,
          word_count: result.optimizedContent.split(/\s+/).length
        })
        setArticle(prev => prev ? {
          ...prev,
          content: result.optimizedContent,
          word_count: result.optimizedContent.split(/\s+/).length
        } : null)
      }
      
      // Mostrar resumen de optimización
      const summary = `✅ OPTIMIZACIÓN COMPLETA EXITOSA

🔧 Mejoras aplicadas:
• Palabras de transición agregadas: ${result.improvements.transitionWordsAdded}
• Oraciones acortadas: ${result.improvements.sentencesShortened}
• Keywords en negrita: ${result.improvements.keywordsBolded}
• Párrafos optimizados: ${result.improvements.paragraphsOptimized}

📊 Estadísticas:
• Palabras de transición: ${result.beforeStats.transitionWords} → ${result.afterStats.transitionWords}
• Oraciones largas: ${result.beforeStats.longSentences} → ${result.afterStats.longSentences}
• Keywords en negrita: ${result.beforeStats.boldKeywords} → ${result.afterStats.boldKeywords}

✅ Problemas solucionados: ${result.issuesFixed.length}
⚠️ Problemas restantes: ${result.remainingIssues.length}`
      
      alert(summary)
      
    } catch (error: any) {
      console.error('❌ Error en optimización completa:', error)
      alert(`Error al optimizar: ${error.message}`)
    } finally {
      setOptimizingReadability(false)
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
      <Header />
      <Sidebar />
      
      {/* Main Content with left margin for sidebar */}
      <main className="ml-20 pt-0">
        <ArticleHeader
          article={article}
          saving={saving}
          deleting={deleting}
          humanizing={humanizing}
          optimizingReadability={optimizingReadability}
          currentLanguage={currentLanguage}
          loadingTranslation={loadingTranslation}
          selectedModelId={selectedHumanizeModelId}
          availableModels={availableModels}
          onModelChange={setSelectedHumanizeModelId}
          onSave={handleSave}
          onDelete={handleDelete}
          showLanguageMenu={showLanguageMenu}
          setShowLanguageMenu={setShowLanguageMenu}
          languagesHook={languagesHook}
          onTranslate={handleTranslate}
          onLanguageChange={handleLanguageChange}
          onGooglePreview={() => setShowGooglePreview(true)}
          onDeleteTranslation={handleDeleteTranslation}
          onHumanize={handleHumanize}
          onOptimizeReadability={handleOptimizeReadability}
        />

        <div className="flex h-[calc(100vh-60px)]">
        <div className="flex-1 overflow-y-auto">
          <div className="p-0">
            <div className="max-w-5xl mx-auto">
              {((humanizing && !isStreamingHumanize) || (translating && !isStreamingTranslation)) ? (
                // Skeleton cuando está humanizando o traduciendo SIN streaming
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-center mb-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: '#009689' }} />
                      <p className="text-sm font-medium text-gray-600">
                        {humanizing ? 'Humanizando contenido...' : 'Traduciendo contenido...'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {humanizing ? currentHumanizeStep : currentTranslationStep}
                      </p>
                    </div>
                  </div>
                  
                  {/* Skeleton del contenido */}
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  
                  <Skeleton className="h-8 w-2/3 mt-8" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  
                  <Skeleton className="h-8 w-1/2 mt-8" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  
                  <Skeleton className="h-8 w-3/5 mt-8" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <WysiwygEditor
                  key={editorKey}
                  initialContent={editedContent}
                  onChange={setEditedContent}
                  showImagePicker={true}
                  className="min-h-[600px]"
                />
              )}
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
                editedContent={editedContent}
                onContentUpdate={(newContent) => {
                  setEditedContent(newContent)
                  setEditorKey(prev => prev + 1)
                }}
              />
            )}

            {activeTab === 'seo' && (
              <SEOTab
                article={displayArticle}
                editedContent={editedContent}
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
      </main>
    </div>
  )
}
