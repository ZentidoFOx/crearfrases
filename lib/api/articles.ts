/**
 * Articles API Service
 * Gestión de artículos para editores
 */

import { API_CONFIG } from '@/lib/config/api'
import { TokenManager } from '@/lib/utils/token-manager'

// ========== TYPES ==========

export type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected'

export interface Article {
  id: number
  title: string
  keyword: string
  slug: string
  content: string
  meta_description?: string
  word_count: number
  status: ArticleStatus
  rejection_reason?: string
  created_by: number
  author_name?: string
  reviewer_name?: string
  publisher_name?: string
  created_at: string
  updated_at: string
  submitted_at?: string
  reviewed_at?: string
  published_at?: string
}

export interface CreateArticleData {
  title: string
  keyword: string
  content: string
  meta_description?: string
  status?: ArticleStatus
}

export interface UpdateArticleData {
  title?: string
  keyword?: string
  content?: string
  meta_description?: string
  status?: ArticleStatus
}

export interface EditorStats {
  total_articles: number
  draft_count: number
  pending_count: number
  published_count: number
  rejected_count: number
  total_words: number
  approval_rate: number
}

export interface MonthlyProductivity {
  mes: string
  articulos: number
  palabras: number
  fecha: string
}

export interface APIResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code: string
    message: string
  }
}

// ========== SERVICE ==========

class ArticlesService {
  private getHeaders(): HeadersInit {
    const token = TokenManager.getAccessToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  /**
   * Get all articles
   * Editors: Only their own articles
   * Admins: All articles
   */
  async getAll(filters?: {
    status?: ArticleStatus
    limit?: number
    offset?: number
  }): Promise<APIResponse<Article[]>> {
    const params = new URLSearchParams()
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    
    const url = `${API_CONFIG.articles.list}?${params.toString()}`
    
    const response = await fetch(url, {
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
   * Get single article by ID
   */
  async getOne(id: number): Promise<APIResponse<Article>> {
    const response = await fetch(API_CONFIG.articles.getOne(id), {
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
   * Create new article
   */
  async create(articleData: CreateArticleData): Promise<APIResponse<Article>> {
    const response = await fetch(API_CONFIG.articles.create, {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(articleData)
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Update article
   */
  async update(id: number, articleData: UpdateArticleData): Promise<APIResponse<Article>> {
    const response = await fetch(API_CONFIG.articles.update(id), {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(articleData)
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Delete article
   * Editors can only delete drafts
   */
  async delete(id: number): Promise<APIResponse> {
    const response = await fetch(API_CONFIG.articles.delete(id), {
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
   * Submit article for approval
   * Changes status from draft to pending
   */
  async submit(id: number): Promise<APIResponse<Article>> {
    const response = await fetch(API_CONFIG.articles.submit(id), {
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

  /**
   * Approve article (Admin only)
   * Changes status from pending to published
   */
  async approve(id: number): Promise<APIResponse<Article>> {
    const response = await fetch(API_CONFIG.articles.approve(id), {
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

  /**
   * Reject article (Admin only)
   * Changes status from pending to rejected
   */
  async reject(id: number, reason: string): Promise<APIResponse<Article>> {
    const response = await fetch(API_CONFIG.articles.reject(id), {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Get editor statistics
   */
  async getEditorStats(): Promise<APIResponse<EditorStats>> {
    const response = await fetch(API_CONFIG.editor.stats, {
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
   * Get monthly productivity
   */
  async getMonthlyProductivity(months: number = 6): Promise<APIResponse<MonthlyProductivity[]>> {
    const url = `${API_CONFIG.editor.productivity}?months=${months}`
    
    const response = await fetch(url, {
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
}

// Export singleton instance
export const articlesService = new ArticlesService()
