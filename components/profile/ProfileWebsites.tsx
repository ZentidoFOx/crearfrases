"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Globe, Plus, Search, AlertCircle, Copy, Check, CheckCircle, Edit, Trash2, Power, ExternalLink, Shield, Eye, EyeOff, Loader2, Code } from 'lucide-react'
import { websitesService, type Website } from '@/lib/api/websites'
import { Badge } from '@/components/ui/badge'

interface ProfileWebsitesProps {
  roleColors: {
    gradient: string
    border: string
    text: string
    bg: string
    hover: string
  }
}

export function ProfileWebsites({ roleColors }: ProfileWebsitesProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [copiedKey, setCopiedKey] = useState<number | null>(null)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({})
  const [verificationDetails, setVerificationDetails] = useState<any>(null)

  useEffect(() => {
    loadWebsites()
  }, [])

  const loadWebsites = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await websitesService.getAll()
      
      if (response.success && response.data) {
        setWebsites(response.data)
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cargar sitios web')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await websitesService.create(data)
      setShowCreateDialog(false)
      await loadWebsites()
    } catch (err: any) {
      throw err
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingWebsite) return
    try {
      await websitesService.update(editingWebsite.id, data)
      setEditingWebsite(null)
      await loadWebsites()
    } catch (err: any) {
      throw err
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este sitio web?')) return
    
    try {
      await websitesService.delete(id)
      await loadWebsites()
    } catch (err: any) {
      setError(err?.error?.message || 'Error al eliminar sitio')
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await websitesService.toggleActive(id)
      await loadWebsites()
    } catch (err: any) {
      setError(err?.error?.message || 'Error al cambiar estado')
    }
  }

  const handleVerifyConnection = async (id: number) => {
    try {
      setError('')
      setSuccessMessage('')
      setVerificationDetails(null)
      setVerifyingId(id)
      
      const response = await websitesService.verifyConnection(id)
      
      if (response.success) {
        setSuccessMessage(response.message || '✓ Conexión verificada exitosamente')
        setVerificationDetails(response.data?.verification || response.data?.details)
        await loadWebsites()
        // Limpiar mensaje después de 8 segundos
        setTimeout(() => {
          setSuccessMessage('')
          setVerificationDetails(null)
        }, 8000)
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Error al verificar conexión')
      setVerificationDetails(err?.error?.details)
    } finally {
      setVerifyingId(null)
    }
  }

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const togglePasswordVisibility = (id: number) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const filteredWebsites = websites.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.url.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card className={`border-2 ${roleColors.border}`}>
      <CardHeader className={`bg-gradient-to-r ${roleColors.gradient}`}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Globe className={`h-6 w-6 ${roleColors.text}`} />
              Gestión de Sitios Web
            </CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              Configura sitios web con autenticación por API Key
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className={`${roleColors.bg} ${roleColors.hover} text-white`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Sitio
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">{error}</div>
              {verificationDetails && (
                <div className="mt-3 space-y-1 text-sm">
                  {verificationDetails.error_type && (
                    <div className="flex items-center gap-2">
                      <span className="text-red-200">Tipo de error:</span>
                      <span className="font-medium">{verificationDetails.error_type}</span>
                    </div>
                  )}
                  {verificationDetails.http_code && (
                    <div className="flex items-center gap-2">
                      <span className="text-red-200">Código HTTP:</span>
                      <span className="font-medium">{verificationDetails.http_code}</span>
                    </div>
                  )}
                  {verificationDetails.endpoint && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-400">
                      <code className="text-xs bg-red-900/30 px-2 py-1 rounded border border-red-400">
                        {verificationDetails.endpoint}
                      </code>
                    </div>
                  )}
                  {verificationDetails.error_type === 'plugin_not_found' && (
                    <div className="mt-3 pt-3 border-t border-red-400">
                      <p className="text-xs text-red-200 mb-2">ℹ️ Instala el plugin en WordPress:</p>
                      <ol className="list-decimal list-inside text-xs space-y-1">
                        <li>Sube el archivo 'content-search-api.php' a wp-content/plugins/</li>
                        <li>Activa el plugin desde el panel de WordPress</li>
                        <li>Prueba el endpoint público (no requiere autenticación)</li>
                      </ol>
                    </div>
                  )}
                  {verificationDetails.error_type === 'authentication_error' && (
                    <div className="mt-3 pt-3 border-t border-red-400">
                      <p className="text-xs text-red-200">
                        ℹ️ Verifica que la contraseña de aplicación sea correcta y tenga permisos.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="font-semibold mb-2">{successMessage}</div>
              {verificationDetails && (
                <div className="mt-3 space-y-1 text-sm">
                  {verificationDetails.plugin_version && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Plugin:</span>
                      <span className="font-medium">{verificationDetails.plugin_version}</span>
                    </div>
                  )}
                  {verificationDetails.api_working !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">API funcionando:</span>
                      <span className={verificationDetails.api_working ? 'text-green-700 font-medium' : 'text-red-600'}>
                        {verificationDetails.api_working ? '✓ Sí' : '✗ No'}
                      </span>
                    </div>
                  )}
                  {verificationDetails.test_results !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Resultados de prueba:</span>
                      <span className="font-medium">{verificationDetails.test_results}</span>
                    </div>
                  )}
                  {verificationDetails.endpoint && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-green-200">
                      <code className="text-xs bg-white px-2 py-1 rounded border border-green-300">
                        {verificationDetails.endpoint}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando sitios web...</p>
          </div>
        )}

        {/* Websites List */}
        {!loading && filteredWebsites.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay sitios web configurados
          </div>
        )}

        {!loading && filteredWebsites.length > 0 && (
          <div className="space-y-4">
            {filteredWebsites.map((website) => (
              <Card key={website.id} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{website.name}</h3>
                        <Badge variant={website.is_active ? 'default' : 'secondary'}>
                          {website.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <a 
                        href={website.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {website.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {website.description && (
                        <p className="text-sm text-gray-600 mt-2">{website.description}</p>
                      )}
                      {website.connection_verified && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Conexión verificada
                          {website.last_verified_at && (
                            <span className="text-gray-500">- {new Date(website.last_verified_at).toLocaleString('es-ES')}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/perfil/sitios-web/${website.id}`)}
                        title="Gestionar API"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(website.id)}
                        title={website.is_active ? 'Desactivar' : 'Activar'}
                      >
                        <Power className={`h-4 w-4 ${website.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingWebsite(website)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(website.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Contraseña de Aplicación */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-gray-500">Contraseña de Aplicación</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyConnection(website.id)}
                        className="text-xs"
                        disabled={verifyingId === website.id}
                      >
                        {verifyingId === website.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Verificar Conexión
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-200 font-mono overflow-x-auto">
                        {showPassword[website.id] ? website.app_password : '•'.repeat(website.app_password.length)}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePasswordVisibility(website.id)}
                        title={showPassword[website.id] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword[website.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(website.app_password, website.id)}
                        title="Copiar contraseña"
                      >
                        {copiedKey === website.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span>Peticiones: {website.request_count}</span>
                    {website.last_request_at && (
                      <span>Última: {new Date(website.last_request_at).toLocaleString('es-ES')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <WebsiteFormDialog
          open={showCreateDialog || !!editingWebsite}
          onClose={() => {
            setShowCreateDialog(false)
            setEditingWebsite(null)
          }}
          onSubmit={editingWebsite ? handleUpdate : handleCreate}
          website={editingWebsite}
          title={editingWebsite ? 'Editar Sitio Web' : 'Nuevo Sitio Web'}
        />
      </CardContent>
    </Card>
  )
}

// Form Dialog Component
interface WebsiteFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  website?: Website | null
  title: string
}

function WebsiteFormDialog({ open, onClose, onSubmit, website, title }: WebsiteFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    app_password: '',
    description: '',
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isEditMode = !!website

  useEffect(() => {
    if (website) {
      setFormData({
        name: website.name,
        url: website.url,
        app_password: website.app_password,
        description: website.description || '',
        is_active: website.is_active,
      })
    } else {
      setFormData({
        name: '',
        url: '',
        app_password: '',
        description: '',
        is_active: true,
      })
    }
    setError('')
  }, [website, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      onClose()
    } catch (err: any) {
      setError(err?.error?.message || 'Error al guardar sitio web')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los datos del sitio web' : 'Completa los datos para configurar un nuevo sitio web'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Sitio *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
              required
              placeholder="Mi Sitio Web"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              disabled={isSubmitting}
              required
              placeholder="https://misitio.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app_password">Contraseña de Aplicación *</Label>
            <Input
              id="app_password"
              type="password"
              value={formData.app_password}
              onChange={(e) => setFormData(prev => ({ ...prev, app_password: e.target.value }))}
              disabled={isSubmitting}
              required
              placeholder="Ingresa la contraseña de aplicación"
            />
            <p className="text-xs text-gray-500">Esta contraseña se usará para autenticar las peticiones al sitio web</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              placeholder="Descripción del sitio web"
            />
          </div>

          {isEditMode && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="font-normal cursor-pointer">
                Sitio activo
              </Label>
            </div>
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
              {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Sitio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
