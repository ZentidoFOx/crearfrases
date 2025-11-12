/**
 * Translation Service
 * Handles content translation through API routes
 */

import { TokenManager } from '@/lib/utils/token-manager'

interface TranslationData {
  title: string
  seoTitle?: string
  h1Title?: string
  description?: string
  keyword: string
  objectivePhrase?: string
  keywords?: string[]
  relatedKeywords?: string[]
  slug?: string
  content: string
}

interface TranslatedData {
  title: string
  seoTitle: string
  h1Title: string
  description: string
  keyword: string
  objectivePhrase: string
  keywords: string[]
  relatedKeywords: string[]
  slug: string
  content: string
}

class TranslatorService {

  /**
   * Construir prompt para traducción
   */
  private buildTranslationPrompt(
    data: TranslationData,
    targetLanguageName: string
  ): string {
    return `Eres un traductor profesional experto en SEO y contenido web.

Tu tarea es traducir el siguiente artículo completo a ${targetLanguageName}, manteniendo:
- La estructura HTML/Markdown exacta
- Todos los encabezados (##, ###, <h2>, <h3>)
- Las negritas (**texto**, <strong>)
- Los enlaces y formato
- El tono y estilo profesional
- EL SEO OPTIMIZADO PARA ${targetLanguageName}

**DATOS ORIGINALES:**
TITLE: ${data.title}
SEO_TITLE: ${data.seoTitle || data.title}
H1: ${data.h1Title || data.title}
DESCRIPTION: ${data.description}
🎯 FOCUS KEYWORD (PRINCIPAL): ${data.keyword}
OBJECTIVE: ${data.objectivePhrase || ''}
KEYWORDS: ${(data.keywords || []).join(', ')}
RELATED_KEYWORDS: ${(data.relatedKeywords || []).join(', ')}
SLUG: ${data.slug || ''}

CONTENT:
${data.content}

**INSTRUCCIONES CRÍTICAS SOBRE EL FOCUS KEYWORD:**

🚨🚨🚨 EXTREMADAMENTE IMPORTANTE 🚨🚨🚨

El FOCUS KEYWORD original en español es: "${data.keyword}"

DEBES traducir este keyword a ${targetLanguageName} y devolverlo en el campo KEYWORD:

⚠️ OBLIGATORIO: Debes incluir esta línea EXACTA en tu respuesta:
KEYWORD: [traducción del keyword a ${targetLanguageName}]

Ejemplo: Si el keyword es "mejores lugares para pescar" y traduces a inglés:
KEYWORD: best places to fish

1. Traduce este keyword a ${targetLanguageName} usando el término MÁS BUSCADO y NATURAL
2. Este keyword traducido DEBE aparecer OBLIGATORIAMENTE en:
   • KEYWORD: (campo principal - OBLIGATORIO)
   • SEO_TITLE (al inicio o al final del título)
   • TITLE (incluido de forma natural)
   • H1 (incluido de forma natural)
   • DESCRIPTION (al menos 1 vez)
   • CONTENT (distribuido naturalmente 5-7 veces en el artículo)
   • SLUG (como parte de la URL)

**EJEMPLO CORRECTO:**
Si el keyword original es "mejores lugares para pescar en amazonas"
Y el idioma destino es Inglés:

KEYWORD traducido: "best places to fish in amazon"

Entonces DEBES incluirlo en:
- SEO_TITLE: "Best Places to Fish in Amazon: Top 5 Destinations 2024"
- TITLE: "Best Places to Fish in Amazon"
- H1: "Discover the Best Places to Fish in Amazon"
- DESCRIPTION: "Find the best places to fish in Amazon. Our guide reveals..."
- SLUG: "best-places-to-fish-in-amazon"
- CONTENT: Aparece 5-7 veces distribuido naturalmente en el texto

**INSTRUCCIONES GENERALES:**
1. Traduce TODO a ${targetLanguageName} manteniendo el SEO
2. Mantén EXACTAMENTE el mismo formato HTML/Markdown
3. SEO_TITLE debe ser atractivo e incluir el FOCUS KEYWORD traducido
4. KEYWORD debe ser la traducción natural del keyword original
5. SLUG debe incluir el FOCUS KEYWORD (sin espacios, solo guiones)
6. RELATED_KEYWORDS deben ser variaciones del FOCUS KEYWORD traducido

**FORMATO DE RESPUESTA (OBLIGATORIO):**

TITLE: [título traducido con FOCUS KEYWORD]
SEO_TITLE: [título SEO con FOCUS KEYWORD traducido incluido]
H1: [título H1 con FOCUS KEYWORD traducido incluido]
DESCRIPTION: [meta descripción con FOCUS KEYWORD traducido incluido]
KEYWORD: [FOCUS KEYWORD traducido - el más buscado en ${targetLanguageName}]
OBJECTIVE: [frase objetivo traducida]
KEYWORDS: [keywords traducidas separadas por comas]
RELATED_KEYWORDS: [variaciones del FOCUS KEYWORD en ${targetLanguageName} separadas por comas]
SLUG: [slug-con-focus-keyword-traducido]
CONTENT:
[contenido completo traducido con FOCUS KEYWORD distribuido naturalmente 5-7 veces]

**IMPORTANTE:** 
- Responde ÚNICAMENTE con el formato especificado
- ASEGÚRATE de que el FOCUS KEYWORD traducido aparezca en TODOS los lugares indicados
- NO inventes keywords diferentes, traduce SIEMPRE el keyword original`
  }

  /**
   * 🎯 PASO 1: Traducir SOLO los campos SEO (keyword, titles, meta)
   */
  private async translateSEOFields(
    data: TranslationData,
    targetLanguageName: string,
    modelId: number,
    token: string
  ): Promise<{
    keyword: string
    seoTitle: string
    h1Title: string
    metaDescription: string
    slug: string
  }> {
    const prompt = `Traduce ÚNICAMENTE estos campos SEO a ${targetLanguageName}:

KEYWORD ORIGINAL: ${data.keyword}
TITLE ORIGINAL: ${data.title}
H1 ORIGINAL: ${data.h1Title || data.title}
META DESCRIPTION ORIGINAL: ${data.description}

INSTRUCCIONES:
1. KEYWORD debe ser el término más buscado en ${targetLanguageName}
2. Todos los campos deben incluir el KEYWORD traducido
3. Responde SOLO en este formato:

KEYWORD: [keyword traducido]
SEO_TITLE: [título SEO con keyword incluido]
H1: [título H1 con keyword incluido]
DESCRIPTION: [meta description con keyword incluido]
SLUG: [url-slug-con-keyword]

SIN EXPLICACIONES, SOLO LOS CAMPOS.`

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
        maxTokens: 500
      })
    })

    if (!response.ok) {
      throw new Error('Error al traducir campos SEO')
    }

    const result = await response.json()
    const text = result.data?.content || ''
    
    // Parsear respuesta
    const lines = text.split('\n')
    let keyword = ''
    let seoTitle = ''
    let h1Title = ''
    let metaDescription = ''
    let slug = ''
    
    for (const line of lines) {
      if (line.startsWith('KEYWORD:')) {
        keyword = line.replace('KEYWORD:', '').trim()
      } else if (line.startsWith('SEO_TITLE:')) {
        seoTitle = line.replace('SEO_TITLE:', '').trim()
      } else if (line.startsWith('H1:')) {
        h1Title = line.replace('H1:', '').trim()
      } else if (line.startsWith('DESCRIPTION:')) {
        metaDescription = line.replace('DESCRIPTION:', '').trim()
      } else if (line.startsWith('SLUG:')) {
        slug = line.replace('SLUG:', '').trim()
      }
    }
    
    console.log('✅ [TRANSLATE-SEO] Campos SEO traducidos:', {
      keyword,
      seoTitle: seoTitle.substring(0, 50),
      h1Title: h1Title.substring(0, 50),
      slug
    })
    
    return { keyword, seoTitle, h1Title, metaDescription, slug }
  }

  /**
   * 🎯 PASO 2: Traducir contenido usando los campos SEO ya traducidos
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
      console.log(`🌐 [TRANSLATE] Iniciando traducción en 2 PASOS a ${targetLanguageName}`)

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const modelId = options?.modelId || 1
      
      // 🎯 PASO 1: Traducir campos SEO primero
      console.log('📝 [TRANSLATE] PASO 1: Traduciendo campos SEO...')
      const seoFields = await this.translateSEOFields(data, targetLanguageName, modelId, token)
      
      console.log('✅ [TRANSLATE] Campos SEO traducidos correctamente')
      console.log('   🎯 Keyword:', seoFields.keyword)
      console.log('   📄 SEO Title:', seoFields.seoTitle.substring(0, 60))
      
      // 🎯 PASO 2: Traducir contenido usando los campos SEO traducidos
      console.log('📝 [TRANSLATE] PASO 2: Traduciendo contenido con keyword:', seoFields.keyword)
      
      // Actualizar data con los campos SEO traducidos para el prompt
      const dataWithTranslatedSEO = {
        ...data,
        keyword: seoFields.keyword,  // ← Usar keyword YA traducido
        seoTitle: seoFields.seoTitle,
        h1Title: seoFields.h1Title,
        description: seoFields.metaDescription,
        slug: seoFields.slug
      }
      
      // Construir prompt usando los campos SEO traducidos
      const prompt = `Traduce ÚNICAMENTE el contenido HTML a ${targetLanguageName}.

🚨 REGLAS ESTRICTAS:
1. Traduce SOLO el texto dentro de los tags HTML existentes
2. NO agregues <meta>, <title>, <head>, <body> o cualquier tag extra
3. Mantén EXACTAMENTE la misma estructura HTML del original
4. Incluye el keyword "${seoFields.keyword}" naturalmente 5-7 veces en el contenido

CONTENIDO A TRADUCIR:
${data.content}

RESPONDE SOLO CON EL HTML TRADUCIDO (mismo formato que el original), SIN explicaciones, SIN meta tags, SIN elementos extra.`
      
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

      // 🎯 En el nuevo sistema de 2 PASOS, accumulatedText ES el contenido traducido directamente
      let translatedContent = accumulatedText.trim()

      // 🧹 LIMPIEZA: Remover elementos HTML extra que la IA agregó incorrectamente
      // Remover <!DOCTYPE>, <html>, <head>, <body>, etc.
      translatedContent = translatedContent
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '')
        .replace(/<\/body>/gi, '')
        .replace(/<meta[^>]*>/gi, '')
        .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
        .trim()

      if (!translatedContent || translatedContent.length < 50) {
        console.error('❌ [TRANSLATE] Contenido muy corto recibido:', translatedContent.length, 'chars')
        console.error('   Primeros 200 chars:', translatedContent.substring(0, 200))
        throw new Error('La IA no generó una traducción válida. Por favor, intenta de nuevo.')
      }

      if (translatedContent === data.content) {
        throw new Error('La traducción no se completó correctamente. El contenido no cambió.')
      }

      console.log('✅ [TRANSLATE] Contenido traducido y limpio:', translatedContent.length, 'chars')
      console.log('   Primeros 100 chars:', translatedContent.substring(0, 100))

      // ✅ Usar campos SEO del PASO 1 (ya traducidos correctamente)
      return {
        title: seoFields.seoTitle,  // ← Del PASO 1
        seoTitle: seoFields.seoTitle,  // ← Del PASO 1
        h1Title: seoFields.h1Title,  // ← Del PASO 1
        description: seoFields.metaDescription,  // ← Del PASO 1
        keyword: seoFields.keyword,  // ← Del PASO 1 (GARANTIZADO)
        objectivePhrase: data.objectivePhrase || '',
        keywords: data.keywords || [],
        relatedKeywords: [],  // Se pueden agregar después si es necesario
        slug: seoFields.slug,  // ← Del PASO 1
        content: translatedContent  // ← Del PASO 2
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
      let seoTitle: string | null = null
      let h1Title: string | null = null
      let description: string | null = null
      let keyword: string | null = null
      let objective: string | null = null
      let keywords: string[] | null = null
      let relatedKeywords: string[] | null = null
      let slug: string | null = null
      let content = ''
      let inContent = false

      for (const line of lines) {
        if (line.startsWith('SEO_TITLE:')) {
          seoTitle = line.replace('SEO_TITLE:', '').trim()
        } else if (line.startsWith('TITLE:')) {
          title = line.replace('TITLE:', '').trim()
        } else if (line.startsWith('H1:')) {
          h1Title = line.replace('H1:', '').trim()
        } else if (line.startsWith('DESCRIPTION:')) {
          description = line.replace('DESCRIPTION:', '').trim()
        } else if (line.startsWith('KEYWORD:')) {
          keyword = line.replace('KEYWORD:', '').trim()
        } else if (line.startsWith('OBJECTIVE:')) {
          objective = line.replace('OBJECTIVE:', '').trim()
        } else if (line.startsWith('RELATED_KEYWORDS:')) {
          const kwText = line.replace('RELATED_KEYWORDS:', '').trim()
          relatedKeywords = kwText.split(',').map((k: string) => k.trim()).filter(k => k)
        } else if (line.startsWith('KEYWORDS:')) {
          const kwText = line.replace('KEYWORDS:', '').trim()
          keywords = kwText.split(',').map((k: string) => k.trim()).filter(k => k)
        } else if (line.startsWith('SLUG:')) {
          slug = line.replace('SLUG:', '').trim()
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
      console.log('📊 [TRANSLATE-NORMAL] Campos parseados:', {
        title: !!title,
        seoTitle: !!seoTitle,
        h1Title: !!h1Title,
        description: !!description,
        '🎯 KEYWORD': keyword || 'NULL - NO RECIBIDO',
        objective: !!objective,
        keywords: keywords?.length || 0,
        relatedKeywords: relatedKeywords?.length || 0,
        slug: !!slug
      })
      
      // 🔥 VALIDAR QUE EL KEYWORD FUE TRADUCIDO
      if (!keyword || keyword === data.keyword) {
        console.warn('⚠️ [TRANSLATE-NORMAL] ADVERTENCIA: La IA NO devolvió KEYWORD, intentando extraer...')
        
        // FALLBACK: Extraer del título traducido
        if (seoTitle && seoTitle !== data.seoTitle) {
          const titleWords = seoTitle.split(':')[0].trim()
          if (titleWords && titleWords.length > 5) {
            keyword = titleWords.toLowerCase()
            console.log('✅ [TRANSLATE-NORMAL] Keyword extraído del SEO_TITLE:', keyword)
          }
        }
        
        if (!keyword && title && title !== data.title) {
          keyword = title.toLowerCase()
          console.log('✅ [TRANSLATE-NORMAL] Keyword extraído del TITLE:', keyword)
        }
        
        if (!keyword || keyword === data.keyword) {
          console.error('❌ [TRANSLATE-NORMAL] ERROR: No se pudo obtener keyword traducido')
          throw new Error(`La IA no tradujo el Focus Keyword. Original: "${data.keyword}", Recibido: "${keyword || 'vacío'}"`)
        }
      }

      return {
        title: title || data.title,
        seoTitle: seoTitle || data.seoTitle || title || data.title,
        h1Title: h1Title || data.h1Title || data.title,
        description: description || data.description || '',
        keyword: keyword,  // ← AHORA OBLIGATORIO
        objectivePhrase: objective || data.objectivePhrase || '',
        keywords: keywords || data.keywords || [],
        relatedKeywords: relatedKeywords || data.relatedKeywords || [],
        slug: slug || data.slug || '',
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
  /**
   * VERSIÓN SIMPLE: Traducir TODO el artículo de una vez
   */
  async translateArticleSimple(
    title: string,
    keyword: string,
    content: string,
    targetLanguage: string,
    targetLanguageName: string,
    modelId: number
  ): Promise<{ title: string; keyword: string; content: string }> {
    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const prompt = `Eres un traductor profesional experto en contenido SEO.

Traduce el siguiente artículo completo a ${targetLanguageName}:

TÍTULO: ${title}
KEYWORD: ${keyword}

CONTENIDO HTML:
${content}

INSTRUCCIONES:
1. Traduce TODO a ${targetLanguageName}
2. Mantén TODOS los tags HTML exactamente como están
3. NO modifiques la estructura HTML
4. Devuelve en este formato EXACTO:

TITLE: [título traducido]
KEYWORD: [keyword traducida]
CONTENT:
[contenido HTML traducido]`

      console.log(`🌐 [SIMPLE-TRANSLATE] Traduciendo artículo completo a ${targetLanguageName}`)

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: 0.3,
          max_tokens: 8000
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const translated = data.data.content

      // Parsear respuesta
      const titleMatch = translated.match(/TITLE:\s*(.+)/i)
      const keywordMatch = translated.match(/KEYWORD:\s*(.+)/i)
      const contentMatch = translated.match(/CONTENT:\s*([\s\S]+)/i)

      const result = {
        title: titleMatch ? titleMatch[1].trim() : title,
        keyword: keywordMatch ? keywordMatch[1].trim() : keyword,
        content: contentMatch ? contentMatch[1].trim() : content
      }

      console.log(`✅ [SIMPLE-TRANSLATE] Traducción completada:`, {
        titleLength: result.title.length,
        keywordLength: result.keyword.length,
        contentLength: result.content.length
      })

      return result

    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to translate article')
    }
  }

  /**
   * Traducir una sección individual de HTML
   */
  async translateSingleSection(
    sectionContent: string,
    targetLanguage: string,
    targetLanguageName: string,
    modelId: number
  ): Promise<string> {
    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const prompt = `Eres un traductor profesional experto en contenido web.

Traduce el siguiente contenido HTML a ${targetLanguageName}:

${sectionContent}

INSTRUCCIONES IMPORTANTES:
1. Mantén TODOS los tags HTML exactamente como están (<h2>, <p>, <strong>, <em>, etc.)
2. Traduce SOLO el texto dentro de los tags
3. NO agregues explicaciones ni comentarios
4. NO modifiques la estructura HTML
5. Devuelve SOLO el HTML traducido

Traducción:`

      console.log(`🌐 [SECTION] Traduciendo sección (${sectionContent.length} chars)`)

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: 0.3,
          max_tokens: 3000
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const translated = data.data.content.trim()

      console.log(`✅ [SECTION] Sección traducida (${translated.length} chars)`)

      return translated

    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to translate section')
    }
  }

  /**
   * Traducir metadatos (título, descripción, keywords)
   */
  async translateMetadata(
    metadata: {
      title: string
      h1Title: string
      description: string
      keyword: string
      objectivePhrase: string
      keywords: string[]
    },
    targetLanguage: string,
    targetLanguageName: string,
    modelId: number
  ): Promise<typeof metadata> {
    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const prompt = `Traduce los siguientes metadatos SEO a ${targetLanguageName}.
Mantén el formato exacto:

TITLE: ${metadata.title}
H1: ${metadata.h1Title}
DESCRIPTION: ${metadata.description}
KEYWORD: ${metadata.keyword}
OBJECTIVE: ${metadata.objectivePhrase}
KEYWORDS: ${metadata.keywords.join(', ')}

Devuelve en el mismo formato, solo con el texto traducido.`

      console.log('📝 [METADATA] Traduciendo metadatos...')

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: 0.3,
          max_tokens: 800
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const translated = data.data.content

      // Parsear respuesta
      const titleMatch = translated.match(/TITLE:\s*(.+)/i)
      const h1Match = translated.match(/H1:\s*(.+)/i)
      const descMatch = translated.match(/DESCRIPTION:\s*(.+)/i)
      const keywordMatch = translated.match(/KEYWORD:\s*(.+)/i)
      const objectiveMatch = translated.match(/OBJECTIVE:\s*(.+)/i)
      const keywordsMatch = translated.match(/KEYWORDS:\s*(.+)/i)

      const result = {
        title: titleMatch ? titleMatch[1].trim() : metadata.title,
        h1Title: h1Match ? h1Match[1].trim() : metadata.h1Title,
        description: descMatch ? descMatch[1].trim() : metadata.description,
        keyword: keywordMatch ? keywordMatch[1].trim() : metadata.keyword,
        objectivePhrase: objectiveMatch ? objectiveMatch[1].trim() : metadata.objectivePhrase,
        keywords: keywordsMatch ? keywordsMatch[1].split(',').map((k: string) => k.trim()) : metadata.keywords
      }

      console.log('✅ [METADATA] Metadatos traducidos:', result)

      return result

    } catch (error) {
      console.error('❌ [METADATA] Error:', error)
      throw error instanceof Error ? error : new Error('Failed to translate metadata')
    }
  }
}

export const translatorService = new TranslatorService()
export type { TranslationData, TranslatedData }
