"use client"

import React from 'react'
import { Sparkles, Check, BarChart3, Target, FileText } from 'lucide-react'

export function InfoPanel() {
  return (
    <div className="mt-8">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">💡 Guía de Uso del Editor</h2>
          <p className="text-sm text-gray-600">Todo lo que puedes hacer con tu contenido generado</p>
        </div>

        {/* Grid de Características */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Editor WYSIWYG Features */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Editor WYSIWYG</h3>
                <p className="text-xs text-gray-500">Edición visual</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-pink-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Tab Visual</p>
                  <p className="text-xs text-gray-600">Edita con formato en tiempo real</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-pink-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Tab Código</p>
                  <p className="text-xs text-gray-600">Visualiza el Markdown generado</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-pink-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Sincronización</p>
                  <p className="text-xs text-gray-600">Cambios reflejados al instante</p>
                </div>
              </li>
            </ul>
          </div>

          {/* SEO Analysis */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Análisis SEO</h3>
                <p className="text-xs text-gray-500">Optimización automática</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Análisis en Tiempo Real</p>
                  <p className="text-xs text-gray-600">Se actualiza mientras editas</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Yoast SEO Compatible</p>
                  <p className="text-xs text-gray-600">Métricas profesionales incluidas</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Métricas Avanzadas</p>
                  <p className="text-xs text-gray-600">Densidad, legibilidad y más</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Acciones Rápidas</h3>
                <p className="text-xs text-gray-500">Gestiona tu contenido</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Copiar al Portapapeles</p>
                  <p className="text-xs text-gray-600">Un click para copiar todo</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Descargar Markdown</p>
                  <p className="text-xs text-gray-600">Guarda como archivo .md</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Publicar en WordPress</p>
                  <p className="text-xs text-gray-600">Directo a tu sitio web</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-6 pt-6 border-t border-slate-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Formato</p>
                <p className="text-sm font-bold text-gray-900">Markdown</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">SEO</p>
                <p className="text-sm font-bold text-gray-900">Optimizado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">IA</p>
                <p className="text-sm font-bold text-gray-900">Generado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Listo</p>
                <p className="text-sm font-bold text-gray-900">Publicar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
