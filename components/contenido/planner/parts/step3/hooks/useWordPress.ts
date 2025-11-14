import { useState, useEffect, useRef } from 'react'
import { wordpressAnalyticsService } from '@/lib/api/wordpress-analytics'
import { Category } from '../types'

interface MediaImage {
  id: number
  title: string
  url: string
  thumbnail: string
  alt: string
  date: string
}

interface ArticleData {
  featured_image_url?: string | null
  featured_image_id?: number | null
  wordpress_categories?: Array<{ id: number; name: string; slug: string }> | null
  keywords_array?: string[]
}

export const useWordPress = (
  keywords: string[] | undefined, 
  activeWebsiteUrl: string | undefined,
  articleData?: ArticleData | null
) => {
  const [wpCategories, setWpCategories] = useState<string[]>([])
  const [wpTags, setWpTags] = useState<string[]>(keywords || [])
  const [wpFeaturedImage, setWpFeaturedImage] = useState('')
  const [wpFeaturedImageId, setWpFeaturedImageId] = useState<number | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // 🔥 Guardar referencias previas para detectar cambios reales
  const prevFeaturedImageRef = useRef<string | undefined>(undefined)
  const prevCategoriesRef = useRef<Array<{ id: number; name: string; slug: string }> | undefined>(undefined)
  
  // Categories search
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)

  // Media library
  const [availableImages, setAvailableImages] = useState<MediaImage[]>([])
  const [cachedImages, setCachedImages] = useState<MediaImage[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [imageSearchCache, setImageSearchCache] = useState<Map<string, MediaImage[]>>(new Map())

  // Initialize/Update data from article when it loads or changes (e.g., language switch)
  useEffect(() => {
    if (articleData) {
      console.log('🔄 Actualizando datos de WordPress desde artículo:', {
        featured_image: articleData.featured_image_url,
        categories: articleData.wordpress_categories
      })
      
      // 🔥 IMPORTANTE: Solo actualizar si hay valores reales y son diferentes a los anteriores
      // Restaurar imagen destacada
      if (articleData.featured_image_url && articleData.featured_image_url !== prevFeaturedImageRef.current) {
        setWpFeaturedImage(articleData.featured_image_url)
        prevFeaturedImageRef.current = articleData.featured_image_url
        
        // 🔥 Restaurar URL e ID de la imagen
        console.log('📸 Imagen destacada restaurada:', {
          url: articleData.featured_image_url,
          id: articleData.featured_image_id
        })
        
        // Si hay ID guardado, restaurarlo también
        if (articleData.featured_image_id) {
          setWpFeaturedImageId(articleData.featured_image_id)
          console.log('📸 ID de imagen restaurado:', articleData.featured_image_id)
        }
      }
      // Si no hay imagen, NO hacer nada (mantener la actual)
      
      // Restaurar categorías
      if (articleData.wordpress_categories && Array.isArray(articleData.wordpress_categories) && articleData.wordpress_categories.length > 0) {
        const categoryNames = articleData.wordpress_categories.map(cat => cat.name)
        const prevCategoryNames = prevCategoriesRef.current?.map(cat => cat.name) || []
        
        // Solo actualizar si las categorías son diferentes
        if (JSON.stringify(categoryNames) !== JSON.stringify(prevCategoryNames)) {
          setWpCategories(categoryNames)
          prevCategoriesRef.current = articleData.wordpress_categories
          console.log('📁 Categorías restauradas:', categoryNames)
        }
      }
      // Si no hay categorías, NO hacer nada (mantener las actuales)
      
      if (!isInitialized) {
        setIsInitialized(true)
      }
    }
  }, [articleData?.featured_image_url, articleData?.wordpress_categories, isInitialized])

  // Load categories on mount
  useEffect(() => {
    if (!categoriesLoaded && activeWebsiteUrl) {
      fetchCategories()
      setCategoriesLoaded(true)
    }
  }, [categoriesLoaded, activeWebsiteUrl])
  
  // Load initial images when needed
  useEffect(() => {
    if (!imagesLoaded && activeWebsiteUrl && cachedImages.length === 0) {
      fetchImages('')
      setImagesLoaded(true)
    }
  }, [imagesLoaded, activeWebsiteUrl, cachedImages.length])
  
  // Clear caches when website changes
  useEffect(() => {
    setCachedImages([])
    setAvailableImages([])
    setImageSearchCache(new Map())
    setImagesLoaded(false)
  }, [activeWebsiteUrl])

  // Fetch categories from WordPress API
  const fetchCategories = async () => {
    if (!activeWebsiteUrl) {
      console.error('No active website selected')
      return
    }

    setIsLoadingCategories(true)
    try {
      const categories = await wordpressAnalyticsService.getCategories(activeWebsiteUrl)
      
      // Filter by Spanish language
      const filteredCategories = categories.filter(cat => {
        const isSpanish = !cat.language || cat.language === 'es'
        return isSpanish
      })
      
      setAvailableCategories(filteredCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setAvailableCategories([])
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // Fetch images from WordPress Media Library with search support
  const fetchImages = async (searchTerm: string = '') => {
    if (!activeWebsiteUrl) {
      console.error('No active website selected')
      return
    }

    // If no search term, show cached images
    if (!searchTerm || searchTerm.trim() === '') {
      if (cachedImages.length > 0) {
        console.log('✅ Usando cache inicial de imágenes')
        setAvailableImages(cachedImages)
        return
      }
    } else {
      // Check if search is already cached
      const searchKey = searchTerm.trim().toLowerCase()
      if (imageSearchCache.has(searchKey)) {
        console.log('✅ Usando cache de búsqueda:', searchKey)
        setAvailableImages(imageSearchCache.get(searchKey) || [])
        return
      }
    }

    // Fetch from API
    setIsLoadingImages(true)
    try {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
      const response = await fetch(
        `${activeWebsiteUrl}/wp-json/wp/v2/media?per_page=50&media_type=image${searchParam}`
      )
      
      if (response.ok) {
        const images = await response.json()
        const formattedImages: MediaImage[] = images.map((img: any) => ({
          id: img.id,
          title: img.title.rendered,
          url: img.source_url,
          thumbnail: img.media_details?.sizes?.thumbnail?.source_url || img.source_url,
          alt: img.alt_text || img.title.rendered,
          date: img.date
        }))
        
        if (!searchTerm || searchTerm.trim() === '') {
          // Save as initial cache
          console.log('💾 Guardando cache inicial:', formattedImages.length, 'imágenes')
          setCachedImages(formattedImages)
          setAvailableImages(formattedImages)
        } else {
          // Save in search cache
          const searchKey = searchTerm.trim().toLowerCase()
          console.log('💾 Guardando búsqueda en cache:', searchKey, formattedImages.length, 'imágenes')
          setImageSearchCache(prev => new Map(prev).set(searchKey, formattedImages))
          setAvailableImages(formattedImages)
        }
      } else {
        setAvailableImages([])
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      setAvailableImages([])
    } finally {
      setIsLoadingImages(false)
    }
  }

  // 🔥 Wrapper para setWpFeaturedImageId con logging
  const setWpFeaturedImageIdWithLogging = (id: number | null) => {
    console.log('📸 [useWordPress] setWpFeaturedImageId llamado con:', id)
    setWpFeaturedImageId(id)
  }

  return {
    wpCategories,
    setWpCategories,
    wpTags,
    setWpTags,
    wpFeaturedImage,
    setWpFeaturedImage,
    wpFeaturedImageId,
    setWpFeaturedImageId: setWpFeaturedImageIdWithLogging,
    isPublishing,
    setIsPublishing,
    availableCategories,
    isLoadingCategories,
    fetchCategories,
    // Media library
    availableImages,
    isLoadingImages,
    fetchImages
  }
}
