"use client"

import React from 'react'
import { type UserProfile } from '@/lib/api/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Shield, Calendar } from 'lucide-react'

interface ProfileInfoProps {
  user: UserProfile
  roleColors: {
    gradient: string
    border: string
    text: string
    bg: string
    hover: string
  }
}

export function ProfileInfo({ user, roleColors }: ProfileInfoProps) {
  return (
    <Card className={`border-2 ${roleColors.border}`}>
      <CardHeader className={`bg-gradient-to-r ${roleColors.gradient}`}>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <User className={`h-6 w-6 ${roleColors.text}`} />
          Información de Cuenta
        </CardTitle>
        <CardDescription className={`text-sm ${roleColors.text}`}>
          Detalles de tu cuenta en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Username */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-600">Usuario</p>
              <p className="text-2xl font-bold text-gray-900">{user.username}</p>
            </div>
          </div>

          {/* Account Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rol */}
            <div className={`p-4 rounded-lg border-2 ${roleColors.border} bg-gradient-to-br ${roleColors.gradient}`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className={`h-4 w-4 ${roleColors.text}`} />
                <p className="text-sm font-medium text-gray-700">Rol</p>
              </div>
              <p className={`text-lg font-bold ${roleColors.text}`}>
                {user.role_name || 'Sin rol'}
              </p>
            </div>

            {/* Estado */}
            <div className="p-4 rounded-lg border-2 border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-3 w-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className="text-sm font-medium text-gray-700">Estado</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {user.is_active ? 'Activo' : 'Inactivo'}
              </p>
            </div>

            {/* Miembro desde */}
            <div className="p-4 rounded-lg border-2 border-gray-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">Miembro desde</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {new Date(user.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Info adicional */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Tu perfil es solo de lectura. Los administradores pueden modificar roles y permisos desde la gestión de usuarios.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
