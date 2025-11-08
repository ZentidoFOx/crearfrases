"use client"

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { ProfileSessions } from '@/components/profile/ProfileSessions'
import { Monitor } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function SesionesPage() {
  const { user, loading: authLoading } = useAuth()

  const roleColors = {
    superadmin: {
      gradient: 'from-red-50 to-red-100',
      border: 'border-red-200',
      text: 'text-red-600',
      bg: 'bg-red-600',
      hover: 'hover:bg-red-700',
      badge: 'bg-red-100 text-red-700'
    },
    admin: {
      gradient: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-600',
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      badge: 'bg-blue-100 text-blue-700'
    },
    editor: {
      gradient: 'from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      bg: 'bg-emerald-600',
      hover: 'hover:bg-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700'
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <Sidebar />
        <main className="ml-20 pt-16 p-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <Card className="p-6">
              <Skeleton className="h-64 w-full" />
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const colors = roleColors[user.role_slug as keyof typeof roleColors] || roleColors.editor

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <Sidebar />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sesiones Activas</h1>
                <p className="text-gray-600">Administra tus dispositivos y sesiones activas</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <ProfileSessions roleColors={colors} />
        </div>
      </main>
    </div>
  )
}
