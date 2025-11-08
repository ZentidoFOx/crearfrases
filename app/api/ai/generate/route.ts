/**
 * AI Generation API Route
 * Uses @ai-sdk/google and @ai-sdk/openai
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { API_CONFIG } from '@/lib/config/api'
import { TokenManager } from '@/lib/utils/token-manager'

export const runtime = 'edge'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model_id, prompt, temperature = 0.7, max_tokens = 4096 } = body

    if (!model_id || !prompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'model_id and prompt are required'
          }
        },
        { status: 400 }
      )
    }

    // Get token from cookie or header
    const token = request.cookies.get('access_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No authentication token found'
          }
        },
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
        {
          success: false,
          error: {
            code: 'MODEL_ERROR',
            message: errorData?.error?.message || 'Failed to fetch model'
          }
        },
        { status: modelResponse.status }
      )
    }

    const modelData = await modelResponse.json()
    
    if (!modelData.success || !modelData.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MODEL_ERROR',
            message: 'Invalid model response'
          }
        },
        { status: 500 }
      )
    }

    const model = modelData.data
    const provider = model.provider.toLowerCase()
    const apiKey = model.api_key
    const modelName = model.name // Usar el nombre EXACTO de la BD

    // Debug logging
    console.log('AI Generate - Model data:', {
      id: model.id,
      name: modelName,
      provider: model.provider,
      has_api_key: !!apiKey,
      api_key_preview: apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING',
      is_active: model.is_active
    })

    // Check if model is active
    if (!model.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MODEL_INACTIVE',
            message: 'El modelo no está activo'
          }
        },
        { status: 400 }
      )
    }

    // Check if API key exists
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: 'El modelo no tiene una API key configurada'
          }
        },
        { status: 400 }
      )
    }

    // Generate content based on provider
    let content: string

    try {
      console.log('Generating with provider:', provider, 'Model from DB:', modelName, 'API Key length:', apiKey.length)
      
      if (provider === 'google') {
        // Create Google Generative AI client with API key
        const google = createGoogleGenerativeAI({
          apiKey: apiKey
        })
        
        console.log('Google client created, using model from DB:', modelName)
        
        // Usa el nombre EXACTO de la base de datos
        const result = await generateText({
          model: google(modelName),
          prompt,
          temperature
        })
        
        console.log('Google generation successful, content length:', result.text.length)
        content = result.text
      } 
      else if (provider === 'openai') {
        // Create OpenAI client with API key
        const openai = createOpenAI({
          apiKey: apiKey
        })
        
        console.log('OpenAI client created, using model from DB:', modelName)
        
        // Usa el nombre EXACTO de la base de datos
        const result = await generateText({
          model: openai(modelName),
          prompt,
          temperature
        })
        
        console.log('OpenAI generation successful, content length:', result.text.length)
        content = result.text
      }
      else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNSUPPORTED_PROVIDER',
              message: `Provider '${provider}' not supported. Use Google or OpenAI.`
            }
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          content,
          model: {
            id: model.id,
            name: model.name,
            provider: model.provider
          }
        }
      })

    } catch (error: any) {
      console.error('AI Generation error:', error)
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GENERATION_ERROR',
            message: error.message || 'Failed to generate content'
          }
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Request error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
}
