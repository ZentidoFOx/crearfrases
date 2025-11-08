'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { wordpressAnalyticsService, type PostNeedingImprovement } from '@/lib/api/wordpress-analytics'
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, FileText } from 'lucide-react'

interface PostsNeedingImprovementProps {
  websiteUrl: string
  limit?: number
}

export function PostsNeedingImprovement({ 
  websiteUrl, 
  limit = 20
}: PostsNeedingImprovementProps) {
  const [posts, setPosts] = useState<PostNeedingImprovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
  }, [websiteUrl])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await wordpressAnalyticsService.getPostsNeedingImprovement(websiteUrl, limit)
      setPosts(data)
    } catch (err) {
      console.error('Error loading posts needing improvement:', err)
      setError('Error al cargar posts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Posts que Necesitan Mejora</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Posts que Necesitan Mejora</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Posts que Necesitan Mejora</CardTitle>
          <CardDescription>Artículos priorizados por urgencia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-lg font-semibold text-gray-900">¡Excelente trabajo!</p>
            <p className="text-sm text-gray-600">No hay problemas urgentes en el contenido</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚠️ Posts que Necesitan Mejora</CardTitle>
        <CardDescription>
          {posts.length} artículo{posts.length !== 1 ? 's' : ''} requiere{posts.length === 1 ? '' : 'n'} atención
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {posts.map((post) => (
            <PostNeedingImprovementCard key={post.id} post={post} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PostNeedingImprovementCard({ post }: { post: PostNeedingImprovement }) {
  const [isOpen, setIsOpen] = useState(false)

  const getPriorityColor = (score: number) => {
    if (score >= 30) return 'bg-red-100 text-red-700 border-red-300'
    if (score >= 15) return 'bg-amber-100 text-amber-700 border-amber-300'
    return 'bg-blue-100 text-blue-700 border-blue-300'
  }

  const getPriorityLabel = (score: number) => {
    if (score >= 30) return 'Urgente'
    if (score >= 15) return 'Alta'
    return 'Media'
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
        {/* Header */}
        <div className="p-4 bg-white">
          <div className="flex items-start gap-3">
            {/* Priority Badge */}
            <div className={`flex-shrink-0 px-3 py-1 rounded-full border-2 text-xs font-bold ${getPriorityColor(post.priority_score)}`}>
              {getPriorityLabel(post.priority_score)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 line-clamp-2">
                  {post.title}
                </h4>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Issues Summary */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {post.critical_issues > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    🔴 {post.critical_issues} Crítico{post.critical_issues !== 1 ? 's' : ''}
                  </Badge>
                )}
                {post.warnings > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                    🟠 {post.warnings} Warning{post.warnings !== 1 ? 's' : ''}
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {post.word_count} palabras
                </span>
              </div>

              {/* Scores */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">SEO:</span>
                  <span className={`font-semibold ${wordpressAnalyticsService.getScoreColor(post.seo_score)}`}>
                    {wordpressAnalyticsService.getScoreEmoji(post.seo_score)} {post.seo_score}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Legibilidad:</span>
                  <span className={`font-semibold ${wordpressAnalyticsService.getScoreColor(post.readability_score)}`}>
                    {wordpressAnalyticsService.getScoreEmoji(post.readability_score)} {post.readability_score}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Calidad:</span>
                  <span className={`font-semibold ${wordpressAnalyticsService.getScoreColor(post.content_quality_score)}`}>
                    {post.content_quality_score}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle Button */}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Recommendations (Collapsible) */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recomendaciones ({post.recommendations.length})
            </h5>
            <div className="space-y-2">
              {post.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    rec.type === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : rec.type === 'warning'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      className={`flex-shrink-0 ${wordpressAnalyticsService.getRecommendationBadgeColor(rec.type)}`}
                    >
                      {rec.type === 'critical' ? '🔴' : rec.type === 'warning' ? '🟠' : '🔵'}
                      {' '}{rec.type.toUpperCase()}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{rec.message}</p>
                      {rec.current_value !== undefined && rec.target_value !== undefined && (
                        <p className="text-xs text-gray-600 mt-1">
                          Actual: <strong>{rec.current_value}</strong> → Objetivo: <strong>{rec.target_value}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
