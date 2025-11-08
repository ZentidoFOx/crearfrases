"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useAuthForm } from '@/hooks/use-auth-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

export function LoginForm() {
  const { login } = useAuth()
  const { errors, isSubmitting, generalError, setIsSubmitting, clearErrors, handleError } = useAuthForm()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()
    setIsSubmitting(true)

    try {
      await login({
        username,
        password,
        remember_me: rememberMe,
      })
    } catch (error: any) {
      handleError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          type="text"
          placeholder="usuario123"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          required
          className={errors.username ? 'border-red-500' : ''}
        />
        {errors.username && (
          <p className="text-sm text-red-500">{errors.username[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
            className={errors.password ? 'border-red-500' : ''}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password[0]}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
            Recordarme
          </Label>
        </div>

        <Link
          href="/forgot-password"
          className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="mr-2">Iniciando sesión...</span>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </>
        )}
      </Button>

      <div className="text-center text-sm text-gray-600">
        ¿No tienes una cuenta?{' '}
        <Link href="/register" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
          Regístrate aquí
        </Link>
      </div>
    </form>
  )
}
