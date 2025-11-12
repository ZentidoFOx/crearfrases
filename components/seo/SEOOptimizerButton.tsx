"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { seoOptimizerService, type SEOOptimizationRequest, type SEOOptimizationResult } from '@/lib/api/seo-optimizer'

interface SEOOptimizerButtonProps {
  content: string
  keyword: string
  title: string
  metaDescription?: string
  language?: string
  modelId?: number
  onOptimized: (optimizedContent: string) => void
  disabled?: boolean
}

export function SEOOptimizerButton({
  content,
  keyword,
  title,
  metaDescription,
  language = 'es',
  modelId,
  onOptimized,
  disabled = false
}: SEOOptimizerButtonProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [lastResult, setLastResult] = useState<SEOOptimizationResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleOptimize = async () => {
    if (!content || !keyword || !title) {
      alert('❌ Faltan datos: contenido, keyword o título')
      return
    }

    if (!confirm('🎯 ¿Optimizar este artículo con SEO Optimizer?\n\nSe enviará TODO el contenido a la IA para optimización completa de SEO y legibilidad.')) {
      return
    }

    setIsOptimizing(true)
    setShowResults(false)

    try {
      console.log('🎯 [SEO-OPTIMIZER-BUTTON] Iniciando optimización...')
      
      const request: SEOOptimizationRequest = {
        content,
        keyword,
        title,
        metaDescription,
        language
      }

      const result = await seoOptimizerService.optimizeArticle(request, modelId)
      
      console.log('📊 [SEO-OPTIMIZER-BUTTON] Resultado:', result)
      
      setLastResult(result)
      setShowResults(true)

      if (result.success) {
        // Aplicar contenido optimizado
        onOptimized(result.optimizedContent)
        
        // Mostrar mensaje de éxito
        alert(`✅ ${result.message}`)
      } else {
        // Mostrar error
        alert(`❌ ${result.message}`)
      }

    } catch (error) {
      console.error('❌ [SEO-OPTIMIZER-BUTTON] Error:', error)
      alert(`❌ Error en SEO Optimizer: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Botón Principal */}
      <Button
        onClick={handleOptimize}
        disabled={disabled || isOptimizing || !content || !keyword}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200"
      >
        {isOptimizing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Optimizando SEO...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            SEO Optimizer
          </>
        )}
      </Button>

      {/* Indicador de Estado */}
      {isOptimizing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">
              Enviando artículo completo a la IA para optimización SEO...
            </span>
          </div>
        </div>
      )}

      {/* Resultados de la Optimización */}
      {showResults && lastResult && (
        <div className={`border rounded-lg p-4 ${
          lastResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {lastResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            
            <div className="flex-1 space-y-3">
              <p className={`text-sm font-medium ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.message}
              </p>

              {lastResult.success && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Estadísticas Antes */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
                      📊 ANTES
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div>Palabras: {lastResult.beforeStats.wordCount}</div>
                      <div>Transiciones: {lastResult.beforeStats.transitionWords}</div>
                      <div>Oraciones largas: {lastResult.beforeStats.longSentences}</div>
                      <div>Keywords en negrita: {lastResult.beforeStats.boldKeywords}</div>
                    </div>
                  </div>

                  {/* Estadísticas Después */}
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <h4 className="text-xs font-semibold text-green-600 mb-2 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      DESPUÉS
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div>Palabras: {lastResult.afterStats.wordCount}</div>
                      <div className="text-green-600 font-medium">
                        Transiciones: {lastResult.afterStats.transitionWords}
                        {lastResult.improvements.transitionWordsAdded > 0 && (
                          <span className="ml-1">
                            (+{lastResult.improvements.transitionWordsAdded})
                          </span>
                        )}
                      </div>
                      <div className="text-green-600 font-medium">
                        Oraciones largas: {lastResult.afterStats.longSentences}
                        {lastResult.improvements.sentencesShortened > 0 && (
                          <span className="ml-1">
                            (-{lastResult.improvements.sentencesShortened})
                          </span>
                        )}
                      </div>
                      <div className="text-green-600 font-medium">
                        Keywords en negrita: {lastResult.afterStats.boldKeywords}
                        {lastResult.improvements.keywordsBolded > 0 && (
                          <span className="ml-1">
                            (+{lastResult.improvements.keywordsBolded})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Badges de Mejoras */}
              {lastResult.success && (
                <div className="flex flex-wrap gap-2">
                  {lastResult.improvements.transitionWordsAdded > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      +{lastResult.improvements.transitionWordsAdded} transiciones
                    </Badge>
                  )}
                  {lastResult.improvements.sentencesShortened > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      -{lastResult.improvements.sentencesShortened} oraciones largas
                    </Badge>
                  )}
                  {lastResult.improvements.keywordsBolded > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      +{lastResult.improvements.keywordsBolded} keywords en negrita
                    </Badge>
                  )}
                  {lastResult.improvements.seoIssuesFixed > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {lastResult.improvements.seoIssuesFixed} problemas SEO solucionados
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Información del Sistema */}
      <div className="text-xs text-gray-500 text-center">
        🎯 SEO Optimizer envía todo el artículo a la IA para optimización completa
      </div>
    </div>
  )
}
