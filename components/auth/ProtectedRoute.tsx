"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/contexts/auth-context'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: string | string[]
  requirePermission?: {
    resource: string
    action: string
  }
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requireRole,
  requirePermission,
  fallback
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { permissions, loading: permissionsLoading, hasRole, can } = usePermissions()

  // Loading state
  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  // Check role requirement
  if (requireRole) {
    // Try to use permissions first, fallback to user.role_slug
    let hasRequiredRole = false
    
    if (permissions) {
      hasRequiredRole = hasRole(requireRole)
    } else if (user.role_slug) {
      // Fallback: check directly from user object
      const requiredRoles = Array.isArray(requireRole) ? requireRole : [requireRole]
      hasRequiredRole = requiredRoles.includes(user.role_slug)
    }
    
    if (!hasRequiredRole) {
      if (fallback) {
        return <>{fallback}</>
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <ShieldAlert className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              No tienes el rol necesario para acceder a esta página.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Tu rol: <span className="font-medium text-gray-700">
                  {permissions?.role.name || user?.role_name || 'Sin rol'}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Rol requerido: <span className="font-medium text-gray-700">
                  {Array.isArray(requireRole) ? requireRole.join(' o ') : requireRole}
                </span>
              </p>
            </div>
            <div className="mt-6">
              <Button onClick={() => router.push('/')}>
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      )
    }
  }

  // Check permission requirement
  if (requirePermission) {
    const hasRequiredPermission = can(requirePermission.resource, requirePermission.action)
    
    if (!hasRequiredPermission) {
      if (fallback) {
        return <>{fallback}</>
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <ShieldAlert className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Permiso Insuficiente</h2>
            <p className="text-gray-600 mb-6">
              No tienes permiso para realizar esta acción.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Tu rol: <span className="font-medium text-gray-700">
                  {permissions?.role.name || user?.role_name || 'Sin rol'}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Permiso requerido: <span className="font-medium text-gray-700">
                  {requirePermission.resource}.{requirePermission.action}
                </span>
              </p>
            </div>
            <div className="mt-6">
              <Button onClick={() => router.push('/')}>
                Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      )
    }
  }

  // All checks passed
  return <>{children}</>
}
