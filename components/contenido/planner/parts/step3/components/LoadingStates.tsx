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
  // Mensaje especial cuando termina la generación
  if (generationStep === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-20 h-20 mb-8">
          {/* Círculo de fondo con animación de éxito */}
          <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}></div>
          {/* Ícono de éxito con animación */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-green-500 animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>
        
        <div className="text-center max-w-lg px-6">
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            ¡Artículo generado con éxito! 🎉
          </h3>
          <p className="text-gray-700 text-base mb-2 leading-relaxed">
            Tu contenido ha sido creado y optimizado completamente
          </p>
          <p className="text-gray-500 text-sm mb-6">
            En unos segundos serás redireccionado al editor del artículo para que puedas revisarlo y publicarlo
          </p>
          
          {/* Barra de progreso animada */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full animate-pulse"
              style={{
                width: '100%',
                backgroundColor: '#22c55e'
              }}
            ></div>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="animate-pulse">Preparando redirección...</span>
          </div>
        </div>
      </div>
    )
  }
  
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
