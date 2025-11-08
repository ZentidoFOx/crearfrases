"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Sparkles,
  TrendingUp,
  BarChart3,
  PenTool,
  Calendar,
  Loader2,
  Award,
  Target,
  Zap,
  Lock
} from 'lucide-react'
import type { User } from '@/lib/api/auth'
import { articlesService, type EditorStats, type Article } from '@/lib/api/articles'
import { ProductivityChart } from '@/components/charts/ProductivityChart'
import { StatusDistributionChart } from '@/components/charts/StatusDistributionChart'
import { RecentArticlesList } from '@/components/editor/RecentArticlesList'

interface EditorHomeProps {
  user: User
}

export function EditorHome({ user }: EditorHomeProps) {
  const router = useRouter()
  const [stats, setStats] = useState<EditorStats | null>(null)
  const [productivity, setProductivity] = useState<any[]>([])
  const [recentArticles, setRecentArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load stats
      const statsResponse = await articlesService.getEditorStats()
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }

      // Load productivity data
      const productivityResponse = await articlesService.getMonthlyProductivity(6)
      if (productivityResponse.success && productivityResponse.data) {
        setProductivity(productivityResponse.data)
      }

      // Load recent articles
      const articlesResponse = await articlesService.getAll({ limit: 5 })
      if (articlesResponse.success && articlesResponse.data) {
        setRecentArticles(articlesResponse.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditArticle = (id: number) => {
    router.push(`/contenido/editar/${id}`)
  }

  const handleViewArticle = (id: number) => {
    router.push(`/contenido/ver/${id}`)
  }
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Horizontal como Mis-Dominios - Responsive */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl bg-[#2b2b40] flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-[#2b2b40] truncate">Bienvenido, {user.username}</h1>
              <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">Panel de Editor</p>
            </div>
          </div>
          
          {/* Stats Mini Horizontal - Responsive */}
          <div className="flex gap-4 md:gap-6 justify-around md:justify-end">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-[#2b2b40]">{stats?.total_articles ?? 0}</div>
              <div className="text-xs md:text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold" style={{ color: '#096' }}>{stats?.published_count ?? 0}</div>
              <div className="text-xs md:text-sm text-gray-500">Publicados</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold" style={{ color: '#ff6900' }}>{stats?.pending_count ?? 0}</div>
              <div className="text-xs md:text-sm text-gray-500">Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: '#096' }} />
        </div>
      ) : (
        <>
          {/* Acciones Rápidas - Grid Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
            <Link href="/contenido/planner" className="block">
              <div className="bg-white border-2 border-gray-200 rounded-xl hover:border-[#096] transition-all cursor-pointer h-full p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#096' }}>
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#2b2b40] text-sm md:text-base">Crear con IA</p>
                    <p className="text-xs text-gray-600">Nuevo artículo</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/contenido" className="block">
              <div className="bg-white border-2 border-gray-200 rounded-xl hover:border-[#2b2b40] transition-all cursor-pointer h-full p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[#2b2b40] flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#2b2b40] text-sm md:text-base">Mis Artículos</p>
                    <p className="text-xs text-gray-600">Ver todos</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/perfil/mis-dominios" className="block">
              <div className="bg-white border-2 border-gray-200 rounded-xl hover:border-[#f54a00] transition-all cursor-pointer h-full p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f54a00' }}>
                    <Target className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#2b2b40] text-sm md:text-base">Mis Dominios</p>
                    <p className="text-xs text-gray-600">Gestionar sitios</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/perfil/estadisticas" className="block">
              <div className="bg-white border-2 border-gray-200 rounded-xl hover:border-[#2b2b40] transition-all cursor-pointer h-full p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[#2b2b40] flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#2b2b40] text-sm md:text-base">Estadísticas</p>
                    <p className="text-xs text-gray-600">Ver métricas</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Herramientas Disponibles - Responsive */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ff6900' }}>
                <PenTool className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-[#2b2b40] mb-1">Tus Herramientas Disponibles</h2>
                <p className="text-sm md:text-base text-gray-600">Potentes herramientas impulsadas por IA para crear contenido de alta calidad optimizado para SEO.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Card 1 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#09610' }}>
                    <Sparkles className="h-5 w-5" style={{ color: '#096' }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#09610', color: '#096' }}>Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Content Planner</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Genera artículos completos optimizados para SEO con inteligencia artificial.</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#09610' }}>
                    <Target className="h-5 w-5" style={{ color: '#096' }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#09610', color: '#096' }}>Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Análisis SEO</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Optimización automática de keywords, meta descripciones y estructura.</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <FileText className="h-5 w-5" style={{ color: '#ff6900' }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)', color: '#ff6900' }}>Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Editor WYSIWYG</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Edita contenido con vista previa en tiempo real y sincronización HTML.</p>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)' }}>
                    <Award className="h-5 w-5" style={{ color: '#2b2b40' }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)', color: '#2b2b40' }}>Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Publicación Directa</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Publica directamente a WordPress con un solo clic desde el editor.</p>
              </div>

              {/* Card 5 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#09610' }}>
                    <TrendingUp className="h-5 w-5" style={{ color: '#096' }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#09610', color: '#096' }}>Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Estadísticas</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Monitorea el rendimiento de tus artículos y métricas de productividad.</p>
              </div>

              {/* Card 6 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <PenTool className="h-5 w-5" style={{ color: '#ff6900' }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)', color: '#ff6900' }}>Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Gestión de Borradores</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Organiza y administra tus borradores con estados y filtros avanzados.</p>
              </div>

              {/* Card 7 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)' }}>
                    <Zap className="h-5 w-5" style={{ color: '#2b2b40' }} />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)', color: '#2b2b40' }}>Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Generación Rápida</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Crea contenido optimizado en minutos con plantillas predefinidas.</p>
              </div>

              {/* Card 8 - Bloqueada */}
              <div className="relative bg-white border border-gray-300 rounded-xl p-4 md:p-6 cursor-not-allowed overflow-hidden">
                {/* Overlay con candado */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                  <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center shadow-xl">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200">
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-600">Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Programación Automática</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Programa publicaciones automáticas en múltiples dominios simultáneamente.</p>
              </div>

              {/* Card 9 - Bloqueada */}
              <div className="relative bg-white border border-gray-300 rounded-xl p-4 md:p-6 cursor-not-allowed overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                  <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center shadow-xl">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200">
                    <TrendingUp className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-600">Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Análisis de Competencia</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Analiza y compara tu contenido con los mejores rankings de Google.</p>
              </div>

              {/* Card 10 - Bloqueada */}
              <div className="relative bg-white border border-gray-300 rounded-xl p-4 md:p-6 cursor-not-allowed overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                  <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center shadow-xl">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200">
                    <Target className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-600">Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Backlink Finder</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Encuentra oportunidades de backlinks y mejora tu autoridad de dominio.</p>
              </div>

              {/* Card 11 - Bloqueada */}
              <div className="relative bg-white border border-gray-300 rounded-xl p-4 md:p-6 cursor-not-allowed overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                  <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center shadow-xl">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200">
                    <Sparkles className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-600">Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">Generación Masiva</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Genera hasta 100 artículos simultáneamente con un solo clic.</p>
              </div>

              {/* Card 12 - Bloqueada */}
              <div className="relative bg-white border border-gray-300 rounded-xl p-4 md:p-6 cursor-not-allowed overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                  <div className="h-14 w-14 rounded-full bg-gray-800 flex items-center justify-center shadow-xl">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200">
                    <BarChart3 className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-600">Disponible</span>
                </div>
                <h3 className="font-bold text-[#2b2b40] mb-2 text-base">White Label</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Personaliza la plataforma con tu marca para revender a clientes.</p>
              </div>
            </div>
          </div>

          {/* Información y Guías - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* ¿Cómo Funciona? */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[#2b2b40] flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[#2b2b40]">¿Cómo Funciona?</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <span className="text-sm font-bold text-white">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Crea con IA</p>
                    <p className="text-xs text-gray-500">Ingresa tu palabra clave y genera contenido optimizado automáticamente.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <span className="text-sm font-bold text-white">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Edita y Personaliza</p>
                    <p className="text-xs text-gray-500">Usa el editor WYSIWYG para ajustar el contenido a tu estilo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <span className="text-sm font-bold text-white">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Publica Directamente</p>
                    <p className="text-xs text-gray-500">Envía tu artículo a WordPress con un solo clic.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flujo de Trabajo */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ff6900' }}>
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2b2b40]">Flujo de Trabajo</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <PenTool className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Borrador</p>
                    <p className="text-xs text-gray-500">Crea y edita sin restricciones. Guarda automáticamente.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <Target className="h-4 w-4" style={{ color: '#ff6900' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Pendiente</p>
                    <p className="text-xs text-gray-500">Enviado para revisión del administrador.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Publicado</p>
                    <p className="text-xs text-gray-500">Aprobado y visible en tu sitio WordPress.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips de Productividad */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#096' }}>
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2b2b40]">Tips de Productividad</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Planifica tu Contenido</p>
                    <p className="text-xs text-gray-500">Crea calendarios editoriales para mantener consistencia.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Analiza tus Métricas</p>
                    <p className="text-xs text-gray-500">Revisa estadísticas para mejorar tu estrategia.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2b2b40] text-sm">Optimiza con IA</p>
                    <p className="text-xs text-gray-500">Usa sugerencias inteligentes para mejorar tu SEO.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
