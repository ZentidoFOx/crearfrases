"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Plus, Search, AlertCircle } from 'lucide-react'
import { usersAPI, type User } from '@/lib/api/users'
import { UserFormDialog } from '@/components/usuarios/user-form-dialog'
import { UsersTable } from '@/components/usuarios/users-table'

interface ProfileUsersProps {
  roleColors: {
    gradient: string
    border: string
    text: string
    bg: string
    hover: string
  }
}

export function ProfileUsers({ roleColors }: ProfileUsersProps) {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [search])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await usersAPI.getAll(1, 100, search)
      
      if (response.success) {
        // El filtrado ya se hace en el backend
        // Admins solo ven los usuarios que ellos crearon
        // Superadmins ven todos los usuarios
        setUsers(response.data.users)
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return
    
    try {
      await usersAPI.delete(userId)
      await loadUsers()
    } catch (err: any) {
      setError(err?.error?.message || 'Error al eliminar usuario')
    }
  }

  const handleToggleStatus = async (userId: number) => {
    try {
      await usersAPI.toggleStatus(userId)
      await loadUsers()
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cambiar estado')
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await usersAPI.create(data)
      setShowCreateDialog(false)
      await loadUsers()
    } catch (err: any) {
      throw err
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingUser) return
    try {
      await usersAPI.update(editingUser.id, data)
      setEditingUser(null)
      await loadUsers()
    } catch (err: any) {
      throw err
    }
  }

  return (
    <Card className={`border-2 ${roleColors.border}`}>
      <CardHeader className={`bg-gradient-to-r ${roleColors.gradient}`}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className={`h-6 w-6 ${roleColors.text}`} />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              Administra los usuarios del sistema
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className={`${roleColors.bg} ${roleColors.hover} text-white`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <UsersTable
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          currentUserRole={currentUser?.role_slug || 'editor'}
        />

        {/* Create Dialog */}
        {showCreateDialog && (
          <UserFormDialog
            open={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            onSubmit={handleCreate}
            title="Crear Usuario"
          />
        )}

        {/* Edit Dialog */}
        {editingUser && (
          <UserFormDialog
            open={true}
            onClose={() => setEditingUser(null)}
            onSubmit={handleUpdate}
            user={editingUser}
            title="Editar Usuario"
          />
        )}
      </CardContent>
    </Card>
  )
}
