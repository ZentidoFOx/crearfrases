import React from 'react'
import { Article } from '@/lib/api/articles'
import { ArticleStatusBadge } from './ArticleStatusBadge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, MoreVertical, Send, FileText, Calendar } from 'lucide-react'

interface ArticleTableProps {
  articles: Article[]
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  onView?: (id: number) => void
  onSubmit?: (id: number) => void
  loading?: boolean
}

export function ArticleTable({ 
  articles, 
  onEdit, 
  onDelete, 
  onView,
  onSubmit,
  loading = false 
}: ArticleTableProps) {
  
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay artículos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const canSubmit = article.status === 'draft'
        const canDelete = article.status === 'draft'
        const canEdit = article.status !== 'published'

        return (
          <div 
            key={article.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-[#096] transition-all p-4"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="h-10 w-10 rounded-lg bg-[#096] flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="font-semibold text-base text-gray-900 line-clamp-1 mb-1">
                      {article.title}
                    </h3>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span className="font-medium" style={{ color: '#096' }}>
                          {article.keyword}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(article.updated_at)}</span>
                      </div>

                      {article.word_count && (
                        <span>{article.word_count.toLocaleString()} palabras</span>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    <ArticleStatusBadge status={article.status} />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 flex-shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(article.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </DropdownMenuItem>
                        )}
                        {onEdit && canEdit && (
                          <DropdownMenuItem onClick={() => onEdit(article.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onSubmit && canSubmit && (
                          <DropdownMenuItem onClick={() => onSubmit(article.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar a revisión
                          </DropdownMenuItem>
                        )}
                        {onDelete && canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(article.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
