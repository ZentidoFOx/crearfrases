"use client"

import { Loader2, Sparkles, Languages, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StreamingProgressBarProps {
  isActive: boolean
  type: 'humanizing' | 'translating' | 'regenerating'
  progress: number
  currentStep?: string
  targetLanguage?: string
}

export function StreamingProgressBar({
  isActive,
  type,
  progress,
  currentStep,
  targetLanguage
}: StreamingProgressBarProps) {
  const getIcon = () => {
    switch (type) {
      case 'humanizing':
        return <Sparkles className="h-4 w-4" />
      case 'translating':
        return <Languages className="h-4 w-4" />
      case 'regenerating':
        return <RefreshCw className="h-4 w-4" />
    }
  }

  const getColor = () => {
    switch (type) {
      case 'humanizing':
        return 'bg-gradient-to-r from-orange-500 to-orange-600'
      case 'translating':
        return 'bg-gradient-to-r from-blue-500 to-blue-600'
      case 'regenerating':
        return 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  }

  const getLabel = () => {
    switch (type) {
      case 'humanizing':
        return 'Humanizando contenido'
      case 'translating':
        return `Traduciendo${targetLanguage ? ` a ${targetLanguage}` : ''}`
      case 'regenerating':
        return 'Regenerando contenido'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'humanizing':
        return 'text-orange-700'
      case 'translating':
        return 'text-blue-700'
      case 'regenerating':
        return 'text-purple-700'
    }
  }

  const isComplete = progress >= 100
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isActive) {
      setVisible(true)
    } else {
      // Pequeño delay antes de ocultar para que se vea la animación completa
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isActive])

  if (!visible) return null

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-lg transition-all duration-500 ${
        isActive ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={{ 
        transform: isActive ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Icono animado */}
          <div className={`flex-shrink-0 ${getTextColor()}`}>
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <div className="animate-spin">
                {getIcon()}
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getTextColor()}`}>
                  {getLabel()}
                </span>
                {currentStep && !isComplete && (
                  <span className="text-xs text-gray-500">
                    • {currentStep}
                  </span>
                )}
              </div>
              <span className={`text-xs font-bold ${getTextColor()}`}>
                {progress}%
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${getColor()} transition-all duration-300 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Spinner adicional cuando está activo */}
          {!isComplete && (
            <Loader2 className={`h-4 w-4 animate-spin ${getTextColor()}`} />
          )}
        </div>

        {/* Mensaje de éxito */}
        {isComplete && (
          <div className="mt-2 flex items-center gap-2 text-xs text-green-700 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ¡Completado! Contenido actualizado en el editor
          </div>
        )}
      </div>
    </div>
  )
}
