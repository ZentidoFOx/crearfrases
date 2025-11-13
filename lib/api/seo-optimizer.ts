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
   * 🌍 Obtiene palabras de transición por idioma - LISTA COMPLETA PARA IA
   */
  private getTransitionWordsByLanguage(language: string): string[] {
    const transitionWords = {
      'es': [
        // Adición y continuidad
        'además', 'también', 'asimismo', 'igualmente', 'de la misma manera', 'del mismo modo',
        'por otra parte', 'por otro lado', 'a su vez', 'al mismo tiempo', 'paralelamente',
        
        // Ejemplos y aclaración
        'por ejemplo', 'es decir', 'en otras palabras', 'dicho de otro modo', 'específicamente',
        'particularmente', 'en concreto', 'como muestra', 'tal como', 'como se puede ver',
        
        // Contraste y oposición
        'sin embargo', 'no obstante', 'por el contrario', 'en cambio', 'a diferencia de',
        'mientras que', 'aunque', 'a pesar de', 'pese a', 'en contraste',
        
        // Causa y efecto
        'por lo tanto', 'en consecuencia', 'como resultado', 'debido a', 'gracias a',
        'por esta razón', 'por este motivo', 'de ahí que', 'así pues', 'por consiguiente',
        
        // Secuencia temporal
        'en primer lugar', 'en segundo lugar', 'posteriormente', 'a continuación', 'luego',
        'después', 'finalmente', 'por último', 'para concluir', 'mientras tanto',
        
        // Énfasis y confirmación
        'de hecho', 'en efecto', 'efectivamente', 'ciertamente', 'obviamente',
        'por supuesto', 'sin duda', 'claramente', 'evidentemente', 'indudablemente'
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
1. 📝 PALABRAS DE TRANSICIÓN YOAST SEO: 
   
   🚨 OBJETIVO CRÍTICO: Aumenta el uso de palabras de transición hasta que MÁS DEL 30% de tus frases las incluyan. Esto mejorará la fluidez del texto y te dará el semáforo verde en Yoast SEO.
   
   🎯 USA EXACTAMENTE ESTAS PALABRAS que Yoast SEO reconoce:
   
   ADICIÓN: además, asimismo, también, incluso, del mismo modo, de igual manera, igualmente, a continuación, aparte de eso, es más, cabe destacar que, por añadidura, sin olvidar que, sumado a ello
   
   CAUSA/EFECTO: por lo tanto, por consiguiente, en consecuencia, por eso, por esta razón, por ende, así que, de modo que, de ahí que, debido a que, dado que, por esta causa, en vista de ello, como resultado
   
   CONTRASTE: sin embargo, no obstante, aunque, en cambio, por otro lado, al contrario, mientras que, pese a ello, aun así, de todos modos, en oposición, en contraste, por el contrario, pero
   
   EJEMPLOS: por ejemplo, es decir, en otras palabras, o sea, concretamente, como muestra, tal como, específicamente, en particular, para ilustrar, dicho de otra manera
   
   SECUENCIA: primero, en primer lugar, luego, después, a continuación, más adelante, posteriormente, por último, finalmente, al principio, en segundo lugar, seguidamente, acto seguido
   
   SIMILITUD: del mismo modo, de manera similar, igualmente, así como, al igual que, tal como, de forma parecida, de igual modo
   
   CONCLUSIÓN: en conclusión, para concluir, en resumen, finalmente, por último, en definitiva, en síntesis, en pocas palabras, por ende, a modo de cierre, para terminar
   
   ÉNFASIS: sobre todo, especialmente, en especial, particularmente, cabe resaltar que, es importante destacar, lo más importante, sin duda, de hecho, ciertamente
   
   CONDICIÓN: si, en caso de que, siempre que, a menos que, con tal de que, mientras tanto, suponiendo que, en la medida en que
   
   ⚠️ CÁLCULO DEL 30%: Si tienes 20 oraciones, necesitas AL MENOS 6-7 oraciones con palabras de transición
   ⚠️ ESTRATEGIA: Agrega palabras como "además", "sin embargo", "por lo tanto", "en conclusión", "a continuación", "finalmente" al INICIO de párrafos
   
   📋 EJEMPLO CORRECTO:
   ❌ MAL (0% transición): "El Pantanal es un ecosistema único. Ofrece oportunidades de avistamiento. Los jaguares habitan aquí."
   ✅ BIEN (>30% transición): "Además, el Pantanal es un ecosistema único. Por lo tanto, ofrece oportunidades de avistamiento. Sin embargo, los jaguares habitan aquí."

2. ✂️ ORACIONES CORTAS: Divide oraciones largas (máximo 20 palabras cada una)

3. 💪 NEGRITAS: Pon ÚNICAMENTE "${keyword}" en <strong>negrita</strong> exactamente 2 veces en TODO el artículo

4. 🖼️ IMÁGENES: Si hay imágenes ![alt](url), agrega "${keyword}" en el alt

🚨 REGLAS ABSOLUTAS PARA NEGRITAS:
- SOLO estas 2 negritas permitidas: <strong>${keyword}</strong> y <strong>${keyword}</strong>
- NO pongas en negrita: "mejor", "útil", "importante", "esencial", "clave", "fundamental"
- NO pongas en negrita: "También", "Además", "Asimismo", "Por otra parte"
- NO pongas en negrita: ninguna palabra que NO sea exactamente "${keyword}"
- Si ves "${keyword}" ya en <strong>, NO agregues más negritas
- TOTAL MÁXIMO: 2 negritas de "${keyword}" en todo el texto

EJEMPLO CORRECTO:
❌ MAL: Los <strong>jaguares en el Pantanal</strong> representan uno de los <strong>espectáculos</strong> más <strong>codiciados</strong> de la vida <strong>salvaje</strong>.
✅ BIEN: Los <strong>${keyword}</strong> representan uno de los espectáculos más codiciados de la vida salvaje. Este ecosistema ofrece <strong>${keyword}</strong> únicos.

REGLAS GENERALES:
- NO cambies el significado
- NO elimines información
- Mantén todos los tags HTML
- NO agregues palabras robóticas
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
