import { API_CONFIG } from '@/lib/config/api'
import { TokenManager } from '@/lib/utils/token-manager'

/**
 * Tipos para artículos del Content Planner
 */

export interface WordPressCategory {
  id: number
  name: string
  slug: string
}

export interface PlannerArticleData {
  title: string
  h1_title: string
  keyword: string
  objective_phrase?: string
  keywords_array?: string[]
  content: string
  sections_json?: SectionData[]
  meta_description?: string
  seo_data?: SEOAnalysisData
  word_count?: number
  status?: 'draft' | 'pending' | 'published' | 'rejected'
  website_id?: number
  language?: string
  content_type?: 'planner' | 'manual' | 'imported'
  wordpress_post_id?: number
  featured_image_url?: string
  featured_image_id?: number
  wordpress_categories?: WordPressCategory[]
  wordpress_status?: 'draft' | 'publish' | 'pending' | 'private' | 'future'
}

export interface SectionData {
  heading: string
  content: string
  order?: number
}

export interface SEOAnalysisData {
  score?: number
  issues?: Array<{
    type: string
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  keyword_density?: number
  readability_score?: number
}

export interface ArticleTranslation {
  id: number
  article_id: number
  language: string
  title: string
  h1_title: string | null
  keyword: string
  objective_phrase: string | null
  keywords_array: string[]
  slug: string
  content: string
  sections_json: SectionData[] | null
  meta_description: string | null
  seo_data: SEOAnalysisData | null
  word_count: number
  wordpress_post_id: number | null
  featured_image_url: string | null
  wordpress_categories: WordPressCategory[] | null
  wordpress_status: 'draft' | 'publish' | 'pending' | 'private' | 'future' | null
  created_at: string
  updated_at: string
}

export interface PlannerArticle extends PlannerArticleData {
  id: number
  slug: string
  optimization_count: number
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
  available_languages?: string[]
  translations?: Record<string, {
    id: number
    language: string
    title: string
    created_at: string
  }>
}

/**
 * Servicio de artículos del Content Planner
 */
class PlannerArticlesService {
  private baseURL: string
  private proxyURL: string

  constructor() {
    this.baseURL = `${API_CONFIG.baseURL}/articles`
    // Use local proxy to bypass CORS
    this.proxyURL = '/api/proxy/articles'
  }

  /**
   * Obtener token de autenticación
   */
  private getAuthHeaders(): HeadersInit {
    const token = TokenManager.getAccessToken()
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación disponible')
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  /**
   * Crear nuevo artículo
   */
  async create(articleData: PlannerArticleData): Promise<PlannerArticle> {
    try {
      console.log('📤 [API] Enviando datos del artículo')
      console.log('🌐 [API] URL:', this.proxyURL)
      console.log('🔍 [API] Content es HTML?')
      console.log('   - Tiene <h2>:', articleData.content.includes('<h2>'))
      console.log('   - Tiene <p>:', articleData.content.includes('<p>'))
      console.log('   - Tiene ## (markdown):', articleData.content.includes('##'))
      console.log('📄 [API] Content (primeros 300 chars):', articleData.content.substring(0, 300))
      
      const response = await fetch(this.proxyURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(articleData)
      })

      console.log('📥 [API] Respuesta HTTP:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error de la API:', errorText)
        
        try {
          const error = JSON.parse(errorText)
          throw new Error(error.message || 'Error al crear el artículo')
        } catch {
          throw new Error(`Error ${response.status}: ${errorText}`)
        }
      }

      const result = await response.json()
      console.log('✅ Artículo creado:', result)
      return result.data
    } catch (error) {
      console.error('💥 Error creating article:', error)
      throw error
    }
  }

  /**
   * Obtener todos los artículos del usuario
   */
  async getAll(filters?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<PlannerArticle[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const url = `${this.baseURL}?${params.toString()}`
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al obtener artículos')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error fetching articles:', error)
      throw error
    }
  }

  /**
   * Obtener artículo por ID
   */
  async getById(id: number): Promise<PlannerArticle> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Artículo no encontrado')
        }
        throw new Error('Error al obtener el artículo')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching article:', error)
      throw error
    }
  }

  /**
   * Actualizar artículo ORIGINAL
   * 🛡️ PROTECCIÓN: Este método SOLO debe usarse para actualizar el artículo original
   * Para traducciones, usar updateTranslation()
   */
  async update(id: number, articleData: Partial<PlannerArticleData>): Promise<PlannerArticle> {
    try {
      // 🛡️ PROTECCIÓN: Obtener el artículo para verificar su idioma original
      const currentArticle = await this.getById(id)
      const originalLanguage = currentArticle.language || 'es'
      
      console.log('🔒 [API-UPDATE] Validando actualización de artículo ORIGINAL:')
      console.log('  - Article ID:', id)
      console.log('  - Idioma original del artículo:', originalLanguage)
      console.log('  - Datos a actualizar:', Object.keys(articleData))
      
      // 🔍 LOGGING ESPECÍFICO PARA SEO_DATA
      if (articleData.seo_data) {
        console.log('🌍 [API-UPDATE] SEO_DATA detectado en la actualización:')
        console.log('  - Tipo:', typeof articleData.seo_data)
        console.log('  - Contenido completo:', JSON.stringify(articleData.seo_data, null, 2))
        
        if (typeof articleData.seo_data === 'object' && articleData.seo_data.focus_keyword) {
          console.log('🎯 [API-UPDATE] FOCUS_KEYWORD encontrado:', articleData.seo_data.focus_keyword)
        }
      }
      
      // 🛡️ PROTECCIÓN: Si se está enviando un campo 'language', debe coincidir con el original
      if (articleData.language && articleData.language !== originalLanguage) {
        const errorMsg = `⛔ [API-UPDATE] ERROR CRÍTICO: Intentando cambiar el idioma del artículo original de "${originalLanguage}" a "${articleData.language}". Esto NO está permitido. Las traducciones deben crearse con createTranslation().`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      // 🛡️ ADVERTENCIA: Logging para detectar posibles guardados incorrectos
      if (articleData.content) {
        console.log('  - Contenido (primeros 100 chars):', articleData.content.substring(0, 100))
      }
      
      console.log('✅ [API-UPDATE] Validación pasada, procediendo con actualización...')
      
      const response = await fetch(`${this.proxyURL}?id=${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(articleData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar el artículo')
      }

      const result = await response.json()
      console.log('✅ [API-UPDATE] Artículo original actualizado correctamente')
      
      // 🔍 VERIFICAR QUE EL RESULTADO CONTENGA LOS DATOS ACTUALIZADOS
      if (articleData.seo_data && result.data) {
        console.log('🔍 [API-UPDATE] Verificando seo_data en la respuesta del backend:')
        console.log('  - seo_data en respuesta:', result.data.seo_data ? 'SÍ' : 'NO')
        
        if (result.data.seo_data) {
          const responseSeoData = typeof result.data.seo_data === 'string' 
            ? JSON.parse(result.data.seo_data) 
            : result.data.seo_data
          
          console.log('  - focus_keyword en respuesta:', responseSeoData.focus_keyword || 'NO ENCONTRADO')
          
          if (responseSeoData.focus_keyword !== articleData.seo_data.focus_keyword) {
            console.error('❌ [API-UPDATE] MISMATCH: focus_keyword enviado vs recibido')
            console.error('  - Enviado:', articleData.seo_data.focus_keyword)
            console.error('  - Recibido:', responseSeoData.focus_keyword)
          } else {
            console.log('✅ [API-UPDATE] focus_keyword coincide correctamente')
          }
        }
      }
      
      return result.data
    } catch (error) {
      console.error('❌ [API-UPDATE] Error updating article:', error)
      throw error
    }
  }

  /**
   * Eliminar artículo
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar el artículo')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      throw error
    }
  }

  /**
   * Enviar artículo para aprobación
   */
  async submit(id: number): Promise<PlannerArticle> {
    try {
      const response = await fetch(`${this.baseURL}/${id}/submit`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al enviar el artículo')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error submitting article:', error)
      throw error
    }
  }

  /**
   * Incrementar contador de optimización
   */
  async incrementOptimization(id: number): Promise<PlannerArticle> {
    try {
      const article = await this.getById(id)
      return await this.update(id, {
        optimization_count: (article.optimization_count || 0) + 1
      } as Partial<PlannerArticleData>)
    } catch (error) {
      console.error('Error incrementing optimization count:', error)
      throw error
    }
  }

  /**
   * Marcar como publicado en WordPress
   */
  async markAsPublishedToWordPress(id: number, wordpressPostId: number): Promise<PlannerArticle> {
    try {
      return await this.update(id, {
        wordpress_post_id: wordpressPostId,
        status: 'published'
      } as Partial<PlannerArticleData>)
    } catch (error) {
      console.error('Error marking as published:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas del editor
   */
  async getEditorStats(): Promise<{
    total_articles: number
    draft_count: number
    pending_count: number
    published_count: number
    rejected_count: number
    total_words: number
    approval_rate: number
  }> {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching stats:', error)
      throw error
    }
  }

  /**
   * Obtener traducción específica
   */
  async getTranslation(articleId: number, language: string): Promise<ArticleTranslation> {
    try {
      const response = await fetch(`${this.baseURL}/${articleId}/translations/${language}`, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al obtener traducción')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error getting translation:', error)
      throw error
    }
  }

  /**
   * Crear nueva traducción
   * 🛡️ PROTECCIÓN: Validar que el idioma de la traducción no sea el mismo que el original
   */
  async createTranslation(
    articleId: number,
    translation: Partial<ArticleTranslation>
  ): Promise<ArticleTranslation> {
    try {
      // 🛡️ PROTECCIÓN: Obtener artículo original para validar
      const originalArticle = await this.getById(articleId)
      const originalLanguage = originalArticle.language || 'es'
      const translationLanguage = translation.language
      
      console.log('🌐 [API-CREATE-TRANSLATION] Validando creación de traducción:')
      console.log('  - Article ID:', articleId)
      console.log('  - Idioma original:', originalLanguage)
      console.log('  - Idioma de traducción:', translationLanguage)
      
      // 🛡️ PROTECCIÓN: No permitir crear traducción en el mismo idioma que el original
      if (translationLanguage === originalLanguage) {
        const errorMsg = `⛔ [API-CREATE-TRANSLATION] ERROR: Intentando crear traducción en el mismo idioma que el original (${originalLanguage}). Usa update() para modificar el artículo original.`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      // 🛡️ PROTECCIÓN: Verificar que ya no existe esta traducción
      if (originalArticle.available_languages?.includes(translationLanguage!)) {
        const errorMsg = `⛔ [API-CREATE-TRANSLATION] ERROR: Ya existe una traducción para el idioma ${translationLanguage}. Usa updateTranslation() para actualizarla.`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      console.log('✅ [API-CREATE-TRANSLATION] Validación pasada, creando traducción...')
      
      const response = await fetch(`${this.baseURL}/${articleId}/translations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(translation)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear traducción')
      }

      const result = await response.json()
      console.log('✅ [API-CREATE-TRANSLATION] Traducción creada correctamente')
      return result.data
    } catch (error) {
      console.error('❌ [API-CREATE-TRANSLATION] Error creating translation:', error)
      throw error
    }
  }

  /**
   * Actualizar traducción
   * 🛡️ PROTECCIÓN: Validar que se está actualizando una traducción y no el artículo original
   */
  async updateTranslation(
    articleId: number,
    language: string,
    translation: Partial<ArticleTranslation>
  ): Promise<ArticleTranslation> {
    try {
      // 🛡️ PROTECCIÓN: Obtener artículo original para validar
      const originalArticle = await this.getById(articleId)
      const originalLanguage = originalArticle.language || 'es'
      
      console.log('🔄 [API-UPDATE-TRANSLATION] Validando actualización de traducción:')
      console.log('  - Article ID:', articleId)
      console.log('  - Idioma original del artículo:', originalLanguage)
      console.log('  - Idioma de la traducción a actualizar:', language)
      console.log('  - Datos a actualizar:', Object.keys(translation))
      
      // 🛡️ PROTECCIÓN: No permitir actualizar el idioma original como si fuera traducción
      if (language === originalLanguage) {
        const errorMsg = `⛔ [API-UPDATE-TRANSLATION] ERROR CRÍTICO: Intentando actualizar el idioma original (${originalLanguage}) como si fuera una traducción. Usa update() para modificar el artículo original.`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      // 🛡️ PROTECCIÓN: Verificar que la traducción existe
      if (!originalArticle.available_languages?.includes(language)) {
        const errorMsg = `⛔ [API-UPDATE-TRANSLATION] ERROR: No existe traducción para el idioma ${language}. Créala primero con createTranslation().`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      // 🛡️ ADVERTENCIA: Logging del contenido
      if (translation.content) {
        console.log('  - Contenido (primeros 100 chars):', translation.content.substring(0, 100))
      }
      
      console.log('✅ [API-UPDATE-TRANSLATION] Validación pasada, actualizando traducción...')
      
      const response = await fetch(`${this.baseURL}/${articleId}/translations/${language}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(translation)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar traducción')
      }

      const result = await response.json()
      console.log(`✅ [API-UPDATE-TRANSLATION] Traducción ${language} actualizada correctamente`)
      return result.data
    } catch (error) {
      console.error('❌ [API-UPDATE-TRANSLATION] Error updating translation:', error)
      throw error
    }
  }

  /**
   * Eliminar traducción
   */
  async deleteTranslation(articleId: number, language: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${articleId}/translations/${language}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar traducción')
      }
    } catch (error) {
      console.error('Error deleting translation:', error)
      throw error
    }
  }
}

export const plannerArticlesService = new PlannerArticlesService()
