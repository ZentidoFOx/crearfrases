"use client"

import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { WebsiteInfoDisplay } from '@/components/examples/website-info-display'

export default function TestDominioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-50">
      <Header />
      <Sidebar />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header de la Página */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🧪 Prueba del Selector de Dominios
            </h1>
            <p className="text-gray-600">
              Selecciona un dominio en el header y observa cómo se actualiza esta página
            </p>
          </div>

          {/* Componente de Ejemplo */}
          <WebsiteInfoDisplay />

          {/* Instrucciones */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              📝 Instrucciones de Prueba
            </h2>
            <ol className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Ve al header y haz clic en el selector de dominios (🌐)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Selecciona un dominio diferente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Observa cómo esta página se actualiza automáticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Recarga la página (F5) - el dominio seleccionado se mantiene</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">5.</span>
                <span>Abre la consola del navegador (F12) y escribe: 
                  <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">
                    localStorage.getItem('active_website')
                  </code>
                </span>
              </li>
            </ol>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">✅ Funcionalidades</h3>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Selección persiste en localStorage</li>
                <li>• Disponible en toda la app</li>
                <li>• Se mantiene entre recargas</li>
                <li>• Sincronización en tiempo real</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">🔧 Cómo Usarlo</h3>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• Importa useWebsite() hook</li>
                <li>• Accede a activeWebsite</li>
                <li>• Usa activeWebsite.id para filtrar</li>
                <li>• Usa activeWebsite.url para APIs</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
