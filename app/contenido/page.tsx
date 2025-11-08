"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticleTable } from '@/components/articles/ArticleTable'
import { ArticleCard } from '@/components/articles/ArticleCard'
import { useAuth } from '@/contexts/auth-context'
import { articlesService, type Article, type ArticleStatus } from '@/lib/api/articles'
import { 
  FileText, 
  Plus, 
  Search,
  Grid3x3,
  List,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  XCircle,
  TrendingUp,
  Award,
  Info
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ContenidoPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null)

  useEffect(() => {
    loadArticles()
  }, [])

  useEffect(() => {
    filterArticles()
  }, [articles, search, statusFilter])

  const loadArticles = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await articlesService.getAll()
      
      if (response.success && response.data) {
        setArticles(response.data)
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los artículos')
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = [...articles]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        a.keyword.toLowerCase().includes(searchLower)
      )
    }

    setFilteredArticles(filtered)
  }

  const handleEdit = (id: number) => {
    router.push(`/contenido/editar/${id}`)
  }

  const handleView = (id: number) => {
    router.push(`/contenido/ver/${id}`)
  }

  const handleDeleteClick = (id: number) => {
    setArticleToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return

    try {
      await articlesService.delete(articleToDelete)
      setArticles(articles.filter(a => a.id !== articleToDelete))
      setDeleteDialogOpen(false)
      setArticleToDelete(null)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el artículo')
    }
  }

  const handleSubmit = async (id: number) => {
    try {
      await articlesService.submit(id)
      loadArticles() // Reload to get updated status
    } catch (err: any) {
      setError(err.message || 'Error al enviar el artículo')
    }
  }

  const getStatusCount = (status: ArticleStatus) => {
    return articles.filter(a => a.status === status).length
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />

      <main className="ml-0 md:ml-20 pt-16 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-[#2b2b40] flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-[#2b2b40] truncate">Mis Artículos</h1>
                <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">
                  Gestiona todos tus artículos y contenidos
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/contenido/planner')}
              style={{ backgroundColor: '#096' }}
              className="hover:opacity-90 w-full sm:w-auto flex-shrink-0"
              size="default"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Crear Artículo
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards - Responsive */}
          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              {/* Total Articles */}
              <div className="bg-white rounded-lg border border-gray-200 hover:border-[#2b2b40] transition-all p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600">Total Artículos</p>
                    <p className="text-base font-bold text-[#2b2b40] leading-tight mt-0.5">{articles.length}</p>
                    <p className="text-xs text-gray-500 leading-tight">En tu biblioteca</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#2b2b40] flex-shrink-0 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Published */}
              <div className="bg-white rounded-lg border border-gray-200 hover:border-[#096] transition-all p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600">Publicados</p>
                    <p className="text-base font-bold leading-tight mt-0.5" style={{ color: '#096' }}>{getStatusCount('published')}</p>
                    <p className="text-xs text-gray-500 leading-tight">
                      {articles.length > 0 ? ((getStatusCount('published') / articles.length) * 100).toFixed(0) : 0}% completado
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#096' }}>
                    <Award className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Pending */}
              <div className="bg-white rounded-lg border border-gray-200 hover:border-[#ff6900] transition-all p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600">Pendientes</p>
                    <p className="text-base font-bold leading-tight mt-0.5" style={{ color: '#ff6900' }}>{getStatusCount('pending')}</p>
                    <p className="text-xs text-gray-500 leading-tight">En revisión</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#ff6900' }}>
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Drafts */}
              <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-400 transition-all p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600">Borradores</p>
                    <p className="text-base font-bold text-gray-600 leading-tight mt-0.5">{getStatusCount('draft')}</p>
                    <p className="text-xs text-gray-500 leading-tight">Por completar</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-gray-600 flex-shrink-0 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Two Blocks - Responsive */}
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            {/* Left Sidebar - Navigation - Oculto en móvil */}
            <div className="hidden lg:block col-span-12 lg:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
                <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">Filtrar por Estado</h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Todos ({articles.length})
                  </button>
                  
                  <button
                    onClick={() => setStatusFilter('published')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'published'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Publicados ({getStatusCount('published')})
                  </button>

                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'pending'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    Pendientes ({getStatusCount('pending')})
                  </button>
                  
                  <button
                    onClick={() => setStatusFilter('draft')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'draft'
                        ? 'bg-[#096] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Borradores ({getStatusCount('draft')})
                  </button>
                </nav>

                {/* Acciones Disponibles */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">Acciones Rápidas</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => router.push('/contenido/planner')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Crear Nuevo Artículo
                    </button>
                    
                    <button
                      onClick={() => setSearch('')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Block - Articles List */}
            <div className="col-span-12 lg:col-span-9">
              {/* Filtros móviles horizontales */}
              <div className="lg:hidden mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                      statusFilter === 'all' ? 'bg-[#096] text-white' : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    Todos ({articles.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('published')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                      statusFilter === 'published' ? 'bg-[#096] text-white' : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    Publicados ({getStatusCount('published')})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                      statusFilter === 'pending' ? 'bg-[#096] text-white' : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    Pendientes ({getStatusCount('pending')})
                  </button>
                  <button
                    onClick={() => setStatusFilter('draft')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                      statusFilter === 'draft' ? 'bg-[#096] text-white' : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    Borradores ({getStatusCount('draft')})
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200">
                {/* Header - Responsive */}
                <div className="p-3 md:p-4 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <h2 className="text-base md:text-lg font-bold text-gray-900">Mis Artículos</h2>
                    <div className="flex items-center gap-2 md:gap-3">
                      {/* Search - Responsive */}
                      <div className="relative flex-1 md:flex-initial md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-8 md:pl-10 h-8 md:h-9 text-xs md:text-sm"
                        />
                      </div>
                      {/* View Mode Toggle - Solo iconos en móvil */}
                      <div className="flex items-center border border-gray-200 rounded-lg flex-shrink-0">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`px-2 md:px-3 py-1.5 text-sm rounded-l-lg transition-colors ${
                            viewMode === 'grid'
                              ? 'bg-[#096] text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Grid3x3 className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={`px-2 md:px-3 py-1.5 text-sm rounded-r-lg transition-colors border-l border-gray-200 ${
                            viewMode === 'table'
                              ? 'bg-[#096] text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <List className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  {/* Content */}
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#096' }} />
                    </div>
                  ) : filteredArticles.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay artículos
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {search || statusFilter !== 'all' 
                          ? 'No se encontraron artículos con los filtros aplicados'
                          : 'Comienza creando tu primer artículo'}
                      </p>
                      {!search && statusFilter === 'all' && (
                        <Button 
                          onClick={() => router.push('/contenido/planner')}
                          style={{ backgroundColor: '#096' }}
                          className="hover:opacity-90"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Artículo
                        </Button>
                      )}
                    </div>
                  ) : viewMode === 'table' ? (
                    <ArticleTable
                      articles={filteredArticles}
                      onEdit={handleEdit}
                      onView={handleView}
                      onDelete={handleDeleteClick}
                      onSubmit={handleSubmit}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {filteredArticles.map(article => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          onEdit={handleEdit}
                          onView={handleView}
                          onDelete={handleDeleteClick}
                          onSubmit={handleSubmit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Information Section - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Workflow Card */}
            <Card className="border border-gray-200 rounded-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" style={{ color: '#096' }} />
                  Flujo de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">1. Borrador</p>
                    <p className="text-xs text-gray-600">Crea y edita tu artículo. Guarda como borrador.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <Send className="h-4 w-4" style={{ color: '#ff6900' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">2. Enviar a Revisión</p>
                    <p className="text-xs text-gray-600">Envía el artículo para que sea revisado por un admin.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Award className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">3. Publicado</p>
                    <p className="text-xs text-gray-600">El admin aprueba y publica el artículo.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border border-gray-200 rounded-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" style={{ color: '#ff6900' }} />
                  Consejos de Escritura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <CheckCircle className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">SEO Optimizado</p>
                    <p className="text-xs text-gray-600">Usa la palabra clave en título, introducción y conclusión.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <FileText className="h-4 w-4" style={{ color: '#ff6900' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Estructura Clara</p>
                    <p className="text-xs text-gray-600">Usa encabezados H2 y H3 para organizar el contenido.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <TrendingUp className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Contenido de Valor</p>
                    <p className="text-xs text-gray-600">Proporciona información útil y relevante para tu audiencia.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="border border-gray-200 rounded-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5" style={{ color: '#2b2b40' }} />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#09610' }}>
                    <Plus className="h-4 w-4" style={{ color: '#096' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Crear Artículo</p>
                    <p className="text-xs text-gray-600">Usa el planificador para generar contenido con IA.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255, 105, 0, 0.1)' }}>
                    <Search className="h-4 w-4" style={{ color: '#ff6900' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Buscar</p>
                    <p className="text-xs text-gray-600">Filtra por título, palabra clave o estado.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(43, 43, 64, 0.1)' }}>
                    <List className="h-4 w-4" style={{ color: '#2b2b40' }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Vista Personalizada</p>
                    <p className="text-xs text-gray-600">Cambia entre vista de tabla o cuadrícula.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El artículo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
