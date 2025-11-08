"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  UserPlus, 
  Search,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  UserCheck,
  UserX,
  Loader2,
  Info,
  Lock,
  Key,
  Eye
} from 'lucide-react'
import { usersService, type User as UserData } from '@/lib/api/users'
import { UserFormDialog } from '@/components/usuarios/user-form-dialog'
import { UsersTable } from '@/components/usuarios/users-table'
import { AssignWebsitesDialog } from '@/components/usuarios/assign-websites-dialog'
import { useRouter } from 'next/navigation'

export default function UsuariosPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [assigningWebsitesUser, setAssigningWebsitesUser] = useState<UserData | null>(null)
  const [error, setError] = useState('')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    recent: 0,
    superadmins: 0,
    admins: 0,
    editors: 0
  })

  useEffect(() => {
    if (user) {
      loadUsers()
    }
  }, [search, user])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await usersService.getAll(1, 100, search)
      
      if (response.success && response.data) {
        const userData = response.data.users
        setUsers(userData)

        // Calculate stats
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        setStats({
          total: userData.length,
          active: userData.filter(u => u.is_active).length,
          inactive: userData.filter(u => !u.is_active).length,
          recent: userData.filter(u => new Date(u.created_at) > sevenDaysAgo).length,
          superadmins: userData.filter(u => u.role_slug === 'superadmin').length,
          admins: userData.filter(u => u.role_slug === 'admin').length,
          editors: userData.filter(u => u.role_slug === 'editor').length
        })
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: UserData) => {
    setEditingUser(user)
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return
    
    try {
      await usersService.delete(userId)
      await loadUsers()
    } catch (err: any) {
      setError(err?.error?.message || 'Error al eliminar usuario')
    }
  }

  const handleToggleStatus = async (userId: number) => {
    try {
      await usersService.toggleStatus(userId)
      await loadUsers()
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cambiar estado')
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await usersService.create(data)
      setShowCreateDialog(false)
      await loadUsers()
    } catch (err: any) {
      throw err
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingUser) return
    try {
      await usersService.update(editingUser.id, data)
      setEditingUser(null)
      await loadUsers()
    } catch (err: any) {
      throw err
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Header />
        <Sidebar />
        <main className="ml-20 pt-16 p-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    )
  }

  if (!user || (user.role_slug !== 'superadmin' && user.role_slug !== 'admin')) {
    router.push('/')
    return null
  }

  const roleColors = {
    superadmin: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700 border-red-200'
    },
    admin: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    editor: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
  }

  const colors = roleColors[user.role_slug as keyof typeof roleColors]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Header />
      <Sidebar />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shadow-lg`}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Gestión de Usuarios</h1>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4" />
                    Control completo de usuarios, roles y permisos
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className={`${colors.bg} hover:opacity-90 shadow-lg`}
              size="lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Nuevo Usuario
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <UserCheck className="h-3 w-3 mr-1" />
                        {stats.active} activos
                      </Badge>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.active}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% del total
                      </Badge>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inactive Users */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuarios Inactivos</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.inactive}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <UserX className="h-3 w-3 mr-1" />
                        Suspendidos
                      </Badge>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center">
                    <XCircle className="h-7 w-7 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nuevos (7 días)</p>
                    <p className="text-3xl font-bold text-violet-600 mt-2">{stats.recent}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Esta semana
                      </Badge>
                    </div>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Two Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Block - Stats by Role */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Por Rol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Superadmins */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-white border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Superadmins</span>
                      <Badge className={roleColors.superadmin.badge}>
                        {stats.superadmins}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.superadmins / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Admins */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-white border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Admins</span>
                      <Badge className={roleColors.admin.badge}>
                        {stats.admins}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.admins / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Editors */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-white border border-emerald-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Editors</span>
                      <Badge className={roleColors.editor.badge}>
                        {stats.editors}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.editors / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Filters */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    Vista Rápida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setSearch('')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Todos ({stats.total})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-emerald-600 hover:text-emerald-700"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activos ({stats.active})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-orange-600 hover:text-orange-700"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Inactivos ({stats.inactive})
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Block - Users Table */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Lista de Usuarios</CardTitle>
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nombre de usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <UsersTable
                    users={users}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onAssignWebsites={setAssigningWebsitesUser}
                    currentUserRole={user?.role_slug || 'editor'}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Permisos Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Sistema de Permisos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Superadmin</p>
                    <p className="text-xs text-gray-600">Acceso total al sistema. Puede gestionar todos los usuarios y configuraciones.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Admin</p>
                    <p className="text-xs text-gray-600">Puede crear y gestionar usuarios Editors. No puede modificar Superadmins.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Editor</p>
                    <p className="text-xs text-gray-600">Puede crear y editar contenido. No tiene acceso a gestión de usuarios.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-violet-600" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Contraseñas Seguras</p>
                    <p className="text-xs text-gray-600">Todas las contraseñas se encriptan con bcrypt antes de almacenarse.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Tokens JWT</p>
                    <p className="text-xs text-gray-600">Autenticación segura mediante JSON Web Tokens con renovación automática.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Auditoría</p>
                    <p className="text-xs text-gray-600">Todas las acciones se registran con fecha y usuario responsable.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Practices Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 via-white to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-amber-600" />
                  Buenas Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Principio de Mínimo Privilegio</p>
                    <p className="text-xs text-gray-600">Asigna solo los permisos necesarios para cada rol.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <UserX className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Desactivar en lugar de Eliminar</p>
                    <p className="text-xs text-gray-600">Prefiere desactivar usuarios para mantener el historial.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Revisión Periódica</p>
                    <p className="text-xs text-gray-600">Revisa usuarios inactivos y permisos regularmente.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <UserFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        mode="create"
      />

      <UserFormDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={handleUpdate}
        mode="edit"
        user={editingUser || undefined}
      />

      {/* Assign Websites Dialog */}
      {assigningWebsitesUser && (
        <AssignWebsitesDialog
          open={!!assigningWebsitesUser}
          onClose={() => setAssigningWebsitesUser(null)}
          userId={assigningWebsitesUser.id}
          username={assigningWebsitesUser.username}
        />
      )}
    </div>
  )
}
