"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, Key, Eye, EyeOff, Save, CheckCircle, AlertCircle, Info, TestTube, Lock, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { usersAPI } from '@/lib/api/users'

interface WordPressCredentialsProps {
  website: {
    id: number
    name: string
    url: string
  }
}

interface WordPressCredentials {
  username: string
  app_password: string
  is_configured?: boolean
  test_status?: string
  last_tested?: string
}

export function WordPressCredentials({ website }: WordPressCredentialsProps) {
  const { user } = useAuth()
  const [credentials, setCredentials] = useState<WordPressCredentials>({
    username: '',
    app_password: '',
    is_configured: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (website && user) {
      loadCredentials()
    }
  }, [website, user])

  const loadCredentials = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getWordPressCredentials(website.id)
      if (response.success) {
        if (response.data.is_configured) {
          setCredentials({
            username: response.data.username || '',
            app_password: response.data.app_password || '', // Mostrar la contraseña real desencriptada
            is_configured: response.data.is_configured,
            test_status: response.data.test_status,
            last_tested: response.data.last_tested
          })
        } else {
          setCredentials({
            username: '',
            app_password: '',
            is_configured: false
          })
        }
      } else if (response.error) {
        const errorMsg = typeof response.error === 'string' ? response.error : 'Error al cargar credenciales'
        setError(errorMsg)
      }
    } catch (error) {
      console.error('Error loading credentials:', error)
      setError(`Error al cargar credenciales: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!credentials.username.trim() || !credentials.app_password.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      // Aquí guardarías las credenciales en la API
      const response = await usersAPI.saveWordPressCredentials(website.id, {
        username: credentials.username,
        app_password: credentials.app_password
      })

      if (response.success) {
        setMessage('✅ Credenciales guardadas exitosamente')
        setCredentials(prev => ({ ...prev, is_configured: true }))
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error : 'Error al guardar credenciales'
        setError(errorMsg)
      }
    } catch (error) {
      setError(`Error al guardar credenciales: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!credentials.username.trim() || !credentials.app_password.trim()) {
      setError('Por favor completa todos los campos antes de probar')
      return
    }

    if (!website?.url) {
      setError('URL del sitio web no disponible')
      return
    }

    // Limpiar mensajes anteriores
    setMessage('')
    setError('')

    try {
      // Probar conexión directamente con WordPress REST API
      const websiteUrl = website.url.replace(/\/$/, '') // Remover slash final
      const testUrl = `${websiteUrl}/wp-json/wp/v2/users/me`
      
      // Crear header de autenticación (compatible con caracteres especiales)
      // Función para codificar UTF-8 a Base64 de forma segura
      const utf8ToBase64 = (str: string) => {
        return btoa(unescape(encodeURIComponent(str)))
      }
      
      const auth = utf8ToBase64(`${credentials.username}:${credentials.app_password}`)
      
      console.log('🔐 Probando conexión con:', {
        url: testUrl,
        username: credentials.username,
        password: '***masked***'
      })

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        // Agregar timeout
        signal: AbortSignal.timeout(15000) // 15 segundos timeout
      })

      console.log('📡 Respuesta HTTP:', response.status)

      if (response.ok) {
        const userData = await response.json()
        console.log('👤 Datos del usuario:', userData)
        
        if (userData && userData.id) {
          setMessage(`✅ Conexión exitosa! Conectado como: ${userData.name || userData.username || 'Usuario'} (ID: ${userData.id})`)
        } else {
          setMessage('✅ Conexión exitosa con WordPress')
        }
      } else {
        // Manejar diferentes códigos de error HTTP
        let errorMessage = ''
        
        switch (response.status) {
          case 401:
            errorMessage = 'Credenciales incorrectas. Verifica tu usuario y contraseña de aplicación.'
            break
          case 403:
            errorMessage = 'Acceso denegado. El usuario no tiene permisos suficientes.'
            break
          case 404:
            errorMessage = 'WordPress REST API no encontrada. Verifica que WordPress esté actualizado y la URL sea correcta.'
            break
          case 500:
            errorMessage = 'Error interno del servidor WordPress. Contacta al administrador del sitio.'
            break
          default:
            errorMessage = `Error de conexión (HTTP ${response.status}). Verifica la URL del sitio web.`
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('❌ Error al probar conexión:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Error de red: No se pudo conectar con el sitio WordPress. Verifica la URL y que el sitio esté accesible.')
      } else if (error instanceof Error && error.name === 'AbortError') {
        setError('Timeout: La conexión tardó demasiado. Verifica la URL del sitio.')
      } else if (error instanceof Error && error.message.includes('CORS')) {
        setError('Error CORS: El sitio WordPress no permite conexiones desde este dominio. Contacta al administrador para configurar CORS.')
      } else {
        setError(`Error al probar la conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Credenciales de WordPress</h2>
          <p className="text-gray-600 mt-1">Configura tus credenciales para publicar automáticamente en WordPress</p>
        </div>
        {credentials.is_configured && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Configurado
          </Badge>
        )}
      </div>

      {/* Información sobre contraseñas de aplicación */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>¿Qué es una contraseña de aplicación?</strong><br />
          Las contraseñas de aplicación son contraseñas especiales que permiten a aplicaciones externas 
          conectarse a tu WordPress de forma segura sin usar tu contraseña principal.
          <br />
          <a 
            href="https://wordpress.org/support/article/application-passwords/" 
            target="_blank" 
            className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
          >
            Aprende más sobre contraseñas de aplicación
            <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      {/* Formulario de credenciales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Configuración de Acceso
          </CardTitle>
          <CardDescription>
            Ingresa tus credenciales de WordPress para habilitar la publicación automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre de usuario */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nombre de Usuario de WordPress
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="tu-usuario-wordpress"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="font-mono"
            />
            <p className="text-xs text-gray-500">
              El nombre de usuario que usas para iniciar sesión en WordPress
            </p>
          </div>

          {/* Contraseña de aplicación */}
          <div className="space-y-2">
            <Label htmlFor="app_password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Contraseña de Aplicación
            </Label>
            <div className="relative">
              <Input
                id="app_password"
                type={showPassword ? "text" : "password"}
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                value={credentials.app_password}
                onChange={(e) => setCredentials(prev => ({ ...prev, app_password: e.target.value }))}
                className="font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Genera una contraseña de aplicación desde tu panel de WordPress: 
              <strong> Usuarios → Perfil → Contraseñas de Aplicación</strong>
            </p>
            {credentials.is_configured && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✅ Credenciales guardadas:</strong> Tus credenciales están configuradas y listas para usar.
                </p>
              </div>
            )}
          </div>

          {/* Mensajes */}
          {message && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Credenciales
            </Button>
            
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={saving || !credentials.username.trim() || !credentials.app_password.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Probando...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Probar Conexión
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones paso a paso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Cómo crear una contraseña de aplicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
            <li>
              <strong>Accede a tu WordPress:</strong> Ve a{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {website?.url || 'tu-sitio.com'}/wp-admin
              </code>
            </li>
            <li>
              <strong>Ve a tu perfil:</strong> Navega a <strong>Usuarios → Perfil</strong>
            </li>
            <li>
              <strong>Busca la sección:</strong> Desplázate hasta <strong>"Contraseñas de Aplicación"</strong>
            </li>
            <li>
              <strong>Crea una nueva:</strong> Ingresa un nombre como "AdminResh" y haz clic en <strong>"Agregar nueva contraseña de aplicación"</strong>
            </li>
            <li>
              <strong>Copia la contraseña:</strong> WordPress generará una contraseña como <code className="bg-gray-100 px-2 py-1 rounded text-xs">xxxx xxxx xxxx xxxx xxxx xxxx</code>
            </li>
            <li>
              <strong>Pégala aquí:</strong> Copia esa contraseña en el campo de arriba
            </li>
          </ol>
          
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Importante:</strong> La contraseña de aplicación solo se muestra una vez. 
                Si la pierdes, tendrás que crear una nueva.
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>🔗 Conexión Directa:</strong> El botón "Probar Conexión" se conecta directamente 
                con tu sitio WordPress sin pasar por nuestros servidores, garantizando la privacidad de tus credenciales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WordPressCredentials
