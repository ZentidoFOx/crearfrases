/**
 * AI Service using Vercel AI SDK
 * Unified service for all AI operations through API routes
 */

import { TokenManager } from '@/lib/utils/token-manager'
import { 
  buildKeywordSuggestionsPrompt,
  buildTitleGenerationPrompt 
} from '@/lib/prompts'

export interface AIGenerateOptions {
  modelId?: number
  temperature?: number
  maxTokens?: number
}

class AIService {
  /**
   * Generate text using Next.js API route with Vercel AI SDK
   * All AI generation goes through /api/ai/generate route
   */
  async generateWithModel(
    prompt: string,
    modelId: number,
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): Promise<string> {
    try {
      const token = TokenManager.getAccessToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Call Next.js API route instead of PHP backend directly
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model_id: modelId,
          prompt,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate text')
      }

      return data.data.content || ''
    } catch (error) {
      console.error('Error generating with model:', error)
      throw error instanceof Error ? error : new Error('Failed to generate text')
    }
  }

  /**
   * Generate keyword suggestions using selected model
   */
  async generateKeywordSuggestions(
    baseKeyword: string,
    existingKeywords: string[],
    modelId: number
  ): Promise<string[]> {
    const prompt = buildKeywordSuggestionsPrompt({
      baseKeyword,
      existingKeywords
    })

    try {
      const response = await this.generateWithModel(prompt, modelId)
      
      // Parse response into array of suggestions
      const suggestions = response
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0 && !existingKeywords.includes(line.toLowerCase()))
      
      return suggestions.slice(0, 10)
    } catch (error) {
      console.error('Error generating keyword suggestions:', error)
      throw error
    }
  }

  /**
   * Generate complete title suggestions with SEO data using selected model
   */
  async generateTitlesComplete(
    keyword: string,
    count: number,
    additionalKeywords: string,
    modelId: number
  ): Promise<any[]> {
    const prompt = buildTitleGenerationPrompt({
      keyword,
      count,
      additionalKeywords
    })

    try {
      const response = await this.generateWithModel(prompt, modelId)
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta')
      }
      
      const titles = JSON.parse(jsonMatch[0])
      
      // Add SEO scores to each title
      return titles.map((titleData: any) => ({
        ...titleData,
        seoScore: {
          keywordInTitle: titleData.title.toLowerCase().includes(keyword.toLowerCase()),
          keywordInDescription: titleData.description.toLowerCase().includes(keyword.toLowerCase()),
          keywordDensity: this.calculateKeywordDensity(titleData.title + ' ' + titleData.description, keyword),
          titleLength: titleData.title.length,
          descriptionLength: titleData.description.length
        }
      }))
    } catch (error) {
      console.error('Error generating titles:', error)
      throw error
    }
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(text: string, keyword: string): number {
    const words = text.toLowerCase().split(/\s+/)
    const keywordWords = keyword.toLowerCase().split(/\s+/)
    let count = 0
    
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const slice = words.slice(i, i + keywordWords.length).join(' ')
      if (slice === keywordWords.join(' ')) {
        count++
      }
    }
    
    return Math.round((count / words.length) * 100)
  }
}

// Export singleton instance
export const aiService = new AIService()
