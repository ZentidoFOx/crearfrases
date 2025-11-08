"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Globe, 
  Plus,
  Search,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Loader2,
  Info,
  Shield,
  Key,
  Eye,
  Server,
  Link as LinkIcon,
  Activity,
  Code
} from 'lucide-react'
import { websitesService, type Website } from '@/lib/api/websites'
import { ProfileWebsites } from '@/components/profile/ProfileWebsites'
import { useRouter } from 'next/navigation'

export default function SitiosWebPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
    unverified: 0,
    totalRequests: 0,
    avgRequests: 0
  })

  useEffect(() => {
    if (user) {
      loadWebsites()
    }
  }, [user])

  const loadWebsites = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await websitesService.getAll()
      
      if (response.success && response.data) {
        const data = response.data
        setWebsites(data)

        // Calculate stats
        const totalReqs = data.reduce((sum, site) => sum + site.request_count, 0)
        
        setStats({
          total: data.length,
          active: data.filter(w => w.is_active).length,
          inactive: data.filter(w => !w.is_active).length,
          verified: data.filter(w => w.connection_verified).length,
          unverified: data.filter(w => !w.connection_verified).length,
          totalRequests: totalReqs,
          avgRequests: data.length > 0 ? Math.round(totalReqs / data.length) : 0
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar sitios web')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-slate-50">
        <Header />
        <Sidebar />
        <main className="ml-20 pt-16 p-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
          </div>
        </main>
      </div>
    )
  }

  if (!user || (user.role_slug !== 'superadmin' && user.role_slug !== 'admin')) {
    router.push('/')
    return null
  }

  const filteredWebsites = websites.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.url.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-slate-50">
      <Header />
      <Sidebar />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Sitios Web</h1>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Server className="h-4 w-4" />
                    Gestión completa de sitios WordPress conectados
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => {}}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Sitio
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Websites */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-cyan-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sitios</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                        <Server className="h-3 w-3 mr-1" />
                        {stats.active} activos
                      </Badge>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Globe className="h-7 w-7 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verified Websites */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verificados</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.verified}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(0) : 0}% conectados
                      </Badge>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Wifi className="h-7 w-7 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unverified Websites */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sin Verificar</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.unverified}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Pendientes
                      </Badge>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertCircle className="h-7 w-7 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Requests */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Requests</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalRequests.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Activity className="h-3 w-3 mr-1" />
                        ~{stats.avgRequests} promedio
                      </Badge>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <Activity className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Two Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Block - Stats by Status */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-cyan-600" />
                    Por Estado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Active */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-white border border-emerald-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Activos</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {stats.active}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Verified */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-white border border-teal-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Verificados</span>
                      <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                        {stats.verified}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Unverified */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-white border border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sin Verificar</span>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        {stats.unverified}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.unverified / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Filters */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    Vista Rápida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setSearch('')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Todos ({stats.total})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-emerald-600 hover:text-emerald-700"
                    size="sm"
                  >
                    <Wifi className="h-4 w-4 mr-2" />
                    Verificados ({stats.verified})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-orange-600 hover:text-orange-700"
                    size="sm"
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Sin Verificar ({stats.unverified})
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Block - Websites List */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Lista de Sitios Web</CardTitle>
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nombre o URL..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ProfileWebsites roleColors={{ bg: 'bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-200', gradient: '', hover: '', badge: '' }} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connection Info Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-cyan-600" />
                  Conexión WordPress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Code className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">REST API</p>
                    <p className="text-xs text-gray-600">Conexión mediante WordPress REST API v2 para máxima compatibilidad.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Wifi className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Verificación Automática</p>
                    <p className="text-xs text-gray-600">El sistema verifica la conexión periódicamente.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Monitoreo en Tiempo Real</p>
                    <p className="text-xs text-gray-600">Seguimiento de requests y performance.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-violet-600" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Key className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Credenciales Encriptadas</p>
                    <p className="text-xs text-gray-600">Usuarios y passwords se almacenan de forma segura.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Conexión HTTPS</p>
                    <p className="text-xs text-gray-600">Todas las conexiones usan SSL/TLS.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Rate Limiting</p>
                    <p className="text-xs text-gray-600">Protección contra abuso con límites de requests.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Practices Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-emerald-600" />
                  Buenas Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Usuario Dedicado</p>
                    <p className="text-xs text-gray-600">Crea un usuario específico para la API.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Monitoreo Regular</p>
                    <p className="text-xs text-gray-600">Revisa logs y actividad periódicamente.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Server className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Backup Regular</p>
                    <p className="text-xs text-gray-600">Mantén respaldos de tu sitio WordPress.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
