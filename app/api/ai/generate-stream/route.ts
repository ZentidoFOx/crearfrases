/**
 * AI Generation Streaming API Route
 * Uses streaming to generate content in real-time
 */

import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { API_CONFIG } from '@/lib/config/api'

export const runtime = 'edge'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model_id, prompt, temperature = 0.7 } = body

    if (!model_id || !prompt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'model_id and prompt are required'
          }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get token from cookie or header
    const token = request.cookies.get('access_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No authentication token found'
          }
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
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
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MODEL_ERROR',
            message: errorData?.error?.message || 'Failed to fetch model'
          }
        }),
        { 
          status: modelResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const modelData = await modelResponse.json()
    
    if (!modelData.success || !modelData.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MODEL_ERROR',
            message: 'Invalid model response'
          }
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const model = modelData.data
    const provider = model.provider.toLowerCase()
    const apiKey = model.api_key
    const modelName = model.name

    // Check if model is active
    if (!model.is_active) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MODEL_INACTIVE',
            message: 'El modelo no está activo'
          }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if API key exists
    if (!apiKey || apiKey.trim() === '') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: 'El modelo no tiene una API key configurada'
          }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
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
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNSUPPORTED_PROVIDER',
            message: `Provider '${provider}' not supported`
          }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Stream the response
    try {
      console.log('🚀 [API-STREAM] Iniciando streamText con modelo:', modelName)
      console.log('📝 [API-STREAM] Prompt length:', prompt.length)
      
      const result = await streamText({
        model: aiModel,
        prompt,
        temperature
      })

      console.log('✅ [API-STREAM] streamText iniciado correctamente')

      // Create streaming response
      const encoder = new TextEncoder()
      let chunkCount = 0
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            console.log('🔄 [API-STREAM] Iniciando lectura de textStream...')
            
            for await (const textPart of result.textStream) {
              chunkCount++
              console.log(`📦 [API-STREAM] Chunk ${chunkCount}:`, textPart)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: textPart })}\n\n`))
            }
            
            console.log(`✅ [API-STREAM] Stream completado. Total chunks: ${chunkCount}`)
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error: any) {
            console.error('❌ [API-STREAM] Error en stream:', error)
            // Si hay error en el stream, enviarlo antes de cerrar
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`))
            controller.close()
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
    } catch (streamError: any) {
      // Si el modelo no soporta streaming, retornar un error específico
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'STREAMING_NOT_SUPPORTED',
            message: streamError.message || 'El modelo no soporta streaming'
          }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'Internal server error'
        }
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
