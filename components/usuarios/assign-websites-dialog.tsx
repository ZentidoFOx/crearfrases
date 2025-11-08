"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Globe, CheckCircle, XCircle, Loader2, Plus, X } from 'lucide-react'
import { usersAPI, type AssignedWebsite } from '@/lib/api/users'
import { websitesService, type Website } from '@/lib/api/websites'

interface AssignWebsitesDialogProps {
  open: boolean
  onClose: () => void
  userId: number
  username: string
}

export function AssignWebsitesDialog({ open, onClose, userId, username }: AssignWebsitesDialogProps) {
  const [assignedWebsites, setAssignedWebsites] = useState<AssignedWebsite[]>([])
  const [allWebsites, setAllWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, userId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load assigned websites
      const assignedResponse = await usersAPI.getUserWebsites(userId)
      if (assignedResponse.success) {
        setAssignedWebsites(assignedResponse.data)
      }

      // Load all websites
      const websitesResponse = await websitesService.getAll()
      if (websitesResponse.success && websitesResponse.data) {
        setAllWebsites(websitesResponse.data)
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cargar los sitios web')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (websiteId: number) => {
    try {
      setProcessing(websiteId)
      setError('')
      setSuccess('')

      const response = await usersAPI.assignWebsite(userId, websiteId)
      
      if (response.success) {
        setSuccess(response.message || 'Sitio web asignado exitosamente')
        await loadData() // Reload data
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al asignar el sitio web')
    } finally {
      setProcessing(null)
    }
  }

  const handleUnassign = async (websiteId: number) => {
    try {
      setProcessing(websiteId)
      setError('')
      setSuccess('')

      const response = await usersAPI.unassignWebsite(userId, websiteId)
      
      if (response.success) {
        setSuccess(response.message || 'Sitio web desasignado exitosamente')
        await loadData() // Reload data
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al desasignar el sitio web')
    } finally {
      setProcessing(null)
    }
  }

  const isAssigned = (websiteId: number) => {
    return assignedWebsites.some(w => w.id === websiteId)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            Asignar Sitios Web - {username}
          </DialogTitle>
          <DialogDescription>
            Selecciona los sitios web que este usuario podrá gestionar
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Success/Error Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {/* Assigned Websites */}
              {assignedWebsites.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Sitios Web Asignados ({assignedWebsites.length})
                  </h3>
                  <div className="space-y-2">
                    {assignedWebsites.map((website) => (
                      <div
                        key={website.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-emerald-200 bg-emerald-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{website.name}</p>
                            <p className="text-sm text-gray-600 truncate">{website.url}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {website.connection_verified ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                Verificado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                No verificado
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassign(website.id)}
                          disabled={processing === website.id}
                          className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {processing === website.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Websites */}
              {allWebsites.filter(w => !isAssigned(w.id)).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-600" />
                    Sitios Web Disponibles ({allWebsites.filter(w => !isAssigned(w.id)).length})
                  </h3>
                  <div className="space-y-2">
                    {allWebsites
                      .filter(w => !isAssigned(w.id))
                      .map((website) => (
                        <div
                          key={website.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Globe className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{website.name}</p>
                              <p className="text-sm text-gray-600 truncate">{website.url}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {website.connection_verified ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                  Verificado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                  No verificado
                                </Badge>
                              )}
                              {!website.is_active && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssign(website.id)}
                            disabled={processing === website.id || !website.is_active}
                            className="ml-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                          >
                            {processing === website.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Asignar
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {allWebsites.length === 0 && (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay sitios web disponibles</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
