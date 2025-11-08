import React, { useState, useEffect } from 'react'
import { AlertTriangle, Target, Zap, FileText, ChevronDown, ChevronUp, ExternalLink, CheckCircle2 } from 'lucide-react'
import { wordpressAnalyticsService, type PostNeedingImprovement } from '@/lib/api/wordpress-analytics'
import { AssignedWebsite } from '@/lib/api/users'
import { Badge } from '@/components/ui/badge'

interface ContentQualityProps {
  website: AssignedWebsite
}

type FilterOption = 'all' | 'critical' | 'warning'

export function ContentQuality({ website }: ContentQualityProps) {
  const [posts, setPosts] = useState<PostNeedingImprovement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterOption>('all')

  useEffect(() => {
    loadPosts()
  }, [website])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await wordpressAnalyticsService.getPostsNeedingImprovement(
        website.url,
        50
      )
      setPosts(data)
    } catch (err) {
      console.error('Error loading posts:', err)
      setError('Error al cargar los posts')
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'critical') return post.critical_issues > 0
    if (filter === 'warning') return post.critical_issues === 0 && post.warnings > 0
    return true
  })

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-[#2b2b40] mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-[#f54a00]" />
          Calidad de Contenido
        </h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-[#2b2b40] mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-[#f54a00]" />
          Calidad de Contenido
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#2b2b40] mb-4 flex items-center gap-2">
        <Target className="h-6 w-6 text-[#f54a00]" />
        Calidad de Contenido
      </h2>

      {/* Filter Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Filtrar:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#096] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="h-4 w-4" />
              Todos ({posts.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Críticos ({posts.filter(p => p.critical_issues > 0).length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'warning'
                  ? 'bg-[#f54a00] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="h-4 w-4" />
              Warnings ({posts.filter(p => p.critical_issues === 0 && p.warnings > 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{posts.length}</p>
            <p className="text-xs text-gray-600">Total Posts</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {posts.filter(p => p.critical_issues > 0).length}
            </p>
            <p className="text-xs text-gray-600">Críticos</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-3">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {posts.reduce((sum, p) => sum + p.warnings, 0)}
            </p>
            <p className="text-xs text-gray-600">Warnings</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3">
              <Target className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(posts.reduce((sum, p) => sum + p.priority_score, 0) / posts.length)}
            </p>
            <p className="text-xs text-gray-600">Promedio Priority</p>
          </div>
        </div>
      )}

      {/* Posts Table */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' 
              ? '¡Excelente trabajo!' 
              : filter === 'critical'
              ? 'No hay problemas críticos'
              : 'No hay warnings'
            }
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'No hay problemas urgentes en el contenido'
              : 'Filtra por "Todos" para ver otros posts'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 rounded-t-lg">
            <h3 className="text-lg font-bold text-[#2b2b40]">
              Posts que Necesitan Mejora ({filteredPosts.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Post</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">Scores</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">Issues</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPosts.map((post: PostNeedingImprovement) => (
                  <PostQualityRow key={post.id} post={post} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function PostQualityRow({ post }: { post: PostNeedingImprovement }) {
  const [showRecommendations, setShowRecommendations] = useState(false)

  const getPriorityColor = (score: number) => {
    if (score >= 30) return 'bg-red-600'
    if (score >= 15) return 'bg-[#f54a00]'
    return 'bg-blue-600'
  }

  const getPriorityLabel = (score: number) => {
    if (score >= 30) return 'Urgente'
    if (score >= 15) return 'Alta'
    return 'Media'
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Post (Prioridad + Título) */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div 
              className={`flex-shrink-0 w-10 h-10 rounded-lg ${getPriorityColor(post.priority_score)} flex items-center justify-center text-white shadow-sm`}
              title={getPriorityLabel(post.priority_score)}
            >
              <span className="text-base font-bold">{post.priority_score}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                {post.title}
              </h4>
              <p className="text-xs text-gray-500">{post.word_count} palabras</p>
            </div>
          </div>
        </td>

        {/* Scores Agrupados */}
        <td className="px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className={`text-xl font-bold ${wordpressAnalyticsService.getScoreColor(post.seo_score)}`}>
                {post.seo_score}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">SEO</p>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${wordpressAnalyticsService.getScoreColor(post.readability_score)}`}>
                {post.readability_score}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Legibilidad</p>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${wordpressAnalyticsService.getScoreColor(post.content_quality_score)}`}>
                {post.content_quality_score}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Calidad</p>
            </div>
          </div>
        </td>

        {/* Issues */}
        <td className="px-6 py-4">
          <div className="flex flex-col gap-2 items-center">
            {post.critical_issues > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs w-full justify-center">
                🔴 {post.critical_issues} Crítico{post.critical_issues !== 1 ? 's' : ''}
              </Badge>
            )}
            {post.warnings > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs w-full justify-center">
                🟠 {post.warnings} Warning{post.warnings !== 1 ? 's' : ''}
              </Badge>
            )}
            {post.critical_issues === 0 && post.warnings === 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                ✓ Sin issues
              </Badge>
            )}
          </div>
        </td>

        {/* Acciones */}
        <td className="px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="inline-flex items-center justify-center w-9 h-9 bg-[#096] text-white rounded-lg hover:bg-[#096]/90 transition-colors relative"
              title={showRecommendations ? 'Ocultar recomendaciones' : `Ver ${post.recommendations.length} recomendaciones`}
            >
              {showRecommendations ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {post.recommendations.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {post.recommendations.length}
                    </span>
                  )}
                </>
              )}
            </button>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Ver post"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </td>
      </tr>

      {/* Recommendations Row (Expandable) */}
      {showRecommendations && (
        <tr className="bg-gray-50">
          <td colSpan={4} className="px-6 py-5">
            <div className="max-w-5xl mx-auto">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-[#096]" />
                Recomendaciones para Mejorar
              </h4>
              <div className="space-y-2">
                {post.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-4 ${
                      rec.type === 'critical'
                        ? 'bg-red-50'
                        : rec.type === 'warning'
                        ? 'bg-amber-50'
                        : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Badge
                        className={`${wordpressAnalyticsService.getRecommendationBadgeColor(rec.type)} flex-shrink-0`}
                      >
                        {rec.type === 'critical' ? '🔴' : rec.type === 'warning' ? '🟠' : '🔵'}
                        {' '}{rec.type.toUpperCase()}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 mb-2">
                          {rec.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          {rec.current_value !== undefined && rec.target_value !== undefined && (
                            <div className="inline-flex items-center gap-2 text-xs bg-white rounded-md px-3 py-1.5 border border-gray-200">
                              <span className="text-gray-600">Actual: <span className="font-semibold text-gray-900">{rec.current_value}</span></span>
                              <span className="text-gray-400">→</span>
                              <span className="text-gray-600">Objetivo: <span className="font-semibold text-[#096]">{rec.target_value}</span></span>
                            </div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {rec.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

