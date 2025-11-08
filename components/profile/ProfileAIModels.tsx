"use client"

import React, { useState, useEffect } from 'react'
import { aiModelsService, type AIModel, type CreateAIModelData } from '@/lib/api/ai-models'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Loader2, 
  Plus, 
  Sparkles, 
  Trash2, 
  Edit, 
  Check,
  X,
  Key,
  Zap,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
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

interface ProfileAIModelsProps {
  roleColors: {
    gradient: string
    border: string
    text: string
    bg: string
    hover: string
  }
}

// Modelos predefinidos con sus proveedores
const PREDEFINED_MODELS = [
  { name: 'GPT-4', provider: 'OpenAI', endpoint: 'https://api.openai.com/v1' },
  { name: 'GPT-4 Turbo', provider: 'OpenAI', endpoint: 'https://api.openai.com/v1' },
  { name: 'GPT-3.5 Turbo', provider: 'OpenAI', endpoint: 'https://api.openai.com/v1' },
  { name: 'GPT-4o', provider: 'OpenAI', endpoint: 'https://api.openai.com/v1' },
  { name: 'Gemini Pro', provider: 'Google', endpoint: 'https://generativelanguage.googleapis.com/v1' },
  { name: 'Gemini Ultra', provider: 'Google', endpoint: 'https://generativelanguage.googleapis.com/v1' },
  { name: 'Claude 3 Opus', provider: 'Anthropic', endpoint: 'https://api.anthropic.com/v1' },
  { name: 'Claude 3 Sonnet', provider: 'Anthropic', endpoint: 'https://api.anthropic.com/v1' },
  { name: 'Claude 3 Haiku', provider: 'Anthropic', endpoint: 'https://api.anthropic.com/v1' },
  { name: 'Llama 3 70B', provider: 'Meta', endpoint: '' },
  { name: 'Mistral Large', provider: 'Mistral', endpoint: 'https://api.mistral.ai/v1' },
]

export function ProfileAIModels({ roleColors }: ProfileAIModelsProps) {
  const [models, setModels] = useState<AIModel[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; message: string }>>({})
  const [isCustomModel, setIsCustomModel] = useState(false)
  const [newModelId, setNewModelId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    api_key: '',
    endpoint: '',
    description: ''
  })

  // Load models on mount
  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const data = await aiModelsService.getModels()
      setModels(data)
    } catch (error) {
      console.error('Error fetching AI models:', error)
      toast.error('Error al cargar los modelos de IA')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle model selection - auto-fill provider and endpoint
  const handleModelSelect = (modelName: string) => {
    if (modelName === 'custom') {
      // Custom model - clear fields for manual input
      setIsCustomModel(true)
      setFormData(prev => ({
        ...prev,
        name: '',
        provider: '',
        endpoint: ''
      }))
    } else {
      // Predefined model - auto-fill
      setIsCustomModel(false)
      const selectedModel = PREDEFINED_MODELS.find(m => m.name === modelName)
      if (selectedModel) {
        setFormData(prev => ({
          ...prev,
          name: selectedModel.name,
          provider: selectedModel.provider,
          endpoint: selectedModel.endpoint
        }))
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      provider: '',
      api_key: '',
      endpoint: '',
      description: ''
    })
    setIsAddingNew(false)
    setEditingId(null)
    setIsCustomModel(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.provider || !formData.api_key) {
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }
    
    setLoading(true)
    try {
      if (editingId) {
        // Editar modelo existente
        const updatedModel = await aiModelsService.updateModel(editingId, formData)
        
        // Actualizar el modelo en la lista inmediatamente
        setModels(prev => prev.map(m => m.id === editingId ? updatedModel : m))
        
        toast.success('Modelo actualizado exitosamente', {
          description: 'Los cambios se han guardado correctamente'
        })
      } else {
        // Agregar nuevo modelo
        const newModel = await aiModelsService.createModel(formData as CreateAIModelData)
        
        // Actualizar la lista inmediatamente agregando el nuevo modelo
        setModels(prev => [...prev, newModel])
        
        // Marcar como nuevo para animación
        setNewModelId(newModel.id)
        setTimeout(() => setNewModelId(null), 3000) // Quitar marca después de 3s
        
        toast.success('✨ Modelo agregado exitosamente', {
          description: `${formData.name} está listo para usar`
        })
        
        // Scroll suave hacia el nuevo modelo después de un pequeño delay
        setTimeout(() => {
          const element = document.getElementById(`model-${newModel.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
        }, 100)
      }
      
      // Cerrar formulario y limpiar
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el modelo', {
        description: 'Verifica la información e intenta nuevamente'
      })
    } finally {
      setLoading(false)
    }
  }
  const handleEdit = (model: AIModel) => {
    // Check if it's a predefined model
    const isPredefined = PREDEFINED_MODELS.some(m => m.name === model.name)
    setIsCustomModel(!isPredefined)
    
    setFormData({
      name: model.name,
      provider: model.provider,
      api_key: '',
      endpoint: model.endpoint || '',
      description: model.description || ''
    })
    setEditingId(model.id)
    setIsAddingNew(true)
  }

  const confirmDelete = (id: number) => {
    setModelToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!modelToDelete) return
    
    setLoading(true)
    try {
      await aiModelsService.deleteModel(modelToDelete)
      
      // Remover el modelo de la lista inmediatamente
      setModels(prev => prev.filter(m => m.id !== modelToDelete))
      
      toast.success('Modelo eliminado exitosamente', {
        description: 'El modelo ha sido eliminado de la lista'
      })
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el modelo')
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setModelToDelete(null)
    }
  }

  const toggleActive = async (id: number) => {
    try {
      const model = models.find(m => m.id === id)
      
      // Verificación adicional en frontend
      if (model && !model.is_active && (!model.api_key || model.api_key.trim() === '')) {
        toast.error('No se puede activar', {
          description: 'Configura la API Key del modelo primero'
        })
        return
      }

      const updatedModel = await aiModelsService.toggleActive(id)
      
      // Actualizar el modelo en la lista inmediatamente
      setModels(prev => prev.map(m => m.id === id ? updatedModel : m))
      
      toast.success('Estado actualizado', {
        description: model?.is_active ? 'Modelo desactivado' : 'Modelo activado correctamente'
      })
    } catch (error: any) {
      toast.error('Error al actualizar', {
        description: error.message || 'No se pudo cambiar el estado del modelo'
      })
    }
  }

  const testConnection = async (model: AIModel) => {
    setTestingId(model.id)
    
    try {
      const result = await aiModelsService.testConnection(model.id)
      
      setTestResults(prev => ({ ...prev, [model.id]: result }))
      
      if (result.success) {
        toast.success('Conexión exitosa', {
          description: `El modelo ${model.name} está funcionando correctamente`
        })
      } else {
        toast.error('Error de conexión', {
          description: 'Verifica la configuración del modelo'
        })
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al probar la conexión')
    } finally {
      setTestingId(null)
    }
  }

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Cargando modelos de IA...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Modelos de IA
          </CardTitle>
          <CardDescription>
            Configura los modelos de IA disponibles para generar contenido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Button */}
          {!isAddingNew && (
            <Button
              onClick={() => setIsAddingNew(true)}
              className={`${roleColors.bg} ${roleColors.hover} text-white w-full sm:w-auto`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Nuevo Modelo
            </Button>
          )}

          {/* Add Form - Only show when creating new */}
          {isAddingNew && (
            <div className={`p-6 rounded-lg border-2 ${roleColors.border} bg-gradient-to-br ${roleColors.gradient}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nuevo Modelo de IA
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name - Select */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nombre del Modelo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.name}
                      onValueChange={handleModelSelect}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">✏️ Modelo personalizado</SelectItem>
                        {PREDEFINED_MODELS.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name} <span className="text-gray-400 text-xs ml-2">({model.provider})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isCustomModel && (
                      <Input
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Nombre del modelo personalizado"
                        className="mt-2"
                        required
                      />
                    )}
                  </div>

                  {/* Provider - Auto-filled or editable */}
                  <div className="space-y-2">
                    <Label htmlFor="provider">
                      Proveedor <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => handleChange('provider', e.target.value)}
                      placeholder="ej: OpenAI, Google, Anthropic"
                      readOnly={!isCustomModel && formData.provider !== ''}
                      className={!isCustomModel && formData.provider !== '' ? 'bg-gray-50' : ''}
                      required
                    />
                  </div>

                  {/* API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="api_key">
                      API Key <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="api_key"
                        type="password"
                        value={formData.api_key}
                        onChange={(e) => handleChange('api_key', e.target.value)}
                        placeholder="sk-*********************"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Endpoint */}
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint (opcional)</Label>
                    <Input
                      id="endpoint"
                      value={formData.endpoint}
                      onChange={(e) => handleChange('endpoint', e.target.value)}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Descripción del modelo y su uso..."
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className={`${roleColors.bg} ${roleColors.hover} text-white`}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Guardando...' : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {editingId ? 'Actualizar' : 'Guardar'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Models List by Provider */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Modelos Configurados</h3>
            {models.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay modelos configurados</p>
              </div>
            ) : (
              <Tabs defaultValue={models[0]?.provider || 'all'} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  {Array.from(new Set(models.map(m => m.provider))).map(provider => (
                    <TabsTrigger key={provider} value={provider}>
                      {provider}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* All Models Tab */}
                <TabsContent value="all" className="space-y-3 mt-4">
                  {models.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </TabsContent>

                {/* Per Provider Tabs */}
                {Array.from(new Set(models.map(m => m.provider))).map(provider => (
                  <TabsContent key={provider} value={provider} className="space-y-3 mt-4">
                    {models.filter(m => m.provider === provider).map((model) => (
                      <ModelCard key={model.id} model={model} />
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El modelo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModelToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )

  // Model Card Component
  function ModelCard({ model }: { model: AIModel }) {
    const hasApiKey = model.api_key && model.api_key.trim() !== ''
    const isEditing = editingId === model.id
    const isNew = newModelId === model.id
    
    return (
      <Card 
        id={`model-${model.id}`}
        className={`overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
        isEditing ? 'ring-2 ring-purple-500 ring-offset-2' : ''
      } ${
        isNew ? 'ring-2 ring-green-500 ring-offset-2 shadow-lg' : ''
      } ${
        !hasApiKey 
          ? 'border-amber-200 bg-amber-50/10' 
          : 'hover:shadow-md'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className={`h-5 w-5 ${model.is_active ? 'text-purple-600' : 'text-gray-400'}`} />
              <h4 className="font-bold text-gray-900 text-xl">{model.name}</h4>
              {isNew && (
                <Badge className="bg-green-500 animate-pulse">
                  ✨ Nuevo
                </Badge>
              )}
              <Badge variant={model.is_active ? "default" : "secondary"} className={model.is_active ? 'bg-green-500' : ''}>
                {model.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant="outline" className="text-gray-600">
                {model.provider}
              </Badge>
            </div>

            {/* Warning Alert when no API Key */}
            {!hasApiKey && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-800 font-medium">Sin API Key configurada</span>
              </div>
            )}
            
            {/* Info compacta */}
            <div className="space-y-2 text-sm text-gray-600">
              {/* API Key */}
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-gray-400" />
                {hasApiKey ? (
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                    •••{model.api_key.substring(model.api_key.length - 8)}
                  </code>
                ) : (
                  <span className="text-amber-600 text-xs">No configurada</span>
                )}
              </div>

              {/* Description */}
              {model.description && (
                <p className="text-gray-500 italic text-sm">{model.description}</p>
              )}
            </div>

            {/* Test Result - Compacto */}
            {testResults[model.id] && (
              <div className={`mt-3 p-2.5 rounded-lg flex items-center gap-2 text-sm ${
                testResults[model.id].success 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {testResults[model.id].success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{testResults[model.id].message}</span>
              </div>
            )}
            
            {/* Metadata - Solo cuando hay info */}
            {(model.created_by_name || model.created_at) && (
              <div className="mt-4 pt-3 border-t text-xs text-gray-400">
                <span>Creado por {model.created_by_name || 'Usuario'}</span>
                <span className="mx-2">•</span>
                <span>{new Date(model.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Actions - Compacto */}
          <div className="flex gap-2 ml-auto self-start">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleActive(model.id)}
              disabled={testingId === model.id || (!model.is_active && !hasApiKey)}
              title={!hasApiKey && !model.is_active ? 'Configura la API Key primero' : ''}
            >
              {model.is_active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testConnection(model)}
              disabled={testingId === model.id || !hasApiKey}
              title={!hasApiKey ? 'Configura la API Key primero' : 'Probar conexión'}
              className="min-w-[80px]"
            >
              {testingId === model.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  <span className="text-xs">Probando...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  <span className="text-xs">Probar</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(model)}
              disabled={testingId === model.id}
              title="Editar modelo"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => confirmDelete(model.id)}
              disabled={testingId === model.id}
              title="Eliminar modelo"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        </CardContent>

        {/* Edit Form - Collapsible Accordion */}
        <Collapsible open={isEditing}>
          <CollapsibleContent>
            <div className="border-t bg-gradient-to-br from-purple-50 to-indigo-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Edit className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Editar Modelo</h4>
                      <p className="text-sm text-gray-600">Actualiza la configuración del modelo de IA</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resetForm()}
                    className="hover:bg-white/70 rounded-full h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name - Select */}
                <div className="space-y-2">
                  <Label htmlFor={`name-${model.id}`}>
                    Nombre del Modelo <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.name}
                    onValueChange={handleModelSelect}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">✏️ Modelo personalizado</SelectItem>
                      {PREDEFINED_MODELS.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.name} <span className="text-gray-400 text-xs ml-2">({model.provider})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                    {isCustomModel && (
                      <Input
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Nombre del modelo personalizado"
                        className="mt-2"
                        required
                      />
                    )}
                  </div>

                {/* Provider - Auto-filled or editable */}
                <div className="space-y-2">
                  <Label htmlFor={`provider-${model.id}`}>
                    Proveedor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`provider-${model.id}`}
                    value={formData.provider}
                    onChange={(e) => handleChange('provider', e.target.value)}
                    placeholder="ej: OpenAI, Google, Anthropic"
                    readOnly={!isCustomModel && formData.provider !== ''}
                    className={!isCustomModel && formData.provider !== '' ? 'bg-gray-50' : ''}
                    required
                  />
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor={`api_key-${model.id}`}>
                    API Key <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id={`api_key-${model.id}`}
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => handleChange('api_key', e.target.value)}
                      placeholder="sk-*********************"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Endpoint */}
                <div className="space-y-2">
                  <Label htmlFor={`endpoint-${model.id}`}>Endpoint (opcional)</Label>
                  <Input
                    id={`endpoint-${model.id}`}
                    value={formData.endpoint}
                    onChange={(e) => handleChange('endpoint', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor={`description-${model.id}`}>Descripción (opcional)</Label>
                <Textarea
                  id={`description-${model.id}`}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descripción del modelo y su uso..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className={`${roleColors.bg} ${roleColors.hover} text-white min-w-[120px]`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Actualizar
                    </>
                  )}
                </Button>
              </div>
            </form>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }
}
