"use client"

import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ContenidoFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onFilterStatusChange: (value: string) => void
  filterType: string
  onFilterTypeChange: (value: string) => void
}

export function ContenidoFilters({
  search,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange
}: ContenidoFiltersProps) {
  const statusFilters = [
    { value: 'all', label: 'Todos' },
    { value: 'published', label: 'Publicado' },
    { value: 'draft', label: 'Borrador' },
    { value: 'scheduled', label: 'Programado' }
  ]

  const typeFilters = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'blog', label: 'Blog Post' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'guide', label: 'Guía' },
    { value: 'video', label: 'Video' }
  ]

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por título, autor o palabras clave..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={filterStatus === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterStatusChange(filter.value)}
              className={
                filterStatus === filter.value
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : ''
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-300" />

        {/* Type Filters */}
        <div className="flex gap-2">
          {typeFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={filterType === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterTypeChange(filter.value)}
              className={
                filterType === filter.value
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : ''
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
