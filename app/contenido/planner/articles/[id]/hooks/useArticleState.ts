import { useState, useEffect, useRef } from 'react'
import { plannerArticlesService, type PlannerArticle } from '@/lib/api/planner-articles'

export interface ArticleState {
  // Estados principales
  article: PlannerArticle | null
  loading: boolean
  error: string | null
  deleting: boolean
  saving: boolean
  
  // Estados del editor
  editedContent: string
  editorKey: number
  
  // Estados de idioma y traducción
  currentLanguage: string
  loadingTranslation: boolean
  currentTranslationData: any
  
  // Estados de UI
  activeTab: 'analytics' | 'seo' | 'wordpress'
  showLanguageMenu: boolean
  showGooglePreview: boolean
  
  // Estados de publicación
  postStatus: 'publish' | 'draft'
  publishProgress: number
  currentPublishStep: string
  publishedPostUrl?: string
  publishedPostId?: number
  
  // Estados de traducción
  translating: boolean
  translationProgress: number
  currentTranslationStep: string
  isStreamingTranslation: boolean
  targetLanguageName: string
  
  // Estados de humanización
  humanizing: boolean
  humanizeProgress: number
  currentHumanizeStep: string
  isStreamingHumanize: boolean
  
  // Estados de optimización
  optimizingReadability: boolean
  
  // Estados de modelos AI
  selectedHumanizeModelId: number | null
  showModelSelector: boolean
  availableModels: any[]
  isLoadingModels: boolean
  
  // Auto-guardado
  isAutoSaving: boolean
  lastSavedContentRef: React.MutableRefObject<string>
  autoSaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
}

export interface ArticleActions {
  // Acciones principales
  setArticle: React.Dispatch<React.SetStateAction<PlannerArticle | null>>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setDeleting: (deleting: boolean) => void
  setSaving: (saving: boolean) => void
  
  // Acciones del editor
  setEditedContent: (content: string) => void
  setEditorKey: (key: number | ((prev: number) => number)) => void
  
  // Acciones de idioma y traducción
  setCurrentLanguage: (language: string) => void
  setLoadingTranslation: (loading: boolean) => void
  setCurrentTranslationData: (data: any) => void
  
  // Acciones de UI
  setActiveTab: (tab: 'analytics' | 'seo' | 'wordpress') => void
  setShowLanguageMenu: (show: boolean) => void
  setShowGooglePreview: (show: boolean) => void
  
  // Acciones de publicación
  setPostStatus: (status: 'publish' | 'draft') => void
  setPublishProgress: (progress: number) => void
  setCurrentPublishStep: (step: string) => void
  setPublishedPostUrl: (url: string | undefined) => void
  setPublishedPostId: (id: number | undefined) => void
  
  // Acciones de traducción
  setTranslating: (translating: boolean) => void
  setTranslationProgress: (progress: number) => void
  setCurrentTranslationStep: (step: string) => void
  setIsStreamingTranslation: (streaming: boolean) => void
  setTargetLanguageName: (name: string) => void
  
  // Acciones de humanización
  setHumanizing: (humanizing: boolean) => void
  setHumanizeProgress: (progress: number) => void
  setCurrentHumanizeStep: (step: string) => void
  setIsStreamingHumanize: (streaming: boolean) => void
  
  // Acciones de optimización
  setOptimizingReadability: (optimizing: boolean) => void
  
  // Acciones de modelos AI
  setSelectedHumanizeModelId: (id: number | null) => void
  setShowModelSelector: (show: boolean) => void
  setAvailableModels: (models: any[]) => void
  setIsLoadingModels: (loading: boolean) => void
  
  // Acciones de auto-guardado
  setIsAutoSaving: (saving: boolean) => void
  
  // Funciones de carga
  loadArticle: (articleId: number) => Promise<void>
  loadModels: () => Promise<void>
}

export function useArticleState(articleId: number | null): ArticleState & ArticleActions {
  // Estados principales
  const [article, setArticle] = useState<PlannerArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Estados del editor
  const [editedContent, setEditedContent] = useState('')
  const [editorKey, setEditorKey] = useState(0)
  
  // Estados de idioma y traducción
  const [currentLanguage, setCurrentLanguage] = useState<string>('es')
  const [loadingTranslation, setLoadingTranslation] = useState(false)
  const [currentTranslationData, setCurrentTranslationData] = useState<any>(null)
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'analytics' | 'seo' | 'wordpress'>('analytics')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showGooglePreview, setShowGooglePreview] = useState(false)
  
  // Estados de publicación
  const [postStatus, setPostStatus] = useState<'publish' | 'draft'>('publish')
  const [publishProgress, setPublishProgress] = useState(0)
  const [currentPublishStep, setCurrentPublishStep] = useState('')
  const [publishedPostUrl, setPublishedPostUrl] = useState<string>()
  const [publishedPostId, setPublishedPostId] = useState<number>()
  
  // Estados de traducción
  const [translating, setTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [currentTranslationStep, setCurrentTranslationStep] = useState('')
  const [isStreamingTranslation, setIsStreamingTranslation] = useState(false)
  const [targetLanguageName, setTargetLanguageName] = useState<string>('')
  
  // Estados de humanización
  const [humanizing, setHumanizing] = useState(false)
  const [humanizeProgress, setHumanizeProgress] = useState(0)
  const [currentHumanizeStep, setCurrentHumanizeStep] = useState('')
  const [isStreamingHumanize, setIsStreamingHumanize] = useState(false)
  
  // Estados de optimización
  const [optimizingReadability, setOptimizingReadability] = useState(false)
  
  // Estados de modelos AI
  const [selectedHumanizeModelId, setSelectedHumanizeModelId] = useState<number | null>(null)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  
  // Auto-guardado
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const lastSavedContentRef = useRef('')
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Función para cargar artículo
  const loadArticle = async () => {
    if (!articleId) return
    setLoading(true)
    setError(null)
    try {
      const data = await plannerArticlesService.getById(articleId)
      setArticle(data)
      
      // Establecer idioma actual al idioma principal del artículo
      setCurrentLanguage(data.language || 'es')
      
      // El contenido ya viene en HTML desde el backend
      setEditedContent(data.content || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el artículo')
    } finally {
      setLoading(false)
    }
  }
  
  // Función para cargar modelos
  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const { aiModelsService } = await import('@/lib/api/ai-models')
      const models = await aiModelsService.getActiveModels()
      setAvailableModels(models)
      
      // Seleccionar el primer modelo activo automáticamente
      if (models.length > 0 && !selectedHumanizeModelId) {
        setSelectedHumanizeModelId(models[0].id)
      }
    } catch (err) {
      console.error('Error loading models:', err)
    } finally {
      setIsLoadingModels(false)
    }
  }
  
  // Efectos
  useEffect(() => {
    if (articleId) loadArticle()
  }, [articleId])

  useEffect(() => {
    loadModels()
  }, [])

  useEffect(() => {
    if (article?.content) {
      console.log('📄 Cargando contenido del artículo (HTML)')
      setEditedContent(article.content)
      setEditorKey(prev => prev + 1)
    }
  }, [article?.content, articleId])

  // Restaurar estado de publicación cuando se carga el artículo
  useEffect(() => {
    const displayArticle = currentTranslationData || article
    if (displayArticle?.wordpress_status) {
      setPostStatus(displayArticle.wordpress_status as 'publish' | 'draft')
      console.log('📋 Estado de publicación restaurado:', displayArticle.wordpress_status)
    }
  }, [currentTranslationData, article])

  // Inicializar lastSavedContentRef cuando se carga el contenido
  useEffect(() => {
    if (editedContent && !lastSavedContentRef.current) {
      lastSavedContentRef.current = editedContent
    }
  }, [editedContent])
  
  return {
    // Estados
    article,
    loading,
    error,
    deleting,
    saving,
    editedContent,
    editorKey,
    currentLanguage,
    loadingTranslation,
    currentTranslationData,
    activeTab,
    showLanguageMenu,
    showGooglePreview,
    postStatus,
    publishProgress,
    currentPublishStep,
    publishedPostUrl,
    publishedPostId,
    translating,
    translationProgress,
    currentTranslationStep,
    isStreamingTranslation,
    targetLanguageName,
    humanizing,
    humanizeProgress,
    currentHumanizeStep,
    isStreamingHumanize,
    optimizingReadability,
    selectedHumanizeModelId,
    showModelSelector,
    availableModels,
    isLoadingModels,
    isAutoSaving,
    lastSavedContentRef,
    autoSaveTimeoutRef,
    
    // Acciones
    setArticle,
    setLoading,
    setError,
    setDeleting,
    setSaving,
    setEditedContent,
    setEditorKey,
    setCurrentLanguage,
    setLoadingTranslation,
    setCurrentTranslationData,
    setActiveTab,
    setShowLanguageMenu,
    setShowGooglePreview,
    setPostStatus,
    setPublishProgress,
    setCurrentPublishStep,
    setPublishedPostUrl,
    setPublishedPostId,
    setTranslating,
    setTranslationProgress,
    setCurrentTranslationStep,
    setIsStreamingTranslation,
    setTargetLanguageName,
    setHumanizing,
    setHumanizeProgress,
    setCurrentHumanizeStep,
    setIsStreamingHumanize,
    setOptimizingReadability,
    setSelectedHumanizeModelId,
    setShowModelSelector,
    setAvailableModels,
    setIsLoadingModels,
    setIsAutoSaving,
    loadArticle,
    loadModels
  }
}
