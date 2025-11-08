"use client"

import React from 'react'
import { Sparkles } from 'lucide-react'
import { GenerationStep } from '../types'

interface LoadingOutlineProps {
  numSections: number
}

export function LoadingOutline({ numSections }: LoadingOutlineProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16 mb-6">
        {/* Círculo de fondo suave */}
        <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(0, 150, 137, 0.1)' }}></div>
        {/* Spinner simple */}
        <div className="absolute inset-0 border-4 border-transparent rounded-full animate-spin" style={{ borderTopColor: '#009689', borderRightColor: 'rgba(0, 150, 137, 0.3)' }}></div>
        {/* Ícono */}
        <Sparkles className="absolute inset-0 m-auto h-7 w-7" style={{ color: '#009689' }} />
      </div>
      
      <div className="text-center max-w-md">
        <h3 className="text-xl font-bold mb-2" style={{ color: '#2b2b40' }}>
          Generando estructura...
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Creando {numSections} secciones optimizadas para tu artículo
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full transition-all"
            style={{ width: '60%', backgroundColor: '#009689' }}
          ></div>
        </div>
      </div>
    </div>
  )
}

interface LoadingContentProps {
  generationStep: GenerationStep
}

export function LoadingContent({ generationStep }: LoadingContentProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16 mb-6">
        {/* Círculo de fondo suave */}
        <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(0, 150, 137, 0.1)' }}></div>
        {/* Spinner simple */}
        <div className="absolute inset-0 border-4 border-transparent rounded-full animate-spin" style={{ borderTopColor: '#009689', borderRightColor: 'rgba(0, 150, 137, 0.3)' }}></div>
        {/* Ícono */}
        <Sparkles className="absolute inset-0 m-auto h-7 w-7" style={{ color: '#009689' }} />
      </div>
      
      <div className="text-center max-w-md">
        <h3 className="text-xl font-bold mb-2" style={{ color: '#2b2b40' }}>
          {generationStep === 'content' ? 'Creando contenido...' : 
           generationStep === 'seo' ? 'Analizando SEO...' : 
           'Finalizando...'}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {generationStep === 'content' 
            ? 'Nuestro AI está escribiendo tu artículo optimizado' 
            : generationStep === 'seo'
            ? 'Evaluando calidad SEO y legibilidad'
            : 'Preparando tu contenido'}
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: generationStep === 'content' ? '50%' : generationStep === 'seo' ? '90%' : '100%',
              backgroundColor: '#009689'
            }}
          ></div>
        </div>
        <span className="text-xs font-medium mt-2 block text-gray-600">
          {generationStep === 'content' ? '50%' : generationStep === 'seo' ? '90%' : '100%'}
        </span>
      </div>
    </div>
  )
}
