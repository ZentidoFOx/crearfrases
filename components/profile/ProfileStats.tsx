"use client"

import React, { useState, useEffect } from 'react'
import { profileService, type UserStats, type UserProfile } from '@/lib/api/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  Shield, 
  Activity, 
  Calendar,
  FileText,
  BarChart3,
  UserPlus,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface ProfileStatsProps {
  user: UserProfile
  roleColors: {
    gradient: string
    border: string
    text: string
    bg: string
    hover: string
  }
}

export function ProfileStats({ user, roleColors }: ProfileStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const data = await profileService.getStats()
      setStats(data)
    } catch (error: any) {
      toast.error('Error al cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* General Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas Generales
          </CardTitle>
          <CardDescription>
            Resumen de tu actividad en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Account Age */}
            <div className={`p-4 rounded-lg bg-gradient-to-br ${roleColors.gradient} border ${roleColors.border}`}>
              <div className="flex items-center justify-between mb-2">
                <Calendar className={`h-5 w-5 ${roleColors.text}`} />
                <TrendingUp className={`h-4 w-4 ${roleColors.text}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.account_age_days}</p>
              <p className="text-sm text-gray-600">Días en la plataforma</p>
            </div>

            {/* Active Sessions */}
            <div className={`p-4 rounded-lg bg-gradient-to-br ${roleColors.gradient} border ${roleColors.border}`}>
              <div className="flex items-center justify-between mb-2">
                <Activity className={`h-5 w-5 ${roleColors.text}`} />
                <Shield className={`h-4 w-4 ${roleColors.text}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.sessions_count}</p>
              <p className="text-sm text-gray-600">Sesiones activas</p>
            </div>

            {/* Role */}
            <div className={`p-4 rounded-lg bg-gradient-to-br ${roleColors.gradient} border ${roleColors.border}`}>
              <div className="flex items-center justify-between mb-2">
                <Shield className={`h-5 w-5 ${roleColors.text}`} />
              </div>
              <p className={`text-2xl font-bold ${roleColors.text}`}>{user.role_name}</p>
              <p className="text-sm text-gray-600">Tu rol actual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Superadmin Stats */}
      {stats.role === 'superadmin' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" />
                Panel de Superadministrador
              </CardTitle>
              <CardDescription>
                Vista completa del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{stats.total_users}</p>
                  <p className="text-sm text-gray-600">Total de Usuarios</p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{stats.total_roles}</p>
                  <p className="text-sm text-gray-600">Roles Activos</p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{stats.total_sessions}</p>
                  <p className="text-sm text-gray-600">Sesiones Activas (Sistema)</p>
                </div>
              </div>

              {/* Users by Role */}
              {stats.users_by_role && stats.users_by_role.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribución de Usuarios por Rol</h3>
                  <div className="space-y-2">
                    {stats.users_by_role.map((roleData) => {
                      const count = typeof roleData.count === 'string' ? parseInt(roleData.count) : roleData.count
                      const percentage = stats.total_users ? (count / stats.total_users! * 100).toFixed(1) : 0
                      
                      return (
                        <div key={roleData.name} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{roleData.name}</span>
                              <span className="text-gray-500">{roleData.count} ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Admin Stats */}
      {stats.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Users className="h-5 w-5" />
              Panel de Administrador
            </CardTitle>
            <CardDescription>
              Gestión de usuarios y actividad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{stats.manageable_users}</p>
                <p className="text-sm text-gray-600">Usuarios Gestionables</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{stats.active_users_30d}</p>
                <p className="text-sm text-gray-600">Usuarios Activos (30d)</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">{stats.new_users_7d}</p>
                <p className="text-sm text-gray-600">Nuevos Usuarios (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Stats */}
      {stats.role === 'editor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <FileText className="h-5 w-5" />
              Tus Estadísticas de Contenido
            </CardTitle>
            <CardDescription>
              Resumen de tus artículos y productividad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-emerald-50 border-2 border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-emerald-600">{stats.total_articles || 0}</p>
                <p className="text-sm text-gray-600">Total Artículos</p>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 border-2 border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">{stats.articles_draft || 0}</p>
                <p className="text-sm text-gray-600">Borradores</p>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">{stats.articles_published || 0}</p>
                <p className="text-sm text-gray-600">Publicados</p>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">{stats.total_words?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-600">Palabras Totales</p>
              </div>
            </div>

            {/* Info Message */}
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-900">
                <strong>📝 Nota:</strong> Las estadísticas de contenido se actualizarán una vez que empieces a crear artículos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
