/**
 * Recent Articles List Component
 * Shows the latest articles with quick actions
 */

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArticleStatusBadge } from '@/components/articles/ArticleStatusBadge'
import type { Article } from '@/lib/api/articles'
import { 
  FileText, 
  ArrowRight,
  Calendar,
  Edit,
  Eye
} from 'lucide-react'

interface RecentArticlesListProps {
  articles: Article[]
  onEdit?: (id: number) => void
  onView?: (id: number) => void
}

export function RecentArticlesList({ articles, onEdit, onView }: RecentArticlesListProps) {
  if (articles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Últimos Artículos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No hay artículos recientes</p>
            <Link href="/contenido/planner">
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                Crear primer artículo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Fecha no disponible'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Últimos Artículos
        </CardTitle>
        <Link href="/contenido">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">
                  {article.title}
                </h4>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium text-purple-600">
                    {article.keyword}
                  </span>
                  <span>•</span>
                  <span>{article.word_count.toLocaleString()} palabras</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <ArticleStatusBadge status={article.status} />
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(article.updated_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(article.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onEdit && article.status !== 'published' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(article.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
