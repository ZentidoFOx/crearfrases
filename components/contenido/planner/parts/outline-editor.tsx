"use client"

import React, { useState } from 'react'
import { Edit2, Trash2, Plus, Sparkles, GripVertical, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface OutlineEditorProps {
  outline: string[]
  keyword: string
  onOutlineChange: (newOutline: string[]) => void
  onGenerate: () => void
  onRegenerate: () => void
  onBack: () => void
  estimatedWords: number
}

export function OutlineEditor({
  outline,
  keyword,
  onOutlineChange,
  onGenerate,
  onRegenerate,
  onBack,
  estimatedWords
}: OutlineEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    // Extract clean text without markdown for editing
    const cleanText = outline[index].replace(/^#{2,4}\s*/, '')
    setEditValue(cleanText)
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newOutline = [...outline]
      const currentSection = outline[editingIndex]
      
      // Preserve the heading level (##, ###, ####)
      let prefix = '## '
      if (currentSection.startsWith('#### ')) prefix = '#### '
      else if (currentSection.startsWith('### ')) prefix = '### '
      else if (currentSection.startsWith('## ')) prefix = '## '
      
      newOutline[editingIndex] = prefix + editValue.trim()
      onOutlineChange(newOutline)
      setEditingIndex(null)
      setEditValue('')
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  const handleDelete = (index: number) => {
    const newOutline = outline.filter((_, i) => i !== index)
    onOutlineChange(newOutline)
  }

  const handleAdd = () => {
    const newOutline = [...outline, `Nueva sección con ${keyword}`]
    onOutlineChange(newOutline)
    // Auto-edit the new section
    setEditingIndex(newOutline.length - 1)
    setEditValue(`Nueva sección con ${keyword}`)
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-xl border-2 border-purple-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Revisar Estructura del Artículo
        </h2>
        <p className="text-gray-600 text-sm">
          🤖 Gemini generó esta estructura. Puedes editarla antes de generar el contenido completo.
        </p>
      </div>

      {/* Keyword Badge */}
      <div className="mb-4 p-3 bg-purple-100 rounded-lg border border-purple-300 inline-block">
        <span className="text-xs text-purple-600 font-medium">Palabra clave: </span>
        <span className="text-sm font-bold text-purple-900">{keyword}</span>
      </div>

      {/* Outline List */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          📋 Estructura de Secciones (H2, H3, H4)
        </h3>
        <div className="mb-3 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 bg-purple-600 rounded-full"></span>
            <span>H2 Principal</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
            <span>H3 Subsección</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span>H4 Detalle</span>
          </span>
        </div>

        <div className="space-y-2">
          {outline.map((section, index) => {
            // Detect heading level
            const isH2 = section.startsWith('## ')
            const isH3 = section.startsWith('### ')
            const isH4 = section.startsWith('#### ')
            
            // Get clean text without markdown
            const cleanText = section.replace(/^#{2,4}\s*/, '')
            
            // Calculate indentation
            let indentation = 0
            let bgColor = 'bg-gray-50'
            let numberBg = 'bg-purple-500'
            let numberSize = 'w-8 h-8 text-sm'
            
            if (isH2) {
              indentation = 0
              bgColor = 'bg-purple-50'
              numberBg = 'bg-purple-600'
              numberSize = 'w-8 h-8 text-sm'
            } else if (isH3) {
              indentation = 32
              bgColor = 'bg-blue-50'
              numberBg = 'bg-blue-500'
              numberSize = 'w-7 h-7 text-xs'
            } else if (isH4) {
              indentation = 64
              bgColor = 'bg-emerald-50'
              numberBg = 'bg-emerald-500'
              numberSize = 'w-6 h-6 text-xs'
            }

            return (
              <div
                key={index}
                className={`group flex items-center gap-3 p-3 ${bgColor} hover:bg-gray-100 rounded-lg border border-gray-200 transition-all`}
                style={{ marginLeft: `${indentation}px` }}
              >
                {/* Drag Handle */}
                <div className="cursor-move text-gray-400 hover:text-gray-600">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Heading Level Indicator */}
                <div className={`flex-shrink-0 ${numberSize} ${numberBg} text-white rounded-full flex items-center justify-center font-bold`}>
                  {isH2 ? 'H2' : isH3 ? 'H3' : 'H4'}
                </div>

                {/* Content */}
                {editingIndex === index ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{cleanText}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(index)}
                      className="h-8 w-8 p-0"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(index)}
                      className="h-8 w-8 p-0"
                      title="Eliminar"
                      disabled={outline.length <= 3}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </>
              )}
              </div>
            )
          })}
        </div>

        {/* Add Section Button */}
        <Button
          onClick={handleAdd}
          variant="outline"
          className="w-full mt-3 border-dashed border-2 hover:border-purple-400 hover:bg-purple-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Sección
        </Button>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-300 mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">📊 Resumen del Artículo:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {outline.filter((s: string) => s.startsWith('## ')).length}
            </div>
            <div className="text-xs text-gray-600">Secciones H2</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {outline.filter((s: string) => s.startsWith('### ')).length}
            </div>
            <div className="text-xs text-gray-600">Subsecciones H3</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{estimatedWords}</div>
            <div className="text-xs text-gray-600">Palabras estimadas</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {Math.ceil(estimatedWords / 200)}
            </div>
            <div className="text-xs text-gray-600">Min. de lectura</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Consejos:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>H2 (Morado):</strong> Secciones principales del artículo</li>
          <li>• <strong>H3 (Azul):</strong> Subsecciones que profundizan en cada H2</li>
          <li>• <strong>H4 (Verde):</strong> Detalles específicos dentro de cada H3</li>
          <li>• <strong>Incluye la palabra clave</strong> en al menos 2-3 títulos H2</li>
          <li>• La <strong>jerarquía</strong> ayuda a Google entender la estructura</li>
          <li>• Las secciones se generarán en el orden que las veas aquí</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Button
          onClick={onBack}
          variant="outline"
        >
          ← Volver
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={onRegenerate}
            variant="outline"
            className="flex items-center gap-2"
          >
            🔄 Regenerar Estructura
          </Button>
          <Button
            onClick={onGenerate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 shadow-lg"
          >
            <Sparkles className="h-4 w-4" />
            Generar Contenido Completo
          </Button>
        </div>
      </div>
    </div>
  )
}
