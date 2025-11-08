import React, { useState } from 'react'
import { Search, Loader2, ExternalLink, FileText, AlertCircle, BarChart3, BookOpen, Target, Filter } from 'lucide-react'
import { wordpressAnalyticsService, type SearchResult } from '@/lib/api/wordpress-analytics'
import { AssignedWebsite } from '@/lib/api/users'
import { Badge } from '@/components/ui/badge'

interface DetailedAnalysisProps {
  website: AssignedWebsite
}

type FilterType = 'all' | 'post' | 'page'
type QualityFilter = 'all' | 'excellent' | 'good' | 'needs_improvement' | 'poor'

export function DetailedAnalysis({ website }: DetailedAnalysisProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return

    try {
      setLoading(true)
      setError(null)
      setSearched(true)
      const data = await wordpressAnalyticsService.searchContent(
        website.url,
        query.trim()
      )
      setResults(data)
    } catch (err) {
      console.error('Error searching:', err)
      setError('Error al buscar contenido')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar resultados
  const filteredResults = results.filter(result => {
    // Filtro por tipo
    if (typeFilter !== 'all' && result.type !== typeFilter) {
      return false
    }
    
    // Filtro por calidad
    if (qualityFilter !== 'all' && result.yoast_seo) {
      if (qualityFilter !== result.yoast_seo.overall_quality) {
        return false
      }
    }
    
    return true
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#2b2b40] mb-4 flex items-center gap-2">
        <Search className="h-6 w-6 text-[#9810fa]" />
        Análisis Detallado - Búsqueda de Contenido
      </h2>

      {/* Search Form */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Buscar por Palabra Clave</h3>
        <p className="text-sm text-gray-600 mb-4">
          Encuentra posts que contengan una palabra o frase específica
        </p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Ej: marketing digital, SEO, contenido..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9810fa] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#9810fa] text-white rounded-lg text-sm font-medium hover:bg-[#9810fa]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Buscar
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Loader2 className="h-16 w-16 text-[#9810fa] mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Buscando contenido...
          </h3>
          <p className="text-gray-600">
            Analizando tus posts para "{query}"
          </p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-[#2b2b40]">Resultados de Búsqueda</h3>
              <Badge className="bg-[#9810fa] text-white text-sm">
                {filteredResults.length} de {results.length} resultado{results.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            {results.length > 0 && (
              <p className="text-sm text-gray-600 mb-3">
                Posts que contienen "{query}"
              </p>
            )}
            
            {/* Filtros */}
            {results.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Filter className="h-4 w-4" />
                  Filtrar por:
                </div>
                
                {/* Filtro por Tipo */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      typeFilter === 'all'
                        ? 'bg-[#9810fa] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setTypeFilter('post')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      typeFilter === 'post'
                        ? 'bg-[#9810fa] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setTypeFilter('page')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      typeFilter === 'page'
                        ? 'bg-[#9810fa] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Páginas
                  </button>
                </div>

                {/* Separador */}
                <div className="w-px h-6 bg-gray-300"></div>

                {/* Filtro por Calidad */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setQualityFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      qualityFilter === 'all'
                        ? 'bg-[#9810fa] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setQualityFilter('excellent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      qualityFilter === 'excellent'
                        ? 'bg-[#096] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Excelente
                  </button>
                  <button
                    onClick={() => setQualityFilter('good')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      qualityFilter === 'good'
                        ? 'bg-[#096] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bueno
                  </button>
                  <button
                    onClick={() => setQualityFilter('needs_improvement')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      qualityFilter === 'needs_improvement'
                        ? 'bg-[#f54a00] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Mejorar
                  </button>
                  <button
                    onClick={() => setQualityFilter('poor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      qualityFilter === 'poor'
                        ? 'bg-[#f54a00] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pobre
                  </button>
                </div>
              </div>
            )}
          </div>

          {filteredResults.length === 0 && results.length > 0 ? (
            <div className="text-center py-12 px-6">
              <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay resultados con estos filtros
              </h3>
              <p className="text-gray-600">
                Intenta ajustar los filtros para ver más resultados
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12 px-6">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600">
                Intenta con otra palabra clave o frase
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredResults.map((result) => (
                <SearchResultCard key={result.id} result={result} query={query} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!searched && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Busca contenido en tu sitio
          </h3>
          <p className="text-gray-600">
            Ingresa una palabra clave para encontrar posts relevantes
          </p>
        </div>
      )}
    </div>
  )
}

function SearchResultCard({ result, query }: { result: SearchResult; query: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-5 hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#9810fa] to-purple-600 flex items-center justify-center shadow-sm">
          <FileText className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h4 className="text-base font-bold text-gray-900 line-clamp-2">
              {result.title}
            </h4>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 text-gray-400 hover:text-[#9810fa] hover:bg-white rounded-lg transition-colors"
              title="Ver post"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {result.excerpt}
          </p>

          {/* Occurrences */}
          {result.occurrences && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="bg-[#9810fa]/10 text-[#9810fa] border-[#9810fa]/20 text-xs inline-flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {result.occurrences.total} ocurrencia{result.occurrences.total !== 1 ? 's' : ''}
              </Badge>
              {result.occurrences.title > 0 && (
                <Badge variant="outline" className="text-xs">
                  Título: {result.occurrences.title}
                </Badge>
              )}
              {result.occurrences.content > 0 && (
                <Badge variant="outline" className="text-xs">
                  Contenido: {result.occurrences.content}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">
                {result.type}
              </Badge>
            </div>
          )}

          {/* Yoast SEO Data */}
          {result.yoast_seo && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
              <Badge variant="outline" className="text-xs inline-flex items-center gap-1">
                <Search className="h-3 w-3" />
                SEO: {result.yoast_seo.seo_score}
              </Badge>
              <Badge variant="outline" className="text-xs inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Legibilidad: {result.yoast_seo.readability_score}
              </Badge>
              {result.yoast_seo.focus_keyword && (
                <Badge variant="outline" className="text-xs inline-flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {result.yoast_seo.focus_keyword}
                </Badge>
              )}
              <Badge 
                className={wordpressAnalyticsService.getQualityBadgeColor(
                  result.yoast_seo.overall_quality
                )}
              >
                {result.yoast_seo.overall_quality_text}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
