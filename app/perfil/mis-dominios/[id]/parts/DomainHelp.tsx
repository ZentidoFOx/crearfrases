import React from 'react'
import { AlertCircle, CheckCircle, Wifi, Shield } from 'lucide-react'
import { AssignedWebsite } from '@/lib/api/users'

interface DomainHelpProps {
  website: AssignedWebsite
}

export function DomainHelp({ website }: DomainHelpProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
        <h3 className="text-lg font-bold text-[#2b2b40] flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Información Importante
        </h3>
      </div>
      <div className="p-4">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-[#096] flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <p>
              <span className="font-semibold text-gray-900">Acceso Editor:</span> Tienes permisos completos para crear, editar y publicar contenido en este sitio.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-[#f54a00] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Wifi className="h-4 w-4 text-white" />
            </div>
            <p>
              <span className="font-semibold text-gray-900">Conexión Verificada:</span> {website.connection_verified ? 'La conexión con WordPress está activa y funcionando correctamente.' : 'La conexión aún no ha sido verificada. Contacta al administrador si tienes problemas.'}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-[#2b2b40] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <p>
              <span className="font-semibold text-gray-900">Seguridad:</span> Todas tus acciones están protegidas y sincronizadas automáticamente con el sitio WordPress.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
