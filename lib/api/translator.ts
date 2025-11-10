/**
 * Translation Service
 * Handles content translation through API routes
 */

import { TokenManager } from '@/lib/utils/token-manager'

interface TranslationData {
  title: string
  h1Title?: string
  description?: string
  keyword: string
  objectivePhrase?: string
  keywords?: string[]
  content: string
}

interface TranslatedData {
  title: string
  h1Title: string
  description: string
  keyword: string
  objectivePhrase: string
  keywords: string[]
  content: string
}

class TranslatorService {

  /**
   * Translate complete content including SEO metadata
   */
  async translateContent(
    data: TranslationData,
    targetLanguage: string,
    targetLanguageName: string
  ): Promise<TranslatedData> {
    try {
      console.log(`🌐 Iniciando traducción a ${targetLanguageName} (${targetLanguage})`)

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data,
          targetLanguage,
          targetLanguageName,
          streaming: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error?.message || 'Translation failed')
      }

      console.log('✅ Traducción completada')
      console.log(`   Título SEO: ${result.data.title}`)
      console.log(`   Título H1: ${result.data.h1Title}`)
      console.log(`   Keyword: ${result.data.keyword}`)

      return result.data as TranslatedData

    } catch (error: any) {
      console.error('❌ Error en traducción:', error)
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.')
      }
      
      throw new Error(`Error al traducir: ${error.message || 'Error desconocido'}`)
    }
  }

  /**
   * Construir prompt para traducción
   */
  private buildTranslationPrompt(
    data: TranslationData,
    targetLanguageName: string
  ): string {
    return `Eres un traductor profesional experto en SEO y contenido web.

Tu tarea es traducir el siguiente artículo completo a ${targetLanguageName}, manteniendo:
- La estructura Markdown exacta
- Todos los encabezados (##, ###)
- Las negritas (**texto**)
- Los enlaces y formato
- El tono y estilo profesional

**DATOS ORIGINALES:**
TITLE: ${data.title}
H1: ${data.h1Title || data.title}
DESCRIPTION: ${data.description}
KEYWORD: ${data.keyword}
OBJECTIVE: ${data.objectivePhrase || ''}
KEYWORDS: ${(data.keywords || []).join(', ')}

CONTENT:
${data.content}

**INSTRUCCIONES:**
1. Traduce TODO a ${targetLanguageName}
2. Mantén EXACTAMENTE el mismo formato Markdown
3. Devuelve el resultado en este formato EXACTO:

TITLE: [título SEO traducido]
H1: [título H1 traducido]
DESCRIPTION: [descripción traducida]
KEYWORD: [keyword traducida]
OBJECTIVE: [frase objetivo traducida]
KEYWORDS: [keywords traducidas separadas por comas]
CONTENT:
[contenido completo traducido en Markdown]

**IMPORTANTE:** Responde ÚNICAMENTE con el formato especificado, sin explicaciones adicionales.`
  }

  /**
   * Traducir contenido con STREAMING en tiempo real y fallback automático
   */
  async translateWithStreaming(
    data: TranslationData,
    targetLanguage: string,
    targetLanguageName: string,
    onChunk: (chunk: string, accumulated: string) => void,
    options?: {
      modelId?: number
      onFallbackToNormal?: () => void
    }
  ): Promise<TranslatedData> {
    try {
      console.log(`🌐 [TRANSLATE] Iniciando traducción a ${targetLanguageName} (${targetLanguage})`)

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Construir prompt de traducción
      const prompt = this.buildTranslationPrompt(data, targetLanguageName)
      const modelId = options?.modelId || 1 // Modelo por defecto
      
      console.log('📝 [TRANSLATE] Prompt construido, intentando streaming...')

      // Intentar con streaming usando el mismo endpoint que Step1/2/3
      const streamingResponse = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt: prompt,
          temperature: 0.3
        })
      })

      // Detectar si streaming no está soportado
      const contentType = streamingResponse.headers.get('content-type')
      const isStreamSupported = contentType?.includes('text/event-stream')
      
      if (!streamingResponse.ok) {
        const errorData = await streamingResponse.json().catch(() => null)
        
        // Si el modelo no soporta streaming, usar método normal
        if (errorData?.error?.code === 'STREAMING_NOT_SUPPORTED' || !isStreamSupported) {
          console.log('⚠️ [TRANSLATE] Streaming no soportado, usando método normal...')
          options?.onFallbackToNormal?.()
          return await this.translateWithoutStreaming(
            data,
            targetLanguage,
            targetLanguageName,
            modelId
          )
        }
        
        throw new Error(errorData?.error?.message || `HTTP error! status: ${streamingResponse.status}`)
      }

      if (!isStreamSupported) {
        console.log('⚠️ [TRANSLATE] Respuesta no es stream, usando método normal...')
        options?.onFallbackToNormal?.()
        return await this.translateWithoutStreaming(
          data,
          targetLanguage,
          targetLanguageName,
          modelId
        )
      }

      if (!streamingResponse.body) {
        console.log('⚠️ [TRANSLATE] Sin body en respuesta, usando método normal...')
        options?.onFallbackToNormal?.()
        return await this.translateWithoutStreaming(
          data,
          targetLanguage,
          targetLanguageName,
          modelId
        )
      }

      // Process streaming response (igual que Step1/2/3/humanizer)
      const reader = streamingResponse.body.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let accumulatedText = ''
      let chunkCount = 0
      const startTime = Date.now()

      console.log('🔥 [TRANSLATE] INICIANDO STREAMING...')

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('✅ [TRANSLATE] Stream terminado')
          break
        }

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const sseData = line.slice(6)
            
            if (sseData === '[DONE]') {
              console.log('🏁 [TRANSLATE] Recibido [DONE]')
              continue
            }

            try {
              const parsed = JSON.parse(sseData)
              
              // Detectar error en el stream
              if (parsed.error) {
                console.error('❌ [TRANSLATE] Error en stream:', parsed.error)
                console.log('⚠️ [TRANSLATE] Fallback a método normal...')
                options?.onFallbackToNormal?.()
                return await this.translateWithoutStreaming(
                  data,
                  targetLanguage,
                  targetLanguageName,
                  modelId
                )
              }
              
              if (parsed.chunk) {
                chunkCount++
                accumulatedText += parsed.chunk
                
                // Emitir chunk al callback para actualización en tiempo real
                onChunk(parsed.chunk, accumulatedText)
                
                if (chunkCount % 10 === 0) {
                  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
                  console.log(`📡 [TRANSLATE] Chunk #${chunkCount}: +${parsed.chunk.length} chars | Total: ${accumulatedText.length} chars | ${elapsed}s`)
                }
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('❌ [TRANSLATE] Error parseando:', e)
              }
              // Skip invalid JSON
            }
          }
        }
      }

      // Verificar si se recibió contenido
      if (accumulatedText.length === 0) {
        console.warn('⚠️ [TRANSLATE] No se recibió contenido vía streaming, usando método normal...')
        options?.onFallbackToNormal?.()
        return await this.translateWithoutStreaming(
          data,
          targetLanguage,
          targetLanguageName,
          modelId
        )
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`✅ [TRANSLATE] STREAMING COMPLETADO: ${chunkCount} chunks en ${totalTime}s | Total: ${accumulatedText.length} chars`)

      // Parse the accumulated response
      const lines = accumulatedText.split('\n')
      let title: string | null = null
      let h1Title: string | null = null
      let description: string | null = null
      let keyword: string | null = null
      let objective: string | null = null
      let keywords: string[] | null = null
      let content = ''
      let inContent = false

      for (const line of lines) {
        if (line.startsWith('TITLE:')) {
          title = line.replace('TITLE:', '').trim()
        } else if (line.startsWith('H1:')) {
          h1Title = line.replace('H1:', '').trim()
        } else if (line.startsWith('DESCRIPTION:')) {
          description = line.replace('DESCRIPTION:', '').trim()
        } else if (line.startsWith('KEYWORD:')) {
          keyword = line.replace('KEYWORD:', '').trim()
        } else if (line.startsWith('OBJECTIVE:')) {
          objective = line.replace('OBJECTIVE:', '').trim()
        } else if (line.startsWith('KEYWORDS:')) {
          const kwText = line.replace('KEYWORDS:', '').trim()
          keywords = kwText.split(',').map((k: string) => k.trim())
        } else if (line.startsWith('CONTENT:')) {
          inContent = true
        } else if (inContent) {
          content += line + '\n'
        }
      }

      const translatedContent = content.trim()

      if (!translatedContent || translatedContent.length < 50) {
        throw new Error('La IA no generó una traducción válida. Por favor, intenta de nuevo.')
      }

      if (translatedContent === data.content) {
        throw new Error('La traducción no se completó correctamente. El contenido no cambió.')
      }

      console.log('✅ [TRANSLATE] Traducción con streaming completada')

      return {
        title: title || data.title,
        h1Title: h1Title || data.h1Title || data.title,
        description: description || data.description || '',
        keyword: keyword || data.keyword,
        objectivePhrase: objective || data.objectivePhrase || '',
        keywords: keywords || data.keywords || [],
        content: translatedContent
      }

    } catch (error: any) {
      console.error('❌ [TRANSLATE] Error traduciendo con streaming:', error)

      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.')
      }

      throw new Error(`Error al traducir: ${error.message || 'Error desconocido'}`)
    }
  }

  /**
   * 🔄 FALLBACK - Método normal sin streaming
   */
  private async translateWithoutStreaming(
    data: TranslationData,
    targetLanguage: string,
    targetLanguageName: string,
    modelId: number
  ): Promise<TranslatedData> {
    try {
      console.log('🔄 [TRANSLATE-NORMAL] Iniciando traducción sin streaming...')

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Construir mismo prompt
      const prompt = this.buildTranslationPrompt(data, targetLanguageName)

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
          temperature: 0.3,
          maxTokens: 8192
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('📦 [TRANSLATE-NORMAL] Respuesta recibida:', {
        success: result.success,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        errorMessage: result.error?.message
      })
      
      if (!result.success) {
        console.error('❌ [TRANSLATE-NORMAL] Respuesta fallida:', result)
        throw new Error(result.error?.message || 'Translation failed')
      }

      console.log('✅ [TRANSLATE-NORMAL] Traducción recibida')
      
      // El endpoint /api/ai/generate devuelve data.content
      const translatedText = result.data?.content || result.data?.text || ''
      
      if (!translatedText || typeof translatedText !== 'string') {
        console.error('❌ [TRANSLATE-NORMAL] Formato de respuesta inválido:', result)
        throw new Error('Invalid model response: expected content field with text')
      }
      
      console.log('📄 [TRANSLATE-NORMAL] Contenido recibido, longitud:', translatedText.length)

      // Parse the response (mismo código)
      const lines = translatedText.split('\n')
      let title: string | null = null
      let h1Title: string | null = null
      let description: string | null = null
      let keyword: string | null = null
      let objective: string | null = null
      let keywords: string[] | null = null
      let content = ''
      let inContent = false

      for (const line of lines) {
        if (line.startsWith('TITLE:')) {
          title = line.replace('TITLE:', '').trim()
        } else if (line.startsWith('H1:')) {
          h1Title = line.replace('H1:', '').trim()
        } else if (line.startsWith('DESCRIPTION:')) {
          description = line.replace('DESCRIPTION:', '').trim()
        } else if (line.startsWith('KEYWORD:')) {
          keyword = line.replace('KEYWORD:', '').trim()
        } else if (line.startsWith('OBJECTIVE:')) {
          objective = line.replace('OBJECTIVE:', '').trim()
        } else if (line.startsWith('KEYWORDS:')) {
          const kwText = line.replace('KEYWORDS:', '').trim()
          keywords = kwText.split(',').map((k: string) => k.trim())
        } else if (line.startsWith('CONTENT:')) {
          inContent = true
        } else if (inContent) {
          content += line + '\n'
        }
      }

      const translatedContent = content.trim()

      if (!translatedContent || translatedContent.length < 50) {
        throw new Error('La IA no generó una traducción válida. Por favor, intenta de nuevo.')
      }

      console.log('✅ [TRANSLATE-NORMAL] Traducción completada')

      return {
        title: title || data.title,
        h1Title: h1Title || data.h1Title || data.title,
        description: description || data.description || '',
        keyword: keyword || data.keyword,
        objectivePhrase: objective || data.objectivePhrase || '',
        keywords: keywords || data.keywords || [],
        content: translatedContent
      }

    } catch (error: any) {
      console.error('❌ [TRANSLATE-NORMAL] Error:', error)
      throw new Error(`Error al traducir: ${error.message || 'Error desconocido'}`)
    }
  }

  /**
   * Get language name from code
   */
  getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'en': 'Inglés',
      'es': 'Español',
      'fr': 'Francés',
      'de': 'Alemán',
      'it': 'Italiano',
      'pt': 'Portugués',
      'nl': 'Holandés',
      'pl': 'Polaco',
      'ru': 'Ruso',
      'ja': 'Japonés',
      'zh': 'Chino',
      'ko': 'Coreano',
      'ar': 'Árabe'
    }
    return languages[code] || code.toUpperCase()
  }
}

export const translatorService = new TranslatorService()
export type { TranslationData, TranslatedData }
