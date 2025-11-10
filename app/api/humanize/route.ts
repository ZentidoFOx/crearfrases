/**
 * Humanization API Route
 * Handles content humanization using Vercel AI SDK server-side
 */

import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { API_CONFIG } from '@/lib/config/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      content,
      keyword,
      title,
      model_id,
      tone = 'professional',
      targetAudience = 'público general',
      preserveMarkdown = true,
      streaming = false
    } = body

    if (!content) {
      return NextResponse.json(
        { error: { message: 'Missing content field' } },
        { status: 400 }
      )
    }

    if (!model_id) {
      return NextResponse.json(
        { error: { message: 'model_id is required' } },
        { status: 400 }
      )
    }

    // Get token from cookie or header
    const token = request.cookies.get('access_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: { message: 'No authentication token found' } },
        { status: 401 }
      )
    }

    // Get model with FULL API key from backend PHP
    const modelResponse = await fetch(`${API_CONFIG.baseURL}/ai-models/${model_id}/with-key`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!modelResponse.ok) {
      const errorData = await modelResponse.json().catch(() => null)
      return NextResponse.json(
        { error: { message: errorData?.error?.message || 'Failed to fetch model' } },
        { status: modelResponse.status }
      )
    }

    const modelData = await modelResponse.json()
    
    if (!modelData.success || !modelData.data) {
      return NextResponse.json(
        { error: { message: 'Invalid model response' } },
        { status: 500 }
      )
    }

    const model = modelData.data
    const provider = model.provider.toLowerCase()
    const apiKey = model.api_key
    const modelName = model.name

    // Check if model is active
    if (!model.is_active) {
      return NextResponse.json(
        { error: { message: 'El modelo no está activo' } },
        { status: 400 }
      )
    }

    // Check if API key exists
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: { message: 'El modelo no tiene una API key configurada' } },
        { status: 400 }
      )
    }

    // Build prompt based on mode
    let prompt = ''
    
    if (keyword && title) {
      // Full optimization mode
      prompt = `🚨 REGLA #1 CRÍTICA - LEE PRIMERO:

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
- Cada párrafo debe estar separado por doble salto de línea (\\n\\n)
- NO juntes todo en un solo bloque de texto
- Si el original tiene 5 párrafos → Tú debes tener 5 párrafos separados
- Usa \\n\\n entre cada párrafo

🚀 **REESCRIBE AHORA:**
- Keyword "${keyword}" EXACTAMENTE 5-7 veces (NO 30, NO 15, NO 8)
- Misma cantidad encabezados, mismos niveles #
- Cada párrafo separado por línea vacía (\\n\\n)
- NO juntes múltiples párrafos en uno solo
- No palabras prohibidas
- Mantén estructura original`
    } else {
      // Simple humanization mode
      prompt = `Eres redactor profesional. Reescribe este texto eliminando TODOS los patrones de IA.

📝 CONTENIDO:
${content}

## 🚫 PALABRAS/FRASES PROHIBIDAS:
Descubre | Explora | Sumérgete | Embárcate | Adéntrate | Desata | Experimenta | Revela | Desbloquea | Transforma | Maximiza | Optimiza | Potencia | ¿Te imaginas? | ¡Absolutamente! | ¡Claro! | Prepárate para | ¿Estás listo? | Es importante destacar | Cabe mencionar | Sin duda | En primer lugar | Por otro lado | En conclusión | Es más que X es Y

**Si aparece CUALQUIERA de estas palabras/frases → FALLASTE.**

**Tono:** ${tone} | **Audiencia:** ${targetAudience}

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
- Cada párrafo debe estar separado por doble salto de línea (\\n\\n)
- NO juntes todo en un solo bloque de texto
- Si el original tiene 5 párrafos → Tú debes tener 5 párrafos separados
- Usa \\n\\n entre cada párrafo

❌ **NO:**
- Agregar/eliminar encabezados
- Cambiar niveles # (## a ###)
- Juntar todos los párrafos en uno solo
- Eliminar saltos de línea entre párrafos

✅ **SÍ:**
- Misma cantidad encabezados
- Mismos niveles #
- Párrafos separados con \\n\\n
- Solo humaniza TEXTO
` : ''}

🚀 **REESCRIBE. MISMA CANTIDAD ENCABEZADOS. MISMOS NIVELES #. PÁRRAFOS SEPARADOS CON \\n\\n. NO PALABRAS PROHIBIDAS.**`
    }

    // Create AI client based on provider
    let aiModel
    if (provider === 'google') {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey
      })
      aiModel = google(modelName)
    } else if (provider === 'openai') {
      const openai = createOpenAI({
        apiKey: apiKey
      })
      aiModel = openai(modelName)
    } else {
      return NextResponse.json(
        { error: { message: `Provider '${provider}' not supported` } },
        { status: 400 }
      )
    }

    if (streaming) {
      // Streaming response
      const result = await streamText({
        model: aiModel,
        prompt: prompt,
        temperature: 0.7
      })

      // Create streaming response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const textPart of result.textStream) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: textPart })}\n\n`))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    } else {
      // Non-streaming response
      const result = await streamText({
        model: aiModel,
        prompt: prompt,
        temperature: 0.7
      })

      let humanizedContent = ''
      for await (const textPart of result.textStream) {
        humanizedContent += textPart
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

      return NextResponse.json({
        success: true,
        data: {
          content: humanizedContent,
          originalLength: content.length,
          humanizedLength: humanizedContent.length,
          improvements
        }
      })
    }
  } catch (error: any) {
    console.error('Humanization API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Humanization failed',
          code: 'HUMANIZATION_ERROR'
        }
      },
      { status: 500 }
    )
  }
}
