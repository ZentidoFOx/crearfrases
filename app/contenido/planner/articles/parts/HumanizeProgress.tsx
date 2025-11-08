"use client"

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react'

interface HumanizeProgressProps {
  isOpen: boolean
  currentStep: string
  progress: number
  onClose: () => void
}

export function HumanizeProgress({
  isOpen,
  currentStep,
  progress,
  onClose
}: HumanizeProgressProps) {
  const steps = [
    { id: 'preparing', label: 'Preparando contenido', percent: 10 },
    { id: 'analyzing', label: 'Analizando patrones de IA', percent: 20 },
    { id: 'humanizing', label: 'Humanizando con IA avanzada', percent: 80 },
    { id: 'saving', label: 'Guardando cambios', percent: 95 },
    { id: 'complete', label: 'Completado', percent: 100 }
  ]

  const getStepStatus = (stepPercent: number) => {
    if (progress >= stepPercent) return 'completed'
    if (progress >= stepPercent - 10) return 'in-progress'
    return 'pending'
  }

  return (
    <Dialog open={isOpen} onOpenChange={progress === 100 ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Sparkles className="h-6 w-6 text-orange-600" />
          Humanizando Contenido
        </DialogTitle>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso</span>
              <span className="text-sm font-bold text-orange-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => {
              const status = getStepStatus(step.percent)
              
              return (
                <div key={step.id} className="flex items-center gap-3">
                  {status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  {status === 'in-progress' && (
                    <Loader2 className="h-5 w-5 text-orange-600 flex-shrink-0 animate-spin" />
                  )}
                  {status === 'pending' && (
                    <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  )}
                  
                  <span className={`text-sm ${
                    status === 'completed' ? 'text-gray-900 font-medium' :
                    status === 'in-progress' ? 'text-orange-600 font-semibold' :
                    'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Current Step Info */}
          {currentStep && progress < 100 && (
            <div className="p-4 bg-orange-50 border-l-4 border-orange-600 rounded">
              <p className="text-sm text-orange-900">
                <span className="font-semibold">Estado:</span> {currentStep}
              </p>
            </div>
          )}

          {/* Success Message */}
          {progress === 100 && (
            <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    ¡Contenido humanizado exitosamente!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    El texto ahora suena más natural y humano
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          {progress === 100 && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
