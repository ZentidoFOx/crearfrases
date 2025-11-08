import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error 404 Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 mb-6 shadow-lg">
            <FileQuestion className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-8xl font-bold text-gray-900 mb-4">
            404
          </h1>
          
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Página no encontrada
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Lo sentimos, la página que estás buscando no existe o ha sido movida a otra ubicación.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/dashboard">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Ir al Dashboard
            </Button>
          </Link>
          
          <Link href="/">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto border-2 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Volver al Inicio
            </Button>
          </Link>
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Search className="mr-2 h-5 w-5 text-purple-600" />
            Sugerencias
          </h3>
          
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Verifica que la URL esté escrita correctamente</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>La página puede haber sido eliminada o movida</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Usa el menú de navegación para encontrar lo que buscas</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>Intenta buscar desde la página principal</span>
            </li>
          </ul>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Código de error: <span className="font-mono font-semibold">404 - NOT_FOUND</span>
        </p>
      </div>
    </div>
  )
}
