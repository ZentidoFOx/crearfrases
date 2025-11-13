/**
 * Auth API Service
 * Handles all authentication-related API calls to the backend
 */

import { API_CONFIG } from '@/lib/config/api'

export interface User {
  id: number
  username: string
  role_id: number
  role_slug: string | null
  role_name: string | null
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  data?: {
    user: User
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }
  error?: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface LoginCredentials {
  username: string
  password: string
  remember_me?: boolean
}

export interface RegisterData {
  username: string
  password: string
  password_confirmation: string
  role_id: number
}

export interface UpdateProfileData {
  role_id?: number
  password?: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

class AuthAPI {
  private getHeaders(includeAuth = false): HeadersInit {
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
    try {
      const data = await response.json()

      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data
        })
        throw data
      }

      return data
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Error parsing JSON - probably HTML error page
        console.error('JSON Parse Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        })
        throw new Error(`Server error (${response.status}): ${response.statusText}`)
      }
      throw error
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(API_CONFIG.auth.register, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<AuthResponse>(response)
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(API_CONFIG.auth.login, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    })

    return this.handleResponse<AuthResponse>(response)
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const response = await fetch(API_CONFIG.auth.logout, {
      method: 'POST',
      headers: this.getHeaders(true),
    })

    await this.handleResponse(response)
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(API_CONFIG.auth.refresh, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    return this.handleResponse<AuthResponse>(response)
  }

  /**
   * Get current user
   */
  async me(): Promise<{ success: boolean; data: User }> {
    const response = await fetch(API_CONFIG.auth.me, {
      method: 'GET',
      headers: this.getHeaders(true),
    })

    return this.handleResponse(response)
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<{ success: boolean; data: User }> {
    const response = await fetch(API_CONFIG.user.profile, {
      method: 'GET',
      headers: this.getHeaders(true),
    })

    return this.handleResponse(response)
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; data: User; message: string }> {
    const response = await fetch(API_CONFIG.user.profile, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })

    return this.handleResponse(response)
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(API_CONFIG.user.password, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    })

    return this.handleResponse(response)
  }

  /**
   * Delete account
   */
  async deleteAccount(password: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(API_CONFIG.user.account, {
      method: 'DELETE',
      headers: this.getHeaders(true),
      body: JSON.stringify({ password }),
    })

    return this.handleResponse(response)
  }

  /**
   * Get user sessions
   */
  async getSessions(): Promise<{ success: boolean; data: any[] }> {
    const response = await fetch(API_CONFIG.user.sessions, {
      method: 'GET',
      headers: this.getHeaders(true),
    })

    return this.handleResponse(response)
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_CONFIG.user.sessions}/${sessionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    })

    return this.handleResponse(response)
  }
}

export const authAPI = new AuthAPI()
