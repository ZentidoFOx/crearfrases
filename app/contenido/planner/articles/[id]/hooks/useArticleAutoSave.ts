import { useEffect } from 'react'
import { useAutoSave } from '@/hooks/useAutoSave'
import { plannerArticlesService, type PlannerArticle } from '@/lib/api/planner-articles'

interface UseArticleAutoSaveProps {
  article: PlannerArticle | null
  articleId: number | null
  editedContent: string
  currentTranslationData: any
  currentLanguage: string
  loading: boolean
  isAutoSaving: boolean
  setIsAutoSaving: (saving: boolean) => void
  lastSavedContentRef: React.MutableRefObject<string>
  autoSaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  setArticle: (article: PlannerArticle | null) => void
  setCurrentTranslationData: (data: any) => void
  wordpress?: any
}

export function useArticleAutoSave({
  article,
  articleId,
  editedContent,
  currentTranslationData,
  currentLanguage,
  loading,
  isAutoSaving,
  setIsAutoSaving,
  lastSavedContentRef,
  autoSaveTimeoutRef,
  setArticle,
  setCurrentTranslationData,
  wordpress
}: UseArticleAutoSaveProps) {
  
  // Auto-guardado para artículos originales
  const autoSaveOriginal = useAutoSave(
    {
      title: article?.title,
      content: editedContent,
      keyword: article?.keyword,
      h1_title: article?.h1_title,
      meta_description: article?.meta_description,
      objective_phrase: article?.objective_phrase,
      keywords_array: article?.keywords_array
    },
    {
      delay: 2000,
      enabled: !!article && !currentTranslationData && !loading && !!editedContent,
      onSave: async (data) => {
        if (!article || !articleId) return
        
        console.log('🔄 Auto-guardando artículo original...', {
          contentLength: data.content?.length || 0,
          title: data.title
        })
        
        // 🔥 Preparar datos de WordPress para guardar
        const wpData: any = {
          title: data.title,
          content: data.content,
          keyword: data.keyword,
          h1_title: data.h1_title,
          meta_description: data.meta_description,
          objective_phrase: data.objective_phrase,
          keywords_array: data.keywords_array
        }
        
        // 🔥 Agregar imagen destacada si existe
        if (wordpress?.wpFeaturedImage) {
          wpData.featured_image_url = wordpress.wpFeaturedImage
          if (wordpress?.wpFeaturedImageId) {
            wpData.featured_image_id = wordpress.wpFeaturedImageId
            console.log('💾 Auto-guardando imagen destacada con ID:', wordpress.wpFeaturedImageId)
          } else {
            console.log('💾 Auto-guardando imagen destacada (sin ID):', wordpress.wpFeaturedImage)
          }
        }
        
        // 🔥 Agregar categorías si existen
        if (wordpress?.wpCategories?.length > 0) {
          const categoriesForDB = wordpress.availableCategories
            ?.filter((cat: any) => wordpress.wpCategories.includes(cat.name))
            .map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug
            }))
          
          if (categoriesForDB?.length > 0) {
            wpData.wordpress_categories = categoriesForDB
            console.log('💾 Auto-guardando categorías:', categoriesForDB)
          }
        }
        
        await plannerArticlesService.update(articleId, wpData)
      },
      onError: (error) => {
        console.error('❌ Error auto-guardando artículo:', error)
      },
      onSuccess: () => {
        console.log('✅ Artículo auto-guardado exitosamente')
      }
    }
  )

  // Auto-guardado para traducciones
  const autoSaveTranslation = useAutoSave(
    currentTranslationData ? {
      title: currentTranslationData.title,
      content: editedContent,
      keyword: currentTranslationData.keyword,
      h1_title: currentTranslationData.h1_title,
      meta_description: currentTranslationData.meta_description,
      objective_phrase: currentTranslationData.objective_phrase,
      keywords_array: currentTranslationData.keywords_array
    } : null,
    {
      delay: 3000,
      enabled: !!currentTranslationData && !loading,
      onSave: async (data) => {
        if (!currentTranslationData || !articleId) return
        
        console.log('🔄 Auto-guardando traducción...', data)
        
        // 🔥 Preparar datos de WordPress para guardar
        const wpData: any = {
          title: data.title,
          content: data.content,
          keyword: data.keyword,
          h1_title: data.h1_title,
          meta_description: data.meta_description,
          objective_phrase: data.objective_phrase,
          keywords_array: data.keywords_array
        }
        
        // 🔥 Agregar imagen destacada si existe
        if (wordpress?.wpFeaturedImage) {
          wpData.featured_image_url = wordpress.wpFeaturedImage
          if (wordpress?.wpFeaturedImageId) {
            wpData.featured_image_id = wordpress.wpFeaturedImageId
            console.log('💾 Auto-guardando imagen destacada en traducción con ID:', wordpress.wpFeaturedImageId)
          } else {
            console.log('💾 Auto-guardando imagen destacada en traducción (sin ID):', wordpress.wpFeaturedImage)
          }
        }
        
        // 🔥 Agregar categorías si existen
        if (wordpress?.wpCategories?.length > 0) {
          const categoriesForDB = wordpress.availableCategories
            ?.filter((cat: any) => wordpress.wpCategories.includes(cat.name))
            .map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug
            }))
          
          if (categoriesForDB?.length > 0) {
            wpData.wordpress_categories = categoriesForDB
            console.log('💾 Auto-guardando categorías en traducción:', categoriesForDB)
          }
        }
        
        await plannerArticlesService.updateTranslation(articleId, currentLanguage, wpData)
      },
      onError: (error) => {
        console.error('❌ Error auto-guardando traducción:', error)
      },
      onSuccess: () => {
        console.log('✅ Traducción auto-guardada exitosamente')
      }
    }
  )

  // Auto-guardado directo para editedContent, imágenes y categorías
  useEffect(() => {
    if (!article || !articleId || isAutoSaving) {
      return
    }

    // 🔥 Verificar si hay cambios en contenido, imagen o categorías
    const hasContentChange = editedContent && editedContent !== lastSavedContentRef.current
    const hasImageChange = wordpress?.wpFeaturedImage
    const hasCategoryChange = wordpress?.wpCategories?.length > 0

    if (!hasContentChange && !hasImageChange && !hasCategoryChange) {
      return
    }

    console.log('📝 [AUTO-SAVE-DIRECT] Cambios detectados, programando guardado...', {
      contentChanged: hasContentChange,
      imageChanged: hasImageChange,
      categoryChanged: hasCategoryChange
    })

    // Cancelar timeout anterior
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
    }

    // Programar nuevo guardado
    const timeout = setTimeout(async () => {
      try {
        setIsAutoSaving(true)
        console.log('🔄 [AUTO-SAVE-DIRECT] Guardando contenido, imagen y categorías...')

        // 🔥 Preparar datos de WordPress para guardar
        const wpData: any = {}
        
        // 🔥 Agregar contenido si cambió
        if (editedContent && editedContent !== lastSavedContentRef.current) {
          wpData.content = editedContent
          console.log('💾 [AUTO-SAVE-DIRECT] Guardando contenido')
        }
        
        // 🔥 Agregar imagen destacada si existe
        if (wordpress?.wpFeaturedImage) {
          wpData.featured_image_url = wordpress.wpFeaturedImage
          if (wordpress?.wpFeaturedImageId) {
            wpData.featured_image_id = wordpress.wpFeaturedImageId
            console.log('💾 [AUTO-SAVE-DIRECT] Guardando imagen destacada con ID:', wordpress.wpFeaturedImageId)
          } else {
            console.log('💾 [AUTO-SAVE-DIRECT] Guardando imagen destacada (sin ID):', wordpress.wpFeaturedImage)
          }
        }
        
        // 🔥 Agregar categorías si existen
        if (wordpress?.wpCategories?.length > 0) {
          const categoriesForDB = wordpress.availableCategories
            ?.filter((cat: any) => wordpress.wpCategories.includes(cat.name))
            .map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug
            }))
          
          if (categoriesForDB?.length > 0) {
            wpData.wordpress_categories = categoriesForDB
            console.log('💾 [AUTO-SAVE-DIRECT] Guardando categorías:', categoriesForDB)
          }
        }

        // Solo guardar si hay datos para guardar
        if (Object.keys(wpData).length === 0) {
          console.log('⏭️ [AUTO-SAVE-DIRECT] No hay datos para guardar')
          return
        }

        if (currentTranslationData) {
          // Guardar traducción
          await plannerArticlesService.updateTranslation(articleId, currentLanguage, wpData)
        } else {
          // Guardar artículo original
          await plannerArticlesService.update(articleId, wpData)
        }

        lastSavedContentRef.current = editedContent
        console.log('✅ [AUTO-SAVE-DIRECT] Contenido guardado exitosamente')
      } catch (error) {
        console.error('❌ [AUTO-SAVE-DIRECT] Error guardando:', error)
      } finally {
        setIsAutoSaving(false)
      }
    }, 2000)

    autoSaveTimeoutRef.current = timeout

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [editedContent, wordpress?.wpFeaturedImage, JSON.stringify(wordpress?.wpCategories), article, articleId, currentTranslationData, currentLanguage, isAutoSaving])

  // Debug logs
  useEffect(() => {
    console.log('📝 [DEBUG] editedContent cambió:', {
      length: editedContent?.length || 0,
      preview: editedContent?.substring(0, 100) || 'vacío',
      autoSaveEnabled: activeAutoSave ? 'sí' : 'no',
      hasUnsavedChanges: activeAutoSave?.hasUnsavedChanges || false,
      isSaving: activeAutoSave?.isSaving || false,
      isAutoSaving
    })
  }, [editedContent, isAutoSaving])

  // Listeners para actividad del usuario
  useEffect(() => {
    const handleUserActivity = () => {
      if (activeAutoSave && !activeAutoSave.isSaving) {
        console.log('👆 Actividad del usuario detectada')
      }
    }

    const events = ['click', 'keydown', 'mousemove', 'focus', 'blur', 'input']
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [])

  // Auto-save al cambiar de pestaña o cerrar ventana
  useEffect(() => {
    const activeAutoSave = currentTranslationData ? autoSaveTranslation : autoSaveOriginal
    
    const handleBeforeUnload = () => {
      if (activeAutoSave.hasUnsavedChanges && !activeAutoSave.isSaving) {
        activeAutoSave.forceSave()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && activeAutoSave.hasUnsavedChanges && !activeAutoSave.isSaving) {
        activeAutoSave.forceSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentTranslationData, autoSaveOriginal, autoSaveTranslation])

  // Seleccionar el auto-save activo
  const activeAutoSave = currentTranslationData ? autoSaveTranslation : autoSaveOriginal

  return {
    activeAutoSave,
    autoSaveOriginal,
    autoSaveTranslation
  }
}
