import React from 'react'
import { 
  Server, 
  Globe, 
  CheckCircle, 
  Shield, 
  Calendar,
  Wifi,
  Hash,
  User
} from 'lucide-react'
import { AssignedWebsite } from '@/lib/api/users'

interface DomainInfoProps {
  website: AssignedWebsite
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No disponible'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric'
  })
}

export function DomainInfo({ website }: DomainInfoProps) {
  return (
    <div>
      
      {/* Información Técnica */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 rounded-t-lg">
          <h3 className="text-lg font-bold text-[#2b2b40] flex items-center gap-2">
            <Server className="h-5 w-5" />
            Información Técnica
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-lg bg-[#f54a00]/10 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-[#f54a00]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">URL del Sitio</p>
                <a 
                  href={website.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-[#2b2b40] hover:underline break-all"
                >
                  {website.url}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-lg bg-[#096]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-[#096]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">Estado</p>
                <p className="text-sm text-gray-600">
                  {website.is_active ? 'Activo y disponible para gestionar contenido' : 'Temporalmente inactivo'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">Protocolo</p>
                <p className="text-sm text-gray-600">
                  {website.url.startsWith('https') ? 'HTTPS (Seguro) ✓' : 'HTTP (No seguro)'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Wifi className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">Conexión Verificada</p>
                <p className="text-sm text-gray-600">
                  {website.connection_verified ? 'Conexión activa y funcionando correctamente' : 'Pendiente de verificación'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-lg bg-[#9810fa]/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-[#9810fa]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">Fecha de Asignación</p>
                <p className="text-sm text-gray-600">
                  {formatDate(website.assigned_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Hash className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">ID del Dominio</p>
                <p className="text-sm text-gray-600 font-mono">
                  #{website.id}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">Nivel de Acceso</p>
                <p className="text-sm text-gray-600">
                  Editor - Permisos completos de gestión
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
