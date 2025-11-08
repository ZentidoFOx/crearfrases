"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SaveArticleButtonProps {
  onClick: () => void
  isSaving: boolean
  saveError: string | null
  savedArticle: any | null
  disabled?: boolean
}

export function SaveArticleButton({ 
  onClick, 
  isSaving, 
  saveError, 
  savedArticle,
  disabled = false
}: SaveArticleButtonProps) {
  return (
    <div className="space-y-3">
      {/* Botón de guardar */}
      <Button
        onClick={onClick}
        disabled={isSaving || disabled}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
        size="lg"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Guardando...
          </>
        ) : savedArticle ? (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Guardado
          </>
        ) : (
          <>
            <Save className="h-5 w-5 mr-2" />
            Guardar Artículo
          </>
        )}
      </Button>

      {/* Mensaje de éxito */}
      {savedArticle && !saveError && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            <strong>¡Artículo guardado exitosamente!</strong>
            <br />
            <span className="text-sm">
              ID: #{savedArticle.id} • {savedArticle.word_count} palabras
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Mensaje de error */}
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Error al guardar:</strong> {saveError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
