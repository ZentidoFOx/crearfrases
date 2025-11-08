"use client"

import React from 'react'
import { Sparkles, FileText, BarChart3, ArrowLeft, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DetailLevel } from '../types'
import { getDetailLevelConfig } from '../utils'

interface PlannerConfigProps {
  numSections: number
  setNumSections: (value: number) => void
  detailLevel: DetailLevel
  setDetailLevel: (value: DetailLevel) => void
  isGeneratingOutline: boolean
  onGenerateOutline: () => void
  onBack: () => void
}

export function PlannerConfig({
  numSections,
  setNumSections,
  detailLevel,
  setDetailLevel,
  isGeneratingOutline,
  onGenerateOutline,
  onBack
}: PlannerConfigProps) {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f54a00' }}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#2b2b40' }}>Planificador de Contenido</h2>
            <p className="text-sm text-gray-600">
              Personaliza la estructura de tu artículo
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Número de Secciones */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-gray-600" />
            </div>
            <label className="text-sm font-semibold" style={{ color: '#2b2b40' }}>
              Número de Secciones (H2)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNumSections(Math.max(3, numSections - 1))}
              className="w-10 h-10 rounded bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-bold text-gray-700 transition-all"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <div className="text-5xl font-bold mb-0.5" style={{ color: '#096' }}>{numSections}</div>
              <div className="text-[10px] text-gray-500 font-medium">secciones</div>
            </div>
            <button
              onClick={() => setNumSections(Math.min(10, numSections + 1))}
              className="w-10 h-10 rounded bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-bold text-gray-700 transition-all"
            >
              +
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-gray-500">
            <span>Mínimo: <span className="font-semibold">3</span></span>
            <span className="text-gray-300">•</span>
            <span>Máximo: <span className="font-semibold">10</span></span>
          </div>
        </div>

        {/* Nivel de Detalle */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center">
              <BarChart3 className="h-3.5 w-3.5 text-gray-600" />
            </div>
            <label className="text-sm font-semibold" style={{ color: '#2b2b40' }}>
              Nivel de Detalle
            </label>
          </div>
          <div className="space-y-2">
            {(['basic', 'medium', 'advanced'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDetailLevel(level)}
                className="w-full text-left p-2.5 rounded border transition-all"
                style={{
                  borderColor: detailLevel === level ? '#096' : '#e5e7eb',
                  borderWidth: detailLevel === level ? '2px' : '1px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs mb-0.5" style={{ color: '#2b2b40' }}>
                      {level === 'basic' ? 'Básico' : level === 'medium' ? 'Medio' : 'Avanzado'}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {getDetailLevelConfig(level).structure} (~{getDetailLevelConfig(level).wordsPerSection} palabras)
                    </div>
                  </div>
                  {detailLevel === level && (
                    <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#096' }}>
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de Configuración */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold" style={{ color: '#2b2b40' }}>Resumen:</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white rounded p-3 border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl font-bold mb-0.5" style={{ color: '#096' }}>{numSections}</div>
              <div className="text-[10px] text-gray-600 font-medium">Secciones H2</div>
            </div>
          </div>
          <div className="bg-white rounded p-3 border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl font-bold mb-0.5" style={{ color: '#9810fa' }}>
                {getDetailLevelConfig(detailLevel).wordsPerSection}
              </div>
              <div className="text-[10px] text-gray-600 font-medium">Palabras/sección</div>
            </div>
          </div>
          <div className="bg-white rounded p-3 border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="text-4xl font-bold mb-0.5" style={{ color: '#ff6900' }}>
                {numSections * getDetailLevelConfig(detailLevel).wordsPerSection + 350}
              </div>
              <div className="text-[10px] text-gray-600 font-medium">Total palabras</div>
            </div>
          </div>
          <div className="bg-white rounded p-3 border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="text-sm font-bold mb-0.5" style={{ color: '#2b2b40' }}>{getDetailLevelConfig(detailLevel).structure}</div>
              <div className="text-[10px] text-gray-600 font-medium">Estructura</div>
            </div>
          </div>
        </div>
        
        {/* Estimación de tiempo de lectura */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600">
            <FileText className="h-3 w-3" />
            <span className="font-medium">
              Tiempo de lectura: ~{Math.ceil((numSections * getDetailLevelConfig(detailLevel).wordsPerSection + 350) / 200)} min
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          onClick={onBack}
          variant="outline"
          className="h-10 border-2 border-gray-200 hover:border-gray-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Button
          onClick={onGenerateOutline}
          disabled={isGeneratingOutline}
          className="h-10 text-white"
          style={{ backgroundColor: '#096' }}
          onMouseEnter={(e) => !isGeneratingOutline && (e.currentTarget.style.backgroundColor = '#007a6e')}
          onMouseLeave={(e) => !isGeneratingOutline && (e.currentTarget.style.backgroundColor = '#096')}
        >
          {isGeneratingOutline ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar Estructura
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
