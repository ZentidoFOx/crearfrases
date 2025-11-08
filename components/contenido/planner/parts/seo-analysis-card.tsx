"use client"

import { CheckCircle2, AlertCircle, XCircle, BarChart3, BookOpen, Circle, Wand2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import type { SEOAnalysisResult } from './step3/hooks/useSEOAnalysis'

interface SEOAnalysisCardProps {
  analysis: SEOAnalysisResult
  onFixIssue?: (issueId: string, issueType: 'seo' | 'readability') => void
  fixingIssue?: string | null
}

export function SEOAnalysisCard({ analysis, onFixIssue, fixingIssue }: SEOAnalysisCardProps) {
  // Helper to check if issue can be auto-fixed
  const canBeAutoFixed = (issueId: string): boolean => {
    const autoFixableIssues = [
      // SEO fixes
      'keywordDensity',         // Can adjust keyword density
      'keywordInIntroduction',  // Can add keyword to intro
      'keywordInTitle',         // Can suggest title changes
      'keywordInSubheadings',   // Can add keyword to H2/H3 subheadings
      
      // Readability fixes
      'subheadings',            // Can add subheadings (H3)
      'sentenceLength',         // Can split long sentences
      'paragraphLength',        // Can split long paragraphs
    ]
    return autoFixableIssues.includes(issueId)
  }

  const getRatingIcon = (rating: 'good' | 'ok' | 'bad') => {
    switch (rating) {
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'ok':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'bad':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getRatingColor = (rating: 'good' | 'ok' | 'bad') => {
    switch (rating) {
      case 'good':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'ok':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'bad':
        return 'bg-red-50 text-red-700 border-red-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-600'
    if (score >= 50) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  // Count ratings
  const goodCount = analysis.results.filter(r => r.rating === 'good').length
  const okCount = analysis.results.filter(r => r.rating === 'ok').length
  const badCount = analysis.results.filter(r => r.rating === 'bad').length

  const readabilityGood = analysis.readability.results.filter(r => r.rating === 'good').length
  const readabilityOk = analysis.readability.results.filter(r => r.rating === 'ok').length
  const readabilityBad = analysis.readability.results.filter(r => r.rating === 'bad').length

  return (
    <div className="space-y-3">
      {/* SEO Score */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        {/* Score Header - Estilo Yoast */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center gap-4">
            {/* Círculo de puntuación */}
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke={analysis.score >= 70 ? '#16a34a' : analysis.score >= 50 ? '#eab308' : '#dc2626'}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${(analysis.score / 100) * 175.93} 175.93`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
                  {analysis.score}
                </span>
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">Análisis SEO</h3>
              </div>
              <p className="text-[10px] text-gray-600 mb-2">Optimización de contenido</p>
              
              {/* Contador de métricas */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="text-[10px] font-medium text-gray-700">{goodCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                  <span className="text-[10px] font-medium text-gray-700">{okCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  <span className="text-[10px] font-medium text-gray-700">{badCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lista compacta de resultados */}
        <div className="p-3 space-y-1.5 bg-white">
          {analysis.results.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded transition-colors group"
            >
              <div className="flex-shrink-0">
                {result.rating === 'good' ? (
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  </div>
                ) : result.rating === 'ok' ? (
                  <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-700 leading-tight flex-1">{result.text}</p>
              
              {/* Fix button for auto-fixable issues - ALWAYS VISIBLE */}
              {result.rating !== 'good' && canBeAutoFixed(result.id) && onFixIssue && (
                <Button
                  onClick={() => onFixIssue(result.id, 'seo')}
                  disabled={fixingIssue === result.id}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-sm hover:shadow transition-all flex-shrink-0"
                >
                  {fixingIssue === result.id ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Corrigiendo...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3 mr-1" />
                      Corregir
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Readability Score */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        {/* Score Header - Estilo Yoast */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center gap-4">
            {/* Círculo de puntuación */}
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke={analysis.readability.score >= 70 ? '#16a34a' : analysis.readability.score >= 50 ? '#eab308' : '#dc2626'}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${(analysis.readability.score / 100) * 175.93} 175.93`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${getScoreColor(analysis.readability.score)}`}>
                  {analysis.readability.score}
                </span>
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">Legibilidad</h3>
              </div>
              <p className="text-[10px] text-gray-600 mb-2">Facilidad de lectura</p>
              
              {/* Contador de métricas */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  <span className="text-[10px] font-medium text-gray-700">{readabilityGood}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                  <span className="text-[10px] font-medium text-gray-700">{readabilityOk}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  <span className="text-[10px] font-medium text-gray-700">{readabilityBad}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lista compacta de resultados */}
        <div className="p-3 space-y-1.5 bg-white">
          {analysis.readability.results.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded transition-colors group"
            >
              <div className="flex-shrink-0">
                {result.rating === 'good' ? (
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  </div>
                ) : result.rating === 'ok' ? (
                  <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-700 leading-tight flex-1">{result.text}</p>
              
              {/* Fix button for auto-fixable issues - ALWAYS VISIBLE */}
              {result.rating !== 'good' && canBeAutoFixed(result.id) && onFixIssue && (
                <Button
                  onClick={() => onFixIssue(result.id, 'readability')}
                  disabled={fixingIssue === result.id}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 shadow-sm hover:shadow transition-all flex-shrink-0"
                >
                  {fixingIssue === result.id ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Corrigiendo...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3 mr-1" />
                      Corregir
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
