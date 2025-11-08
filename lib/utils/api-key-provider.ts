/**
 * API Key Provider
 * Centralized service to fetch API keys from backend
 */

import { aiModelsService } from '@/lib/api/ai-models'

class APIKeyProvider {
  private geminiKeyCache: string | null = null
  private geminiKeyExpiry: number = 0
  private readonly CACHE_DURATION = 3600000 // 1 hour

  /**
   * Get Gemini API key from backend (with caching)
   */
  async getGeminiKey(): Promise<string> {
    // Return cached key if still valid
    if (this.geminiKeyCache && Date.now() < this.geminiKeyExpiry) {
      return this.geminiKeyCache
    }

    try {
      const result = await aiModelsService.getProviderKey('Google')
      
      if (!result.api_key) {
        throw new Error('No se pudo obtener la API key de Gemini del backend')
      }

      // Cache the key
      this.geminiKeyCache = result.api_key
      this.geminiKeyExpiry = Date.now() + this.CACHE_DURATION

      return result.api_key
    } catch (error) {
      console.error('Error fetching Gemini API key:', error)
      throw new Error('No se pudo obtener la API key de Gemini. Verifica que haya un modelo de Google activo configurado.')
    }
  }

  /**
   * Clear cached keys (useful for logout or refresh)
   */
  clearCache(): void {
    this.geminiKeyCache = null
    this.geminiKeyExpiry = 0
  }
}

export const apiKeyProvider = new APIKeyProvider()
