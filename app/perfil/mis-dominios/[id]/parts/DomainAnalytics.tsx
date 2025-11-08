import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity,
  FileText,
  Eye,
  MessageSquare,
  BarChart3,
  Target,
  AlertCircle,
  Search,
  BookOpen,
  Award,
  CheckCircle,
  ThumbsUp,
  AlertOctagon,
  XCircle
} from 'lucide-react'
import { wordpressAnalyticsService, type SiteStats } from '@/lib/api/wordpress-analytics'

interface DomainAnalyticsProps {
  stats: SiteStats | null
  loadingStats: boolean
  statsError: string
}

export function DomainAnalytics({ stats, loadingStats, statsError }: DomainAnalyticsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#2b2b40] mb-4 flex items-center gap-2">
        <Activity className="h-6 w-6 text-[#096]" />
        Analytics del Dominio
      </h2>

      {statsError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{statsError}</AlertDescription>
        </Alert>
      )}

      {loadingStats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
          <div className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      ) : stats ? (
        <>
          {/* Overview Stats - Table */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
              <h3 className="text-lg font-bold text-[#2b2b40] flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#096]" />
                Estadísticas Generales
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Métrica</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#096] flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Total Posts</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#2b2b40]">
                      {wordpressAnalyticsService.formatNumber(stats.total_posts)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#096] flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Total Vistas</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#2b2b40]">
                      {wordpressAnalyticsService.formatNumber(stats.total_views)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#9810fa] flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Comentarios</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#2b2b40]">
                      {wordpressAnalyticsService.formatNumber(stats.total_comments)}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#f54a00] flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Palabras Totales</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#2b2b40]">
                      {wordpressAnalyticsService.formatNumber(stats.total_words)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quality Scores - Table */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
              <h3 className="text-lg font-bold text-[#2b2b40] flex items-center gap-2">
                <Target className="h-5 w-5 text-[#096]" />
                Calidad del Contenido
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Puntuación</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#096] flex items-center justify-center">
                          <Search className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">SEO Score</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-2xl font-bold ${wordpressAnalyticsService.getScoreColor(stats.avg_seo_score)}`}>
                        {stats.avg_seo_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Optimización para motores de búsqueda
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Legibilidad</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-2xl font-bold ${wordpressAnalyticsService.getScoreColor(stats.avg_readability_score)}`}>
                        {stats.avg_readability_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Facilidad de lectura del contenido
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#9810fa] flex items-center justify-center">
                          <Award className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Calidad Contenido</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-2xl font-bold ${wordpressAnalyticsService.getScoreColor(stats.avg_content_quality_score)}`}>
                        {stats.avg_content_quality_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Calidad técnica y estructura
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribution - Table */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
              <h3 className="text-lg font-bold text-[#2b2b40] flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#096]" />
                Distribución por Calidad
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nivel</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Posts</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Porcentaje</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Distribución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#096] flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Excelente</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-[#2b2b40]">
                      {stats.posts_by_quality.excellent}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-[#096]">
                      {((stats.posts_by_quality.excellent / stats.total_posts) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-[#096] transition-all duration-500"
                          style={{ width: `${(stats.posts_by_quality.excellent / stats.total_posts) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                          <ThumbsUp className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Bueno</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-[#2b2b40]">
                      {stats.posts_by_quality.good}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-blue-500">
                      {((stats.posts_by_quality.good / stats.total_posts) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${(stats.posts_by_quality.good / stats.total_posts) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#f54a00] flex items-center justify-center">
                          <AlertOctagon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Necesita Mejorar</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-[#2b2b40]">
                      {stats.posts_by_quality.needs_improvement}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-[#f54a00]">
                      {((stats.posts_by_quality.needs_improvement / stats.total_posts) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-[#f54a00] transition-all duration-500"
                          style={{ width: `${(stats.posts_by_quality.needs_improvement / stats.total_posts) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-red-500 flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Pobre</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-[#2b2b40]">
                      {stats.posts_by_quality.poor}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-red-500">
                      {((stats.posts_by_quality.poor / stats.total_posts) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-red-500 transition-all duration-500"
                          style={{ width: `${(stats.posts_by_quality.poor / stats.total_posts) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
