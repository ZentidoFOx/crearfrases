/**
 * Humanizer Service
 * Convierte contenido generado por IA en texto más natural y humano
 */

import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

interface HumanizeResult {
  content: string
  originalLength: number
  humanizedLength: number
  improvements: string[]
}

class HumanizerService {
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
   * Humanizar contenido de artículo
   */
  async humanizeContent(content: string, options?: {
    preserveMarkdown?: boolean
    tone?: 'professional' | 'casual' | 'friendly'
    targetAudience?: string
  }): Promise<HumanizeResult> {
    try {
      console.log('🤖➡️👤 Iniciando humanización de contenido...')

      const preserveMarkdown = options?.preserveMarkdown ?? true
      const tone = options?.tone ?? 'professional'
      const targetAudience = options?.targetAudience ?? 'público general'

      const prompt = `Eres redactor profesional. Reescribe este texto eliminando TODOS los patrones de IA.

📝 CONTENIDO:
${content}

## 🚫 PALABRAS/FRASES PROHIBIDAS:
Descubre | Explora | Sumérgete | Embárcate | Adéntrate | Desata | Experimenta | Revela | Desbloquea | Transforma | Maximiza | Optimiza | Potencia | ¿Te imaginas? | ¡Absolutamente! | ¡Claro! | Prepárate para | ¿Estás listo? | Es importante destacar | Cabe mencionar | Sin duda | En primer lugar | Por otro lado | En conclusión | Es más que X es Y | Esta fantasía se hace realidad | Momentos inolvidables | Una experiencia que te dejará sin aliento | Esta guía te proporcionará | ¿Alguna vez has soñado? | donde la paciencia se recompensa | una oportunidad de conectar

**Si aparece CUALQUIERA de estas palabras/frases → FALLASTE.**

---

## ✅ EJEMPLOS (Sigue ESTE estilo):

❌ **IA (MAL):**
"¿Te imaginas ver un jaguar acechando? En el Pantanal, esta fantasía se hace realidad. Y 2026 podría ser tu año. Adentrarse en el Pantanal es más que un viaje; es una inmersión en la naturaleza. Prepárate para una experiencia que te dejará sin aliento."

✅ **PROFESIONAL (BIEN):**
"El Pantanal tiene 90% de tasa de avistamiento de jaguares. Lee eso otra vez. Noventa por ciento. Estás a 5 metros del felino. Puedes ver su respiración. Eso no pasa en ningún otro lugar del mundo. Julio a octubre es cuando ocurre. Necesitas un guía que sepa dónde buscar."

**REGLAS:**
1. Frases cortas y largas mezcladas
2. Datos concretos, no promesas vacías
3. "Tú/te" en vez de lenguaje impersonal
4. Sin conectores obvios ("en primer lugar", "por otro lado")
5. Sin frases motivacionales ("fantasía se hace realidad")
6. Sin estructura "es más que X, es Y"

**Tono:** ${tone} | **Audiencia:** ${targetAudience}

---

## ⚡ INSTRUCCIÓN:

${preserveMarkdown ? `
🔧 **ESTRUCTURA - PASO A PASO:**

**PASO 1:** CUENTA encabezados del original:
- Cuántos ## hay
- Cuántos ### hay
- Cuántos #### hay

**PASO 2:** Tu resultado DEBE tener la MISMA cantidad y niveles:
- Original: "## Intro" → Tú: "## [humanizado]"
- Original: "### Parte 1" → Tú: "### [humanizado]"
- Original: "### Parte 2" → Tú: "### [humanizado]"

**PASO 3:** Párrafos - mantén cantidad similar

**PASO 4:** 🚨 SEPARACIÓN DE PÁRRAFOS - MUY IMPORTANTE:
- Cada párrafo debe estar separado por doble salto de línea (\n\n)
- NO juntes todo en un solo bloque de texto
- Si el original tiene 5 párrafos → Tú debes tener 5 párrafos separados
- Usa \n\n entre cada párrafo

❌ **NO:**
- Agregar/eliminar encabezados
- Cambiar niveles # (## a ###)
- Juntar todos los párrafos en uno solo
- Eliminar saltos de línea entre párrafos

✅ **SÍ:**
- Misma cantidad encabezados
- Mismos niveles #
- Párrafos separados con \n\n
- Solo humaniza TEXTO

` : ''}

🚀 **REESCRIBE. MISMA CANTIDAD ENCABEZADOS. MISMOS NIVELES #. PÁRRAFOS SEPARADOS CON \n\n. NO PALABRAS PROHIBIDAS.**`

      // Crear instancia de Google Generative AI
      const google = createGoogleGenerativeAI({
        apiKey: this.apiKey
      })
      
      const model = google('gemini-2.0-flash-exp') // Modelo gratuito y rápido

      // Usar Vercel AI SDK con STREAMING para humanizar
      const result = await streamText({
        model: model,
        prompt: prompt,
        temperature: 0.7 // Temperatura más alta para mejor calidad
      })

      // Acumular el texto conforme llega el stream
      let humanizedContent = ''
      
      for await (const textPart of result.textStream) {
        humanizedContent += textPart
      }

      // Análisis de mejoras
      const improvements: string[] = []
      
      // Detectar mejoras aplicadas
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
      
      // Análisis de longitud de frases
      const sentences = humanizedContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
      const lengths = sentences.map(s => s.trim().split(/\s+/).length)
      const variance = Math.max(...lengths) - Math.min(...lengths)
      if (variance > 10) {
        improvements.push('Variedad natural en longitud de frases')
      }

      console.log('✅ Humanización completada')
      console.log(`   Original: ${content.length} caracteres`)
      console.log(`   Humanizado: ${humanizedContent.length} caracteres`)
      console.log(`   Mejoras aplicadas: ${improvements.length}`)

      return {
        content: humanizedContent,
        originalLength: content.length,
        humanizedLength: humanizedContent.length,
        improvements
      }

    } catch (error: any) {
      console.error('❌ Error en humanización:', error)
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión con Gemini API. Verifica tu conexión a internet.')
      }
      
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        throw new Error('API key de Gemini no válida. Verifica tu configuración.')
      }
      
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        throw new Error('Límite de cuota de Gemini alcanzado. Intenta más tarde.')
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
   * @param content - Contenido a humanizar
   * @param onChunk - Callback que se llama con cada chunk de texto generado
   * @param options - Opciones de humanización
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

      const preserveMarkdown = options?.preserveMarkdown ?? true
      const tone = options?.tone ?? 'professional'
      const targetAudience = options?.targetAudience ?? 'público general'

      const prompt = `Eres un experto en redacción humana y natural. Tu tarea es transformar contenido generado por IA en texto que suene completamente HUMANO y NATURAL.

📝 CONTENIDO A HUMANIZAR:
${content}

🎯 OBJETIVO: Hacer que el texto suene 100% HUMANO, eliminando patrones típicos de IA.

⚠️ PROBLEMAS COMUNES DE TEXTO GENERADO POR IA QUE DEBES ELIMINAR:

❌ **Patrones Repetitivos:**
- Evita frases como "Es importante destacar que...", "Cabe mencionar que...", "Sin duda..."
- No uses estructuras repetitivas en cada párrafo
- Varía la longitud de las frases (algunas cortas, otras largas)

❌ **Lenguaje Demasiado Formal o Robótico:**
- No uses: "En el contexto de...", "A nivel de...", "En términos de..."
- Prefiere: Lenguaje directo y conversacional

❌ **Transiciones Artificiales:**
- No uses: "En primer lugar", "Por otro lado", "En consecuencia", "Por lo tanto"
- Usa transiciones naturales o simplemente conecta ideas fluidamente

✅ **TÉCNICAS DE HUMANIZACIÓN:**

1️⃣ Varía la Estructura de Frases
2️⃣ Usa Lenguaje Conversacional
3️⃣ Añade Personalidad y Voz
4️⃣ Conecta Ideas de Forma Natural
5️⃣ Tono ${tone.toUpperCase()}
6️⃣ Audiencia: ${targetAudience}

${preserveMarkdown ? `
🔧 **PRESERVACIÓN DE MARKDOWN - CRÍTICO:**
- ⚠️ **RESPETA LA JERARQUÍA DE ENCABEZADOS:**
  * Si el original tiene ## (H2), mantenlo como ##
  * Si el original tiene ### (H3), mantenlo como ###
  * Si el original tiene #### (H4), mantenlo como ####
  * **NO CAMBIES el nivel de los encabezados**
  * **NO CONVIERTAS todos los encabezados a ##**
- Preserva **negritas**, *cursivas*, listas (-, 1.)
- NO cambies la estructura markdown
- Solo humaniza el TEXTO dentro de los encabezados, no su nivel jerárquico
- 🚨 **MANTÉN SALTOS DE LÍNEA ENTRE PÁRRAFOS (\\n\\n)** - MUY IMPORTANTE
- 🚨 **NO JUNTES TODOS LOS PÁRRAFOS EN UNO SOLO**
- Cada párrafo debe estar separado por doble salto de línea
- Si hay imágenes ![](url), déjalas tal cual

**EJEMPLO CORRECTO:**
Original: "### Consejos Prácticos"
✅ Correcto: "### Consejos que Debes Saber"
❌ Incorrecto: "## Consejos que Debes Saber" (cambió de ### a ##)

**EJEMPLO PÁRRAFOS:**
❌ INCORRECTO: "Este es el párrafo 1. Este es el párrafo 2. Este es el párrafo 3."
✅ CORRECTO:
"Este es el párrafo 1.

Este es el párrafo 2.

Este es el párrafo 3."
` : ''}

🚀 HUMANIZA EL CONTENIDO AHORA (RECUERDA: PÁRRAFOS SEPARADOS CON \\n\\n):`

      // Crear instancia de Google Generative AI
      const google = createGoogleGenerativeAI({
        apiKey: this.apiKey
      })
      
      const model = google('gemini-2.0-flash-exp') // Modelo gratuito y rápido

      // Usar Vercel AI SDK con STREAMING
      const result = await streamText({
        model: model,
        prompt: prompt,
        temperature: 0.7 // Temperatura balanceada para creatividad y obediencia
      })

      // Procesar el stream en tiempo real
      let humanizedContent = ''
      
      for await (const textPart of result.textStream) {
        humanizedContent += textPart
        // Llamar al callback con cada chunk
        onChunk(textPart, humanizedContent)
      }

      // Análisis de mejoras
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
      
      const sentences = humanizedContent.split(/[.!?]+/).filter((s: any) => s.trim().length > 0)
      const lengths = sentences.map((s: any) => s.trim().split(/\s+/).length)
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
   * 🚀 HUMANIZAR Y MEJORAR - Función COMPLETA
   * - Humaniza el contenido
   * - Agrega negritas en palabras clave importantes
   * - Corrige problemas SEO automáticamente
   * - Todo en UNA SOLA operación
   */
  async humanizeAndOptimize(
    content: string,
    keyword: string,
    title: string,
    onProgress?: (step: string, progress: number) => void,
    onStreamingContent?: (chunk: string, accumulated: string) => void,
    options?: {
      tone?: 'professional' | 'casual' | 'friendly'
      targetAudience?: string
    }
  ): Promise<HumanizeResult & { seoIssuesFixed: number }> {
    try {
      console.log('🚀 Iniciando HUMANIZACIÓN Y OPTIMIZACIÓN COMPLETA...')
      
      onProgress?.('Analizando contenido...', 10)
      
      const tone = options?.tone ?? 'friendly'
      const targetAudience = options?.targetAudience ?? 'viajeros y amantes de la naturaleza'

      const prompt = `🚨 REGLA #1 CRÍTICA - LEE PRIMERO:

⚠️ KEYWORD: "${keyword}"
**MÁXIMO 7 VECES EN TODO EL TEXTO. NUNCA MÁS DE 7.**

Si pones la keyword más de 7 veces = FALLASTE COMPLETAMENTE.

---

📝 CONTENIDO:
${content}

📌 TÍTULO: "${title}"

---

## ⚠️ KEYWORD - LA REGLA MÁS IMPORTANTE:

**ANTES de escribir, CUENTA cuántas veces aparece "${keyword}" en el original.**

Si el original tiene 30 veces → TÚ REDUCES a solo 5-7 veces.
Si el original tiene 2 veces → TÚ AUMENTAS a 5-7 veces.

🚨 **TU TEXTO FINAL:**
- MÍNIMO: 5 veces
- MÁXIMO: 7 veces
- NUNCA: 8, 10, 15, 30 veces

❌ **SI ESCRIBES 30 VECES = FALLASTE**
❌ **SI ESCRIBES 15 VECES = FALLASTE**
❌ **SI ESCRIBES 8+ VECES = FALLASTE**

✅ CORRECTO: 5, 6 o 7 veces ÚNICAMENTE

Primera mención en **negrita**: **${keyword}**

---

## 🚫 PALABRAS PROHIBIDAS:
Descubre | Explora | Sumérgete | Embárcate | ¿Te imaginas? | ¡Absolutamente! | ¡Claro! | Prepárate para | Es importante destacar | En primer lugar | Por otro lado | En conclusión | Es más que X es Y | Esta fantasía se hace realidad

---

## ✅ ESTILO:
❌ IA: "¿Te imaginas ver un jaguar? Esta fantasía se hace realidad."
✅ BIEN: "El Pantanal tiene 90% de avistamiento. Lee eso otra vez."

## ⚠️ ESTRUCTURA - LEE CON ATENCIÓN:

**PASO 1:** CUENTA cuántos encabezados tiene el original:
- Cuenta ## (anótalos)
- Cuenta ### (anótalos)
- Cuenta #### (anótalos)

**PASO 2:** Tu resultado DEBE tener la MISMA cantidad:
- Si original tiene 2 encabezados ##, tú pones 2 encabezados ##
- Si original tiene 3 encabezados ###, tú pones 3 encabezados ###
- Si original tiene 1 encabezado ####, tú pones 1 encabezado ####

**PASO 3:** COPIA el nivel # de cada uno:
- Original: "## Título" → Tú: "## [texto humanizado]"
- Original: "### Sub" → Tú: "### [texto humanizado]"

**PASO 4:** Párrafos - mantén la cantidad similar (máximo +1 si necesario)

**PASO 5:** 🚨 SEPARACIÓN DE PÁRRAFOS - CRÍTICO:
- Cada párrafo debe estar separado por doble salto de línea (\n\n)
- NO juntes todo en un solo bloque de texto
- Si el original tiene 5 párrafos → Tú debes tener 5 párrafos separados
- Usa \n\n entre cada párrafo

❌ **EJEMPLO INCORRECTO (todo en un párrafo):**
"El Pantanal es increíble. Tiene 90% de avistamiento de jaguares. Es el mejor lugar del mundo para ver vida salvaje. Necesitas un guía experto."

✅ **EJEMPLO CORRECTO (párrafos separados):**
"El Pantanal es increíble. Tiene 90% de avistamiento de jaguares.

Es el mejor lugar del mundo para ver vida salvaje.

Necesitas un guía experto."

❌ **NO HAGAS:**
- Agregar encabezados nuevos
- Eliminar encabezados
- Cambiar ## por ###
- Cambiar ### por ##
- Juntar todos los párrafos en uno solo
- Eliminar saltos de línea entre párrafos

✅ **HAZ:**
- Mismo número total de encabezados
- Mismo nivel # en cada uno
- Párrafos separados con \n\n
- Solo humaniza el TEXTO

---

## 🚨 ANTES DE ENVIAR TU RESPUESTA:

1. CUENTA cuántas veces usaste "${keyword}" → ¿Es 5, 6 o 7?
2. Si usaste 8+ veces → REESCRIBE hasta que sea 5-7
3. Si el original tenía 30 veces y tú también → FALLASTE

🚀 **FORMATO DE SALIDA - MUY IMPORTANTE:**

Tu respuesta DEBE ser MARKDOWN puro con esta estructura EXACTA:

Párrafo 1 de introducción.

Párrafo 2 de introducción.

## Encabezado Sección 1

Párrafo 1 de la sección.

Párrafo 2 de la sección.

### Subsección 1.1

Párrafo de subsección.

## Encabezado Sección 2

Párrafo de sección 2.

❌ **NUNCA HAGAS ESTO:**
Párrafo 1. Párrafo 2. Párrafo 3. Todo junto sin separación.

✅ **SIEMPRE HAZ ESTO:**
Párrafo 1.

Párrafo 2.

Párrafo 3.

🚀 **REESCRIBE AHORA:**
- Keyword "${keyword}" EXACTAMENTE 5-7 veces (NO 30, NO 15, NO 8)
- Misma cantidad encabezados, mismos niveles #
- Cada párrafo separado por línea vacía (\\n\\n)
- NO juntes múltiples párrafos en uno solo
- No palabras prohibidas
- Mantén estructura original`

      onProgress?.('Generando contenido mejorado...', 30)

      // Crear instancia de Google Generative AI
      const google = createGoogleGenerativeAI({
        apiKey: this.apiKey
      })
      
      const model = google('gemini-2.0-flash-exp') // Modelo gratuito y rápido

      // Usar Vercel AI SDK con STREAMING
      const result = await streamText({
        model: model,
        prompt: prompt,
        temperature: 0.7 // Temperatura balanceada para creatividad y obediencia
      })

      onProgress?.('Recibiendo contenido optimizado...', 50)

      // Acumular el texto conforme llega el stream
      let optimizedContent = ''
      let chunkCount = 0
      const startTime = Date.now()
      
      console.log('🔥 INICIANDO STREAMING...')
      
      for await (const textPart of result.textStream) {
        chunkCount++
        optimizedContent += textPart
        
        // Actualizar progreso
        const progress = 50 + (optimizedContent.length / (content.length * 1.5)) * 40
        onProgress?.('Procesando contenido...', progress)
        
        // 🔥 ENVIAR CONTENIDO PARCIAL AL EDITOR (streaming) - CADA CHUNK
        if (onStreamingContent) {
          onStreamingContent(textPart, optimizedContent)
          
          // Log cada 5 chunks
          if (chunkCount % 5 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
            console.log(`📡 Chunk #${chunkCount}: +${textPart.length} chars | Total: ${optimizedContent.length} chars | ${elapsed}s`)
          }
        }
      }
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`✅ STREAMING COMPLETADO: ${chunkCount} chunks en ${totalTime}s | Total: ${optimizedContent.length} chars`)

      onProgress?.('Analizando mejoras aplicadas...', 95)

      // 🔥 POST-PROCESAMIENTO 1: ELIMINAR palabras prohibidas
      const prohibitedPatterns = [
        /\bDescubre\b/gi,
        /\bExplora\b/gi,
        /\bSumérgete\b/gi,
        /\bEmbárcate\b/gi,
        /\bAdéntrate\b/gi,
        /\bAdentrarse\b/gi,
        /\bDesata\b/gi,
        /\bExperimenta\b/gi,
        /\bRevela\b/gi,
        /\bDesbloquea\b/gi,
        /\bTransforma\b/gi,
        /\bMaximiza\b/gi,
        /\bmaximizando\b/gi,
        /\bOptimiza\b/gi,
        /\bPotencia\b/gi,
        /¿Te imaginas\?/gi,
        /¡Absolutamente!/gi,
        /¡Claro!/gi,
        /Prepárate para/gi,
        /¿Estás listo\?/gi,
        /Es importante destacar/gi,
        /Cabe mencionar/gi,
        /En primer lugar/gi,
        /Por otro lado/gi,
        /En conclusión/gi,
        /es más que .+ es /gi,
        /es una inmersión/gi,
        /Esta fantasía se hace realidad/gi,
        /Momentos inolvidables/gi,
        /Una experiencia inolvidable/gi,
        /experiencia inolvidable/gi,
        /Una experiencia que te dejará sin aliento/gi,
        /Esta guía te proporcionará/gi,
        /conexión profunda con la naturaleza/gi,
        /oportunidad única/gi
      ]
      
      console.log('🧹 Limpiando palabras prohibidas...')
      let cleanedCount = 0
      
      prohibitedPatterns.forEach(pattern => {
        const matches = optimizedContent.match(pattern)
        if (matches) {
          cleanedCount += matches.length
          optimizedContent = optimizedContent.replace(pattern, '')
        }
      })
      
      if (cleanedCount > 0) {
        console.log(`✅ Eliminadas ${cleanedCount} palabras/frases prohibidas`)
        // 🔥 Limpiar SOLO espacios múltiples en la MISMA línea (NO eliminar \n\n)
        // Reemplazar 3+ espacios con 1 espacio (pero preservar saltos de línea)
        optimizedContent = optimizedContent.replace(/[^\S\n]+/g, ' ')
        // Limpiar puntos y comas duplicados
        optimizedContent = optimizedContent.replace(/\.\s*\./g, '.')
        optimizedContent = optimizedContent.replace(/,\s*,/g, ',')
        // Preservar dobles saltos de línea (párrafos)
        optimizedContent = optimizedContent.replace(/\n{3,}/g, '\n\n')
        
        // Actualizar editor con contenido limpio
        onStreamingContent?.('', optimizedContent)
      }

      // 🔥 POST-PROCESAMIENTO 2: FORZAR límite de keyword 5-7 veces
      const keywordRegex = new RegExp(keyword, 'gi')
      const keywordMatches = optimizedContent.match(keywordRegex)
      const currentKeywordCount = keywordMatches ? keywordMatches.length : 0
      
      console.log(`🔍 Keyword "${keyword}": Encontradas ${currentKeywordCount} veces`)
      
      if (currentKeywordCount > 7) {
        console.log(`⚠️ Reduciendo keyword de ${currentKeywordCount} a 7 veces...`)
        
        // Mantener solo las primeras 7 apariciones (eliminar extras)
        let count = 0
        optimizedContent = optimizedContent.replace(keywordRegex, (match) => {
          count++
          if (count <= 7) {
            return match // Mantener las primeras 7
          } else {
            // Eliminar las keywords extra (después de la 7ª)
            // Reemplazar por términos genéricos
            const genericTerms = ['este servicio', 'esta experiencia', 'esto', 'ello', 'el tema', 'esta actividad']
            return genericTerms[Math.floor(Math.random() * genericTerms.length)]
          }
        })
        
        // 🔥 Limpiar SOLO espacios múltiples en la MISMA línea (NO eliminar \n\n)
        optimizedContent = optimizedContent.replace(/[^\S\n]+/g, ' ')
        // Preservar dobles saltos de línea (párrafos)
        optimizedContent = optimizedContent.replace(/\n{3,}/g, '\n\n')
        
        console.log(`✅ Keyword reducida de ${currentKeywordCount} a máximo 7 veces`)
        
        // Enviar contenido corregido al editor
        onStreamingContent?.('', optimizedContent)
      } else if (currentKeywordCount < 5) {
        console.log(`⚠️ Keyword aparece solo ${currentKeywordCount} veces (mínimo recomendado: 5)`)
      } else {
        console.log(`✅ Keyword aparece ${currentKeywordCount} veces (óptimo: 5-7)`)
      }

      // Análisis de mejoras SEO
      let seoIssuesFixed = 0
      const improvements: string[] = []
      
      // Verificar keyword - CONTROL ESTRICTO 5-7 veces
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
      
      // Verificar negritas
      const boldCount = (optimizedContent.match(/\*\*[^*]+\*\*/g) || []).length
      const originalBoldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
      
      if (boldCount > originalBoldCount) {
        improvements.push(`Agregadas ${boldCount - originalBoldCount} palabras en negrita`)
        seoIssuesFixed++
      }
      
      // Verificar estructura de encabezados
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
      
      // Verificar longitud
      const wordCount = optimizedContent.split(/\s+/).length
      const originalWordCount = content.split(/\s+/).length
      
      if (wordCount > originalWordCount) {
        improvements.push(`Contenido expandido (+${wordCount - originalWordCount} palabras)`)
        if (originalWordCount < 800 && wordCount >= 800) {
          seoIssuesFixed++
        }
      }
      
      // Verificar humanización - detectar palabras prohibidas
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
}

export const humanizerService = new HumanizerService()
export type { HumanizeResult }
