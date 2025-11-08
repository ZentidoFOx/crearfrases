"use client"

import { useEffect, useState } from 'react'
import { Sparkles, Languages, CheckCircle2, X, Upload } from 'lucide-react'

interface CircularProgressProps {
  isActive: boolean
  type: 'humanizing' | 'translating' | 'publishing'
  progress: number
  currentStep?: string
  targetLanguage?: string
}

export function CircularProgress({
  isActive,
  type,
  progress,
  currentStep,
  targetLanguage
}: CircularProgressProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isActive) {
      setVisible(true)
      setDismissed(false)
    } else if (progress === 100) {
      // Ocultar automáticamente después de 3 segundos cuando complete
      const timer = setTimeout(() => {
        setVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isActive, progress])

  const getIcon = () => {
    switch (type) {
      case 'humanizing':
        return <Sparkles className="h-5 w-5" />
      case 'translating':
        return <Languages className="h-5 w-5" />
      case 'publishing':
        return <Upload className="h-5 w-5" />
    }
  }

  const getColor = () => {
    switch (type) {
      case 'humanizing':
        return {
          stroke: '#f97316', // orange-500
          bg: '#fed7aa',     // orange-200
          text: 'text-orange-600'
        }
      case 'translating':
        return {
          stroke: '#3b82f6', // blue-500
          bg: '#bfdbfe',     // blue-200
          text: 'text-blue-600'
        }
      case 'publishing':
        return {
          stroke: '#10b981', // green-500
          bg: '#d1fae5',     // green-200
          text: 'text-green-600'
        }
    }
  }

  const getLabel = () => {
    switch (type) {
      case 'humanizing':
        return 'Humanizando'
      case 'translating':
        return targetLanguage ? `Traduciendo a ${targetLanguage}` : 'Traduciendo'
      case 'publishing':
        return 'Publicando en WordPress'
    }
  }

  const colors = getColor()
  const isComplete = progress >= 100
  
  // Calcular el círculo SVG
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  if (!visible || dismissed) return null

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${
        isActive || progress === 100 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        {/* Botón de cerrar */}
        {progress === 100 && (
          <button
            onClick={() => {
              setDismissed(true)
              setVisible(false)
            }}
            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        )}

        <div className="flex flex-col items-center gap-3">
          {/* Círculo de progreso */}
          <div className="relative" style={{ width: size, height: size }}>
            {/* Círculo de fondo */}
            <svg
              width={size}
              height={size}
              className="transform -rotate-90"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.bg}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Círculo de progreso */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.stroke}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-300 ease-out"
              />
            </svg>

            {/* Icono o porcentaje en el centro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <>
                  <div className={`${colors.text} animate-pulse`}>
                    {getIcon()}
                  </div>
                  <span className={`text-2xl font-bold ${colors.text} mt-1`}>
                    {Math.round(progress)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Texto descriptivo */}
          <div className="text-center max-w-[120px]">
            <p className={`text-sm font-semibold ${colors.text}`}>
              {getLabel()}
            </p>
            {currentStep && !isComplete && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                {currentStep}
              </p>
            )}
            {isComplete && (
              <p className="text-xs text-green-600 font-medium mt-1">
                ¡Completado!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
