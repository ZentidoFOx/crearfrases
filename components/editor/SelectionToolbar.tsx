"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Check,
  X,
  Loader2,
  WandSparkles,
  AlignLeft,
  Maximize2,
  Minimize2,
  SpellCheck,
  Briefcase,
  Smile,
  ArrowRight,
  Target
} from 'lucide-react'
import {
  textImprovementService,
  type ImprovementAction,
  type TextImprovementRequest
} from '@/lib/api/text-improvement-service'

interface SelectionToolbarProps {
  editorId: string
  keyword?: string
  articleTitle?: string
  language?: string
  modelId?: number
  onTextReplaced?: () => void
}

export function SelectionToolbar({
  editorId,
  keyword,
  articleTitle,
  language = 'es',
  modelId,
  onTextReplaced
}: SelectionToolbarProps) {
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState<Range | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [showToolbar, setShowToolbar] = useState(false)
  const [improving, setImproving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [improvedText, setImprovedText] = useState('')
  const [currentAction, setCurrentAction] = useState<string>('')
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Detectar selección de texto
  useEffect(() => {
    const editor = document.getElementById(editorId)
    if (!editor) return

    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setShowToolbar(false)
        setShowPreview(false)
        return
      }

      const range = selection.getRangeAt(0)
      const text = selection.toString().trim()

      // Solo mostrar si hay texto seleccionado y está dentro del editor
      if (text && editor.contains(range.commonAncestorContainer)) {
        setSelectedText(text)
        setSelectionRange(range)

        // Calcular posición del toolbar
        const rect = range.getBoundingClientRect()
        const editorRect = editor.getBoundingClientRect()

        setPosition({
          top: rect.top - editorRect.top - 60, // 60px arriba de la selección
          left: rect.left - editorRect.left + (rect.width / 2) - 200 // Centrado
        })

        setShowToolbar(true)
      } else {
        setShowToolbar(false)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [editorId])

  // Ocultar toolbar si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // Si no hay preview activo, ocultar toolbar
        if (!showPreview) {
          setShowToolbar(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPreview])

  // Aplicar mejora con IA
  const handleImprove = async (action: ImprovementAction, actionName: string) => {
    if (!selectedText || !selectionRange) return

    setImproving(true)
    setCurrentAction(actionName)
    setShowPreview(false)

    try {
      const request: TextImprovementRequest = {
        selectedText,
        action,
        context: {
          keyword,
          articleTitle,
          language
        },
        modelId
      }

      const result = await textImprovementService.improveText(request)

      if (result.success) {
        setImprovedText(result.improvedText)
        setShowPreview(true)
      } else {
        alert(result.message)
        setShowToolbar(false)
      }
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      setShowToolbar(false)
    } finally {
      setImproving(false)
      setCurrentAction('')
    }
  }

  // Aceptar cambios
  const handleAccept = () => {
    if (!selectionRange || !improvedText) return

    try {
      // Reemplazar texto seleccionado con el mejorado
      selectionRange.deleteContents()
      const textNode = document.createTextNode(improvedText)
      selectionRange.insertNode(textNode)

      // Limpiar selección
      window.getSelection()?.removeAllRanges()

      // Notificar cambio
      if (onTextReplaced) {
        onTextReplaced()
      }

      // Ocultar toolbar
      setShowToolbar(false)
      setShowPreview(false)
      setImprovedText('')
    } catch (error) {
      console.error('Error reemplazando texto:', error)
      alert('❌ Error al aplicar cambios')
    }
  }

  // Rechazar cambios
  const handleReject = () => {
    setShowPreview(false)
    setImprovedText('')
    setShowToolbar(false)
  }

  if (!showToolbar) return null

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 bg-white rounded-lg shadow-2xl border-2 border-purple-200 p-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '400px',
        maxWidth: '600px'
      }}
    >
      {!showPreview ? (
        // 🎨 Menú de acciones
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-gray-700">
              Herramientas Mágicas de IA
            </span>
          </div>

          {improving ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{currentAction}...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {/* Mejorar Redacción */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('improve-writing', 'Mejorando redacción')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-purple-50"
              >
                <WandSparkles className="h-4 w-4 text-purple-600" />
                <span className="text-xs">Mejorar</span>
              </Button>

              {/* Simplificar */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('simplify', 'Simplificando')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-blue-50"
              >
                <AlignLeft className="h-4 w-4 text-blue-600" />
                <span className="text-xs">Simplificar</span>
              </Button>

              {/* Expandir */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('expand', 'Expandiendo')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-green-50"
              >
                <Maximize2 className="h-4 w-4 text-green-600" />
                <span className="text-xs">Expandir</span>
              </Button>

              {/* Acortar */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('shorten', 'Acortando')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-orange-50"
              >
                <Minimize2 className="h-4 w-4 text-orange-600" />
                <span className="text-xs">Acortar</span>
              </Button>

              {/* Corregir */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('fix-grammar', 'Corrigiendo')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-red-50"
              >
                <SpellCheck className="h-4 w-4 text-red-600" />
                <span className="text-xs">Corregir</span>
              </Button>

              {/* Profesional */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('make-professional', 'Profesionalizando')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-gray-50"
              >
                <Briefcase className="h-4 w-4 text-gray-600" />
                <span className="text-xs">Profesional</span>
              </Button>

              {/* Amigable */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('make-friendly', 'Haciendo amigable')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-yellow-50"
              >
                <Smile className="h-4 w-4 text-yellow-600" />
                <span className="text-xs">Amigable</span>
              </Button>

              {/* Transiciones */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('add-transitions', 'Agregando transiciones')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-indigo-50"
              >
                <ArrowRight className="h-4 w-4 text-indigo-600" />
                <span className="text-xs">Transiciones</span>
              </Button>

              {/* SEO */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove('improve-seo', 'Optimizando SEO')}
                className="flex flex-col items-center gap-1 h-auto py-2 hover:bg-teal-50"
              >
                <Target className="h-4 w-4 text-teal-600" />
                <span className="text-xs">SEO</span>
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center px-2 pb-1">
            ✨ {selectedText.length} caracteres seleccionados
          </div>
        </div>
      ) : (
        // 📋 Preview de cambios
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-green-50 to-blue-50 rounded-t">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-gray-700">Texto Mejorado</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={handleAccept}
                className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Aplicar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReject}
                className="h-7 px-3 text-xs hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>

          <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
            {/* Original */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Original:</div>
              <div className="text-sm text-gray-700 bg-red-50 p-2 rounded border border-red-200">
                {selectedText}
              </div>
            </div>

            {/* Mejorado */}
            <div>
              <div className="text-xs font-semibold text-green-600 mb-1">Mejorado:</div>
              <div className="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">
                {improvedText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}