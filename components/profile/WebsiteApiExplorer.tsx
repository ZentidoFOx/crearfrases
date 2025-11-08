"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Copy, Check, Globe, Code, FileText, Tag, Folder, AlertCircle, Loader2, Activity } from 'lucide-react'
import { websitesService, type Website } from '@/lib/api/websites'

interface WebsiteApiExplorerProps {
  websiteId: number
  roleColors: {
    gradient: string
    border: string
    text: string
    bg: string
    hover: string
  }
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  category: string
  params?: { name: string; type: string; required: boolean; description: string }[]
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/wp-json/content-search/v1/search',
    description: 'Buscar frases clave en el contenido',
    category: 'Búsqueda',
    params: [
      { name: 'query', type: 'string', required: true, description: 'Frase clave a buscar (ej: "pantanal jaguar")' },
      { name: 'post_type', type: 'string', required: false, description: 'Tipos de contenido (post,page) - Default: post,page' },
    ]
  },
  {
    method: 'GET',
    path: '/wp-json/content-search/v1/posts',
    description: 'Obtener lista de posts',
    category: 'Posts',
    params: [
      { name: 'per_page', type: 'number', required: false, description: 'Posts por página (default: 10)' },
      { name: 'page', type: 'number', required: false, description: 'Número de página (default: 1)' },
      { name: 'post_type', type: 'string', required: false, description: 'Tipo de contenido (default: post)' },
    ]
  },
  {
    method: 'GET',
    path: '/wp-json/content-search/v1/posts/{id}',
    description: 'Obtener post específico por ID',
    category: 'Posts',
    params: [
      { name: 'id', type: 'number', required: true, description: 'ID del post (reemplazar {id} en la URL)' },
    ]
  },
  {
    method: 'GET',
    path: '/wp-json/content-search/v1/categories',
    description: 'Obtener todas las categorías',
    category: 'Taxonomías',
  },
  {
    method: 'GET',
    path: '/wp-json/content-search/v1/tags',
    description: 'Obtener todos los tags',
    category: 'Taxonomías',
  },
  {
    method: 'GET',
    path: '/wp-json/content-search/v1/languages',
    description: 'Obtener idiomas disponibles en el sitio',
    category: 'Configuración',
  },
  {
    method: 'GET',
    path: '/wp-json/content-search/v1/seo-stats',
    description: 'Obtener estadísticas de calidad SEO (Yoast)',
    category: 'Análisis SEO',
  },
]

export function WebsiteApiExplorer({ websiteId, roleColors }: WebsiteApiExplorerProps) {
  const router = useRouter()
  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)
  const [testingEndpoint, setTestingEndpoint] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [testError, setTestError] = useState('')
  const [params, setParams] = useState<{ [key: string]: string }>({})
  const [copiedCode, setCopiedCode] = useState(false)
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    loadWebsite()
  }, [websiteId])

  const loadWebsite = async () => {
    try {
      setLoading(true)
      const response = await websitesService.getOne(websiteId)
      if (response.success && response.data) {
        setWebsite(response.data)
        setRequestCount(response.data.request_count)
      }
    } catch (err) {
      console.error('Error loading website:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTestEndpoint = async (endpoint: Endpoint) => {
    if (!website) return

    setTestingEndpoint(true)
    setTestResult(null)
    setTestError('')

    try {
      // Construir URL con parámetros
      let url = website.url.replace(/\/$/, '') + endpoint.path
      
      // Reemplazar {id} en la URL si existe
      if (url.includes('{id}')) {
        const idValue = params['id'] || '1'
        url = url.replace('{id}', idValue)
      }
      
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        // No incluir 'id' en query params si está en la URL
        if (value && !(key === 'id' && endpoint.path.includes('{id}'))) {
          queryParams.append(key, value)
        }
      })
      
      if (queryParams.toString()) {
        url += '?' + queryParams.toString()
      }

      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      
      setTestResult({
        status: response.status,
        statusText: response.ok ? 'OK' : 'Error',
        data: data
      })

      // ✅ Incrementar contador de requests automáticamente después de cada prueba exitosa
      if (response.ok) {
        websitesService.incrementRequestCount(websiteId)
          .then(res => {
            if (res.success && res.data) {
              setRequestCount(res.data.request_count)
            }
          })
          .catch(err => {
            console.warn('Failed to track API request:', err)
          })
      }
    } catch (err: any) {
      setTestError(err.message || 'Error al probar endpoint')
    } finally {
      setTestingEndpoint(false)
    }
  }

  const getCurlCommand = (endpoint: Endpoint) => {
    if (!website) return ''

    let url = website.url.replace(/\/$/, '') + endpoint.path
    
    // Reemplazar {id} en la URL si existe
    if (url.includes('{id}')) {
      const idValue = params['id'] || '1'
      url = url.replace('{id}', idValue)
    }
    
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      // No incluir 'id' en query params si está en la URL
      if (value && !(key === 'id' && endpoint.path.includes('{id}'))) {
        queryParams.append(key, value)
      }
    })
    
    if (queryParams.toString()) {
      url += '?' + queryParams.toString()
    }

    return `curl "${url}"`
  }

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const groupedEndpoints = ENDPOINTS.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = []
    }
    acc[endpoint.category].push(endpoint)
    return acc
  }, {} as { [key: string]: Endpoint[] })

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
        <p className="mt-4 text-gray-600">Cargando sitio web...</p>
      </div>
    )
  }

  if (!website) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Sitio web no encontrado</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`border-2 ${roleColors.border}`}>
        <CardHeader className={`bg-gradient-to-r ${roleColors.gradient}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/perfil/sitios-web')}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <Globe className={`h-6 w-6 ${roleColors.text}`} />
                <CardTitle className="text-2xl">{website.name}</CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                {website.url}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {website.connection_verified && (
                <Badge variant="default" className="bg-green-600">
                  ✓ Verificado
                </Badge>
              )}
              <Badge variant={website.is_active ? 'default' : 'secondary'}>
                {website.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant="outline" className="bg-white border-2 border-cyan-400 text-cyan-700 font-semibold">
                <Activity className="h-3 w-3 mr-1" />
                {requestCount} Requests
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Endpoints List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endpoints Disponibles</CardTitle>
              <CardDescription>Content Search API v1.0 - API Pública</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {Object.entries(groupedEndpoints).map(([category, endpoints]) => (
                  <div key={category} className="border-b border-gray-200 last:border-0">
                    <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700">
                      {category}
                    </div>
                    {endpoints.map((endpoint, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedEndpoint(endpoint)
                          setTestResult(null)
                          setTestError('')
                          setParams({})
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          selectedEndpoint === endpoint ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {endpoint.method}
                          </Badge>
                          <code className="text-xs text-gray-600">{endpoint.path}</code>
                        </div>
                        <p className="text-xs text-gray-500">{endpoint.description}</p>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Endpoint Details & Testing */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEndpoint ? (
            <>
              {/* Endpoint Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {selectedEndpoint.method}
                        </Badge>
                        <code className="text-lg">{selectedEndpoint.path}</code>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {selectedEndpoint.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                  <CardContent>
                    <h3 className="font-semibold mb-3">Parámetros</h3>
                    <div className="space-y-3">
                      {selectedEndpoint.params.map((param) => (
                        <div key={param.name} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-mono">{param.name}</Label>
                            {param.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">{param.type}</Badge>
                          </div>
                          <Input
                            placeholder={param.description}
                            value={params[param.name] || ''}
                            onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Test Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Probar Endpoint</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleTestEndpoint(selectedEndpoint)}
                      disabled={testingEndpoint}
                      className={`${roleColors.bg} ${roleColors.hover} text-white`}
                    >
                      {testingEndpoint ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Ejecutando...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Ejecutar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyCodeToClipboard(getCurlCommand(selectedEndpoint))}
                    >
                      {copiedCode ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copiar cURL
                    </Button>
                  </div>

                  {/* cURL Command */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      {getCurlCommand(selectedEndpoint)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Test Result */}
              {testResult && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Respuesta</CardTitle>
                      <Badge variant={testResult.status === 200 ? 'default' : 'destructive'}>
                        {testResult.status} {testResult.statusText}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-lg p-4 max-h-[400px] overflow-auto">
                      <pre className="text-xs text-gray-300 font-mono">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Test Error */}
              {testError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Selecciona un endpoint para ver los detalles y probarlo</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
