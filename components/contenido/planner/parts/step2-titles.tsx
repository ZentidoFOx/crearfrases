"use client"

import { useState, useEffect } from 'react'
import { FileText, Loader2, RefreshCw, ArrowLeft, Check, Tag, Target, CheckCircle, Award, TrendingUp, Eye, BarChart3, Sparkles, Edit2, X, Search, Globe, Zap, AlertCircle, XCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { aiService } from '@/lib/api/ai-service'

interface TitleData {
  title: string
  h1Title: string
  description: string
  keywords: string[]
  objectivePhrase: string
  seoScore: {
    keywordInTitle: boolean
    keywordInDescription: boolean
    keywordDensity: number
    titleLength: number
    descriptionLength: number
    overall?: number // Overall SEO score calculated with real algorithm
  }
}

interface Step2TitlesProps {
  keyword: string
  modelId: number
  additionalKeywords?: string
  onSelectTitle: (title: string, titleData?: TitleData) => void
  onBack: () => void
}

// Componente de Score SEO Circular
const SEOScoreCircle = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  }
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }
  
  const getColor = (score: number) => {
    if (score >= 80) return { stroke: '#10b981', bg: 'bg-green-50', text: 'text-green-700' }
    if (score >= 60) return { stroke: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' }
    return { stroke: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' }
  }
  
  const color = getColor(score)
  const circumference = 2 * Math.PI * 20
  const offset = circumference - (score / 100) * circumference
  
  return (
    <div className={`${sizeClasses[size]} ${color.bg} rounded-full flex items-center justify-center relative`}>
      <svg className="absolute inset-0 -rotate-90" width="100%" height="100%" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          fill="none" 
          stroke={color.stroke} 
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className={`${textSizes[size]} font-bold ${color.text} relative z-10`}>{score}</span>
    </div>
  )
}

// Componente de Preview Google SERP
const GooglePreview = ({ title, description, keyword }: { title: string; description: string; keyword: string }) => {
  const highlightKeyword = (text: string) => {
    const regex = new RegExp(`(${keyword})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => 
      part.toLowerCase() === keyword.toLowerCase() ? 
        <strong key={i} className="font-bold">{part}</strong> : part
    )
  }
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-4 w-4 text-gray-400" />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">https://ejemplo.com › tour</span>
          </div>
        </div>
      </div>
      <h3 className="text-xl text-blue-600 hover:underline cursor-pointer mb-1 line-clamp-1">
        {highlightKeyword(title)}
      </h3>
      <p className="text-sm text-gray-600 line-clamp-2">
        {highlightKeyword(description)}
      </p>
    </div>
  )
}

export function Step2Titles({ keyword, modelId, additionalKeywords: initialAdditionalKeywords = '', onSelectTitle, onBack }: Step2TitlesProps) {
  const [titles, setTitles] = useState<TitleData[]>([])
  const [selectedTitle, setSelectedTitle] = useState<TitleData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState<'list' | 'preview' | 'compare'>('list')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [additionalKeywords, setAdditionalKeywords] = useState(initialAdditionalKeywords)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [expandedAccordions, setExpandedAccordions] = useState<Record<number, string>>({})

  // Calculate real SEO score based on the same algorithm as articles/[id]/page.tsx
  const calculateRealSEOScore = (titleData: TitleData): number => {
    const lowerTitle = titleData.title.toLowerCase()
    const lowerDescription = titleData.description.toLowerCase()
    const lowerKeyword = keyword.toLowerCase()
    const combined = `${titleData.title} ${titleData.description}`.toLowerCase()
    
    let score = 0
    let maxScore = 0
    
    // Keyword en título (30 puntos)
    maxScore += 30
    if (lowerTitle.includes(lowerKeyword)) {
      score += 30
    }
    
    // Keyword en descripción (25 puntos)
    maxScore += 25
    if (lowerDescription.includes(lowerKeyword)) {
      const occurrences = (lowerDescription.match(new RegExp(lowerKeyword, 'g')) || []).length
      if (occurrences >= 2) score += 25
      else if (occurrences >= 1) score += 15
    }
    
    // Longitud del título (20 puntos - ideal 50-60 caracteres)
    maxScore += 20
    const titleLength = titleData.title.length
    if (titleLength >= 50 && titleLength <= 60) score += 20
    else if (titleLength >= 40 && titleLength <= 70) score += 15
    else if (titleLength >= 30) score += 10
    
    // Longitud de la descripción (15 puntos - ideal 150-160 caracteres)
    maxScore += 15
    const descLength = titleData.description.length
    if (descLength >= 150 && descLength <= 160) score += 15
    else if (descLength >= 140 && descLength <= 165) score += 12
    else if (descLength >= 120) score += 8
    
    // Keywords relacionadas presentes (10 puntos)
    maxScore += 10
    if (titleData.keywords && titleData.keywords.length > 0) {
      const keywordsInContent = titleData.keywords.filter(kw => 
        combined.includes(kw.toLowerCase())
      ).length
      const percentage = keywordsInContent / titleData.keywords.length
      score += Math.round(10 * percentage)
    }
    
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  }

  useEffect(() => {
    generateTitles()
  }, [])

  const generateTitles = async (append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsGenerating(true)
      setTitles([]) // Clear titles only when regenerating
    }
    setError('')

    try {
      const generatedTitles = await aiService.generateTitlesComplete(keyword, 5, additionalKeywords, modelId)
      
      // Recalculate SEO scores with the real algorithm
      const titlesWithRealScores = generatedTitles.map(title => {
        const realScore = calculateRealSEOScore(title)
        return {
          ...title,
          seoScore: {
            ...title.seoScore,
            overall: realScore // Add overall score calculated with real algorithm
          }
        }
      })
      
      if (append) {
        // Add new titles to existing ones
        setTitles(prev => [...prev, ...titlesWithRealScores])
      } else {
        // Replace all titles
        setTitles(titlesWithRealScores)
      }
    } catch (err: any) {
      setError(err.message || 'Error al generar títulos')
    } finally {
      setIsGenerating(false)
      setIsLoadingMore(false)
    }
  }

  const loadMoreTitles = () => {
    generateTitles(true)
  }

  const handleSelectTitle = () => {
    if (selectedTitle) {
      onSelectTitle(selectedTitle.title, selectedTitle)
    }
  }
  
  /**
   * Get SEO Score - Uses real algorithm calculation from articles/[id]/page.tsx
   */
  const getSEOScore = (titleData: TitleData): number => {
    // Return the real calculated score if available, otherwise recalculate
    return titleData.seoScore.overall || calculateRealSEOScore(titleData)
  }
  
  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updatedTitles = [...titles]
      const updatedTitle: TitleData = {
        ...updatedTitles[editingIndex],
        title: editedTitle,
        description: editedDescription,
        seoScore: {
          ...updatedTitles[editingIndex].seoScore,
          titleLength: editedTitle.length,
          descriptionLength: editedDescription.length,
          keywordInTitle: editedTitle.toLowerCase().includes(keyword.toLowerCase()),
          keywordInDescription: editedDescription.toLowerCase().includes(keyword.toLowerCase())
        }
      }
      
      // Recalculate real SEO score with the updated data
      const realScore = calculateRealSEOScore(updatedTitle)
      updatedTitle.seoScore.overall = realScore
      
      updatedTitles[editingIndex] = updatedTitle
      setTitles(updatedTitles)
      setEditingIndex(null)
    }
  }
  
  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditedTitle(titles[index].title)
    setEditedDescription(titles[index].description)
  }
  
  const cancelEdit = () => {
    setEditingIndex(null)
    setEditedTitle('')
    setEditedDescription('')
  }

  return (
    <div className="bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Info (Sticky) */}
        <div className="lg:col-span-1 bg-white border-2 border-gray-200 rounded-xl p-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2b2b40]">Títulos SEO</h2>
            <p className="text-sm text-gray-600 mt-1">
              Optimizados con IA
            </p>
          </div>

          {/* Frase Clave Objetiva Badge */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Frase clave objetiva:
            </p>
            <p className="text-base font-bold text-[#2b2b40]">{keyword}</p>
          </div>

          {/* Palabras Clave Adicionales para reforzar */}
          <div className="mb-4">
            <label htmlFor="additional-keywords" className="text-sm font-semibold text-[#2b2b40] mb-2 flex items-center gap-2 block">
              <Tag className="h-5 w-5" />
              Palabras clave adicionales
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Agrega palabras separadas por comas
            </p>
            <div className="relative mb-2">
              <input
                id="additional-keywords"
                type="text"
                value={additionalKeywords}
                onChange={(e) => setAdditionalKeywords(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && additionalKeywords.trim()) {
                    generateTitles(false)
                  }
                }}
                placeholder="Ej: guía completa, 2024"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#096] focus:ring-1 focus:ring-[#096] bg-white"
              />
            </div>
            <Button
              onClick={() => generateTitles(false)}
              disabled={isGenerating}
              size="lg"
              className="w-full bg-[#096] hover:bg-[#096]/90 text-white"
              title="Regenera todos los títulos"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Regenerar Títulos
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              💡 Regenerar crea 5 títulos nuevos
            </p>
          </div>

          {/* Tips */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-bold text-[#2b2b40] mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#f54a00]" />
              Tips
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-[#096] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span>Score 80+ es excelente</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-[#096] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span>Puedes editar cualquier título</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-[#096] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span>Agrega más títulos cuando quieras</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3 mt-4">
            <Button
              onClick={handleSelectTitle}
              disabled={!selectedTitle}
              size="lg"
              className="w-full bg-[#096] hover:bg-[#096]/90 text-white"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Continuar con este Título
            </Button>

            {!isGenerating && titles.length > 0 && (
              <Button
                variant="outline"
                onClick={() => generateTitles(false)}
                disabled={isGenerating}
                size="lg"
                className="w-full border-2 border-gray-200 hover:border-gray-400"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Regenerar Todos
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onBack}
              size="lg"
              className="w-full border-2 border-gray-200 hover:border-gray-400"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN - Titles with Tabs */}
        <div className="lg:col-span-2 bg-white border-2 border-gray-200 rounded-xl p-6">
          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-16 w-16 animate-spin text-[#096] mb-4" />
              <p className="text-xl font-bold text-[#2b2b40]">Generando Títulos con IA</p>
              <p className="text-base text-gray-600 mt-2">Creando títulos optimizados...</p>
            </div>
          )}

          {/* Titles with Tabs */}
          {!isGenerating && titles.length > 0 && (
            <div>
              {/* Tabs Header */}
              <div className="flex gap-2 border-b-2 border-gray-200 mb-6">
                <button
                  onClick={() => setActiveView('list')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                    activeView === 'list'
                      ? 'bg-[#096] text-white border-b-2 border-[#096]'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Lista
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeView === 'list'
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {titles.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveView('preview')}
                  disabled={!selectedTitle}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                    activeView === 'preview'
                      ? 'bg-[#096] text-white border-b-2 border-[#096]'
                      : !selectedTitle
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveView('compare')}
                  disabled={titles.length < 2}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                    activeView === 'compare'
                      ? 'bg-[#096] text-white border-b-2 border-[#096]'
                      : titles.length < 2
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Comparar
                </button>
              </div>

              {/* Vista Lista */}
              {activeView === 'list' && (
                <div className="space-y-3">
                  {titles.map((titleData, index) => (
                    <div
                      key={index}
                      className={`
                        p-4 rounded-xl border transition-all cursor-pointer
                        ${
                          selectedTitle?.title === titleData.title
                            ? 'border-emerald-200 bg-emerald-50/20 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                      onClick={() => {
                        setSelectedTitle(titleData)
                        setExpandedAccordions(prev => ({
                          ...prev,
                          [index]: prev[index] ? '' : 'details'
                        }))
                      }}
                    >
                      {editingIndex === index ? (
                        /* Modo Edición */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Edit2 className="h-4 w-4 text-[#096]" />
                              <span className="text-sm font-bold text-[#2b2b40]">Editando Título #{index + 1}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={handleSaveEdit} 
                                className="bg-[#096] hover:bg-[#096]/90 text-white"
                              >
                                <Check className="h-3.5 w-3.5 mr-1.5" />
                                Guardar
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit} className="border-2 border-gray-200 hover:border-gray-400">
                                <X className="h-3.5 w-3.5 mr-1.5" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-[#2b2b40] mb-2 flex items-center gap-2 block">
                              <FileText className="h-4 w-4" />
                              Título
                            </label>
                            <input
                              type="text"
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#096] focus:ring-1 focus:ring-[#096]"
                              placeholder="Título del artículo"
                            />
                            <span className="text-xs text-gray-600 mt-1.5 block">{editedTitle.length} caracteres</span>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-[#2b2b40] mb-2 flex items-center gap-2 block">
                              <Eye className="h-4 w-4" />
                              Meta Descripción
                            </label>
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#096] focus:ring-1 focus:ring-[#096]"
                              placeholder="Descripción para motores de búsqueda"
                            />
                            <span className="text-xs text-gray-600 mt-1.5 block">{editedDescription.length} caracteres</span>
                          </div>
                        </div>
                      ) : (
                        /* Modo Vista */
                        <div className="flex items-start gap-4">
                          {/* Left: Score Badge */}
                          <div className="flex-shrink-0">
                            <SEOScoreCircle score={getSEOScore(titleData)} size="md" />
                          </div>
                          
                          {/* Center: Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-[#2b2b40]">Título #{index + 1}</span>
                                {selectedTitle?.title === titleData.title && (
                                  <Check className="h-5 w-5 text-[#096]" />
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEdit(index)
                                }}
                                className="hover:bg-gray-100 text-gray-700"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </div>

                            {/* Título SEO - Principal */}
                            <div className="mb-3">
                              <h3 className="text-base font-bold text-[#2b2b40]">
                                {titleData.title}
                              </h3>
                            </div>

                            {/* Meta Descripción - Siempre visible */}
                            <div className="mb-3">
                              <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                                {titleData.description}
                              </p>
                            </div>

                            {/* Badges críticos */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {titleData.seoScore.keywordInTitle && (
                                <Badge className="bg-[#096] text-white text-xs">
                                  ✓ Keyword en título
                                </Badge>
                              )}
                              {titleData.seoScore.keywordInDescription && (
                                <Badge className="bg-[#096] text-white text-xs">
                                  ✓ Keyword en descripción
                                </Badge>
                              )}
                            </div>

                            {/* Accordion - Detalles Adicionales */}
                            <Accordion 
                              type="single" 
                              collapsible 
                              className="w-full"
                              value={expandedAccordions[index]}
                              onValueChange={(value) => {
                                setExpandedAccordions(prev => ({
                                  ...prev,
                                  [index]: value
                                }))
                              }}
                            >
                              <AccordionItem value="details" className="border-none">
                                <AccordionTrigger 
                                  className="py-2 hover:no-underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-sm font-semibold text-[#096]">Ver detalles completos</span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-3">
                                  
                                  {/* Título H1 */}
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      Título del Artículo (H1):
                                    </p>
                                    <p className="text-sm font-semibold text-[#2b2b40]">
                                      {titleData.h1Title}
                                    </p>
                                  </div>

                                  {/* Análisis SEO Detallado */}
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold mb-2">Análisis de Longitudes:</p>
                                    <div className="space-y-2">
                                      <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm text-gray-700">Longitud título:</span>
                                          <span className="text-sm font-semibold text-gray-900">
                                            {titleData.seoScore.titleLength} chars
                                            {titleData.seoScore.titleLength >= 50 && titleData.seoScore.titleLength <= 60 ? ' ✓' : ' ⚠'}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500">Óptimo: 50-60 caracteres</div>
                                      </div>
                                      <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm text-gray-700">Longitud descripción:</span>
                                          <span className="text-sm font-semibold text-gray-900">
                                            {titleData.seoScore.descriptionLength} chars
                                            {titleData.seoScore.descriptionLength >= 150 && titleData.seoScore.descriptionLength <= 160 ? ' ✓' : ' ⚠'}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500">Óptimo: 150-160 caracteres</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Keywords */}
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold mb-2 flex items-center gap-1">
                                      <Tag className="h-3 w-3" />
                                      Palabras relacionadas:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {titleData.keywords.map((kw, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded"
                                        >
                                          <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                                          {kw}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>

                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Botón Mostrar Más / Generar Más Títulos */}
                  {titles.length > 0 && !isGenerating && (
                    <div className="mt-4 text-center">
                      <Button
                        onClick={loadMoreTitles}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="w-full sm:w-auto h-10 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
                        title="Agrega 5 títulos más"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Agregar 5 más
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        {titles.length} {titles.length === 1 ? 'título' : 'títulos'} generados
                      </p>
                    </div>
                  )}
                  </div>
                )}

                {/* Vista Preview Google */}
                {activeView === 'preview' && selectedTitle && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-base font-semibold text-black mb-1 flex items-center justify-center gap-2">
                        <Search className="h-4 w-4 text-gray-600" />
                        Vista Previa en Google
                      </h3>
                      <p className="text-xs text-gray-600">Así se verá en los resultados de búsqueda</p>
                    </div>
                    
                    <div className="flex justify-center">
                      <GooglePreview 
                        title={selectedTitle.title}
                        description={selectedTitle.description}
                        keyword={keyword}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-gray-600" />
                          <span className="text-xs font-medium" style={{ color: '#000000' }}>Score SEO</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <SEOScoreCircle score={getSEOScore(selectedTitle)} size="lg" />
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-gray-600" />
                          <span className="text-xs font-medium" style={{ color: '#000000' }}>Métricas</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Título:</span>
                            <span className={`font-semibold ${
                              selectedTitle.seoScore.titleLength >= 50 && selectedTitle.seoScore.titleLength <= 60
                                ? 'text-green-600'
                                : 'text-amber-600'
                            }`}>
                              {selectedTitle.seoScore.titleLength} chars
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Descripción:</span>
                            <span className={`font-semibold ${
                              selectedTitle.seoScore.descriptionLength >= 150 && selectedTitle.seoScore.descriptionLength <= 160
                                ? 'text-green-600'
                                : 'text-amber-600'
                            }`}>
                              {selectedTitle.seoScore.descriptionLength} chars
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Densidad KW:</span>
                            <span className="font-semibold text-purple-600">
                              {selectedTitle.seoScore.keywordDensity}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vista Comparar */}
                {activeView === 'compare' && (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <h3 className="text-base font-semibold text-black mb-1 flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-600" />
                        Comparación de Títulos
                      </h3>
                      <p className="text-xs text-gray-600">Compara los scores SEO</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {titles.map((titleData, index) => {
                        const score = getSEOScore(titleData)
                        return (
                          <div
                            key={index}
                            onClick={() => setSelectedTitle(titleData)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedTitle?.title === titleData.title
                                ? 'border-black bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-900">Título #{index + 1}</span>
                              {selectedTitle?.title === titleData.title && (
                                <Check className="h-4 w-4 text-black" />
                              )}
                            </div>
                            
                            <div className="flex justify-center mb-2">
                              <SEOScoreCircle score={score} size="md" />
                            </div>
                            
                            <p className="text-xs text-gray-900 font-medium mb-2 line-clamp-2">
                              {titleData.title}
                            </p>
                            
                            <div className="space-y-1 text-[10px]">
                              <div className="flex items-center gap-1">
                                <span className={titleData.seoScore.keywordInTitle ? 'text-green-600' : 'text-red-600'}>
                                  {titleData.seoScore.keywordInTitle ? '✓' : '✗'}
                                </span>
                                <span className="text-gray-600">Frase en título</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={titleData.seoScore.keywordInDescription ? 'text-green-600' : 'text-red-600'}>
                                  {titleData.seoScore.keywordInDescription ? '✓' : '✗'}
                                </span>
                                <span className="text-gray-600">Frase en desc</span>
                              </div>
                              <div className="flex justify-between mt-2">
                                <span className="text-gray-600">Título: {titleData.seoScore.titleLength}</span>
                                <span className="text-gray-600">Desc: {titleData.seoScore.descriptionLength}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Botón Mostrar Más en vista Compare */}
                    {titles.length > 0 && !isGenerating && (
                      <div className="mt-4 text-center">
                        <Button
                          onClick={loadMoreTitles}
                          disabled={isLoadingMore}
                          variant="outline"
                          className="w-full sm:w-auto h-10 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
                          title="Agrega 5 títulos más"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Agregar 5 más
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          {titles.length} {titles.length === 1 ? 'título' : 'títulos'} generados
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Empty State */}
          {!isGenerating && titles.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay títulos generados</p>
              <p className="text-sm text-gray-500 mt-2">Intenta generar nuevos títulos</p>
            </div>
          )}
        </div>
      </div>

      {/* Information Section - 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Card 1: Optimización SEO */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black">Optimización SEO</h3>
              <p className="text-xs text-gray-600 mt-0.5">Qué hacen los títulos</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-xs">Frase Clave Objetiva</p>
                <p className="text-xs text-gray-600">Incluyen la frase para mejor ranking</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-xs">Longitud Óptima</p>
                <p className="text-xs text-gray-600">50-60 caracteres ideales</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-xs">Atractivos</p>
                <p className="text-xs text-gray-600">Generan curiosidad y clics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Cómo Elegir */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black">Cómo Elegir</h3>
              <p className="text-xs text-gray-600 mt-0.5">Criterios de selección</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-xs">Score Alto</p>
                <p className="text-xs text-gray-600">Busca 80+ para mejor SEO</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-xs">Descripción Clara</p>
                <p className="text-xs text-gray-600">Informativa y concisa</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-xs">Keywords Relevantes</p>
                <p className="text-xs text-gray-600">Palabras clave incluidas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Próximos Pasos */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black">Próximos Pasos</h3>
              <p className="text-xs text-gray-600 mt-0.5">Qué sigue después</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-lg bg-black text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900 text-xs">Selecciona Título</p>
                <p className="text-xs text-gray-600">Haz clic en tu favorito</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-lg bg-black text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900 text-xs">Configura Artículo</p>
                <p className="text-xs text-gray-600">Elige secciones</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-lg bg-black text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900 text-xs">Genera Contenido</p>
                <p className="text-xs text-gray-600">IA crea el artículo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
