'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { wordpressAnalyticsService, type TopPerformingPost } from '@/lib/api/wordpress-analytics'
import { Eye, MessageSquare, TrendingUp, ExternalLink } from 'lucide-react'

interface TopPerformingPostsProps {
  websiteUrl: string
  limit?: number
  orderBy?: 'views' | 'engagement' | 'comments' | 'seo'
}

export function TopPerformingPosts({ 
  websiteUrl, 
  limit = 10,
  orderBy = 'views'
}: TopPerformingPostsProps) {
  const [posts, setPosts] = useState<TopPerformingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState(orderBy)

  useEffect(() => {
    loadPosts()
  }, [websiteUrl, selectedOrder])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await wordpressAnalyticsService.getTopPerforming(
        websiteUrl,
        limit,
        selectedOrder
      )
      setPosts(data)
    } catch (err) {
      console.error('Error loading top posts:', err)
      setError('Error al cargar posts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Posts con Mejor Rendimiento</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Posts con Mejor Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const orderOptions = [
    { value: 'views', label: 'Vistas', icon: Eye },
    { value: 'engagement', label: 'Engagement', icon: TrendingUp },
    { value: 'comments', label: 'Comentarios', icon: MessageSquare },
    { value: 'seo', label: 'SEO Score', icon: null }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>🏆 Posts con Mejor Rendimiento</CardTitle>
            <CardDescription>Top {limit} artículos más exitosos</CardDescription>
          </div>
          <div className="flex gap-2">
            {orderOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedOrder === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedOrder(option.value as any)}
                className="text-xs"
              >
                {option.icon && <option.icon className="h-3 w-3 mr-1" />}
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} rank={index + 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PostCard({ post, rank }: { post: TopPerformingPost; rank: number }) {
  const rankColors = {
    1: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    2: 'bg-gray-100 text-gray-700 border-gray-300',
    3: 'bg-amber-100 text-amber-700 border-amber-300'
  }

  const getRankColor = (rank: number) => {
    if (rank <= 3) return rankColors[rank as keyof typeof rankColors]
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* Rank Badge */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold ${getRankColor(rank)}`}>
        {rank}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2">
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

        {/* Metrics */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="font-semibold">{wordpressAnalyticsService.formatNumber(post.views)}</span>
            <span className="text-xs">vistas</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="font-semibold">{post.comments}</span>
            <span className="text-xs">comentarios</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="font-semibold">{post.engagement_score.toFixed(0)}</span>
            <span className="text-xs">engagement</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {wordpressAnalyticsService.getScoreEmoji(post.seo_score)} SEO: {post.seo_score}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {wordpressAnalyticsService.getScoreEmoji(post.readability_score)} Legibilidad: {post.readability_score}
          </Badge>
          <Badge className={wordpressAnalyticsService.getQualityBadgeColor(post.overall_quality.toLowerCase().replace(' ', '_'))}>
            {post.overall_quality}
          </Badge>
        </div>
      </div>
    </div>
  )
}
