'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { wordpressAnalyticsService, type SiteStats } from '@/lib/api/wordpress-analytics'
import { FileText, Eye, MessageSquare, FileType } from 'lucide-react'

interface SiteStatsCardProps {
  websiteUrl: string
}

export function SiteStatsCard({ websiteUrl }: SiteStatsCardProps) {
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [websiteUrl])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await wordpressAnalyticsService.getSiteStats(websiteUrl)
      setStats(data)
    } catch (err) {
      console.error('Error loading site stats:', err)
      setError('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del Sitio</CardTitle>
          <CardDescription>Cargando datos del WordPress...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del Sitio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error || 'No se pudieron cargar las estadísticas'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas del Sitio</CardTitle>
        <CardDescription>Resumen general del contenido de WordPress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            icon={FileText}
            label="Total Posts"
            value={wordpressAnalyticsService.formatNumber(stats.total_posts)}
            color="blue"
          />
          <StatBox
            icon={Eye}
            label="Total Vistas"
            value={wordpressAnalyticsService.formatNumber(stats.total_views)}
            color="emerald"
          />
          <StatBox
            icon={MessageSquare}
            label="Comentarios"
            value={wordpressAnalyticsService.formatNumber(stats.total_comments)}
            color="purple"
          />
          <StatBox
            icon={FileType}
            label="Total Palabras"
            value={wordpressAnalyticsService.formatNumber(stats.total_words)}
            color="amber"
          />
        </div>

        {/* Averages */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Promedios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <AverageBox
              label="SEO Score"
              value={stats.avg_seo_score}
            />
            <AverageBox
              label="Legibilidad"
              value={stats.avg_readability_score}
            />
            <AverageBox
              label="Calidad Contenido"
              value={stats.avg_content_quality_score}
            />
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Distribución por Calidad</h3>
          <div className="space-y-2">
            <QualityBar
              label="Excelente"
              count={stats.posts_by_quality.excellent}
              total={stats.total_posts}
              color="emerald"
            />
            <QualityBar
              label="Bueno"
              count={stats.posts_by_quality.good}
              total={stats.total_posts}
              color="blue"
            />
            <QualityBar
              label="Necesita Mejorar"
              count={stats.posts_by_quality.needs_improvement}
              total={stats.total_posts}
              color="amber"
            />
            <QualityBar
              label="Pobre"
              count={stats.posts_by_quality.poor}
              total={stats.total_posts}
              color="red"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatBox({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: 'blue' | 'emerald' | 'purple' | 'amber'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600'
  }

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-full ${colorClasses[color]} mb-2`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 text-center">{label}</p>
    </div>
  )
}

function AverageBox({ label, value }: { label: string; value: number }) {
  const emoji = wordpressAnalyticsService.getScoreEmoji(value)
  const color = wordpressAnalyticsService.getScoreColor(value)

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className={`text-lg font-bold ${color}`}>{value.toFixed(1)}</span>
      </div>
    </div>
  )
}

function QualityBar({ label, count, total, color }: {
  label: string
  count: number
  total: number
  color: 'emerald' | 'blue' | 'amber' | 'red'
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  
  const colorClasses = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
