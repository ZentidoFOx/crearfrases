import React, { useState, useEffect } from 'react'
import { TrendingUp, Eye, MessageSquare, ThumbsUp, ExternalLink, ArrowUpDown } from 'lucide-react'
import { wordpressAnalyticsService, type SiteStats, type TopPerformingPost } from '@/lib/api/wordpress-analytics'
import { AssignedWebsite } from '@/lib/api/users'

interface TopPerformingProps {
  stats: SiteStats | null
  loadingStats: boolean
  statsError: string
  website: AssignedWebsite
}

type SortOption = 'views' | 'engagement' | 'comments' | 'seo'

export function TopPerforming({ stats, loadingStats, statsError, website }: TopPerformingProps) {
  const [sortBy, setSortBy] = useState<SortOption>('views')
  const [posts, setPosts] = useState<TopPerformingPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)

  useEffect(() => {
    loadTopPosts()
  }, [website, sortBy])

  const loadTopPosts = async () => {
    try {
      setLoadingPosts(true)
      setPostsError(null)
      const data = await wordpressAnalyticsService.getTopPerforming(
        website.url,
        5, // Top 5
        sortBy
      )
      setPosts(data)
    } catch (err) {
      console.error('Error loading top posts:', err)
      setPostsError('Error al cargar los posts')
    } finally {
      setLoadingPosts(false)
    }
  }
  if (loadingStats) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-600">{statsError}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    )
  }

  if (loadingPosts) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-[#2b2b40] mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[#096]" />
          Posts con Mejor Rendimiento
        </h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (postsError) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-[#2b2b40] mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[#096]" />
          Posts con Mejor Rendimiento
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{postsError}</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excelente':
        return 'text-[#096] bg-[#096]/10'
      case 'Bueno':
        return 'text-blue-500 bg-blue-500/10'
      case 'Regular':
        return 'text-[#f54a00] bg-[#f54a00]/10'
      default:
        return 'text-gray-500 bg-gray-100'
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#2b2b40] mb-4 flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-[#096]" />
        Posts con Mejor Rendimiento
      </h2>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#096] flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Vistas</p>
              <p className="text-xl font-bold text-[#2b2b40]">
                {wordpressAnalyticsService.formatNumber(stats.total_views)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#9810fa] flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Comentarios</p>
              <p className="text-xl font-bold text-[#2b2b40]">
                {wordpressAnalyticsService.formatNumber(stats.total_comments)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <ThumbsUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Engagement Promedio</p>
              <p className="text-xl font-bold text-[#2b2b40]">6.7%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Top Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay posts disponibles</h3>
          <p className="text-gray-600">Aún no se han generado datos de rendimiento para este sitio</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#2b2b40]">Top {posts.length} Posts por Rendimiento</h3>
            
            {/* Ordenar por */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('views')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === 'views'
                      ? 'bg-[#096] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Vistas
                </button>
                <button
                  onClick={() => setSortBy('engagement')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === 'engagement'
                      ? 'bg-[#096] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Engagement
                </button>
                <button
                  onClick={() => setSortBy('comments')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === 'comments'
                      ? 'bg-[#096] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Comentarios
                </button>
                <button
                  onClick={() => setSortBy('seo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === 'seo'
                      ? 'bg-[#096] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  SEO Score
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Título del Post</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Vistas</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Comentarios</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Engagement</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">SEO Score</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((post: TopPerformingPost, index: number) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-[#096] text-white font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{post.title}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-bold text-[#2b2b40]">
                        {wordpressAnalyticsService.formatNumber(post.views)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-bold text-[#2b2b40]">{post.comments}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-[#096]">{post.engagement_score.toFixed(1)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-bold text-[#2b2b40]">{post.seo_score}</span>
                      <span className="text-xs text-gray-500 ml-1">/100</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.overall_quality)}`}>
                      {post.overall_quality}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => window.open(post.url, '_blank')}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#096] hover:text-[#096]/80 transition-colors"
                    >
                      Ver
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  )
}
