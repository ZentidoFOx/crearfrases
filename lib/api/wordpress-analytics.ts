/**
 * WordPress Content Analytics Service
 * Consumes Content Search API plugin endpoints
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export interface YoastSEOData {
  focus_keyword: string
  title: string
  description: string
  canonical: string
  seo_score: number
  seo_score_text: {
    status: 'good' | 'ok' | 'bad'
    color: string
    text: string
    emoji: string
  }
  readability_score: number
  readability_score_text: {
    status: 'good' | 'ok' | 'bad'
    color: string
    text: string
    emoji: string
  }
  overall_quality: 'excellent' | 'good' | 'needs_improvement' | 'poor'
  overall_quality_text: string
  og_title: string
  og_description: string
  og_image: string
  twitter_title: string
  twitter_description: string
  twitter_image: string
  robots_noindex: string
  robots_nofollow: string
  is_cornerstone: boolean
}

export interface ContentAnalysis {
  word_count: number
  char_count: number
  paragraph_count: number
  heading_count: number
  image_count: number
  link_count: number
  list_count: number
  reading_time_minutes: number
  avg_words_per_paragraph: number
  content_quality_score: number
}

export interface Recommendation {
  type: 'critical' | 'warning' | 'info'
  category: 'content_length' | 'media' | 'structure' | 'links' | 'seo' | 'readability'
  message: string
  current_value?: number
  target_value?: number
}

export interface PostAnalysisData {
  post_info: {
    id: number
    title: string
    url: string
    date: string
    modified: string
    author: string
  }
  analytics: {
    views: number
    comments: number
    engagement_score: number
  }
  content_analysis: ContentAnalysis
  yoast_seo: YoastSEOData | null
  recommendations: Recommendation[]
  recommendation_count: {
    critical: number
    warning: number
    info: number
  }
}

export interface TopPerformingPost {
  id: number
  title: string
  url: string
  date: string
  views: number
  comments: number
  engagement_score: number
  seo_score: number
  readability_score: number
  overall_quality: string
}

export interface PostNeedingImprovement {
  id: number
  title: string
  url: string
  date: string
  priority_score: number
  issues_count: number
  critical_issues: number
  warnings: number
  seo_score: number
  readability_score: number
  word_count: number
  content_quality_score: number
  recommendations: Recommendation[]
}

export interface SiteStats {
  total_posts: number
  total_views: number
  total_comments: number
  total_words: number
  avg_words_per_post: number
  avg_seo_score: number
  avg_readability_score: number
  avg_content_quality_score: number
  posts_by_quality: {
    excellent: number
    good: number
    needs_improvement: number
    poor: number
  }
}

export interface SearchResult {
  id: number
  title: string
  url: string
  type: string
  excerpt: string
  // Campos del endpoint /search
  occurrences?: {
    title: number
    content: number
    total: number
  }
  keyword_phrase?: string
  source?: 'post' | 'taxonomy'
  taxonomy_name?: string
  count?: number
  // Campos del endpoint /focus-keywords
  focus_keyword?: string
  similarity_percentage?: number
  exact_match?: boolean
  // Campos comunes
  yoast_seo?: YoastSEOData
  language?: string
}

// ============================================
// SERVICE CLASS
// ============================================

class WordPressAnalyticsService {
  /**
   * Build API URL for WordPress site
   */
  private buildUrl(websiteUrl: string, endpoint: string): string {
    // Remove trailing slash from website URL
    const baseUrl = websiteUrl.replace(/\/$/, '')
    return `${baseUrl}/wp-json/content-search/v1${endpoint}`
  }

  /**
   * Fetch with error handling
   */
  private async fetchAPI<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Mensajes de error más descriptivos
        if (response.status === 404) {
          throw new Error('Plugin de WordPress no disponible. Verifica que el plugin "Content Search API" esté instalado y activado.')
        } else if (response.status === 403 || response.status === 401) {
          throw new Error('Acceso denegado. Verifica la configuración de permisos del plugin.')
        } else if (response.status >= 500) {
          throw new Error('Error del servidor WordPress. Verifica que el sitio esté funcionando correctamente.')
        }
        throw new Error(`Error HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Verificar si es un array (respuesta directa) o un objeto con success
      if (Array.isArray(data)) {
        // Es un array directo (como /focus-keywords)
        return data as T
      }
      
      // Es un objeto, verificar el campo success
      if (data.success === false) {
        throw new Error(data.message || 'Error en la respuesta de la API')
      }

      return data as T
    } catch (error) {
      // Error de red o conexión
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('No se puede conectar con WordPress. Verifica la URL y tu conexión.')
      }
      console.error('Error fetching WordPress API:', error)
      throw error
    }
  }

  // ============================================
  // SEARCH ENDPOINTS
  // ============================================

  /**
   * Search for keyword phrase in content
   */
  async searchContent(
    websiteUrl: string,
    query: string,
    options?: {
      postType?: string
      limit?: number
      page?: number
      lang?: string
      includeTaxonomies?: boolean
    }
  ): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      query: query,
      post_type: options?.postType || 'post,page',
      limit: (options?.limit || 50).toString(),
      page: (options?.page || 1).toString(),
      lang: options?.lang || 'es',
      include_taxonomies: (options?.includeTaxonomies !== false).toString(),
    })

    const url = this.buildUrl(websiteUrl, `/search?${params.toString()}`)
    const response = await this.fetchAPI<{ success: boolean; data: SearchResult[] }>(url)
    return response.data
  }

  /**
   * Search by Yoast Focus Keyword (Frase clave objetivo)
   */
  async searchFocusKeywords(
    websiteUrl: string,
    query: string,
    options?: {
      postType?: string
      limit?: number
      page?: number
      lang?: string
    }
  ): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      query: query,
      post_type: options?.postType || 'post,page',
      limit: (options?.limit || 50).toString(),
      page: (options?.page || 1).toString(),
      lang: options?.lang || 'es',
    })

    const url = this.buildUrl(websiteUrl, `/focus-keywords?${params.toString()}`)
    // El endpoint retorna un array directamente, no { success, data }
    const response = await this.fetchAPI<SearchResult[]>(url)
    return response
  }

  // ============================================
  // CONTENT ANALYSIS ENDPOINTS
  // ============================================

  /**
   * Get detailed content analysis for a post
   */
  async getContentAnalysis(websiteUrl: string, postId: number): Promise<PostAnalysisData> {
    const url = this.buildUrl(websiteUrl, `/content-analysis/${postId}`)
    const response = await this.fetchAPI<{ success: boolean; data: PostAnalysisData }>(url)
    return response.data
  }

  /**
   * Get top performing posts
   */
  async getTopPerforming(
    websiteUrl: string,
    limit: number = 10,
    orderBy: 'views' | 'engagement' | 'comments' | 'seo' = 'views'
  ): Promise<TopPerformingPost[]> {
    const url = this.buildUrl(
      websiteUrl,
      `/top-performing?limit=${limit}&orderby=${orderBy}`
    )
    const response = await this.fetchAPI<{ success: boolean; data: TopPerformingPost[] }>(url)
    return response.data
  }

  /**
   * Get posts that need improvement
   */
  async getPostsNeedingImprovement(
    websiteUrl: string,
    limit: number = 20
  ): Promise<PostNeedingImprovement[]> {
    const url = this.buildUrl(websiteUrl, `/needs-improvement?limit=${limit}`)
    const response = await this.fetchAPI<{ success: boolean; data: PostNeedingImprovement[] }>(url)
    return response.data
  }

  /**
   * Get site statistics
   */
  async getSiteStats(websiteUrl: string): Promise<SiteStats> {
    const url = this.buildUrl(websiteUrl, '/site-stats')
    const response = await this.fetchAPI<{ success: boolean; data: SiteStats }>(url)
    return response.data
  }

  /**
   * Get all categories from WordPress
   */
  async getCategories(websiteUrl: string): Promise<Array<{
    id: number
    name: string
    slug: string
    count: number
    description: string
    url: string
    language?: string
  }>> {
    const url = this.buildUrl(websiteUrl, '/categories')
    const response = await this.fetchAPI<{ 
      success: boolean
      total: number
      data: Array<{
        id: number
        name: string
        slug: string
        count: number
        description: string
        url: string
        language?: string
      }>
    }>(url)
    return response.data
  }

  /**
   * Get all tags from WordPress
   */
  async getTags(websiteUrl: string): Promise<Array<{
    id: number
    name: string
    slug: string
    count: number
    description: string
    url: string
    language?: string
  }>> {
    const url = this.buildUrl(websiteUrl, '/tags')
    const response = await this.fetchAPI<{ 
      success: boolean
      total: number
      data: Array<{
        id: number
        name: string
        slug: string
        count: number
        description: string
        url: string
        language?: string
      }>
    }>(url)
    return response.data
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get quality badge color
   */
  getQualityBadgeColor(quality: string): string {
    switch (quality) {
      case 'excellent':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'good':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'needs_improvement':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'poor':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  /**
   * Get recommendation badge color
   */
  getRecommendationBadgeColor(type: string): string {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toLocaleString('es-ES')
  }

  /**
   * Get score color
   */
  getScoreColor(score: number): string {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  /**
   * Get score emoji
   */
  getScoreEmoji(score: number): string {
    if (score >= 70) return '✅'
    if (score >= 50) return '⚠️'
    return '❌'
  }
}

// Export singleton instance
export const wordpressAnalyticsService = new WordPressAnalyticsService()
