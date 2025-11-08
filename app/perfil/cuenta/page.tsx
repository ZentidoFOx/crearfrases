"use client"

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { ProfileInfo } from '@/components/profile/ProfileInfo'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Loader2,
  Shield,
  Clock,
  Mail,
  Key,
  CheckCircle,
  Info,
  Lock,
  UserCheck,
  Calendar,
  Activity
} from 'lucide-react'

export default function CuentaPage() {
  const { user, loading: authLoading } = useAuth()

  const roleColors = {
    superadmin: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700 border-red-200',
      theme: 'red',
      gradient: 'from-red-50 to-red-100',
      hover: 'hover:bg-red-700'
    },
    admin: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      theme: 'blue',
      gradient: 'from-blue-50 to-blue-100',
      hover: 'hover:bg-blue-700'
    },
    editor: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      theme: 'emerald',
      gradient: 'from-emerald-50 to-emerald-100',
      hover: 'hover:bg-emerald-700'
    }
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No disponible'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleInfo = (roleSlug: string) => {
    switch (roleSlug) {
      case 'superadmin':
        return {
          name: 'Superadmin',
          description: 'Acceso total al sistema',
          permissions: ['Gestión completa', 'Todos los usuarios', 'Configuración'],
          icon: Shield
        }
      case 'admin':
        return {
          name: 'Admin',
          description: 'Gestión de usuarios',
          permissions: ['Crear editores', 'Aprobar contenido', 'Reportes'],
          icon: UserCheck
        }
      case 'editor':
        return {
          name: 'Editor',
          description: 'Creación de contenido',
          permissions: ['Crear artículos', 'Editar borradores', 'Enviar a revisión'],
          icon: User
        }
      default:
        return {
          name: 'Usuario',
          description: 'Usuario del sistema',
          permissions: [],
          icon: User
        }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: '#096' }} />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const colors = roleColors[user.role_slug as keyof typeof roleColors] || roleColors.editor
  const roleInfo = getRoleInfo(user.role_slug || 'editor')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-xl bg-[#2b2b40] flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#2b2b40]">Mi Cuenta</h1>
                  <p className="text-gray-600 mt-1">
                    Información personal y configuración de seguridad
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="outline" style={{ backgroundColor: '#09610', color: '#096', borderColor: '#096' }}>
              <Shield className="h-4 w-4 mr-2" />
              {roleInfo.name}
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Account Status */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-[#096] transition-all p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Estado de Cuenta</p>
                  <p className="text-base font-bold leading-tight mt-0.5" style={{ color: '#096' }}>
                    {user.is_active ? 'Activa' : 'Inactiva'}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">Usuario verificado</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#096' }}>
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-[#2b2b40] transition-all p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Rol del Sistema</p>
                  <p className="text-base font-bold text-[#2b2b40] leading-tight mt-0.5">
                    {roleInfo.name}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">{roleInfo.description}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#2b2b40] flex-shrink-0 flex items-center justify-center">
                  <roleInfo.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Created At */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-[#ff6900] transition-all p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Miembro Desde</p>
                  <p className="text-sm font-bold leading-tight mt-0.5" style={{ color: '#ff6900' }}>
                    {formatDate(user.created_at).split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">Fecha de registro</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#ff6900' }}>
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Last Update */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-400 transition-all p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Última Actualización</p>
                  <p className="text-sm font-bold text-gray-600 leading-tight mt-0.5">
                    {formatDate((user as any).updated_at || user.created_at).split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">Modificación reciente</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-gray-600 flex-shrink-0 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Two Blocks */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
                <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">Información</h3>
                <div className="space-y-3">
                  {/* Username */}
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4" style={{ color: '#096' }} />
                      <span className="text-xs font-medium text-gray-600">Usuario</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                  </div>

                  {/* Email */}
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4" style={{ color: '#ff6900' }} />
                      <span className="text-xs font-medium text-gray-600">Email</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 break-all">{(user as any).email || 'No disponible'}</p>
                  </div>

                  {/* Role */}
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-[#2b2b40]" />
                      <span className="text-xs font-medium text-gray-600">Rol</span>
                    </div>
                    <p className="text-sm font-semibold text-[#2b2b40]">{roleInfo.name}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">Seguridad</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                      <CheckCircle className="h-4 w-4" style={{ color: '#096' }} />
                      <span className="text-xs text-gray-700">Cuenta Activa</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                      <Lock className="h-4 w-4" style={{ color: '#096' }} />
                      <span className="text-xs text-gray-700">Contraseña Segura</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                      <Mail className="h-4 w-4" style={{ color: '#ff6900' }} />
                      <span className="text-xs text-gray-700">Email Verificado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Block - Profile Form */}
            <div className="col-span-12 lg:col-span-9">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Datos Personales</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Actualiza tu información personal y de contacto
                  </p>
                </div>
                <div className="p-6">
                  <ProfileInfo user={user as any} roleColors={colors} />
                </div>
              </div>
            </div>
          </div>

          {/* Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role Permissions Card */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5" style={{ color: '#096' }} />
                  Permisos de {roleInfo.name}
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {roleInfo.permissions.map((permission, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                      <CheckCircle className="h-4 w-4" style={{ color: '#096' }} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{permission}</p>
                      <p className="text-xs text-gray-600">Acceso habilitado</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Tips Card */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="h-5 w-5" style={{ color: '#ff6900' }} />
                  Seguridad de Cuenta
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <Key className="h-4 w-4" style={{ color: '#ff6900' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Contraseña Fuerte</p>
                    <p className="text-xs text-gray-600">Usa al menos 8 caracteres con números y símbolos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <Mail className="h-4 w-4" style={{ color: '#ff6900' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Email Actualizado</p>
                    <p className="text-xs text-gray-600">Mantén tu email al día para recuperación.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Activity className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Revisa Tu Actividad</p>
                    <p className="text-xs text-gray-600">Verifica regularmente tu actividad reciente.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Info className="h-5 w-5 text-[#2b2b40]" />
                  Información de Cuenta
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)' }}>
                    <Calendar className="h-4 w-4 text-[#2b2b40]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Fecha de Creación</p>
                    <p className="text-xs text-gray-600">{formatDate(user.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Clock className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Última Modificación</p>
                    <p className="text-xs text-gray-600">{formatDate((user as any).updated_at || user.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)' }}>
                    <Shield className="h-4 w-4 text-[#2b2b40]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Estado</p>
                    <p className="text-xs text-gray-600">{user.is_active ? 'Cuenta activa y funcional' : 'Cuenta inactiva'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
