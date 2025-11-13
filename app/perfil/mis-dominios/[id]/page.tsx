"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, ArrowLeft, Server, Activity, FileText, ExternalLink, TrendingUp, AlertTriangle, BarChart3, Target, LogIn, Settings, RefreshCw } from 'lucide-react'
import { usersAPI, type AssignedWebsite } from '@/lib/api/users'
import { wordpressAnalyticsService, type SiteStats } from '@/lib/api/wordpress-analytics'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// Components
import { DomainHeader } from './parts/DomainHeader'
import { DomainStats } from './parts/DomainStats'
import { DomainInfo } from './parts/DomainInfo'
import { DomainAnalytics } from './parts/DomainAnalytics'
import { DomainHelp } from './parts/DomainHelp'
import { TopPerforming } from './parts/TopPerforming'
import { ContentQuality } from './parts/ContentQuality'
import { DetailedAnalysis } from './parts/DetailedAnalysis'
import { WordPressCredentials } from './parts/WordPressCredentials'

type TabType = 'info' | 'analytics' | 'top-performing' | 'content-quality' | 'detailed-analysis' | 'wordpress-config'

export default function MisDominiosDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const websiteId = parseInt(params.id as string)

  const [website, setWebsite] = useState<AssignedWebsite | null>(null)
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState('')
  const [statsError, setStatsError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('info')

  useEffect(() => {
    if (user && websiteId) {
      loadWebsite()
    }
  }, [user, websiteId])

  const loadWebsite = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError('')
      const response = await usersAPI.getUserWebsites(user.id)
      
      if (response.success && response.data) {
        const foundWebsite = response.data.find((w: AssignedWebsite) => w.id === websiteId)
        if (foundWebsite) {
          setWebsite(foundWebsite)
          // Cargar estadísticas del dominio
          loadStats(foundWebsite.url)
        } else {
          setError('Dominio no encontrado o no tienes acceso a él')
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar dominio')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (websiteUrl: string) => {
    try {
      setLoadingStats(true)
      setStatsError('')
      const data = await wordpressAnalyticsService.getSiteStats(websiteUrl)
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
      setStatsError('Error al cargar estadísticas del sitio')
    } finally {
      setLoadingStats(false)
    }
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No disponible'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[#2b2b40]" />
          </div>
        </main>
      </div>
    )
  }

  if (!user || user.role_slug !== 'editor') {
    router.push('/')
    return null
  }

  if (!website) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Dominio no encontrado'}</AlertDescription>
            </Alert>
            <Link href="/perfil/mis-dominios">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Mis Dominios
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />

      <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <DomainHeader website={website} />

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <DomainStats website={website} formatDate={formatDate} />

          {/* Main Content - Tabs Layout */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Sidebar - Navigation Tabs */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
                <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">Secciones</h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'info'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Server className="h-4 w-4" />
                    Información Técnica
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'analytics'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                    Analytics Generales
                  </button>

                  <button
                    onClick={() => setActiveTab('top-performing')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'top-performing'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Mejor Rendimiento
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('content-quality')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'content-quality'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Calidad de Contenido
                  </button>

                  <button
                    onClick={() => setActiveTab('detailed-analysis')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'detailed-analysis'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Análisis Detallado
                  </button>

                  <button
                    onClick={() => setActiveTab('wordpress-config')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'wordpress-config'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    WordPress Config
                  </button>
                </nav>

                {/* Acciones Disponibles */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">Acciones Disponibles</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/contenido/planner')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Crear Nuevo Artículo
                    </button>
                    
                    <button
                      onClick={() => window.open(`${website.url}/wp-login.php`, '_blank')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      Login a WordPress
                    </button>

                    <button
                      onClick={() => window.open(`${website.url}/wp-admin`, '_blank')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Panel de WordPress
                    </button>
                    
                    <button
                      onClick={() => window.open(website.url, '_blank')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver Sitio Público
                    </button>

                    <button
                      onClick={() => router.push('/contenido/analytics')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Ver Estadísticas
                    </button>

                    <button
                      onClick={() => window.location.reload()}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Actualizar Datos
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="col-span-12 lg:col-span-9">
              {activeTab === 'info' && <DomainInfo website={website} />}
              {activeTab === 'analytics' && (
                <DomainAnalytics 
                  stats={stats}
                  loadingStats={loadingStats}
                  statsError={statsError}
                />
              )}
              {activeTab === 'top-performing' && (
                <TopPerforming 
                  stats={stats}
                  loadingStats={loadingStats}
                  statsError={statsError}
                  website={website}
                />
              )}
              {activeTab === 'content-quality' && (
                <ContentQuality website={website} />
              )}
              {activeTab === 'detailed-analysis' && (
                <DetailedAnalysis website={website} />
              )}
              {activeTab === 'wordpress-config' && (
                <WordPressCredentials website={website} />
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  )
}
