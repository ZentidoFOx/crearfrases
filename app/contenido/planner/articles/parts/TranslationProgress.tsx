"use client"

import { useEffect } from 'react'
import { X, Loader2, CheckCircle2, Languages, FileText, Sparkles, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TranslationProgressProps {
  isOpen: boolean
  currentStep: string
  progress: number
  targetLanguage?: string
  onClose: () => void
}

export function TranslationProgress({
  isOpen,
  currentStep,
  progress,
  targetLanguage,
  onClose
}: TranslationProgressProps) {
  useEffect(() => {
    if (isOpen && progress === 100) {
      const timer = setTimeout(() => {
        onClose()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [progress, isOpen, onClose])

  if (!isOpen) return null

  const getStepInfo = (step: string) => {
    switch (step) {
      case 'preparing':
        return {
          icon: FileText,
          text: 'Preparando contenido para traducción...',
          color: 'text-blue-600'
        }
      case 'translating-metadata':
        return {
          icon: Globe,
          text: 'Traduciendo títulos y metadatos SEO...',
          color: 'text-purple-600'
        }
      case 'translating-content':
        return {
          icon: Sparkles,
          text: 'Traduciendo contenido completo con IA...',
          color: 'text-indigo-600'
        }
      case 'saving':
        return {
          icon: Languages,
          text: 'Guardando traducción...',
          color: 'text-green-600'
        }
      case 'completed':
        return {
          icon: CheckCircle2,
          text: `¡Traducción a ${targetLanguage} completada!`,
          color: 'text-green-600'
        }
      default:
        return {
          icon: Loader2,
          text: 'Procesando...',
          color: 'text-gray-600'
        }
    }
  }

  const stepInfo = getStepInfo(currentStep)
  const StepIcon = stepInfo.icon
  const isCompleted = progress === 100

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 relative" style={{ backgroundColor: 'rgba(152, 16, 250, 0.03)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(152, 16, 250, 0.1)' }}>
              <Languages className="h-5 w-5" style={{ color: '#9810fa' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#000000' }}>Traduciendo Artículo</h2>
              <p className="text-xs text-gray-600">
                {targetLanguage ? `Idioma: ${targetLanguage.toUpperCase()}` : 'Procesando...'}
              </p>
            </div>
          </div>
          {isCompleted && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Progreso</span>
              <span className="text-sm font-bold" style={{ color: '#9810fa' }}>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%`, backgroundColor: '#9810fa' }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(152, 16, 250, 0.03)', borderColor: 'rgba(152, 16, 250, 0.2)' }}>
              <div>
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" style={{ color: '#009689' }} />
                ) : (
                  <StepIcon className="h-5 w-5" style={{ color: '#9810fa' }} />
                )}
              </div>
              <p className="text-sm font-medium text-gray-700 flex-1">
                {stepInfo.text}
              </p>
              {!isCompleted && (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#9810fa' }} />
              )}
            </div>

            {/* Steps Checklist */}
            <div className="space-y-2">
              <StepItem
                label="Preparación"
                completed={progress > 20}
                active={progress <= 20}
              />
              <StepItem
                label="Traducción de metadatos"
                completed={progress > 50}
                active={progress > 20 && progress <= 50}
              />
              <StepItem
                label="Traducción de contenido"
                completed={progress > 80}
                active={progress > 50 && progress <= 80}
              />
              <StepItem
                label="Guardando"
                completed={progress === 100}
                active={progress > 80 && progress < 100}
              />
            </div>
          </div>

          {/* Success Message */}
          {isCompleted && (
            <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(0, 150, 137, 0.05)', borderColor: 'rgba(0, 150, 137, 0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4" style={{ color: '#009689' }} />
                <span className="font-semibold text-sm" style={{ color: '#009689' }}>¡Traducción exitosa!</span>
              </div>
              <p className="text-xs text-gray-600">
                Usa el selector de idiomas para ver la traducción.
              </p>
            </div>
          )}

          {/* Close Button */}
          {isCompleted && (
            <Button
              onClick={onClose}
              className="w-full mt-3 text-white transition-colors"
              style={{ backgroundColor: '#9810fa' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8a0ee0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9810fa'}
            >
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepItem({ label, completed, active }: { label: string; completed: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div 
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
        style={{
          backgroundColor: completed ? '#009689' : active ? 'rgba(152, 16, 250, 0.1)' : '#ffffff',
          borderColor: completed ? '#009689' : active ? '#9810fa' : '#d1d5db'
        }}
      >
        {completed && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
        {active && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#9810fa' }} />}
      </div>
      <span 
        className="text-xs"
        style={{
          color: completed ? '#009689' : active ? '#9810fa' : '#9ca3af',
          fontWeight: completed || active ? 500 : 400
        }}
      >
        {label}
      </span>
    </div>
  )
}
