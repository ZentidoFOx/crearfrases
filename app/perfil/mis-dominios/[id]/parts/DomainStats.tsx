import React from 'react'
import { Wifi, WifiOff, CheckCircle, AlertCircle, Calendar, Shield } from 'lucide-react'
import { AssignedWebsite } from '@/lib/api/users'

interface DomainStatsProps {
  website: AssignedWebsite
  formatDate: (dateString?: string) => string
}

export function DomainStats({ website, formatDate }: DomainStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Estado de Conexión */}
      <div className="bg-white rounded-lg border border-gray-200 hover:border-[#f54a00] transition-all p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-600">Estado de Conexión</p>
            <p className="text-base font-bold text-[#2b2b40] leading-tight mt-0.5">
              {website.connection_verified ? 'Verificado' : 'Pendiente'}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {website.connection_verified ? 'Conexión activa' : 'Sin verificar'}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex-shrink-0 ${
            website.connection_verified ? 'bg-[#f54a00]' : 'bg-gray-300'
          } flex items-center justify-center`}>
            {website.connection_verified ? (
              <Wifi className="h-5 w-5 text-white" />
            ) : (
              <WifiOff className="h-5 w-5 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Estado Activo */}
      <div className="bg-white rounded-lg border border-gray-200 hover:border-[#096] transition-all p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-600">Estado del Sitio</p>
            <p className="text-base font-bold text-[#2b2b40] leading-tight mt-0.5">
              {website.is_active ? 'Activo' : 'Inactivo'}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {website.is_active ? 'Listo para usar' : 'Temporalmente desactivado'}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex-shrink-0 ${
            website.is_active ? 'bg-[#096]' : 'bg-gray-300'
          } flex items-center justify-center`}>
            {website.is_active ? (
              <CheckCircle className="h-5 w-5 text-white" />
            ) : (
              <AlertCircle className="h-5 w-5 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Fecha de Asignación */}
      <div className="bg-white rounded-lg border border-gray-200 hover:border-[#2b2b40] transition-all p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-600">Asignado</p>
            <p className="text-base font-bold text-[#2b2b40] leading-tight mt-0.5">
              {website.assigned_at ? formatDate(website.assigned_at).split(',')[0] : 'No disponible'}
            </p>
            <p className="text-xs text-gray-500 leading-tight">Desde esta fecha</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#2b2b40] flex-shrink-0 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Acceso */}
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-400 transition-all p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-600">Nivel de Acceso</p>
            <p className="text-base font-bold text-[#2b2b40] leading-tight mt-0.5">Editor</p>
            <p className="text-xs text-gray-500 leading-tight">Permisos completos</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-gray-600 flex-shrink-0 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

    </div>
  )
}
