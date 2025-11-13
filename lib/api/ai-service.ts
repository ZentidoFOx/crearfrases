/**
 * AI Service using Vercel AI SDK
 * Unified service for all AI operations through API routes
 */

import { TokenManager } from '@/lib/utils/token-manager'
import { 
  buildKeywordSuggestionsPrompt,
  buildTitleGenerationPrompt,
  buildOutlineGenerationPrompt,
  buildContentGenerationPrompt
} from '@/lib/prompts'
import { scanKeywordsInContent, generateKeywordInstructions } from '@/lib/utils/keyword-scanner'

export interface AIGenerateOptions {
  modelId?: number
  temperature?: number
  maxTokens?: number
}

class AIService {
  /**
   * Generate text using Next.js API route with Vercel AI SDK
   * All AI generation goes through /api/ai/generate route
   */
  async generateWithModel(
    prompt: string,
    modelId: number,
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): Promise<string> {
    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Call Next.js API route instead of PHP backend directly
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate text')
      }

      return data.data.content || ''
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to generate text')
    }
  }

  /**
   * Generate keyword suggestions using selected model
   */
  async generateKeywordSuggestions(
    baseKeyword: string,
    existingKeywords: string[],
    modelId: number
  ): Promise<string[]> {
    const prompt = buildKeywordSuggestionsPrompt({
      baseKeyword,
      existingKeywords
    })

    try {
      const response = await this.generateWithModel(prompt, modelId)
      
      // Parse response into array of suggestions
      const suggestions = response
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0 && !existingKeywords.includes(line.toLowerCase()))
      
      return suggestions.slice(0, 10)
    } catch (error) {
      throw error
    }
  }

  /**
   * Generate keyword suggestions with streaming using selected model
   * Returns true if streaming was successful, false if it should fallback to normal method
   */
  async generateKeywordSuggestionsStreaming(
    baseKeyword: string,
    existingKeywords: string[],
    modelId: number,
    onSuggestion: (suggestion: string) => void
  ): Promise<boolean> {
    const prompt = buildKeywordSuggestionsPrompt({
      baseKeyword,
      existingKeywords
    })

    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        
        // Si el modelo no soporta streaming, retornar false para usar método normal
        if (errorData?.error?.code === 'STREAMING_NOT_SUPPORTED') {
          console.log('⚠️ [STREAMING] Modelo no soporta streaming (error en respuesta)')
          return false
        }
        
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      // Verificar que sea un stream
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('text/event-stream')) {
        // Si no es un stream, probablemente es un error JSON
        const errorData = await response.json().catch(() => null)
        if (errorData?.error?.code === 'STREAMING_NOT_SUPPORTED') {
          console.log('⚠️ [STREAMING] Modelo no soporta streaming (content-type no es stream)')
          return false
        }
        console.log('⚠️ [STREAMING] Respuesta no es un stream, usando método normal')
        return false
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let contentBuffer = ''
      let processedKeywords = new Set<string>()

      if (!reader) {
        throw new Error('No reader available')
      }

      console.log('🔄 [STREAMING] Iniciando lectura del stream...')

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('✅ [STREAMING] Stream terminado')
          console.log('📝 [STREAMING] Buffer final:', contentBuffer)
          
          // Al terminar, procesar cualquier keyword restante en el buffer
          const finalKeywords = contentBuffer
            .split('\n')
            .map(kw => kw.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
            .filter(kw => {
              return kw.length > 5 && 
                     kw.length < 100 &&
                     !existingKeywords.includes(kw.toLowerCase()) &&
                     !processedKeywords.has(kw.toLowerCase())
            })

          console.log('🔍 [STREAMING] Keywords finales encontradas:', finalKeywords)

          for (const keyword of finalKeywords) {
            if (processedKeywords.size >= 10) break
            processedKeywords.add(keyword.toLowerCase())
            console.log('✨ [STREAMING] Emitiendo keyword final:', keyword)
            onSuggestion(keyword)
          }
          
          console.log('✅ [STREAMING] Total keywords emitidas:', processedKeywords.size)
          
          // Si no se emitió ninguna keyword, el modelo no soporta streaming correctamente
          if (processedKeywords.size === 0) {
            console.warn('⚠️ [STREAMING] No se recibieron keywords. El modelo no soporta streaming.')
            return false
          }
          
          // Streaming exitoso
          return true
        }

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.log('🏁 [STREAMING] Recibido [DONE]')
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              // Verificar si hay un error en el stream
              if (parsed.error) {
                console.error('❌ [STREAMING] Error en stream:', parsed.error)
                return false
              }
              
              if (parsed.chunk) {
                console.log('📦 [STREAMING] Chunk recibido:', parsed.chunk)
                contentBuffer += parsed.chunk
                console.log('📝 [STREAMING] Buffer actual:', contentBuffer.substring(0, 100) + '...')
                
                // Solo procesar líneas COMPLETAS (que terminan con \n)
                const allLines = contentBuffer.split('\n')
                console.log('📋 [STREAMING] Líneas en buffer:', allLines.length)
                
                // La última línea puede estar incompleta, la guardamos
                const incompleteLine = allLines.pop() || ''
                console.log('⏳ [STREAMING] Línea incompleta guardada:', incompleteLine)
                
                // Procesar solo líneas completas
                const completeKeywords = allLines
                  .map(kw => kw.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
                  .filter(kw => {
                    return kw.length > 5 && 
                           kw.length < 100 &&
                           !existingKeywords.includes(kw.toLowerCase()) &&
                           !processedKeywords.has(kw.toLowerCase())
                  })

                console.log('🔍 [STREAMING] Keywords completas encontradas:', completeKeywords)

                // Emitir keywords completas
                for (const keyword of completeKeywords) {
                  if (processedKeywords.size >= 10) {
                    console.log('🛑 [STREAMING] Límite de 10 keywords alcanzado')
                    break
                  }
                  processedKeywords.add(keyword.toLowerCase())
                  console.log('✨ [STREAMING] Emitiendo keyword:', keyword)
                  onSuggestion(keyword)
                }
                
                // Actualizar buffer con solo la línea incompleta
                contentBuffer = incompleteLine
                console.log('📝 [STREAMING] Nuevo buffer:', contentBuffer)
              }
            } catch (e) {
              // Si es un error real, lanzarlo
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('❌ [STREAMING] Error parseando:', e)
                return false
              }
              // Ignorar errores de parsing menores
              console.warn('⚠️ [STREAMING] Error de parsing menor ignorado:', e)
            }
          }
        }
      }
    } catch (error) {
      // Si hay un error de conexión u otro error, usar método normal
      console.error('❌ [STREAMING] Error en streaming:', error)
      return false
    }
  }

  /**
   * Generate titles with streaming using selected model
   * Returns true if streaming was successful, false if it should fallback to normal method
   */
  async generateTitlesStreaming(
    keyword: string,
    count: number,
    additionalKeywords: string,
    modelId: number,
    onTitle: (title: any) => void
  ): Promise<boolean> {
    const prompt = buildTitleGenerationPrompt({
      keyword,
      count,
      additionalKeywords
    })

    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (errorData?.error?.code === 'STREAMING_NOT_SUPPORTED') {
          console.log('⚠️ [STREAMING-TITLES] Modelo no soporta streaming')
          return false
        }
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('text/event-stream')) {
        console.log('⚠️ [STREAMING-TITLES] Respuesta no es un stream')
        return false
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let contentBuffer = ''
      let titlesEmitted = 0

      if (!reader) {
        throw new Error('No reader available')
      }

      console.log('🔄 [STREAMING-TITLES] Iniciando lectura del stream...')

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('✅ [STREAMING-TITLES] Stream terminado')
          
          // Intentar parsear JSON final si hay contenido
          if (contentBuffer.trim()) {
            try {
              const jsonMatch = contentBuffer.match(/\[[\s\S]*\]/)
              if (jsonMatch) {
                const titles = JSON.parse(jsonMatch[0])
                for (const title of titles) {
                  if (titlesEmitted >= count) break
                  console.log('✨ [STREAMING-TITLES] Emitiendo título final:', title.title)
                  onTitle(title)
                  titlesEmitted++
                }
              }
            } catch (e) {
              console.warn('⚠️ [STREAMING-TITLES] Error parseando JSON final')
            }
          }
          
          if (titlesEmitted === 0) {
            console.warn('⚠️ [STREAMING-TITLES] No se emitieron títulos')
            return false
          }
          
          console.log('✅ [STREAMING-TITLES] Total títulos emitidos:', titlesEmitted)
          return true
        }

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.log('🏁 [STREAMING-TITLES] Recibido [DONE]')
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.error) {
                console.error('❌ [STREAMING-TITLES] Error en stream:', parsed.error)
                return false
              }
              
              if (parsed.chunk) {
                contentBuffer += parsed.chunk
                console.log('📝 [STREAMING-TITLES] Buffer:', contentBuffer.length, 'caracteres')
                
                // Intentar extraer títulos individuales del buffer
                // Buscar objetos JSON completos {...}
                let startIdx = 0
                while (true) {
                  // Buscar el inicio de un objeto JSON
                  const objStart = contentBuffer.indexOf('{', startIdx)
                  if (objStart === -1) break
                  
                  // Buscar el final del objeto JSON
                  let braceCount = 0
                  let objEnd = -1
                  for (let i = objStart; i < contentBuffer.length; i++) {
                    if (contentBuffer[i] === '{') braceCount++
                    if (contentBuffer[i] === '}') {
                      braceCount--
                      if (braceCount === 0) {
                        objEnd = i + 1
                        break
                      }
                    }
                  }
                  
                  if (objEnd === -1) {
                    // Objeto incompleto, esperar más datos
                    break
                  }
                  
                  // Tenemos un objeto completo, intentar parsearlo
                  const objStr = contentBuffer.substring(objStart, objEnd)
                  try {
                    const titleObj = JSON.parse(objStr)
                    if (titleObj.title && titleObj.description) {
                      console.log('✨ [STREAMING-TITLES] Emitiendo título:', titleObj.title)
                      onTitle(titleObj)
                      titlesEmitted++
                      
                      // Remover el objeto procesado del buffer
                      contentBuffer = contentBuffer.substring(objEnd)
                      startIdx = 0
                    } else {
                      startIdx = objEnd
                    }
                  } catch (e) {
                    // Error parseando, seguir buscando
                    startIdx = objEnd
                  }
                  
                  if (titlesEmitted >= count) {
                    console.log('🛑 [STREAMING-TITLES] Límite alcanzado:', count)
                    break
                  }
                }
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('❌ [STREAMING-TITLES] Error parseando:', e)
                return false
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [STREAMING-TITLES] Error en streaming:', error)
      return false
    }
  }

  /**
   * Generate complete title suggestions with SEO data using selected model
   */
  async generateTitlesComplete(
    keyword: string,
    count: number,
    additionalKeywords: string,
    modelId: number
  ): Promise<any[]> {
    const prompt = buildTitleGenerationPrompt({
      keyword,
      count,
      additionalKeywords
    })

    try {
      const response = await this.generateWithModel(prompt, modelId)
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta')
      }
      
      const titles = JSON.parse(jsonMatch[0])
      
      // Add SEO scores to each title
      return titles.map((titleData: any) => ({
        ...titleData,
        seoScore: {
          keywordInDescription: titleData.description.toLowerCase().includes(keyword.toLowerCase()),
          keywordDensity: this.calculateKeywordDensity(titleData.title + ' ' + titleData.description, keyword),
          titleLength: titleData.title.length,
          descriptionLength: titleData.description.length,
          keywordInTitle: titleData.title.toLowerCase().includes(keyword.toLowerCase())
        }
      }))
    } catch (error) {
      throw error
    }
  }

  /**
   * Generate outline with streaming using selected model
   * Returns true if streaming was successful, false if it should fallback to normal method
   */
  async generateOutlineStreaming(
    title: string,
    keyword: string,
    numSections: number,
    detailLevel: 'basic' | 'medium' | 'advanced',
    modelId: number,
    onSection: (section: any) => void
  ): Promise<boolean> {
    const prompt = buildOutlineGenerationPrompt({
      title,
      keyword,
      numSections,
      detailLevel
    })

    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (errorData?.error?.code === 'STREAMING_NOT_SUPPORTED') {
          console.log('⚠️ [STREAMING-OUTLINE] Modelo no soporta streaming')
          return false
        }
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('text/event-stream')) {
        console.log('⚠️ [STREAMING-OUTLINE] Respuesta no es un stream')
        return false
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let contentBuffer = ''
      let sectionsEmitted = 0
      const processedSections = new Set<string>()

      if (!reader) {
        throw new Error('No reader available')
      }

      console.log('🔄 [STREAMING-OUTLINE] Iniciando lectura del stream...')

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('✅ [STREAMING-OUTLINE] Stream terminado')
          
          // Procesar líneas restantes en el buffer
          if (contentBuffer.trim()) {
            const lines = contentBuffer.split('\n').filter(line => line.trim())
            for (const line of lines) {
              const section = this.parseOutlineLine(line)
              if (section && !processedSections.has(section.title)) {
                console.log('✨ [STREAMING-OUTLINE] Emitiendo sección final:', section.title)
                processedSections.add(section.title)
                onSection(section)
                sectionsEmitted++
              }
            }
          }
          
          if (sectionsEmitted === 0) {
            console.warn('⚠️ [STREAMING-OUTLINE] No se emitieron secciones')
            return false
          }
          
          console.log('✅ [STREAMING-OUTLINE] Total secciones emitidas:', sectionsEmitted)
          return true
        }

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.log('🏁 [STREAMING-OUTLINE] Recibido [DONE]')
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.error) {
                console.error('❌ [STREAMING-OUTLINE] Error en stream:', parsed.error)
                return false
              }
              
              if (parsed.chunk) {
                contentBuffer += parsed.chunk
                
                // Procesar líneas completas
                const allLines = contentBuffer.split('\n')
                const incompleteLine = allLines.pop() || ''
                
                for (const completeLine of allLines) {
                  if (!completeLine.trim()) continue
                  
                  const section = this.parseOutlineLine(completeLine)
                  if (section && !processedSections.has(section.title)) {
                    console.log('✨ [STREAMING-OUTLINE] Emitiendo sección:', section.title)
                    processedSections.add(section.title)
                    onSection(section)
                    sectionsEmitted++
                  }
                }
                
                contentBuffer = incompleteLine
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('❌ [STREAMING-OUTLINE] Error parseando:', e)
                return false
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [STREAMING-OUTLINE] Error en streaming:', error)
      return false
    }
  }

  /**
   * Parse a single outline line into a section object
   */
  private parseOutlineLine(line: string): any | null {
    const trimmed = line.trim()
    if (!trimmed) return null
    
    let type: 'h2' | 'h3' | 'h4' | 'list' | 'numbered-list' = 'h2'
    let title = trimmed
    let paragraphs = 2
    let words = 60
    let items: number | undefined
    
    // Detect type
    if (trimmed.startsWith('#### ')) {
      type = 'h4'
      title = trimmed.replace(/^####\s*/, '')
      paragraphs = 1
      words = 30
    } else if (trimmed.startsWith('### ')) {
      type = 'h3'
      title = trimmed.replace(/^###\s*/, '')
      paragraphs = 2
      words = 50
    } else if (trimmed.startsWith('## ')) {
      type = 'h2'
      title = trimmed.replace(/^##\s*/, '')
      paragraphs = 3
      words = 80
    } else if (trimmed.match(/^\d+\./)) {
      type = 'numbered-list'
      title = trimmed.replace(/^\d+\.\s*/, '')
      items = 5
      paragraphs = 0
      words = 0
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      type = 'list'
      title = trimmed.replace(/^[-*]\s*/, '')
      items = 5
      paragraphs = 0
      words = 0
    }
    
    return {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      paragraphs,
      words,
      collapsed: false,
      items
    }
  }

  /**
   * Generate outline sections using selected model
   */
  async generateOutline(
    title: string,
    keyword: string,
    numSections: number,
    detailLevel: 'basic' | 'medium' | 'advanced',
    modelId: number
  ): Promise<Array<{
    id: string
    type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
    title: string
    paragraphs: number
    words: number
    collapsed: boolean
    items?: number
  }>> {
    const prompt = buildOutlineGenerationPrompt({
      title,
      keyword,
      numSections,
      detailLevel
    })

    try {
      const response = await this.generateWithModel(prompt, modelId, {
        temperature: 0.7,
        maxTokens: 2048
      })
      
      // Parse outline response
      const lines = response.split('\n').filter(line => line.trim())
      const outline: any[] = []
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        
        let type: 'h2' | 'h3' | 'h4' | 'list' | 'numbered-list' = 'h2'
        let title = trimmed
        let paragraphs = 2
        let characters = 300
        let items: number | undefined
        
        // Detect type
        if (trimmed.startsWith('#### ')) {
          type = 'h4'
          title = trimmed.replace(/^####\s*/, '')
          paragraphs = 1
          characters = 200
        } else if (trimmed.startsWith('### ')) {
          type = 'h3'
          title = trimmed.replace(/^###\s*/, '')
          paragraphs = 2
          characters = 300
        } else if (trimmed.startsWith('## ')) {
          type = 'h2'
          title = trimmed.replace(/^##\s*/, '')
          paragraphs = 3
          characters = 450
        } else if (trimmed.startsWith('[LIST]')) {
          type = 'list'
          title = trimmed.replace(/^\[LIST\]\s*/, '')
          paragraphs = 0
          characters = 150
          items = 5
        } else if (trimmed.startsWith('[NUMBERED-LIST]')) {
          type = 'numbered-list'
          title = trimmed.replace(/^\[NUMBERED-LIST\]\s*/, '')
          paragraphs = 0
          characters = 150
          items = 5
        } else {
          continue // Skip unrecognized lines
        }
        
        outline.push({
          id: `section-${Date.now()}-${outline.length}`,
          type,
          title,
          paragraphs,
          characters,
          collapsed: false,
          items
        })
      }
      
      return outline
    } catch (error) {
      throw error
    }
  }

  /**
   * @deprecated Este metodo genera contenido completo de una vez.
   * El sistema actual usa generateSingleSection() seccion por seccion.
   * Esta funcion se mantiene solo para compatibilidad con codigo antiguo.
   * 
   * Generate article content with streaming
   * Returns true if streaming was successful, false if it should fallback to normal method
   */
  async generateContentStreaming(
    title: string,
    keyword: string,
    introParagraphs: number,
    outline: Array<{
      id: string
      type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image' | 'faq'
      title: string
      paragraphs: number
      words: number
      items?: number
      contentType?: 'paragraphs' | 'list' | 'numbered-list'
      faqType?: 'ol' | 'ul'
      faqHeadingLevel?: 'h2' | 'h3'
      faqItems?: string[]
      faqBeforeText?: string
      faqAfterText?: string
    }>,
    modelId: number,
    onChunk: (chunk: string) => void
  ): Promise<boolean> {
    const prompt = buildContentGenerationPrompt({
      title,
      keyword,
      introParagraphs,
      outline
    })

    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (errorData?.error?.code === 'STREAMING_NOT_SUPPORTED') {
          console.log('⚠️ [STREAMING-CONTENT] Modelo no soporta streaming')
          return false
        }
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('text/event-stream')) {
        console.log('⚠️ [STREAMING-CONTENT] Respuesta no es un stream')
        return false
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let totalContent = ''

      if (!reader) {
        throw new Error('No reader available')
      }

      console.log('🔄 [STREAMING-CONTENT] Iniciando lectura del stream...')

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('✅ [STREAMING-CONTENT] Stream terminado')
          console.log('📝 [STREAMING-CONTENT] Total contenido generado:', totalContent.length, 'caracteres')
          
          if (totalContent.length === 0) {
            console.warn('⚠️ [STREAMING-CONTENT] No se generó contenido')
            return false
          }
          
          return true
        }

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.log('🏁 [STREAMING-CONTENT] Recibido [DONE]')
              continue
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.error) {
                console.error('❌ [STREAMING-CONTENT] Error en stream:', parsed.error)
                return false
              }
              
              if (parsed.chunk) {
                totalContent += parsed.chunk
                console.log('📦 [STREAMING-CONTENT] Chunk recibido:', parsed.chunk.substring(0, 50) + '...')
                onChunk(parsed.chunk)
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('❌ [STREAMING-CONTENT] Error parseando:', e)
                return false
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [STREAMING-CONTENT] Error en streaming:', error)
      return false
    }
  }

  /**
   * @deprecated Este metodo genera contenido completo de una vez.
   * El sistema actual usa generateSingleSection() seccion por seccion.
   * Esta funcion se mantiene solo para compatibilidad con codigo antiguo.
   * 
   * Generate complete article content using selected model
   */
  async generateContent(
    title: string,
    keyword: string,
    introParagraphs: number,
    outline: Array<{
      id: string
      type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image' | 'faq'
      title: string
      paragraphs: number
      words: number
      items?: number
      contentType?: 'paragraphs' | 'list' | 'numbered-list'
      faqType?: 'ol' | 'ul'
      faqHeadingLevel?: 'h2' | 'h3'
      faqItems?: string[]
      faqBeforeText?: string
      faqAfterText?: string
    }>,
    modelId: number
  ): Promise<{
    introduction: string
    sections: Array<{
      heading: string
      content: string
      order: number
    }>
    conclusion: string
    fullContent: string
  }> {
    const prompt = buildContentGenerationPrompt({
      title,
      keyword,
      introParagraphs,
      outline
    })

    try {
      const response = await this.generateWithModel(prompt, modelId, {
        temperature: 0.7,
        maxTokens: 8192
      })
      
      // Parse the response to extract sections
      const sections: Array<{ heading: string; content: string; order: number }> = []
      let introduction = ''
      let conclusion = ''
      
      // Split by H2 headers
      const parts = response.split(/(?=^## )/m)
      
      // First part is introduction
      if (parts.length > 0) {
        introduction = parts[0].trim()
      }
      
      // Parse sections
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim()
        const headingMatch = part.match(/^## (.+)$/m)
        if (headingMatch) {
          sections.push({
            heading: headingMatch[1],
            content: part,
            order: i - 1
          })
        }
      }
      
      return {
        introduction,
        sections,
        conclusion: '',
        fullContent: response
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Generate a single section of content with subsections
   */
  async generateSingleSection(
    title: string,
    keyword: string,
    sectionOutline: {
      id: string
      type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image' | 'faq'
      title: string
      paragraphs: number
      words: number
      items?: number
      contentType?: 'paragraphs' | 'list' | 'numbered-list'
      faqType?: 'ol' | 'ul'
      faqHeadingLevel?: 'h2' | 'h3'
      faqItems?: string[]
      faqBeforeText?: string
      faqAfterText?: string
    },
    previousContext: string,
    modelId: number,
    subsections?: Array<{
      type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image' | 'faq'
      title: string
      paragraphs: number
      words: number
      items?: number
      contentType?: 'paragraphs' | 'list' | 'numbered-list'
      faqType?: 'ol' | 'ul'
      faqHeadingLevel?: 'h2' | 'h3'
      faqItems?: string[]
      faqBeforeText?: string
      faqAfterText?: string
    }>,
    detailLevel: 'basic' | 'medium' | 'advanced' = 'medium'
  ): Promise<string> {
    
    // 🔍 USAR SISTEMA ROBUSTO DE ESCANEO
    const keywordScan = scanKeywordsInContent(previousContext, keyword, sectionOutline.title)
    const keywordInstructions = generateKeywordInstructions(keywordScan, keyword)
    
    console.log(`🔍 [AI-SERVICE] Sistema robusto activado para: ${sectionOutline.title}`)
    console.log(`🔍 [AI-SERVICE] Keywords actuales: ${keywordScan.totalKeywords}/6`)
    console.log(`🔍 [AI-SERVICE] Severidad: ${keywordInstructions.severity}`)
    // Log para debugging
    console.log('🎯 [GENERATE-SECTION] Generando:', sectionOutline.title)
    console.log('🎯 [GENERATE-SECTION] Nivel de detalle:', detailLevel)
    console.log('🎯 [GENERATE-SECTION] Tipo de contenido:', sectionOutline.contentType || 'paragraphs')
    if (sectionOutline.contentType === 'list' || sectionOutline.contentType === 'numbered-list') {
      console.log('🎯 [GENERATE-SECTION] Items en lista:', sectionOutline.items || 5)
    }
    console.log('🎯 [GENERATE-SECTION] Subsecciones:', subsections?.length || 0)
    if (subsections && subsections.length > 0) {
      console.log('🎯 [GENERATE-SECTION] Subsecciones detalle:', subsections.map(s => `${s.type}: ${s.title} (content: ${s.contentType || 'paragraphs'})`))
    }

    // Configuración según nivel de detalle
    const detailConfig = {
      basic: {
        targetWords: 150,
        allowH3: false,
        allowH4: false,
        structure: 'Solo H2',
        maxTokens: 1024
      },
      medium: {
        targetWords: 250,
        allowH3: true,
        allowH4: false,
        structure: 'H2 + H3',
        maxTokens: 2048
      },
      advanced: {
        targetWords: 350,
        allowH3: true,
        allowH4: true,
        structure: 'H2 + H3 + H4',
        maxTokens: 3072
      }
    }[detailLevel]

    // Filtrar subsecciones según el nivel de detalle
    let filteredSubsections = subsections || []
    if (!detailConfig.allowH3) {
      // Nivel básico: eliminar todas las subsecciones
      filteredSubsections = []
    } else if (!detailConfig.allowH4) {
      // Nivel medio: solo permitir H3, eliminar H4
      filteredSubsections = subsections?.filter(s => s.type === 'h3') || []
    }
    // Nivel avanzado: permitir todas las subsecciones (H3 y H4)

    // Determinar el tipo de contenido principal de la sección
    const mainContentType = sectionOutline.contentType || 'paragraphs'
    const mainHasLists = mainContentType === 'list' || mainContentType === 'numbered-list'
    const isFAQ = sectionOutline.type === 'faq' || sectionOutline.faqHeadingLevel // Detectar FAQs manuales también
    
    // Construir estructura detallada de subsecciones para el prompt
    let subsectionsStructure = ''
    if (filteredSubsections.length > 0) {
      subsectionsStructure = '\n**ESTRUCTURA OBLIGATORIA - DEBES INCLUIR TODAS ESTAS SUBSECCIONES:**\n\n'
      
      // Instrucciones para contenido principal
      if (mainHasLists) {
        const listType = mainContentType === 'list' ? 'con viñetas (-)' : 'numerada (1., 2., 3.)'
        const hasParagraphs = sectionOutline.paragraphs > 0
        
        if (hasParagraphs) {
          subsectionsStructure += `1. Primero escribe ${sectionOutline.paragraphs} párrafo(s) introductorio(s) sobre "${sectionOutline.title}"\n`
          subsectionsStructure += `   Luego incluye una lista ${listType} con ${sectionOutline.items || 5} elementos sobre el tema\n\n`
        } else {
          subsectionsStructure += `1. Genera SOLO una lista ${listType} con ${sectionOutline.items || 5} elementos sobre "${sectionOutline.title}"\n`
          subsectionsStructure += `   NO escribas párrafos introductorios, SOLO la lista\n\n`
        }
      } else {
        subsectionsStructure += `1. Primero escribe ${sectionOutline.paragraphs} parrafos introductorios sobre "${sectionOutline.title}"\n\n`
      }
      
      subsectionsStructure += `2. Luego DEBES incluir TODAS estas ${filteredSubsections.length} subsecciones en este orden exacto:\n\n`
      
      filteredSubsections.forEach((sub, idx) => {
        const prefix = sub.type === 'h3' ? '###' : '####'
        const subContentType = sub.contentType || 'paragraphs'
        const subHasLists = subContentType === 'list' || subContentType === 'numbered-list' || sub.type === 'list' || sub.type === 'numbered-list'
        
        subsectionsStructure += `   ${idx + 1}. ${prefix} ${sub.title}\n`
        
        if (subHasLists) {
          const listType = (subContentType === 'list' || sub.type === 'list') ? 'con viñetas (-)' : 'numerada (1., 2., 3.)'
          const hasSubParagraphs = sub.paragraphs > 0
          
          if (hasSubParagraphs) {
            subsectionsStructure += `      - Escribe ${sub.paragraphs} párrafo(s) introductorio(s)\n`
            subsectionsStructure += `      - IMPORTANTE: Incluye una lista ${listType} con ${sub.items || 5} elementos\n`
          } else {
            subsectionsStructure += `      - Genera SOLO una lista ${listType} con ${sub.items || 5} elementos\n`
            subsectionsStructure += `      - NO escribas párrafos, SOLO la lista\n`
          }
        } else {
          subsectionsStructure += `      - Escribe ${sub.paragraphs} parrafos completos\n`
        }
        subsectionsStructure += '\n'
      })
      subsectionsStructure += `\nCRITICO: Debes generar TODAS las ${filteredSubsections.length} subsecciones listadas arriba. NO omitas ninguna.\n`
    } else if (mainHasLists) {
      // Solo contenido principal con listas, sin subsecciones
      const listType = mainContentType === 'list' ? 'con viñetas (-)' : 'numerada (1., 2., 3.)'
      const hasParagraphs = sectionOutline.paragraphs > 0
      
      subsectionsStructure = `\n**ESTRUCTURA DEL CONTENIDO:**\n\n`
      
      if (hasParagraphs) {
        subsectionsStructure += `1. Escribe ${sectionOutline.paragraphs} párrafo(s) introductorio(s) sobre "${sectionOutline.title}"\n`
        subsectionsStructure += `2. Incluye una lista ${listType} con ${sectionOutline.items || 5} elementos detallados sobre el tema\n`
        subsectionsStructure += `3. Cada elemento de la lista debe ser informativo y relevante\n\n`
      } else {
        subsectionsStructure += `1. Genera SOLO una lista ${listType} con ${sectionOutline.items || 5} elementos sobre "${sectionOutline.title}"\n`
        subsectionsStructure += `2. NO escribas párrafos introductorios\n`
        subsectionsStructure += `3. SOLO la lista con elementos informativos y relevantes\n`
        subsectionsStructure += `4. Cada elemento debe ser completo y detallado (${sectionOutline.words || 30}-${(sectionOutline.words || 30) + 20} palabras por elemento)\n\n`
      }
    } else if (isFAQ) {
      // Verificar si es una FAQ manual (tiene faqItems configuradas)
      if (sectionOutline.faqHeadingLevel && sectionOutline.faqItems && sectionOutline.faqItems.length > 0) {
        // FAQ MANUAL - Generar contenido directamente sin IA
        console.log(`🔒 [FAQ-MANUAL] Detectada FAQ manual con ${sectionOutline.faqItems.length} preguntas`)
        
        const headingPrefix = sectionOutline.faqHeadingLevel === 'h2' ? '## ' : '### '
        let faqContent = `${headingPrefix}${sectionOutline.title}\n\n`
        
        // Agregar párrafo antes si existe
        if (sectionOutline.faqBeforeText && sectionOutline.faqBeforeText.trim()) {
          faqContent += `${sectionOutline.faqBeforeText.trim()}\n\n`
        }
        
        // Agregar lista de preguntas
        sectionOutline.faqItems.forEach((question, idx) => {
          if (sectionOutline.faqType === 'ol') {
            faqContent += `${idx + 1}. ${question}\n`
          } else {
            faqContent += `- ${question}\n`
          }
        })
        
        // Agregar párrafo después si existe
        if (sectionOutline.faqAfterText && sectionOutline.faqAfterText.trim()) {
          faqContent += `\n${sectionOutline.faqAfterText.trim()}`
        }
        
        console.log(`✅ [FAQ-MANUAL] Contenido generado directamente (${faqContent.length} caracteres)`)
        return faqContent.trim()
      } else {
        // FAQ automática - usar IA
        const faqListType = sectionOutline.faqType === 'ol' ? 'numerada (1., 2., 3.)' : 'con viñetas (-)'
        
        subsectionsStructure = `\n**ESTRUCTURA ESPECÍFICA PARA FAQs:**\n\n`
        subsectionsStructure += `1. Escribe ${sectionOutline.paragraphs} párrafo(s) introductorio(s) sobre "${sectionOutline.title}"\n`
        subsectionsStructure += `2. Incluye una lista ${faqListType} con ${sectionOutline.items || 5} preguntas frecuentes\n`
        subsectionsStructure += `3. Cada pregunta debe ser específica y relevante al tema "${keyword}"\n`
        subsectionsStructure += `4. Después de la lista, escribe ${sectionOutline.paragraphs} párrafo(s) de cierre/conclusión\n`
        subsectionsStructure += `5. Estructura: Título → Párrafo intro → Lista de preguntas → Párrafo conclusión\n\n`
        subsectionsStructure += `**FORMATO DE LAS PREGUNTAS:**\n`
        subsectionsStructure += `- Cada pregunta debe empezar con "¿" y terminar con "?"\n`
        subsectionsStructure += `- Las preguntas deben ser naturales y que la gente realmente haría\n`
        subsectionsStructure += `- Relacionadas directamente con "${keyword}" y "${sectionOutline.title}"\n\n`
      }
    }

    const prompt = `Eres un escritor profesional de contenido SEO en español. Debes generar el contenido COMPLETO para una sección de un artículo.

**Información del Artículo:**
- Título del artículo: ${title}
- Keyword principal: ${keyword}

**Sección Principal:**
- Título: ${sectionOutline.title}
- Tipo: ${sectionOutline.type}
- Nivel de detalle: ${detailConfig.structure}
- LONGITUD OBJETIVO: ~${detailConfig.targetWords} palabras MÁXIMO
${subsectionsStructure}
${previousContext ? `\n**CONTEXTO OBLIGATORIO - LEE PARA CONTINUIDAD:**\n${previousContext}\n\n⚠️ **IMPORTANTE:** NO repitas información del contexto anterior. Esta sección debe AVANZAR la conversación con información NUEVA y ESPECÍFICA sobre "${sectionOutline.title}".\n` : ''}

🚨🚨🚨 PROHIBIDO ABSOLUTO - LEE ANTES DE ESCRIBIR 🚨🚨🚨

❌❌❌ NUNCA NUNCA NUNCA empieces con:
- "¿Sueñas con..."
- "¿Anhelas..."
- "¿Te imaginas..."
- "¿Alguna vez has pensado..."
- "Descubre el fascinante..."
- "Sumérgete en..."
- "Embárcate en..."
- "Adéntrate en..."

Si usas cualquiera de estas frases = FALLO TOTAL

✅ EMPIEZA DIRECTAMENTE ASÍ (ESPECÍFICO PARA ESTA SECCIÓN):

Si es sobre PREPARATIVOS: "Los preparativos esenciales incluyen..."
Si es sobre COMPORTAMIENTO: "Los jaguares muestran patrones de actividad..."
Si es sobre EQUIPOS: "El equipo adecuado marca la diferencia..."
Si es sobre UBICACIONES: "Ciertas áreas del Pantanal ofrecen..."
Si es sobre SEGURIDAD: "Las medidas de seguridad requieren..."

⚠️ NO uses frases genéricas como "La observación de jaguares..."

**INSTRUCCIONES CRITICAS - DEBES SEGUIRLAS EXACTAMENTE:**

0. **CONTINUIDAD OBLIGATORIA:** Esta sección debe conectar lógicamente con las anteriores. NO repitas información ya mencionada. Desarrolla aspectos NUEVOS y ESPECÍFICOS del tema.

1. NO escribas el titulo H2 de la seccion principal (##) - YA esta incluido en el sistema
${mainHasLists && sectionOutline.paragraphs === 0 ? `2. Comienza DIRECTAMENTE con la lista ${mainContentType === 'list' ? 'con viñetas (-)' : 'numerada (1., 2., 3.)'} - NO ESCRIBAS PARRAFOS
3. La lista debe tener EXACTAMENTE ${sectionOutline.items || 5} elementos sobre "${sectionOutline.title}"
4. Cada elemento debe ser detallado y completo (${sectionOutline.words || 30}-${(sectionOutline.words || 30) + 20} palabras por elemento)` : `2. Comienza DIRECTAMENTE con ${sectionOutline.paragraphs || 1} parrafos introductorios sobre "${sectionOutline.title}"
   - NO repitas "La observación de jaguares en su hábitat" si ya se mencionó antes
   - Enfoca en aspectos ESPECÍFICOS de esta sección
   - Usa transiciones naturales como "Ahora que conoces...", "Una vez que...", "Para lograr..."
   - MANTÉN PÁRRAFOS CORTOS: Máximo 80 palabras por párrafo
   - DIVIDE párrafos largos en 2-3 párrafos más cortos
   - EJEMPLOS ESPECÍFICOS por sección:
     * Preparativos: "Los elementos esenciales para tu expedición incluyen..."
     * Comportamiento: "Estos felinos exhiben comportamientos característicos..."
     * Equipos: "El equipo especializado debe considerar..."
     * Ubicaciones: "Las mejores zonas de avistamiento se caracterizan por..."
${mainHasLists ? `3. Despues de los parrafos introductorios, incluye una lista ${mainContentType === 'list' ? 'con viñetas (-)' : 'numerada (1., 2., 3.)'} con ${sectionOutline.items || 5} elementos` : ''}`}
${filteredSubsections.length > 0 ? `${mainHasLists && sectionOutline.paragraphs === 0 ? '5' : mainHasLists ? '4' : '3'}. Despues ${mainHasLists ? 'de la lista' : 'de los parrafos introductorios'}, DEBES incluir TODAS las subsecciones especificadas arriba` : !mainHasLists ? '3. NO incluyas subsecciones H3 o H4 - Solo escribe los párrafos introductorios' : mainHasLists && sectionOutline.paragraphs === 0 ? '5. NO incluyas subsecciones H3 o H4 - Solo la lista especificada' : ''}
${filteredSubsections.length > 0 ? `${mainHasLists ? '5' : '4'}. CADA subseccion DEBE tener:
   - Su titulo con ### (H3) ${detailConfig.allowH4 ? 'o #### (H4)' : 'SOLAMENTE'} segun corresponda
   - El numero exacto de parrafos indicado
   - Las listas si se especifican (con el numero exacto de elementos)` : ''}
${filteredSubsections.length > 0 ? `${mainHasLists ? '6' : '5'}. NO omitas ninguna subseccion - Genera TODO el contenido completo` : ''}
${mainHasLists ? '7' : '6'}. NO inventes subsecciones adicionales - Solo las que estan listadas${!detailConfig.allowH3 ? ' (NINGUNA en nivel básico)' : ''}
${mainHasLists ? '8' : '7'}. RESTRICCIÓN DE LONGITUD: Genera APROXIMADAMENTE ${detailConfig.targetWords} palabras TOTAL. NO escribas más de lo necesario.
${mainHasLists ? '9' : '8'}. **🚨 CONTROL ROBUSTO DE KEYWORD (MÁX 6 EN TODO EL ARTÍCULO):**
   ${keywordInstructions.instruction}
${mainHasLists ? '10' : '9'}. **🚨 ALTERNATIVAS OBLIGATORIAS:**
   ${keywordInstructions.alternatives.slice(0, 8).map(alt => `- "${alt}"`).join('\n   ')}
${mainHasLists ? '11' : '10'}. Escribe en español con tono profesional pero accesible, siendo CONCISO
${mainHasLists ? '12' : '11'}. Separa SIEMPRE parrafos con doble salto de linea

**FORMATO MARKDOWN ESTRICTO (react-markdown + remark-gfm + rehype-raw):**
- USAR **Negrita** con doble asterisco (NO usar <strong>)
- USAR *Cursiva* con un asterisco (NO usar <em>)
- USAR ### Titulo con linea vacia antes (NO usar <h3>)
- SEPARAR parrafos con doble salto de linea
- LISTAS: Linea vacia antes, luego "- item"
- LISTAS NUMERADAS: Linea vacia antes, luego "1. item"
- ENLACES: [texto](url) (NO usar <a href>)
- NO uses HTML crudo (<strong>, <em>, <p>, <ul>)
- NO uses triple backtick para codigo
- NO pegues parrafos sin linea vacia

**EJEMPLO DE ESTRUCTURA CORRECTA (${detailConfig.structure}):**
${mainHasLists && sectionOutline.paragraphs === 0 ? `
${mainContentType === 'list' ? '- Primer elemento importante de la lista con detalles relevantes y completos sobre ${sectionOutline.title}. Este elemento debe tener suficiente información para ser útil.\n- Segundo elemento con información específica y útil desarrollando otro aspecto importante del tema principal.\n- Tercer elemento desarrollando otro aspecto clave con detalles específicos y ejemplos cuando sea posible.\n- Cuarto elemento agregando más valor al contenido con información relevante y contextualizada.\n- Quinto elemento finalizando con información relevante que complementa los puntos anteriores.' : '1. Primer elemento numerado con explicación detallada sobre ${sectionOutline.title}. Proporciona información completa y específica.\n2. Segundo elemento con información específica y útil que desarrolla otro aspecto importante del tema.\n3. Tercer elemento desarrollando otro punto importante con detalles y contexto adicional.\n4. Cuarto elemento agregando contexto adicional con información práctica y relevante.\n5. Quinto elemento concluyendo con datos relevantes que complementan todo lo anterior.'}
` : `
Primer parrafo introductorio sobre ${sectionOutline.title}. Debe ser ${detailLevel === 'basic' ? 'conciso pero informativo' : 'completo y detallado con informacion relevante'}. ${detailLevel === 'basic' ? '2-3 oraciones por parrafo.' : 'Minimo 3-4 oraciones por parrafo.'}

Segundo parrafo continuando el tema principal. Usa **negritas** para enfasis y *cursivas* cuando sea apropiado. Mantiene coherencia con el parrafo anterior.
${sectionOutline.paragraphs > 2 ? '\n\nTercer parrafo si corresponde, manteniendo coherencia y agregando mas valor al contenido.\n' : ''}
${mainHasLists ? '\n\n' + (mainContentType === 'list' ? '- Primer elemento importante de la lista con detalles relevantes\n- Segundo elemento con información útil y específica\n- Tercer elemento desarrollando otro aspecto clave\n- Cuarto elemento agregando más valor al contenido\n- Quinto elemento finalizando con información relevante' : '1. Primer elemento numerado con explicación detallada\n2. Segundo elemento con información específica y útil\n3. Tercer elemento desarrollando otro punto importante\n4. Cuarto elemento agregando contexto adicional\n5. Quinto elemento concluyendo con datos relevantes') + '\n' : ''}
`}
${filteredSubsections.length > 0 ? '\n' + filteredSubsections.map((sub, idx) => {
  const prefix = sub.type === 'h3' ? '###' : '####'
  const subContentType = sub.contentType || 'paragraphs'
  const subHasLists = subContentType === 'list' || subContentType === 'numbered-list' || sub.type === 'list' || sub.type === 'numbered-list'
  const subListType = (subContentType === 'list' || sub.type === 'list') ? 'list' : 'numbered-list'
  
  return `
${prefix} ${sub.title}
${subHasLists && sub.paragraphs === 0 ? `
${subListType === 'list' ? '- Primer elemento importante de la lista con información completa y detallada\n- Segundo elemento con detalles relevantes desarrollando otro aspecto\n- Tercer elemento con informacion util y práctica sobre el tema\n- Cuarto elemento agregando más valor con datos específicos\n- Quinto elemento concluyendo el punto con información final' : '1. Primer paso o elemento numerado con explicación completa y detallada\n2. Segundo paso con detalles especificos y ejemplos prácticos\n3. Tercer paso con informacion clara y paso a paso\n4. Cuarto paso desarrollando el proceso con contexto adicional\n5. Quinto paso finalizando con conclusiones y recomendaciones'}` : `
Primer parrafo de la subseccion "${sub.title}". Contenido ${detailLevel === 'medium' ? 'completo' : 'muy completo'} que desarrolla este tema especifico.
${sub.paragraphs > 1 ? '\n\nSegundo parrafo de esta subseccion continuando el desarrollo del tema de forma profesional y coherente.\n' : ''}${subHasLists && subListType === 'list' ? '\n\n- Primer elemento importante de la lista\n- Segundo elemento con detalles relevantes\n- Tercer elemento con informacion util\n- Cuarto elemento agregando más valor\n- Quinto elemento concluyendo el punto' : ''}${subHasLists && subListType === 'numbered-list' ? '\n\n1. Primer paso o elemento numerado con explicacion\n2. Segundo paso con detalles especificos\n3. Tercer paso con informacion clara\n4. Cuarto paso desarrollando el proceso\n5. Quinto paso finalizando con conclusiones' : ''}`}`
}).join('\n') : ''}

🚨 VERIFICACIÓN FINAL OBLIGATORIA:

1. ¿Empiezo con "¿Sueñas" o "¿Anhelas"? → SI = REESCRIBIR COMPLETAMENTE
2. ¿Uso "fascinante", "increíble", "asombroso"? → SI = CAMBIAR por "importante", "útil"
3. ¿Digo "Descubre", "Sumérgete", "Embárcate"? → SI = CAMBIAR por "Conoce", "Aprende"
4. ¿Empiezo con "En esta sección"? → SI = EMPEZAR DIRECTO CON INFORMACIÓN
5. ¿Repito "La observación de jaguares en su hábitat" o frases similares? → SI = CAMBIAR por algo ESPECÍFICO
6a. ¿Cada sección tiene un enfoque DISTINTO y ESPECÍFICO? → DEBE SER SÍ
6. ¿Esta sección aporta información NUEVA? → DEBE SER SÍ
7. ¿Suena como escrito por una persona real? → DEBE SER SÍ
8. ¿Todos los párrafos tienen menos de 80 palabras? → DEBE SER SÍ

CRITICO - VERIFICACION TÉCNICA:
- LONGITUD: Aproximadamente ${detailConfig.targetWords} palabras total (NO MÁS)
- ESTRUCTURA: ${detailConfig.structure} - ${!detailConfig.allowH3 ? 'SIN SUBSECCIONES H3/H4' : detailConfig.allowH4 ? 'Puedes usar H3 y H4' : 'Solo H3, NO H4'}
${mainHasLists && sectionOutline.paragraphs === 0 ? `- NO ESCRIBAS PARRAFOS en la sección principal, SOLO la lista
- INCLUYE SOLO una lista ${mainContentType === 'list' ? 'con viñetas (-)' : 'numerada (1., 2., 3.)'} con EXACTAMENTE ${sectionOutline.items || 5} elementos
` : mainHasLists ? `- Escribe ${sectionOutline.paragraphs} párrafos ${detailLevel === 'basic' ? 'CONCISOS (2-3 oraciones)' : 'DETALLADOS (3-4 oraciones)'}
- INCLUYE una lista ${mainContentType === 'list' ? 'con viñetas (-)' : 'numerada (1., 2., 3.)'} con ${sectionOutline.items || 5} elementos
` : `- Escribe parrafos ${detailLevel === 'basic' ? 'CONCISOS (2-3 oraciones)' : 'DETALLADOS (3-4 oraciones)'}
`}${filteredSubsections.length > 0 ? `- Incluye TODAS las ${filteredSubsections.length} subsecciones especificadas con sus listas si corresponde` : mainHasLists && sectionOutline.paragraphs === 0 ? '- NO incluyas subsecciones, SOLO la lista principal' : '- NO incluyas subsecciones'}
- Separa TODO con lineas vacias (doble salto)
- NO uses HTML, SOLO markdown puro
- Respeta EXACTAMENTE la estructura ${detailConfig.structure} indicada arriba

🚨🚨🚨 RECORDATORIO FINAL CRITICO 🚨🚨🚨
Si escribes "¿Sueñas", "¿Anhelas", "Descubre", "fascinante" o "increíble" = FALLO TOTAL
Si repites "La observación de jaguares en su hábitat" = FALLO TOTAL
Si escribes párrafos de más de 80 palabras = FALLO TOTAL
Escribe como una PERSONA REAL, no como IA.
Empieza DIRECTAMENTE con información útil y ESPECÍFICA de esta sección.
Cada sección debe AVANZAR la historia, no repetirla.
MANTÉN LOS PÁRRAFOS CORTOS Y LEGIBLES (máximo 80 palabras).`

    try {
      const content = await this.generateWithModel(prompt, modelId, {
        temperature: 0.7,
        maxTokens: detailConfig.maxTokens // Ajustar tokens según nivel de detalle
      })
      
      console.log(`📝 [AI-SERVICE] Contenido generado: ${content.length} caracteres`)
      
      // Validar que se generaron todas las subsecciones
      if (subsections && subsections.length > 0) {
        const missingSubsections: string[] = []
        subsections.forEach(sub => {
          const titlePattern = sub.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const hasSubsection = content.includes(sub.title) || 
                                new RegExp(`###+ ${titlePattern}`, 'i').test(content)
          if (!hasSubsection) {
            missingSubsections.push(sub.title)
          }
        })
        
        if (missingSubsections.length > 0) {
          console.warn(`⚠️ [AI-SERVICE] Subsecciones faltantes en "${sectionOutline.title}":`, missingSubsections)
          console.warn(`⚠️ [AI-SERVICE] Se esperaban ${subsections.length} subsecciones, pero faltan ${missingSubsections.length}`)
        } else {
          console.log(`✅ [AI-SERVICE] Todas las ${subsections.length} subsecciones fueron generadas correctamente`)
        }
      }
      
      return content.trim()
    } catch (error) {
      throw error
    }
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(text: string, keyword: string): number {
    const words = text.toLowerCase().split(/\s+/)
    const keywordWords = keyword.toLowerCase().split(/\s+/)
    let count = 0
    
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const slice = words.slice(i, i + keywordWords.length).join(' ')
      if (slice === keywordWords.join(' ')) {
        count++
      }
    }
    
    return Math.round((count / words.length) * 100)
  }
}

// Export singleton instance
export const aiService = new AIService()
