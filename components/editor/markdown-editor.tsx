"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Edit3, Maximize2, Minimize2 } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown-renderer'

interface MarkdownEditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  className?: string
  minHeight?: string
}

/**
 * Editor de Markdown con preview en tiempo real
 * Usa react-markdown para renderizar
 */
export function MarkdownEditor({ 
  initialContent = '', 
  onChange,
  className = '',
  minHeight = '500px'
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  const handleChange = (newContent: string) => {
    setContent(newContent)
    onChange?.(newContent)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div 
      className={`border-2 border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        margin: 0,
        borderRadius: 0
      } : {}}
    >
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={mode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('edit')}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant={mode === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('split')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Dividido
          </Button>
          <Button
            variant={mode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex" style={{ height: isFullscreen ? 'calc(100vh - 50px)' : minHeight }}>
        {/* Editor Panel */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2 border-r border-gray-200' : 'w-full'} p-4 overflow-y-auto`}>
            <Textarea
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Escribe tu contenido en Markdown..."
              className="w-full h-full resize-none border-none focus:ring-0 font-mono text-sm"
              style={{ minHeight: '100%' }}
            />
          </div>
        )}

        {/* Preview Panel */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto bg-white`}>
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <div className="text-gray-400 text-center py-12">
                No hay contenido para previsualizar
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-500">
          <strong>Formato Markdown:</strong> **negrita** | *cursiva* | ## Título | - lista | [link](url) | ![img](url)
        </p>
      </div>
    </div>
  )
}
