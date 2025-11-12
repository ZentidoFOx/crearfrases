"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Key,
  Edit2,
  Save,
  X
} from 'lucide-react'
import { plannerArticlesService } from '@/lib/api/planner-articles'

interface SEOTabProps {
  article: any
  editedContent: string
}

export function SEOTab({
  article,
  editedContent
}: SEOTabProps) {
  // 🌍 Detectar si es una traducción CORRECTAMENTE
  const seoData = article?.seo_data || {}
  
  // 🔍 NUEVA LÓGICA: Detectar traducción por idioma y estructura
  const isTranslation = (
    article?.language && article.language !== 'es' // No es español (idioma original)
  ) || (
    article?.article_id !== undefined // Tiene article_id (viene de article_translations)
  )
  
  const isSEODataAvailable = Object.keys(seoData).length > 0
  
  console.log('🔍 [SEO-DETECTION] Detección de traducción:', {
    language: article?.language,
    hasArticleId: !!article?.article_id,
    isTranslation,
    hasSeoData: isSEODataAvailable
  })
  
  // 🎯 PRIORIZAR seo_data para traducciones (contiene datos traducidos correctos)
  // Si seo_data.focus_keyword existe, usarlo (es el keyword traducido)
  // Si no, usar article.keyword (es el keyword del artículo original)
  const displayKeyword = (isSEODataAvailable && seoData.focus_keyword) 
    ? seoData.focus_keyword 
    : article?.keyword
    
  const displayTitle = (isSEODataAvailable && seoData.seo_title) 
    ? seoData.seo_title 
    : article?.title
    
  const displayH1 = article?.h1_title || article?.title || ''
  
  // 🔥 PRIORIDAD ABSOLUTA: seo_data.meta_description para traducciones
  const displayMeta = (seoData && seoData.meta_description) 
    ? seoData.meta_description 
    : (article?.meta_description || '')
    
  const displayKeywordsArray = article?.keywords_array || []
  const displayRelatedKeywords = (isSEODataAvailable && seoData.related_keywords) 
    ? seoData.related_keywords 
    : []
    
  const displaySlug = (isSEODataAvailable && seoData.slug) 
    ? seoData.slug 
    : article?.slug
  
  const [isEditingKeyword, setIsEditingKeyword] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingH1, setIsEditingH1] = useState(false)
  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [isEditingKeywords, setIsEditingKeywords] = useState(false)
  
  const [editedKeyword, setEditedKeyword] = useState(displayKeyword || '')
  const [editedTitle, setEditedTitle] = useState(displayTitle || '')
  const [editedH1, setEditedH1] = useState(displayH1 || '')
  const [editedMeta, setEditedMeta] = useState(displayMeta || '')
  const [editedKeywords, setEditedKeywords] = useState(displayKeywordsArray.join(', '))
  
  const [saving, setSaving] = useState(false)
  
  // 🔄 SINCRONIZAR ESTADO LOCAL CON DATOS DEL ARTÍCULO
  useEffect(() => {
    console.log('🔄 [SEOTab] Sincronizando estado local con datos del artículo')
    setEditedKeyword(displayKeyword || '')
    setEditedTitle(displayTitle || '')
    setEditedH1(displayH1 || '')
    setEditedMeta(displayMeta || '')
    setEditedKeywords(displayKeywordsArray.join(', '))
  }, [displayKeyword, displayTitle, displayH1, displayMeta, displayKeywordsArray])
  
  console.log('🔍 [SEOTab] Debug datos:', {
    articleLanguage: article?.language,
    hasSEOData: isSEODataAvailable,
    seoData: seoData,
    displayKeyword,
    displayTitle,
    displayH1,
    displayMeta: displayMeta?.substring(0, 50),
    displaySlug,
    relatedKeywords: displayRelatedKeywords,
    keywordsArray: displayKeywordsArray
  })

  const handleSave = async (field: string, value: any) => {
    if (!article?.id) return
    
    setSaving(true)
    try {
      const updateData: any = {}
      
      if (field === 'keyword') {
        if (isTranslation) {
          // 🌍 ES UNA TRADUCCIÓN: Actualizar seo_data.focus_keyword
          console.log('🌍 [SEO-EDIT] Actualizando keyword de traducción:', {
            idioma: article?.language,
            esTraduccion: isTranslation,
            nuevo_keyword_traducido: value
          })
          
          updateData.seo_data = {
            ...(seoData as any),
            focus_keyword: value
          }
        } else {
          // 🇪🇸 ES EL ARTÍCULO ORIGINAL: Actualizar keyword principal
          console.log('🇪🇸 [SEO-EDIT] Actualizando keyword original:', {
            keyword_anterior: article?.keyword,
            keyword_nuevo: value
          })
          
          updateData.keyword = value
        }
        
        setIsEditingKeyword(false)
      } else if (field === 'title') {
        if (isTranslation) {
          // 🌍 TRADUCCIÓN: Actualizar seo_data.seo_title
          updateData.seo_data = {
            ...(seoData as any),
            seo_title: value
          }
        } else {
          // 🇪🇸 ORIGINAL: Actualizar title principal
          updateData.title = value
        }
        setIsEditingTitle(false)
      } else if (field === 'h1_title') {
        // H1 Title siempre se guarda en el campo principal
        updateData.h1_title = value
        setIsEditingH1(false)
      } else if (field === 'meta_description') {
        if (isTranslation) {
          // 🌍 TRADUCCIÓN: Actualizar seo_data.meta_description
          updateData.seo_data = {
            ...(seoData as any),
            meta_description: value
          }
        } else {
          // 🇪🇸 ORIGINAL: Actualizar meta_description principal
          updateData.meta_description = value
        }
        setIsEditingMeta(false)
      } else if (field === 'keywords_array') {
        updateData.keywords_array = value.split(',').map((k: string) => k.trim()).filter((k: string) => k)
        setIsEditingKeywords(false)
      }
      
      // 🔍 USAR LA API CORRECTA SEGÚN EL TIPO
      if (isTranslation) {
        // 🌍 TRADUCCIÓN: Usar updateTranslation()
        console.log('🌍 [API-CALL] Llamando updateTranslation() para traducción')
        console.log('  - Article ID:', article.article_id || article.id)
        console.log('  - Language:', article.language)
        console.log('  - Update Data:', updateData)
        
        await plannerArticlesService.updateTranslation(
          article.article_id || article.id, // ID del artículo original
          article.language, // Idioma de la traducción
          updateData
        )
      } else {
        // 🇪🇸 ORIGINAL: Usar update()
        console.log('🇪🇸 [API-CALL] Llamando update() para artículo original')
        console.log('  - Article ID:', article.id)
        console.log('  - Update Data:', updateData)
        
        await plannerArticlesService.update(article.id, updateData)
      }
      
      // Mostrar mensaje de confirmación específico
      const fieldNames = {
        keyword: 'Focus Keyword',
        title: 'SEO Title',
        h1_title: 'H1 Title',
        meta_description: 'Meta Description',
        keywords_array: 'Keywords Array'
      }
      
      const fieldName = fieldNames[field as keyof typeof fieldNames] || field
      
      if (isTranslation) {
        console.log(`✅ [SEO-EDIT] ${fieldName} de traducción ${article?.language?.toUpperCase()} guardado: "${value}"`)
      } else {
        console.log(`✅ [SEO-EDIT] ${fieldName} original actualizado: "${value}"`)
      }
      
      // 🔄 FORZAR RECARGA DE LA PÁGINA PARA OBTENER DATOS ACTUALIZADOS DE LA API
      console.log('🔄 [SEO-EDIT] Recargando página para mostrar datos actualizados de la API')
      window.location.reload()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = (field: string) => {
    if (field === 'keyword') {
      setEditedKeyword(displayKeyword || '')
      setIsEditingKeyword(false)
    } else if (field === 'title') {
      setEditedTitle(displayTitle || '')
      setIsEditingTitle(false)
    } else if (field === 'h1_title') {
      setEditedH1(displayH1 || '')
      setIsEditingH1(false)
    } else if (field === 'meta_description') {
      setEditedMeta(displayMeta || '')
      setIsEditingMeta(false)
    } else if (field === 'keywords_array') {
      setEditedKeywords(displayKeywordsArray.join(', '))
      setIsEditingKeywords(false)
    }
  }
  if (!article) {
    return (
      <div className="p-8 text-center text-gray-500">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No hay artículo cargado</p>
        <p className="text-sm mt-2">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Yoast SEO Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-green-600" />
          <h3 className="text-sm font-bold text-gray-800">Yoast SEO Configuration</h3>
        </div>
        
        <div className="space-y-4">
          {/* 1. Focus Keyword */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold">Focus Keyword</span>
                {isSEODataAvailable && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-0.5 text-blue-600 border-blue-200 bg-blue-50"
                  >
                    {article?.language?.toUpperCase() || 'TRADUCIDO'}
                  </Badge>
                )}
              </div>
              {!isEditingKeyword && (
                <button
                  onClick={() => setIsEditingKeyword(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isEditingKeyword ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedKeyword}
                  onChange={(e) => setEditedKeyword(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={isSEODataAvailable 
                    ? `Keyword en ${article?.language?.toUpperCase() || 'este idioma'}` 
                    : "Palabra clave principal (original)"
                  }
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave('keyword', editedKeyword)}
                    disabled={saving}
                    className="h-7 text-xs text-white"
                    style={{ backgroundColor: '#009689' }}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel('keyword')}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Badge className="text-white px-3 py-1.5 shadow-sm text-sm" style={{ backgroundColor: '#9810fa' }}>
                {displayKeyword}
              </Badge>
            )}
          </div>

          {/* 2. SEO Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold">SEO Title</span>
              {!isEditingTitle && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isEditingTitle ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Título SEO"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave('title', editedTitle)}
                    disabled={saving}
                    className="h-7 text-xs text-white"
                    style={{ backgroundColor: '#009689' }}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel('title')}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                {displayTitle}
              </div>
            )}
          </div>

          {/* 3. H1 Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold">H1 Title</span>
              {!isEditingH1 && (
                <button
                  onClick={() => setIsEditingH1(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isEditingH1 ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedH1}
                  onChange={(e) => setEditedH1(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Título H1"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave('h1_title', editedH1)}
                    disabled={saving}
                    className="h-7 text-xs text-white"
                    style={{ backgroundColor: '#009689' }}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel('h1_title')}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                {displayH1}
              </div>
            )}
          </div>

          {/* 4. Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold">Meta Description</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${
                  !editedMeta || editedMeta.length === 0 ? 'text-red-500' :
                  editedMeta.length > 160 ? 'text-orange-500' : 'text-green-500'
                }`}>
                  {isEditingMeta ? editedMeta.length : (displayMeta?.length || 0)}/160
                </span>
                {!isEditingMeta && (
                  <button
                    onClick={() => setIsEditingMeta(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            {isEditingMeta ? (
              <div className="space-y-2">
                <textarea
                  value={editedMeta}
                  onChange={(e) => setEditedMeta(e.target.value)}
                  rows={3}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Meta descripción (máx. 160 caracteres)"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave('meta_description', editedMeta)}
                    disabled={saving}
                    className="h-7 text-xs text-white"
                    style={{ backgroundColor: '#009689' }}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel('meta_description')}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                {displayMeta || 'Sin meta descripción'}
              </p>
            )}
          </div>

          {/* 5. URL Slug */}
          <div>
            <div className="text-xs text-gray-500 mb-2 font-semibold">URL Slug</div>
            <div className="text-sm font-mono bg-purple-50 p-3 rounded-lg border border-purple-200 break-all" style={{ color: '#9810fa' }}>
              /{displaySlug || article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
            </div>
          </div>
        </div>
      </div>

      {/* Related Keywords */}
      {((displayKeywordsArray && displayKeywordsArray.length > 0) || (displayRelatedKeywords && displayRelatedKeywords.length > 0)) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" style={{ color: '#9810fa' }} />
              <h3 className="text-sm font-bold text-gray-800">Related Keywords</h3>
              {displayRelatedKeywords && displayRelatedKeywords.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {displayRelatedKeywords.length} de seo_data
                </Badge>
              )}
            </div>
            {!isEditingKeywords && (
              <button
                onClick={() => setIsEditingKeywords(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {isEditingKeywords ? (
            <div className="space-y-2">
              <textarea
                value={editedKeywords}
                onChange={(e) => setEditedKeywords(e.target.value)}
                rows={3}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Keywords separados por comas (ej: keyword1, keyword2, keyword3)"
              />
              <p className="text-xs text-gray-500">Separa cada keyword con una coma</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave('keywords_array', editedKeywords)}
                  disabled={saving}
                  className="h-7 text-xs text-white"
                  style={{ backgroundColor: '#009689' }}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancel('keywords_array')}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {displayKeywordsArray.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-semibold">Keywords Array:</div>
                  <div className="flex flex-wrap gap-2">
                    {displayKeywordsArray.map((kw: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs px-3 py-1" style={{ borderColor: 'rgba(152, 16, 250, 0.3)', color: '#9810fa', backgroundColor: 'rgba(152, 16, 250, 0.05)' }}>
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {displayRelatedKeywords.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-semibold">Related Keywords (Traducidos):</div>
                  <div className="flex flex-wrap gap-2">
                    {displayRelatedKeywords.map((kw: string, idx: number) => (
                      <Badge key={`rel-${idx}`} variant="outline" className="text-xs px-3 py-1" style={{ borderColor: 'rgba(0, 150, 137, 0.3)', color: '#009689', backgroundColor: 'rgba(0, 150, 137, 0.05)' }}>
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
