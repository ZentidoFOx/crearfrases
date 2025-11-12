"use client"

import React, { useState, useRef } from 'react'
import { Edit2, Trash2, Plus, Sparkles, GripVertical, Check, X, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface OutlineSection {
  id: string
  type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
  title: string
  paragraphs: number
  words: number
  collapsed?: boolean
  imageUrl?: string
  items?: number // Para listas
  contentType?: 'paragraphs' | 'list' | 'numbered-list' // Tipo de contenido para encabezados
}

interface OutlineEditorAdvancedProps {
  outline: OutlineSection[]
  keyword: string
  introParagraphs: number
  onOutlineChange: (newOutline: OutlineSection[]) => void
  onIntroParagraphsChange: (count: number) => void
  onGenerate: () => void
  onRegenerate: () => void
  onBack: () => void
}

export function OutlineEditorAdvanced({
  outline,
  keyword,
  introParagraphs,
  onOutlineChange,
  onIntroParagraphsChange,
  onGenerate,
  onRegenerate,
  onBack
}: OutlineEditorAdvancedProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleEdit = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditValue(currentTitle)
  }

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      const newOutline = outline.map(section =>
        section.id === editingId ? { ...section, title: editValue.trim() } : section
      )
      onOutlineChange(newOutline)
      setEditingId(null)
      setEditValue('')
    }
  }

  const handleDelete = (id: string) => {
    const newOutline = outline.filter(s => s.id !== id)
    onOutlineChange(newOutline)
  }

  const handleToggleCollapse = (id: string) => {
    const newOutline = outline.map(section =>
      section.id === id ? { ...section, collapsed: !section.collapsed } : section
    )
    onOutlineChange(newOutline)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newOutline = [...outline]
    const draggedItem = newOutline[draggedIndex]
    
    // Remove dragged item
    newOutline.splice(draggedIndex, 1)
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    newOutline.splice(insertIndex, 0, draggedItem)
    
    onOutlineChange(newOutline)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleParagraphsChange = (id: string, count: number) => {
    const newOutline = outline.map(section =>
      section.id === id ? { ...section, paragraphs: Math.max(1, count) } : section
    )
    onOutlineChange(newOutline)
  }

  const handleWordsChange = (id: string, words: number) => {
    const newOutline = outline.map(section =>
      section.id === id ? { ...section, words: Math.max(20, words) } : section
    )
    onOutlineChange(newOutline)
  }

  const handleContentTypeChange = (id: string, contentType: 'paragraphs' | 'list' | 'numbered-list') => {
    const newOutline = outline.map(section => {
      if (section.id === id) {
        const updated = { ...section, contentType }
        // Ajustar valores predeterminados según el tipo
        if (contentType === 'list' || contentType === 'numbered-list') {
          updated.items = updated.items || 5
          updated.paragraphs = 0
        } else {
          updated.paragraphs = updated.paragraphs || 2
          updated.items = undefined
        }
        return updated
      }
      return section
    })
    onOutlineChange(newOutline)
  }

  const addSection = (type: OutlineSection['type']) => {
    let defaultWords = 40
    let defaultParagraphs = 1
    let defaultItems = 5
    let defaultTitle = ''

    switch (type) {
      case 'h2':
        defaultWords = 90
        defaultParagraphs = 3
        defaultTitle = keyword // Solo la keyword, sin prefijo
        break
      case 'h3':
        defaultWords = 60
        defaultParagraphs = 2
        defaultTitle = keyword // Solo la keyword, sin prefijo
        break
      case 'h4':
        defaultWords = 40
        defaultParagraphs = 2
        defaultTitle = keyword // Solo la keyword, sin prefijo
        break
      case 'paragraph':
        defaultWords = 50
        defaultParagraphs = 1
        defaultTitle = 'Nuevo párrafo'
        break
      case 'list':
        defaultWords = 40
        defaultParagraphs = 0
        defaultTitle = 'Nueva lista (viñetas)'
        break
      case 'numbered-list':
        defaultWords = 40
        defaultParagraphs = 0
        defaultTitle = 'Nueva lista (numerada)'
        break
      case 'quote':
        defaultWords = 30
        defaultParagraphs = 1
        defaultTitle = 'Nueva cita destacada'
        break
      case 'image':
        defaultWords = 0
        defaultParagraphs = 0
        defaultTitle = 'Nueva imagen'
        break
    }

    const newSection: OutlineSection = {
      id: `section-${Date.now()}`,
      type,
      title: defaultTitle,
      paragraphs: defaultParagraphs,
      words: defaultWords,
      collapsed: false,
      items: (type === 'list' || type === 'numbered-list') ? defaultItems : undefined,
      contentType: (type === 'h2' || type === 'h3' || type === 'h4') ? 'paragraphs' : undefined
    }
    onOutlineChange([...outline, newSection])
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'h2': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-500', icon: 'H2' }
      case 'h3': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-500', icon: 'H3' }
      case 'h4': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-500', icon: 'H4' }
      case 'paragraph': return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-500', icon: 'P' }
      case 'list': return { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-500', icon: 'UL' }
      case 'numbered-list': return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-500', icon: 'OL' }
      case 'quote': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500', icon: '💬' }
      case 'image': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500', icon: '🖼' }
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-500', icon: '?' }
    }
  }

  const totalWords = () => {
    const introWords = introParagraphs * 75
    const sectionWords = outline.reduce((sum, s) => {
      if (s.type === 'image') return sum
      // Asegurar que words sea un número válido
      const words = s.words || 0
      return sum + (isNaN(words) ? 0 : words)
    }, 0)
    return Math.round(introWords + sectionWords)
  }

  // Count visible sections (not counting collapsed children)
  const getVisibleSectionsCount = (type: 'h2' | 'h3' | 'h4') => {
    let count = 0
    let currentH2Collapsed = false
    
    outline.forEach((section, index) => {
      if (section.type === 'h2') {
        currentH2Collapsed = section.collapsed || false
        if (type === 'h2') count++
      } else if (section.type === 'h3') {
        if (!currentH2Collapsed && type === 'h3') count++
      } else if (section.type === 'h4') {
        if (!currentH2Collapsed && type === 'h4') count++
      }
    })
    
    return count
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#009689' }}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#2b2b40' }}>
              Vista Previa del Esqueleto
            </h2>
            <p className="text-sm text-gray-600">
              Configura cada sección con párrafos y palabras
            </p>
          </div>
        </div>
      </div>

      {/* Keyword Badge */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 inline-block">
        <span className="text-sm text-gray-600 font-semibold">Frase clave objetiva: </span>
        <span className="text-base font-bold" style={{ color: '#2b2b40' }}>{keyword}</span>
      </div>

      {/* Main Outline */}
      <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4 mb-4">
        {/* Legend */}
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <h4 className="text-sm font-bold mb-2" style={{ color: '#2b2b40' }}>💡 Controles:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <GripVertical className="h-3 w-3 text-gray-400" />
              <span>Arrastra para reordenar</span>
            </div>
            <div className="flex items-center gap-1">
              <ChevronDown className="h-3 w-3 text-gray-400" />
              <span>Solo H2 puede colapsar sus hijos</span>
            </div>
          </div>
        </div>

        {/* Intro Paragraphs */}
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#2b2b40' }}>
              📝 Párrafos Introductorios
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Cantidad para la IA:</span>
              <Input
                type="number"
                min="1"
                max="5"
                value={introParagraphs}
                onChange={(e) => onIntroParagraphsChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-8 text-center"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            La IA generará {introParagraphs} párrafo{introParagraphs > 1 ? 's' : ''} introductorio{introParagraphs > 1 ? 's' : ''} automáticamente
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {outline.map((section, index) => {
            const colors = getTypeColor(section.type)
            const indentation = section.type === 'h2' ? 0 : section.type === 'h3' ? 24 : 48
            
            // Check if this section should be hidden (it's a child of a collapsed H2)
            const shouldHide = () => {
              if (section.type === 'h2') return false
              
              // Find parent H2
              for (let i = index - 1; i >= 0; i--) {
                if (outline[i].type === 'h2') {
                  return outline[i].collapsed || false
                }
              }
              return false
            }

            if (shouldHide()) return null

            const isDragging = draggedIndex === index
            const isOver = dragOverIndex === index

            return (
              <div key={section.id} className="relative">
                {/* Drop indicator */}
                {isOver && draggedIndex !== index && (
                  <div className="absolute -top-1 left-0 right-0 h-1 bg-purple-500 rounded-full shadow-lg z-10 animate-pulse" />
                )}
                
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white border ${colors.border} rounded transition-all cursor-move ${
                    isDragging ? 'opacity-40 scale-95 rotate-2' : ''
                  } ${
                    isOver && draggedIndex !== index ? 'transform scale-105' : ''
                  }`}
                  style={{ marginLeft: `${indentation}px` }}
                >
                {/* Header */}
                <div className="flex items-center gap-2 p-2">
                  {/* Drag Handle */}
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Type Badge */}
                  <div className={`flex-shrink-0 min-w-8 h-6 px-2 ${colors.bg} ${colors.text} rounded flex items-center justify-center font-bold text-xs border ${colors.border}`}>
                    {colors.icon}
                  </div>

                  {/* Title */}
                  {editingId === section.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveEdit} className="bg-green-600">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${colors.text}`}>{section.title}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1">
                    {/* Only H2 can collapse */}
                    {section.type === 'h2' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleCollapse(section.id)}
                        className="h-8 w-8 p-0"
                        title={section.collapsed ? "Expandir" : "Colapsar"}
                      >
                        {section.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(section.id, section.title)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(section.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Details (when not collapsed) */}
                {!section.collapsed && section.type !== 'image' && (
                  <div className="px-4 pb-3 space-y-3">
                    {/* Selector de tipo de contenido para encabezados */}
                    {(section.type === 'h2' || section.type === 'h3' || section.type === 'h4') && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 font-semibold">Contenido:</span>
                        <select
                          value={section.contentType || 'paragraphs'}
                          onChange={(e) => handleContentTypeChange(section.id, e.target.value as 'paragraphs' | 'list' | 'numbered-list')}
                          className="h-8 px-3 border border-gray-300 rounded text-xs bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="paragraphs">📝 Párrafos</option>
                          <option value="list">• Lista (viñetas)</option>
                          <option value="numbered-list">1. Lista (numerada)</option>
                        </select>
                      </div>
                    )}

                    {/* Controles según el tipo de contenido */}
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                    {/* Listas: mostrar número de items */}
                    {((section.type === 'list' || section.type === 'numbered-list') || 
                      (section.contentType === 'list' || section.contentType === 'numbered-list')) ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📝</span>
                          <Input
                            type="number"
                            min="3"
                            max="15"
                            value={section.items || 5}
                            onChange={(e) => {
                              const newOutline = outline.map(s =>
                                s.id === section.id ? { ...s, items: Math.max(3, parseInt(e.target.value) || 5) } : s
                              )
                              onOutlineChange(newOutline)
                            }}
                            className="w-16 h-7 text-center"
                          />
                          <span className="text-gray-600">items</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">T ~</span>
                          <Input
                            type="number"
                            min="20"
                            max="400"
                            step="10"
                            value={section.words}
                            onChange={(e) => handleWordsChange(section.id, parseInt(e.target.value) || 20)}
                            className="w-20 h-7 text-center"
                          />
                          <span className="text-gray-600">palabras/item</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Párrafos para otros tipos */}
                        {section.type !== 'quote' && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">☰</span>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={section.paragraphs}
                              onChange={(e) => handleParagraphsChange(section.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-7 text-center"
                            />
                            <span className="text-gray-600">párrafos</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">T ~</span>
                          <Input
                            type="number"
                            min="20"
                            max="1000"
                            step="10"
                            value={section.words}
                            onChange={(e) => handleWordsChange(section.id, parseInt(e.target.value) || 20)}
                            className="w-20 h-7 text-center"
                          />
                          <span className="text-gray-600">palabras</span>
                        </div>
                      </>
                    )}
                    </div>
                  </div>
                )}

                {/* Image details */}
                {!section.collapsed && section.type === 'image' && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ImageIcon className="h-4 w-4" />
                      <span>Click en la imagen para cambiarla</span>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Buttons */}
        <div className="mt-4">
          <p className="text-sm font-bold mb-3" style={{ color: '#2b2b40' }}>➕ Agregar Elemento:</p>
          
          {/* Encabezados */}
          <div className="mb-2">
            <p className="text-xs text-gray-600 font-semibold mb-2">Encabezados:</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                onClick={() => addSection('h2')}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-dashed border-2 border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50 font-semibold"
              >
                <Plus className="h-3 w-3 mr-1" />
                H2
              </Button>
              <Button
                onClick={() => addSection('h3')}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-dashed border-2 border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 font-semibold"
              >
                <Plus className="h-3 w-3 mr-1" />
                H3
              </Button>
              <Button
                onClick={() => addSection('h4')}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-dashed border-2 border-purple-300 text-purple-700 hover:border-purple-400 hover:bg-purple-50 font-semibold"
              >
                <Plus className="h-3 w-3 mr-1" />
                H4
              </Button>
            </div>
          </div>

          {/* Contenido */}
          <div className="mb-2">
            <p className="text-xs text-gray-600 font-semibold mb-2">Listas:</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                onClick={() => addSection('list')}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-dashed border-2 border-cyan-300 text-cyan-700 hover:border-cyan-400 hover:bg-cyan-50 font-semibold"
              >
                <Plus className="h-3 w-3 mr-1" />
                Lista (viñetas)
              </Button>
              <Button
                onClick={() => addSection('numbered-list')}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-dashed border-2 border-indigo-300 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 font-semibold"
              >
                <Plus className="h-3 w-3 mr-1" />
                Lista (numerada)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4 mb-4">
        <h3 className="text-sm font-bold mb-3" style={{ color: '#2b2b40' }}>📊 Resumen del Artículo:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-4xl font-bold" style={{ color: '#009689' }}>
              {outline.filter(s => s.type === 'h2').length}
            </div>
            <div className="text-xs text-gray-600 font-medium mt-1">Secciones H2</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-4xl font-bold" style={{ color: '#9810fa' }}>
              {outline.filter(s => s.type === 'h3').length}
            </div>
            <div className="text-xs text-gray-600 font-medium mt-1">Subsecciones H3</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-4xl font-bold" style={{ color: '#ff6900' }}>{totalWords()}</div>
            <div className="text-xs text-gray-600 font-medium mt-1">Palabras estimadas</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
            <div className="text-4xl font-bold" style={{ color: '#2b2b40' }}>
              {outline.filter(s => s.type === 'image').length}
            </div>
            <div className="text-xs text-gray-600 font-medium mt-1">Imágenes</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Button onClick={onBack} variant="outline" className="h-10 border-2 border-gray-200 hover:border-gray-400">
          ← Volver
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={onRegenerate}
            variant="outline"
            className="h-10 border-2 border-gray-200 hover:border-gray-400"
          >
            🔄 Regenerar
          </Button>
          <Button
            onClick={onGenerate}
            className="h-10 text-white"
            style={{ backgroundColor: '#009689' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007a6e'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#009689'}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Contenido
          </Button>
        </div>
      </div>
    </div>
  )
}
