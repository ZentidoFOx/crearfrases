import { useState, useEffect } from 'react'
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
      
      // Restaurar imagen destacada
      if (articleData.featured_image_url) {
        setWpFeaturedImage(articleData.featured_image_url)
        console.log('📸 Imagen destacada restaurada:', articleData.featured_image_url)
      } else {
        // Limpiar si no hay imagen
        setWpFeaturedImage('')
        setWpFeaturedImageId(null)
      }
      
      // Restaurar categorías
      if (articleData.wordpress_categories && Array.isArray(articleData.wordpress_categories)) {
        const categoryNames = articleData.wordpress_categories.map(cat => cat.name)
        setWpCategories(categoryNames)
        console.log('📁 Categorías restauradas:', categoryNames)
      } else {
        // Limpiar si no hay categorías
        setWpCategories([])
      }
      
      if (!isInitialized) {
        setIsInitialized(true)
      }
    }
  }, [articleData])

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

  return {
    wpCategories,
    setWpCategories,
    wpTags,
    setWpTags,
    wpFeaturedImage,
    setWpFeaturedImage,
    wpFeaturedImageId,
    setWpFeaturedImageId,
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
