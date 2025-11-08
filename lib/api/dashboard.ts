/**
 * Dashboard API Service
 * Estadísticas y métricas para el dashboard de administración
 */

import { API_CONFIG } from '@/lib/config/api'
import { TokenManager } from '@/lib/utils/token-manager'

export interface UserGrowthData {
  mes: string
  usuarios: number
  fecha: string
}

export interface ApiActivityData {
  dia: string
  llamadas: number
  fecha: string
}

export interface DashboardOverview {
  totalUsers: number
  activeUsers: number
  recentUsers: number
  inactiveUsers: number
  totalWebsites: number
  activeWebsites: number
  verifiedWebsites: number
  totalApiCalls: number
  totalAIModels: number
  activeAIModels: number
}

interface APIResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

class DashboardService {
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
   * Get user growth data by month
   */
  async getUserGrowth(months: number = 6): Promise<APIResponse<UserGrowthData[]>> {
    try {
      const response = await fetch(`${API_CONFIG.dashboard.userGrowth}?months=${months}`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw data
      }

      return data
    } catch (error) {
      console.error('Error fetching user growth:', error)
      throw error
    }
  }

  /**
   * Get API activity data by day
   */
  async getApiActivity(days: number = 7): Promise<APIResponse<ApiActivityData[]>> {
    try {
      const response = await fetch(`${API_CONFIG.dashboard.apiActivity}?days=${days}`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw data
      }

      return data
    } catch (error) {
      console.error('Error fetching API activity:', error)
      throw error
    }
  }

  /**
   * Get dashboard overview statistics
   */
  async getOverview(): Promise<APIResponse<DashboardOverview>> {
    try {
      const response = await fetch(API_CONFIG.dashboard.overview, {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders()
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw data
      }

      return data
    } catch (error) {
      console.error('Error fetching dashboard overview:', error)
      throw error
    }
  }
}

export const dashboardService = new DashboardService()
