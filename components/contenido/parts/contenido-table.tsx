"use client"

import { useState, useEffect } from 'react'
import { Edit, Trash2, Eye, MoreVertical, Calendar, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContentItem {
  id: number
  title: string
  type: string
  author: string
  status: 'published' | 'draft' | 'scheduled'
  views: number
  engagement: number
  publishDate: string
}

interface ContenidoTableProps {
  search: string
  filterStatus: string
  filterType: string
}

export function ContenidoTable({ search, filterStatus, filterType }: ContenidoTableProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)

  // Mock data
  useEffect(() => {
    setLoading(true)
    const mockData: ContentItem[] = [
      {
        id: 1,
        title: 'Guía Completa de SEO 2024',
        type: 'guide',
        author: 'Juan Pérez',
        status: 'published',
        views: 15420,
        engagement: 85,
        publishDate: '2024-01-15'
      },
      {
        id: 2,
        title: 'Cómo Optimizar tus Landing Pages',
        type: 'blog',
        author: 'María García',
        status: 'published',
        views: 8920,
        engagement: 72,
        publishDate: '2024-01-20'
      },
      {
        id: 3,
        title: 'Tutorial: Marketing de Contenidos',
        type: 'video',
        author: 'Carlos López',
        status: 'draft',
        views: 0,
        engagement: 0,
        publishDate: '-'
      },
      {
        id: 4,
        title: 'Mejores Prácticas para Email Marketing',
        type: 'landing',
        author: 'Ana Martínez',
        status: 'scheduled',
        views: 0,
        engagement: 0,
        publishDate: '2024-02-10'
      },
      {
        id: 5,
        title: 'Tendencias de Marketing Digital',
        type: 'blog',
        author: 'Juan Pérez',
        status: 'published',
        views: 12350,
        engagement: 78,
        publishDate: '2024-01-25'
      }
    ]
    
    // Apply filters
    let filtered = mockData

    if (search) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.author.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus)
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType)
    }

    setTimeout(() => {
      setContent(filtered)
      setLoading(false)
    }, 300)
  }, [search, filterStatus, filterType])

  const getStatusBadge = (status: string) => {
    const badges = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800'
    }
    const labels = {
      published: 'Publicado',
      draft: 'Borrador',
      scheduled: 'Programado'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      blog: 'Blog',
      landing: 'Landing',
      guide: 'Guía',
      video: 'Video'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando contenido...</p>
        </div>
      </div>
    )
  }

  if (content.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No se encontró contenido con los filtros seleccionados</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contenido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Autor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Métricas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {content.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500">{getTypeBadge(item.type)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {item.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{item.author}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Eye className="h-4 w-4" />
                      <span>{item.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>{item.engagement}%</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {item.publishDate !== '-' ? new Date(item.publishDate).toLocaleDateString('es-ES') : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" title="Ver">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Editar">
                      <Edit className="h-4 w-4 text-purple-600" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Eliminar">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
