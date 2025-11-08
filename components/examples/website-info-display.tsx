"use client"

/**
 * COMPONENTE DE EJEMPLO
 * Muestra cómo usar el dominio activo en cualquier componente
 */

import React from 'react'
import { useWebsite } from '@/contexts/website-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, CheckCircle, XCircle, Wifi, WifiOff, Calendar } from 'lucide-react'

export function WebsiteInfoDisplay() {
  const { activeWebsite, websites, loading } = useWebsite()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activeWebsite) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-orange-600">
            <Globe className="h-5 w-5" />
            <p className="font-medium">No hay dominio seleccionado</p>
          </div>
          <p className="text-sm text-orange-600 mt-2">
            Selecciona un dominio en el header para comenzar
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Card Principal - Dominio Activo */}
      <Card className="border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Globe className="h-5 w-5" />
            Dominio Activo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Nombre y URL */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {activeWebsite.name}
              </h3>
              <a 
                href={activeWebsite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {activeWebsite.url}
              </a>
            </div>

            {/* Descripción */}
            {activeWebsite.description && (
              <p className="text-gray-600">{activeWebsite.description}</p>
            )}

            {/* Badges de Estado */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline"
                className={activeWebsite.is_active 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-gray-100 text-gray-600 border-gray-200'}
              >
                {activeWebsite.is_active ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactivo
                  </>
                )}
              </Badge>

              <Badge 
                variant="outline"
                className={activeWebsite.connection_verified 
                  ? 'bg-teal-50 text-teal-700 border-teal-200' 
                  : 'bg-red-50 text-red-700 border-red-200'}
              >
                {activeWebsite.connection_verified ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Verificado
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Sin verificar
                  </>
                )}
              </Badge>
            </div>

            {/* Información de Asignación */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Asignado el {new Date(activeWebsite.assigned_at).toLocaleDateString('es-ES')}
                  {activeWebsite.assigned_by_username && (
                    <span> por <strong>{activeWebsite.assigned_by_username}</strong></span>
                  )}
                </span>
              </div>
            </div>

            {/* Información Técnica */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Información Técnica</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">ID:</span> {activeWebsite.id}
                </div>
                <div>
                  <span className="font-medium">Estado Asignación:</span>{' '}
                  {activeWebsite.assignment_active ? 'Activa' : 'Inactiva'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Ejemplo - Cómo Usar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Cómo Usar en Tu Componente</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`import { useWebsite } from '@/contexts/website-context'

export default function MiComponente() {
  const { activeWebsite } = useWebsite()
  
  // Usar el ID del dominio
  const websiteId = activeWebsite?.id
  
  // Usar la URL del dominio
  const websiteUrl = activeWebsite?.url
  
  // Buscar posts en WordPress
  const searchPosts = async (keyword: string) => {
    const response = await fetch(
      \`\${websiteUrl}/wp-json/wp/v2/posts?search=\${keyword}\`
    )
    return await response.json()
  }
  
  return (
    <div>
      <h1>Trabajando en: {activeWebsite?.name}</h1>
    </div>
  )
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Card - Todos los Dominios Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Todos tus Dominios ({websites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {websites.map((website) => (
              <div
                key={website.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  website.id === activeWebsite.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      website.id === activeWebsite.id
                        ? 'bg-emerald-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{website.name}</p>
                    <p className="text-xs text-gray-500">{website.url}</p>
                  </div>
                </div>
                {website.id === activeWebsite.id && (
                  <Badge className="bg-emerald-600">Seleccionado</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * EJEMPLO DE USO EN UNA PÁGINA
 * 
 * // app/ejemplo/page.tsx
 * import { WebsiteInfoDisplay } from '@/components/examples/website-info-display'
 * 
 * export default function EjemploPage() {
 *   return (
 *     <div className="container mx-auto p-8">
 *       <WebsiteInfoDisplay />
 *     </div>
 *   )
 * }
 */
