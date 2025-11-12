/**
 * Servicio de Optimización Completa para Yoast SEO
 * ENVIA TODO EL ARTICULO A LA IA Y RECIBE EL ARTICULO MEJORADO
 */

import { optimizeForYoastSEO, validateYoastSEO } from '@/lib/utils/yoast-seo-optimizer'

export interface OptimizationIssue {
  type: 'yoast' | 'readability' | 'seo' | 'structure'
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  currentValue?: string | number
  expectedValue?: string | number
}

export interface OptimizationRequest {
  content: string
  keyword: string
  title: string
  metaDescription?: string
  language?: string
}

export interface OptimizationResult {
  optimizedContent: string
  issuesFixed: OptimizationIssue[]
  remainingIssues: OptimizationIssue[]
  improvements: {
    transitionWordsAdded: number
    sentencesShortened: number
    keywordsBolded: number
    paragraphsOptimized: number
    readabilityImproved: boolean
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
}

class CompleteOptimizerService {
  /**
   * Analiza el contenido y detecta problemas
   */
  async analyzeContent(request: OptimizationRequest): Promise<OptimizationIssue[]> {
    const issues: OptimizationIssue[] = []
    const { content, keyword } = request

    // Validación Yoast SEO
    const yoastValidation = validateYoastSEO(content, keyword)
    
    if (!yoastValidation.hasTransitionWords) {
      issues.push({
        type: 'yoast',
        severity: 'error',
        title: 'Palabras de transición',
        description: 'Ninguna de las frases contiene palabras de transición. Usa alguna.',
        currentValue: yoastValidation.transitionWordsCount,
        expectedValue: 'Al menos 3'
      })
    }

    if (!yoastValidation.sentenceLengthOk) {
      issues.push({
        type: 'yoast',
        severity: 'error',
        title: 'Longitud de las oraciones',
        description: `El ${yoastValidation.longSentencesPercentage.toFixed(1)}% de las oraciones contienen más de 20 palabras, lo que supera el máximo recomendado del 25%.`,
        currentValue: `${yoastValidation.longSentencesPercentage.toFixed(1)}%`,
        expectedValue: '≤25%'
      })
    }

    if (yoastValidation.boldKeywordsCount === 0) {
      issues.push({
        type: 'yoast',
        severity: 'warning',
        title: 'Keywords en negrita',
        description: 'No se encontraron palabras clave en negrita. Agrega **negritas** a palabras importantes.',
        currentValue: yoastValidation.boldKeywordsCount,
        expectedValue: 'Al menos 2-3'
      })
    }

    return issues
  }

  /**
   * Optimiza completamente el contenido ENVIANDO TODO EL ARTICULO A LA IA
   */
  async optimizeComplete(request: OptimizationRequest, modelId?: number): Promise<OptimizationResult> {
    const { content, keyword, title, metaDescription, language = 'es' } = request
    
    console.log('🎯 [COMPLETE-OPTIMIZER] Iniciando optimización completa...')
    console.log('🎯 [COMPLETE-OPTIMIZER] Contenido original:', content.length, 'caracteres')
    console.log('🎯 [COMPLETE-OPTIMIZER] Keyword:', keyword)
    
    // Analizar problemas actuales
    const initialIssues = await this.analyzeContent(request)
    const beforeStats = this.getContentStats(content, keyword)
    
    console.log('🎯 [COMPLETE-OPTIMIZER] Problemas detectados:', initialIssues.length)
    initialIssues.forEach(issue => {
      console.log(`  - ${issue.title}: ${issue.description}`)
    })
    
    // 🚀 ENVIAR TODO EL ARTICULO A LA IA
    let optimizedContent: string
    try {
      console.log('🤖 [AI-OPTIMIZATION] Enviando artículo completo a la IA...')
      
      const prompt = this.buildAIPrompt(content, keyword, title, initialIssues, language)
      
      // Usar fetch directo a la API de AI
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          modelId: modelId || 16, // gemini-2.5-flash-lite por defecto
          maxTokens: 4000
        })
      })
      
      if (!response.ok) {
        throw new Error(`Error en API: ${response.status}`)
      }
      
      const result = await response.json()
      optimizedContent = result.content || result.text || ''
      
      console.log('✅ [AI-OPTIMIZATION] IA respondió con:', optimizedContent.length, 'caracteres')
      
      if (!optimizedContent || optimizedContent.length < content.length * 0.5) {
        console.log('⚠️ [AI-OPTIMIZATION] Respuesta de IA muy corta, usando fallback')
        throw new Error('Respuesta de IA incompleta')
      }
      
    } catch (error) {
      console.error('❌ [AI-OPTIMIZATION] Error con IA:', error)
      console.log('🔄 [FALLBACK] Usando optimizaciones automáticas...')
      optimizedContent = optimizeForYoastSEO(content, keyword)
    }
    
    // Aplicar optimizaciones adicionales automáticas
    optimizedContent = optimizeForYoastSEO(optimizedContent, keyword)
    
    // Analizar resultados
    const afterStats = this.getContentStats(optimizedContent, keyword)
    const remainingIssues = await this.analyzeContent({
      ...request,
      content: optimizedContent
    })
    
    // Calcular mejoras
    const issuesFixed = initialIssues.filter(issue => 
      !remainingIssues.some(remaining => 
        remaining.title === issue.title && remaining.type === issue.type
      )
    )
    
    const improvements = {
      transitionWordsAdded: Math.max(0, afterStats.transitionWords - beforeStats.transitionWords),
      sentencesShortened: Math.max(0, beforeStats.longSentences - afterStats.longSentences),
      keywordsBolded: Math.max(0, afterStats.boldKeywords - beforeStats.boldKeywords),
      paragraphsOptimized: Math.max(0, optimizedContent.split('\n\n').length - content.split('\n\n').length),
      readabilityImproved: true
    }
    
    console.log('✅ [COMPLETE-OPTIMIZER] Optimización completada:')
    console.log('  - Contenido final:', optimizedContent.length, 'caracteres')
    console.log('  - Problemas solucionados:', issuesFixed.length)
    console.log('  - Mejoras:', improvements)
    
    return {
      optimizedContent,
      issuesFixed,
      remainingIssues,
      improvements,
      beforeStats,
      afterStats
    }
  }

  /**
   * Construye el prompt para enviar a la IA
   */
  private buildAIPrompt(
    content: string,
    keyword: string,
    title: string,
    issues: OptimizationIssue[],
    language: string
  ): string {
    const problemsList = issues.map(issue => 
      `- ${issue.title}: ${issue.description}`
    ).join('\n')

    return `🚨 OPTIMIZACIÓN YOAST SEO - MEJORAR ARTÍCULO EXISTENTE 🚨

⚠️ INSTRUCCIÓN CRÍTICA: DEBES DEVOLVER EL MISMO ARTÍCULO MEJORADO, NO CREAR UNO NUEVO

Tu tarea es OPTIMIZAR el artículo existente manteniendo:
✅ TODO el contenido original
✅ TODOS los títulos y subtítulos
✅ TODA la estructura HTML/Markdown
✅ TODO el significado y información

SOLO debes MEJORAR:
🎯 Agregar palabras de transición
🎯 Acortar oraciones largas
🎯 Poner keywords en **negrita**
🎯 Optimizar para Yoast SEO

ARTÍCULO ORIGINAL:
Título: "${title}"
Palabra clave: "${keyword}"
Idioma: ${language}

PROBLEMAS A SOLUCIONAR:
${problemsList}

📄 CONTENIDO COMPLETO A OPTIMIZAR:
${content}

🎯 TAREAS OBLIGATORIAS:

1. **PALABRAS DE TRANSICIÓN** (CRÍTICO):
   - Agrega palabras de transición al inicio de párrafos: "además", "por ejemplo", "sin embargo", "por lo tanto", "también", "asimismo"
   - Mínimo 5 palabras de transición diferentes
   - Distribúyelas naturalmente por todo el artículo

2. **LONGITUD DE ORACIONES** (CRÍTICO):
   - Divide TODAS las oraciones de más de 20 palabras
   - Usa puntos, comas y conectores para crear oraciones más cortas
   - Máximo 25% de oraciones pueden tener más de 20 palabras

3. **KEYWORDS EN NEGRITA** (IMPORTANTE):
   - Pon "${keyword}" en **negrita** al menos 2-3 veces
   - Agrega negritas a palabras importantes: **importante**, **esencial**, **mejor**, **útil**, **recomendado**
   - Máximo 2-3 negritas por párrafo

🚨 REGLAS ESTRICTAS:

❌ NO cambies el significado del contenido
❌ NO elimines información importante
❌ NO cambies la estructura de títulos
❌ NO uses palabras robóticas: "fascinante", "increíble", "asombroso"
❌ NO agregues contenido irrelevante

✅ SÍ mantén el tono profesional y natural
✅ SÍ conserva todos los subtítulos existentes
✅ SÍ mejora la fluidez y legibilidad
✅ SÍ aplica TODAS las optimizaciones de Yoast SEO

📝 FORMATO DE SALIDA:
Devuelve ÚNICAMENTE el contenido optimizado en el mismo formato que recibiste, sin explicaciones adicionales.

🔍 VERIFICACIÓN FINAL:
Antes de responder, verifica que:
- ✅ Hay palabras de transición en múltiples párrafos
- ✅ Las oraciones son más cortas (máximo 20 palabras)
- ✅ "${keyword}" está en negrita al menos 2 veces
- ✅ El contenido fluye naturalmente
- ✅ Se mantiene toda la información original

OPTIMIZA EL CONTENIDO AHORA:`
  }

  /**
   * Obtiene estadísticas del contenido
   */
  private getContentStats(content: string, keyword: string) {
    const yoastValidation = validateYoastSEO(content, keyword)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const longSentences = sentences.filter(sentence => {
      const words = sentence.trim().split(/\s+/)
      return words.length > 20
    }).length

    return {
      wordCount: content.split(/\s+/).length,
      transitionWords: yoastValidation.transitionWordsCount,
      longSentences,
      boldKeywords: yoastValidation.boldKeywordsCount
    }
  }
}

export const completeOptimizerService = new CompleteOptimizerService()
