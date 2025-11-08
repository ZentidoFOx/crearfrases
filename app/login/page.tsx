import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-lg shadow-orange-500/30" />
              <div className="relative h-6 w-6 rounded-full border-2 border-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              SEMRUSH
            </span>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido de nuevo
          </h2>
          <p className="text-gray-600">
            Ingresa a tu cuenta para continuar
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <LoginForm />
        </div>

        <div className="mt-8 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">Usuarios de prueba disponibles:</p>
              <p className="text-gray-600">
                <strong>Email:</strong> admin@semrush.com<br />
                <strong>Password:</strong> Admin123!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
