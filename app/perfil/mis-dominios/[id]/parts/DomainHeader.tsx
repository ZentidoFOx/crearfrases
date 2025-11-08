import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Globe, ExternalLink } from 'lucide-react'
import { AssignedWebsite } from '@/lib/api/users'

interface DomainHeaderProps {
  website: AssignedWebsite
}

export function DomainHeader({ website }: DomainHeaderProps) {
  return (
    <>
      <Link href="/perfil/mis-dominios">
        <Button variant="ghost" size="lg" className="mb-6 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Mis Dominios
        </Button>
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-lg flex items-center justify-center ${
              website.connection_verified ? 'bg-[#f54a00]' : 'bg-gray-300'
            }`}>
              <Globe className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-[#2b2b40]">{website.name}</h1>
                <Badge className={`text-base px-4 py-1 ${
                  website.is_active ? 'bg-[#096] text-white' : 'bg-gray-400 text-white'
                }`}>
                  {website.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <a 
                href={website.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-[#2b2b40] transition-colors flex items-center gap-2 group"
              >
                <ExternalLink className="h-4 w-4 group-hover:text-[#2b2b40]" />
                <span className="group-hover:underline">{website.url}</span>
              </a>
              {website.description && (
                <p className="text-sm text-gray-500 mt-2">{website.description}</p>
              )}
            </div>
          </div>

          <Button 
            size="lg"
            onClick={() => window.open(website.url, '_blank')}
            className="bg-[#2b2b40] hover:bg-[#2b2b40]/90 text-white"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Abrir Sitio
          </Button>
        </div>
      </div>
    </>
  )
}
