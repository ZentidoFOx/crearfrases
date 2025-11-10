"use client"

import { useState, useEffect } from 'react'
import { Search, Loader2, TrendingUp, Target, Lightbulb, ExternalLink, FileText, MapPin, SearchCheck, CheckCircle, Sparkles, BarChart3, XCircle, Check, AlertTriangle, PartyPopper, Key, AlertCircle, Tag, Folder, Info, Navigation, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { aiService } from '@/lib/api/ai-service'
import { wordpressAnalyticsService, type SearchResult } from '@/lib/api/wordpress-analytics'
import { aiModelsService, type AIModel } from '@/lib/api/ai-models'
import { useWebsite } from '@/contexts/website-context'

// Helper function to count total words in phrase
const countTotalWords = (phrase: string): number => {
  return phrase.trim().split(/\s+/).length
}

// Componente para el gráfico de tendencia
const TrendChart = ({ pattern = 0 }: { pattern?: number }) => {
  const trendData = [
    [8, 12, 10, 15, 18, 20, 18, 22], // Tendencia ascendente con variación
    [20, 15, 18, 12, 15, 10, 8, 6], // Tendencia descendente
    [12, 18, 15, 20, 16, 21, 18, 19], // Tendencia con picos
    [10, 15, 12, 18, 14, 20, 16, 22], // Tendencia ascendente irregular
    [15, 15, 15, 15, 15, 15, 15, 15], // Tendencia plana
  ]
  
  const data = trendData[pattern % trendData.length]
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  // Crear puntos para el gráfico
  const width = 70
  const height = 30
  const padding = 2
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return { x, y }
  })
  
  // Crear path para la línea
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  
  // Crear path para el área rellena
  const areaPath = `M ${points[0].x} ${height - padding} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${height - padding} Z`
  
  // Determinar el color según la tendencia
  const isUpTrend = data[data.length - 1] > data[0]
  const color = '#3b82f6' // Siempre azul como en la imagen
  
  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`gradient-${pattern}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {/* Área rellena */}
      <path
        d={areaPath}
        fill={`url(#gradient-${pattern})`}
      />
      
      {/* Línea */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Componente para el Intent Badge con tooltip
const IntentBadge = ({ type }: { type: 'I' | 'N' | 'C' | 'T' }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const config = {
    I: { 
      bg: 'bg-gray-100', 
      text: 'text-gray-900', 
      label: 'I',
      title: 'Informacional',
      description: 'El usuario quiere encontrar información sobre un tema específico.'
    },
    N: { 
      bg: 'bg-gray-100', 
      text: 'text-gray-900', 
      label: 'N',
      title: 'Navegacional',
      description: 'El usuario quiere encontrar una página o sitio específico.'
    },
    C: { 
      bg: 'bg-gray-100', 
      text: 'text-gray-900', 
      label: 'C',
      title: 'Comercial',
      description: 'El usuario está investigando productos o servicios.'
    },
    T: { 
      bg: 'bg-gray-100', 
      text: 'text-gray-900', 
      label: 'T',
      title: 'Transaccional',
      description: 'El usuario quiere completar una acción o compra.'
    },
  }
  
  const { bg, text, label, title, description } = config[type]
  
  return (
    <div className="relative inline-block">
      <span 
        className={`inline-flex items-center justify-center w-6 h-6 rounded border border-gray-300 ${bg} ${text} text-xs font-medium cursor-help`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {label}
      </span>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg">
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-gray-300 text-[11px] leading-relaxed">{description}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para el indicador de dificultad
const DifficultyIndicator = ({ value }: { value: number }) => {
  const getColor = () => {
    if (value === 0) return 'bg-gray-300'
    if (value < 20) return 'bg-gray-400'
    if (value < 50) return 'bg-gray-500'
    if (value < 80) return 'bg-gray-700'
    return 'bg-gray-900'
  }
  
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm text-gray-900">{value}</span>
      <div className={`w-2 h-2 rounded-full ${getColor()}`} />
    </div>
  )
}

interface YoastResult {
  id: number
  type: string
  link: string
  title: string
  yoast_focus_keyword: string
}

interface Step1KeywordProps {
  onSubmit: (keyword: string, analysis: any, data?: any) => void
  initialKeyword?: string
  initialData?: any
}

export function Step1Keyword({ onSubmit, initialKeyword = '', initialData }: Step1KeywordProps) {
  const { activeWebsite } = useWebsite()
  const [keyword, setKeyword] = useState(initialKeyword)
  const [isSearching, setIsSearching] = useState(false)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false)
  const [generatingSimilarForKeyword, setGeneratingSimilarForKeyword] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [aiError, setAiError] = useState('')
  const [yoastResults, setYoastResults] = useState<SearchResult[]>(initialData?.yoastResults || [])
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(initialData?.aiSuggestions || [])
  const [similarSuggestions, setSimilarSuggestions] = useState<string[]>([])
  const [hasSearched, setHasSearched] = useState(!!initialData)
  const [analyzingSuggestion, setAnalyzingSuggestion] = useState<string | null>(null)
  const [suggestionAnalysisResults, setSuggestionAnalysisResults] = useState<Record<string, SearchResult[]>>(initialData?.suggestionAnalysisResults || {})
  const [similarAnalysisResults, setSimilarAnalysisResults] = useState<Record<string, SearchResult[]>>({})
  const [activeResultsTab, setActiveResultsTab] = useState<'existing' | 'suggestions' | 'similar'>('existing')
  const [basedOnKeyword, setBasedOnKeyword] = useState<string>('')
  
  // AI Models state
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  
  // Additional keywords modal state
  const [showAdditionalKeywordsModal, setShowAdditionalKeywordsModal] = useState(false)
  const [additionalKeywords, setAdditionalKeywords] = useState('')
  const [selectedKeywordForSubmit, setSelectedKeywordForSubmit] = useState('')

  // Load active AI models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoadingModels(true)
        const models = await aiModelsService.getActiveModels()
        setAiModels(models)
        
        // Auto-select first active model
        if (models.length > 0) {
          setSelectedModel(models[0].id.toString())
        }
      } catch (error) {
        console.error('Error loading AI models:', error)
        setError('No se pudieron cargar los modelos de IA. Contacta al administrador.')
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadModels()
  }, [])

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('Por favor ingresa una palabra clave')
      return
    }

    if (!selectedModel) {
      setError('Por favor selecciona un modelo de IA')
      return
    }

    if (!activeWebsite) {
      setError('Por favor selecciona un sitio web primero')
      return
    }

    setIsSearching(true)
    setError('')
    setHasSearched(true)
    setAiSuggestions([])
    setActiveResultsTab('existing')

    try {
      // PASO 1: Buscar por Frases Clave Objetivo en Yoast SEO
      const results = await wordpressAnalyticsService.searchFocusKeywords(
        activeWebsite.url,
        keyword,
        {
          lang: 'es'
        }
      )
      
      setYoastResults(results || [])
      
      // PASO 2: Finish loading API results first
      setIsSearching(false)
      
      // PASO 3: Then generate AI suggestions (after API results are loaded)
      await generateAISuggestions(keyword, results || [])
      
    } catch (err: any) {
      // Si el error es por plugin no disponible, continuar sin error visible
      const errorMessage = err.message || ''
      if (errorMessage.includes('Plugin de WordPress') || errorMessage.includes('404')) {
        console.warn('WordPress plugin no disponible, continuando solo con IA:', err)
        setYoastResults([])
        setIsSearching(false)
        // Continuar generando sugerencias de IA
        await generateAISuggestions(keyword, [])
      } else {
        // Otros errores sí se muestran
        setError(errorMessage || 'Error al buscar frases clave objetivo')
        setYoastResults([])
        setAiSuggestions([])
        setIsSearching(false)
      }
    }
  }

  // Handle "Usar" button click - shows additional keywords modal
  const handleUseKeyword = (keywordToUse: string) => {
    setSelectedKeywordForSubmit(keywordToUse)
    setShowAdditionalKeywordsModal(true)
  }

  // Handle final submit with additional keywords
  const handleFinalSubmit = () => {
    if (!selectedKeywordForSubmit) return
    
    onSubmit(
      selectedKeywordForSubmit, 
      {}, 
      { 
        yoastResults, 
        aiSuggestions, 
        suggestionAnalysisResults, 
        modelId: parseInt(selectedModel),
        additionalKeywords // Pass additional keywords to Step2
      }
    )
    
    // Reset modal state
    setShowAdditionalKeywordsModal(false)
    setAdditionalKeywords('')
    setSelectedKeywordForSubmit('')
  }

  const generateAISuggestions = async (baseKeyword: string, existingResults: SearchResult[]) => {
    if (!selectedModel) {
      return
    }

    setIsGeneratingSuggestions(true)
    setAiError('')
    setAiSuggestions([]) // Limpiar sugerencias anteriores
    
    try {
      // Extract existing keywords from API results
      const existingKeywords = existingResults.map(r => (r.focus_keyword || '').toLowerCase())
      
      // Generate new keyword suggestions using selected AI model
      const modelId = parseInt(selectedModel)
      const collectedSuggestions: string[] = []
      
      // NO cambiar de tab aún, mantener en el tab actual (existente)
      
      // Intentar con streaming primero
      console.log('🚀 [STEP1] Iniciando generación con streaming...')
      console.log('🔑 [STEP1] Keyword base:', baseKeyword)
      console.log('📊 [STEP1] Keywords existentes:', existingKeywords.length)
      
      const streamingSuccess = await aiService.generateKeywordSuggestionsStreaming(
        baseKeyword, 
        existingKeywords, 
        modelId,
        (newSuggestion) => {
          // Callback ejecutado por cada nueva sugerencia
          console.log('🎯 [STEP1] Nueva sugerencia recibida:', newSuggestion)
          console.log('📏 [STEP1] Longitud:', newSuggestion.length)
          
          collectedSuggestions.push(newSuggestion)
          setAiSuggestions([...collectedSuggestions])
          console.log('✅ [STEP1] Total sugerencias acumuladas:', collectedSuggestions.length)
          
          // Cambiar al tab de sugerencias cuando llegue la PRIMERA keyword
          if (collectedSuggestions.length === 1) {
            console.log('📑 [STEP1] Cambiando a tab de sugerencias (primera keyword recibida)')
            setActiveResultsTab('suggestions')
          }
          
          // Analizar automáticamente las primeras 5 sugerencias
          if (collectedSuggestions.length <= 5 && activeWebsite) {
            console.log('🔍 [STEP1] Analizando disponibilidad de:', newSuggestion)
            // Analizar en background sin esperar
            wordpressAnalyticsService.searchFocusKeywords(
              activeWebsite.url,
              newSuggestion,
              { lang: 'es' }
            ).then(results => {
              console.log('✅ [STEP1] Análisis completado para:', newSuggestion, '- Resultados:', results?.length || 0)
              setSuggestionAnalysisResults(prev => ({
                ...prev,
                [newSuggestion]: results || []
              }))
            }).catch(err => {
              console.log('⚠️ [STEP1] Error analizando:', newSuggestion)
            })
          }
        }
      )
      
      // Si el streaming no fue exitoso, usar el método normal
      if (!streamingSuccess) {
        console.log('⚠️ [STEP1] Streaming no soportado, usando método normal...')
        
        const suggestions = await aiService.generateKeywordSuggestions(
          baseKeyword, 
          existingKeywords, 
          modelId
        )
        
        console.log('✅ [STEP1] Sugerencias generadas con método normal:', suggestions.length)
        setAiSuggestions(suggestions)
        
        // Cambiar al tab de sugerencias cuando termine la generación normal
        if (suggestions.length > 0) {
          console.log('📑 [STEP1] Cambiando a tab de sugerencias (generación completada)')
          setActiveResultsTab('suggestions')
        }
        
        // Analizar automáticamente las primeras 5 sugerencias
        if (suggestions.length > 0 && activeWebsite) {
          const suggestionsToAnalyze = suggestions.slice(0, 5)
          
          for (const suggestion of suggestionsToAnalyze) {
            try {
              const results = await wordpressAnalyticsService.searchFocusKeywords(
                activeWebsite.url,
                suggestion,
                { lang: 'es' }
              )
              
              setSuggestionAnalysisResults(prev => ({
                ...prev,
                [suggestion]: results || []
              }))
            } catch (err) {
              // Ignorar errores de análisis
            }
          }
        }
      }
      
    } catch (err: any) {
      setAiSuggestions([])
      
      // Extraer mensaje de error amigable
      let errorMessage = 'Error al generar sugerencias con IA'
      if (err.message) {
        if (err.message.includes('does not exist')) {
          errorMessage = `El modelo seleccionado no existe o no está disponible`
        } else if (err.message.includes('API key')) {
          errorMessage = 'Error con la clave API del modelo'
        } else {
          errorMessage = err.message
        }
      }
      setAiError(errorMessage)
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'tours':
        return 'bg-green-50 text-green-700 border border-green-200'
      case 'page':
        return 'bg-gray-50 text-gray-700 border border-gray-300'
      case 'category':
        return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'post_tag':
        return 'bg-purple-50 text-purple-700 border border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="h-3 w-3" />
      case 'tours':
        return <MapPin className="h-3 w-3" />
      case 'page':
        return <FileText className="h-3 w-3" />
      case 'category':
        return <Folder className="h-3 w-3" />
      case 'post_tag':
        return <Tag className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  // Obtener palabras clave existentes en minúsculas para comparación
  const getExistingKeywords = () => {
    if (!yoastResults || yoastResults.length === 0) {
      return []
    }
    return yoastResults.map(r => (r.focus_keyword || '').toLowerCase().trim())
  }

  // Comprobar si una sugerencia existe en el contenido
  const doesSuggestionExist = (suggestion: string): boolean => {
    const existingKeywords = getExistingKeywords()
    return existingKeywords.includes(suggestion.toLowerCase().trim())
  }

  // Filtrar sugerencias de IA para que solo muestren palabras clave ÚNICAS (no existentes)
  const getUniqueAISuggestions = () => {
    if (!yoastResults || yoastResults.length === 0) {
      // Si no hay resultados de Yoast, mostrar todas las sugerencias
      return aiSuggestions
    }

    // Filtrar sugerencias: solo mostrar las que NO existen en Yoast
    return aiSuggestions.filter(suggestion => 
      !doesSuggestionExist(suggestion)
    )
  }

  // Analizar sugerencia: buscar en la API si existe contenido (sin cambiar vista principal)
  const handleAnalyzeSuggestion = async (suggestion: string) => {
    if (!activeWebsite) return
    
    setAnalyzingSuggestion(suggestion)

    try {
      // Buscar por Frases Clave Objetivo para esta sugerencia específica
      const results = await wordpressAnalyticsService.searchFocusKeywords(
        activeWebsite.url,
        suggestion,
        {
          lang: 'es'
        }
      )
      
      // Guardar resultados del análisis para esta sugerencia
      setSuggestionAnalysisResults(prev => ({
        ...prev,
        [suggestion]: results || []
      }))
    } catch (err: any) {
      console.error('Error al analizar:', err)
      setSuggestionAnalysisResults(prev => ({
        ...prev,
        [suggestion]: []
      }))
    } finally {
      setAnalyzingSuggestion(null)
    }
  }

  return (
    <div className="bg-white">
      {/* Alert si no hay sitio web seleccionado */}
      {!activeWebsite && (
        <Alert className="mb-4 border-gray-300 bg-white">
          <AlertCircle className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-700 text-sm">
            Selecciona un sitio web en el selector superior para buscar contenido existente.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Search Form (Sticky) */}
        <div className="lg:col-span-1 bg-white border-2 border-gray-200 rounded-xl p-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2b2b40]">Palabra Clave</h2>
            <p className="text-sm text-gray-600 mt-1">
              Busca o crea nuevo contenido
            </p>
          </div>

          {/* Search Input */}
          <div className="space-y-4">
            {/* AI Model Selector */}
            <div>
              <Label htmlFor="ai-model" className="text-sm font-semibold mb-2 block text-[#2b2b40] flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                Modelo de IA
              </Label>
              {isLoadingModels ? (
                <div className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Cargando modelos...</span>
                </div>
              ) : aiModels.length === 0 ? (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-xs text-orange-800">
                    No hay modelos de IA activos. Contacta al administrador para configurar uno.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-12 border-gray-200 rounded-lg">
                    <SelectValue placeholder="Selecciona un modelo de IA" />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            model.provider === 'Google' ? 'bg-blue-500' : 
                            model.provider === 'OpenAI' ? 'bg-green-500' : 
                            model.provider === 'Anthropic' ? 'bg-orange-500' : 
                            'bg-purple-500'
                          }`} />
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-gray-500">({model.provider})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="keyword" className="text-sm font-semibold mb-2 block text-[#2b2b40]">
                ¿Qué quieres escribir?
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="keyword"
                  type="text"
                  placeholder="Ej: Pantanal Jaguar Safaris"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-12 text-base border-gray-200 rounded-lg"
                  style={{ 
                    outline: 'none',
                    borderColor: '#e5e7eb'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#096'
                    e.target.style.boxShadow = '0 0 0 1px #096'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                  disabled={isSearching || isGeneratingSuggestions}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {/* Selected Model Info */}
            {selectedModel && aiModels.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                <Zap className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-900 font-medium">
                    Usando: {aiModels.find(m => m.id.toString() === selectedModel)?.name}
                  </p>
                  <p className="text-[10px] text-purple-700">
                    {aiModels.find(m => m.id.toString() === selectedModel)?.provider}
                  </p>
                </div>
              </div>
            )}

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isSearching || isGeneratingSuggestions || !keyword.trim() || !selectedModel}
              size="lg"
              className="w-full bg-[#096] hover:bg-[#096]/90 text-white"
            >
              {isSearching || isGeneratingSuggestions ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {isSearching ? 'Buscando...' : 'Generando...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Buscar con IA
                </>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-bold text-[#2b2b40] mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[#f54a00]" />
              Tips
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-[#096] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span>3-6 palabras específicas</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-[#096] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span>Busca contenido existente primero</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-[#096] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span>Usa IA si no existe</span>
              </li>
            </ul>
          </div>

          {/* Ejemplos de palabras clave */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-bold text-[#2b2b40] mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#2b2b40]" />
              Ejemplos
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => setKeyword('avistamiento de jaguares en el pantanal')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm text-[#2b2b40] rounded-lg border border-gray-200 transition-colors"
              >
                avistamiento de jaguares en el pantanal
              </button>
              <button
                onClick={() => setKeyword('tours al pantanal en brasil')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm text-[#2b2b40] rounded-lg border border-gray-200 transition-colors"
              >
                tours al pantanal en brasil
              </button>
              <button
                onClick={() => setKeyword('mejor época para ver jaguares')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm text-[#2b2b40] rounded-lg border border-gray-200 transition-colors"
              >
                mejor época para ver jaguares
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Results */}
        <div className="lg:col-span-2 bg-white border-2 border-gray-200 rounded-xl p-6">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-[#2b2b40] mb-2">Comienza tu búsqueda</h3>
              <p className="text-base text-gray-600 max-w-md">
                Ingresa una palabra clave para buscar contenido o crear algo nuevo
              </p>
            </div>
          ) : isSearching ? (
            // PASO 1: Buscando en API
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-16 w-16 animate-spin text-[#096] mb-4" />
              <p className="text-xl font-bold text-[#2b2b40]">Buscando...</p>
            </div>
          ) : (
            <div>
              {/* Tabs Header */}
              <div className="flex gap-2 border-b-2 border-gray-200 mb-6">
                <button
                  onClick={() => setActiveResultsTab('existing')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                    activeResultsTab === 'existing'
                      ? 'bg-[#096] text-white border-b-2 border-[#096]'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Existente
                  {yoastResults.length > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeResultsTab === 'existing'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {yoastResults.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveResultsTab('suggestions')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                    activeResultsTab === 'suggestions'
                      ? 'bg-[#096] text-white border-b-2 border-[#096]'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isGeneratingSuggestions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Sugerencias IA
                  {isGeneratingSuggestions ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeResultsTab === 'suggestions'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      Generando...
                    </span>
                  ) : (() => {
                    const uniqueSuggestions = getUniqueAISuggestions()
                    const totalSuggestions = (uniqueSuggestions.length > 0 ? uniqueSuggestions : aiSuggestions).length
                    return totalSuggestions > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        activeResultsTab === 'suggestions'
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {totalSuggestions}
                      </span>
                    )
                  })()}
                </button>
                <button
                  onClick={() => setActiveResultsTab('similar')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                    activeResultsTab === 'similar'
                      ? 'bg-[#096] text-white border-b-2 border-[#096]'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isGeneratingSimilar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Similares
                  {isGeneratingSimilar ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeResultsTab === 'similar'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      Generando...
                    </span>
                  ) : similarSuggestions.length > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeResultsTab === 'similar'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {similarSuggestions.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div>
                {/* Contenido Existente Tab */}
                {activeResultsTab === 'existing' && yoastResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#2b2b40]">
                          Contenido Existente
                        </h3>
                        <p className="text-xs text-gray-500">
                          {yoastResults.length} {yoastResults.length === 1 ? 'resultado' : 'resultados'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {yoastResults.map((result) => (
                      <div 
                        key={result.id}
                        className="group flex items-center gap-3 p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-400 rounded-lg transition-all cursor-pointer"
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeColor(result.type)}`}>
                            {getTypeIcon(result.type)}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-1">
                            {result.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-600 truncate max-w-[200px]">
                              {result.focus_keyword || 'Sin keyword'}
                            </span>
                            
                            {result.exact_match !== undefined && (
                              result.exact_match ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-semibold rounded">
                                  <CheckCircle className="h-2.5 w-2.5" />
                                  Exacta
                                </span>
                              ) : result.similarity_percentage ? (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded">
                                  {result.similarity_percentage.toFixed(0)}%
                                </span>
                              ) : null
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!activeWebsite) return
                              
                              const focusKeyword = result.focus_keyword || ''
                              if (!focusKeyword) return
                              
                              setIsGeneratingSimilar(true)
                              setGeneratingSimilarForKeyword(focusKeyword)
                              setBasedOnKeyword(focusKeyword)
                              setSimilarSuggestions([])
                              setSimilarAnalysisResults({})
                              
                              try {
                                if (!selectedModel) {
                                  console.error('No model selected')
                                  return
                                }

                                const allResults = await wordpressAnalyticsService.searchFocusKeywords(
                                  activeWebsite.url,
                                  '',
                                  { lang: 'es', limit: 100 }
                                )
                                
                                const existingKeywords = allResults.map(r => (r.focus_keyword || '').toLowerCase())
                                const modelId = parseInt(selectedModel)
                                const suggestions = await aiService.generateKeywordSuggestions(
                                  focusKeyword,
                                  existingKeywords,
                                  modelId
                                )
                                
                                setSimilarSuggestions(suggestions)
                                
                                const suggestionsToAnalyze = suggestions.slice(0, 5)
                                for (const suggestion of suggestionsToAnalyze) {
                                  try {
                                    const results = await wordpressAnalyticsService.searchFocusKeywords(
                                      activeWebsite.url,
                                      suggestion,
                                      { lang: 'es' }
                                    )
                                    setSimilarAnalysisResults(prev => ({
                                      ...prev,
                                      [suggestion]: results || []
                                    }))
                                  } catch (err) {
                                    console.error(`Error analizando ${suggestion}:`, err)
                                  }
                                }
                                
                                setActiveResultsTab('similar')
                              } catch (err: any) {
                                console.error('Error generando sugerencias similares:', err)
                              } finally {
                                setIsGeneratingSimilar(false)
                                setGeneratingSimilarForKeyword(null)
                              }
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-orange-50 text-orange-600"
                            title="Generar similares"
                            disabled={generatingSimilarForKeyword === result.focus_keyword}
                          >
                            {generatingSimilarForKeyword === result.focus_keyword ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-gray-100 text-gray-600"
                            onClick={() => window.open(result.url, '_blank')}
                            title="Ver contenido"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Sugerencias de IA Tab */}
                {activeResultsTab === 'suggestions' && (
                  <div>
                    {/* Error state */}
                    {aiError && aiSuggestions.length === 0 && !isGeneratingSuggestions ? (
                      <Alert className="mb-4 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <span className="font-semibold">Error al generar sugerencias:</span>
                          <br />
                          {aiError}
                          <br />
                          <span className="text-sm text-red-600 mt-1 block">
                            Por favor, verifica que el modelo de IA esté correctamente configurado.
                          </span>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    
                    {/* Loading state mientras se generan sugerencias */}
                    {isGeneratingSuggestions && aiSuggestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
                        <p className="text-base font-semibold text-[#2b2b40]">Generando sugerencias...</p>
                        <p className="text-sm text-gray-600 mt-1">Analizando palabras clave</p>
                      </div>
                    ) : (() => {
                      const uniqueSuggestions = getUniqueAISuggestions()
                      const shouldShow = uniqueSuggestions.length > 0 || (hasSearched && aiSuggestions.length > 0)
                      return shouldShow ? (
                      <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#2b2b40]">
                            Sugerencias IA
                          </h3>
                          <p className="text-xs text-gray-500">
                            {(uniqueSuggestions.length > 0 ? uniqueSuggestions : aiSuggestions).length} sugerencias generadas
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {(uniqueSuggestions.length > 0 ? uniqueSuggestions : aiSuggestions).map((suggestion, idx) => {
                            const isAnalyzing = analyzingSuggestion === suggestion
                            const analysisResults = suggestionAnalysisResults[suggestion]
                            const hasAnalysisResults = analysisResults !== undefined
                            const foundInAnalysis = hasAnalysisResults && analysisResults.length > 0
                            
                            // Datos SEO simulados
                            const volume = [40, 20, 10, 30, 50][idx % 5]
                            const difficulty = [0, 19, 5, 12, 8][idx % 5]
                            const wordCount = countTotalWords(suggestion)
                            
                            return (
                              <div 
                                key={idx}
                                className="group flex items-center gap-3 p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-emerald-300 rounded-lg transition-all cursor-pointer"
                              >
                                {/* Left - Word Count Badge */}
                                <div className="flex-shrink-0">
                                  <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-emerald-700">{wordCount}w</span>
                                  </div>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-semibold text-gray-900 mb-1.5">
                                    {suggestion}
                                  </h4>
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                                      <BarChart3 className="h-3 w-3" />
                                      {volume}
                                    </span>
                                    
                                    <TrendChart pattern={idx} />
                                    
                                    <DifficultyIndicator value={difficulty} />
                                    
                                    {hasAnalysisResults && (
                                      foundInAnalysis ? (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-semibold rounded">
                                          <XCircle className="h-2.5 w-2.5" />
                                          Existe
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded">
                                          <Check className="h-2.5 w-2.5" />
                                          Disponible
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1.5">
                                  {!hasAnalysisResults && (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAnalyzeSuggestion(suggestion)
                                      }}
                                      disabled={isAnalyzing}
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:bg-emerald-50 text-emerald-600"
                                      title="Verificar disponibilidad"
                                    >
                                      {isAnalyzing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <SearchCheck className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  )}
                                  
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setKeyword(suggestion)
                                      handleUseKeyword(suggestion)
                                    }}
                                    size="sm"
                                    className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    title="Usar esta palabra clave"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Usar
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                    </div>
                  </div>
                      ) : null
                    })()}
                  </div>
                )}

                {/* No Yoast Results - Congratulations Message */}
                {activeResultsTab === 'existing' && yoastResults.length === 0 && hasSearched && (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200 rounded-lg p-8">
                    <CheckCircle className="h-12 w-12 mb-4" style={{ color: '#096' }} />
                    <p className="text-lg font-semibold mb-2" style={{ color: '#2b2b40' }}>
                      Palabra clave disponible
                    </p>
                    <p className="text-sm text-gray-600 mb-6 max-w-md">
                      No existe contenido con esta frase clave. Puedes crear algo nuevo.
                    </p>
                    <Button
                      onClick={() => {
                        setKeyword(keyword)
                        handleUseKeyword(keyword)
                      }}
                      className="h-11 px-6 text-sm font-medium rounded-lg text-white transition-colors"
                      style={{ backgroundColor: '#f54a00' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d44700'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f54a00'}
                    >
                      Crear Contenido
                    </Button>
                  </div>
                )}

                {/* Tab de Similares - Basado en palabra clave existente */}
                {activeResultsTab === 'similar' && (
                  <div>
                    {/* Loading state mientras se generan sugerencias similares */}
                    {isGeneratingSimilar && similarSuggestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-orange-600 mb-4" />
                        <p className="text-base font-semibold text-[#2b2b40]">Generando sugerencias similares...</p>
                        <p className="text-sm text-gray-600 mt-1">Basado en: <span className="font-semibold">{basedOnKeyword}</span></p>
                      </div>
                    ) : similarSuggestions.length > 0 ? (
                      <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#2b2b40]">
                            Sugerencias Similares
                          </h3>
                          <p className="text-xs text-gray-500">
                            {similarSuggestions.length} basadas en <span className="font-semibold text-[#2b2b40]">{basedOnKeyword}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {similarSuggestions.map((suggestion, idx) => {
                            const isAnalyzing = analyzingSuggestion === suggestion
                            const analysisResults = similarAnalysisResults[suggestion]
                            const hasAnalysisResults = analysisResults !== undefined
                            const foundInAnalysis = hasAnalysisResults && analysisResults.length > 0
                            
                            // Datos SEO simulados
                            const volume = [40, 20, 10, 30, 50][idx % 5]
                            const difficulty = [0, 19, 5, 12, 8][idx % 5]
                            const wordCount = countTotalWords(suggestion)
                            
                            return (
                              <div 
                                key={idx}
                                className="group flex items-center gap-3 p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-orange-300 rounded-lg transition-all cursor-pointer"
                              >
                                {/* Left - Word Count Badge */}
                                <div className="flex-shrink-0">
                                  <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-orange-700">{wordCount}w</span>
                                  </div>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-semibold text-gray-900 mb-1.5">
                                    {suggestion}
                                  </h4>
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                                      <BarChart3 className="h-3 w-3" />
                                      {volume}
                                    </span>
                                    
                                    <TrendChart pattern={idx} />
                                    
                                    <DifficultyIndicator value={difficulty} />
                                    
                                    {hasAnalysisResults && (
                                      foundInAnalysis ? (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-semibold rounded">
                                          <XCircle className="h-2.5 w-2.5" />
                                          Existe
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-semibold rounded">
                                          <Check className="h-2.5 w-2.5" />
                                          Disponible
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      if (!activeWebsite) return
                                      
                                      setAnalyzingSuggestion(suggestion)
                                      
                                      try {
                                        const results = await wordpressAnalyticsService.searchFocusKeywords(
                                          activeWebsite.url,
                                          suggestion,
                                          { lang: 'es' }
                                        )
                                        
                                        setSimilarAnalysisResults(prev => ({
                                          ...prev,
                                          [suggestion]: results || []
                                        }))
                                      } catch (err) {
                                        console.error('Error al analizar:', err)
                                        setSimilarAnalysisResults(prev => ({
                                          ...prev,
                                          [suggestion]: []
                                        }))
                                      } finally {
                                        setAnalyzingSuggestion(null)
                                      }
                                    }}
                                    disabled={isAnalyzing}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 hover:bg-orange-50 text-orange-600"
                                    title="Verificar disponibilidad"
                                  >
                                    {isAnalyzing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <SearchCheck className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setKeyword(suggestion)
                                      handleUseKeyword(suggestion)
                                    }}
                                    size="sm"
                                    className="h-7 px-3 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                                    title="Usar esta palabra clave"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Usar
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                    </div>
                  </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 text-lg font-medium mb-2">
                          No hay sugerencias similares aún
                        </p>
                        <p className="text-gray-500 text-sm max-w-md text-center">
                          Haz clic en el botón ✨ junto a cualquier palabra clave en "Contenido Existente" para generar sugerencias similares.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Section - 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Card 1: Búsqueda Inteligente */}
        <div className="bg-white rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Búsqueda Inteligente</h3>
              <p className="text-xs text-gray-600 mt-1">Cómo funciona el sistema</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Frases Clave Objetivo</p>
                <p className="text-xs text-gray-600">Busca en las frases clave de Yoast SEO de todos los tipos de contenido.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Sugerencias IA</p>
                <p className="text-xs text-gray-600">Gemini sugiere palabras clave nuevas y relevantes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Validación Automática</p>
                <p className="text-xs text-gray-600">Verifica si las sugerencias ya existen.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Mejores Prácticas */}
        <div className="bg-white rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Mejores Prácticas</h3>
              <p className="text-xs text-gray-600 mt-1">Tips para elegir keywords</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Específicas</p>
                <p className="text-xs text-gray-600">Usa 3-6 palabras para mejor precisión.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Relevantes</p>
                <p className="text-xs text-gray-600">Relacionadas con tu nicho y audiencia.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Únicas</p>
                <p className="text-xs text-gray-600">Evita duplicar contenido existente.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Proceso Paso a Paso */}
        <div className="bg-white rounded-xl shadow-lg border-0 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Proceso</h3>
              <p className="text-xs text-gray-600 mt-1">Pasos siguientes</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-sm">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Selecciona Keyword</p>
                <p className="text-xs text-gray-600">Existente o nueva sugerencia de IA.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-sm">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Genera Títulos</p>
                <p className="text-xs text-gray-600">IA crea títulos optimizados para SEO.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-sm">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Crea Contenido</p>
                <p className="text-xs text-gray-600">Artículo completo generado por IA.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Keywords Modal */}
      <Dialog open={showAdditionalKeywordsModal} onOpenChange={setShowAdditionalKeywordsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Palabras Clave Adicionales
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Agrega palabras clave adicionales para mejorar la generación de títulos. Estas palabras se usarán para crear títulos más relevantes y específicos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selected keyword badge */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Palabra clave principal:</span>
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {selectedKeywordForSubmit}
              </Badge>
            </div>

            {/* Additional keywords textarea */}
            <div className="space-y-2">
              <Label htmlFor="additional-keywords" className="text-sm font-medium">
                Palabras clave adicionales (opcional)
              </Label>
              <Textarea
                id="additional-keywords"
                placeholder="Ejemplo: tours guiados, observación de fauna, aventura amazónica"
                value={additionalKeywords}
                onChange={(e) => setAdditionalKeywords(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Separa las palabras clave con comas. Se usarán para enriquecer la generación de títulos.
              </p>
            </div>

            {/* Info box */}
            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700">
                <strong>Consejo:</strong> Agrega palabras relacionadas con tu nicho, ubicación geográfica, o términos específicos que quieras incluir en los títulos generados.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAdditionalKeywordsModal(false)
                setAdditionalKeywords('')
                setSelectedKeywordForSubmit('')
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Continuar a Paso 2
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
