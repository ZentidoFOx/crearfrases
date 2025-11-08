'use client'

import { ServerCrash, Home, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Badge */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 mb-6 shadow-lg">
                <ServerCrash className="h-12 w-12 text-white" />
              </div>
              
              <h1 className="text-8xl font-bold text-gray-900 mb-4">
                500
              </h1>
              
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                Error del Servidor
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Ha ocurrido un error crítico en el servidor. Estamos trabajando para resolverlo lo antes posible.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={() => reset()}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
              >
                <RefreshCcw className="mr-2 h-5 w-5" />
                Reintentar
              </Button>
              
              <Link href="/">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-2 border-gray-300 hover:bg-gray-50"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Ir al Inicio
                </Button>
              </Link>
            </div>

            {/* Info Box */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ¿Qué ha pasado?
              </h3>
              
              <p className="text-gray-700 mb-4">
                Un error crítico ha impedido que la aplicación funcione correctamente. 
                Esto puede deberse a:
              </p>
              
              <ul className="space-y-2 text-gray-700 mb-6">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Problemas temporales con el servidor</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Mantenimiento programado</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  <span>Alta carga en el sistema</span>
                </li>
              </ul>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <p className="text-sm text-orange-800">
                  <strong>Consejo:</strong> Si el problema persiste, intenta nuevamente en unos minutos 
                  o contacta al equipo de soporte.
                </p>
              </div>
            </div>

            {/* Error ID */}
            {error.digest && (
              <p className="text-center text-sm text-gray-500 mt-8">
                ID de error: <span className="font-mono font-semibold">{error.digest}</span>
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
