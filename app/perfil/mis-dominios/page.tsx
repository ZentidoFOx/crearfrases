"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Globe, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  ExternalLink,
  ArrowUpRight,
  Wifi,
  WifiOff,
  AlertCircle,
  LayoutGrid,
  List,
  Shield
} from 'lucide-react'
import { usersAPI, type AssignedWebsite } from '@/lib/api/users'
import { useRouter } from 'next/navigation'

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'active' | 'inactive' | 'verified' | 'unverified'

export default function MisDominiosPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [websites, setWebsites] = useState<AssignedWebsite[]>([])
  const [filteredWebsites, setFilteredWebsites] = useState<AssignedWebsite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
    unverified: 0
  })

  useEffect(() => {
    if (user) {
      loadWebsites()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [websites, search, filter])

  const loadWebsites = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      const response = await usersAPI.getUserWebsites(user.id)
      
      if (response.success) {
        setWebsites(response.data)
        
        // Calculate stats
        setStats({
          total: response.data.length,
          active: response.data.filter(w => w.is_active).length,
          inactive: response.data.filter(w => !w.is_active).length,
          verified: response.data.filter(w => w.connection_verified).length,
          unverified: response.data.filter(w => !w.connection_verified).length
        })
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cargar los dominios')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...websites]

    // Search filter
    if (search) {
      result = result.filter(w => 
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.url.toLowerCase().includes(search.toLowerCase()) ||
        w.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Type filter
    switch (filter) {
      case 'active':
        result = result.filter(w => w.is_active)
        break
      case 'inactive':
        result = result.filter(w => !w.is_active)
        break
      case 'verified':
        result = result.filter(w => w.connection_verified)
        break
      case 'unverified':
        result = result.filter(w => !w.connection_verified)
        break
    }

    setFilteredWebsites(result)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
        <Header />
        <Sidebar />
        <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
          </div>
        </main>
      </div>
    )
  }

  if (!user || user.role_slug !== 'editor') {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />

      <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Profesional - Responsive */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl bg-[#2b2b40] flex items-center justify-center flex-shrink-0">
                  <Globe className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl md:text-3xl font-bold text-[#2b2b40] truncate">Mis Dominios WordPress</h1>
                  <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">Gestiona tus sitios web</p>
                </div>
              </div>
              
              {/* Stats Mini - Responsive */}
              <div className="flex gap-4 md:gap-6 justify-around md:justify-end">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-[#2b2b40]">{stats.total}</div>
                  <div className="text-xs md:text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-[#096]">{stats.active}</div>
                  <div className="text-xs md:text-sm text-gray-500">Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-[#f54a00]">{stats.verified}</div>
                  <div className="text-xs md:text-sm text-gray-500">Verificados</div>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Controles superiores - Responsive */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 mb-4 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar dominios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 md:pl-12 h-10 md:h-12 text-sm md:text-base"
              />
            </div>

            {/* Vista Toggle - Responsive */}
            <div className="flex gap-2 justify-stretch sm:justify-start">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="default"
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-initial ${viewMode === 'grid' ? 'bg-[#2b2b40] hover:bg-[#2b2b40]/90' : ''}`}
              >
                <LayoutGrid className="h-4 w-4 md:h-5 md:w-5 md:mr-2" />
                <span className="hidden md:inline">Tarjetas</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="default"
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-initial ${viewMode === 'list' ? 'bg-[#2b2b40] hover:bg-[#2b2b40]/90' : ''}`}
              >
                <List className="h-4 w-4 md:h-5 md:w-5 md:mr-2" />
                <span className="hidden md:inline">Lista</span>
              </Button>
            </div>
          </div>

          {/* Layout: 2 Columnas SOLO en modo LIST - Responsive */}
          <div className={viewMode === 'list' ? 'grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-6' : ''}>
            
            {/* COLUMNA IZQUIERDA - Filtros (solo en modo list) - Oculto en móvil */}
            {viewMode === 'list' && (
              <div className="hidden lg:block space-y-4">
                {/* Filtros */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 md:p-5">
                  <h3 className="text-sm md:text-base font-bold text-[#2b2b40] mb-3 md:mb-4 flex items-center gap-2">
                    <Filter className="h-4 w-4 md:h-5 md:w-5" />
                    Filtros
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setFilter('all')}
                      className={`w-full justify-start text-sm ${filter === 'all' ? 'bg-[#2b2b40] hover:bg-[#2b2b40]/90 text-white' : ''}`}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Todos ({stats.total})
                    </Button>
                    <Button
                      variant={filter === 'active' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setFilter('active')}
                      className={`w-full justify-start text-sm ${filter === 'active' ? 'bg-[#096] hover:bg-[#096]/90 text-white' : ''}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activos ({stats.active})
                    </Button>
                    <Button
                      variant={filter === 'verified' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setFilter('verified')}
                      className={`w-full justify-start text-sm ${filter === 'verified' ? 'bg-[#f54a00] hover:bg-[#f54a00]/90 text-white' : ''}`}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Verificados ({stats.verified})
                    </Button>
                    <Button
                      variant={filter === 'unverified' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setFilter('unverified')}
                      className={`w-full justify-start text-sm ${filter === 'unverified' ? 'bg-gray-500 hover:bg-gray-600 text-white' : ''}`}
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Sin Verificar ({stats.unverified})
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* COLUMNA DERECHA - Lista de Dominios */}
            <div>
              {/* Filtros móviles en modo lista */}
              {viewMode === 'list' && (
                <div className="lg:hidden mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      size="sm"
                      variant={filter === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilter('all')}
                      className={filter === 'all' ? 'bg-[#2b2b40] hover:bg-[#2b2b40]/90 text-white' : ''}
                    >
                      Todos ({stats.total})
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'active' ? 'default' : 'outline'}
                      onClick={() => setFilter('active')}
                      className={filter === 'active' ? 'bg-[#096] hover:bg-[#096]/90 text-white' : ''}
                    >
                      Activos ({stats.active})
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'verified' ? 'default' : 'outline'}
                      onClick={() => setFilter('verified')}
                      className={filter === 'verified' ? 'bg-[#f54a00] hover:bg-[#f54a00]/90 text-white' : ''}
                    >
                      Verificados ({stats.verified})
                    </Button>
                  </div>
                </div>
              )}

              {/* Dominios */}
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                </div>
              ) : filteredWebsites.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border">
                  <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">No se encontraron dominios</h3>
                  <p className="text-sm text-gray-500">
                    {search || filter !== 'all' ? 'Intenta ajustar los filtros' : 'Aún no tienes dominios asignados'}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {filteredWebsites.map((website) => (
                    <div 
                      key={website.id} 
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#2b2b40] hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          website.connection_verified ? 'bg-[#f54a00]' : 'bg-gray-300'
                        }`}>
                          {website.connection_verified ? (
                            <Wifi className="h-6 w-6 text-white" />
                          ) : (
                            <WifiOff className="h-6 w-6 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-[#2b2b40] truncate">{website.name}</h3>
                            <Badge className={`text-xs px-2 py-0.5 ${
                              website.is_active ? 'bg-[#096] text-white' : 'bg-gray-400 text-white'
                            }`}>
                              {website.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <a 
                            href={website.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 hover:text-[#2b2b40] truncate block flex items-center gap-1 mb-2 group/link"
                          >
                            <ExternalLink className="h-3 w-3 group-hover/link:text-[#2b2b40]" />
                            <span className="group-hover/link:underline">{website.url}</span>
                          </a>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {website.connection_verified && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-[#f54a00]" />
                                <span>Verificado</span>
                              </div>
                            )}
                            {website.assigned_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(website.assigned_at)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button 
                          size="sm"
                          className="bg-[#2b2b40] hover:bg-[#2b2b40]/90 text-white flex-shrink-0"
                          onClick={() => router.push(`/perfil/mis-dominios/${website.id}`)}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2b2b40]">Dominio</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2b2b40]">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2b2b40]">Conexión</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-[#2b2b40]">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredWebsites.map((website) => (
                        <tr key={website.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                website.connection_verified ? 'bg-[#f54a00]' : 'bg-gray-300'
                              }`}>
                                <Globe className={`h-5 w-5 text-white`} />
                              </div>
                              <div>
                                <p className="font-bold text-[#2b2b40] text-sm">{website.name}</p>
                                <a 
                                  href={website.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-500 hover:text-[#2b2b40] flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {website.url}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs px-2 py-0.5 ${
                              website.is_active ? 'bg-[#096] text-white' : 'bg-gray-400 text-white'
                            }`}>
                              {website.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {website.connection_verified ? (
                              <div className="flex items-center gap-1 text-[#f54a00]">
                                <Wifi className="h-4 w-4" />
                                <span className="font-semibold text-xs">Verificado</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400">
                                <WifiOff className="h-4 w-4" />
                                <span className="font-semibold text-xs">Sin verificar</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              size="sm"
                              className="bg-[#2b2b40] hover:bg-[#2b2b40]/90 text-white"
                              onClick={() => router.push(`/perfil/mis-dominios/${website.id}`)}
                            >
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sección de Indicaciones e Información - Responsive */}
          <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* Card 1: Cómo Funciona */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5 hover:border-[#2b2b40] transition-all">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-[#2b2b40] flex items-center justify-center mb-2 md:mb-3">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-[#2b2b40] mb-2">¿Cómo Funciona?</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Los dominios asignados son sitios WordPress que puedes gestionar desde AdminResh. Cada dominio activo te permite crear y publicar contenido directamente.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#096] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span>Dominios activos están listos para usar</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#f54a00] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wifi className="h-3 w-3 text-white" />
                  </div>
                  <span>Verificación asegura la conexión con WordPress</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#2b2b40] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                  <span>Solo editores autorizados tienen acceso</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Qué Puedes Hacer */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5 hover:border-[#096] transition-all">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-[#096] flex items-center justify-center mb-2 md:mb-3">
                <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-[#2b2b40] mb-2">¿Qué Puedes Hacer?</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Con tus dominios asignados tienes control total para gestionar contenido de forma profesional y eficiente.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#096] font-bold">→</span>
                  <span>Crear y publicar artículos optimizados para SEO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#096] font-bold">→</span>
                  <span>Gestionar contenido con IA y herramientas avanzadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#096] font-bold">→</span>
                  <span>Ver estadísticas y rendimiento de tus publicaciones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#096] font-bold">→</span>
                  <span>Acceder directamente a cada sitio WordPress</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Necesitas Ayuda */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5 hover:border-[#f54a00] transition-all">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-[#f54a00] flex items-center justify-center mb-2 md:mb-3">
                <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-[#2b2b40] mb-2">¿Necesitas Ayuda?</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Si encuentras algún problema con tus dominios o necesitas acceso a un nuevo sitio, estos son los pasos a seguir.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#f54a00] font-bold">1.</span>
                  <span>Verifica que el dominio esté marcado como "Activo"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#f54a00] font-bold">2.</span>
                  <span>Asegúrate de que la conexión esté verificada</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#f54a00] font-bold">3.</span>
                  <span>Si persiste el problema, contacta al administrador</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#f54a00] font-bold">4.</span>
                  <span>Para solicitar acceso a nuevos sitios, envía una petición</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Banner Informativo Final - Responsive */}
          <div className="mt-6 md:mt-8 bg-[#2b2b40] rounded-xl p-4 md:p-6 text-white">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-bold mb-2">Seguridad y Permisos</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Todos los dominios asignados están protegidos y solo los editores autorizados pueden acceder. 
                  Los cambios que realices se sincronizan automáticamente con WordPress y puedes trabajar con confianza 
                  sabiendo que tu trabajo está respaldado y seguro.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
