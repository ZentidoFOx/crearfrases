"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Globe, 
  ArrowLeft,
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
  Server,
  Link as LinkIcon,
  Activity,
  Code,
  ExternalLink,
  Settings,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { websitesService, type Website } from '@/lib/api/websites'
import { WebsiteApiExplorer } from '@/components/profile/WebsiteApiExplorer'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function SitioWebDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const websiteId = parseInt(params.id as string)

  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (user && websiteId) {
      loadWebsite()
    }
  }, [user, websiteId])

  const loadWebsite = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await websitesService.getOne(websiteId, true)
      
      if (response.success && response.data) {
        setWebsite(response.data)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar sitio web')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyConnection = async () => {
    try {
      setVerifying(true)
      await websitesService.verifyConnection(websiteId)
      await loadWebsite()
    } catch (err: any) {
      setError(err?.message || 'Error al verificar conexión')
    } finally {
      setVerifying(false)
    }
  }

  if (authLoading || loading) {
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

  if (!website) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-slate-50">
        <Header />
        <Sidebar />
        <main className="ml-20 pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Sitio web no encontrado</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    )
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-slate-50">
      <Header />
      <Sidebar />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href="/perfil/sitios-web">
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Sitios Web
                </Button>
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-gray-900">{website.name}</h1>
                    <Badge variant="outline" className={website.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                      {website.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {website.connection_verified ? (
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                        <Wifi className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Sin Verificar
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                    <a 
                      href={website.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-cyan-600 transition-colors"
                    >
                      {website.url}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleVerifyConnection}
                disabled={verifying}
                variant="outline"
                className="border-cyan-200 hover:bg-cyan-50"
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Verificar Conexión
              </Button>
              <Button 
                variant="outline"
                className="border-blue-200 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
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
            {/* Connection Status */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-cyan-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estado de Conexión</p>
                    <p className="text-2xl font-bold text-cyan-600 mt-2">
                      {website.connection_verified ? 'Verificado' : 'Pendiente'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {website.last_verified_at ? formatDate(website.last_verified_at) : 'Nunca verificado'}
                    </p>
                  </div>
                  <div className={`h-14 w-14 rounded-full ${website.connection_verified ? 'bg-teal-100' : 'bg-orange-100'} flex items-center justify-center`}>
                    {website.connection_verified ? (
                      <Wifi className="h-7 w-7 text-teal-600" />
                    ) : (
                      <WifiOff className="h-7 w-7 text-orange-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Requests */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Requests</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {website.request_count.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total realizados</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <Activity className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Request */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-violet-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Último Request</p>
                    <p className="text-sm font-bold text-violet-600 mt-2">
                      {website.last_request_at ? formatDate(website.last_request_at) : 'Sin actividad'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Última comunicación</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Created At */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha de Registro</p>
                    <p className="text-sm font-bold text-emerald-600 mt-2">
                      {formatDate(website.created_at)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Creado en el sistema</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Server className="h-7 w-7 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - API Explorer */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Code className="h-5 w-5 text-cyan-600" />
                    Explorador de API REST
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Prueba y explora los endpoints de la API de WordPress
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WebsiteApiExplorer 
                websiteId={websiteId} 
                roleColors={{ bg: 'bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-200', gradient: '', hover: '', badge: '' }} 
              />
            </CardContent>
          </Card>

          {/* Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connection Details */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-cyan-600" />
                  Detalles de Conexión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">URL del Sitio</p>
                    <p className="text-xs text-gray-600 truncate">{website.url}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Code className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Endpoint API</p>
                    <p className="text-xs text-gray-600 break-all">{website.url}/wp-json/wp/v2</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Requests Totales</p>
                    <p className="text-xs text-gray-600">{website.request_count.toLocaleString()} llamadas a la API</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-violet-600" />
                  Información de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Key className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Autenticación</p>
                    <p className="text-xs text-gray-600">Usuario y contraseña encriptados</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Protocolo</p>
                    <p className="text-xs text-gray-600">{website.url.startsWith('https') ? 'HTTPS (Seguro)' : 'HTTP (No seguro)'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Estado</p>
                    <p className="text-xs text-gray-600">{website.connection_verified ? 'Conexión verificada' : 'Pendiente de verificación'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-emerald-600" />
                  Información de Actividad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Última Actividad</p>
                    <p className="text-xs text-gray-600">{website.last_request_at ? formatDate(website.last_request_at) : 'Sin actividad reciente'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Wifi className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Última Verificación</p>
                    <p className="text-xs text-gray-600">{website.last_verified_at ? formatDate(website.last_verified_at) : 'Nunca verificado'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Server className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Fecha de Creación</p>
                    <p className="text-xs text-gray-600">{formatDate(website.created_at)}</p>
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
