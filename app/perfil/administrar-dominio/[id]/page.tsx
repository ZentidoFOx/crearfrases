"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Globe,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Calendar,
  User,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Shield,
  Activity
} from 'lucide-react'
import { usersAPI, type AssignedWebsite } from '@/lib/api/users'

export default function AdministrarDominioPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const websiteId = parseInt(params.id as string)

  const [website, setWebsite] = useState<AssignedWebsite | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && websiteId) {
      loadWebsiteData()
    }
  }, [user, websiteId])

  const loadWebsiteData = async () => {
    try {
      setLoading(true)
      setError('')

      // Obtener todos los dominios asignados del usuario
      const response = await usersAPI.getUserWebsites(user!.id)

      if (response.success) {
        // Buscar el dominio específico
        const foundWebsite = response.data.find(w => w.id === websiteId)

        if (foundWebsite) {
          setWebsite(foundWebsite)
        } else {
          setError('No tienes acceso a este dominio o no existe')
        }
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cargar el dominio')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
        <Header />
        <Sidebar />
        <main className="ml-20 pt-16 p-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !website) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
        <Header />
        <Sidebar />
        <main className="ml-20 pt-16 p-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Dominio no encontrado'}</AlertDescription>
            </Alert>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
      <Header />
      <Sidebar />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header con botón de volver */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button
              onClick={() => window.open(website.url, '_blank')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Sitio
            </Button>
          </div>

          {/* Título Principal */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <Globe className="h-10 w-10 text-emerald-600" />
              Administrar Dominio
            </h1>
            <p className="text-lg text-gray-600">{website.name}</p>
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Principal - Información Detallada */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card Principal */}
              <Card className="border-2 border-emerald-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Globe className="h-6 w-6" />
                    Información del Dominio
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre del Sitio</label>
                    <h2 className="text-2xl font-bold text-gray-900 mt-1">{website.name}</h2>
                  </div>

                  {/* URL */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {website.url}
                      </a>
                    </div>
                  </div>

                  {/* Descripción */}
                  {website.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Descripción</label>
                      <p className="text-gray-700 mt-1 leading-relaxed">{website.description}</p>
                    </div>
                  )}

                  {/* Estados */}
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Estado</label>
                    <div className="flex flex-wrap gap-3">
                      <Badge
                        variant="outline"
                        className={`px-3 py-1 ${
                          website.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {website.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sitio Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Sitio Inactivo
                          </>
                        )}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={`px-3 py-1 ${
                          website.connection_verified
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {website.connection_verified ? (
                          <>
                            <Wifi className="h-3 w-3 mr-1" />
                            Conexión Verificada
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 mr-1" />
                            Conexión No Verificada
                          </>
                        )}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={`px-3 py-1 ${
                          website.assignment_active
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {website.assignment_active ? 'Asignación Activa' : 'Asignación Inactiva'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Información Técnica */}
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Información Técnica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">ID del Sitio</label>
                      <p className="text-sm font-mono text-gray-900 mt-1">{website.id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Estado Asignación</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {website.assignment_active ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500">Fecha de Creación del Sitio</label>
                    <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(website.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna Lateral - Asignación y Acciones */}
            <div className="space-y-6">
              {/* Card de Asignación */}
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-purple-600" />
                    Información de Asignación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Asignado Por</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {website.assigned_by_username || 'Desconocido'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500">Fecha de Asignación</label>
                    <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(website.assigned_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Acciones Rápidas */}
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => window.open(website.url, '_blank')}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Sitio Web
                  </Button>

                  <Button
                    onClick={() => window.open(`${website.url}/wp-admin`, '_blank')}
                    variant="outline"
                    className="w-full border-blue-200 hover:bg-blue-50"
                  >
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    WordPress Admin
                  </Button>

                  <Button
                    onClick={() => window.open(`${website.url}/wp-json`, '_blank')}
                    variant="outline"
                    className="w-full border-purple-200 hover:bg-purple-50"
                  >
                    <Activity className="h-4 w-4 mr-2 text-purple-600" />
                    API REST
                  </Button>
                </CardContent>
              </Card>

              {/* Card de Estado de Conexión */}
              {website.connection_verified ? (
                <Card className="border-2 border-teal-200 bg-teal-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Wifi className="h-5 w-5 text-teal-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-teal-900">Conexión Verificada</h3>
                        <p className="text-sm text-teal-700 mt-1">
                          La conexión con este sitio WordPress está activa y funcionando correctamente.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <WifiOff className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900">Conexión No Verificada</h3>
                        <p className="text-sm text-red-700 mt-1">
                          La conexión con este sitio WordPress no ha sido verificada. Contacta al administrador.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sección de Analytics - Accesos Rápidos */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                <Activity className="h-8 w-8 text-emerald-600" />
                WordPress Analytics
              </h2>
              <p className="text-gray-600">Análisis completo de contenido y rendimiento</p>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 group border-2 border-transparent hover:border-emerald-500"
                onClick={() => router.push('/contenido/analytics')}
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    Dashboard Principal
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Vista general de estadísticas y métricas del sitio
                  </p>
                  <div className="flex items-center text-sm font-medium text-emerald-600 group-hover:translate-x-1 transition-transform">
                    Abrir dashboard
                    <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 group border-2 border-transparent hover:border-blue-500"
                onClick={() => router.push('/contenido/analytics/top-performing')}
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    Top Performing
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Posts con mejor rendimiento y engagement
                  </p>
                  <div className="flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                    Ver top posts
                    <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 group border-2 border-transparent hover:border-amber-500"
                onClick={() => router.push('/contenido/analytics/content-quality')}
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                    Content Quality
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Posts que necesitan mejoras y optimización
                  </p>
                  <div className="flex items-center text-sm font-medium text-amber-600 group-hover:translate-x-1 transition-transform">
                    Ver recomendaciones
                    <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
