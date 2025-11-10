/**
 * Humanizer Service
 * Convierte contenido generado por IA en texto más natural y humano
 * Uses API routes to avoid client-side API key issues
 */

import { TokenManager } from '@/lib/utils/token-manager'

interface HumanizeResult {
  content: string
  originalLength: number
  humanizedLength: number
  improvements: string[]
}

class HumanizerService {
  /**
   * Humanizar contenido de artículo
   */
  async humanizeContent(content: string, options?: {
    preserveMarkdown?: boolean
    tone?: 'professional' | 'casual' | 'friendly'
    targetAudience?: string
  }): Promise<HumanizeResult> {
    try {
      console.log('🤖➡️👤 Iniciando humanización de contenido...')

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          preserveMarkdown: options?.preserveMarkdown ?? true,
          tone: options?.tone ?? 'professional',
          targetAudience: options?.targetAudience ?? 'público general',
          streaming: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Humanization failed')
      }

      console.log('✅ Humanización completada')
      console.log(`   Original: ${result.data.originalLength} caracteres`)
      console.log(`   Humanizado: ${result.data.humanizedLength} caracteres`)
      console.log(`   Mejoras aplicadas: ${result.data.improvements.length}`)

      return result.data as HumanizeResult

    } catch (error: any) {
      console.error('❌ Error en humanización:', error)
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.')
      }
      
      throw new Error(`Error al humanizar contenido: ${error.message || 'Error desconocido'}`)
    }
  }

  /**
   * Humanizar solo un fragmento de texto
   */
  async humanizeFragment(text: string, maxLength: number = 500): Promise<string> {
    try {
      const result = await this.humanizeContent(text, { 
        preserveMarkdown: false,
        tone: 'casual'
      })
      
      return result.content.substring(0, maxLength)
    } catch (error) {
      console.error('Error humanizando fragmento:', error)
      throw error
    }
  }

  /**
   * Humanizar con STREAMING en tiempo real
   */
  async humanizeWithStreaming(
    content: string,
    onChunk: (chunk: string, accumulated: string) => void,
    options?: {
      preserveMarkdown?: boolean
      tone?: 'professional' | 'casual' | 'friendly'
      targetAudience?: string
    }
  ): Promise<HumanizeResult> {
    try {
      console.log('🤖➡️👤 Iniciando humanización con STREAMING...')

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          preserveMarkdown: options?.preserveMarkdown ?? true,
          tone: options?.tone ?? 'professional',
          targetAudience: options?.targetAudience ?? 'público general',
          streaming: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      // Process streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let humanizedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.chunk) {
                humanizedContent += parsed.chunk
                onChunk(parsed.chunk, humanizedContent)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Analyze improvements
      const improvements: string[] = []
      
      if (!humanizedContent.includes('Es importante destacar')) {
        improvements.push('Eliminadas frases robóticas comunes')
      }
      if (humanizedContent.split('...').length > 1) {
        improvements.push('Añadidos puntos suspensivos naturales')
      }
      if (humanizedContent.match(/\?\s/g)) {
        improvements.push('Incluidas preguntas retóricas')
      }
      if (!humanizedContent.includes('En primer lugar')) {
        improvements.push('Eliminadas transiciones artificiales')
      }
      
      const sentences = humanizedContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
      const lengths = sentences.map(s => s.trim().split(/\s+/).length)
      const variance = Math.max(...lengths) - Math.min(...lengths)
      if (variance > 10) {
        improvements.push('Variedad natural en longitud de frases')
      }

      console.log('✅ Humanización con streaming completada')

      return {
        content: humanizedContent,
        originalLength: content.length,
        humanizedLength: humanizedContent.length,
        improvements
      }

    } catch (error: any) {
      console.error('❌ Error en humanización con streaming:', error)
      throw new Error(`Error al humanizar contenido: ${error.message || 'Error desconocido'}`)
    }
  }

  /**
   * Construir prompt para humanizar y optimizar contenido
   */
  private buildHumanizePrompt(
    content: string,
    keyword: string,
    title: string,
    options?: {
      tone?: 'professional' | 'casual' | 'friendly'
      targetAudience?: string
    }
  ): string {
    const tone = options?.tone ?? 'friendly'
    const targetAudience = options?.targetAudience ?? 'viajeros y amantes de la naturaleza'
    
    return `Eres un escritor experto especializado en humanizar contenido generado por IA y optimizarlo para SEO.

Tu tarea es transformar el siguiente artículo para que suene completamente humano, natural y atractivo, mientras lo optimizas para SEO.

**Título del artículo:** ${title}
**Palabra clave principal:** ${keyword}
**Tono:** ${tone}
**Audiencia objetivo:** ${targetAudience}

**INSTRUCCIONES CRÍTICAS:**

1. **Humanización:**
   - Elimina COMPLETAMENTE cualquier frase robótica o cliché de IA
   - Varía la longitud y estructura de las oraciones
   - Usa lenguaje natural y conversacional
   - Incluye expresiones humanas como "bueno", "en mi experiencia", "vale la pena", etc.
   - Evita frases como: "Descubre", "Explora", "Sumérgete", "Te imaginas", "Absolutamente", "Es más que"

2. **Optimización SEO:**
   - Incluye la palabra clave "${keyword}" entre 5-7 veces de forma natural
   - Agrega 3-5 palabras o frases en **negrita** para mejorar legibilidad
   - Mantén EXACTAMENTE la misma estructura de encabezados (## H2, ### H3)
   - Asegura que el contenido tenga al menos 800 palabras

3. **Formato:**
   - Devuelve SOLO el contenido en formato Markdown
   - NO agregues explicaciones antes o después
   - NO agregues metadatos o comentarios
   - Mantén todos los encabezados y estructura original

**CONTENIDO A HUMANIZAR Y OPTIMIZAR:**

${content}

**IMPORTANTE:** Responde ÚNICAMENTE con el contenido humanizado en formato Markdown, sin ningún texto adicional.`
  }

  /**
   * 🚀 HUMANIZAR Y MEJORAR - Función COMPLETA con streaming y fallback
   * Usa el mismo endpoint que Step1, Step2, Step3 para consistencia
   */
  async humanizeAndOptimize(
    content: string,
    keyword: string,
    title: string,
    modelId: number,
    onProgress?: (step: string, progress: number) => void,
    onStreamingContent?: (chunk: string, accumulated: string) => void,
    options?: {
      tone?: 'professional' | 'casual' | 'friendly'
      targetAudience?: string
      onFallbackToNormal?: () => void
    }
  ): Promise<HumanizeResult & { seoIssuesFixed: number }> {
    try {
      console.log('🚀 [HUMANIZE] Iniciando HUMANIZACIÓN Y OPTIMIZACIÓN...')
      
      onProgress?.('Analizando contenido...', 10)

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      onProgress?.('Generando contenido mejorado...', 30)

      // Construir prompt de humanización
      const prompt = this.buildHumanizePrompt(content, keyword, title, options)
      console.log('📝 [HUMANIZE] Prompt construido, longitud:', prompt.length)

      // Intentar con streaming primero usando el mismo endpoint que Step1/Step2/Step3
      const streamingResponse = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt: prompt,
          temperature: 0.7
        })
      })

      // Detectar si streaming no está soportado
      const contentType = streamingResponse.headers.get('content-type')
      const isStreamSupported = contentType?.includes('text/event-stream')
      
      if (!streamingResponse.ok) {
        const errorData = await streamingResponse.json().catch(() => null)
        
        // Si el modelo no soporta streaming, usar método normal
        if (errorData?.error?.code === 'STREAMING_NOT_SUPPORTED' || !isStreamSupported) {
          console.log('⚠️ [HUMANIZE] Streaming no soportado, usando método normal...')
          options?.onFallbackToNormal?.()
          return await this.humanizeAndOptimizeNormal(
            content,
            keyword,
            title,
            modelId,
            onProgress,
            options
          )
        }
        
        throw new Error(errorData?.error?.message || `HTTP error! status: ${streamingResponse.status}`)
      }

      if (!isStreamSupported) {
        console.log('⚠️ [HUMANIZE] Respuesta no es stream, usando método normal...')
        options?.onFallbackToNormal?.()
        return await this.humanizeAndOptimizeNormal(
          content,
          keyword,
          title,
          modelId,
          onProgress,
          options
        )
      }

      if (!streamingResponse.body) {
        console.log('⚠️ [HUMANIZE] Sin body en respuesta, usando método normal...')
        options?.onFallbackToNormal?.()
        return await this.humanizeAndOptimizeNormal(
          content,
          keyword,
          title,
          modelId,
          onProgress,
          options
        )
      }

      onProgress?.('Recibiendo contenido optimizado...', 50)

      // Process streaming response (igual que Step1/2/3)
      const reader = streamingResponse.body.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let optimizedContent = ''
      let chunkCount = 0
      const startTime = Date.now()

      console.log('🔥 [HUMANIZE] INICIANDO STREAMING...')

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('✅ [HUMANIZE] Stream terminado')
          break
        }

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              console.log('🏁 [HUMANIZE] Recibido [DONE]')
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              // Detectar error en el stream
              if (parsed.error) {
                console.error('❌ [HUMANIZE] Error en stream:', parsed.error)
                console.log('⚠️ [HUMANIZE] Fallback a método normal...')
                options?.onFallbackToNormal?.()
                return await this.humanizeAndOptimizeNormal(
                  content,
                  keyword,
                  title,
                  modelId,
                  onProgress,
                  options
                )
              }
              
              if (parsed.chunk) {
                chunkCount++
                optimizedContent += parsed.chunk
                
                const progress = 50 + Math.min(40, (optimizedContent.length / (content.length * 1.5)) * 40)
                onProgress?.('Procesando contenido...', Math.round(progress))
                
                // Emitir chunk al callback para actualización en tiempo real
                if (onStreamingContent) {
                  onStreamingContent(parsed.chunk, optimizedContent)
                  
                  if (chunkCount % 5 === 0) {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
                    console.log(`📡 [HUMANIZE] Chunk #${chunkCount}: +${parsed.chunk.length} chars | Total: ${optimizedContent.length} chars | ${elapsed}s`)
                  }
                }
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('❌ [HUMANIZE] Error parseando:', e)
              }
              // Skip invalid JSON
            }
          }
        }
      }

      // Verificar si se recibió contenido
      if (optimizedContent.length === 0) {
        console.warn('⚠️ [HUMANIZE] No se recibió contenido vía streaming, usando método normal...')
        options?.onFallbackToNormal?.()
        return await this.humanizeAndOptimizeNormal(
          content,
          keyword,
          title,
          modelId,
          onProgress,
          options
        )
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`✅ [HUMANIZE] STREAMING COMPLETADO: ${chunkCount} chunks en ${totalTime}s | Total: ${optimizedContent.length} chars`)

      onProgress?.('Analizando mejoras aplicadas...', 95)

      // Analyze SEO improvements
      let seoIssuesFixed = 0
      const improvements: string[] = []
      
      const keywordCount = (optimizedContent.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      const originalKeywordCount = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      
      console.log(`🔍 Keyword "${keyword}": Original=${originalKeywordCount}, Optimizado=${keywordCount}`)
      
      if (keywordCount >= 5 && keywordCount <= 7) {
        improvements.push(`✅ Keyword aparece ${keywordCount} veces (óptimo: 5-7)`)
        if (originalKeywordCount > 7 || originalKeywordCount < 5) {
          seoIssuesFixed++
        }
      } else if (keywordCount > 7) {
        improvements.push(`⚠️ Keyword aparece ${keywordCount} veces (reduce a 5-7 para evitar keyword stuffing)`)
      } else if (keywordCount < 5) {
        improvements.push(`⚠️ Keyword aparece ${keywordCount} veces (aumenta a 5-7 para mejor SEO)`)
      }
      
      const boldCount = (optimizedContent.match(/\*\*[^*]+\*\*/g) || []).length
      const originalBoldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
      
      if (boldCount > originalBoldCount) {
        improvements.push(`Agregadas ${boldCount - originalBoldCount} palabras en negrita`)
        seoIssuesFixed++
      }
      
      const h2Count = (optimizedContent.match(/^## /gm) || []).length
      const originalH2Count = (content.match(/^## /gm) || []).length
      const h3Count = (optimizedContent.match(/^### /gm) || []).length
      const originalH3Count = (content.match(/^### /gm) || []).length
      
      if (h2Count === originalH2Count && h3Count === originalH3Count) {
        improvements.push(`✅ Estructura de encabezados respetada (${h2Count} H2, ${h3Count} H3)`)
        seoIssuesFixed++
      } else {
        improvements.push(`⚠️ Estructura modificada: H2 ${originalH2Count}→${h2Count}, H3 ${originalH3Count}→${h3Count}`)
      }
      
      const wordCount = optimizedContent.split(/\s+/).length
      const originalWordCount = content.split(/\s+/).length
      
      if (wordCount > originalWordCount) {
        improvements.push(`Contenido expandido (+${wordCount - originalWordCount} palabras)`)
        if (originalWordCount < 800 && wordCount >= 800) {
          seoIssuesFixed++
        }
      }
      
      const prohibitedWords = ['Descubre', 'Explora', 'Sumérgete', 'Te imaginas', 'Absolutamente', 'Es más que']
      const foundProhibited = prohibitedWords.filter(word => optimizedContent.includes(word))
      
      if (foundProhibited.length === 0) {
        improvements.push('✅ Sin palabras prohibidas de IA')
        seoIssuesFixed++
      } else {
        improvements.push(`⚠️ Palabras prohibidas encontradas: ${foundProhibited.join(', ')}`)
      }

      onProgress?.('Completado', 100)

      console.log('✅ Humanización y Optimización completada')
      console.log(`   Original: ${content.length} caracteres, ${originalWordCount} palabras`)
      console.log(`   Optimizado: ${optimizedContent.length} caracteres, ${wordCount} palabras`)
      console.log(`   Problemas SEO corregidos: ${seoIssuesFixed}`)
      console.log(`   Mejoras aplicadas: ${improvements.length}`)

      return {
        content: optimizedContent,
        originalLength: content.length,
        humanizedLength: optimizedContent.length,
        improvements,
        seoIssuesFixed
      }

    } catch (error: any) {
      console.error('❌ Error en humanización y optimización:', error)
      throw new Error(`Error al optimizar contenido: ${error.message || 'Error desconocido'}`)
    }
  }

  /**
   * 🔄 FALLBACK - Método normal sin streaming
   * Usa el mismo endpoint pero genera todo de una vez
   */
  private async humanizeAndOptimizeNormal(
    content: string,
    keyword: string,
    title: string,
    modelId: number,
    onProgress?: (step: string, progress: number) => void,
    options?: {
      tone?: 'professional' | 'casual' | 'friendly'
      targetAudience?: string
    }
  ): Promise<HumanizeResult & { seoIssuesFixed: number }> {
    try {
      console.log('🔄 [HUMANIZE-NORMAL] Iniciando método sin streaming...')
      
      onProgress?.('Generando contenido (sin streaming)...', 40)

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Construir mismo prompt
      const prompt = this.buildHumanizePrompt(content, keyword, title, options)

      // Usar API de generación normal (sin streaming)
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt: prompt,
          temperature: 0.7,
          maxTokens: 8192
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      onProgress?.('Procesando respuesta...', 70)

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Generation failed')
      }

      console.log('✅ [HUMANIZE-NORMAL] Contenido optimizado recibido')
      
      const optimizedContent = result.data?.text || result.data?.content || ''

      onProgress?.('Analizando mejoras aplicadas...', 90)

      // Analyze SEO improvements (mismo código)
      let seoIssuesFixed = 0
      const improvements: string[] = []
      
      const keywordCount = (optimizedContent.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      const originalKeywordCount = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      
      if (keywordCount >= 5 && keywordCount <= 7) {
        improvements.push(`✅ Keyword aparece ${keywordCount} veces (óptimo: 5-7)`)
        if (originalKeywordCount > 7 || originalKeywordCount < 5) {
          seoIssuesFixed++
        }
      }
      
      const boldCount = (optimizedContent.match(/\*\*[^*]+\*\*/g) || []).length
      const originalBoldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
      
      if (boldCount > originalBoldCount) {
        improvements.push(`Agregadas ${boldCount - originalBoldCount} palabras en negrita`)
        seoIssuesFixed++
      }
      
      const prohibitedWords = ['Descubre', 'Explora', 'Sumérgete', 'Te imaginas', 'Absolutamente', 'Es más que']
      const foundProhibited = prohibitedWords.filter(word => optimizedContent.includes(word))
      
      if (foundProhibited.length === 0) {
        improvements.push('✅ Sin palabras prohibidas de IA')
        seoIssuesFixed++
      }

      onProgress?.('Completado', 100)

      console.log('✅ [HUMANIZE-NORMAL] Optimización completada')
      console.log(`   Problemas SEO corregidos: ${seoIssuesFixed}`)

      return {
        content: optimizedContent,
        originalLength: content.length,
        humanizedLength: optimizedContent.length,
        improvements,
        seoIssuesFixed
      }

    } catch (error: any) {
      console.error('❌ [HUMANIZE-NORMAL] Error:', error)
      throw new Error(`Error al optimizar contenido: ${error.message || 'Error desconocido'}`)
    }
  }
}

export const humanizerService = new HumanizerService()
export type { HumanizeResult }
