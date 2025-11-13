import { plannerArticlesService } from '@/lib/api/planner-articles'
import { translatorService } from '@/lib/api/translator'
import { ArticleState, ArticleActions } from '../hooks/useArticleState'

interface TranslationHandlersProps extends ArticleState, ArticleActions {
  articleId: number | null
  languagesHook: any
}

export function createTranslationHandlers(props: TranslationHandlersProps) {
  const {
    article,
    articleId,
    currentLanguage,
    editedContent,
    selectedHumanizeModelId,
    languagesHook,
    setShowLanguageMenu,
    setTranslating,
    setTranslationProgress,
    setTargetLanguageName,
    setCurrentTranslationStep,
    setIsStreamingTranslation,
    setCurrentLanguage,
    setEditedContent,
    setEditorKey,
    setArticle,
    setCurrentTranslationData,
    setLoadingTranslation
  } = props

  const handleLanguageChange = async (langCode: string) => {
    console.log('🔥 [LANGUAGE] ¡FUNCIÓN LLAMADA! Cambiando a:', langCode)
    
    if (!article || !articleId) {
      console.error('❌ [LANGUAGE] No hay artículo o articleId:', { article: !!article, articleId })
      return
    }
    
    const originalLanguage = article.language || 'es'
    
    console.log('🌍 [LANGUAGE] Cambiando idioma:')
    console.log('  - Idioma original:', originalLanguage)
    console.log('  - Idioma solicitado:', langCode)
    console.log('  - Idiomas disponibles:', article.available_languages)
    
    // Si es el idioma principal, mostrar contenido del artículo original
    if (langCode === originalLanguage) {
      console.log('✅ [LANGUAGE] Mostrando artículo ORIGINAL')
      setCurrentLanguage(langCode)
      setCurrentTranslationData(null)
      setEditedContent(article.content || '')
      setEditorKey(prev => prev + 1)
      return
    }
    
    // 🛡️ VERIFICAR: Si no existe traducción, mostrar editor vacío con mensaje
    if (!article.available_languages?.includes(langCode)) {
      console.log(`📝 [LANGUAGE] No existe traducción para ${langCode}, mostrando editor vacío`)
      setCurrentLanguage(langCode)
      setCurrentTranslationData({
        ...article,
        language: langCode,
        content: '', // Editor vacío
        title: '',
        h1_title: '',
        keyword: '',
        meta_description: '',
        slug: '',
        needsTranslation: true // Flag para mostrar mensaje
      })
      setEditedContent('')
      setEditorKey(prev => prev + 1)
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
      
      // Usar contenido editado o contenido original del artículo
      const htmlContent = editedContent && editedContent.trim().length > 0 
        ? editedContent 
        : article.content
      
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('No hay contenido para traducir. El artículo original no tiene contenido.')
      }
      
      console.log('📝 [TRANSLATE] Contenido a traducir:', {
        source: editedContent && editedContent.trim().length > 0 ? 'editedContent' : 'article.content',
        length: htmlContent.length,
        preview: htmlContent.substring(0, 100) + '...'
      })
      
      console.log('🚀 [TRANSLATE] Iniciando traducción en 2 PASOS')
      
      setCurrentTranslationStep('translating-seo')
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
        setCurrentTranslationStep('translating-content')
        setTranslationProgress(20)
        setIsStreamingTranslation(true)
        
        const translatedData = await translatorService.translateWithStreaming(
          translationData,
          targetLangCode,
          targetLanguage.name,
          {
            modelId: selectedHumanizeModelId || 1,
            onChunk: (chunk) => {
              accumulatedTranslation += chunk
              usedStreaming = true
              
              // Actualizar progreso (20% a 75%)
              const progress = Math.min(75, 20 + (accumulatedTranslation.length / htmlContent.length) * 55)
              setTranslationProgress(Math.round(progress))
              
              // Actualizar editor con efecto typewriter en tiempo real
              if (accumulatedTranslation && accumulatedTranslation.length > 50) {
                setEditedContent(accumulatedTranslation)
                console.log('📝 [STREAMING] Actualizando editor:', accumulatedTranslation.length, 'chars')
              }
            },
            onFallbackToNormal: () => {
              console.log('⚠️ [TRANSLATE] Fallback a modo sin streaming - Mostrando skeleton')
              setIsStreamingTranslation(false)
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
          console.error('❌ [TRANSLATE] Error de validación, NO hacer fallback:', streamError.message)
          throw streamError
        }
        
        if (isConnectionError) {
          console.log('⚠️ [TRANSLATE] Error de conexión, usando método simple...', streamError)
          
          setIsStreamingTranslation(false)
          setTranslationProgress(30)
          
          translated = await translatorService.translateArticleSimple(
            article.title,
            htmlContent,
            article.keyword,
            targetLangCode,
            targetLanguage.name,
            selectedHumanizeModelId || 1
          )
          
          console.log('✅ [TRANSLATE] Traducción simple completada')
        } else {
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
        focus_keyword: translated.keyword,
        meta_description: translated.description || article.meta_description || '',
        slug: translated.slug || translated.keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
      }
      
      // Preparar datos de traducción con estructura correcta del backend
      const translationPayload = {
        language: targetLangCode,
        title: translated.title,
        h1_title: translated.h1Title || translated.title,
        keyword: translated.keyword,
        content: translated.content,
        meta_description: translated.description || article.meta_description || '',
        objective_phrase: translated.objectivePhrase || article.objective_phrase || '',
        keywords_array: translated.keywords || article.keywords_array || [],
        slug: translated.slug || translated.keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, ''),
        seo_data: seoData,
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
        keyword: savedTranslation.seo_data?.focus_keyword || savedTranslation.keyword,
        objective_phrase: savedTranslation.objective_phrase,
        keywords_array: savedTranslation.keywords_array,
        meta_description: savedTranslation.seo_data?.meta_description || savedTranslation.meta_description,
        slug: savedTranslation.seo_data?.slug || savedTranslation.slug,
        content: savedTranslation.content,
        seo_data: savedTranslation.seo_data,
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

  return {
    handleLanguageChange,
    handleTranslate
  }
}
