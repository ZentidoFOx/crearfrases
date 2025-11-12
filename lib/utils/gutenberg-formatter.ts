/**
 * Gutenberg Block Formatter
 * Convierte HTML a bloques de Gutenberg para WordPress
 */

interface GutenbergBlock {
  blockName: string
  attrs: Record<string, any>
  innerHTML: string
  innerContent: string[]
}

/**
 * 🆕 NUEVO SISTEMA: Convierte HTML a Gutenberg manteniendo el orden EXACTO del original
 * Procesa elemento por elemento en el orden que aparecen
 */
export function htmlToGutenbergBlocks(html: string): string {
  if (!html) return ''

  console.log('🔄 [GUTENBERG-V2] Iniciando conversión HTML -> Gutenberg (ORDEN PRESERVADO)')
  console.log('📏 [GUTENBERG-V2] Longitud del HTML:', html.length)

  let gutenbergContent = ''
  
  // 🔥 NUEVO: Usar un parser simple que procesa elemento por elemento EN ORDEN
  // Regex para capturar CUALQUIER tag HTML en el orden que aparece
  const htmlElementRegex = /<(h[1-6]|p|ul|ol|blockquote|figure|img)([^>]*)>([\s\S]*?)<\/\1>|<img([^>]*)>/gi
  
  let match
  const elements: Array<{type: string, content: string, attrs: string, index: number}> = []
  
  // Extraer todos los elementos HTML EN ORDEN
  while ((match = htmlElementRegex.exec(html)) !== null) {
    const tagName = match[1] || 'img' // img es self-closing
    const attrs = match[2] || match[4] || ''
    const innerContent = match[3] || ''
    
    elements.push({
      type: tagName.toLowerCase(),
      content: innerContent,
      attrs: attrs,
      index: match.index
    })
  }
  
  console.log(`📦 [GUTENBERG-V2] Elementos encontrados: ${elements.length}`)
  
  // Procesar cada elemento EN EL ORDEN ORIGINAL
  elements.forEach((element, idx) => {
    console.log(`  ${idx + 1}. <${element.type}> - ${element.content.substring(0, 50)}...`)
    
    switch (element.type) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        const level = parseInt(element.type.charAt(1))
        gutenbergContent += createHeadingBlock(element.content, level)
        break
        
      case 'p':
        if (element.content.trim()) {
          gutenbergContent += createParagraphBlock(element.content)
        }
        break
        
      case 'ul':
        const ulItems = element.content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
        if (ulItems.length > 0) {
          const listHtml = ulItems.map((item: string) => {
            const itemContent = item.replace(/<\/?li[^>]*>/gi, '')
            return `<li>${itemContent}</li>`
          }).join('')
          gutenbergContent += `<!-- wp:list -->\n<ul>${listHtml}</ul>\n<!-- /wp:list -->\n\n`
        }
        break
        
      case 'ol':
        const olItems = element.content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
        if (olItems.length > 0) {
          const listHtml = olItems.map((item: string) => {
            const itemContent = item.replace(/<\/?li[^>]*>/gi, '')
            return `<li>${itemContent}</li>`
          }).join('')
          gutenbergContent += `<!-- wp:list {"ordered":true} -->\n<ol>${listHtml}</ol>\n<!-- /wp:list -->\n\n`
        }
        break
        
      case 'blockquote':
        gutenbergContent += createQuoteBlock(element.content)
        break
        
      case 'figure':
      case 'img':
        // Extraer src, alt del atributo
        const srcMatch = element.attrs.match(/src=["']([^"']+)["']/)
        const altMatch = element.attrs.match(/alt=["']([^"']+)["']/)
        if (srcMatch) {
          gutenbergContent += createImageBlock(srcMatch[1], altMatch?.[1] || '')
        }
        break
    }
  })
  
  console.log(`✅ [GUTENBERG-V2] Conversión completa. Bloques generados: ${elements.length}`)
  console.log(`📦 [GUTENBERG-V2] Longitud salida: ${gutenbergContent.length} chars`)
  
  return gutenbergContent || createParagraphBlock('Contenido sin formato')
}

/**
 * Crea un bloque de párrafo
 */
function createParagraphBlock(content: string): string {
  if (!content.trim()) return ''
  
  return `<!-- wp:paragraph -->
<p>${content}</p>
<!-- /wp:paragraph -->

`
}

/**
 * Crea un bloque de encabezado
 */
function createHeadingBlock(content: string, level: number): string {
  if (!content.trim()) return ''
  
  return `<!-- wp:heading {"level":${level}} -->
<h${level}>${content}</h${level}>
<!-- /wp:heading -->

`
}

/**
 * Crea un bloque de imagen con soporte completo de Gutenberg
 */
function createImageBlock(src: string, alt: string = '', caption: string = ''): string {
  if (!src) return ''
  
  // Determinar si es una imagen local de WordPress o externa
  const isWordPressImage = src.includes('/wp-content/uploads/')
  
  // Construir el bloque de imagen
  const attrs: any = {
    sizeSlug: "large",
    linkDestination: "none"
  }
  
  const attrsJson = JSON.stringify(attrs)
  
  let imageBlock = `<!-- wp:image ${attrsJson} -->
<figure class="wp-block-image size-large">`
  
  if (caption) {
    imageBlock += `<img src="${src}" alt="${alt || ''}" title="${caption}"/><figcaption class="wp-element-caption">${caption}</figcaption>`
  } else {
    imageBlock += `<img src="${src}" alt="${alt || ''}"/>`
  }
  
  imageBlock += `</figure>
<!-- /wp:image -->

`
  
  return imageBlock
}

/**
 * Crea un bloque de lista (ordenada o no ordenada)
 */
function createListBlock(element: HTMLElement, type: 'ul' | 'ol'): string {
  const items = element.querySelectorAll('li')
  if (items.length === 0) return ''
  
  const ordered = type === 'ol'
  const listHtml = Array.from(items)
    .map(li => `<li>${li.innerHTML}</li>`)
    .join('')
  
  return `<!-- wp:list ${ordered ? '{"ordered":true}' : ''} -->
<${type}>${listHtml}</${type}>
<!-- /wp:list -->

`
}

/**
 * Crea un bloque de cita
 */
function createQuoteBlock(content: string): string {
  if (!content.trim()) return ''
  
  return `<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>${content}</p></blockquote>
<!-- /wp:quote -->

`
}

/**
 * Crea un bloque de código
 */
function createCodeBlock(content: string): string {
  if (!content.trim()) return ''
  
  return `<!-- wp:code -->
<pre class="wp-block-code"><code>${escapeHtml(content)}</code></pre>
<!-- /wp:code -->

`
}

/**
 * Escapa caracteres HTML
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Convierte Markdown directamente a bloques de Gutenberg
 * (alternativa si se tiene Markdown en lugar de HTML)
 */
export function markdownToGutenbergBlocks(markdown: string): string {
  if (!markdown) return ''
  
  const lines = markdown.split('\n')
  let gutenbergContent = ''
  let inList = false
  let listItems: string[] = []
  let listType: 'ul' | 'ol' = 'ul'
  
  const flushList = () => {
    if (listItems.length > 0) {
      const listHtml = listItems.map(item => `<li>${item}</li>`).join('')
      gutenbergContent += `<!-- wp:list ${listType === 'ol' ? '{"ordered":true}' : ''} -->
<${listType}>${listHtml}</${listType}>
<!-- /wp:list -->

`
      listItems = []
      inList = false
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) {
      flushList()
      continue
    }
    
    // Encabezados
    if (line.startsWith('# ')) {
      flushList()
      gutenbergContent += createHeadingBlock(line.substring(2), 1)
    } else if (line.startsWith('## ')) {
      flushList()
      gutenbergContent += createHeadingBlock(line.substring(3), 2)
    } else if (line.startsWith('### ')) {
      flushList()
      gutenbergContent += createHeadingBlock(line.substring(4), 3)
    } else if (line.startsWith('#### ')) {
      flushList()
      gutenbergContent += createHeadingBlock(line.substring(5), 4)
    }
    // Listas desordenadas
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        flushList()
        inList = true
        listType = 'ul'
      }
      listItems.push(line.substring(2))
    }
    // Listas ordenadas
    else if (/^\d+\.\s/.test(line)) {
      if (!inList || listType !== 'ol') {
        flushList()
        inList = true
        listType = 'ol'
      }
      listItems.push(line.replace(/^\d+\.\s/, ''))
    }
    // Imágenes ![alt](url)
    else if (line.startsWith('![')) {
      flushList()
      const match = line.match(/!\[(.*?)\]\((.*?)\)/)
      if (match) {
        gutenbergContent += createImageBlock(match[2], match[1])
      }
    }
    // Párrafos
    else {
      flushList()
      // Procesar formato inline (negrita, cursiva, enlaces)
      let processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      
      gutenbergContent += createParagraphBlock(processedLine)
    }
  }
  
  flushList()
  
  return gutenbergContent
}
