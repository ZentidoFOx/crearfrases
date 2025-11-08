"use client"

import React from 'react'
import { Send, Check, Tag, Image, Globe, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Category } from '../types'

interface MediaImage {
  id: number
  title: string
  url: string
  thumbnail: string
  alt: string
  date: string
}

interface WordPressPanelProps {
  activeWebsiteName: string | undefined
  activeWebsiteUrl: string | undefined
  title: string
  h1Title: string
  description?: string
  keyword: string
  wpCategories: string[]
  setWpCategories: (categories: string[]) => void
  wpTags: string[]
  setWpTags: (tags: string[]) => void
  wpFeaturedImage: string
  setWpFeaturedImage: (image: string) => void
  wpFeaturedImageId: number | null
  setWpFeaturedImageId: (id: number | null) => void
  isPublishing: boolean
  onPublish: () => void
  availableCategories: Category[]
  categorySearchTerm: string
  setCategorySearchTerm: (term: string) => void
  isLoadingCategories: boolean
  showCategoryDropdown: boolean
  setShowCategoryDropdown: (show: boolean) => void
  // Media library
  availableImages: MediaImage[]
  imageSearchTerm: string
  setImageSearchTerm: (term: string) => void
  isLoadingImages: boolean
  showImageSelector: boolean
  setShowImageSelector: (show: boolean) => void
}

export function WordPressPanel({
  activeWebsiteName,
  title,
  h1Title,
  description,
  keyword,
  wpCategories,
  setWpCategories,
  wpTags,
  setWpTags,
  wpFeaturedImage,
  setWpFeaturedImage,
  wpFeaturedImageId,
  setWpFeaturedImageId,
  isPublishing,
  onPublish,
  availableCategories,
  categorySearchTerm,
  setCategorySearchTerm,
  isLoadingCategories,
  showCategoryDropdown,
  setShowCategoryDropdown,
  availableImages,
  imageSearchTerm,
  setImageSearchTerm,
  isLoadingImages,
  showImageSelector,
  setShowImageSelector
}: WordPressPanelProps) {
  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <Send className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">📤 Publicar en WordPress</h3>
          <p className="text-sm text-gray-500">
            Se publicará en <strong className="text-blue-600">{activeWebsiteName || 'WordPress'}</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* LEFT BLOCK - User Input */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-900">📝 Configuración del Post</h3>
                <p className="text-xs text-blue-700">Ajusta categorías, tags e imagen</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Categories - Searchable Multi-Select */}
              <div className="relative category-selector">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  Categorías
                </label>
                
                {/* Selected Categories */}
                {wpCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {wpCategories.map((category, idx) => (
                      <Badge key={idx} className="bg-blue-600 text-white pr-1 pl-2.5">
                        {category}
                        <button
                          onClick={() => setWpCategories(wpCategories.filter((_, i) => i !== idx))}
                          className="ml-1.5 hover:bg-blue-700 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Buscar categorías en WordPress..."
                    className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isLoadingCategories && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-spin" />
                  )}
                </div>

                {/* Dropdown with Categories */}
                {showCategoryDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {availableCategories.length > 0 ? (
                      <div className="p-1">
                        {availableCategories.map((category) => {
                          const isSelected = wpCategories.includes(category.name)
                          return (
                            <button
                              key={category.id}
                              onClick={() => {
                                if (isSelected) {
                                  setWpCategories(wpCategories.filter(c => c !== category.name))
                                } else {
                                  setWpCategories([...wpCategories, category.name])
                                }
                              }}
                              className={`w-full px-3 py-2.5 text-left text-sm rounded-lg flex items-center justify-between hover:bg-blue-50 transition-colors ${
                                isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {category.count} posts
                              </Badge>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {isLoadingCategories ? 'Buscando categorías...' : 'No se encontraron categorías'}
                      </div>
                    )}
                    
                    <div className="border-t p-2 bg-gray-50">
                      <Button
                        onClick={() => {
                          setShowCategoryDropdown(false)
                          setCategorySearchTerm('')
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1.5">
                  {wpCategories.length > 0 
                    ? `${wpCategories.length} categoría${wpCategories.length > 1 ? 's' : ''} seleccionada${wpCategories.length > 1 ? 's' : ''}`
                    : 'Busca y selecciona categorías de tu sitio WordPress'
                  }
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  Etiquetas
                </label>
                <input
                  type="text"
                  value={wpTags.join(', ')}
                  onChange={(e) => setWpTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="Ej: pantanal, jaguares, safari"
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {wpTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Pre-llenado con las palabras clave del título</p>
              </div>

              {/* Featured Image - Media Library Selector */}
              <div className="relative image-selector">
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Image className="h-4 w-4 text-blue-600" />
                  Imagen Destacada
                </label>
                
                {/* Selected Image Preview */}
                {wpFeaturedImage && (
                  <div className="relative mb-2 rounded-lg overflow-hidden border-2 border-blue-300 group">
                    <img 
                      src={wpFeaturedImage} 
                      alt="Imagen destacada" 
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Error+al+cargar+imagen'
                      }}
                    />
                    <button
                      onClick={() => {
                        setWpFeaturedImage('')
                        setWpFeaturedImageId(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Search/Select Button */}
                <Button
                  type="button"
                  onClick={() => setShowImageSelector(!showImageSelector)}
                  variant="outline"
                  className="w-full justify-start text-left font-normal border-2"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {wpFeaturedImage ? 'Cambiar imagen de la biblioteca' : 'Seleccionar de la biblioteca de medios'}
                </Button>

                {/* Image Selector Dropdown */}
                {showImageSelector && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={imageSearchTerm}
                          onChange={(e) => setImageSearchTerm(e.target.value)}
                          placeholder="Buscar imágenes..."
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {isLoadingImages && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-spin" />
                        )}
                      </div>
                    </div>

                    {/* Images Grid */}
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {availableImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {availableImages.map((img) => (
                            <button
                              key={img.id}
                              onClick={() => {
                                setWpFeaturedImage(img.url)
                                setWpFeaturedImageId(img.id)
                                setShowImageSelector(false)
                                setImageSearchTerm('')
                              }}
                              className={`relative group rounded-lg overflow-hidden border-2 transition-all hover:border-blue-500 hover:scale-105 ${
                                wpFeaturedImageId === img.id ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
                              }`}
                            >
                              <img
                                src={img.thumbnail}
                                alt={img.alt}
                                className="w-full h-24 object-cover"
                              />
                              {wpFeaturedImageId === img.id && (
                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                  <Check className="h-6 w-6 text-blue-600 bg-white rounded-full p-1" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-medium text-center px-1">
                                  {img.title}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-sm text-gray-500">
                          {isLoadingImages ? 'Cargando imágenes...' : 'No se encontraron imágenes'}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="border-t p-2 bg-gray-50 flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {availableImages.length} imágenes disponibles
                      </span>
                      <Button
                        onClick={() => {
                          setShowImageSelector(false)
                          setImageSearchTerm('')
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1.5">
                  Selecciona una imagen de tu biblioteca de medios de WordPress
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BLOCK - Yoast SEO Data (Auto) */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-green-900">✅ Datos Yoast SEO</h3>
                <p className="text-xs text-green-700">Se enviarán automáticamente</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                <label className="text-xs font-semibold text-green-800 mb-1 block">Título SEO</label>
                <p className="text-sm text-gray-900 font-medium">{title}</p>
                <p className="text-xs text-gray-500 mt-1">{title.length} caracteres</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                <label className="text-xs font-semibold text-green-800 mb-1 block">Título H1</label>
                <p className="text-sm text-gray-900 font-medium">{h1Title}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                <label className="text-xs font-semibold text-green-800 mb-1 block">Meta Descripción</label>
                <p className="text-sm text-gray-900">{description}</p>
                <p className="text-xs text-gray-500 mt-1">{description?.length || 0} caracteres</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                <label className="text-xs font-semibold text-green-800 mb-1 block">Palabra Clave Focus</label>
                <Badge className="bg-green-600 text-white">{keyword}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Button */}
      <div className="mt-6 pt-6 border-t-2 border-gray-200">
        <Button
          onClick={onPublish}
          disabled={isPublishing}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-12 shadow-lg hover:shadow-xl transition-all"
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Publicando en {activeWebsiteName || 'WordPress'}...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              📤 Publicar en {activeWebsiteName || 'WordPress'}
            </>
          )}
        </Button>
        
        {/* Info message */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 flex items-start gap-2">
            <Globe className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Se publicará automáticamente:</strong> Contenido HTML, Título SEO, H1, Meta Descripción, Palabra Clave, Categorías, Tags e Imagen Destacada.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
