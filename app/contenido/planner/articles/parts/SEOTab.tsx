"use client"

import { useState } from 'react'
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
  const [isEditingKeyword, setIsEditingKeyword] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingH1, setIsEditingH1] = useState(false)
  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [isEditingKeywords, setIsEditingKeywords] = useState(false)
  
  const [editedKeyword, setEditedKeyword] = useState(article?.keyword || '')
  const [editedTitle, setEditedTitle] = useState(article?.title || '')
  const [editedH1, setEditedH1] = useState(article?.h1_title || article?.title || '')
  const [editedMeta, setEditedMeta] = useState(article?.meta_description || '')
  const [editedKeywords, setEditedKeywords] = useState((article?.keywords_array || []).join(', '))
  
  const [saving, setSaving] = useState(false)

  const handleSave = async (field: string, value: any) => {
    if (!article?.id) return
    
    setSaving(true)
    try {
      const updateData: any = {}
      
      if (field === 'keyword') {
        updateData.keyword = value
        setIsEditingKeyword(false)
      } else if (field === 'title') {
        updateData.title = value
        setIsEditingTitle(false)
      } else if (field === 'h1_title') {
        updateData.h1_title = value
        setIsEditingH1(false)
      } else if (field === 'meta_description') {
        updateData.meta_description = value
        setIsEditingMeta(false)
      } else if (field === 'keywords_array') {
        updateData.keywords_array = value.split(',').map((k: string) => k.trim()).filter((k: string) => k)
        setIsEditingKeywords(false)
      }
      
      await plannerArticlesService.update(article.id, updateData)
      
      // Actualizar el artículo local
      Object.assign(article, updateData)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = (field: string) => {
    if (field === 'keyword') {
      setEditedKeyword(article?.keyword || '')
      setIsEditingKeyword(false)
    } else if (field === 'title') {
      setEditedTitle(article?.title || '')
      setIsEditingTitle(false)
    } else if (field === 'h1_title') {
      setEditedH1(article?.h1_title || article?.title || '')
      setIsEditingH1(false)
    } else if (field === 'meta_description') {
      setEditedMeta(article?.meta_description || '')
      setIsEditingMeta(false)
    } else if (field === 'keywords_array') {
      setEditedKeywords((article?.keywords_array || []).join(', '))
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
            <div className="text-xs text-gray-500 mb-2 font-semibold">Focus Keyword</div>
            <Badge className="text-white px-3 py-1.5 shadow-sm text-sm" style={{ backgroundColor: '#9810fa' }}>
              {article.keyword}
            </Badge>
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
                {article.title}
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
                {article.h1_title || article.title}
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
                  {isEditingMeta ? editedMeta.length : (article.meta_description?.length || 0)}/160
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
                {article.meta_description || 'Sin meta descripción'}
              </p>
            )}
          </div>

          {/* 5. URL Slug */}
          <div>
            <div className="text-xs text-gray-500 mb-2 font-semibold">URL Slug</div>
            <div className="text-sm font-mono bg-purple-50 p-3 rounded-lg border border-purple-200 break-all" style={{ color: '#9810fa' }}>
              /{article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
            </div>
          </div>
        </div>
      </div>

      {/* Related Keywords */}
      {article.keywords_array && article.keywords_array.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" style={{ color: '#9810fa' }} />
              <h3 className="text-sm font-bold text-gray-800">Related Keywords</h3>
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
            <div className="flex flex-wrap gap-2">
              {article.keywords_array.map((kw: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs px-3 py-1" style={{ borderColor: 'rgba(152, 16, 250, 0.3)', color: '#9810fa', backgroundColor: 'rgba(152, 16, 250, 0.05)' }}>
                  {kw}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
