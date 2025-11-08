"use client"

import React, { useState, useEffect } from 'react'
import { profileService, type UserSession } from '@/lib/api/profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Monitor, Smartphone, Tablet, Chrome, Globe, MapPin, Clock, Trash2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProfileSessionsProps {
  roleColors: {
    gradient: string
    border: string
    text: string
    bg: string
    hover: string
  }
}

export function ProfileSessions({ roleColors }: ProfileSessionsProps) {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const data = await profileService.getSessions()
      setSessions(data)
    } catch (error: any) {
      toast.error('Error al cargar las sesiones')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    setDeletingId(sessionId)
    try {
      await profileService.deleteSession(sessionId)
      toast.success('Sesión cerrada exitosamente')
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar la sesión')
    } finally {
      setDeletingId(null)
      setShowDeleteDialog(false)
      setSessionToDelete(null)
    }
  }

  const confirmDelete = (sessionId: number) => {
    setSessionToDelete(sessionId)
    setShowDeleteDialog(true)
  }

  const parseUserAgent = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    let browser = 'Desconocido'
    let device = 'Desktop'
    
    if (ua.includes('mobile') || ua.includes('android')) device = 'Mobile'
    else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet'
    
    if (ua.includes('chrome')) browser = 'Chrome'
    else if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('safari')) browser = 'Safari'
    else if (ua.includes('edge')) browser = 'Edge'
    
    return { browser, device }
  }

  const getDeviceIcon = (userAgent: string) => {
    const { device } = parseUserAgent(userAgent)
    switch (device) {
      case 'Mobile': return <Smartphone className="h-5 w-5" />
      case 'Tablet': return <Tablet className="h-5 w-5" />
      default: return <Monitor className="h-5 w-5" />
    }
  }

  const getBrowserIcon = (userAgent: string) => {
    const { browser } = parseUserAgent(userAgent)
    if (browser === 'Chrome') return <Chrome className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Hace unos momentos'
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sesiones Activas
          </CardTitle>
          <CardDescription>
            Gestiona tus sesiones activas en diferentes dispositivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay sesiones activas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const { browser, device } = parseUserAgent(session.user_agent)
                
                return (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Device Icon */}
                      <div className="p-3 rounded-lg bg-gray-200 text-gray-600">
                        {getDeviceIcon(session.user_agent)}
                      </div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getBrowserIcon(session.user_agent)}
                          <h3 className="font-semibold text-gray-900">
                            {browser} en {device}
                          </h3>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">IP: {session.ip_address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Creada: {formatDate(session.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Monitor className="h-3 w-3" />
                            <span className="truncate text-xs">{session.user_agent}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDelete(session.id)}
                        disabled={deletingId === session.id}
                      >
                        {deletingId === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cerrar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>💡 Consejo de seguridad:</strong> Si ves alguna sesión que no reconoces, ciérrala inmediatamente y cambia tu contraseña.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cerrará la sesión inmediatamente. El dispositivo tendrá que iniciar sesión nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToDelete && handleDeleteSession(sessionToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
