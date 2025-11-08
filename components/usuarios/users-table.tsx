"use client"

import { Button } from '@/components/ui/button'
import { Edit, Trash2, Power, Globe } from 'lucide-react'
import type { User } from '@/lib/api/users'

interface UsersTableProps {
  users: User[]
  loading: boolean
  onEdit: (user: User) => void
  onDelete: (userId: number) => void
  onToggleStatus: (userId: number) => void
  onAssignWebsites?: (user: User) => void
  currentUserRole: string
}

export function UsersTable({ users, loading, onEdit, onDelete, onToggleStatus, onAssignWebsites, currentUserRole }: UsersTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-12 text-center">
        <p className="text-gray-600">No se encontraron usuarios</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile View */}
      <div className="block lg:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.username}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.role_name || 'Sin rol'}
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
              Creado: {new Date(user.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </div>
            
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(user.id)}
                  className="flex-1"
                  disabled={currentUserRole === 'admin' && user.role_slug === 'superadmin'}
                >
                  <Power className={`h-4 w-4 mr-1 ${user.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  {user.is_active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(user)}
                  disabled={currentUserRole === 'admin' && user.role_slug === 'superadmin'}
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(user.id)}
                  disabled={currentUserRole === 'admin' && user.role_slug === 'superadmin'}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
              {onAssignWebsites && (user.role_slug === 'editor' || user.role_name?.toLowerCase() === 'editor') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAssignWebsites(user)}
                  className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Asignar Sitios Web
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.role_name || 'Sin rol'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.created_by_username ? (
                    <span className="text-gray-700 font-medium">{user.created_by_username}</span>
                  ) : (
                    <span className="text-gray-400 italic">Sistema</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {onAssignWebsites && (user.role_slug === 'editor' || user.role_name?.toLowerCase() === 'editor') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAssignWebsites(user)}
                        title="Asignar Sitios Web"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(user.id)}
                      title={user.is_active ? 'Desactivar' : 'Activar'}
                      disabled={currentUserRole === 'admin' && user.role_slug === 'superadmin'}
                    >
                      <Power className={`h-4 w-4 ${user.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                      title="Editar"
                      disabled={currentUserRole === 'admin' && user.role_slug === 'superadmin'}
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user.id)}
                      title="Eliminar"
                      disabled={currentUserRole === 'admin' && user.role_slug === 'superadmin'}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  )
}
