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
    const response = await fetch(API_CONFIG.user.password, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to change password')
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
