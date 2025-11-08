"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Zap, 
  Plus,
  Search,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Brain,
  Network,
  Edit,
  Trash2,
  TestTube,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { aiModelsService, type AIModel } from '@/lib/api/ai-models'
import { useRouter } from 'next/navigation'

export default function ModelosIAPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    openai: 0,
    anthropic: 0,
    google: 0,
    other: 0
  })

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testingModelId, setTestingModelId] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [expandedModelId, setExpandedModelId] = useState<number | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    provider: 'Google',
    api_key: '',
    endpoint: '',
    description: '',
    is_active: true
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      loadModels()
    }
  }, [user])

  const loadModels = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await aiModelsService.getModels()
      setModels(data)

      // Calculate stats
      setStats({
        total: data.length,
        active: data.filter(m => m.is_active).length,
        inactive: data.filter(m => !m.is_active).length,
        openai: data.filter(m => m.provider.toLowerCase() === 'openai').length,
        anthropic: data.filter(m => m.provider.toLowerCase() === 'anthropic').length,
        google: data.filter(m => m.provider.toLowerCase() === 'google').length,
        other: data.filter(m => !['openai', 'anthropic', 'google'].includes(m.provider.toLowerCase())).length
      })
    } catch (err: any) {
      setError(err?.message || 'Error al cargar modelos de IA')
    } finally {
      setLoading(false)
    }
  }

  // Provider endpoints mapping
  const providerEndpoints: Record<string, string> = {
    'Google': 'https://generativelanguage.googleapis.com/v1',
    'OpenAI': 'https://api.openai.com/v1',
    'Anthropic': 'https://api.anthropic.com/v1',
    'Otro': ''
  }

  // Open create modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      provider: 'Google',
      api_key: '',
      endpoint: providerEndpoints['Google'],
      description: '',
      is_active: true
    })
    setFormErrors({})
    setIsCreateModalOpen(true)
  }

  // Update endpoint when provider changes
  const handleProviderChange = (provider: string) => {
    setFormData({ 
      ...formData, 
      provider,
      endpoint: providerEndpoints[provider] || ''
    })
  }

  // Open edit modal
  const handleOpenEdit = (model: AIModel) => {
    setSelectedModel(model)
    setFormData({
      name: model.name,
      provider: model.provider,
      api_key: '', // Por seguridad, no mostramos la key
      endpoint: model.endpoint || '',
      description: model.description || '',
      is_active: model.is_active
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido'
    }
    if (!formData.provider.trim()) {
      errors.provider = 'El proveedor es requerido'
    }
    if (!formData.api_key.trim() && !selectedModel) {
      errors.api_key = 'La API Key es requerida'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Create model
  const handleCreate = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setError('')
      
      await aiModelsService.createModel({
        name: formData.name,
        provider: formData.provider,
        api_key: formData.api_key,
        endpoint: formData.endpoint || undefined,
        description: formData.description || undefined,
        is_active: formData.is_active
      })

      setSuccess('Modelo creado exitosamente')
      setIsCreateModalOpen(false)
      await loadModels()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err?.message || 'Error al crear el modelo')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update model
  const handleUpdate = async () => {
    if (!selectedModel || !validateForm()) return

    try {
      setIsSubmitting(true)
      setError('')
      
      const updateData: any = {
        name: formData.name,
        provider: formData.provider,
        endpoint: formData.endpoint || null,
        description: formData.description || null,
        is_active: formData.is_active
      }

      // Solo incluir api_key si se proporcionó una nueva
      if (formData.api_key.trim()) {
        updateData.api_key = formData.api_key
      }

      await aiModelsService.updateModel(selectedModel.id, updateData)

      setSuccess('Modelo actualizado exitosamente')
      setIsEditModalOpen(false)
      setSelectedModel(null)
      await loadModels()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el modelo')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete model
  const handleDelete = async (model: AIModel) => {
    if (!confirm(`¿Estás seguro de eliminar el modelo "${model.name}"?`)) return

    try {
      setIsDeleting(true)
      setError('')
      
      await aiModelsService.deleteModel(model.id)

      setSuccess('Modelo eliminado exitosamente')
      await loadModels()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al eliminar el modelo'
      
      // Show specific error for permission issues
      if (errorMessage.includes('propios modelos') || errorMessage.includes('permisos')) {
        setError(`⚠️ Permisos: ${errorMessage}. Solo puedes eliminar modelos que hayas creado tú.`)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Toggle active status
  const handleToggleActive = async (model: AIModel) => {
    try {
      setError('')
      
      await aiModelsService.toggleActive(model.id)

      setSuccess(`Modelo ${model.is_active ? 'desactivado' : 'activado'} exitosamente`)
      await loadModels()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar el estado del modelo')
    }
  }

  // Test connection
  const handleTestConnection = async (model: AIModel) => {
    try {
      setIsTesting(true)
      setTestingModelId(model.id)
      setTestResult(null)
      setError('')
      
      const result = await aiModelsService.testConnection(model.id)
      setTestResult(result)
      
      setTimeout(() => {
        setTestResult(null)
        setTestingModelId(null)
      }, 5000)
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al probar la conexión'
      
      // Show specific error for permission issues
      if (errorMessage.includes('propios modelos') || errorMessage.includes('administrador')) {
        setError(`⚠️ Permisos: ${errorMessage}. Solo puedes probar modelos que hayas creado tú.`)
      } else {
        setError(errorMessage)
      }
      
      setTestingModelId(null)
      setTestResult({
        success: false,
        message: errorMessage
      })
      
      setTimeout(() => {
        setTestResult(null)
      }, 5000)
    } finally {
      setIsTesting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        </main>
      </div>
    )
  }

  if (!user || (user.role_slug !== 'superadmin' && user.role_slug !== 'admin')) {
    router.push('/')
    return null
  }

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.provider.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />

      <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header - Responsive */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-[#2b2b40] flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl md:text-3xl font-bold text-[#2b2b40] truncate">Modelos de IA</h1>
                  <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">
                    Gestiona tus modelos de inteligencia artificial
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleOpenCreate}
                className="bg-[#096] hover:bg-[#096]/90 w-full sm:w-auto flex-shrink-0"
                size="default"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Nuevo Modelo
              </Button>
            </div>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 bg-emerald-50 border-emerald-200">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Content - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* LEFT COLUMN - Providers (Sticky on large screens) */}
            <div className="lg:col-span-1 space-y-4">
              {/* Summary Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Total Modelos</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Activos:</span>
                  <Badge className="bg-emerald-100 text-emerald-700">{stats.active}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Inactivos:</span>
                  <Badge variant="secondary">{stats.inactive}</Badge>
                </div>
              </div>

              {/* Providers List */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Network className="h-4 w-4 text-gray-600" />
                  Proveedores
                </h3>
                
                <div className="space-y-3">
                  {/* OpenAI */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-white border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">OpenAI</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {stats.openai}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.openai / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Anthropic */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-white border border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Brain className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Anthropic</span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        {stats.anthropic}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-orange-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.anthropic / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Google */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-white border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Google</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {stats.google}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.google / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Models Table */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-gray-200 rounded-lg">
            {/* Header with Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6 border-b border-gray-200">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-gray-900">Mis Modelos de IA</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  {filteredModels.length} modelo{filteredModels.length !== 1 ? 's' : ''} encontrado{filteredModels.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o proveedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-9 md:h-10 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Models Table with Accordion */}
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Brain className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                    No hay modelos de IA
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {search ? 'No se encontraron modelos con ese criterio' : 'Comienza creando tu primer modelo de IA'}
                  </p>
                  {!search && (
                    <Button 
                      onClick={handleOpenCreate}
                      className="bg-[#096] hover:bg-[#096]/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Modelo
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {filteredModels.map((model) => (
                    <div key={model.id} className="border-b border-gray-200 last:border-0">
                      {/* Table Row */}
                      <div 
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedModelId(expandedModelId === model.id ? null : model.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Model Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center ${
                              model.provider.toLowerCase() === 'google' ? 'bg-blue-100' :
                              model.provider.toLowerCase() === 'openai' ? 'bg-green-100' :
                              model.provider.toLowerCase() === 'anthropic' ? 'bg-orange-100' :
                              'bg-purple-100'
                            }`}>
                              <Globe className={`h-5 w-5 ${
                                model.provider.toLowerCase() === 'google' ? 'text-blue-600' :
                                model.provider.toLowerCase() === 'openai' ? 'text-green-600' :
                                model.provider.toLowerCase() === 'anthropic' ? 'text-orange-600' :
                                'text-purple-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{model.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${
                                  model.provider.toLowerCase() === 'google' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  model.provider.toLowerCase() === 'openai' ? 'bg-green-50 text-green-700 border-green-200' :
                                  model.provider.toLowerCase() === 'anthropic' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>
                                  {model.provider}
                                </Badge>
                                <Badge variant={model.is_active ? "default" : "secondary"} className="text-xs">
                                  {model.is_active ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Expand Icon */}
                          {expandedModelId === model.id ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {expandedModelId === model.id && (
                        <div className="px-4 pb-4 bg-gray-50 space-y-4">
                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div>
                              <label className="text-xs font-medium text-gray-600">API Key</label>
                              <p className="text-sm text-gray-900 mt-1 font-mono bg-white px-3 py-2 rounded border border-gray-200">
                                {model.api_key}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Endpoint</label>
                              <p className="text-sm text-gray-900 mt-1 bg-white px-3 py-2 rounded border border-gray-200">
                                {model.endpoint || 'No especificado'}
                              </p>
                            </div>
                            {model.description && (
                              <div className="md:col-span-2">
                                <label className="text-xs font-medium text-gray-600">Descripción</label>
                                <p className="text-sm text-gray-900 mt-1 bg-white px-3 py-2 rounded border border-gray-200">
                                  {model.description}
                                </p>
                              </div>
                            )}
                            <div>
                              <label className="text-xs font-medium text-gray-600">Creado por</label>
                              <p className="text-sm text-gray-900 mt-1">
                                {model.created_by_name || 'N/A'} ({model.created_by_email || 'N/A'})
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Fecha de creación</label>
                              <p className="text-sm text-gray-900 mt-1">
                                {new Date(model.created_at).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTestConnection(model)
                              }}
                              disabled={isTesting && testingModelId === model.id}
                            >
                              {isTesting && testingModelId === model.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Probando...
                                </>
                              ) : (
                                <>
                                  <TestTube className="h-4 w-4 mr-2" />
                                  Probar Conexión
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEdit(model)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(model)
                              }}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                            <Button 
                              size="sm" 
                              variant={model.is_active ? "secondary" : "default"}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleActive(model)
                              }}
                              className={model.is_active ? '' : 'bg-emerald-600 hover:bg-emerald-700'}
                            >
                              {model.is_active ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
          </div>

        </div>

        {/* Modal Create */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Modelo de IA</DialogTitle>
              <DialogDescription>Configura un nuevo modelo para tu equipo</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {/* Name */}
              <div className="grid gap-1.5">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Gemini Pro Marketing"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-red-500' : ''}
                  maxLength={100}
                />
                {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
              </div>

              {/* Provider */}
              <div className="grid gap-1.5">
                <Label htmlFor="provider">Proveedor *</Label>
                <Select value={formData.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google">Google (Gemini)</SelectItem>
                    <SelectItem value="OpenAI">OpenAI (GPT)</SelectItem>
                    <SelectItem value="Anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.provider && <p className="text-xs text-red-500">{formErrors.provider}</p>}
              </div>

              {/* API Key */}
              <div className="grid gap-1.5">
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder={
                    formData.provider === 'Google' ? 'AIzaSy...' :
                    formData.provider === 'OpenAI' ? 'sk-...' :
                    formData.provider === 'Anthropic' ? 'sk-ant-...' :
                    'Ingresa tu API key'
                  }
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className={formErrors.api_key ? 'border-red-500' : ''}
                  maxLength={255}
                />
                {formErrors.api_key && <p className="text-xs text-red-500">{formErrors.api_key}</p>}
              </div>

              {/* Endpoint */}
              <div className="grid gap-1.5">
                <Label htmlFor="endpoint">Endpoint (opcional)</Label>
                <Input
                  id="endpoint"
                  placeholder="Auto-completado"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  maxLength={255}
                />
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el uso de este modelo..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active" className="cursor-pointer">Activar modelo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting} className="bg-[#096] hover:bg-[#096]/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Modelo'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Edit */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Modelo</DialogTitle>
              <DialogDescription>Actualiza {selectedModel?.name}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {/* Name */}
              <div className="grid gap-1.5">
                <Label htmlFor="edit_name">Nombre *</Label>
                <Input
                  id="edit_name"
                  placeholder="Nombre del modelo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-red-500' : ''}
                  maxLength={100}
                />
                {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
              </div>

              {/* Provider */}
              <div className="grid gap-1.5">
                <Label htmlFor="edit_provider">Proveedor *</Label>
                <Select value={formData.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google">Google (Gemini)</SelectItem>
                    <SelectItem value="OpenAI">OpenAI (GPT)</SelectItem>
                    <SelectItem value="Anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.provider && <p className="text-xs text-red-500">{formErrors.provider}</p>}
              </div>

              {/* API Key */}
              <div className="grid gap-1.5">
                <Label htmlFor="edit_api_key">API Key (opcional)</Label>
                <Input
                  id="edit_api_key"
                  type="password"
                  placeholder="Dejar vacío para no cambiar"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  maxLength={255}
                />
              </div>

              {/* Endpoint */}
              <div className="grid gap-1.5">
                <Label htmlFor="edit_endpoint">Endpoint (opcional)</Label>
                <Input
                  id="edit_endpoint"
                  placeholder="URL del endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  maxLength={255}
                />
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <Label htmlFor="edit_description">Descripción (opcional)</Label>
                <Textarea
                  id="edit_description"
                  placeholder="Descripción..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="edit_is_active" className="cursor-pointer">Modelo activo</Label>
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-[#096] hover:bg-[#096]/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar Modelo'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test Result Alert */}
        {testResult && testingModelId && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
            <Alert className={`${testResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} shadow-lg`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-emerald-800' : 'text-red-800'}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </main>
    </div>
  )
}
