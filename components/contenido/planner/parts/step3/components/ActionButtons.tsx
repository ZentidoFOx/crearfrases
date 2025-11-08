"use client"

import React from 'react'
import { ArrowLeft, Sparkles, Loader2, Languages as LanguagesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Language } from '../hooks/useLanguages'

interface ActionButtonsProps {
  onBack: () => void
  onRegenerate: () => void
  onTranslate?: () => void
  isGenerating: boolean
  isTranslating?: boolean
  languages: Language[]
  currentLanguage: string
  originalLanguage?: string
  onLanguageChange: (langCode: string) => void
  isLoadingLanguages: boolean
}

export function ActionButtons({
  onBack,
  onRegenerate,
  onTranslate,
  isGenerating,
  isTranslating = false,
  languages,
  currentLanguage,
  originalLanguage = 'es',
  onLanguageChange,
  isLoadingLanguages
}: ActionButtonsProps) {
  const showTranslateButton = currentLanguage !== originalLanguage && onTranslate
  
  return (
    <div className="flex flex-wrap gap-2 mb-4 justify-between items-center">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm('¿Estás seguro de regenerar el artículo? Se perderán los cambios actuales.')) {
              onRegenerate()
            }
          }}
          disabled={isGenerating}
          className="flex items-center gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
          title="Regenera el artículo directamente"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Regenerar
        </Button>
        
        {/* Botón Traducir - Solo aparece cuando se selecciona otro idioma */}
        {showTranslateButton && (
          <Button
            onClick={onTranslate}
            disabled={isTranslating}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            title={`Traducir contenido a ${languages.find(l => l.code === currentLanguage)?.name}`}
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LanguagesIcon className="h-4 w-4" />
            )}
            Traducir
          </Button>
        )}
      </div>
      <Select
        value={currentLanguage}
        onValueChange={onLanguageChange}
        disabled={isLoadingLanguages}
      >
        <SelectTrigger className="w-[200px]">
          {isLoadingLanguages ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : (
            <SelectValue placeholder="Seleccionar idioma" />
          )}
        </SelectTrigger>
        <SelectContent>
          {Array.isArray(languages) && languages.length > 0 ? (
            languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2">
                  {lang.flag && (
                    <img src={lang.flag} alt={lang.name} className="h-4 w-4" />
                  )}
                  <span>{lang.name}</span>
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No hay idiomas disponibles
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
