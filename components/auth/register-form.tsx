"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useAuthForm } from '@/hooks/use-auth-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react'

export function RegisterForm() {
  const { register } = useAuth()
  const { errors, isSubmitting, generalError, setIsSubmitting, clearErrors, handleError } = useAuthForm()
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    password_confirmation: '',
    role_id: 3, // Default: Editor
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()
    setIsSubmitting(true)

    try {
      await register(formData)
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
        <Label htmlFor="username">Usuario *</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="usuario123"
          value={formData.username}
          onChange={handleChange}
          disabled={isSubmitting}
          required
          className={errors.username ? 'border-red-500' : ''}
        />
        {errors.username && (
          <p className="text-sm text-red-500">{errors.username[0]}</p>
        )}
        <p className="text-xs text-gray-500">
          El usuario debe ser único en el sistema
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña *</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
            required
            className={errors.password ? 'border-red-500' : ''}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password[0]}</p>
        )}
        <p className="text-xs text-gray-500">
          Mínimo 8 caracteres, incluye mayúsculas, números y símbolos
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password_confirmation">Confirmar Contraseña *</Label>
        <div className="relative">
          <Input
            id="password_confirmation"
            name="password_confirmation"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.password_confirmation}
            onChange={handleChange}
            disabled={isSubmitting}
            required
            className={errors.password_confirmation ? 'border-red-500' : ''}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password_confirmation && (
          <p className="text-sm text-red-500">{errors.password_confirmation[0]}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="mr-2">Creando cuenta...</span>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Crear Cuenta
          </>
        )}
      </Button>

      <div className="text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{' '}
        <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
          Inicia sesión
        </Link>
      </div>
    </form>
  )
}
