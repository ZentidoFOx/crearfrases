"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { usePermissions } from '@/hooks/usePermissions'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { profileService } from '@/lib/api/profile'
import { rolesService } from '@/lib/api/roles'
import { plannerArticlesService, type PlannerArticle } from '@/lib/api/planner-articles'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Loader2, 
  Users, 
  Shield, 
  Activity, 
  TrendingUp, 
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  FileText,
  PenTool,
  Calendar,
  Eye,
  ThumbsUp,
  Zap
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import Image from 'next/image'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { isSuperadmin, isAdmin, isEditor } = usePermissions()
  const [stats, setStats] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recentArticles, setRecentArticles] = useState<PlannerArticle[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)

  useEffect(() => {
    if (user) {
      fetchData()
      // Cargar artículos si es editor
      if (isEditor() && !isAdmin() && !isSuperadmin()) {
        fetchRecentArticles()
      }
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsData, rolesData] = await Promise.all([
        profileService.getStats(),
        rolesService.getRoles()
      ])
      setStats(statsData)
      setRoles(rolesData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentArticles = async () => {
    setLoadingArticles(true)
    try {
      // Obtener últimos 6 artículos
      const articles = await plannerArticlesService.getAll({ limit: 6 })
      console.log('📊 Artículos cargados:', articles)
      console.log('🖼️ Imágenes destacadas:', articles.map(a => ({ 
        id: a.id, 
        title: a.title,
        featured_image_url: a.featured_image_url 
      })))
      setRecentArticles(articles)
    } catch (error) {
      console.error('Error fetching recent articles:', error)
    } finally {
      setLoadingArticles(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // Si es editor, mostrar dashboard de editor
  if (isEditor() && !isAdmin() && !isSuperadmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <Sidebar />

        {/* Main Content - Editor Dashboard */}
        <main className="ml-20 pt-0">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                ¡Hola, {user?.username || 'Editor'}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Gestiona tu contenido y crea experiencias increíbles
              </p>
            </div>

            {/* Quick Actions - Editor */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Link href="/contenido/planner">
                <Card className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Planner de Contenido</CardTitle>
                        <CardDescription>Planifica y organiza tus artículos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/contenido/planner">
                <Card className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <PenTool className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Crear Artículo</CardTitle>
                        <CardDescription>Nuevo contenido con IA</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/contenido/analytics">
                <Card className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-emerald-400 bg-gradient-to-br from-emerald-50 to-white">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Analytics</CardTitle>
                        <CardDescription>Estadísticas de contenido</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>

            {/* Stats Grid - Editor */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Artículos */}
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Mis Artículos</CardTitle>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {loadingArticles ? '-' : recentArticles.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total creados</p>
                </CardContent>
              </Card>

              {/* Publicados */}
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Publicados</CardTitle>
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">
                    {loadingArticles ? '-' : recentArticles.filter(a => a.status === 'published').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">En sitio web</p>
                </CardContent>
              </Card>

              {/* Total Palabras */}
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Palabras</CardTitle>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {loadingArticles ? '-' : (recentArticles.reduce((sum, a) => sum + (a.word_count || 0), 0) / 1000).toFixed(1)}k
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total escritas</p>
                </CardContent>
              </Card>

              {/* En Progreso */}
              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">En Progreso</CardTitle>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Zap className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {loadingArticles ? '-' : recentArticles.filter(a => a.status === 'draft' || a.status === 'pending').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Borradores</p>
                </CardContent>
              </Card>
            </div>

            {/* Artículos Recientes */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Artículos Recientes
                </CardTitle>
                <CardDescription>
                  Tus últimos artículos creados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingArticles ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : recentArticles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No hay artículos todavía</p>
                    <p className="text-sm mb-4">Comienza creando tu primer artículo</p>
                    <Link href="/contenido/planner">
                      <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Crear Artículo
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentArticles.map((article) => (
                      <Link key={article.id} href={`/contenido/planner/articles/${article.id}`}>
                        <div className="group cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all">
                          {/* Imagen Destacada */}
                          <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                            {article.featured_image_url ? (
                              <>
                                <img
                                  src={article.featured_image_url}
                                  alt={article.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    console.error('❌ Error cargando imagen:', article.featured_image_url)
                                    e.currentTarget.style.display = 'none'
                                    const parent = e.currentTarget.parentElement
                                    if (parent) {
                                      const fallback = document.createElement('div')
                                      fallback.className = 'w-full h-full flex items-center justify-center flex-col gap-2'
                                      fallback.innerHTML = `
                                        <svg class="h-16 w-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span class="text-xs text-purple-400">Sin imagen</span>
                                      `
                                      parent.appendChild(fallback)
                                    }
                                  }}
                                  onLoad={() => {
                                    console.log('✅ Imagen cargada:', article.featured_image_url)
                                  }}
                                />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                                <FileText className="h-16 w-16 text-purple-300" />
                                <span className="text-xs text-purple-400">Sin imagen</span>
                              </div>
                            )}
                            {/* Badge de estado */}
                            <div className="absolute top-3 right-3">
                              {article.status === 'published' && (
                                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                                  Publicado
                                </span>
                              )}
                              {article.status === 'draft' && (
                                <span className="px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
                                  Borrador
                                </span>
                              )}
                              {article.status === 'pending' && (
                                <span className="px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Contenido */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                              {article.title}
                            </h3>
                            
                            {article.keyword && (
                              <div className="mb-2">
                                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                  {article.keyword}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{article.word_count || 0} palabras</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(article.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                              </div>
                            </div>

                            {/* Debug Info (solo visible en desarrollo) */}
                            {process.env.NODE_ENV === 'development' && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                <div className="font-mono truncate" title={article.featured_image_url || 'Sin URL'}>
                                  {article.featured_image_url ? (
                                    <span className="text-green-600">🖼️ {article.featured_image_url}</span>
                                  ) : (
                                    <span className="text-red-600">❌ Sin featured_image_url</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips y Consejos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-blue-600" />
                  Tips para Crear Contenido de Calidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg mt-1">
                      <Zap className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Usa el Planner de Contenido</p>
                      <p className="text-sm text-gray-600">Organiza tus ideas y programa tus publicaciones</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg mt-1">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Analiza el rendimiento</p>
                      <p className="text-sm text-gray-600">Revisa Analytics para ver qué contenido funciona mejor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg mt-1">
                      <PenTool className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Optimiza con IA</p>
                      <p className="text-sm text-gray-600">Usa las herramientas de humanización y SEO para mejorar tu contenido</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Dashboard para Admin y Superadmin
  return (
    <ProtectedRoute requireRole={['superadmin', 'admin']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <Sidebar />

        {/* Main Content */}
        <main className="ml-20 pt-0">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {isSuperadmin() ? 'Panel de Superadministrador' : 'Panel de Administrador'}
              </h1>
              <p className="text-lg text-gray-600">
                Vista completa del sistema y gestión de usuarios
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users */}
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Usuarios</CardTitle>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.total_users || stats?.manageable_users || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">En el sistema</p>
                </CardContent>
              </Card>

              {/* Roles */}
              {isSuperadmin() && (
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Roles Activos</CardTitle>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {stats?.total_roles || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Configurados</p>
                  </CardContent>
                </Card>
              )}

              {/* Active Sessions */}
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Sesiones Activas</CardTitle>
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Activity className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">
                    {stats?.total_sessions || stats?.sessions_count || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">En tiempo real</p>
                </CardContent>
              </Card>

              {/* New Users (7d) */}
              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Nuevos Usuarios</CardTitle>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <UserPlus className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {stats?.new_users_7d || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Últimos 7 días</p>
                </CardContent>
              </Card>
            </div>

            {/* Users by Role */}
            {stats?.users_by_role && stats.users_by_role.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Distribución de Usuarios por Rol
                  </CardTitle>
                  <CardDescription>
                    Cantidad de usuarios en cada rol del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.users_by_role.map((roleData: any) => {
                      const total = stats.total_users || 1
                      const count = typeof roleData.count === 'string' ? parseInt(roleData.count) : roleData.count
                      const percentage = ((count / total) * 100).toFixed(1)
                      
                      const roleColors: Record<string, { bg: string; text: string; bar: string }> = {
                        'Superadmin': { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
                        'Admin': { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
                        'Editor': { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' }
                      }
                      
                      const colors = roleColors[roleData.name] || { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-500' }
                      
                      return (
                        <div key={roleData.name} className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full ${colors.bg} ${colors.text} text-sm font-medium min-w-[120px]`}>
                            {roleData.name}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">{count} usuarios</span>
                              <span className="font-medium text-gray-900">{percentage}%</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${colors.bar} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Link href="/usuarios">
                <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-400">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Gestionar Usuarios</CardTitle>
                        <CardDescription>Ver y administrar todos los usuarios</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              {isSuperadmin() && (
                <Link href="/roles">
                  <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-400">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Shield className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Gestionar Roles</CardTitle>
                          <CardDescription>Configurar permisos y roles</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )}

              <Link href="/perfil">
                <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-emerald-400">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Mi Perfil</CardTitle>
                        <CardDescription>Ver estadísticas personales</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Base de Datos</p>
                      <p className="text-sm text-gray-500">Operativa</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">API Backend</p>
                      <p className="text-sm text-gray-500">Disponible</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Sesiones</p>
                      <p className="text-sm text-gray-500">{stats?.total_sessions || 0} activas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Tiempo de actividad</p>
                      <p className="text-sm text-gray-500">99.9% uptime</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
