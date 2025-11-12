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
   * 🎯 OPTIMIZACIÓN COMPLETA SEO
   * Envía TODO el contenido del editor a la IA
   */
  async optimizeArticle(request: SEOOptimizationRequest, modelId?: number): Promise<SEOOptimizationResult> {
    const { content, keyword, title, metaDescription, language = 'es' } = request
    
    console.log('🎯 [SEO-OPTIMIZER] Iniciando optimización SEO completa...')
    console.log('📄 [SEO-OPTIMIZER] Contenido original:', content.length, 'caracteres')
    console.log('🔑 [SEO-OPTIMIZER] Keyword:', keyword)
    console.log('📝 [SEO-OPTIMIZER] Título:', title)
    
    // Analizar estadísticas iniciales
    const beforeStats = this.analyzeContent(content, keyword)
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
      
      // Analizar estadísticas finales
      const afterStats = this.analyzeContent(optimizedContent, keyword)
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
    return `🎯 SEO OPTIMIZER - OPTIMIZACIÓN COMPLETA DE ARTÍCULO

⚠️ INSTRUCCIÓN CRÍTICA: Debes devolver el MISMO artículo pero OPTIMIZADO para SEO y legibilidad.

📋 INFORMACIÓN DEL ARTÍCULO:
• Título: "${title}"
• Palabra clave principal: "${keyword}"
• Meta descripción: "${metaDescription || 'No especificada'}"
• Idioma: ${language}

📄 CONTENIDO COMPLETO A OPTIMIZAR:
${content}

🎯 OPTIMIZACIONES OBLIGATORIAS:

1. 🔄 PALABRAS DE TRANSICIÓN (CRÍTICO):
   - Agrega palabras de transición al inicio de párrafos
   - Usa: "además", "por ejemplo", "sin embargo", "por lo tanto", "también", "asimismo", "en primer lugar", "finalmente"
   - Mínimo 6-8 palabras de transición en todo el artículo
   - Distribúyelas naturalmente

2. ✂️ LONGITUD DE ORACIONES (CRÍTICO):
   - Divide TODAS las oraciones de más de 20 palabras
   - Usa puntos, punto y coma, y conectores
   - Máximo 25% de oraciones pueden superar 20 palabras
   - Mantén fluidez natural

3. 🔥 KEYWORDS EN NEGRITA (IMPORTANTE):
   - Pon "${keyword}" en **negrita** 3-4 veces
   - Agrega negritas a palabras clave secundarias
   - Usa: **importante**, **esencial**, **mejor**, **útil**, **recomendado**, **clave**
   - 2-3 negritas por párrafo máximo

4. 📊 OPTIMIZACIÓN SEO ADICIONAL:
   - Mejora la densidad de keywords (1-2% del total)
   - Agrega sinónimos de la keyword principal
   - Optimiza la estructura de párrafos
   - Mejora la legibilidad general

🚨 REGLAS ESTRICTAS:

❌ PROHIBIDO:
• Cambiar el significado del contenido
• Eliminar información importante
• Modificar títulos H1, H2, H3 existentes
• Usar palabras robóticas: "fascinante", "increíble", "asombroso"
• Agregar contenido no relacionado
• Cambiar el tono del artículo

✅ OBLIGATORIO:
• Mantener TODA la información original
• Conservar la estructura HTML/Markdown
• Mejorar solo la legibilidad y SEO
• Usar lenguaje natural y profesional
• Aplicar TODAS las optimizaciones mencionadas

📝 FORMATO DE RESPUESTA:
Devuelve ÚNICAMENTE el contenido optimizado, sin explicaciones adicionales, comentarios o texto extra.

🔍 VERIFICACIÓN ANTES DE RESPONDER:
- ✅ Palabras de transición agregadas en múltiples párrafos
- ✅ Oraciones largas divididas apropiadamente  
- ✅ "${keyword}" en negrita al menos 3 veces
- ✅ Contenido fluye naturalmente
- ✅ Toda la información original preservada
- ✅ Estructura HTML/Markdown intacta

OPTIMIZA EL ARTÍCULO AHORA:`
  }
  
  /**
   * 📊 Analiza el contenido y obtiene estadísticas
   */
  private analyzeContent(content: string, keyword: string) {
    // Contar palabras
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length
    
    // Contar oraciones
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const longSentences = sentences.filter(sentence => {
      const sentenceWords = sentence.trim().split(/\s+/)
      return sentenceWords.length > 20
    }).length
    
    // Contar palabras de transición
    const transitionWords = [
      'además', 'por ejemplo', 'sin embargo', 'por lo tanto', 'también', 'asimismo',
      'en primer lugar', 'finalmente', 'por otra parte', 'en consecuencia',
      'no obstante', 'en cambio', 'por el contrario', 'en resumen'
    ]
    
    let transitionCount = 0
    const lowerContent = content.toLowerCase()
    transitionWords.forEach(word => {
      const matches = lowerContent.match(new RegExp(`\\b${word}\\b`, 'g'))
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
