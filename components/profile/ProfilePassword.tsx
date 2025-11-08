"use client"

import React, { useState } from 'react'
import { profileService } from '@/lib/api/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProfilePasswordProps {
  roleColors: {
    gradient: string
    border: string
    text: string
    bg: string
    hover: string
  }
}

export function ProfilePassword({ roleColors }: ProfilePasswordProps) {
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Check password strength for new password
    if (field === 'new_password') {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password: string) => {
    let score = 0
    
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    
    const strength = {
      0: { label: 'Muy débil', color: 'bg-red-500' },
      1: { label: 'Débil', color: 'bg-orange-500' },
      2: { label: 'Regular', color: 'bg-yellow-500' },
      3: { label: 'Buena', color: 'bg-blue-500' },
      4: { label: 'Buena', color: 'bg-blue-600' },
      5: { label: 'Fuerte', color: 'bg-green-500' },
      6: { label: 'Muy fuerte', color: 'bg-green-600' }
    }
    
    setPasswordStrength({
      score,
      label: strength[score as keyof typeof strength]?.label || '',
      color: strength[score as keyof typeof strength]?.color || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validations
    if (formData.new_password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    
    if (formData.new_password !== formData.confirm_password) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    
    if (formData.current_password === formData.new_password) {
      toast.error('La nueva contraseña debe ser diferente a la actual')
      return
    }
    
    setLoading(true)
    try {
      await profileService.changePassword(formData.current_password, formData.new_password)
      toast.success('Contraseña actualizada exitosamente. Todas tus sesiones fueron cerradas.')
      
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setPasswordStrength({ score: 0, label: '', color: '' })
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = formData.current_password && 
                    formData.new_password && 
                    formData.confirm_password &&
                    formData.new_password === formData.confirm_password &&
                    passwordStrength.score >= 3

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Cambiar Contraseña
        </CardTitle>
        <CardDescription>
          Actualiza tu contraseña para mantener tu cuenta segura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Al cambiar tu contraseña, todas tus sesiones activas serán cerradas automáticamente.
            </AlertDescription>
          </Alert>

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.current_password}
                onChange={(e) => handleChange('current_password', e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new_password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={(e) => handleChange('new_password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.new_password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Fortaleza:</span>
                    <span className="font-medium">{passwordStrength.label}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Requirements */}
              <div className="text-xs text-gray-600 space-y-1 mt-2">
                <p className="font-medium">Requisitos:</p>
                <ul className="space-y-1 ml-4">
                  <li className={formData.new_password.length >= 8 ? 'text-green-600' : ''}>
                    • Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(formData.new_password) ? 'text-green-600' : ''}>
                    • Al menos una mayúscula
                  </li>
                  <li className={/[a-z]/.test(formData.new_password) ? 'text-green-600' : ''}>
                    • Al menos una minúscula
                  </li>
                  <li className={/[0-9]/.test(formData.new_password) ? 'text-green-600' : ''}>
                    • Al menos un número
                  </li>
                  <li className={/[^a-zA-Z0-9]/.test(formData.new_password) ? 'text-green-600' : ''}>
                    • Al menos un carácter especial
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={(e) => handleChange('confirm_password', e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirm_password && (
                <p className={`text-xs ${
                  formData.new_password === formData.confirm_password
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formData.new_password === formData.confirm_password
                    ? '✓ Las contraseñas coinciden'
                    : '✗ Las contraseñas no coinciden'}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className={`${roleColors.bg} ${roleColors.hover} text-white`}
              disabled={!canSubmit || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
