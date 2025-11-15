"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Languages,
  Globe,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  Download,
  Copy,
  CheckCheck
} from 'lucide-react'
import { translatorService, type TranslationData } from '@/lib/api/translator'
import { PreTranslationValidator } from '@/components/seo/PreTranslationValidator'
import { validateForTranslation } from '@/lib/utils/pre-translation-validator'

interface Translation {
  language: string
  languageName: string
  title: string
  h1Title: string
  description: string
  keyword: string
  objectivePhrase: string
  keywords: string[]
  content: string
  translatedAt: string
}

interface TranslationTabProps {
  article: any
  editedContent: string
  onTranslationComplete?: (translation: Translation) => void
  onContentUpdate?: (newContent: string) => void
  modelId?: number
}

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
]

export function TranslationTab({
  article,
  editedContent,
  onTranslationComplete,
  onContentUpdate,
  modelId
}: TranslationTabProps) {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [translating, setTranslating] = useState<string | null>(null)
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // 🚦 Validar artículo antes de traducir
  const validation = useMemo(() => {
    if (!article || !editedContent || !article.keyword) {
      return {
        isValid: false,
        score: 0,
        criticalIssues: [],
        warnings: [],
        infos: [],
        allIssues: [],
        canTranslate: false
      }
    }

    return validateForTranslation({
      title: article.title,
      content: editedContent,
      keyword: article.keyword,
      h1Title: article.h1_title,
      metaDescription: article.meta_description
    })
  }, [article, editedContent])

  const handleTranslate = async (languageCode: string, languageName: string) => {
    // 🚫 BLOQUEAR si no pasa validación
    if (!validation.canTranslate) {
      alert(`⚠️ No se puede traducir aún\n\nDebes corregir ${validation.criticalIssues.length} problema(s) crítico(s) antes de traducir.\n\nLas traducciones heredan la estructura del artículo original, por lo que debe estar perfectamente optimizado.`)
      return
    }

    setTranslating(languageCode)
    
    try {
      // Preparar datos para traducción
      const translationData: TranslationData = {
        title: article.title,
        h1Title: article.h1_title || article.title,
        description: article.meta_description || '',
        keyword: article.keyword,
        objectivePhrase: article.objective_phrase || '',
        keywords: article.keywords_array || [],
        content: editedContent
      }

      // Llamar al servicio de traducción con streaming
      const result = await translatorService.translateWithStreaming(
        translationData,
        languageCode,
        languageName,
        // Callback vacío para chunks (no mostramos en tiempo real aquí)
        () => {},
        // Opciones
        {
          modelId: 1 // Modelo por defecto
        }
      )

      // Crear objeto de traducción
      const newTranslation: Translation = {
        language: languageCode,
        languageName: languageName,
        title: result.title,
        h1Title: result.h1Title,
        description: result.description,
        keyword: result.keyword,
        objectivePhrase: result.objectivePhrase,
        keywords: result.keywords,
        content: result.content,
        translatedAt: new Date().toISOString()
      }

      // Agregar a la lista de traducciones
      setTranslations(prev => {
        const filtered = prev.filter(t => t.language !== languageCode)
        return [...filtered, newTranslation]
      })

      // Callback
      if (onTranslationComplete) {
        onTranslationComplete(newTranslation)
      }

    } catch (error) {
      console.error('Error translating:', error)
      alert(`Error al traducir: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setTranslating(null)
    }
  }

  const handleDeleteTranslation = (languageCode: string) => {
    setTranslations(prev => prev.filter(t => t.language !== languageCode))
    if (selectedTranslation?.language === languageCode) {
      setSelectedTranslation(null)
    }
  }

  const handleCopyField = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Error copying:', error)
    }
  }

  const handleDownloadTranslation = (translation: Translation) => {
    const content = `# ${translation.h1Title}

**Idioma:** ${translation.languageName}
**Título SEO:** ${translation.title}
**Meta Descripción:** ${translation.description}
**Palabra Clave:** ${translation.keyword}
**Frase Objetivo:** ${translation.objectivePhrase}
**Keywords Relacionadas:** ${translation.keywords.join(', ')}

---

${translation.content}
`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${article.title.toLowerCase().replace(/\s+/g, '-')}-${translation.language}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const isTranslated = (languageCode: string) => {
    return translations.some(t => t.language === languageCode)
  }

  return (
    <div className="space-y-3">
      {/* 🚦 Pre-Translation Validator */}
      {onContentUpdate && (
        <PreTranslationValidator
          content={editedContent}
          keyword={article.keyword}
          title={article.title}
          onContentUpdate={onContentUpdate}
          modelId={modelId}
        />
      )}

      {/* Available Languages Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-800">Idiomas Disponibles</h3>
          <Badge variant="outline" className="ml-auto text-xs">
            {translations.length} / {AVAILABLE_LANGUAGES.length}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_LANGUAGES.map(lang => {
            const translated = isTranslated(lang.code)
            const isTranslatingThis = translating === lang.code

            return (
              <Button
                key={lang.code}
                onClick={() => !translated && !translating && handleTranslate(lang.code, lang.name)}
                disabled={translating !== null}
                variant={translated ? 'outline' : 'default'}
                className={`h-auto py-3 px-4 justify-start ${
                  translated
                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-semibold ${translated ? 'text-green-700' : 'text-white'}`}>
                      {lang.nativeName}
                    </div>
                    <div className={`text-xs ${translated ? 'text-green-600' : 'text-blue-100'}`}>
                      {lang.name}
                    </div>
                  </div>
                  {isTranslatingThis && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {translated && !isTranslatingThis && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </Button>
            )
          })}
        </div>

        {translating && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Traduciendo a {translatorService.getLanguageName(translating)}...</span>
            </div>
          </div>
        )}
      </div>

      {/* Translations List */}
      {translations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="h-5 w-5 text-purple-600" />
            <h3 className="text-sm font-bold text-gray-800">Traducciones Completadas</h3>
          </div>

          <div className="space-y-2">
            {translations.map(translation => {
              const lang = AVAILABLE_LANGUAGES.find(l => l.code === translation.language)
              const isSelected = selectedTranslation?.language === translation.language

              return (
                <div
                  key={translation.language}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-3xl">{lang?.flag}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-900">
                            {translation.languageName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {translation.language.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {translation.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Traducido: {new Date(translation.translatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTranslation(isSelected ? null : translation)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadTranslation(translation)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTranslation(translation.language)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Translation Preview */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-purple-200 space-y-3">
                      {/* SEO Title */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-600">Título SEO</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyField(translation.title, 'title')}
                            className="h-6 px-2 text-xs"
                          >
                            {copiedField === 'title' ? (
                              <>
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                          {translation.title}
                        </div>
                      </div>

                      {/* H1 Title */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-600">Título H1</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyField(translation.h1Title, 'h1')}
                            className="h-6 px-2 text-xs"
                          >
                            {copiedField === 'h1' ? (
                              <>
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="text-sm text-gray-900 bg-white p-2 rounded border">
                          {translation.h1Title}
                        </div>
                      </div>

                      {/* Meta Description */}
                      {translation.description && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-600">Meta Descripción</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyField(translation.description, 'desc')}
                              className="h-6 px-2 text-xs"
                            >
                              {copiedField === 'desc' ? (
                                <>
                                  <CheckCheck className="h-3 w-3 mr-1" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="text-xs text-gray-700 bg-white p-2 rounded border">
                            {translation.description}
                          </div>
                        </div>
                      )}

                      {/* Focus Keyword */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-600">Palabra Clave</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyField(translation.keyword, 'keyword')}
                            className="h-6 px-2 text-xs"
                          >
                            {copiedField === 'keyword' ? (
                              <>
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                        <Badge className="bg-purple-600 text-white">
                          {translation.keyword}
                        </Badge>
                      </div>

                      {/* Related Keywords */}
                      {translation.keywords.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-gray-600 block mb-2">
                            Keywords Relacionadas
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {translation.keywords.map((kw, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Preview */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-600">Contenido</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyField(translation.content, 'content')}
                            className="h-6 px-2 text-xs"
                          >
                            {copiedField === 'content' ? (
                              <>
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar Todo
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-700 bg-white p-3 rounded border max-h-60 overflow-y-auto whitespace-pre-wrap font-mono">
                          {translation.content.substring(0, 500)}...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {translations.length === 0 && !translating && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-8 text-center">
          <Languages className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            ¿Listo para alcanzar audiencias globales?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Traduce tu artículo a cualquier idioma con IA.<br />
            Selecciona un idioma arriba para comenzar.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Traducción SEO optimizada</span>
            <span>•</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Preserva estructura</span>
            <span>•</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Natural y profesional</span>
          </div>
        </div>
      )}
    </div>
  )
}
