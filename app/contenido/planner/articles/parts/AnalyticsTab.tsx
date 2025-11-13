"use client"

import { Badge } from '@/components/ui/badge'
import {
  Target,
  TrendingUp,
  BookOpen,
  BarChart3,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Hash,
  Link2,
  FileText,
  Key
} from 'lucide-react'
import { useMemo } from 'react'
// @ts-ignore
import * as readability from 'readability-scores'
// @ts-ignore
import nlp from 'compromise'
import { SEOAnalyzer } from '@/components/contenido/planner/parts/seo-analyzer'
import { validateYoastSEO, TRANSITION_WORDS } from '@/lib/utils/yoast-seo-optimizer'

interface AnalyticsTabProps {
  article: any
  editedContent: string
  onContentUpdate?: (newContent: string) => void
}

export function AnalyticsTab({
  article,
  editedContent,
  onContentUpdate
}: AnalyticsTabProps) {
  if (!editedContent) {
    return (
      <div className="p-8 text-center text-gray-500">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No hay contenido</p>
        <p className="text-sm mt-2">El contenido está vacío</p>
      </div>
    )
  }

  // Limpiar contenido para análisis
  const cleanText = useMemo(() => {
    return editedContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\*\*|\*|__|_|`|~/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }, [editedContent])

  // Calcular SEO Score con análisis real
  const seoScore = useMemo(() => {
    const lowerContent = editedContent.toLowerCase()
    const lowerKeyword = article?.keyword?.toLowerCase() || ''
    const lowerTitle = article?.title?.toLowerCase() || ''
    
    let score = 0
    let maxScore = 0
    
    // Keyword en título (30 puntos)
    maxScore += 30
    if (lowerKeyword && lowerTitle.includes(lowerKeyword)) {
      score += 30
    }
    
    // Keyword en contenido (25 puntos)
    maxScore += 25
    if (lowerKeyword && lowerContent.includes(lowerKeyword)) {
      const occurrences = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length
      if (occurrences >= 3) score += 25
      else if (occurrences >= 1) score += 15
    }
    
    // Longitud del contenido (20 puntos)
    maxScore += 20
    const wordCount = editedContent.split(/\s+/).length
    if (wordCount >= 1500 && wordCount <= 2500) score += 20
    else if (wordCount >= 800) score += 12
    else if (wordCount >= 300) score += 5
    
    // Subtítulos H2 (15 puntos)
    maxScore += 15
    const h2Count = (editedContent.match(/<h2[^>]*>/gi) || editedContent.match(/^## /gm) || []).length
    if (h2Count >= 5) score += 15
    else if (h2Count >= 3) score += 10
    else if (h2Count >= 1) score += 5
    
    // Enlaces (10 puntos)
    maxScore += 10
    const linkCount = (editedContent.match(/\[.*?\]\(.*?\)/g) || editedContent.match(/<a[^>]*>/gi) || []).length
    if (linkCount >= 5) score += 10
    else if (linkCount >= 2) score += 5
    
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  }, [editedContent, article])

  const readabilityScore = useMemo(() => {
    if (!cleanText || cleanText.length < 100) return 0
    
    try {
      // Usar NLP para análisis avanzado
      const doc = nlp(cleanText)
      const sentences = doc.sentences().out('array')
      const words = doc.terms().out('array')
      
      if (sentences.length === 0 || words.length === 0) return 0
      
      // Usar readability-scores (usa el texto directamente)
      const stats = readability(cleanText)
      
      // Obtener Flesch Reading Ease (0-100, más alto = más fácil)
      // @ts-ignore - la librería no tiene tipos correctos
      const fleschScore = stats.fleschKincaidReadingEase || stats.flesch || 50
      
      console.log('📊 Readability Stats:', stats)
      console.log('📊 Flesch Score:', fleschScore)
      
      // Normalizar Flesch (0-100) a nuestro sistema
      // Flesch: 90-100 = muy fácil, 60-70 = estándar, <30 = muy difícil
      // Para español, ajustamos: >70 = excelente, 50-70 = bueno, <50 = difícil
      let score = 0
      
      if (fleschScore >= 70) score = 100
      else if (fleschScore >= 60) score = 85
      else if (fleschScore >= 50) score = 70
      else if (fleschScore >= 40) score = 55
      else if (fleschScore >= 30) score = 40
      else score = 30
      
      // Ajustes por estructura (bonus/penalty)
      const paragraphs = editedContent.split(/\n\n+/).filter((p: string) => p.trim().length > 0)
      const headingCount = (editedContent.match(/<h[23][^>]*>/gi) || editedContent.match(/^#{2,3} /gm) || []).length
      
      // Bonus por buena estructura
      if (paragraphs.length >= 5 && headingCount >= 3) {
        score = Math.min(score + 10, 100)
      } else if (paragraphs.length < 3 || headingCount < 2) {
        score = Math.max(score - 10, 0)
      }
      
      return Math.round(score)
    } catch (error) {
      console.error('Error calculando readability:', error)
      return 50
    }
  }, [editedContent, cleanText])

  // Validación de Yoast SEO
  const yoastValidation = useMemo(() => {
    if (!editedContent || !article?.keyword) {
      return {
        hasTransitionWords: false,
        sentenceLengthOk: true,
        longSentencesPercentage: 0,
        transitionWordsCount: 0,
        boldKeywordsCount: 0,
        issues: [],
        suggestions: []
      }
    }
    
    const currentLanguage = article?.language || 'es'
    console.log('🌍 [ANALYTICS] Validando Yoast SEO en idioma:', currentLanguage)
    return validateYoastSEO(editedContent, article.keyword, currentLanguage)
  }, [editedContent, article?.keyword, article?.language])

  // Calcular Issues/Sugerencias (incluyendo Yoast SEO)
  const issues = useMemo(() => {
    const problems: Array<{type: 'error' | 'warning' | 'success', text: string}> = []
    
    const lowerContent = editedContent.toLowerCase()
    const lowerKeyword = article?.keyword?.toLowerCase() || ''
    const lowerTitle = article?.title?.toLowerCase() || ''
    const wordCount = editedContent.split(/\s+/).length
    const h2Count = (editedContent.match(/<h2[^>]*>/gi) || editedContent.match(/^## /gm) || []).length
    const linkCount = (editedContent.match(/\[.*?\]\(.*?\)/g) || editedContent.match(/<a[^>]*>/gi) || []).length
    
    // SEO Issues
    if (lowerKeyword && !lowerTitle.includes(lowerKeyword)) {
      problems.push({
        type: 'error',
        text: `La palabra clave "${article?.keyword}" NO aparece en el título. Agrégala para mejorar SEO.`
      })
    } else if (lowerKeyword) {
      problems.push({
        type: 'success',
        text: `La palabra clave "${article?.keyword}" aparece en el título. ¡Excelente!`
      })
    }
    
    if (lowerKeyword) {
      const occurrences = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length
      if (occurrences === 0) {
        problems.push({
          type: 'error',
          text: `La palabra clave "${article?.keyword}" NO aparece en el contenido. Úsala al menos 3 veces.`
        })
      } else if (occurrences < 3) {
        problems.push({
          type: 'warning',
          text: `La palabra clave aparece ${occurrences} ${occurrences === 1 ? 'vez' : 'veces'}. Se recomienda usarla al menos 3 veces.`
        })
      } else {
        problems.push({
          type: 'success',
          text: `La palabra clave aparece ${occurrences} veces en el contenido. ¡Bien!`
        })
      }
    }
    
    if (wordCount < 300) {
      problems.push({
        type: 'error',
        text: `El artículo tiene ${wordCount} palabras. Mínimo recomendado: 800 palabras para buen SEO.`
      })
    } else if (wordCount < 800) {
      problems.push({
        type: 'warning',
        text: `El artículo tiene ${wordCount} palabras. Se recomienda 800-2500 palabras.`
      })
    } else if (wordCount >= 1500 && wordCount <= 2500) {
      problems.push({
        type: 'success',
        text: `Longitud óptima: ${wordCount} palabras. ¡Perfecto para SEO!`
      })
    } else {
      problems.push({
        type: 'success',
        text: `El artículo tiene ${wordCount} palabras. Buena longitud.`
      })
    }
    
    if (h2Count === 0) {
      problems.push({
        type: 'error',
        text: 'No hay subtítulos H2. Agrega al menos 3 para mejorar la estructura.'
      })
    } else if (h2Count < 3) {
      problems.push({
        type: 'warning',
        text: `Solo ${h2Count} subtítulo${h2Count === 1 ? '' : 's'} H2. Se recomiendan al menos 3.`
      })
    } else {
      problems.push({
        type: 'success',
        text: `${h2Count} subtítulos H2. Buena estructura.`
      })
    }
    
    if (linkCount === 0) {
      problems.push({
        type: 'warning',
        text: 'No hay enlaces. Agrega enlaces internos y externos para mejorar SEO.'
      })
    } else if (linkCount < 2) {
      problems.push({
        type: 'warning',
        text: `Solo ${linkCount} enlace. Agrega más enlaces para mejorar SEO.`
      })
    } else {
      problems.push({
        type: 'success',
        text: `${linkCount} enlaces en el contenido. ¡Bien!`
      })
    }
    
    // Readability Issues
    if (cleanText) {
      try {
        const doc = nlp(cleanText)
        const sentences = doc.sentences().out('array')
        const words = doc.terms().out('array')
        
        if (sentences.length > 0 && words.length > 0) {
          const avgWordsPerSentence = words.length / sentences.length
          
          if (avgWordsPerSentence > 25) {
            problems.push({
              type: 'warning',
              text: `Oraciones muy largas (promedio: ${Math.round(avgWordsPerSentence)} palabras). Acorta las oraciones para mejorar legibilidad.`
            })
          } else if (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 18) {
            problems.push({
              type: 'success',
              text: `Longitud de oraciones ideal (promedio: ${Math.round(avgWordsPerSentence)} palabras).`
            })
          }
        }
      } catch (e) {}
    }
    
    const paragraphs = editedContent.split(/\n\n+/).filter((p: string) => p.trim().length > 0)
    if (paragraphs.length < 3) {
      problems.push({
        type: 'warning',
        text: `Solo ${paragraphs.length} párrafo${paragraphs.length === 1 ? '' : 's'}. Divide el contenido en más párrafos.`
      })
    } else if (paragraphs.length >= 5) {
      problems.push({
        type: 'success',
        text: `${paragraphs.length} párrafos. Buena división del contenido.`
      })
    }
    
    // 🎯 VALIDACIONES ESPECÍFICAS DE YOAST SEO
    
    // 1. Palabras de transición
    if (!yoastValidation.hasTransitionWords) {
      problems.push({
        type: 'error',
        text: 'Palabras de transición: Ninguna de las frases contiene palabras de transición. Usa alguna.'
      })
    } else {
      problems.push({
        type: 'success',
        text: `Palabras de transición: ${yoastValidation.transitionWordsCount} encontradas. ¡Excelente!`
      })
    }
    
    // 2. Longitud de oraciones
    if (!yoastValidation.sentenceLengthOk) {
      problems.push({
        type: 'error',
        text: `Longitud de las oraciones: El ${yoastValidation.longSentencesPercentage.toFixed(1)}% de las oraciones contienen más de 20 palabras, lo que supera el máximo recomendado del 25%.`
      })
    } else {
      problems.push({
        type: 'success',
        text: `Longitud de oraciones: ${yoastValidation.longSentencesPercentage.toFixed(1)}% de oraciones largas. ¡Dentro del límite!`
      })
    }
    
    // 3. Keywords en negrita
    if (yoastValidation.boldKeywordsCount === 0) {
      problems.push({
        type: 'warning',
        text: 'No se encontraron palabras clave en negrita. Agrega **negritas** a palabras importantes.'
      })
    } else {
      problems.push({
        type: 'success',
        text: `${yoastValidation.boldKeywordsCount} palabras clave en negrita. ¡Bien!`
      })
    }
    
    // 4. Agregar issues y sugerencias de Yoast SEO
    yoastValidation.issues.forEach(issue => {
      problems.push({
        type: 'error',
        text: issue
      })
    })
    
    yoastValidation.suggestions.forEach(suggestion => {
      problems.push({
        type: 'warning',
        text: suggestion
      })
    })
    
    return problems
  }, [editedContent, article, cleanText, yoastValidation])

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' }
    if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' }
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' }
  }

  const CircularProgress = ({ score, size = 70 }: { score: number, size?: number }) => {
    const strokeWidth = 7
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (score / 100) * circumference
    const colors = getScoreColor(score)

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={colors.text}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-gray-900">{score}</span>
          <span className="text-[9px] font-medium text-gray-500">/ 100</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* SEO & Readability Scores - Circular Charts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="flex flex-col items-center">
            <CircularProgress score={seoScore} size={70} />
            <div className="mt-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3 text-purple-600" />
                <span className="text-[11px] font-bold text-gray-800">SEO Score</span>
              </div>
              <p className="text-[9px] text-gray-500">
                {seoScore >= 80 ? 'Excelente' : seoScore >= 60 ? 'Bueno' : 'Mejorable'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="flex flex-col items-center">
            <CircularProgress score={readabilityScore} size={70} />
            <div className="mt-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <BookOpen className="h-3 w-3 text-blue-600" />
                <span className="text-[11px] font-bold text-gray-800">Readability</span>
              </div>
              <p className="text-[9px] text-gray-500">
                {readabilityScore >= 80 ? 'Excelente' : readabilityScore >= 60 ? 'Bueno' : 'Mejorable'}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Content Structure - Visual Bars */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-800">Content Structure</h3>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-600 font-medium">Palabras</span>
              <span className="text-sm font-bold text-gray-900">{editedContent.split(/\s+/).length}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{width: `${Math.min((editedContent.split(/\s+/).length / 2000) * 100, 100)}%`}} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" /> H2
              </span>
              <span className="text-sm font-bold text-gray-900">{(editedContent.match(/<h2[^>]*>/gi) || editedContent.match(/^## /gm) || []).length}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{width: `${Math.min(((editedContent.match(/<h2[^>]*>/gi) || editedContent.match(/^## /gm) || []).length / 10) * 100, 100)}%`}} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" /> H3
              </span>
              <span className="text-sm font-bold text-gray-900">{(editedContent.match(/<h3[^>]*>/gi) || editedContent.match(/^### /gm) || []).length}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full" style={{width: `${Math.min(((editedContent.match(/<h3[^>]*>/gi) || editedContent.match(/^### /gm) || []).length / 20) * 100, 100)}%`}} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" /> Enlaces
              </span>
              <span className="text-sm font-bold text-gray-900">{(editedContent.match(/\[.*?\]\(.*?\)/g) || editedContent.match(/<a[^>]*>/gi) || []).length}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{width: `${Math.min(((editedContent.match(/\[.*?\]\(.*?\)/g) || editedContent.match(/<a[^>]*>/gi) || []).length / 15) * 100, 100)}%`}} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-600 font-medium">Tiempo lectura</span>
              <span className="text-sm font-bold text-gray-900">{Math.ceil(editedContent.split(/\s+/).length / 200)} min</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" style={{width: `${Math.min((Math.ceil(editedContent.split(/\s+/).length / 200) / 10) * 100, 100)}%`}} />
            </div>
          </div>
        </div>
      </div>

      {/* SEO Analyzer - Solo análisis visual */}
      <SEOAnalyzer
        content={editedContent}
        keyword={article?.keyword || ''}
        title={article?.title || ''}
        metaDescription={article?.meta_description || ''}
      />

      {/* 🎯 Yoast SEO Validation - DESPUÉS del análisis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-bold text-gray-800">Validación Yoast SEO</h3>
          <Badge 
            variant={yoastValidation.hasTransitionWords && yoastValidation.sentenceLengthOk && yoastValidation.boldKeywordsCount > 0 ? "default" : "destructive"}
            className="text-xs"
          >
            {yoastValidation.hasTransitionWords && yoastValidation.sentenceLengthOk && yoastValidation.boldKeywordsCount > 0 ? 'Todo correcto' : 'Hay problemas'}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {/* Palabras de transición */}
          <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
            yoastValidation.hasTransitionWords 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center gap-3">
              {yoastValidation.hasTransitionWords ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">Palabras de transición</div>
                <div className="text-xs text-gray-600">
                  {yoastValidation.hasTransitionWords 
                    ? `✅ ${yoastValidation.transitionWordsCount} encontradas - Perfecto` 
                    : '❌ Ninguna encontrada - PROBLEMA'
                  }
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              yoastValidation.hasTransitionWords 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {yoastValidation.hasTransitionWords ? 'CORRECTO' : 'ERROR'}
            </div>
          </div>
          
          {/* Longitud de oraciones */}
          <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
            yoastValidation.sentenceLengthOk 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center gap-3">
              {yoastValidation.sentenceLengthOk ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">Longitud de oraciones</div>
                <div className="text-xs text-gray-600">
                  {yoastValidation.sentenceLengthOk 
                    ? `✅ ${yoastValidation.longSentencesPercentage.toFixed(1)}% largas - Dentro del límite` 
                    : `❌ ${yoastValidation.longSentencesPercentage.toFixed(1)}% largas - SUPERA EL 25%`
                  }
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              yoastValidation.sentenceLengthOk 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {yoastValidation.sentenceLengthOk ? 'CORRECTO' : 'ERROR'}
            </div>
          </div>
          
          {/* Keywords en negrita */}
          <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
            yoastValidation.boldKeywordsCount > 0 
              ? 'border-green-200 bg-green-50' 
              : 'border-yellow-200 bg-yellow-50'
          }`}>
            <div className="flex items-center gap-3">
              {yoastValidation.boldKeywordsCount > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">Keywords en negrita</div>
                <div className="text-xs text-gray-600">
                  {yoastValidation.boldKeywordsCount > 0 
                    ? `✅ ${yoastValidation.boldKeywordsCount} encontradas - Bien` 
                    : '⚠️ 0 encontradas - Recomendado agregar'
                  }
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              yoastValidation.boldKeywordsCount > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {yoastValidation.boldKeywordsCount > 0 ? 'BIEN' : 'MEJORAR'}
            </div>
          </div>
        </div>
        
        {/* Resumen de problemas */}
        {(!yoastValidation.hasTransitionWords || !yoastValidation.sentenceLengthOk) && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-sm font-bold text-red-800">PROBLEMAS DETECTADOS:</div>
            </div>
            <div className="space-y-1 text-sm text-red-700">
              {!yoastValidation.hasTransitionWords && (
                <div>• Agrega palabras como "además", "por ejemplo", "sin embargo" al inicio de párrafos</div>
              )}
              {!yoastValidation.sentenceLengthOk && (
                <div>• Divide oraciones largas (más de 20 palabras) usando puntos o comas</div>
              )}
            </div>
          </div>
        )}
        
        {(yoastValidation.hasTransitionWords && yoastValidation.sentenceLengthOk) && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-sm font-bold text-green-800">✅ Artículo optimizado para Yoast SEO</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
