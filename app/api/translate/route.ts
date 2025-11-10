/**
 * Translation API Route
 * Handles content translation using Vercel AI SDK server-side
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateObject, streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import * as z from 'zod'
import { apiKeyProvider } from '@/lib/utils/api-key-provider'

// Schema for validation
const translationSchema = z.object({
  title: z.string().describe('Título SEO traducido (40-60 caracteres)'),
  h1Title: z.string().describe('Título H1 traducido'),
  description: z.string().describe('Meta descripción traducida (150-160 caracteres)'),
  keyword: z.string().describe('Palabra clave principal traducida'),
  objectivePhrase: z.string().describe('Frase objetivo traducida'),
  keywords: z.array(z.string()).describe('Array de keywords relacionadas traducidas'),
  content: z.string().describe('Contenido completo del artículo traducido en formato markdown. CRÍTICO: Debes preservar EXACTAMENTE la estructura markdown del original (##, ###, **, *, -, saltos de línea \\n\\n). NO juntes párrafos. NO elimines etiquetas markdown. Mantén la misma cantidad de saltos de línea y espaciado que el texto original.')
})

async function getGeminiApiKey(): Promise<string> {
  try {
    return await apiKeyProvider.getGeminiKey()
  } catch (error) {
    console.error('Error fetching Gemini API key:', error)
    throw new Error('Failed to fetch Gemini API key')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      data,
      targetLanguage,
      targetLanguageName,
      streaming = false
    } = body

    if (!data || !targetLanguage || !targetLanguageName) {
      return NextResponse.json(
        { error: { message: 'Missing required fields' } },
        { status: 400 }
      )
    }

    // Get API key from database
    const apiKey = await getGeminiApiKey()

    // Build prompt
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

🎯 AHORA TRADUCE EL CONTENIDO RESPETANDO AL 100% LA ESTRUCTURA MARKDOWN.`

    // Create Google AI instance
    const google = createGoogleGenerativeAI({
      apiKey: apiKey
    })

    if (streaming) {
      // Streaming response
      const streamPrompt = prompt + `

FORMATO DE RESPUESTA:
TITLE: [título traducido]
H1: [título h1 traducido]
DESCRIPTION: [descripción traducida]
KEYWORD: [keyword traducida]
OBJECTIVE: [frase objetivo traducida]
KEYWORDS: [keywords traducidas separadas por comas]

CONTENT:
[contenido markdown traducido preservando EXACTAMENTE la estructura]`

      const model = google('gemini-2.0-flash-exp')
      
      const result = await streamText({
        model: model,
        prompt: streamPrompt,
        temperature: 0.3
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
      // Non-streaming response with structured output
      const model = google('gemini-2.5-flash')
      
      const result = await generateObject({
        model: model,
        schema: translationSchema,
        prompt: prompt,
        temperature: 0.3
      })

      return NextResponse.json({
        success: true,
        data: result.object
      })
    }
  } catch (error: any) {
    console.error('Translation API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Translation failed',
          code: 'TRANSLATION_ERROR'
        }
      },
      { status: 500 }
    )
  }
}
