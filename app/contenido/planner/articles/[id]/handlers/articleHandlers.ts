import { plannerArticlesService, type PlannerArticle } from '@/lib/api/planner-articles'
import { ArticleState, ArticleActions } from '../hooks/useArticleState'

interface ArticleHandlersProps extends ArticleState, ArticleActions {
  articleId: number | null
  router: any
  wordpress?: any
}

export function createArticleHandlers(props: ArticleHandlersProps) {
  const {
    article,
    articleId,
    currentLanguage,
    currentTranslationData,
    editedContent,
    postStatus,
    wordpress,
    setSaving,
    setDeleting,
    setArticle,
    setCurrentTranslationData,
    router
  } = props

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
      if (wordpress?.wpFeaturedImage) {
        wpData.featured_image_url = wordpress.wpFeaturedImage
        console.log('💾 Guardando imagen destacada:', wordpress.wpFeaturedImage)
      }
      
      // Agregar categorías si existen
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
        setArticle((prev: PlannerArticle | null) => prev ? { ...prev, ...wpData } : null)
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
      setArticle((prev: PlannerArticle | null) => prev ? {
        ...prev,
        available_languages: prev.available_languages?.filter((lang: string) => lang !== currentLanguage)
      } : null)
      
      // Cambiar al idioma principal después de eliminar
      props.setCurrentLanguage(article.language || 'es')
      props.setCurrentTranslationData(null)
      
      // Recargar contenido del idioma principal
      props.setEditedContent(article.content || '')
      props.setEditorKey(prev => prev + 1)
      
      alert('✅ Traducción eliminada correctamente')
    } catch (err) {
      alert('Error al eliminar traducción: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setDeleting(false)
    }
  }

  return {
    handleSave,
    handleDelete,
    handleSubmit,
    handleDeleteTranslation
  }
}
