import { humanizeContentService } from '@/lib/api/humanize-content'
import { seoOptimizerService } from '@/lib/api/seo-optimizer'
import { plannerArticlesService } from '@/lib/api/planner-articles'
import { ArticleState, ArticleActions } from '../hooks/useArticleState'

interface OptimizationHandlersProps extends ArticleState, ArticleActions {
  articleId: number | null
  displayArticle: any
}

export function createOptimizationHandlers(props: OptimizationHandlersProps) {
  const {
    article,
    articleId,
    editedContent,
    currentLanguage,
    currentTranslationData,
    selectedHumanizeModelId,
    displayArticle,
    setHumanizing,
    setHumanizeProgress,
    setCurrentHumanizeStep,
    setIsStreamingHumanize,
    setOptimizingReadability,
    setEditedContent,
    setEditorKey,
    setArticle,
    setCurrentTranslationData,
    setShowModelSelector
  } = props

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
    setIsStreamingHumanize(true)
    
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
        seoIssues: [],
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
   * 🎯 SEO OPTIMIZER - SOLO OPTIMIZA CONTENIDO
   * 
   * ⚠️ IMPORTANTE: NO modifica campos de "Yoast SEO Configuration"
   * - Focus Keyword: Se mantiene intacto
   * - SEO Title: Se mantiene intacto  
   * - H1 Title: Se mantiene intacto
   * - Meta Description: Se mantiene intacta
   * - Keywords Array: Se mantiene intacto
   * 
   * Solo optimiza el CONTENIDO del artículo para SEO y legibilidad.
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

      // Detectar si es una traducción
      const isTranslation = currentLanguage !== (article.language || 'es')
      const currentLang = currentLanguage || displayArticle?.language || 'es'
      
      console.log('🎯 [SEO-OPTIMIZER] Iniciando optimización SOLO de contenido...')
      console.log('🌍 [SEO-OPTIMIZER] Idioma detectado:', currentLang, isTranslation ? '(TRADUCCIÓN)' : '(ORIGINAL)')
      console.log('⚠️ [SEO-OPTIMIZER] Los campos de Yoast SEO Configuration NO se modificarán')
      
      // 🚀 USAR EL NUEVO SEO OPTIMIZER (solo contenido) con contexto de traducción
      const result = await seoOptimizerService.optimizeArticle({
        content: htmlContent,
        keyword,
        title,
        metaDescription,
        language: currentLang,
        isTranslation: isTranslation,
        originalLanguage: article.language || 'es'
      }, selectedHumanizeModelId || 16)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      console.log('✅ [SEO-OPTIMIZER] Optimización de contenido completada exitosamente')
      console.log('  - Mejoras aplicadas:', result.improvements)
      console.log('🔒 [SEO-OPTIMIZER] Campos Yoast SEO Configuration preservados intactos')
      
      // Actualizar SOLO el contenido en el editor
      setEditedContent(result.optimizedContent)
      setEditorKey(prev => prev + 1)
      
      // Actualizar SOLO el contenido en base de datos (NO los campos SEO)
      if (currentLanguage !== (article.language || 'es')) {
        // Actualizar traducción - SOLO contenido
        await plannerArticlesService.updateTranslation(
          articleId,
          currentLanguage,
          { content: result.optimizedContent }
        )
      } else {
        // Actualizar artículo original - SOLO contenido
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
      
      // Mostrar resumen de optimización SEO
      const summary = `🎯 SEO OPTIMIZER - OPTIMIZACIÓN DE CONTENIDO EXITOSA

🚀 Mejoras aplicadas al CONTENIDO:
• Palabras de transición agregadas: ${result.improvements.transitionWordsAdded}
• Oraciones acortadas: ${result.improvements.sentencesShortened}
• Keywords en negrita: ${result.improvements.keywordsBolded}
• Problemas SEO solucionados: ${result.improvements.seoIssuesFixed}

📄 Estadísticas del CONTENIDO:
• Palabras de transición: ${result.beforeStats.transitionWords} → ${result.afterStats.transitionWords}
• Oraciones largas: ${result.beforeStats.longSentences} → ${result.afterStats.longSentences}
• Keywords en negrita: ${result.beforeStats.boldKeywords} → ${result.afterStats.boldKeywords}

🔒 CAMPOS YOAST SEO CONFIGURATION:
• Focus Keyword: ✅ Preservado intacto
• SEO Title: ✅ Preservado intacto
• H1 Title: ✅ Preservado intacto
• Meta Description: ✅ Preservada intacta
• Keywords Array: ✅ Preservado intacto

✅ Solo el contenido del artículo fue optimizado para SEO y legibilidad`
      
      alert(summary)
      
    } catch (error: any) {
      console.error('❌ [SEO-OPTIMIZER] Error en optimización:', error)
      alert(`❌ Error en SEO Optimizer: ${error.message}`)
    } finally {
      setOptimizingReadability(false)
    }
  }

  return {
    handleHumanize,
    handleOptimizeReadability
  }
}
