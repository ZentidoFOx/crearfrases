/**
 * Profile API Service
 * Gestión completa del perfil de usuario
 */

import { API_CONFIG } from '@/lib/config/api'
import { TokenManager } from '@/lib/utils/token-manager'

export interface UserProfile {
  id: number
  username: string
  role_id: number
  role_slug: string | null
  role_name: string | null
  is_active: boolean
  created_at: string
}

export interface UserSession {
  id: number
  ip_address: string
  user_agent: string
  created_at: string
  expires_at: string
}

export interface UserStats {
  role: string
  account_age_days: number
  sessions_count: number
  // Superadmin stats
  total_users?: number
  total_roles?: number
  total_sessions?: number
  users_by_role?: Array<{ name: string; count: number }>
  // Admin stats
  manageable_users?: number
  active_users_30d?: number
  new_users_7d?: number
  // Editor stats
  articles_draft?: number
  articles_published?: number
  total_articles?: number
  total_words?: number
}

class ProfileService {
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
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await fetch(API_CONFIG.user.profile, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(API_CONFIG.user.profile, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update profile')
    }

    const result = await response.json()
    return result.data
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('🔐 [CHANGE-PASSWORD] Enviando solicitud de cambio de contraseña...')
      console.log('  - Endpoint:', API_CONFIG.user.password)
      console.log('  - Current password length:', currentPassword.length)
      console.log('  - New password length:', newPassword.length)
      
      const response = await fetch(API_CONFIG.user.password, {
        method: 'PUT',
        credentials: 'include',
        headers: this.getHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })

      console.log('📥 [CHANGE-PASSWORD] Respuesta recibida:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [CHANGE-PASSWORD] Error del servidor:', errorText)
        
        try {
          const error = JSON.parse(errorText)
          console.error('❌ [CHANGE-PASSWORD] Error parseado:', error)
          
          // Mensajes de error más específicos
          if (error.error?.code === 'INVALID_CURRENT_PASSWORD') {
            throw new Error('La contraseña actual es incorrecta')
          }
          if (error.error?.code === 'WEAK_PASSWORD') {
            throw new Error('La nueva contraseña no cumple con los requisitos de seguridad')
          }
          if (error.error?.message) {
            throw new Error(error.error.message)
          }
          if (error.message) {
            throw new Error(error.message)
          }
          
          throw new Error('Error al cambiar la contraseña. Por favor, intenta de nuevo.')
        } catch (parseError) {
          // Si no es JSON válido
          console.error('❌ [CHANGE-PASSWORD] No se pudo parsear error:', parseError)
          throw new Error(`Error del servidor (${response.status}): ${errorText.substring(0, 100)}`)
        }
      }

      const result = await response.json()
      console.log('✅ [CHANGE-PASSWORD] Contraseña cambiada exitosamente:', result)
    } catch (error: any) {
      console.error('❌ [CHANGE-PASSWORD] Error general:', error)
      throw error
    }
  }

  /**
   * Get user sessions
   */
  async getSessions(): Promise<UserSession[]> {
    const response = await fetch(API_CONFIG.user.sessions, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch sessions')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: number): Promise<void> {
    const response = await fetch(API_CONFIG.user.deleteSession(sessionId), {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete session')
    }
  }

  /**
   * Get user statistics (personalized by role)
   */
  async getStats(): Promise<UserStats> {
    const response = await fetch(API_CONFIG.user.stats, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Delete account
   */
  async deleteAccount(password: string): Promise<void> {
    const response = await fetch(API_CONFIG.user.account, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({ password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete account')
    }
  }
}

export const profileService = new ProfileService()
