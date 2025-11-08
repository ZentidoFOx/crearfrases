"use client"

import { X, Search } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface GooglePreviewProps {
  isOpen: boolean
  onClose: () => void
  title: string
  metaDescription: string
  keyword?: string
  websiteUrl?: string
}

export function GooglePreview({
  isOpen,
  onClose,
  title,
  metaDescription,
  keyword = '',
  websiteUrl = 'www.ejemplo.com'
}: GooglePreviewProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Generar URL slug del título
  const urlSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/20">
      <div 
        ref={dropdownRef}
        className="w-full max-w-2xl bg-white rounded-lg shadow-2xl max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-900">Vista Previa Google Search</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Google Search Bar Mockup */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-full bg-white shadow-sm">
              <Search className="h-4 w-4 text-blue-500 ml-2" />
              <span className="text-sm text-gray-700 flex-1">{keyword || 'Tu palabra clave aquí...'}</span>
            </div>
          </div>

          {/* Google Result Preview */}
          <div className="bg-white px-4 py-3 rounded-lg border border-gray-200">
            <div className="space-y-1.5">
              {/* Breadcrumb URL */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                    {websiteUrl.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-700">{websiteUrl}</span>
                </div>
                <span className="text-gray-400 text-xs">›</span>
                <span className="text-xs text-gray-600 truncate">{urlSlug}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg text-[#1a0dab] hover:underline cursor-pointer leading-snug font-normal">
                {title || 'Título del artículo'}
              </h3>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                <div className="flex items-center text-yellow-500">
                  <span className="text-sm">⭐⭐⭐⭐⭐</span>
                </div>
                <span className="text-xs text-gray-600">Rating: 4.8</span>
                <span className="text-xs text-gray-400">· 523 votos</span>
              </div>

              {/* Meta Description */}
              <p className="text-xs text-[#4d5156] leading-relaxed">
                {metaDescription || 'Sin meta descripción. Google mostrará un extracto aleatorio del contenido de la página.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
