import { RegisterForm } from '@/components/auth/register-form'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
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
            Crear cuenta
          </h2>
          <p className="text-gray-600">
            Únete y comienza a optimizar tu presencia digital
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
