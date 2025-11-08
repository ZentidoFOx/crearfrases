'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console or error reporting service
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 mb-6 shadow-lg animate-pulse">
            <AlertTriangle className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            ¡Oops!
          </h1>
          
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Algo salió mal
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y estamos trabajando para solucionarlo.
          </p>
        </div>

        {/* Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-900 mb-3">
              Detalles del Error (Solo visible en desarrollo)
            </h3>
            <pre className="text-sm text-red-800 overflow-x-auto whitespace-pre-wrap break-words font-mono bg-white p-4 rounded-lg border border-red-200">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-red-700 mt-3">
                Error ID: <span className="font-mono font-semibold">{error.digest}</span>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            onClick={reset}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Intentar de nuevo
          </Button>
          
          <Link href="/dashboard">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto border-2 border-gray-300 hover:bg-gray-50"
            >
              <Home className="mr-2 h-5 w-5" />
              Ir al Dashboard
            </Button>
          </Link>
        </div>

        {/* Help Info */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            ¿Qué puedes hacer?
          </h3>
          
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Intenta recargar la página usando el botón de arriba</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Verifica tu conexión a internet</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Si el problema persiste, contacta al soporte técnico</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Intenta acceder desde la página principal</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
