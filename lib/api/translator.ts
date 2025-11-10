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
   * Traducir contenido con STREAMING en tiempo real
   */
  async translateWithStreaming(
    data: TranslationData,
    targetLanguage: string,
    targetLanguageName: string,
    onChunk: (chunk: string, accumulated: string) => void
  ): Promise<TranslatedData> {
    try {
      console.log(`🌐 Iniciando traducción CON STREAMING a ${targetLanguageName} (${targetLanguage})`)

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
      let accumulatedText = ''

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
                accumulatedText += parsed.chunk
                onChunk(parsed.chunk, accumulatedText)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

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
          keywords = kwText.split(',').map(k => k.trim())
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

      console.log('✅ Traducción con streaming completada')

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
      console.error('Error traduciendo con streaming:', error)

      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.')
      }

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
