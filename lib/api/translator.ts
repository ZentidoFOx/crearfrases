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
   * Detectar nombres propios y términos específicos que deben preservarse
   */
  private detectProperNouns(keyword: string): string[] {
    const properNouns: string[] = []
    
    // Lista de nombres propios comunes
    const knownProperNouns = [
      'Scarlett Johansson', 'Brad Pitt', 'Leonardo DiCaprio', 'Jennifer Lawrence',
      'Netflix', 'Disney', 'Marvel', 'DC Comics', 'HBO', 'Amazon Prime',
      'iPhone', 'Samsung', 'Google', 'Apple', 'Microsoft',
      'PlayStation', 'Xbox', 'Nintendo', 'Steam',
      'YouTube', 'Instagram', 'Facebook', 'Twitter', 'TikTok'
    ]
    
    // Términos específicos que suelen mantenerse
    const specificTerms = [
      'filmes', 'anime', 'manga', 'K-pop', 'J-pop',
      'streaming', 'podcast', 'vlog', 'blog'
    ]
    
    // Detectar nombres propios conocidos
    for (const noun of knownProperNouns) {
      if (keyword.toLowerCase().includes(noun.toLowerCase())) {
        properNouns.push(noun)
      }
    }
    
    // Detectar términos específicos
    for (const term of specificTerms) {
      if (keyword.toLowerCase().includes(term.toLowerCase())) {
        properNouns.push(term)
      }
    }
    
    // Detectar patrones de nombres propios (palabras que empiezan con mayúscula)
    const words = keyword.split(' ')
    for (const word of words) {
      if (word.length > 2 && word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) {
        if (!properNouns.includes(word)) {
          properNouns.push(word)
        }
      }
    }
    
    return properNouns
  }

  /**
   * Validar que los nombres propios se preservaron en la traducción
   * Permite pequeñas adaptaciones gramaticales (artículos, preposiciones)
   */
  private validateProperNounsPreserved(originalKeyword: string, translatedKeyword: string): boolean {
    const properNouns = this.detectProperNouns(originalKeyword)
    
    for (const noun of properNouns) {
      // Para nombres de personas, solo verificar que el nombre completo esté presente
      if (noun.includes(' ') && noun[0] === noun[0].toUpperCase()) {
        // Es un nombre de persona (ej: "Scarlett Johansson")
        if (!translatedKeyword.toLowerCase().includes(noun.toLowerCase())) {
          console.warn(`⚠️ [TRANSLATE] Nombre de persona perdido en traducción: "${noun}"`)
          console.warn(`   Original: "${originalKeyword}"`)
          console.warn(`   Traducido: "${translatedKeyword}"`)
          return false
        }
      } else {
        // Para otros términos, verificar presencia exacta
        if (!translatedKeyword.toLowerCase().includes(noun.toLowerCase())) {
          console.warn(`⚠️ [TRANSLATE] Término específico perdido en traducción: "${noun}"`)
          console.warn(`   Original: "${originalKeyword}"`)
          console.warn(`   Traducido: "${translatedKeyword}"`)
          return false
        }
      }
    }
    
    return true
  }

  /**
   * Construir prompt para traducción
   */
  private buildTranslationPrompt(
    data: TranslationData,
    targetLanguageName: string
  ): string {
    return `Traduce este artículo completo a ${targetLanguageName}.

DATOS ORIGINALES:
TITLE: ${data.title}
SEO_TITLE: ${data.seoTitle || data.title}
H1: ${data.h1Title || data.title}
DESCRIPTION: ${data.description}
KEYWORD: ${data.keyword}
SLUG: ${data.slug || ''}

CONTENT:
${data.content}

INSTRUCCIONES:
1. Traduce TODO a ${targetLanguageName}
2. Mantén el formato HTML/Markdown exacto
3. Devuelve en este formato:

TITLE: [título traducido]
SEO_TITLE: [título SEO traducido]
H1: [título H1 traducido]
DESCRIPTION: [descripción traducida]
KEYWORD: [keyword traducido]
SLUG: [slug-traducido]
CONTENT:
[contenido HTML traducido]`
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
    const prompt = `Traduce estos campos SEO a ${targetLanguageName}:

KEYWORD: ${data.keyword}
TITLE: ${data.title}
H1: ${data.h1Title || data.title}
DESCRIPTION: ${data.description}

REGLAS:
- Preserva nombres propios (personas, marcas)
- Permite adaptaciones gramaticales naturales
- Traduce solo palabras genéricas

FORMATO:
KEYWORD: [keyword traducido]
SEO_TITLE: [título SEO traducido]
H1: [título H1 traducido]
DESCRIPTION: [descripción traducida]
SLUG: [slug-traducido]`

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
    
    // Validar que los nombres propios se preservaron (permite adaptaciones gramaticales)
    if (!this.validateProperNounsPreserved(data.keyword, keyword)) {
      console.error('❌ [TRANSLATE-SEO] Nombres propios no preservados correctamente')
      console.error(`   Original: "${data.keyword}"`)
      console.error(`   Traducido: "${keyword}"`)
      
      // Intentar corregir automáticamente solo si realmente faltan nombres propios
      const properNouns = this.detectProperNouns(data.keyword)
      console.log('🔧 [TRANSLATE-SEO] Verificando nombres propios:', properNouns)
      
      // Solo usar fallback si realmente se perdieron nombres de personas o marcas importantes
      let shouldUseFallback = false
      for (const noun of properNouns) {
        if (noun.includes(' ') && noun[0] === noun[0].toUpperCase()) {
          // Es un nombre de persona completo que debe preservarse exactamente
          if (!keyword.toLowerCase().includes(noun.toLowerCase())) {
            shouldUseFallback = true
            break
          }
        }
      }
      
      if (shouldUseFallback) {
        console.log('🔄 [TRANSLATE-SEO] Usando keyword original como fallback para preservar nombres propios críticos')
        keyword = data.keyword
      } else {
        console.log('✅ [TRANSLATE-SEO] Nombres propios preservados, adaptaciones gramaticales permitidas')
      }
    }
    
    console.log('✅ [TRANSLATE-SEO] Campos SEO traducidos:', {
      keyword,
      seoTitle: seoTitle.substring(0, 50),
      h1Title: h1Title.substring(0, 50),
      slug,
      properNounsPreserved: this.validateProperNounsPreserved(data.keyword, keyword)
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
      const prompt = `Traduce este contenido HTML a ${targetLanguageName}.

REGLAS:
1. Traduce SOLO el texto, mantén todos los tags HTML exactos
2. NO agregues contenido extra
3. NO modifiques la estructura

CONTENIDO:
${data.content}

Responde solo con el HTML traducido.`
      
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

      // 🎯 GENERAR SLUG DESDE SEO TITLE
      const finalSeoTitle = seoTitle || data.seoTitle || title || data.title
      const generatedSlug = this.generateSlugFromSeoTitle(finalSeoTitle)
      
      console.log('🔗 [TRANSLATE-NORMAL] Generando slug desde SEO Title:', {
        seoTitle: finalSeoTitle,
        generatedSlug,
        originalSlug: slug || data.slug
      })

      return {
        title: title || data.title,
        seoTitle: finalSeoTitle,
        h1Title: h1Title || data.h1Title || data.title,
        description: description || data.description || '',
        keyword: keyword,  // ← AHORA OBLIGATORIO
        objectivePhrase: objective || data.objectivePhrase || '',
        keywords: keywords || data.keywords || [],
        relatedKeywords: relatedKeywords || data.relatedKeywords || [],
        slug: generatedSlug, // ← GENERADO DESDE SEO TITLE
        content: translatedContent
      }

    } catch (error: any) {
      console.error('❌ [TRANSLATE-NORMAL] Error:', error)
      throw new Error(`Error al traducir: ${error.message || 'Error desconocido'}`)
    }
  }

  /**
   * 🔗 Genera slug desde SEO Title
   */
  private generateSlugFromSeoTitle(seoTitle: string): string {
    if (!seoTitle) return ''
    
    return seoTitle
      .toLowerCase()
      .trim()
      // Remover caracteres especiales y acentos
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Remover caracteres que no sean letras, números o espacios
      .replace(/[^a-z0-9\s-]/g, '')
      // Reemplazar espacios múltiples con uno solo
      .replace(/\s+/g, ' ')
      .trim()
      // Reemplazar espacios con guiones
      .replace(/\s/g, '-')
      // Remover guiones múltiples
      .replace(/-+/g, '-')
      // Remover guiones al inicio y final
      .replace(/^-+|-+$/g, '')
      // Limitar longitud
      .substring(0, 100)
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
