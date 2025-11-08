"use client"

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Loader2,
  TrendingUp,
  Activity,
  Target,
  Award,
  Info,
  CheckCircle,
  LineChart,
  PieChart,
  Calendar,
  Zap
} from 'lucide-react'

export default function EstadisticasPage() {
  const { user, loading: authLoading } = useAuth()

  const roleColors = {
    superadmin: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700 border-red-200',
      gradient: 'from-red-50 to-red-100',
      hover: 'hover:bg-red-700'
    },
    admin: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      gradient: 'from-blue-50 to-blue-100',
      hover: 'hover:bg-blue-700'
    },
    editor: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      gradient: 'from-emerald-50 to-emerald-100',
      hover: 'hover:bg-emerald-700'
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
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#2b2b40]">Estadísticas</h1>
                  <p className="text-gray-600 mt-1">
                    Métricas y análisis de rendimiento
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="outline" style={{ backgroundColor: '#09610', color: '#096', borderColor: '#096' }}>
              <Activity className="h-4 w-4 mr-2" />
              Tiempo Real
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Activity */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-[#2b2b40] transition-all p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Actividad Total</p>
                  <p className="text-base font-bold text-[#2b2b40] leading-tight mt-0.5">100%</p>
                  <p className="text-xs text-gray-500 leading-tight">Rendimiento global</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#2b2b40] flex-shrink-0 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-[#096] transition-all p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Desempeño</p>
                  <p className="text-base font-bold leading-tight mt-0.5" style={{ color: '#096' }}>Excelente</p>
                  <p className="text-xs text-gray-500 leading-tight">En alza</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#096' }}>
                  <Target className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Achievement */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-[#ff6900] transition-all p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Logros</p>
                  <p className="text-base font-bold leading-tight mt-0.5" style={{ color: '#ff6900' }}>+5</p>
                  <p className="text-xs text-gray-500 leading-tight">Nuevos</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#ff6900' }}>
                  <Award className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Growth */}
            <div className="bg-white rounded-lg border border-gray-200 hover:border-[#096] transition-all p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Crecimiento</p>
                  <p className="text-base font-bold leading-tight mt-0.5" style={{ color: '#096' }}>+24%</p>
                  <p className="text-xs text-gray-500 leading-tight">Este mes</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#096' }}>
                  <LineChart className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Two Blocks */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
                <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">Resumen Rápido</h3>
                <div className="space-y-3">
                  {/* Activity Score */}
                  <div className="p-4 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Actividad</span>
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#09610', color: '#096' }}>Alta</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ backgroundColor: '#096', width: '85%' }}
                      />
                    </div>
                  </div>

                  {/* Productivity */}
                  <div className="p-4 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Productividad</span>
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)', color: '#ff6900' }}>Óptima</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ backgroundColor: '#ff6900', width: '92%' }}
                      />
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="p-4 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Compromiso</span>
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#09610', color: '#096' }}>Excelente</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ backgroundColor: '#096', width: '78%' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">Período</h3>
                  <nav className="space-y-1">
                    <button className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-[#096] text-white">
                      <span>Esta Semana</span>
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      Este Mes
                    </button>
                    <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      Este Año
                    </button>
                    <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      Todo el Tiempo
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            {/* Right Block - Main Stats */}
            <div className="col-span-12 lg:col-span-9">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Análisis Detallado</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Métricas y gráficos de tu rendimiento
                  </p>
                </div>
                <div className="p-6">
                  <ProfileStats user={user} roleColors={colors} />
                </div>
              </div>
            </div>
          </div>

          {/* Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metrics Info Card */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <LineChart className="h-5 w-5" style={{ color: '#096' }} />
                  Métricas Clave
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Activity className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Actividad Diaria</p>
                    <p className="text-xs text-gray-600">Seguimiento de tu trabajo diario y productividad.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <Target className="h-4 w-4" style={{ color: '#ff6900' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Objetivos Cumplidos</p>
                    <p className="text-xs text-gray-600">Porcentaje de metas alcanzadas este período.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <TrendingUp className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Tendencia</p>
                    <p className="text-xs text-gray-600">Análisis de crecimiento y evolución temporal.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Tips Card */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="h-5 w-5" style={{ color: '#ff6900' }} />
                  Mejora tu Rendimiento
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <CheckCircle className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Consistencia</p>
                    <p className="text-xs text-gray-600">Mantén una actividad regular para mejores resultados.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <Award className="h-4 w-4" style={{ color: '#ff6900' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Objetivos Claros</p>
                    <p className="text-xs text-gray-600">Define metas específicas y medibles.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <LineChart className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Análisis Regular</p>
                    <p className="text-xs text-gray-600">Revisa tus métricas semanalmente.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* About Stats Card */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Info className="h-5 w-5" style={{ color: '#2b2b40' }} />
                  Sobre las Estadísticas
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)' }}>
                    <BarChart3 className="h-4 w-4" style={{ color: '#2b2b40' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Datos en Tiempo Real</p>
                    <p className="text-xs text-gray-600">Las métricas se actualizan automáticamente.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Calendar className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Períodos Flexibles</p>
                    <p className="text-xs text-gray-600">Visualiza datos por día, semana, mes o año.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)' }}>
                    <PieChart className="h-4 w-4" style={{ color: '#2b2b40' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Gráficos Interactivos</p>
                    <p className="text-xs text-gray-600">Explora datos con visualizaciones dinámicas.</p>
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
