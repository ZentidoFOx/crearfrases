"use client"

import { Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PlannerHeaderProps {
  onReset?: () => void
  currentStep?: number
}

export function PlannerHeader({ onReset, currentStep = 1 }: PlannerHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {/* Icon with solid background - matching mis-dominios style */}
        <div className="h-16 w-16 rounded-xl bg-[#2b2b40] flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#2b2b40]">Content Planner IA</h1>
          <p className="text-base text-gray-600 mt-1">
            Crea contenido optimizado SEO en 3 simples pasos con Gemini AI
          </p>
        </div>
      </div>
      {currentStep > 1 && onReset && (
        <Button
          onClick={onReset}
          size="lg"
          className="bg-[#2b2b40] hover:bg-[#2b2b40]/90 text-white"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Comenzar de Nuevo
        </Button>
      )}
    </div>
  )
}
