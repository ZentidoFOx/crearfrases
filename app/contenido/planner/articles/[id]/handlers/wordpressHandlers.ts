import { publishToWordPress } from '@/lib/api/wordpress-publisher'
import { plannerArticlesService } from '@/lib/api/planner-articles'
import { usersAPI } from '@/lib/api/users'
import { ArticleState, ArticleActions } from '../hooks/useArticleState'

interface WordPressHandlersProps extends ArticleState, ArticleActions {
  articleId: number | null
  activeWebsite: any
  wordpress: any
}

export function createWordPressHandlers(props: WordPressHandlersProps) {
  const {
    article,
    articleId,
    editedContent,
    postStatus,
    activeWebsite,
    wordpress,
    setPublishProgress,
    setCurrentPublishStep,
    setPublishedPostId,
    setPublishedPostUrl
  } = props

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
      
      // Obtener credenciales de WordPress desde la API
      console.log('🔐 Obteniendo credenciales de WordPress para sitio:', activeWebsite.id)
      const credentialsResponse = await usersAPI.getWordPressCredentials(activeWebsite.id)
      
      if (!credentialsResponse.success || !credentialsResponse.data.is_configured) {
        console.error('❌ No hay credenciales configuradas:', credentialsResponse)
        throw new Error('No hay credenciales de WordPress configuradas para este sitio. Ve a "Mis Dominios" para configurarlas.')
      }
      
      console.log('✅ Credenciales obtenidas:', {
        username: credentialsResponse.data.username,
        hasPassword: !!credentialsResponse.data.app_password
      })
      
      const credentials = {
        siteUrl: activeWebsite.url,
        username: credentialsResponse.data.username,
        applicationPassword: credentialsResponse.data.app_password
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
            const isViewingTranslation = props.currentLanguage !== (article.language || 'es')
            
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
                ?.filter((cat: any) => wordpress.wpCategories.includes(cat.name))
                .map((cat: any) => ({
                  id: cat.id,
                  name: cat.name,
                  slug: cat.slug
                }))
              
              if (isMainLanguage) {
                await plannerArticlesService.update(articleId!, {
                  wordpress_post_id: result.postId,
                  status: postStatus === 'publish' ? 'published' : 'pending',
                  featured_image_url: wordpress.wpFeaturedImage || undefined,
                  wordpress_categories: categoriesForDB?.length > 0 ? categoriesForDB : undefined,
                  wordpress_status: postStatus
                })
              } else {
                await plannerArticlesService.updateTranslation(articleId!, langCode, {
                  wordpress_post_id: result.postId,
                  featured_image_url: wordpress.wpFeaturedImage || undefined,
                  wordpress_categories: categoriesForDB?.length > 0 ? categoriesForDB : undefined,
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

  return {
    handlePublishToWordPress
  }
}
