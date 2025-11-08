import { useState } from 'react'
import { plannerArticlesService, type PlannerArticleData, type PlannerArticle } from '@/lib/api/planner-articles'
import { useRouter } from 'next/navigation'

export function useSaveArticle() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedArticle, setSavedArticle] = useState<PlannerArticle | null>(null)

  /**
   * Guardar artículo en la base de datos
   */
  const saveArticle = async (articleData: PlannerArticleData): Promise<PlannerArticle | null> => {
    setIsSaving(true)
    setSaveError(null)

    try {
      console.log('💾 Guardando artículo...', articleData)
      
      const article = await plannerArticlesService.create(articleData)
      
      console.log('✅ Artículo guardado exitosamente:', article)
      setSavedArticle(article)
      
      return article
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error('❌ Error guardando artículo:', error)
      setSaveError(message)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Guardar y redirigir a la vista del artículo
   */
  const saveAndRedirect = async (articleData: PlannerArticleData): Promise<void> => {
    const article = await saveArticle(articleData)
    
    if (article) {
      // Redirigir a la página del artículo
      router.push(`/contenido/planner/articles/${article.id}`)
    }
  }

  /**
   * Actualizar artículo existente
   */
  const updateArticle = async (
    id: number, 
    articleData: Partial<PlannerArticleData>
  ): Promise<PlannerArticle | null> => {
    setIsSaving(true)
    setSaveError(null)

    try {
      console.log('💾 Actualizando artículo...', id, articleData)
      
      const article = await plannerArticlesService.update(id, articleData)
      
      console.log('✅ Artículo actualizado exitosamente:', article)
      setSavedArticle(article)
      
      return article
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error('❌ Error actualizando artículo:', error)
      setSaveError(message)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Guardar artículo con datos de optimización
   */
  const saveWithOptimization = async (
    articleData: PlannerArticleData,
    seoData: any
  ): Promise<PlannerArticle | null> => {
    return await saveArticle({
      ...articleData,
      seo_data: seoData
    })
  }

  /**
   * Limpiar estado de guardado
   */
  const clearSaveState = () => {
    setSaveError(null)
    setSavedArticle(null)
  }

  return {
    saveArticle,
    saveAndRedirect,
    updateArticle,
    saveWithOptimization,
    clearSaveState,
    isSaving,
    saveError,
    savedArticle
  }
}
