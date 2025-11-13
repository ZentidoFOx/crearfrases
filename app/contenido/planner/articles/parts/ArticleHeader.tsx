"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  Send,
  Trash2,
  Loader2,
  Globe,
  Eye,
  RefreshCw,
  ChevronDown,
  Check,
  Plus,
  Languages,
  AlertTriangle,
  X,
  Sparkles,
  Cpu,
  CheckCircle2
} from 'lucide-react'

interface ArticleHeaderProps {
  article: any
  saving: boolean
  deleting: boolean
  currentLanguage: string
  loadingTranslation: boolean
  availableModels: any[]
  selectedModelId: number
  onModelChange: (modelId: number) => void
  showLanguageMenu: boolean
  setShowLanguageMenu: (show: boolean) => void
  languagesHook: any
  onTranslate: (langCode: string) => void
  onLanguageChange: (langCode: string) => void
  onSave: () => void
  onDelete: () => void
  onGooglePreview: () => void
  onDeleteTranslation: () => void
  humanizing?: boolean
  onHumanize?: () => void
  optimizingReadability?: boolean
  onOptimizeReadability?: () => void
  autoSaveIndicator?: React.ReactNode
}

export function ArticleHeader({
  article,
  saving,
  deleting,
  humanizing = false,
  optimizingReadability = false,
  currentLanguage = 'es',
  loadingTranslation = false,
  selectedModelId,
  availableModels = [],
  onModelChange,
  onSave,
  onDelete,
  showLanguageMenu,
  setShowLanguageMenu,
  languagesHook,
  onTranslate,
  onLanguageChange,
  onGooglePreview,
  onDeleteTranslation,
  onHumanize,
  onOptimizeReadability,
  autoSaveIndicator
}: ArticleHeaderProps) {
  const router = useRouter()
  const [showTranslateModal, setShowTranslateModal] = useState(false)
  const [selectedLangToTranslate, setSelectedLangToTranslate] = useState<{ code: string, name: string } | null>(null)
  const [showModelMenu, setShowModelMenu] = useState(false)
  
  // Verificar si estamos viendo una traducción (no el idioma principal)
  const isViewingTranslation = currentLanguage !== (article.language || 'es')
  
  // Obtener el modelo seleccionado
  const selectedModel = availableModels.find(m => m.id === selectedModelId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-200 text-gray-800'
      case 'pending': return 'bg-yellow-200 text-yellow-800'
      case 'published': return 'bg-green-200 text-green-800'
      case 'rejected': return 'bg-red-200 text-red-800'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador'
      case 'pending': return 'Pendiente'
      case 'published': return 'Publicado'
      case 'rejected': return 'Rechazado'
      default: return status
    }
  }

  return (
    <div className="bg-white border-b">
      <div className="px-6 py-2.5 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 px-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Volver
          </Button>
          
          <Badge className={getStatusColor(article.status) + " text-xs"}>
            {getStatusLabel(article.status)}
          </Badge>

          {/* AI Model Selector */}
          <div className="relative ml-4">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-all"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-900">
                {selectedModel ? selectedModel.name : 'Modelo de IA'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
            </button>

            {showModelMenu && (
              <>
                {/* Overlay para cerrar al hacer clic fuera */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowModelMenu(false)}
                />
                
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {availableModels.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-bold text-gray-900">Modelo de IA</span>
                        </div>
                      </div>

                      {/* Modelos */}
                      <div className="p-2 max-h-80 overflow-y-auto">
                        {availableModels.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No hay modelos disponibles</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {availableModels.map((model: any) => {
                              const isGoogle = model.provider === 'Google'
                              const isOpenAI = model.provider === 'OpenAI'
                              const dotColor = isGoogle ? '#4285F4' : isOpenAI ? '#10a37f' : '#9333ea'
                              
                              return (
                                <div
                                  key={model.id}
                                  onClick={() => {
                                    if (onModelChange) onModelChange(model.id)
                                    setShowModelMenu(false)
                                  }}
                                  className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all ${
                                    selectedModelId === model.id 
                                      ? 'bg-gray-50' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {/* Dot indicator - pequeño */}
                                    <div 
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: dotColor }}
                                    />
                                    
                                    {/* Nombre y proveedor en la misma línea */}
                                    <span className="text-sm text-gray-900 truncate leading-none">
                                      {model.name}
                                    </span>
                                    <span className="text-xs text-gray-400 flex-shrink-0 leading-none">
                                      ({model.provider})
                                    </span>
                                  </div>
                                  
                                  {selectedModelId === model.id && (
                                    <Check className="h-4 w-4 text-gray-900 flex-shrink-0 ml-2" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
            >
              {(() => {
                const currentLangData = languagesHook.languages.find((l: any) => l.code === currentLanguage)
                return currentLangData?.flag ? (
                  <img 
                    src={currentLangData.flag} 
                    alt={currentLangData.name} 
                    className="w-5 h-4 object-cover rounded shadow-sm" 
                  />
                ) : (
                  <Languages className="h-4 w-4" style={{ color: '#9810fa' }} />
                )
              })()}
              <span className="text-sm font-semibold" style={{ color: '#000000' }}>{currentLanguage?.toUpperCase() || 'ES'}</span>
              {article.available_languages && article.available_languages.length > 1 && (
                <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#9810fa' }}>
                  {article.available_languages.length}
                </span>
              )}
              {loadingTranslation ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#9810fa' }} />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
              )}
            </button>

            {showLanguageMenu && (
              <>
                {/* Overlay para cerrar al hacer clic fuera */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLanguageMenu(false)}
                />
                
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {languagesHook.isLoadingLanguages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="px-3 py-2 border-b border-gray-200" style={{ backgroundColor: 'rgba(152, 16, 250, 0.03)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5" style={{ color: '#9810fa' }} />
                            <span className="text-xs font-bold" style={{ color: '#000000' }}>Gestión de Idiomas</span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {article.available_languages?.length || 1} idioma(s)
                          </span>
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="p-2.5 max-h-80 overflow-y-auto">
                        {/* Idioma Principal */}
                        <div className="mb-2.5">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-1.5 mb-1.5">
                            Idioma Principal
                          </div>
                          <div
                            onClick={() => {
                              if (onLanguageChange) onLanguageChange(article.language || 'es')
                              setShowLanguageMenu(false)
                            }}
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all border"
                            style={{
                              backgroundColor: currentLanguage === (article.language || 'es') ? 'rgba(152, 16, 250, 0.05)' : 'transparent',
                              borderColor: currentLanguage === (article.language || 'es') ? '#9810fa' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              if (currentLanguage !== (article.language || 'es')) {
                                e.currentTarget.style.backgroundColor = '#f9fafb'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (currentLanguage !== (article.language || 'es')) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              {(() => {
                                const mainLangData = languagesHook.languages.find((l: any) => l.code === (article.language || 'es'))
                                return mainLangData?.flag ? (
                                  <img 
                                    src={mainLangData.flag} 
                                    alt={mainLangData.name} 
                                    className="w-6 h-5 object-cover rounded shadow-sm border border-gray-200" 
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-6 h-5 rounded shadow-sm border border-gray-200" style={{ backgroundColor: '#9810fa' }}>
                                    <Globe className="h-3 w-3 text-white" />
                                  </div>
                                )
                              })()}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs" style={{ color: '#000000' }}>
                                    {article.language?.toUpperCase() || 'ES'}
                                  </span>
                                  <span className="text-[10px] text-gray-500">(Principal)</span>
                                </div>
                              </div>
                            </div>
                            {currentLanguage === (article.language || 'es') && (
                              <Check className="h-4 w-4" style={{ color: '#9810fa' }} />
                            )}
                          </div>
                        </div>
                        
                        {/* Todos los idiomas disponibles */}
                        <div className="mb-2.5">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-1.5 mb-1.5">
                            Idiomas
                          </div>
                          <div className="space-y-1">
                            {languagesHook.languages
                              .filter((lang: any) => lang.code !== (article.language || 'es')) // Excluir idioma principal
                              .map((lang: any) => {
                                const hasTranslation = article.available_languages?.includes(lang.code)
                                return (
                                  <div
                                    key={lang.code}
                                    onClick={() => {
                                      console.log('🖱️ [HEADER] Clic en idioma:', lang.code, lang.name)
                                      if (onLanguageChange) {
                                        console.log('🔄 [HEADER] Llamando onLanguageChange')
                                        onLanguageChange(lang.code)
                                      }
                                      setShowLanguageMenu(false)
                                    }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all border"
                                    style={{
                                      backgroundColor: currentLanguage === lang.code ? 'rgba(152, 16, 250, 0.05)' : 'transparent',
                                      borderColor: currentLanguage === lang.code ? '#9810fa' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (currentLanguage !== lang.code) {
                                        e.currentTarget.style.backgroundColor = '#f9fafb'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (currentLanguage !== lang.code) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }
                                    }}
                                  >
                                    {lang.flag ? (
                                      <img 
                                        src={lang.flag} 
                                        alt={lang.name} 
                                        className="w-6 h-5 object-cover rounded shadow-sm border border-gray-200" 
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center w-6 h-5 bg-gray-100 rounded">
                                        <Globe className="h-3 w-3 text-gray-400" />
                                      </div>
                                    )}
                                    <span className="text-xs font-medium text-gray-700">
                                      {lang.name}
                                    </span>
                                    <div className="ml-auto flex items-center gap-2">
                                      {hasTranslation && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Traducción disponible" />
                                      )}
                                      {currentLanguage === lang.code && (
                                        <Check className="h-3.5 w-3.5 text-purple-600" />
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Botones para traducción */}
          {isViewingTranslation ? (
            /* Botones cuando se está viendo una TRADUCCIÓN (sin Humanizar ni Traducir) */
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onGooglePreview}
                className="h-8 px-4 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </Button>

              {/* SEO Optimizer para traducciones */}
              {onOptimizeReadability && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOptimizeReadability}
                  disabled={optimizingReadability}
                  className="h-8 px-4 border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  {optimizingReadability ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Optimizando
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      SEO Optimizer
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteTranslation}
                disabled={deleting}
                className="h-8 w-8 p-0"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : (
            /* Botones para artículo original */
            <>
              {onOptimizeReadability && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOptimizeReadability}
                  disabled={optimizingReadability}
                  className="h-8 px-4 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {optimizingReadability ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Optimizando
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      SEO Optimizer
                    </>
                  )}
                </Button>
              )}

              {/* Botón Generar Traducción */}
              {languagesHook.languages.filter((lang: any) => !article.available_languages?.includes(lang.code)).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Encontrar el primer idioma disponible para traducir
                    const firstLang = languagesHook.languages.find((lang: any) => !article.available_languages?.includes(lang.code))
                    if (firstLang) {
                      console.log('🚀 [HEADER] Iniciando traducción automática para:', firstLang.code)
                      setSelectedLangToTranslate({ code: firstLang.code, name: firstLang.name })
                      setShowTranslateModal(true)
                    }
                  }}
                  className="h-8 px-4 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Generar Traducción
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onGooglePreview}
                className="h-8 px-4 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </Button>

              {article.status === 'draft' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={deleting}
                  className="h-8 w-8 p-0"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Traducción */}
      {showTranslateModal && selectedLangToTranslate && (
        console.log('🎭 [MODAL] Renderizando modal para:', selectedLangToTranslate),
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setShowTranslateModal(false)}
          >
            {/* Modal */}
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <AlertTriangle className="h-5 w-5" style={{ color: '#ff6900' }} />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: '#000000' }}>Antes de Traducir</h3>
                </div>
                <button
                  onClick={() => setShowTranslateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Por favor, verifica lo siguiente antes de traducir a <span className="font-semibold" style={{ color: '#000000' }}>{selectedLangToTranslate.name}</span>:
                </p>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#009689' }} />
                    <span className="text-sm text-gray-700">Asegúrate de haber añadido todas las imágenes necesarias</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#009689' }} />
                    <span className="text-sm text-gray-700">Corrige cualquier error de ortografía o redacción</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#009689' }} />
                    <span className="text-sm text-gray-700">Verifica que el contenido esté completo</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTranslateModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      onTranslate(selectedLangToTranslate.code)
                      setShowTranslateModal(false)
                      setSelectedLangToTranslate(null)
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#9810fa' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8a0ee0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9810fa'}
                  >
                    Continuar Traducción
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
