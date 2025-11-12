"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  XCircle, 
  Play, 
  Pause, 
  RotateCw,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { SectionState } from '../hooks/useSectionBySection'

interface SectionProgressProps {
  sections: SectionState[]
  currentSectionIndex: number
  isGenerating: boolean
  isPaused: boolean
  progress: { current: number; total: number }
  error?: string
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  onRegenerateSection: (index: number) => void
  onBack?: () => void
}

export function SectionProgress({
  sections,
  currentSectionIndex,
  isGenerating,
  isPaused,
  progress,
  error,
  onPause,
  onResume,
  onCancel,
  onRegenerateSection,
  onBack
}: SectionProgressProps) {
  const getStatusIcon = (status: SectionState['status'], index: number) => {
    if (status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
    if (status === 'generating') {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
    }
    if (status === 'error') {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
    return <Circle className="h-5 w-5 text-gray-300" />
  }

  const getStatusBadge = (status: SectionState['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completada</Badge>
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Generando...</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="text-lg">Progreso de Generación</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {progress.current} de {progress.total}
            </span>
            <Badge variant="outline" className="text-sm">
              {progressPercentage}%
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isPaused && isGenerating && (
            <Button 
              onClick={onPause} 
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}
          
          {isPaused && (
            <Button 
              onClick={onResume} 
              size="sm"
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Reanudar
            </Button>
          )}
          
          {(isGenerating || isPaused) && (
            <Button 
              onClick={onCancel} 
              variant="destructive" 
              size="sm"
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
        </div>

        {/* Sections List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${section.status === 'generating' ? 'border-blue-400 bg-blue-50' : ''}
                ${section.status === 'completed' ? 'border-green-200 bg-green-50' : ''}
                ${section.status === 'error' ? 'border-red-200 bg-red-50' : ''}
                ${section.status === 'pending' ? 'border-gray-200 bg-gray-50' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(section.status, index)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {section.order + 1}. {section.title}
                    </h4>
                    {getStatusBadge(section.status)}
                  </div>

                  {/* Section Type */}
                  <p className="text-xs text-gray-500 mb-2">
                    Tipo: {section.type === 'intro' ? 'Introducción' : section.type === 'conclusion' ? 'Conclusión' : 'Sección'}
                  </p>

                  {/* Preview Content */}
                  {section.content && section.status === 'completed' && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {section.content.substring(0, 150)}...
                    </p>
                  )}

                  {/* Error Message */}
                  {section.error && (
                    <p className="text-xs text-red-600 mb-2">
                      {section.error}
                    </p>
                  )}

                  {/* Regenerate Button */}
                  {section.status === 'error' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onRegenerateSection(index)}
                    >
                      <RotateCw className="h-3 w-3 mr-1" />
                      Reintentar
                    </Button>
                  )}

                  {/* Character Count */}
                  {section.content && (
                    <p className="text-xs text-gray-400 mt-1">
                      {section.content.length} caracteres
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        {sections.length > 0 && (
          <div className="grid grid-cols-4 gap-2 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sections.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-500">Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sections.filter(s => s.status === 'generating').length}
              </div>
              <div className="text-xs text-gray-500">Generando</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {sections.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-500">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {sections.filter(s => s.status === 'error').length}
              </div>
              <div className="text-xs text-gray-500">Errores</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
