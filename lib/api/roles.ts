/**
 * Roles API Service
 * Manages roles and permissions
 */

import { API_CONFIG } from '@/lib/config/api'

export interface Role {
  id: number
  name: string
  slug: 'superadmin' | 'admin' | 'editor'
  description: string
  hierarchy_level: number
  permissions: {
    users: {
      create: boolean
      read: boolean
      update: boolean
      delete: boolean
    }
    roles: {
      create: boolean
      read: boolean
      update: boolean
      delete: boolean
    }
    content: {
      create: boolean
      read: boolean
      update: boolean
      delete: boolean
      publish: boolean
    }
    settings: {
      read: boolean
      update: boolean
    }
    analytics: {
      read: boolean
    }
    api_keys: {
      create: boolean
      read: boolean
      update: boolean
      delete: boolean
    }
  }
  is_active: boolean
  user_count?: number
  created_at: string
  updated_at: string
}

export interface UserPermissions {
  role: {
    id: number
    name: string
    slug: string
    hierarchy_level: number
  }
  permissions: Role['permissions']
  can: Record<string, boolean> // Flattened permissions (e.g., "users.create": true)
}

class RolesService {
  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    const response = await fetch(API_CONFIG.roles.list, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch roles')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: number): Promise<Role> {
    const response = await fetch(API_CONFIG.roles.byId(id), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch role')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get current user permissions
   */
  async getUserPermissions(): Promise<UserPermissions> {
    const response = await fetch(API_CONFIG.roles.permissions, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch permissions')
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(resource: string, action: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions()
      return permissions.can[`${resource}.${action}`] || false
    } catch {
      return false
    }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(roleSlug: string | string[]): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions()
      const slugs = Array.isArray(roleSlug) ? roleSlug : [roleSlug]
      return slugs.includes(permissions.role.slug)
    } catch {
      return false
    }
  }

  /**
   * Check if user is superadmin
   */
  async isSuperadmin(): Promise<boolean> {
    return this.hasRole('superadmin')
  }

  /**
   * Check if user is admin or higher
   */
  async isAdmin(): Promise<boolean> {
    return this.hasRole(['superadmin', 'admin'])
  }
}

export const rolesService = new RolesService()
