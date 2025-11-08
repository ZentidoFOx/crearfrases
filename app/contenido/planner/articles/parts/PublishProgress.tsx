"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Check, Loader2, Send, Tag, Image, FileText, Globe } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface PublishStep {
  id: string
  label: string
  icon: React.ReactNode
  status: 'pending' | 'loading' | 'completed' | 'error'
}

interface PublishProgressProps {
  isOpen: boolean
  currentStep: string
  progress: number
  postUrl?: string
  postId?: number
  onClose?: () => void
}

export function PublishProgress({
  isOpen,
  currentStep,
  progress,
  postUrl,
  postId,
  onClose
}: PublishProgressProps) {
  const [steps, setSteps] = useState<PublishStep[]>([
    { id: 'preparing', label: 'Preparando contenido', icon: <FileText className="h-5 w-5" />, status: 'pending' },
    { id: 'categories', label: 'Procesando categorías', icon: <Tag className="h-5 w-5" />, status: 'pending' },
    { id: 'tags', label: 'Procesando etiquetas', icon: <Tag className="h-5 w-5" />, status: 'pending' },
    { id: 'image', label: 'Configurando imagen', icon: <Image className="h-5 w-5" />, status: 'pending' },
    { id: 'publishing', label: 'Publicando todos los idiomas', icon: <Send className="h-5 w-5" />, status: 'pending' },
    { id: 'completed', label: 'Publicación completada', icon: <Check className="h-5 w-5" />, status: 'pending' },
  ])

  useEffect(() => {
    setSteps(prevSteps =>
      prevSteps.map(step => {
        // Si el currentStep contiene "publishing-XX" (idioma), marcar paso publishing como loading
        const isPublishingLanguage = currentStep.startsWith('publishing-')
        const matchingStep = isPublishingLanguage && step.id === 'publishing' ? 'publishing' : currentStep
        
        if (step.id === matchingStep || (isPublishingLanguage && step.id === 'publishing')) {
          return { ...step, status: 'loading' as const }
        }
        const currentIndex = prevSteps.findIndex(s => s.id === currentStep || s.id === 'publishing')
        const stepIndex = prevSteps.findIndex(s => s.id === step.id)
        if (stepIndex < currentIndex) {
          return { ...step, status: 'completed' as const }
        }
        return step
      })
    )
  }, [currentStep])

  const getStepColor = (status: PublishStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'loading':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-400 bg-gray-50 border-gray-200'
    }
  }

  const getProgressColor = () => {
    if (progress === 100) return 'from-green-500 to-emerald-500'
    if (progress > 0) return 'from-blue-500 to-indigo-500'
    return 'from-gray-300 to-gray-400'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <VisuallyHidden>
          <DialogTitle>
            {progress === 100 ? 'Publicación Completada' : 'Publicando en WordPress'}
          </DialogTitle>
        </VisuallyHidden>
        <div className="py-4">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              {progress === 100 ? (
                <Check className="h-6 w-6 text-white" />
              ) : (
                <Send className="h-6 w-6 text-white" />
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {progress === 100 ? '¡Publicación Completada!' : 'Publicando en WordPress'}
            </h2>
            <p className="text-xs text-gray-500">
              {progress === 100 
                ? 'Todos los idiomas publicados exitosamente' 
                : currentStep.startsWith('publishing-')
                ? `Publicando en ${currentStep.replace('publishing-', '').toUpperCase()}...`
                : 'Por favor espera mientras se publica tu contenido'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-700">Progreso</span>
              <span className="text-lg font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out rounded-full shadow-sm`}
                style={{ width: `${progress}%` }}
              >
                <div className="h-full w-full bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Steps List - Compacto */}
          <div className="space-y-1.5">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${getStepColor(step.status)}`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : step.status === 'loading' ? (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'loading' ? 'text-blue-700' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Success Info */}
          {progress === 100 && postId && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg space-y-1">
              <p className="text-xs text-green-800 font-semibold">✓ Publicado exitosamente</p>
              <p className="text-xs text-green-700">ID: {postId}</p>
              {postUrl && (
                <a 
                  href={postUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline inline-block mt-1"
                >
                  Ver en WordPress →
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
