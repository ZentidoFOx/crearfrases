"use client"

import React from 'react'
import Link from 'next/link'
import { useWebsite } from '@/contexts/website-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  ChevronDown, 
  CheckCircle,
  Wifi,
  WifiOff,
  ExternalLink,
  Settings
} from 'lucide-react'

export function WebsiteSelector() {
  const { websites, activeWebsite, setActiveWebsite, loading } = useWebsite()

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 animate-pulse">
        <Globe className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Cargando...</span>
      </div>
    )
  }

  if (websites.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
        <Globe className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600">Sin dominios asignados</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 h-10 border border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <Globe className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
            {activeWebsite?.name || 'Seleccionar dominio'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-2 bg-white border-gray-200 shadow-lg">
        <div className="px-2 py-2 border-b border-gray-200 mb-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-900">Tus Dominios ({websites.length})</span>
          </div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {websites.map((website) => (
            <button
              key={website.id}
              onClick={() => setActiveWebsite(website)}
              className={`w-full flex items-start gap-3 p-2 cursor-pointer transition-colors rounded-md ${
                activeWebsite?.id === website.id 
                  ? 'bg-emerald-50 hover:bg-emerald-100' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                website.connection_verified 
                  ? 'bg-gradient-to-br from-teal-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                {website.connection_verified ? (
                  <Wifi className="h-5 w-5 text-white" />
                ) : (
                  <WifiOff className="h-5 w-5 text-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">
                    {website.name}
                  </p>
                  {activeWebsite?.id === website.id && (
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {website.url}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      website.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {website.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  
                  {website.connection_verified && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                    >
                      Verificado
                    </Badge>
                  )}

                  <Link
                    href={`/perfil/administrar-dominio/${website.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 hover:underline"
                  >
                    <Settings className="h-3 w-3" />
                    Administrar
                  </Link>
                </div>
              </div>
              
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(website.url, '_blank')
                }}
                className="text-gray-400 hover:text-emerald-600 transition-colors p-1 flex-shrink-0 cursor-pointer"
                title="Abrir sitio"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(website.url, '_blank')
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
