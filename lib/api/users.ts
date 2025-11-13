/**
 * Users Admin API Service
 */

import { API_CONFIG } from '@/lib/config/api'

export interface UserListResponse {
  success: boolean
  data: {
    users: User[]
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

export interface User {
  id: number
  username: string
  role_id: number
  role_name: string | null
  role_slug: string | null
  is_active: boolean
  created_by: number | null
  created_by_username: string | null
  created_at: string
}

export interface CreateUserData {
  username: string
  password: string
  password_confirmation: string
  role_id: number
}

export interface UpdateUserData {
  role_id?: number
  is_active?: boolean
  password?: string
}

class UsersAPI {
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (includeAuth) {
      const token = localStorage.getItem('access_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json()

    if (!response.ok) {
      throw data
    }

    return data
  }

  /**
   * Get all users with pagination
   */
  async getAll(page = 1, perPage = 10, search = ''): Promise<UserListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && { search }),
    })

    const response = await fetch(`${API_CONFIG.admin.users}?${params}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<UserListResponse>(response)
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<{ success: boolean; data: User; message: string }> {
    const response = await fetch(API_CONFIG.admin.users, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse(response)
  }

  /**
   * Update a user
   */
  async update(userId: number, data: UpdateUserData): Promise<{ success: boolean; data: User; message: string }> {
    const response = await fetch(`${API_CONFIG.admin.users}/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse(response)
  }

  /**
   * Delete a user
   */
  async delete(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_CONFIG.admin.users}/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    return this.handleResponse(response)
  }

  /**
   * Toggle user active status
   */
  async toggleStatus(userId: number): Promise<{ success: boolean; data: User; message: string }> {
    const response = await fetch(`${API_CONFIG.admin.users}/${userId}/toggle-status`, {
      method: 'PUT',
      headers: this.getHeaders(),
    })

    return this.handleResponse(response)
  }

  /**
   * Get websites assigned to a user
   */
  async getUserWebsites(userId: number): Promise<{ success: boolean; data: AssignedWebsite[] }> {
    const response = await fetch(`${API_CONFIG.baseURL}/users/${userId}/websites`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse(response)
  }

  /**
   * Assign a website to a user
   */
  async assignWebsite(userId: number, websiteId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_CONFIG.baseURL}/users/${userId}/websites`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ website_id: websiteId }),
    })

    return this.handleResponse(response)
  }

  /**
   * Unassign a website from a user
   */
  async unassignWebsite(userId: number, websiteId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_CONFIG.baseURL}/users/${userId}/websites/${websiteId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    return this.handleResponse(response)
  }

  /**
   * Get WordPress credentials for a website
   */
  async getWordPressCredentials(websiteId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/users/wordpress-credentials/${websiteId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data: data.data || { username: '', app_password: '', is_configured: false } }
      } else {
        return { success: false, error: 'Error al cargar credenciales' }
      }
    } catch (error) {
      console.error('Error getting WordPress credentials:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  /**
   * Save WordPress credentials for a website
   */
  async saveWordPressCredentials(websiteId: number, credentials: { username: string; app_password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/users/wordpress-credentials/${websiteId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json().catch(() => null)
        const errorMessage = typeof errorData?.error === 'string' ? errorData.error : 
                            errorData?.message || 'Error al guardar credenciales'
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('Error saving WordPress credentials:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  /**
   * Test WordPress connection with credentials
   */
  async testWordPressConnection(websiteId: number, credentials: { username: string; app_password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/users/wordpress-credentials/${websiteId}/test`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        return { success: true }
      } else {
        const errorData = await response.json().catch(() => null)
        const errorMessage = typeof errorData?.error === 'string' ? errorData.error : 
                            errorData?.message || 'Error al probar conexión'
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('Error testing WordPress connection:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }
}

export interface AssignedWebsite {
  id: number
  name: string
  url: string
  description: string | null
  is_active: boolean
  connection_verified: boolean
  created_at: string
  assigned_at: string
  assignment_active: boolean
  assigned_by_username: string | null
}

export const usersAPI = new UsersAPI()
export const usersService = usersAPI // Alias for consistency
