"use client"

import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ContenidoHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center gap-3">
            <FileText className="h-10 w-10 text-purple-600" />
            Marketing de Contenido
          </h1>
          <p className="text-lg text-gray-600">
            Gestiona y optimiza todo tu contenido desde un solo lugar
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Contenido
        </Button>
      </div>
    </div>
  )
}
