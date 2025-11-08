/**
 * Translation Service
 * Handles content translation using Vercel AI SDK
 */

import { generateObject, streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import * as z from 'zod'

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

// Schema Zod para validación automática
const translationSchema = z.object({
  title: z.string().describe('Título SEO traducido (40-60 caracteres)'),
  h1Title: z.string().describe('Título H1 traducido'),
  description: z.string().describe('Meta descripción traducida (150-160 caracteres)'),
  keyword: z.string().describe('Palabra clave principal traducida'),
  objectivePhrase: z.string().describe('Frase objetivo traducida'),
  keywords: z.array(z.string()).describe('Array de keywords relacionadas traducidas'),
  content: z.string().describe('Contenido completo del artículo traducido en formato markdown. CRÍTICO: Debes preservar EXACTAMENTE la estructura markdown del original (##, ###, **, *, -, saltos de línea \\n\\n). NO juntes párrafos. NO elimines etiquetas markdown. Mantén la misma cantidad de saltos de línea y espaciado que el texto original.')
})

class TranslatorService {
  private apiKey: string

  constructor() {
    // Obtener API key
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    
    if (!key) {
      throw new Error('Gemini API key is not configured. Set NEXT_PUBLIC_GEMINI_API_KEY')
    }

    this.apiKey = key
  }

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

      const prompt = `Eres un traductor profesional especializado en contenido web. Tu tarea es traducir de ESPAÑOL a ${targetLanguageName.toUpperCase()}.

CONTENIDO A TRADUCIR:

📌 METADATOS:
- Título SEO: ${data.title}
- Título H1: ${data.h1Title || data.title}
- Meta descripción: ${data.description || ''}
- Keyword: ${data.keyword}
- Frase objetivo: ${data.objectivePhrase || ''}
- Keywords: ${data.keywords?.join(', ') || ''}

📝 ARTÍCULO COMPLETO (FORMATO MARKDOWN):
${data.content}

⚠️ INSTRUCCIONES CRÍTICAS - DEBES SEGUIRLAS EXACTAMENTE:

1️⃣ **PRESERVAR ESTRUCTURA MARKDOWN AL 100%**:
   - Si ves "## Título" → Traduce SOLO el texto, mantén "##"
   - Si ves "### Subtítulo" → Traduce SOLO el texto, mantén "###"
   - Si ves "**texto en negrita**" → Traduce el texto, mantén "**" alrededor
   - Si ves "*texto en cursiva*" → Traduce el texto, mantén "*" alrededor
   - Si ves "- elemento lista" → Traduce el texto, mantén "- " al inicio
   - Si ves "1. elemento numerado" → Traduce el texto, mantén "1. " al inicio
   - RESPETA TODOS LOS SALTOS DE LÍNEA (\n\n entre párrafos)

2️⃣ **PRESERVAR IMÁGENES TOTALMENTE**:
   - Si ves "![alt text](url)" → Traduce SOLO "alt text", NO toques la URL
   - Si ves "<img src="url">" → Déjalo EXACTAMENTE igual, NO lo modifiques
   - NUNCA elimines o modifiques URLs de imágenes

3️⃣ **MANTENER SALTOS DE LÍNEA Y PÁRRAFOS**:
   - Si hay dos saltos de línea (\n\n) entre párrafos → MANTENLOS
   - Si hay espacios entre secciones → RESPÉTALOS
   - NO juntes párrafos separados en uno solo
   - Cada párrafo debe mantenerse como párrafo individual

4️⃣ **NO TRADUCIR**:
   - URLs (https://...)
   - Nombres propios de personas, lugares, empresas
   - Marcas comerciales
   - Códigos técnicos
   - Rutas de archivos

5️⃣ **SÍ TRADUCIR**:
   - Todo el texto de contenido
   - Títulos y subtítulos (pero manteniendo ##, ###)
   - Descripciones ALT de imágenes
   - Listas y elementos
   - Metadatos (título, descripción, keywords)

6️⃣ **CALIDAD DE TRADUCCIÓN**:
   - Traduce de forma natural y fluida en ${targetLanguageName}
   - Adapta expresiones idiomáticas al contexto cultural
   - Optimiza para SEO en el idioma destino
   - Mantén el tono profesional del original

🔍 EJEMPLO DE TRADUCCIÓN CORRECTA:

ORIGINAL:
## Beneficios del Marketing Digital

El marketing digital ofrece múltiples ventajas.

**Ventajas principales:**
- Mayor alcance
- Bajo costo

![Marketing](https://ejemplo.com/imagen.jpg)

TRADUCCIÓN CORRECTA A INGLÉS:
## Benefits of Digital Marketing

Digital marketing offers multiple advantages.

**Main Advantages:**
- Greater reach
- Low cost

![Marketing](https://ejemplo.com/imagen.jpg)

❌ TRADUCCIÓN INCORRECTA:
Benefits of Digital Marketing Digital marketing offers multiple advantages. Main Advantages: Greater reach Low cost

⚠️ NOTA: La traducción INCORRECTA perdió los "##", "**", "-" y saltos de línea. TU traducción NUNCA debe hacer esto.

🎯 AHORA TRADUCE EL CONTENIDO RESPETANDO AL 100% LA ESTRUCTURA MARKDOWN.`

      // Crear instancia de Google Generative AI con la API key
      const google = createGoogleGenerativeAI({
        apiKey: this.apiKey
      })
      
      // Modelo
      const model = google('gemini-2.5-flash')

      // Usar Vercel AI SDK con validación Zod
      const result = await generateObject({
        model: model,
        schema: translationSchema,
        prompt: prompt,
        temperature: 0.3  // Baja temperatura para mayor precisión y preservación de estructura
      })

      console.log('✅ Traducción completada con Vercel AI SDK')
      console.log(`   Título SEO: ${result.object.title}`)
      console.log(`   Título H1: ${result.object.h1Title}`)
      console.log(`   Keyword: ${result.object.keyword}`)
      console.log(`   Keywords: ${result.object.keywords.join(', ')}`)
      console.log(`   Contenido: ${result.object.content.substring(0, 100)}...`)

      return result.object as TranslatedData

    } catch (error: any) {
      console.error('❌ Error en traducción:', error)
      
      // Mensajes de error específicos
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión con Gemini API. Verifica tu conexión a internet.')
      }
      
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        throw new Error('API key de Gemini no válida. Verifica tu configuración.')
      }
      
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        throw new Error('Límite de cuota de Gemini alcanzado. Intenta más tarde.')
      }
      
      throw new Error(`Error al traducir: ${error.message || 'Error desconocido'}`)
    }
  }

  /**
   * Traducir contenido con STREAMING en tiempo real
   * @param data - Datos a traducir
   * @param targetLanguage - Código del idioma destino
   * @param targetLanguageName - Nombre del idioma destino
   * @param onChunk - Callback que recibe cada chunk de contenido traducido
   */
  async translateWithStreaming(
    data: TranslationData,
    targetLanguage: string,
    targetLanguageName: string,
    onChunk: (chunk: string, accumulated: string) => void
  ): Promise<TranslatedData> {
    try {
      console.log(`🌐 Iniciando traducción CON STREAMING a ${targetLanguageName} (${targetLanguage})`)

      const prompt = `Eres un traductor profesional especializado en contenido web. Tu tarea es traducir de ESPAÑOL a ${targetLanguageName.toUpperCase()}.

CONTENIDO A TRADUCIR:

📌 METADATOS:
- Título SEO: ${data.title}
- Título H1: ${data.h1Title || data.title}
- Meta descripción: ${data.description || ''}
- Keyword: ${data.keyword}
- Frase objetivo: ${data.objectivePhrase || ''}
- Keywords: ${data.keywords?.join(', ') || ''}

📝 ARTÍCULO COMPLETO (FORMATO MARKDOWN):
${data.content}

⚠️ INSTRUCCIONES CRÍTICAS - DEBES SEGUIRLAS EXACTAMENTE:

1️⃣ **PRESERVAR ESTRUCTURA MARKDOWN AL 100%**:
   - Si ves "## Título" → Traduce SOLO el texto, mantén "##"
   - Si ves "### Subtítulo" → Traduce SOLO el texto, mantén "###"
   - Si ves "**texto en negrita**" → Traduce el texto, mantén "**" alrededor
   - Si ves "*texto en cursiva*" → Traduce el texto, mantén "*" alrededor
   - Si ves "- elemento lista" → Traduce el texto, mantén "- " al inicio
   - Si ves "1. elemento numerado" → Traduce el texto, mantén "1. " al inicio
   - RESPETA TODOS LOS SALTOS DE LÍNEA (\n\n entre párrafos)

2️⃣ **PRESERVAR IMÁGENES TOTALMENTE**:
   - Si ves "![alt text](url)" → Traduce SOLO "alt text", NO toques la URL
   - Si ves "<img src="url">" → Déjalo EXACTAMENTE igual, NO lo modifiques
   - NUNCA elimines o modifiques URLs de imágenes

3️⃣ **MANTENER SALTOS DE LÍNEA Y PÁRRAFOS**:
   - Si hay dos saltos de línea (\n\n) entre párrafos → MANTENLOS
   - Si hay espacios entre secciones → RESPÉTALOS
   - NO juntes párrafos separados en uno solo
   - Cada párrafo debe mantenerse como párrafo individual

4️⃣ **NO TRADUCIR**:
   - URLs (https://...)
   - Nombres propios de personas, lugares, empresas
   - Marcas comerciales
   - Códigos técnicos
   - Rutas de archivos

5️⃣ **SÍ TRADUCIR**:
   - Todo el texto de contenido
   - Títulos y subtítulos (pero manteniendo ##, ###)
   - Descripciones ALT de imágenes
   - Listas y elementos
   - Metadatos (título, descripción, keywords)

6️⃣ **CALIDAD DE TRADUCCIÓN**:
   - Traduce de forma natural y fluida en ${targetLanguageName}
   - Adapta expresiones idiomáticas al contexto cultural
   - Optimiza para SEO en el idioma destino
   - Mantén el tono profesional del original

🎯 RESPONDE SOLO CON LA TRADUCCIÓN, SIN EXPLICACIONES ADICIONALES.

FORMATO DE RESPUESTA:
TITLE: [título traducido]
H1: [título h1 traducido]
DESCRIPTION: [descripción traducida]
KEYWORD: [keyword traducida]
OBJECTIVE: [frase objetivo traducida]
KEYWORDS: [keywords traducidas separadas por comas]

CONTENT:
[contenido markdown traducido preservando EXACTAMENTE la estructura]`

      // Crear instancia de Google Generative AI
      const google = createGoogleGenerativeAI({
        apiKey: this.apiKey
      })
      
      const model = google('gemini-2.0-flash-exp')

      // Usar Vercel AI SDK con STREAMING
      const result = await streamText({
        model: model,
        prompt: prompt,
        temperature: 0.3  // Baja temperatura para mayor precisión
      })

      // Procesar el stream en tiempo real
      let accumulatedText = ''
      
      for await (const textPart of result.textStream) {
        accumulatedText += textPart
        // Llamar al callback con cada chunk
        onChunk(textPart, accumulatedText)
      }

      // 🔍 PARSEAR LA RESPUESTA TRADUCIDA CON VALIDACIÓN
      console.log('📝 Texto acumulado completo:', accumulatedText.substring(0, 500) + '...')
      
      const lines = accumulatedText.split('\n')
      
      // ⚠️ NO inicializar con valores originales - usar null para detectar si no se tradujo
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

      // ✅ VALIDAR QUE SE OBTUVIERON TRADUCCIONES
      const translatedContent = content.trim()
      
      console.log('🔍 Validando traducción...')
      console.log('  - Título traducido:', title || 'NO ENCONTRADO')
      console.log('  - H1 traducido:', h1Title || 'NO ENCONTRADO')
      console.log('  - Contenido traducido (primeros 200 chars):', translatedContent.substring(0, 200))
      
      // Si no se obtuvo contenido traducido, lanzar error
      if (!translatedContent || translatedContent.length < 50) {
        console.error('❌ ERROR: No se obtuvo contenido traducido válido')
        console.error('Respuesta de IA completa:', accumulatedText)
        throw new Error('La IA no generó una traducción válida. Por favor, intenta de nuevo.')
      }
      
      // Validar que el contenido está en el idioma correcto
      // (verificar que no sea el mismo que el original)
      if (translatedContent === data.content) {
        console.error('❌ ERROR: El contenido traducido es IDÉNTICO al original')
        throw new Error('La traducción no se completó correctamente. El contenido no cambió.')
      }
      
      console.log('✅ Traducción validada correctamente')
      console.log(`   Original: ${data.content.length} chars`)
      console.log(`   Traducido: ${translatedContent.length} chars`)

      return {
        title: title || data.title,  // Fallback solo si no se tradujo
        h1Title: h1Title || data.h1Title || data.title,
        description: description || data.description || '',
        keyword: keyword || data.keyword,
        objectivePhrase: objective || data.objectivePhrase || '',
        keywords: keywords || data.keywords || [],
        content: translatedContent  // ✅ SIEMPRE contenido traducido validado
      }

    } catch (error: any) {
      console.error('Error traduciendo con streaming:', error)
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión con Gemini API. Verifica tu conexión a internet.')
      }
      
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        throw new Error('API key de Gemini no válida. Verifica tu configuración.')
      }
      
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        throw new Error('Límite de cuota de Gemini alcanzado. Intenta más tarde.')
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
