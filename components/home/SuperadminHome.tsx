"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Users, 
  Zap,
  Settings,
  Database,
  Activity,
  ChevronRight,
  Crown,
  Loader2
} from 'lucide-react'
import type { User } from '@/lib/api/auth'
import { usersService } from '@/lib/api/users'
import { aiModelsService } from '@/lib/api/ai-models'

interface SuperadminHomeProps {
  user: User
}

interface SuperadminStats {
  totalUsers: number
  activeAIModels: number
  totalSessions: number
}

export function SuperadminHome({ user }: SuperadminHomeProps) {
  const [stats, setStats] = useState<SuperadminStats>({
    totalUsers: 0,
    activeAIModels: 0,
    totalSessions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Obtener total de usuarios (superadmin ve todos)
      const usersResponse = await usersService.getAll(1, 100)
      
      if (usersResponse.success && usersResponse.data) {
        setStats(prev => ({
          ...prev,
          totalUsers: usersResponse.data.total
        }))
      }
      
      // Obtener modelos IA
      try {
        const allModels = await aiModelsService.getModels()
        setStats(prev => ({
          ...prev,
          activeAIModels: allModels.length // Mostrar total de modelos registrados
        }))
      } catch (error) {
        console.error('Error loading AI models:', error)
        // Si falla, dejar en 0
      }
      
    } catch (error) {
      console.error('Error loading superadmin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Crown className="h-8 w-8 text-red-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Bienvenido, {user.username}
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Panel de Superadministrador - Control total del sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Usuarios del Sistema</p>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                  <span className="text-sm text-gray-400">Cargando...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Modelos IA Registrados</p>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-400">Cargando...</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{stats.activeAIModels}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Estado del Sistema</p>
              <p className="text-xl font-bold text-emerald-600">Operativo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Acciones de Superadministrador</CardTitle>
          <CardDescription>Control total del sistema y configuración avanzada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/perfil/usuarios">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4 hover:bg-red-50 hover:border-red-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Gestionar Usuarios</p>
                    <p className="text-xs text-gray-500">Administrar todos los usuarios</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 ml-auto text-gray-400" />
              </Button>
            </Link>

            <Link href="/perfil/modelos-ia">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4 hover:bg-purple-50 hover:border-purple-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Modelos IA</p>
                    <p className="text-xs text-gray-500">Configurar inteligencia artificial</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 ml-auto text-gray-400" />
              </Button>
            </Link>

            <Link href="/perfil/estadisticas">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Estadísticas del Sistema</p>
                    <p className="text-xs text-gray-500">Métricas y análisis completos</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 ml-auto text-gray-400" />
              </Button>
            </Link>

            <Link href="/perfil/sesiones">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-4 hover:bg-emerald-50 hover:border-emerald-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Sesiones de Seguridad</p>
                    <p className="text-xs text-gray-500">Gestionar dispositivos activos</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 ml-auto text-gray-400" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
