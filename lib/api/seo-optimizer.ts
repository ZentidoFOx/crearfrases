/**
 * 🎯 SEO OPTIMIZER - Sistema Completo de Optimización SEO
 * Envía TODO el artículo del WYSIWYG editor a la IA para optimización completa
 */

import { aiService } from './ai-service'

export interface SEOOptimizationRequest {
  content: string
  keyword: string
  title: string
  metaDescription?: string
  language?: string
}

export interface SEOOptimizationResult {
  success: boolean
  optimizedContent: string
  improvements: {
    transitionWordsAdded: number
    sentencesShortened: number
    keywordsBolded: number
    seoIssuesFixed: number
  }
  beforeStats: {
    wordCount: number
    transitionWords: number
    longSentences: number
    boldKeywords: number
  }
  afterStats: {
    wordCount: number
    transitionWords: number
    longSentences: number
    boldKeywords: number
  }
  message: string
}

class SEOOptimizerService {
  /**
   * 🌍 Obtiene palabras de transición por idioma
   */
  private getTransitionWordsByLanguage(language: string): string[] {
    const transitionWords = {
      'es': [
        'además', 'por ejemplo', 'sin embargo', 'por lo tanto', 'también', 'asimismo',
        'en primer lugar', 'finalmente', 'por otra parte', 'en consecuencia',
        'no obstante', 'en cambio', 'por el contrario', 'en resumen', 'mientras tanto',
        'de hecho', 'en efecto', 'por supuesto', 'ciertamente', 'obviamente'
      ],
      'en': [
        'furthermore', 'for example', 'however', 'therefore', 'also', 'likewise',
        'first of all', 'finally', 'on the other hand', 'consequently',
        'nevertheless', 'instead', 'on the contrary', 'in summary', 'meanwhile',
        'in fact', 'indeed', 'of course', 'certainly', 'obviously', 'moreover',
        'additionally', 'specifically', 'particularly', 'especially'
      ],
      'fr': [
        'de plus', 'par exemple', 'cependant', 'par conséquent', 'aussi', 'de même',
        'tout d\'abord', 'finalement', 'd\'autre part', 'en conséquence',
        'néanmoins', 'au lieu de', 'au contraire', 'en résumé', 'pendant ce temps',
        'en fait', 'en effet', 'bien sûr', 'certainement', 'évidemment'
      ],
      'pt': [
        'além disso', 'por exemplo', 'no entanto', 'portanto', 'também', 'da mesma forma',
        'em primeiro lugar', 'finalmente', 'por outro lado', 'consequentemente',
        'não obstante', 'em vez disso', 'pelo contrário', 'em resumo', 'enquanto isso',
        'de fato', 'com efeito', 'claro', 'certamente', 'obviamente'
      ],
      'it': [
        'inoltre', 'per esempio', 'tuttavia', 'pertanto', 'anche', 'allo stesso modo',
        'prima di tutto', 'infine', 'd\'altra parte', 'di conseguenza',
        'tuttavia', 'invece', 'al contrario', 'in sintesi', 'nel frattempo',
        'infatti', 'in effetti', 'ovviamente', 'certamente', 'chiaramente'
      ],
      'de': [
        'außerdem', 'zum Beispiel', 'jedoch', 'daher', 'auch', 'ebenso',
        'zunächst', 'schließlich', 'andererseits', 'folglich',
        'dennoch', 'stattdessen', 'im Gegenteil', 'zusammenfassend', 'währenddessen',
        'tatsächlich', 'in der Tat', 'natürlich', 'sicherlich', 'offensichtlich'
      ]
    }
    
    return transitionWords[language as keyof typeof transitionWords] || transitionWords['es']
  }

  /**
   * 🎯 OPTIMIZACIÓN COMPLETA SEO
   * Envía TODO el contenido del editor a la IA
   */
  async optimizeArticle(request: SEOOptimizationRequest, modelId?: number): Promise<SEOOptimizationResult> {
    const { content, keyword, title, metaDescription, language = 'es' } = request
    
    console.log('🎯 [SEO-OPTIMIZER] Iniciando optimización SEO completa...')
    console.log('📄 [SEO-OPTIMIZER] Contenido original:', content.length, 'caracteres')
    console.log('🔑 [SEO-OPTIMIZER] Keyword:', keyword)
    console.log('📝 [SEO-OPTIMIZER] Título:', title)
    
    // Debug: buscar imágenes en el contenido original
    const imageRegex = /!\[([^\]]*)\]\([^)]+\)/g
    const originalImages = content.match(imageRegex) || []
    console.log('🖼️ [SEO-OPTIMIZER] Imágenes en contenido original:', originalImages)
    
    // Analizar estadísticas iniciales
    const beforeStats = this.analyzeContent(content, keyword, language)
    console.log('📊 [SEO-OPTIMIZER] Estadísticas iniciales:', beforeStats)
    
    try {
      // Construir prompt de optimización SEO
      const prompt = this.buildSEOPrompt(content, keyword, title, metaDescription, language)
      
      console.log('🤖 [SEO-OPTIMIZER] Enviando artículo completo a la IA...')
      console.log('📏 [SEO-OPTIMIZER] Tamaño del prompt:', prompt.length, 'caracteres')
      
      // Usar aiService para generar contenido optimizado
      let optimizedContent = await aiService.generateWithModel(prompt, modelId || 16, {
        temperature: 0.7,
        maxTokens: 4000
      })
      
      console.log('✅ [SEO-OPTIMIZER] IA respondió exitosamente')
      console.log('📄 [SEO-OPTIMIZER] Contenido optimizado:', optimizedContent.length, 'caracteres')
      
      // Validar respuesta de la IA
      if (!optimizedContent || optimizedContent.length < content.length * 0.3) {
        throw new Error('Respuesta de IA incompleta o muy corta')
      }
      
      // Limpiar respuesta de la IA (remover explicaciones extra)
      optimizedContent = this.cleanAIResponse(optimizedContent)
      
      // 🎯 APLICAR OPTIMIZACIONES AUTOMÁTICAS YOAST SEO (FALLBACK)
      console.log('🔧 [SEO-OPTIMIZER] Aplicando optimizaciones automáticas Yoast SEO...')
      const { optimizeForYoastSEO } = await import('@/lib/utils/yoast-seo-optimizer')
      optimizedContent = optimizeForYoastSEO(optimizedContent, keyword)
      console.log('✅ [SEO-OPTIMIZER] Optimizaciones automáticas aplicadas')
      
      // Debug: verificar imágenes en contenido optimizado
      const optimizedImages = optimizedContent.match(imageRegex) || []
      console.log('🖼️ [SEO-OPTIMIZER] Imágenes en contenido optimizado:', optimizedImages)
      
      // Verificar si las imágenes tienen el keyword en el alt
      const imagesWithKeyword = optimizedImages.filter(img => {
        const altMatch = img.match(/!\[([^\]]*)\]/)
        const altText = altMatch ? altMatch[1].toLowerCase() : ''
        return altText.includes(keyword.toLowerCase())
      })
      
      console.log('✅ [SEO-OPTIMIZER] Imágenes con keyword en alt:', imagesWithKeyword.length, 'de', optimizedImages.length)
      
      // Analizar estadísticas finales
      const afterStats = this.analyzeContent(optimizedContent, keyword, language)
      console.log('📊 [SEO-OPTIMIZER] Estadísticas finales:', afterStats)
      
      // Calcular mejoras
      const improvements = {
        transitionWordsAdded: Math.max(0, afterStats.transitionWords - beforeStats.transitionWords),
        sentencesShortened: Math.max(0, beforeStats.longSentences - afterStats.longSentences),
        keywordsBolded: Math.max(0, afterStats.boldKeywords - beforeStats.boldKeywords),
        seoIssuesFixed: this.calculateSEOIssuesFixed(beforeStats, afterStats)
      }
      
      console.log('🎉 [SEO-OPTIMIZER] Optimización completada exitosamente')
      console.log('📈 [SEO-OPTIMIZER] Mejoras aplicadas:', improvements)
      
      return {
        success: true,
        optimizedContent,
        improvements,
        beforeStats,
        afterStats,
        message: `✅ Optimización SEO completada: ${improvements.transitionWordsAdded} palabras de transición agregadas, ${improvements.sentencesShortened} oraciones acortadas, ${improvements.keywordsBolded} keywords en negrita.`
      }
      
    } catch (error) {
      console.error('❌ [SEO-OPTIMIZER] Error en optimización:', error)
      
      return {
        success: false,
        optimizedContent: content, // Devolver contenido original
        improvements: {
          transitionWordsAdded: 0,
          sentencesShortened: 0,
          keywordsBolded: 0,
          seoIssuesFixed: 0
        },
        beforeStats,
        afterStats: beforeStats,
        message: `❌ Error en optimización SEO: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }
  
  /**
   * 🏗️ Construye el prompt específico para optimización SEO
   */
  private buildSEOPrompt(
    content: string,
    keyword: string,
    title: string,
    metaDescription?: string,
    language: string = 'es'
  ): string {
    const languageNames = {
      'es': 'español',
      'en': 'inglés',
      'fr': 'francés',
      'pt': 'portugués',
      'it': 'italiano',
      'de': 'alemán'
    }
    
    const transitionWords = this.getTransitionWordsByLanguage(language)
    const languageName = languageNames[language as keyof typeof languageNames] || language
    
    return `Optimiza este contenido para Yoast SEO en ${languageName}. Mantén TODO el contenido original.

KEYWORD: "${keyword}"
IDIOMA: ${languageName}

TAREAS:
1. Agrega palabras de transición: ${transitionWords.slice(0, 6).join(', ')}
2. Divide oraciones largas (máximo 20 palabras cada una)
3. Pon "${keyword}" en **negrita** 2-3 veces
4. Si hay imágenes ![alt](url), agrega "${keyword}" en el alt

REGLAS:
- NO cambies el significado
- NO elimines información
- Mantén todos los tags HTML
- NO agregues palabras robóticas como: "importante", "esencial", "clave", "fundamental", "crucial"
- NO fuerces palabras que no estaban en el contenido original
- Devuelve solo el contenido optimizado

CONTENIDO:
${content}

Optimiza ahora:`
  }
  
  /**
   * 📊 Analiza el contenido y obtiene estadísticas
   */
  private analyzeContent(content: string, keyword: string, language: string = 'es') {
    // Contar palabras
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length
    
    // Contar oraciones
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const longSentences = sentences.filter(sentence => {
      const sentenceWords = sentence.trim().split(/\s+/)
      return sentenceWords.length > 20
    }).length
    
    // Contar palabras de transición según el idioma
    const transitionWords = this.getTransitionWordsByLanguage(language)
    
    let transitionCount = 0
    const lowerContent = content.toLowerCase()
    transitionWords.forEach(word => {
      const matches = lowerContent.match(new RegExp(`\\b${word.toLowerCase()}\\b`, 'g'))
      if (matches) transitionCount += matches.length
    })
    
    // Contar keywords en negrita
    const boldKeywords = (content.match(new RegExp(`\\*\\*[^*]*${keyword}[^*]*\\*\\*`, 'gi')) || []).length +
                        (content.match(new RegExp(`<strong[^>]*>[^<]*${keyword}[^<]*</strong>`, 'gi')) || []).length
    
    return {
      wordCount,
      transitionWords: transitionCount,
      longSentences,
      boldKeywords
    }
  }
  
  /**
   * 🧹 Limpia la respuesta de la IA
   */
  private cleanAIResponse(content: string): string {
    // Remover explicaciones comunes de la IA
    let cleaned = content
      .replace(/^.*?(?=<|#|\w)/s, '') // Remover texto antes del contenido
      .replace(/```html\s*/gi, '')
      .replace(/```markdown\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .trim()
    
    return cleaned
  }
  
  /**
   * 📈 Calcula cuántos problemas SEO se solucionaron
   */
  private calculateSEOIssuesFixed(before: any, after: any): number {
    let issuesFixed = 0
    
    // Palabras de transición mejoradas
    if (after.transitionWords > before.transitionWords) issuesFixed++
    
    // Oraciones largas reducidas
    if (after.longSentences < before.longSentences) issuesFixed++
    
    // Keywords en negrita agregadas
    if (after.boldKeywords > before.boldKeywords) issuesFixed++
    
    return issuesFixed
  }
}

export const seoOptimizerService = new SEOOptimizerService()
