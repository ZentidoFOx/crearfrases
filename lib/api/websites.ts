/**
 * Websites API Service
 * Gestión de sitios web con autenticación por API Key
 */

import { API_CONFIG } from '@/lib/config/api'
import { TokenManager } from '@/lib/utils/token-manager'

export interface Website {
  id: number
  name: string
  url: string
  app_password: string
  description?: string | null
  is_active: boolean
  connection_verified: boolean
  last_verified_at?: string | null
  last_request_at?: string | null
  request_count: number
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
  created_at: string
  updated_at: string
}

export interface CreateWebsiteData {
  name: string
  url: string
  app_password: string
  description?: string
  is_active?: boolean
}

export interface UpdateWebsiteData {
  name?: string
  url?: string
  app_password?: string
  description?: string | null
  is_active?: boolean
}

interface APIResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

class WebsitesService {
  /**
   * Get authorization headers
   */
  private getHeaders(): HeadersInit {
    const token = TokenManager.getAccessToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  /**
   * Get all websites
   */
  async getAll(): Promise<APIResponse<Website[]>> {
    const response = await fetch(API_CONFIG.websites.list, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Get a single website by ID
   * Automatically increments request_count
   */
  async getOne(id: number, skipIncrement: boolean = false): Promise<APIResponse<Website>> {
    const response = await fetch(API_CONFIG.websites.getOne(id), {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    // Increment request count automatically (unless explicitly skipped)
    if (!skipIncrement && data.success) {
      this.incrementRequestCount(id).catch(err => {
        console.warn('Failed to increment request count:', err)
      })
    }

    return data
  }

  /**
   * Increment request count for a website
   * This is called automatically when getOne is used
   */
  async incrementRequestCount(id: number): Promise<APIResponse> {
    try {
      const response = await fetch(API_CONFIG.websites.incrementRequest(id), {
        method: 'POST',
        credentials: 'include',
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw data
      }

      return data
    } catch (error) {
      // Silent fail - no afecta la funcionalidad principal
      console.warn('Request count increment failed:', error)
      return { success: false, message: 'Failed to increment counter' }
    }
  }

  /**
   * Create a new website
   */
  async create(websiteData: CreateWebsiteData): Promise<APIResponse<Website>> {
    const response = await fetch(API_CONFIG.websites.create, {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(websiteData)
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Update a website
   */
  async update(id: number, websiteData: UpdateWebsiteData): Promise<APIResponse<Website>> {
    const response = await fetch(API_CONFIG.websites.update(id), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(websiteData)
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Delete a website
   */
  async delete(id: number): Promise<APIResponse> {
    const response = await fetch(API_CONFIG.websites.delete(id), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Toggle active status of a website
   */
  async toggleActive(id: number): Promise<APIResponse<Website>> {
    const response = await fetch(API_CONFIG.websites.toggle(id), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders()
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Verify connection to website
   */
  async verifyConnection(id: number): Promise<APIResponse<any>> {
    const response = await fetch(API_CONFIG.websites.verify(id), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders()
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }
}

export const websitesService = new WebsitesService()
