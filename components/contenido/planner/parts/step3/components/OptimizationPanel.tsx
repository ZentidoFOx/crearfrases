"use client"

import React from 'react'
import { Wand2, Loader2, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SEOAnalysisResult } from '../hooks/useSEOAnalysis'
import { OptimizationType, OptimizationChange } from '../types'

interface OptimizationPanelProps {
  seoAnalysis: SEOAnalysisResult | null
  isOptimizing: boolean
  optimizationType: OptimizationType
  optimizationStep: string
  optimizationChanges: OptimizationChange[]
  fixingIssue: string | null
  onOptimizeReadability: () => void
  onOptimizeSEO: () => void
  onOptimizeAll: () => void
}

export function OptimizationPanel({
  seoAnalysis,
  isOptimizing,
  optimizationType,
  optimizationStep,
  optimizationChanges,
  fixingIssue,
  onOptimizeReadability,
  onOptimizeSEO,
  onOptimizeAll
}: OptimizationPanelProps) {
  if (!seoAnalysis) return null

  return (
    <div className="bg-white rounded border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="h-10 w-10 rounded bg-purple-600 flex items-center justify-center">
          <Wand2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Auto-Optimización</h3>
          <p className="text-xs text-gray-600">Mejora automática del contenido</p>
        </div>
      </div>

      {/* Optimization Buttons */}
      {!isOptimizing && (
        <div className="space-y-3">
          {/* Readability optimization */}
          {seoAnalysis.readability.score < 70 && (
            <Button
              onClick={onOptimizeReadability}
              disabled={isOptimizing}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              size="sm"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Optimizar Legibilidad ({seoAnalysis.readability.score}/100)
            </Button>
          )}
          
          {/* SEO optimization */}
          {seoAnalysis.score < 70 && (
            <Button
              onClick={onOptimizeSEO}
              disabled={isOptimizing}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              size="sm"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Optimizar SEO ({seoAnalysis.score}/100)
            </Button>
          )}
          
          {/* Optimize all */}
          {(seoAnalysis.readability.score < 70 || seoAnalysis.score < 70) && (
            <Button
              onClick={onOptimizeAll}
              disabled={isOptimizing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              ✨ Auto-Optimizar Todo
            </Button>
          )}

          {/* All optimized message */}
          {seoAnalysis.readability.score >= 70 && seoAnalysis.score >= 70 && (
            <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-900">✅ Contenido totalmente optimizado</p>
              <p className="text-xs text-green-700 mt-1">Tu artículo cumple con todos los estándares SEO</p>
            </div>
          )}
        </div>
      )}
      
      {/* Optimizing indicator with step-by-step progress */}
      {(isOptimizing || fixingIssue) && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border-2 border-purple-300">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-bold text-purple-900">
                {fixingIssue ? '🔧 Corrigiendo problema específico' : 
                 optimizationType === 'readability' ? '📖 Optimizando legibilidad' :
                 optimizationType === 'seo' ? '🎯 Optimizando SEO' :
                 optimizationType === 'all' ? '✨ Optimización paso a paso' : ''}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Los cambios se aplican en tiempo real
              </p>
            </div>
          </div>
          
          {/* Current step indicator */}
          {optimizationStep && (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <div className="flex items-center gap-2">
                {optimizationStep.includes('✅') ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                )}
                <p className="text-xs font-medium text-purple-800">
                  {optimizationStep}
                </p>
              </div>
            </div>
          )}
          
          {/* Real-time changes log */}
          {optimizationChanges.length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Cambios realizados en tiempo real:
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {optimizationChanges.slice(-8).map((change, idx) => (
                  <div 
                    key={`${change.timestamp}-${idx}`}
                    className="text-xs text-purple-700 bg-white/50 rounded px-2 py-1 animate-fade-in"
                    style={{
                      animation: 'fadeIn 0.3s ease-in'
                    }}
                  >
                    {change.change}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
