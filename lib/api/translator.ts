/**
 * Pure Translation Service
 * Handles content translation through API routes - NO SEO optimization
 */

import { TokenManager } from '@/lib/utils/token-manager'

interface TranslationData {
  title: string
  seoTitle?: string
  description?: string
  keyword: string
  objectivePhrase?: string
  keywords?: string[]
  relatedKeywords?: string[]
  h1Title?: string
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
   * 🎯 PASO 1: Traducir campos básicos (keyword, titles, meta)
   */
  private async translateBasicFields(
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
    const prompt = `Traduce estos campos de Yoast SEO Configuration a ${targetLanguageName}:

🎯 FOCUS KEYWORD PRINCIPAL (USAR ESTE): ${data.keyword}
TITLE: ${data.title}
H1: ${data.h1Title || data.title}
DESCRIPTION: ${data.description}

🚨 IMPORTANTE: El FOCUS KEYWORD PRINCIPAL es "${data.keyword}" - ESTE es el que debes traducir y usar en todos los campos.

🔒 REGLAS CRÍTICAS DE PRESERVACIÓN:

1. 🎯 FOCUS KEYWORD - PRESERVAR NOMBRES PROPIOS:
   - Si contiene nombres de personas: "Scarlett Johansson" → mantener exacto
   - Si contiene marcas: "Netflix", "Disney", "iPhone" → mantener exactos
   - Si contiene términos específicos: "filmes", "anime", "K-pop" → mantener exactos
   - Solo traduce palabras genéricas: "mejores" → "best", "películas" → "movies"

2. 📝 ADAPTACIONES GRAMATICALES PERMITIDAS:
   - Puedes agregar artículos/preposiciones del idioma destino
   - "safari de onças-pintadas no Pantanal" → "safari de onças-pintadas no Pantanal" (mantener estructura)
   - "mejores películas Netflix" → "best Netflix movies" (reordenar si es natural)

3. 🚫 PROHIBIDO:
   - Cambiar nombres de personas: "Scarlett Johansson" → "Scarlett Johnson" ❌
   - Traducir marcas: "Netflix" → "Red de Películas" ❌
   - Perder términos específicos: "onças-pintadas" → "jaguares" ❌
   - Acortar el keyword: "safari de onças-pintadas no Pantanal" → "safari de onças Pantanal" ❌

4. ✅ CONSISTENCIA OBLIGATORIA:
   - El KEYWORD traducido debe ser IDÉNTICO en TITLE, H1 y DESCRIPTION
   - Usa EXACTAMENTE el keyword "${data.keyword}" traducido en todos los campos
   - NO uses versiones acortadas o modificadas del keyword

FORMATO DE RESPUESTA:
KEYWORD: [traducción exacta de "${data.keyword}" preservando estructura completa]
TITLE: [título traducido incluyendo el keyword completo exacto]
H1: [H1 traducido incluyendo el keyword completo exacto]
DESCRIPTION: [descripción traducida incluyendo el keyword completo exacto]
SLUG: [slug con palabras clave del idioma destino]`

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
      throw new Error('Error al traducir campos básicos')
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
      } else if (line.startsWith('TITLE:')) {
        seoTitle = line.replace('TITLE:', '').trim()
      } else if (line.startsWith('H1:')) {
        h1Title = line.replace('H1:', '').trim()
      } else if (line.startsWith('DESCRIPTION:')) {
        metaDescription = line.replace('DESCRIPTION:', '').trim()
      } else if (line.startsWith('SLUG:')) {
        slug = line.replace('SLUG:', '').trim()
      }
    }
    
    console.log('✅ [TRANSLATE] Campos básicos traducidos:', {
      keyword,
      title: seoTitle.substring(0, 50),
      h1Title: h1Title.substring(0, 50),
      slug
    })
    
    // 🔍 VALIDACIÓN DE CONSISTENCIA DEL KEYWORD
    console.log('🔍 [TRANSLATE] Validando consistencia del Focus Keyword...')
    console.log('  - Keyword traducido:', keyword)
    console.log('  - ¿Aparece en SEO Title?', seoTitle.toLowerCase().includes(keyword.toLowerCase()))
    console.log('  - ¿Aparece en H1?', h1Title.toLowerCase().includes(keyword.toLowerCase()))
    console.log('  - ¿Aparece en Meta Description?', metaDescription.toLowerCase().includes(keyword.toLowerCase()))
    
    // Validar que el keyword aparezca en los campos principales
    const keywordInTitle = seoTitle.toLowerCase().includes(keyword.toLowerCase())
    const keywordInH1 = h1Title.toLowerCase().includes(keyword.toLowerCase())
    const keywordInDescription = metaDescription.toLowerCase().includes(keyword.toLowerCase())
    
    if (!keywordInTitle && !keywordInH1) {
      console.warn('⚠️ [TRANSLATE] ADVERTENCIA: Focus Keyword no aparece en SEO Title ni H1')
    }
    
    if (!keywordInDescription) {
      console.warn('⚠️ [TRANSLATE] ADVERTENCIA: Focus Keyword no aparece en Meta Description')
    }
    
    // 🎯 VALIDACIÓN CRÍTICA DEL FOCUS KEYWORD
    const originalKeyword = data.keyword.toLowerCase()
    const translatedKeyword = keyword.toLowerCase()
    
    console.log('🔍 [TRANSLATE] VALIDACIÓN CRÍTICA DEL FOCUS KEYWORD:')
    console.log('  - Original:', data.keyword)
    console.log('  - Traducido:', keyword)
    
    // 🚨 DETECTAR SI SE ESTÁ USANDO UN KEYWORD INCORRECTO (de Related Keywords o Keywords Array)
    const originalWords = originalKeyword.split(' ')
    const translatedWords = translatedKeyword.split(' ')
    
    // Verificar que no se haya acortado significativamente el keyword
    if (translatedWords.length < originalWords.length - 1) {
      console.warn(`🚨 [TRANSLATE] ADVERTENCIA CRÍTICA: Keyword parece acortado`)
      console.warn(`  - Original tiene ${originalWords.length} palabras: "${data.keyword}"`)
      console.warn(`  - Traducido tiene ${translatedWords.length} palabras: "${keyword}"`)
      console.warn(`  - ¿Se está usando Related Keywords en lugar del Focus Keyword principal?`)
    }
    
    // Detectar nombres propios que deben preservarse
    const properNouns = ['scarlett johansson', 'brad pitt', 'leonardo dicaprio', 'netflix', 'disney', 'marvel', 'hbo', 'amazon prime', 'iphone', 'samsung', 'google', 'apple', 'microsoft']
    const specificTerms = ['filmes', 'anime', 'manga', 'k-pop', 'streaming', 'onças-pintadas', 'pantanal']
    
    let hasProperNouns = false
    for (const noun of properNouns) {
      if (originalKeyword.includes(noun)) {
        hasProperNouns = true
        if (!translatedKeyword.includes(noun)) {
          console.warn(`⚠️ [TRANSLATE] ADVERTENCIA: Nombre propio "${noun}" perdido en traducción`)
        }
      }
    }
    
    for (const term of specificTerms) {
      if (originalKeyword.includes(term)) {
        if (!translatedKeyword.includes(term)) {
          console.warn(`⚠️ [TRANSLATE] ADVERTENCIA: Término específico "${term}" perdido en traducción`)
        }
      }
    }
    
    // 🔍 VALIDACIÓN DE ESTRUCTURA COMPLETA
    if (originalKeyword.includes('onças-pintadas') && !translatedKeyword.includes('onças-pintadas')) {
      console.error('🚨 [TRANSLATE] ERROR CRÍTICO: "onças-pintadas" perdido - posible uso de Related Keywords')
    }
    
    if (originalKeyword.includes('pantanal') && !translatedKeyword.includes('pantanal')) {
      console.error('🚨 [TRANSLATE] ERROR CRÍTICO: "pantanal" perdido - posible uso de Related Keywords')
    }
    
    console.log('✅ [TRANSLATE] Validación de consistencia completada')
    
    return { keyword, seoTitle, h1Title, metaDescription, slug }
  }

  /**
   * 🎯 PASO 2: Traducir contenido usando los campos básicos ya traducidos
   */
  async translateWithStreaming(
    data: TranslationData,
    targetLanguage: string,
    targetLanguageName: string,
    options?: {
      modelId?: number
      onChunk?: (chunk: string) => void
      onFallbackToNormal?: () => void
    }
  ): Promise<TranslatedData> {
    try {
      console.log(`🌐 [TRANSLATE] Iniciando traducción pura a ${targetLanguageName}`)

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const modelId = options?.modelId || 1
      
      // 🎯 PASO 1: Traducir campos básicos primero
      console.log('📝 [TRANSLATE] PASO 1: Traduciendo campos básicos...')
      const basicFields = await this.translateBasicFields(data, targetLanguageName, modelId, token)
      
      console.log('✅ [TRANSLATE] Campos básicos traducidos correctamente')
      console.log('   🎯 Keyword:', basicFields.keyword)
      console.log('   📄 Title:', basicFields.seoTitle.substring(0, 60))
      
      // 🎯 PASO 2: Traducir contenido
      console.log('📝 [TRANSLATE] PASO 2: Traduciendo contenido...')
      
      // Construir prompt para traducir contenido
      const prompt = `Traduce este contenido HTML a ${targetLanguageName}.

🎯 FOCUS KEYWORD TRADUCIDO: "${basicFields.keyword}"

🚨 IMPORTANTE: Cuando encuentres el keyword original "${data.keyword}" en el contenido, 
reemplázalo EXACTAMENTE por "${basicFields.keyword}" para mantener consistencia SEO.

INSTRUCCIONES:
1. Traduce solo el texto dentro de los tags HTML
2. Mantén todos los tags exactamente como están
3. Cuando veas "${data.keyword}" → usa EXACTAMENTE "${basicFields.keyword}"
4. NO uses variaciones del keyword, usa la traducción exacta
5. Mantén la misma estructura y formato HTML

CONTENIDO A TRADUCIR:
${data.content}

Responde solo con el HTML traducido usando "${basicFields.keyword}" consistentemente.`
      
      console.log('📝 [TRANSLATE] Prompt construido, intentando streaming...')

      // Intentar con streaming
      const streamingResponse = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt: prompt,
          temperature: 0.3,
          max_tokens: 4000,
          stream: true,
          context: `Traducir contenido HTML a ${targetLanguageName} manteniendo estructura exacta`
        })
      })

      const contentType = streamingResponse.headers.get('content-type')
      const isStreamSupported = contentType?.includes('text/plain')

      if (!streamingResponse.ok) {
        console.log('❌ [TRANSLATE] Streaming falló, usando método normal')
        if (options?.onFallbackToNormal) {
          options.onFallbackToNormal()
        }
        return this.translateWithoutStreaming(data, targetLanguage, targetLanguageName, modelId)
      }

      if (!isStreamSupported) {
        console.log('⚠️ [TRANSLATE] Stream no soportado, usando método normal')
        if (options?.onFallbackToNormal) {
          options.onFallbackToNormal()
        }
        return this.translateWithoutStreaming(data, targetLanguage, targetLanguageName, modelId)
      }

      // Procesar streaming
      const reader = streamingResponse.body?.getReader()
      if (!reader) {
        console.log('❌ [TRANSLATE] No se pudo obtener reader, usando método normal')
        if (options?.onFallbackToNormal) {
          options.onFallbackToNormal()
        }
        return this.translateWithoutStreaming(data, targetLanguage, targetLanguageName, modelId)
      }

      let translatedContent = ''
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          translatedContent += chunk

          if (options?.onChunk) {
            options.onChunk(chunk)
          }
        }
      } catch (e) {
        console.error('❌ [TRANSLATE] Error en streaming:', e)
        if (options?.onFallbackToNormal) {
          options.onFallbackToNormal()
        }
        return this.translateWithoutStreaming(data, targetLanguage, targetLanguageName, modelId)
      }

      // Limpiar contenido traducido
      translatedContent = translatedContent
        // Remover elementos HTML extra que la IA agregó incorrectamente
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '')
        .replace(/<\/body>/gi, '')
        .replace(/<meta[^>]*>/gi, '')
        .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
        // Solo limpiar elementos HTML extra, NO convertir markdown
        .trim()

      if (!translatedContent || translatedContent.length < 50) {
        throw new Error('La IA no generó una traducción válida. Por favor, intenta de nuevo.')
      }

      if (translatedContent === data.content) {
        throw new Error('La traducción no se completó correctamente. El contenido no cambió.')
      }

      console.log('✅ [TRANSLATE] Contenido traducido y limpio:', translatedContent.length, 'chars')
      console.log('   Primeros 100 chars:', translatedContent.substring(0, 100))

      // ✅ Usar campos básicos del PASO 1 (ya traducidos correctamente)
      return {
        title: basicFields.seoTitle,
        seoTitle: basicFields.seoTitle,
        h1Title: basicFields.h1Title,
        description: basicFields.metaDescription,
        keyword: basicFields.keyword,
        objectivePhrase: data.objectivePhrase || '',
        keywords: data.keywords || [],
        relatedKeywords: [],
        slug: basicFields.slug,
        content: translatedContent
      }

    } catch (error: any) {
      console.error('❌ [TRANSLATE] Error traduciendo con streaming:', error)

      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.')
      }

      if (options?.onFallbackToNormal) {
        options.onFallbackToNormal()
      }

      return this.translateWithoutStreaming(data, targetLanguage, targetLanguageName, options?.modelId || 1)
    }
  }

  /**
   * Método de traducción sin streaming (fallback)
   */
  async translateWithoutStreaming(
    data: TranslationData,
    targetLanguage: string,
    targetLanguageName: string,
    modelId: number
  ): Promise<TranslatedData> {
    try {
      console.log(`🌐 [TRANSLATE-NORMAL] Traducción sin streaming a ${targetLanguageName}`)

      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // 🎯 PASO 1: Traducir campos básicos usando la misma lógica que translateWithStreaming
      console.log('📝 [TRANSLATE-NORMAL] PASO 1: Traduciendo campos básicos...')
      const basicFields = await this.translateBasicFields(data, targetLanguageName, modelId, token)
      
      console.log('✅ [TRANSLATE-NORMAL] Campos básicos traducidos correctamente')
      console.log('   🎯 Keyword:', basicFields.keyword)
      console.log('   📄 Title:', basicFields.seoTitle.substring(0, 60))
      
      // 🎯 PASO 2: Traducir solo el contenido
      const prompt = `Traduce este contenido HTML a ${targetLanguageName}.

🎯 FOCUS KEYWORD TRADUCIDO: "${basicFields.keyword}"

🚨 IMPORTANTE: Cuando encuentres el keyword original "${data.keyword}" en el contenido, 
reemplázalo EXACTAMENTE por "${basicFields.keyword}" para mantener consistencia SEO.

CONTENIDO A TRADUCIR:
${data.content}

INSTRUCCIONES - SOLO TRADUCIR:
1. MANTÉN todos los tags HTML exactamente como están
2. NO agregues nuevas negritas, títulos o formato
3. NO uses Markdown (**texto** o ## Título)
4. Traduce SOLO el texto dentro de los tags HTML
5. Cuando veas "${data.keyword}" → usa EXACTAMENTE "${basicFields.keyword}"
6. NO uses variaciones del keyword, usa la traducción exacta
7. NO agregues explicaciones ni comentarios
8. NO modifiques la estructura HTML existente

Responde solo con el HTML traducido usando "${basicFields.keyword}" consistentemente.`

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
          maxTokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      let translatedContent = result.data?.content || result.content || ''

      // 🧹 LIMPIEZA: Convertir Markdown residual a HTML en método fallback
      let cleanContent = translatedContent.trim()
      cleanContent = cleanContent
        // 🔧 CONVERTIR MARKDOWN A HTML si la IA lo agregó por error
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **texto** → <strong>texto</strong>
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')           // ### Título → <h3>Título</h3>
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')            // ## Título → <h2>Título</h2>
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')             // # Título → <h1>Título</h1>

      console.log('✅ [TRANSLATE-NORMAL] Contenido traducido y limpio:', cleanContent.length, 'chars')
      console.log('   Primeros 100 chars:', cleanContent.substring(0, 100))

      // ✅ Usar campos básicos del PASO 1 (ya traducidos correctamente)
      return {
        title: basicFields.seoTitle,
        seoTitle: basicFields.seoTitle,
        h1Title: basicFields.h1Title,
        description: basicFields.metaDescription,
        keyword: basicFields.keyword,
        objectivePhrase: data.objectivePhrase || '',
        keywords: data.keywords || [],
        relatedKeywords: [],
        slug: basicFields.slug,
        content: cleanContent
      }

    } catch (error) {
      console.error('❌ [TRANSLATE-NORMAL] Error:', error)
      throw error instanceof Error ? error : new Error('Failed to translate without streaming')
    }
  }

  /**
   * 🔗 Genera slug desde título
   */
  private generateSlugFromTitle(title: string): string {
    if (!title) return ''
    
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
      .replace(/^-|-$/g, '') // Remover guiones al inicio y final
  }

  /**
   * Obtener nombre del idioma desde código
   */
  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'en': 'inglés',
      'fr': 'francés', 
      'pt': 'portugués',
      'it': 'italiano',
      'de': 'alemán',
      'ja': 'japonés',
      'ko': 'coreano',
      'zh': 'chino',
      'ru': 'ruso',
      'ar': 'árabe'
    }
    return languages[code] || code
  }

  /**
   * Traducción simple de artículo completo
   */
  async translateArticleSimple(
    title: string,
    content: string,
    keyword: string,
    targetLanguage: string,
    targetLanguageName: string,
    modelId: number
  ): Promise<{ title: string; keyword: string; content: string }> {
    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const prompt = `Eres un traductor profesional experto en contenido.

Traduce el siguiente artículo completo a ${targetLanguageName}:

TÍTULO: ${title}
KEYWORD: ${keyword}

CONTENIDO HTML:
${content}

INSTRUCCIONES - SOLO TRADUCIR:
1. Traduce TODO a ${targetLanguageName}
2. MANTÉN todos los tags HTML exactamente como están
3. NO agregues nuevas negritas, títulos o formato
4. NO uses Markdown (**texto** o ## Título)
5. Traduce SOLO el texto dentro de los tags
6. NO modifiques la estructura HTML
7. Devuelve en este formato EXACTO:

TITLE: [título traducido]
KEYWORD: [keyword traducida]
CONTENT:
[contenido HTML traducido - SIN MARKDOWN]`

      console.log(`🌐 [SIMPLE-TRANSLATE] Traduciendo artículo completo a ${targetLanguageName}`)

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
          maxTokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      const translated = data.data?.content || data.content || ''

      // Parsear respuesta
      const titleMatch = translated.match(/TITLE:\s*(.+)/i)
      const keywordMatch = translated.match(/KEYWORD:\s*(.+)/i)
      
      // Extraer contenido después de "CONTENT:"
      const contentMatch = translated.match(/CONTENT:\s*([\s\S]+)/i)
      
      const result = {
        title: titleMatch ? titleMatch[1].trim() : title,
        keyword: keywordMatch ? keywordMatch[1].trim() : keyword,
        content: contentMatch ? contentMatch[1].trim() : content
      }

      // 🧹 LIMPIEZA: Convertir Markdown residual a HTML
      let cleanContent = result.content
      cleanContent = cleanContent
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **texto** → <strong>texto</strong>
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')           // ### Título → <h3>Título</h3>
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')            // ## Título → <h2>Título</h2>
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')             // # Título → <h1>Título</h1>

      result.content = cleanContent

      console.log('✅ [SIMPLE-TRANSLATE] Artículo traducido:', result.title)
      return result

    } catch (error) {
      console.error('❌ [SIMPLE-TRANSLATE] Error:', error)
      throw error instanceof Error ? error : new Error('Failed to translate article')
    }
  }

  /**
   * Traducir una sección individual
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

INSTRUCCIONES - SOLO TRADUCIR:
1. MANTÉN todos los tags HTML exactamente como están
2. NO agregues nuevas negritas, títulos o formato
3. NO uses Markdown (**texto** o ## Título)
4. Traduce SOLO el texto dentro de los tags HTML
5. NO agregues explicaciones ni comentarios
6. NO modifiques la estructura HTML existente
7. Devuelve SOLO el HTML traducido

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
          prompt: prompt,
          temperature: 0.3,
          maxTokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      let translated = data.data?.content || data.content || sectionContent

      // 🧹 LIMPIEZA: Convertir Markdown residual a HTML
      translated = translated
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **texto** → <strong>texto</strong>
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')           // ### Título → <h3>Título</h3>
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')            // ## Título → <h2>Título</h2>
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')             // # Título → <h1>Título</h1>
      
      console.log('🔧 [SECTION] Contenido limpiado y convertido Markdown→HTML')
      console.log(`✅ [SECTION] Sección traducida (${translated.length} chars)`)

      return translated

    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to translate section')
    }
  }
}

export const translatorService = new TranslatorService()
export type { TranslationData, TranslatedData }
