"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Globe,
  Tag,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  Search,
  X,
  Loader2,
  Check,
  ChevronsUpDown,
  Send,
  ExternalLink
} from 'lucide-react'

interface WordPressTabProps {
  activeWebsite: any
  article: any
  wordpress: any
  postStatus: 'publish' | 'draft'
  setPostStatus: (status: 'publish' | 'draft') => void
  onPublish: () => void
}

export function WordPressTab({
  activeWebsite,
  article,
  wordpress,
  postStatus,
  setPostStatus,
  onPublish
}: WordPressTabProps) {
  const [openCategoryPopover, setOpenCategoryPopover] = useState(false)
  const [openImageDialog, setOpenImageDialog] = useState(false)
  const [openStatusPopover, setOpenStatusPopover] = useState(false)
  const [imageSearchTerm, setImageSearchTerm] = useState('')

  // Search images with debounce (same as wysiwyg-editor)
  useEffect(() => {
    if (!activeWebsite?.url || !openImageDialog) return
    
    const timer = setTimeout(() => {
      wordpress.fetchImages(imageSearchTerm)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [imageSearchTerm, openImageDialog, activeWebsite?.url, wordpress])

  if (!activeWebsite) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No hay sitio web activo</p>
        <p className="text-sm mt-2">Selecciona un sitio web desde el selector</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Site Info + Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">{activeWebsite.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{activeWebsite.url}</p>
            </div>
          </div>
          {article.wordpress_post_id && (
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2.5 py-1 shadow-sm">✓ Published</Badge>
          )}
        </div>
      </div>

      {/* Categories Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Tag className="h-4 w-4 text-orange-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Categorías</h3>
        </div>
        
        {/* Selected Categories */}
        {wordpress.wpCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {wordpress.wpCategories.map((category: string, idx: number) => (
              <Badge key={idx} className="bg-blue-600 text-white text-xs pr-1 pl-2.5">
                {category}
                <button
                  onClick={() => wordpress.setWpCategories(wordpress.wpCategories.filter((_: string, i: number) => i !== idx))}
                  className="ml-1.5 hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Popover Selector */}
        <Popover open={openCategoryPopover} onOpenChange={setOpenCategoryPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCategoryPopover}
              className="w-full justify-between text-sm h-10"
              disabled={wordpress.isLoadingCategories}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {wordpress.isLoadingCategories ? 'Cargando...' : 'Seleccionar categorías'}
                </span>
              </div>
              {wordpress.isLoadingCategories ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar categoría..." />
              <CommandEmpty>No se encontraron categorías.</CommandEmpty>
              <CommandList className="max-h-64">
                <CommandGroup>
                  {wordpress.availableCategories.map((category: any) => {
                    const isSelected = wordpress.wpCategories.includes(category.name)
                    return (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => {
                          if (isSelected) {
                            wordpress.setWpCategories(wordpress.wpCategories.filter((c: string) => c !== category.name))
                          } else {
                            wordpress.setWpCategories([...wordpress.wpCategories, category.name])
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox checked={isSelected} />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{category.count}</Badge>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <p className="text-xs text-gray-500 mt-2.5">
          {wordpress.wpCategories.length > 0 
            ? `${wordpress.wpCategories.length} categoría${wordpress.wpCategories.length > 1 ? 's' : ''} seleccionada${wordpress.wpCategories.length > 1 ? 's' : ''}`
            : 'Selecciona las categorías para el artículo'
          }
        </p>
      </div>

      {/* Featured Image Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-pink-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Imagen Destacada</h3>
        </div>

        {/* Preview de imagen seleccionada */}
        {wordpress.wpFeaturedImage && (
          <div className="relative mb-3 rounded-lg overflow-hidden border-2 border-pink-200 group">
            <img 
              src={wordpress.wpFeaturedImage} 
              alt="Imagen destacada" 
              className="w-full h-40 object-cover"
            />
            {/* Badge con ID de la imagen */}
            {wordpress.wpFeaturedImageId && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-lg">
                ID: {wordpress.wpFeaturedImageId}
              </div>
            )}
            <button
              onClick={() => {
                wordpress.setWpFeaturedImage('')
                wordpress.setWpFeaturedImageId(null)
              }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Button to Open Modal */}
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-sm h-10"
          disabled={wordpress.isLoadingImages}
          onClick={() => setOpenImageDialog(true)}
        >
          <ImageIcon className="h-4 w-4 mr-2 text-pink-600" />
          {wordpress.isLoadingImages ? 'Cargando...' : wordpress.wpFeaturedImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
        </Button>

        {/* Modal Selector */}
        <Dialog open={openImageDialog} onOpenChange={(open) => {
          setOpenImageDialog(open)
          if (!open) setImageSearchTerm('')
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-pink-600" />
                Biblioteca de Medios
              </DialogTitle>
              <DialogDescription>
                Selecciona una imagen destacada de tu biblioteca de WordPress
              </DialogDescription>
            </DialogHeader>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={imageSearchTerm}
                onChange={(e) => {
                  setImageSearchTerm(e.target.value)
                  wordpress.fetchImages(e.target.value)
                }}
                placeholder="Buscar imágenes por nombre..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Images Grid */}
            <div className="flex-1 overflow-y-auto border rounded-lg p-4">
              {wordpress.isLoadingImages ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-pink-600 mb-4" />
                  <p className="text-sm text-gray-500">Cargando imágenes de WordPress...</p>
                </div>
              ) : wordpress.availableImages.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {wordpress.availableImages.map((img: any) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        console.log('🖼️ [WORDPRESS-TAB] Seleccionando imagen:', {
                          id: img.id,
                          url: img.url,
                          title: img.title
                        })
                        wordpress.setWpFeaturedImage(img.url)
                        wordpress.setWpFeaturedImageId(img.id)
                        console.log('✅ [WORDPRESS-TAB] Imagen seleccionada:', img.url)
                        setOpenImageDialog(false)
                        setImageSearchTerm('')
                      }}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg ${
                        wordpress.wpFeaturedImageId === img.id 
                          ? 'border-pink-500 ring-4 ring-pink-200' 
                          : 'border-gray-200 hover:border-pink-400'
                      }`}
                    >
                      <img
                        src={img.thumbnail}
                        alt={img.alt}
                        className="w-full h-32 object-cover"
                      />
                      {wordpress.wpFeaturedImageId === img.id && (
                        <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <Check className="h-6 w-6 text-pink-600" />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                        <div className="p-2 w-full">
                          <p className="text-white text-xs font-medium line-clamp-2">
                            {img.title}
                          </p>
                          <p className="text-white/70 text-[10px] mt-0.5">
                            ID: {img.id}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ImageIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-sm font-medium text-gray-700">
                    {imageSearchTerm ? 'No se encontraron imágenes' : 'No hay imágenes disponibles'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {imageSearchTerm ? 'Intenta con otro término de búsqueda' : 'Sube imágenes a tu biblioteca de WordPress'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-600">
                {wordpress.availableImages.length} imagen{wordpress.availableImages.length !== 1 ? 'es' : ''} disponible{wordpress.availableImages.length !== 1 ? 's' : ''}
              </span>
              {wordpress.wpFeaturedImageId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpenImageDialog(false)
                    setImageSearchTerm('')
                  }}
                >
                  Cerrar
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <p className="text-xs text-gray-500 mt-2">
          {wordpress.wpFeaturedImage 
            ? 'Imagen seleccionada de la biblioteca' 
            : 'Selecciona de tu biblioteca de WordPress'
          }
        </p>
      </div>

      {/* Post Status Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Estado de Publicación</h3>
        </div>

        {/* Popover Selector */}
        <Popover open={openStatusPopover} onOpenChange={setOpenStatusPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openStatusPopover}
              className="w-full justify-between text-sm h-10"
            >
              <div className="flex items-center gap-2">
                {postStatus === 'publish' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <FileText className="h-4 w-4 text-orange-600" />
                )}
                <span className="text-gray-700">
                  {postStatus === 'publish' ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  <CommandItem
                    value="publish"
                    onSelect={() => {
                      setPostStatus('publish')
                      setOpenStatusPopover(false)
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">Publicado</p>
                        <p className="text-xs text-gray-500">Visible públicamente en tu sitio</p>
                      </div>
                      {postStatus === 'publish' && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </CommandItem>
                  
                  <CommandItem
                    value="draft"
                    onSelect={() => {
                      setPostStatus('draft')
                      setOpenStatusPopover(false)
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">Borrador</p>
                        <p className="text-xs text-gray-500">Solo visible en WordPress admin</p>
                      </div>
                      {postStatus === 'draft' && (
                        <Check className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <p className="text-xs text-gray-500 mt-2.5">
          {postStatus === 'publish' 
            ? '✓ El artículo será visible para todos los visitantes'
            : '✓ El artículo se guardará como borrador privado'
          }
        </p>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        {!article.wordpress_post_id ? (
          <Button
            onClick={onPublish}
            disabled={wordpress.isPublishing}
            className={`w-full h-11 font-semibold shadow-md hover:shadow-lg transition-all ${
              postStatus === 'publish'
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
            }`}
          >
            {wordpress.isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {postStatus === 'publish' ? 'Publicando...' : 'Guardando borrador...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {postStatus === 'publish' ? '📤 Publicar en WordPress' : '💾 Guardar como Borrador'}
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full h-11 font-semibold border-2 border-green-300 hover:border-green-400 hover:bg-green-50 transition-all"
            onClick={onPublish}
          >
            <Send className="h-4 w-4 mr-2" />
            📤 Publicar nuevamente
          </Button>
        )}
      </div>
    </div>
  )
}
