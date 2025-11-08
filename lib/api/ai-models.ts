/**
 * AI Models API Service
 * Gestión de modelos de IA para generación de contenido
 */

import { API_CONFIG } from '@/lib/config/api'
import { TokenManager } from '@/lib/utils/token-manager'

export interface AIModel {
  id: number
  name: string
  provider: string
  api_key: string
  endpoint?: string | null
  description?: string | null
  is_active: boolean
  created_by?: number
  created_by_name?: string
  created_by_email?: string
  updated_by?: number
  updated_by_name?: string
  created_at: string
  updated_at: string
}

export interface CreateAIModelData {
  name: string
  provider: string
  api_key: string
  endpoint?: string
  description?: string
  is_active?: boolean
}

export interface UpdateAIModelData {
  name?: string
  provider?: string
  api_key?: string
  endpoint?: string | null
  description?: string | null
  is_active?: boolean
}

export interface TestConnectionResult {
  success: boolean
  message: string
}

export interface ProviderKeyResult {
  api_key: string
  endpoint: string
  model_name: string
  provider: string
}

class AIModelsService {
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
   * Get all AI models
   */
  async getModels(): Promise<AIModel[]> {
    const response = await fetch(API_CONFIG.aiModels.list, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch AI models')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get active AI models only
   */
  async getActiveModels(): Promise<AIModel[]> {
    const response = await fetch(API_CONFIG.aiModels.active, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch active AI models')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get a single AI model by ID
   */
  async getModel(id: number): Promise<AIModel> {
    const response = await fetch(API_CONFIG.aiModels.getOne(id), {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch AI model')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Create a new AI model
   */
  async createModel(modelData: CreateAIModelData): Promise<AIModel> {
    const response = await fetch(API_CONFIG.aiModels.create, {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(modelData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create AI model')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Update an AI model
   */
  async updateModel(id: number, modelData: UpdateAIModelData): Promise<AIModel> {
    const response = await fetch(API_CONFIG.aiModels.update(id), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(modelData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update AI model')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Delete an AI model
   */
  async deleteModel(id: number): Promise<void> {
    const response = await fetch(API_CONFIG.aiModels.delete(id), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete AI model')
    }
  }

  /**
   * Toggle active status of an AI model
   */
  async toggleActive(id: number): Promise<AIModel> {
    const response = await fetch(API_CONFIG.aiModels.toggle(id), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to toggle AI model status')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Test connection to an AI model
   */
  async testConnection(id: number): Promise<TestConnectionResult> {
    const response = await fetch(API_CONFIG.aiModels.test(id), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to test connection')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get API key for a specific provider (Google, OpenAI, etc.)
   * This returns the active API key configured in the backend
   */
  async getProviderKey(provider: string = 'Google'): Promise<ProviderKeyResult> {
    const response = await fetch(API_CONFIG.aiModels.providerKey(provider), {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `No hay un modelo de ${provider} activo configurado`)
    }

    const data = await response.json()
    return data.data
  }
}

export const aiModelsService = new AIModelsService()
