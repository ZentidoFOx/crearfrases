"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import type { User, CreateUserData, UpdateUserData } from '@/lib/api/users'

interface UserFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  user?: User
  title: string
}

// Roles del sistema
const ALL_ROLES = [
  { value: '1', label: 'Superadmin', slug: 'superadmin' },
  { value: '2', label: 'Admin', slug: 'admin' },
  { value: '3', label: 'Editor', slug: 'editor' }
]

export function UserFormDialog({ open, onClose, onSubmit, user, title }: UserFormDialogProps) {
  const { user: currentUser } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    role_id: '3', // Default: Editor
    password: '',
    password_confirmation: '',
    is_active: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const isEditMode = !!user

  // Filter roles based on current user permissions
  // Admins cannot see or assign Superadmin role
  const ROLES = currentUser?.role_slug === 'admin' 
    ? ALL_ROLES.filter(role => role.slug !== 'superadmin')
    : ALL_ROLES

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        role_id: user.role_id?.toString() || '3',
        password: '',
        password_confirmation: '',
        is_active: user.is_active,
      })
    } else {
      setFormData({
        username: '',
        role_id: '3', // Default: Editor
        password: '',
        password_confirmation: '',
        is_active: true,
      })
    }
    setError('')
    setFieldErrors({})
  }, [user, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const submitData: any = {
        role_id: parseInt(formData.role_id),
      }

      if (!isEditMode) {
        // Crear usuario
        submitData.username = formData.username
        submitData.password = formData.password
        submitData.password_confirmation = formData.password_confirmation
      } else {
        // Editar usuario
        submitData.is_active = formData.is_active
        
        // Si se proporciona password, incluirlo
        if (formData.password) {
          submitData.password = formData.password
        }
      }

      await onSubmit(submitData)
      onClose()
    } catch (err: any) {
      if (err?.error?.details) {
        const errors: Record<string, string> = {}
        Object.keys(err.error.details).forEach(key => {
          errors[key] = err.error.details[key][0]
        })
        setFieldErrors(errors)
      } else {
        setError(err?.error?.message || 'Error al guardar usuario')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los datos del usuario' : 'Completa los datos para crear un nuevo usuario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Usuario *</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting || isEditMode}
              required={!isEditMode}
              placeholder="usuario123"
              className={fieldErrors.username ? 'border-red-500' : ''}
            />
            {fieldErrors.username && (
              <p className="text-sm text-red-500">{fieldErrors.username}</p>
            )}
            {isEditMode && (
              <p className="text-xs text-gray-500">El nombre de usuario no se puede modificar</p>
            )}
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role_id">Rol *</Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role_id: value }))}
              disabled={isSubmitting}
            >
              <SelectTrigger className={fieldErrors.role_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.role_id && (
              <p className="text-sm text-red-500">{fieldErrors.role_id}</p>
            )}
          </div>

          {/* Password */}
          {!isEditMode ? (
            // Crear usuario: password obligatorio
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className={fieldErrors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
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
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className={fieldErrors.password_confirmation ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password_confirmation && (
                  <p className="text-sm text-red-500">{fieldErrors.password_confirmation}</p>
                )}
              </div>
            </>
          ) : (
            // Editar usuario: password opcional
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Cambiar Contraseña (opcional)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Dejar vacío para mantener la actual"
                    className={fieldErrors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="font-normal cursor-pointer">
                  Usuario activo
                </Label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
