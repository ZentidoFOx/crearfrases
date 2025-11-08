/**
 * Card component for displaying article preview
 * Used in grid/card view
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArticleStatusBadge } from './ArticleStatusBadge'
import type { Article } from '@/lib/api/articles'
import { 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Calendar,
  FileText,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ArticleCardProps {
  article: Article
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  onView?: (id: number) => void
  onSubmit?: (id: number) => void
  showActions?: boolean
}

export function ArticleCard({ 
  article, 
  onEdit, 
  onDelete, 
  onView,
  onSubmit,
  showActions = true 
}: ArticleCardProps) {
  
  // Truncate content for preview
  const getExcerpt = (content: string, maxLength: number = 150): string => {
    const plainText = content
      .replace(/#{1,6}\s/g, '')  // Remove markdown headers
      .replace(/\*\*/g, '')       // Remove bold
      .replace(/\*/g, '')         // Remove italic
      .replace(/\n/g, ' ')        // Replace newlines with space
      .trim()
    
    if (plainText.length <= maxLength) return plainText
    return plainText.substring(0, maxLength) + '...'
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No disponible'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const canSubmit = article.status === 'draft'
  const canDelete = article.status === 'draft'
  const canEdit = article.status !== 'published'

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-2">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span className="font-medium" style={{ color: '#096' }}>{article.keyword}</span>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(article.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </DropdownMenuItem>
                )}
                {onEdit && canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(article.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onSubmit && canSubmit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onSubmit(article.id)}>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar para aprobación
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(article.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-gray-600 line-clamp-3">
          {getExcerpt(article.content)}
        </p>
        
        {article.rejection_reason && article.status === 'rejected' && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs font-medium text-red-700">Motivo del rechazo:</p>
            <p className="text-xs text-red-600 mt-1">{article.rejection_reason}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <ArticleStatusBadge status={article.status} />
          <span className="text-sm font-medium text-gray-700">
            {article.word_count.toLocaleString()} palabras
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500 w-full">
          <Calendar className="h-3 w-3" />
          <span>Actualizado: {formatDate(article.updated_at)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
