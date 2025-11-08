/**
 * Badge component for article status
 * Shows colored badge based on article status
 */

import { Badge } from '@/components/ui/badge'
import type { ArticleStatus } from '@/lib/api/articles'
import { 
  FileEdit, 
  Clock, 
  CheckCircle, 
  XCircle 
} from 'lucide-react'

interface ArticleStatusBadgeProps {
  status: ArticleStatus
  className?: string
}

export function ArticleStatusBadge({ status, className = '' }: ArticleStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return {
          label: 'Borrador',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: FileEdit
        }
      case 'pending':
        return {
          label: 'Pendiente',
          variant: 'default' as const,
          className: 'bg-orange-100 text-orange-700 border-orange-300',
          icon: Clock
        }
      case 'published':
        return {
          label: 'Publicado',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-700 border-green-300',
          icon: CheckCircle
        }
      case 'rejected':
        return {
          label: 'Rechazado',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-700 border-red-300',
          icon: XCircle
        }
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          className: '',
          icon: FileEdit
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1 font-medium`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
