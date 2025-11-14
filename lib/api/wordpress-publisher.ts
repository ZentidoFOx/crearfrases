/**
 * WordPress Publisher Service
 * Publica contenido directamente en WordPress usando REST API + Application Password
 */

import { htmlToGutenbergBlocks, markdownToGutenbergBlocks } from '@/lib/utils/gutenberg-formatter'

interface WordPressPublishData {
  title: string
  h1Title: string
  content: string
  metaDescription?: string
  focusKeyword: string
  categories: string[]
  tags: string[]
  featuredImageUrl?: string
  featuredImageId?: number
  language?: string // Código de idioma para Polylang/WPML (e.g., 'es', 'en', 'fr')
  translations?: { [langCode: string]: number } // IDs de traducciones para Polylang (e.g., { 'es': 123, 'en': 124 })
  status?: 'publish' | 'draft' // Estado de publicación (por defecto 'publish')
}

interface PublishProgressCallback {
  (step: string, progress: number, message: string): void
}

interface WordPressCredentials {
  siteUrl: string
  username: string
  applicationPassword: string
}

interface PublishResponse {
  success: boolean
  postId?: number
  postUrl?: string
  error?: string
}

/**
 * Convierte Markdown a HTML básico para WordPress
 */
function markdownToHTML(markdown: string): string {
  let html = markdown
    // Headings
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    // Wrap lists
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Paragraphs (double newline)
    .split('\n\n')
    .map(para => {
      para = para.trim()
      if (!para.startsWith('<h') && !para.startsWith('<ul') && !para.startsWith('<li')) {
        return `<p>${para}</p>`
      }
      return para
    })
    .join('\n')
  
  return html
}

/**
 * Sube una imagen a WordPress y retorna su ID
 */
async function uploadImageToWordPress(
  imageUrl: string,
  siteUrl: string,
  credentials: WordPressCredentials
): Promise<number | null> {
  try {
    console.log('📤 [UPLOAD] Intentando subir imagen:', imageUrl)
    
    // Descargar la imagen
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error('❌ [UPLOAD] Error descargando imagen:', imageResponse.status)
      return null
    }
    
    const imageBlob = await imageResponse.blob()
    const fileName = imageUrl.split('/').pop() || 'image.jpg'
    
    console.log('📦 [UPLOAD] Imagen descargada:', fileName, 'Size:', imageBlob.size)
    
    // Crear FormData para subir la imagen
    const formData = new FormData()
    formData.append('file', imageBlob, fileName)
    
    // Subir a WordPress
    const uploadResponse = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.applicationPassword}`)}`
      },
      body: formData
    })
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      console.error('❌ [UPLOAD] Error subiendo a WordPress:', error)
      return null
    }
    
    const uploadedMedia = await uploadResponse.json()
    console.log('✅ [UPLOAD] Imagen subida exitosamente - ID:', uploadedMedia.id)
    return uploadedMedia.id
  } catch (error) {
    console.error('❌ [UPLOAD] Error en uploadImageToWordPress:', error)
    return null
  }
}

/**
 * Obtiene el ID de categorías por nombre
 */
async function getCategoryIds(
  siteUrl: string,
  categoryNames: string[],
  credentials: WordPressCredentials
): Promise<number[]> {
  const categoryIds: number[] = []
  
  for (const categoryName of categoryNames) {
    try {
      const response = await fetch(
        `${siteUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryName)}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.applicationPassword}`)}`
          }
        }
      )
      
      if (response.ok) {
        const categories = await response.json()
        if (categories.length > 0) {
          categoryIds.push(categories[0].id)
        }
      }
    } catch (error) {
      console.error(`Error buscando categoría ${categoryName}:`, error)
    }
  }
  
  return categoryIds
}

/**
 * Obtiene o crea IDs de tags por nombre
 */
async function getOrCreateTagIds(
  siteUrl: string,
  tagNames: string[],
  credentials: WordPressCredentials
): Promise<number[]> {
  const tagIds: number[] = []
  
  for (const tagName of tagNames) {
    try {
      // Primero buscar si existe
      const searchResponse = await fetch(
        `${siteUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.applicationPassword}`)}`
          }
        }
      )
      
      if (searchResponse.ok) {
        const tags = await searchResponse.json()
        if (tags.length > 0) {
          tagIds.push(tags[0].id)
          continue
        }
      }
      
      // Si no existe, crear
      const createResponse = await fetch(
        `${siteUrl}/wp-json/wp/v2/tags`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.applicationPassword}`)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: tagName })
        }
      )
      
      if (createResponse.ok) {
        const newTag = await createResponse.json()
        tagIds.push(newTag.id)
      }
    } catch (error) {
      console.error(`Error con tag ${tagName}:`, error)
    }
  }
  
  return tagIds
}

/**
 * Publica un post en WordPress con progreso paso a paso
 */
export async function publishToWordPress(
  data: WordPressPublishData,
  credentials: WordPressCredentials,
  onProgress?: PublishProgressCallback
): Promise<PublishResponse> {
  try {
    const { siteUrl, username, applicationPassword } = credentials
    
    // 📊 PASO 1: Convertir a bloques Gutenberg (0-20%)
    onProgress?.('converting', 5, 'Preparando contenido...')
    console.log('🔄 Convirtiendo contenido a bloques de Gutenberg...')
    
    // 🎨 CONVERTIR A BLOQUES DE GUTENBERG
    let gutenbergContent = ''
    
    if (data.content.includes('<')) {
      // Es HTML - Convertir directamente a bloques Gutenberg
      onProgress?.('converting', 10, 'Convirtiendo HTML a Gutenberg...')
      console.log('📄 Detectado contenido HTML, convirtiendo a Gutenberg...')
      gutenbergContent = htmlToGutenbergBlocks(data.content)
    } else {
      // Es Markdown - Convertir a bloques Gutenberg
      onProgress?.('converting', 10, 'Convirtiendo Markdown a Gutenberg...')
      console.log('📝 Detectado contenido Markdown, convirtiendo a Gutenberg...')
      gutenbergContent = markdownToGutenbergBlocks(data.content)
    }
    
    onProgress?.('converting', 20, 'Contenido convertido a bloques Gutenberg')
    console.log('✅ Contenido convertido a bloques Gutenberg')
    console.log('📦 Bloques generados:', gutenbergContent.substring(0, 500) + '...')
    
    // 📊 PASO 2: Procesar categorías (20-40%)
    onProgress?.('categories', 25, 'Procesando categorías...')
    const categoryIds = await getCategoryIds(siteUrl, data.categories, credentials)
    onProgress?.('categories', 40, `${categoryIds.length} categorías procesadas`)
    
    // 📊 PASO 3: Procesar etiquetas (40-60%)
    onProgress?.('tags', 45, 'Procesando etiquetas...')
    const tagIds = await getOrCreateTagIds(siteUrl, data.tags, credentials)
    onProgress?.('tags', 60, `${tagIds.length} etiquetas procesadas`)
    
    // Configurar idioma (por defecto español si no se especifica)
    const language = data.language || 'es'
    const localeMap: { [key: string]: string } = {
      'es': 'es_ES',
      'en': 'en_US',
      'fr': 'fr_FR',
      'de': 'de_DE',
      'it': 'it_IT',
      'pt': 'pt_PT',
      'nl': 'nl_NL'
    }
    const locale = localeMap[language] || 'es_ES'
    
    // Preparar el post data con contenido en bloques Gutenberg
    const postData: any = {
      title: data.h1Title || data.title,
      content: gutenbergContent, // 🎨 Contenido en formato Gutenberg
      status: data.status || 'publish', // 'draft' para borrador, 'publish' para publicar
      categories: categoryIds,
      tags: tagIds,
      // Configurar idioma para plugins multiidioma
      lang: language, // Para Polylang
      wpml_language: language, // Para WPML
      locale: locale // WordPress estándar
    }
    
    // Si hay traducciones existentes, agregar las relaciones (Polylang)
    if (data.translations && Object.keys(data.translations).length > 0) {
      console.log('🔗 Relacionando con traducciones existentes:', data.translations)
      // Polylang usa diferentes formatos según la versión
      postData.translations = data.translations
      postData.meta = {
        ...postData.meta,
        _translations: data.translations
      }
    }
    
    // 📊 PASO 4: Procesar imagen destacada (60-75%)
    if (data.featuredImageUrl) {
      onProgress?.('image', 62, 'Procesando imagen destacada...')
      
      // 🔥 Si tenemos ID, usarlo como featured_media
      if (data.featuredImageId) {
        postData.featured_media = data.featuredImageId
        console.log('🖼️ Imagen destacada configurada con ID:', data.featuredImageId)
      }
      
      // Guardar la URL en meta data para referencia
      postData.meta = {
        ...postData.meta,
        _featured_image_url: data.featuredImageUrl
      }
      
      console.log('🖼️ Imagen destacada (URL):', data.featuredImageUrl)
    }
    
    console.log(`🌍 Idioma configurado: ${language} (${locale})`);
    
    // 📊 PASO 5: Publicando en WordPress (75-85%)
    onProgress?.('publishing', 75, `Publicando en WordPress (${language})...`)
    
    // Crear el post
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${applicationPassword}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      const errorMsg = errorData.message || `Error HTTP: ${response.status}`
      console.error('❌ Error de WordPress API:', {
        status: response.status,
        error: errorData,
        username: credentials.username,
        siteUrl: credentials.siteUrl
      })
      throw new Error(`${errorMsg}\n\nUsuario: ${credentials.username}\nURL: ${credentials.siteUrl}`)
    }
    
    const post = await response.json()
    
    onProgress?.('publishing', 85, 'Post creado exitosamente')
    console.log('✅ Post creado exitosamente:', {
      id: post.id,
      title: post.title.rendered,
      link: post.link
    })
    
    // 📊 PASO 6: Actualizar SEO (85-100%)
    if (post.id) {
      onProgress?.('seo', 90, 'Actualizando meta datos de Yoast SEO...')
      console.log('📝 Actualizando meta datos de Yoast SEO...')
      await updateYoastMeta(siteUrl, post.id, {
        title: data.title,
        description: data.metaDescription,
        focusKeyword: data.focusKeyword
      }, credentials)
      onProgress?.('seo', 95, 'Meta datos SEO actualizados')
    }
    
    onProgress?.('completed', 100, '¡Publicación completada!')
    
    return {
      success: true,
      postId: post.id,
      postUrl: post.link
    }
    
  } catch (error: any) {
    console.error('Error publicando en WordPress:', error)
    return {
      success: false,
      error: error.message || 'Error desconocido al publicar'
    }
  }
}

/**
 * Actualiza los meta datos de Yoast SEO
 * Compatible con Content Search API plugin v2.1.0+
 */
async function updateYoastMeta(
  siteUrl: string,
  postId: number,
  meta: {
    title?: string
    description?: string
    focusKeyword?: string
  },
  credentials: WordPressCredentials
): Promise<void> {
  try {
    // Usar los campos registrados por Content Search API plugin
    const updateData: any = {}
    
    if (meta.title) {
      updateData._yoast_wpseo_title = meta.title
    }
    if (meta.description) {
      updateData._yoast_wpseo_metadesc = meta.description
    }
    if (meta.focusKeyword) {
      updateData._yoast_wpseo_focuskw = meta.focusKeyword
    }
    
    console.log('🎯 Actualizando Yoast SEO (Content Search API v2.1.0):', {
      postId,
      title: meta.title,
      description: meta.description,
      focusKeyword: meta.focusKeyword
    })
    
    // Actualizar usando el endpoint estándar de WordPress
    // Los campos están registrados vía register_rest_field()
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.applicationPassword}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Yoast SEO actualizado correctamente')
      console.log('📊 Campos guardados:', {
        title: result._yoast_wpseo_title,
        description: result._yoast_wpseo_metadesc,
        focusKeyword: result._yoast_wpseo_focuskw
      })
    } else {
      const error = await response.json()
      console.error('❌ Error actualizando Yoast meta:', error)
      console.error('💡 Asegúrate de que el plugin Content Search API v2.1.0+ esté instalado en WordPress')
    }
  } catch (error) {
    console.error('❌ Error en updateYoastMeta:', error)
  }
}

/**
 * Verifica las credenciales de WordPress
 */
export async function verifyWordPressCredentials(
  credentials: WordPressCredentials
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`${credentials.siteUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.applicationPassword}`)}`
      }
    })
    
    if (response.ok) {
      return { valid: true }
    } else {
      const error = await response.json()
      return { valid: false, error: error.message || 'Credenciales inválidas' }
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Error de conexión' }
  }
}
