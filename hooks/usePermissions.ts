"use client"

import { useState, useEffect } from 'react'
import { rolesService, type UserPermissions } from '@/lib/api/roles'
import { useAuth } from '@/contexts/auth-context'

/**
 * Hook para manejar permisos del usuario actual
 */
export function usePermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await rolesService.getUserPermissions()
        setPermissions(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching permissions:', err)
        setError('No se pudieron cargar los permisos')
        setPermissions(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [user])

  /**
   * Check if user has specific permission
   */
  const can = (resource: string, action: string): boolean => {
    if (!permissions) return false
    return permissions.can[`${resource}.${action}`] || false
  }

  /**
   * Check if user has specific role
   */
  const hasRole = (roleSlug: string | string[]): boolean => {
    if (!permissions) return false
    const slugs = Array.isArray(roleSlug) ? roleSlug : [roleSlug]
    return slugs.includes(permissions.role.slug)
  }

  /**
   * Check if user is superadmin
   */
  const isSuperadmin = (): boolean => {
    return hasRole('superadmin')
  }

  /**
   * Check if user is admin or higher
   */
  const isAdmin = (): boolean => {
    return hasRole(['superadmin', 'admin'])
  }

  /**
   * Check if user is editor
   */
  const isEditor = (): boolean => {
    return hasRole('editor')
  }

  return {
    permissions,
    loading,
    error,
    can,
    hasRole,
    isSuperadmin,
    isAdmin,
    isEditor,
  }
}
