import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AutoSaveIndicatorProps {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
  className?: string
}

export function AutoSaveIndicator({ 
  isSaving, 
  lastSaved, 
  hasUnsavedChanges, 
  error,
  className = ""
}: AutoSaveIndicatorProps) {
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 60) {
      return `hace ${diffSeconds}s`
    } else if (diffMinutes < 60) {
      return `hace ${diffMinutes}m`
    } else {
      return formatTime(date)
    }
  }

  if (error) {
    return (
      <Badge variant="destructive" className={`flex items-center gap-1 ${className}`}>
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Error al guardar</span>
      </Badge>
    )
  }

  if (isSaving) {
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Guardando...</span>
      </Badge>
    )
  }

  if (hasUnsavedChanges) {
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
        <Clock className="h-3 w-3 text-orange-500" />
        <span className="text-xs text-orange-600">Cambios sin guardar</span>
      </Badge>
    )
  }

  if (lastSaved) {
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span className="text-xs text-green-600">
          Guardado {getRelativeTime(lastSaved)}
        </span>
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      <Clock className="h-3 w-3 text-gray-400" />
      <span className="text-xs text-gray-500">Sin guardar</span>
    </Badge>
  )
}
