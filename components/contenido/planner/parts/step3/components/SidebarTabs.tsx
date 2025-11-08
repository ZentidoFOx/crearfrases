"use client"

import React, { useState } from 'react'
import { Sparkles, Edit2, Check, X, Target, FileText, Eye, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SidebarTabsProps {
  showPlanner: boolean
  keyword: string
  title: string
  description?: string
  keywords?: string[]
  h1Title?: string
  onH1TitleChange?: (value: string) => void
  onTitleChange?: (value: string) => void
  onDescriptionChange?: (value: string) => void
  onKeywordsChange?: (value: string[]) => void
}

export function SidebarTabs({
  showPlanner,
  keyword,
  title,
  description,
  keywords,
  h1Title,
  onH1TitleChange,
  onTitleChange,
  onDescriptionChange,
  onKeywordsChange
}: SidebarTabsProps) {
  const [editingH1, setEditingH1] = useState(false)
  const [tempH1, setTempH1] = useState(h1Title || title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(title)
  const [editingDescription, setEditingDescription] = useState(false)
  const [tempDescription, setTempDescription] = useState(description || '')
  const [editingKeywords, setEditingKeywords] = useState(false)
  const [tempKeywords, setTempKeywords] = useState(keywords?.join(', ') || '')

  return (
    <div className="lg:col-span-1 bg-white border-2 border-gray-200 rounded-xl p-6 lg:sticky lg:top-24 lg:h-fit">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#2b2b40]">
          {showPlanner ? 'Configuración' : 'Contenido Generado'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {showPlanner ? 'Información del artículo' : 'Artículo optimizado SEO'}
        </p>
      </div>

      {/* Info básica cuando está el planificador */}
      {showPlanner && (
        <div className="space-y-4">
          {/* Frase Clave Objetiva Badge */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Frase clave objetiva:
            </p>
            <p className="text-base font-bold text-[#2b2b40]">{keyword}</p>
          </div>

          {/* Título SEO */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Título SEO:
            </p>
            <p className="text-sm font-semibold line-clamp-3 leading-relaxed text-[#2b2b40]">{title}</p>
          </div>

          {/* Meta Descripción */}
          {description && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Meta Descripción:
              </p>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{description}</p>
            </div>
          )}

          {/* Palabras Clave */}
          {keywords && keywords.length > 0 && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Palabras Clave Relacionadas:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywords.map((kw, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 px-2 py-1"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info SEO cuando está el contenido */}
      {!showPlanner && (
        <div className="space-y-4">
          {/* Frase Clave Objetiva */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Frase clave objetiva:
            </p>
            <p className="text-base font-bold text-[#2b2b40]">{keyword}</p>
          </div>

          {/* Título del Artículo (H1) - Editable */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Título del Artículo (H1):
              </p>
              {!editingH1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingH1(true)
                    setTempH1(h1Title || title)
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Edit2 className="h-3 w-3 text-gray-600" />
                </Button>
              )}
            </div>
            {editingH1 ? (
              <>
                <textarea
                  value={tempH1}
                  onChange={(e) => setTempH1(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-black focus:border-black resize-none"
                  rows={3}
                  placeholder="Título del artículo..."
                />
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onH1TitleChange) onH1TitleChange(tempH1)
                      setEditingH1(false)
                    }}
                    className="h-6 text-white text-xs transition-colors"
                    style={{ backgroundColor: '#009689' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007f73'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009689'}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingH1(false)
                      setTempH1(h1Title || title)
                    }}
                    className="h-6 border-gray-200 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold line-clamp-3 leading-snug" style={{ color: '#000000' }}>{h1Title || title}</p>
                <p className="text-[10px] text-gray-600 mt-1.5 font-medium">
                  {(h1Title || title).length} caracteres
                </p>
              </>
            )}
          </div>

          {/* Título SEO (Yoast) - Editable */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                Título SEO (Yoast):
              </p>
              {!editingTitle && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingTitle(true)
                    setTempTitle(title)
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Edit2 className="h-3 w-3 text-gray-600" />
                </Button>
              )}
            </div>
            {editingTitle ? (
              <>
                <textarea
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-black focus:border-black resize-none"
                  rows={2}
                  placeholder="Título SEO..."
                />
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onTitleChange) onTitleChange(tempTitle)
                      setEditingTitle(false)
                    }}
                    className="h-6 text-white text-xs transition-colors"
                    style={{ backgroundColor: '#009689' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007f73'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009689'}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTitle(false)
                      setTempTitle(title)
                    }}
                    className="h-6 border-gray-200 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold line-clamp-3 leading-snug" style={{ color: '#000000' }}>{title}</p>
                <p className="text-[10px] text-gray-600 mt-1.5 font-medium">
                  {title.length} caracteres {title.length >= 50 && title.length <= 60 ? '✓' : title.length < 50 ? '⚠️ Muy corto' : '⚠️ Muy largo'}
                </p>
              </>
            )}
          </div>

          {/* Meta Descripción SEO - Editable */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                Meta Descripción (Yoast):
              </p>
              {!editingDescription && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingDescription(true)
                    setTempDescription(description || '')
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Edit2 className="h-3 w-3 text-gray-600" />
                </Button>
              )}
            </div>
            {editingDescription ? (
              <>
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-black focus:border-black resize-none"
                  rows={3}
                  placeholder="Meta descripción..."
                />
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onDescriptionChange) onDescriptionChange(tempDescription)
                      setEditingDescription(false)
                    }}
                    className="h-6 text-white text-xs transition-colors"
                    style={{ backgroundColor: '#009689' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007f73'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009689'}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingDescription(false)
                      setTempDescription(description || '')
                    }}
                    className="h-6 border-gray-200 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-700 leading-relaxed">{description || 'Sin descripción'}</p>
                <p className="text-[10px] text-gray-600 mt-1.5 font-medium">
                  {(description || '').length} caracteres {(description || '').length >= 150 && (description || '').length <= 160 ? '✓' : (description || '').length < 150 ? '⚠️ Muy corto' : '⚠️ Muy largo'}
                </p>
              </>
            )}
          </div>

          {/* Palabras Clave - Editable */}
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                Palabras Clave Relacionadas:
              </p>
              {!editingKeywords && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingKeywords(true)
                    setTempKeywords(keywords?.join(', ') || '')
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Edit2 className="h-3 w-3 text-gray-600" />
                </Button>
              )}
            </div>
            {editingKeywords ? (
              <>
                <textarea
                  value={tempKeywords}
                  onChange={(e) => setTempKeywords(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-black focus:border-black resize-none"
                  rows={2}
                  placeholder="palabra1, palabra2, palabra3..."
                />
                <p className="text-[10px] text-gray-500 mt-1">Separa las palabras con comas</p>
                <div className="flex gap-1 mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const newKeywords = tempKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
                      if (onKeywordsChange) onKeywordsChange(newKeywords)
                      setEditingKeywords(false)
                    }}
                    className="h-6 text-white text-xs transition-colors"
                    style={{ backgroundColor: '#009689' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007f73'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009689'}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingKeywords(false)
                      setTempKeywords(keywords?.join(', ') || '')
                    }}
                    className="h-6 border-gray-200 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywords && keywords.length > 0 ? (
                  keywords.map((kw, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[10px] bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 px-2 py-0.5"
                    >
                      {kw}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Sin palabras clave</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
