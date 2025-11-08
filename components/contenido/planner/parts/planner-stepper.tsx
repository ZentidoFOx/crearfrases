"use client"

import { Check, Search, FileText, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PlannerStepperProps {
  currentStep: number
}

const steps = [
  {
    number: 1,
    title: 'Palabra Clave',
    description: 'Busca o crea contenido nuevo',
    icon: Search
  },
  {
    number: 2,
    title: 'Títulos SEO',
    description: 'IA genera títulos optimizados',
    icon: FileText
  },
  {
    number: 3,
    title: 'Contenido IA',
    description: 'Artículo completo y optimizado',
    icon: Sparkles
  }
]

export function PlannerStepper({ currentStep }: PlannerStepperProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number
          const Icon = step.icon

          return (
            <>
              {/* Step Card */}
              <div 
                className={`flex-1 flex items-center gap-3 p-4 rounded-lg border transition-all hover:shadow-md ${
                  isCurrent 
                    ? 'bg-white border-orange-300'
                    : isCompleted
                    ? 'bg-white border-emerald-300'
                    : 'bg-white border-gray-200 hover:border-gray-400'
                }`}
              >
                {/* Circle */}
                <div 
                  className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCurrent 
                      ? 'bg-orange-500'
                      : isCompleted 
                      ? 'bg-emerald-500'
                      : 'bg-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <Icon 
                      className="h-5 w-5" 
                      style={{ color: isCurrent ? '#ffffff' : '#6b7280' }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2b2b40]">
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* Number Badge */}
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCurrent 
                      ? 'bg-orange-500 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-[#2b2b40]'
                  }`}
                >
                  <span className="text-sm font-bold">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Arrow - Perfectly Centered */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center px-1.5 self-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: isCompleted ? '#10b981' : '#d1d5db' }}>
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </>
          )
        })}
      </div>
    </div>
  )
}
