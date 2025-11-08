import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Loader */}
        <div className="relative inline-flex items-center justify-center mb-6">
          {/* Outer ring */}
          <div className="absolute w-24 h-24 rounded-full border-4 border-purple-200 animate-ping"></div>
          
          {/* Middle ring */}
          <div className="absolute w-20 h-20 rounded-full border-4 border-purple-300 animate-spin"></div>
          
          {/* Inner icon */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        </div>
        
        {/* Loading text */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Cargando...
        </h2>
        
        <p className="text-gray-600">
          Por favor espera un momento
        </p>
        
        {/* Loading dots animation */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
