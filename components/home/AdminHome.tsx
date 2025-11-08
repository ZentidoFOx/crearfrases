"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usersService, type User as UserData } from '@/lib/api/users'
import { websitesService, type Website } from '@/lib/api/websites'
import { aiModelsService, type AIModel } from '@/lib/api/ai-models'
import { dashboardService, type UserGrowthData, type ApiActivityData } from '@/lib/api/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Activity, 
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  BarChart3,
  Zap,
  Globe,
  Database,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { User } from '@/lib/api/auth'

interface AdminHomeProps {
  user: User
}

export function AdminHome({ user }: AdminHomeProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    recentUsers: 0,
    inactiveUsers: 0,
    totalWebsites: 0,
    activeWebsites: 0,
    verifiedWebsites: 0,
    totalApiCalls: 0,
    totalAIModels: 0,
    activeAIModels: 0
  })
  const [recentUsers, setRecentUsers] = useState<UserData[]>([])
  const [websites, setWebsites] = useState<Website[]>([])
  const [aiModels, setAIModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)

  // Chart data - Real data from API
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [activityData, setActivityData] = useState<ApiActivityData[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load users
      const usersResponse = await usersService.getAll(1, 10)
      
      if (!usersResponse.success || !usersResponse.data) {
        throw new Error('Failed to fetch users')
      }

      const { users, total } = usersResponse.data
      
      const active = users.filter(u => u.is_active).length
      const inactive = users.filter(u => !u.is_active).length
      
      // Usuarios creados en los últimos 7 días
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recent = users.filter(u => 
        new Date(u.created_at) > sevenDaysAgo
      ).length

      setRecentUsers(users.slice(0, 5))

      // Load websites
      let websitesData: Website[] = []
      let totalApiCalls = 0
      try {
        const websitesResponse = await websitesService.getAll()
        if (websitesResponse.success && websitesResponse.data) {
          websitesData = websitesResponse.data
          totalApiCalls = websitesData.reduce((sum, site) => sum + site.request_count, 0)
          setWebsites(websitesData.slice(0, 3))
        }
      } catch (error) {
        console.error('Error loading websites:', error)
      }

      // Load AI models
      let aiModelsData: AIModel[] = []
      try {
        aiModelsData = await aiModelsService.getModels()
        setAIModels(aiModelsData.slice(0, 3))
      } catch (error) {
        console.error('Error loading AI models:', error)
      }

      // Load chart data
      try {
        const growthResponse = await dashboardService.getUserGrowth(6)
        if (growthResponse.success && growthResponse.data) {
          setUserGrowthData(growthResponse.data)
        }
      } catch (error) {
        console.error('Error loading user growth data:', error)
        // Fallback to empty array
        setUserGrowthData([])
      }

      try {
        const activityResponse = await dashboardService.getApiActivity(7)
        if (activityResponse.success && activityResponse.data) {
          setActivityData(activityResponse.data)
        }
      } catch (error) {
        console.error('Error loading API activity data:', error)
        // Fallback to empty array
        setActivityData([])
      }

      setStats({
        totalUsers: total,
        activeUsers: active,
        inactiveUsers: inactive,
        recentUsers: recent,
        totalWebsites: websitesData.length,
        activeWebsites: websitesData.filter(w => w.is_active).length,
        verifiedWebsites: websitesData.filter(w => w.connection_verified).length,
        totalApiCalls: totalApiCalls,
        totalAIModels: aiModelsData.length,
        activeAIModels: aiModelsData.filter(m => m.is_active).length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (roleSlug: string | null) => {
    switch (roleSlug) {
      case 'superadmin':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'editor':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']

  return (
    <div className="p-8 max-w-[1800px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Bienvenido, {user.username}</h1>
              <p className="text-gray-600 mt-1">
                Panel de Administración - Gestión completa del sistema
              </p>
            </div>
          </div>
        </div>
        <Link href="/usuarios">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      {/* Stats Overview - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    +{stats.recentUsers} esta semana
                  </span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Websites */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sitios Web</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  {stats.totalWebsites}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.activeWebsites} activos, {stats.verifiedWebsites} verificados</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <Globe className="h-7 w-7 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Calls */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Llamadas API</p>
                <p className="text-3xl font-bold text-cyan-600 mt-2">
                  {stats.totalApiCalls.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Histórico completo</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-cyan-100 flex items-center justify-center">
                <Database className="h-7 w-7 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Models */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-violet-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Modelos IA</p>
                <p className="text-3xl font-bold text-violet-600 mt-2">
                  {stats.totalAIModels}
                </p>
                <p className="text-xs text-gray-500 mt-1">{stats.activeAIModels} activos</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Blocks Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT BLOCK - Quick Access */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Actions Card */}
          <Card className="border-0 shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Acceso Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/usuarios">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 hover:bg-blue-50 hover:border-blue-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 text-sm">Usuarios</p>
                      <p className="text-xs text-gray-500">Gestionar usuarios</p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/sitios-web">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 hover:bg-indigo-50 hover:border-indigo-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 text-sm">Sitios Web</p>
                      <p className="text-xs text-gray-500">WordPress conectados</p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/modelos-ia">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 hover:bg-violet-50 hover:border-violet-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 text-sm">Modelos IA</p>
                      <p className="text-xs text-gray-500">Configuración IA</p>
                    </div>
                  </div>
                </Button>
              </Link>

              <Link href="/contenido">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 hover:bg-emerald-50 hover:border-emerald-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 text-sm">Contenido</p>
                      <p className="text-xs text-gray-500">Ver artículos</p>
                    </div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT BLOCK - Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Crecimiento de Usuarios</CardTitle>
                    <CardDescription>Nuevos usuarios por mes</CardDescription>
                  </div>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
            <CardContent>
              {userGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    />
                    <Area type="monotone" dataKey="usuarios" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsuarios)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay datos disponibles</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Activity Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Actividad API Semanal</CardTitle>
                  <CardDescription>Llamadas por día de la semana</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent>
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dia" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    />
                    <Bar dataKey="llamadas" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay datos disponibles</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Usuarios Recientes</CardTitle>
                  <CardDescription className="text-sm">Últimos registros del sistema</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((recentUser) => (
                <div 
                  key={recentUser.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-700">
                        {recentUser.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{recentUser.username}</p>
                      <p className="text-xs text-gray-500">{formatDate(recentUser.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getRoleBadgeColor(recentUser.role_slug)}
                    >
                      {recentUser.role_name || 'Sin rol'}
                    </Badge>
                    {recentUser.is_active ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/perfil/usuarios">
              <Button variant="outline" className="w-full mt-4">
                Ver todos los usuarios
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

          {/* Websites Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Sitios Web</CardTitle>
                  <CardDescription className="text-sm">WordPress conectados</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
          <CardContent>
            {websites.length > 0 ? (
              <>
                <div className="space-y-3">
                  {websites.map((website) => (
                    <div 
                      key={website.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${website.connection_verified ? 'bg-teal-100' : 'bg-gray-100'} flex items-center justify-center`}>
                          {website.connection_verified ? (
                            <Wifi className="h-5 w-5 text-teal-600" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{website.name}</p>
                          <p className="text-xs text-gray-500 truncate">{website.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={website.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}
                        >
                          {website.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/perfil/sitios-web">
                  <Button variant="outline" className="w-full mt-4">
                    Ver todos los sitios
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No hay sitios web conectados</p>
                <Link href="/perfil/sitios-web">
                  <Button variant="outline" size="sm">
                    Agregar sitio web
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

          {/* AI Models Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Modelos IA</CardTitle>
                  <CardDescription className="text-sm">Inteligencia artificial</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-violet-600" />
                </div>
              </div>
            </CardHeader>
          <CardContent>
            {aiModels.length > 0 ? (
              <>
                <div className="space-y-3">
                  {aiModels.map((model) => (
                    <div 
                      key={model.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${model.is_active ? 'bg-violet-100' : 'bg-gray-100'} flex items-center justify-center`}>
                          <Zap className={`h-5 w-5 ${model.is_active ? 'text-violet-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{model.name}</p>
                          <p className="text-xs text-gray-500 truncate">{model.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={model.is_active ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-gray-100 text-gray-600 border-gray-200'}
                        >
                          {model.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/perfil/modelos-ia">
                  <Button variant="outline" className="w-full mt-4">
                    Ver todos los modelos
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No hay modelos IA configurados</p>
                <Link href="/perfil/modelos-ia">
                  <Button variant="outline" size="sm">
                    Configurar modelo IA
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </div>

      {/* Information Section - 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Sistema de Gestión */}
        <div className="bg-white rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Sistema de Gestión</h3>
              <p className="text-xs text-gray-600 mt-1">Administración completa</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Usuarios</p>
                <p className="text-xs text-gray-600">Gestión completa de cuentas y roles.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Globe className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Sitios Web</p>
                <p className="text-xs text-gray-600">WordPress conectados y verificados.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Modelos IA</p>
                <p className="text-xs text-gray-600">Configuración de inteligencia artificial.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Monitoreo y Análisis */}
        <div className="bg-white rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Monitoreo y Análisis</h3>
              <p className="text-xs text-gray-600 mt-1">Métricas en tiempo real</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <Database className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">API Calls</p>
                <p className="text-xs text-gray-600">Monitoreo de llamadas y rendimiento.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Crecimiento</p>
                <p className="text-xs text-gray-600">Análisis de usuarios y tendencias.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Activity className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Actividad</p>
                <p className="text-xs text-gray-600">Seguimiento en tiempo real del sistema.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Responsabilidades */}
        <div className="bg-white rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Responsabilidades</h3>
              <p className="text-xs text-gray-600 mt-1">Rol de administrador</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Gestión Total</p>
                <p className="text-xs text-gray-600">Control completo de usuarios y sitios.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Seguridad</p>
                <p className="text-xs text-gray-600">Protección y permisos del sistema.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <Activity className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Supervisión</p>
                <p className="text-xs text-gray-600">Monitoreo de actividades y rendimiento.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
