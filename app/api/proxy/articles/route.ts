/**
 * Articles Proxy API Route
 * Bypasses CORS by proxying requests to the external API
 */

import { NextRequest, NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/config/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
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

    console.log('📤 [PROXY] Forwarding POST request to:', `${API_CONFIG.baseURL}/articles`)
    console.log('📤 [PROXY] Request body keys:', Object.keys(body))

    // Forward the request to the external API
    const response = await fetch(`${API_CONFIG.baseURL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    console.log('📥 [PROXY] Response status:', response.status, response.statusText)

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ [PROXY] API Error:', responseData)
      return NextResponse.json(
        responseData,
        { status: response.status }
      )
    }

    console.log('✅ [PROXY] Article created successfully')
    return NextResponse.json(responseData, { status: 200 })

  } catch (error: any) {
    console.error('❌ [PROXY] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: error.message || 'Failed to proxy request'
        }
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const articleId = request.nextUrl.searchParams.get('id')

    if (!articleId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ID',
            message: 'Article ID is required'
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

    console.log('📤 [PROXY] Forwarding PUT request to:', `${API_CONFIG.baseURL}/articles/${articleId}`)

    // Forward the request to the external API
    const response = await fetch(`${API_CONFIG.baseURL}/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    console.log('📥 [PROXY] Response status:', response.status, response.statusText)

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ [PROXY] API Error:', responseData)
      return NextResponse.json(
        responseData,
        { status: response.status }
      )
    }

    console.log('✅ [PROXY] Article updated successfully')
    return NextResponse.json(responseData, { status: 200 })

  } catch (error: any) {
    console.error('❌ [PROXY] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: error.message || 'Failed to proxy request'
        }
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const articleId = request.nextUrl.searchParams.get('id')

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

    let url = `${API_CONFIG.baseURL}/articles`
    if (articleId) {
      url = `${API_CONFIG.baseURL}/articles/${articleId}`
    }

    console.log('📤 [PROXY] Forwarding GET request to:', url)

    // Forward the request to the external API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('📥 [PROXY] Response status:', response.status, response.statusText)

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ [PROXY] API Error:', responseData)
      return NextResponse.json(
        responseData,
        { status: response.status }
      )
    }

    console.log('✅ [PROXY] Articles fetched successfully')
    return NextResponse.json(responseData, { status: 200 })

  } catch (error: any) {
    console.error('❌ [PROXY] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: error.message || 'Failed to proxy request'
        }
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const articleId = request.nextUrl.searchParams.get('id')

    if (!articleId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ID',
            message: 'Article ID is required'
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

    console.log('📤 [PROXY] Forwarding DELETE request to:', `${API_CONFIG.baseURL}/articles/${articleId}`)

    // Forward the request to the external API
    const response = await fetch(`${API_CONFIG.baseURL}/articles/${articleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('📥 [PROXY] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const responseData = await response.json()
      console.error('❌ [PROXY] API Error:', responseData)
      return NextResponse.json(
        responseData,
        { status: response.status }
      )
    }

    console.log('✅ [PROXY] Article deleted successfully')
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error: any) {
    console.error('❌ [PROXY] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROXY_ERROR',
          message: error.message || 'Failed to proxy request'
        }
      },
      { status: 500 }
    )
  }
}
