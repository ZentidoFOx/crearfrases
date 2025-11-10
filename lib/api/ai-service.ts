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
    let characters = 300
    let items: number | undefined
    
    // Detect type
    if (trimmed.startsWith('#### ')) {
      type = 'h4'
      title = trimmed.replace(/^####\s*/, '')
      paragraphs = 1
      characters = 150
    } else if (trimmed.startsWith('### ')) {
      type = 'h3'
      title = trimmed.replace(/^###\s*/, '')
      paragraphs = 2
      characters = 250
    } else if (trimmed.startsWith('## ')) {
      type = 'h2'
      title = trimmed.replace(/^##\s*/, '')
      paragraphs = 3
      characters = 400
    } else if (trimmed.match(/^\d+\./)) {
      type = 'numbered-list'
      title = trimmed.replace(/^\d+\.\s*/, '')
      items = 5
      paragraphs = 0
      characters = 0
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      type = 'list'
      title = trimmed.replace(/^[-*]\s*/, '')
      items = 5
      paragraphs = 0
      characters = 0
    }
    
    return {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      paragraphs,
      characters,
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
    characters: number
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
   * Generate article content with streaming
   * Returns true if streaming was successful, false if it should fallback to normal method
   */
  async generateContentStreaming(
    title: string,
    keyword: string,
    introParagraphs: number,
    outline: Array<{
      id: string
      type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
      title: string
      paragraphs: number
      characters: number
      items?: number
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
   * Generate complete article content using selected model
   */
  async generateContent(
    title: string,
    keyword: string,
    introParagraphs: number,
    outline: Array<{
      id: string
      type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
      title: string
      paragraphs: number
      characters: number
      items?: number
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
