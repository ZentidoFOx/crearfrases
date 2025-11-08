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
 * Convierte HTML a formato de bloques Gutenberg usando regex
 * Compatible con servidor (Node.js) y cliente (navegador)
 */
export function htmlToGutenbergBlocks(html: string): string {
  if (!html) return ''

  let gutenbergContent = ''
  let processedHtml = html.trim()
  
  // Procesar en orden: headings, images, lists, blockquotes, paragraphs
  
  // 1. Convertir encabezados H1-H6
  processedHtml = processedHtml.replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (match, level, content) => {
    const block = createHeadingBlock(content, parseInt(level))
    gutenbergContent += block
    return '___PROCESSED___'
  })
  
  // 2. Convertir imágenes (dentro de <figure> o solas)
  processedHtml = processedHtml.replace(/<figure[^>]*>.*?<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*(?:title=["']([^"']*)["'])?[^>]*>.*?(?:<figcaption[^>]*>(.*?)<\/figcaption>)?.*?<\/figure>/gi, 
    (match, src, alt, title, caption) => {
      const block = createImageBlock(src, alt || '', caption || title || '')
      gutenbergContent += block
      return '___PROCESSED___'
    })
  
  // 3. Imágenes sueltas
  processedHtml = processedHtml.replace(/<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*(?:title=["']([^"']*)["'])?[^>]*>/gi, 
    (match, src, alt, title) => {
      const block = createImageBlock(src, alt || '', title || '')
      gutenbergContent += block
      return '___PROCESSED___'
    })
  
  // 4. Convertir listas desordenadas
  processedHtml = processedHtml.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
    if (items.length > 0) {
      const listHtml = items.map((item: string) => {
        const itemContent = item.replace(/<\/?li[^>]*>/gi, '')
        return `<li>${itemContent}</li>`
      }).join('')
      
      const block = `<!-- wp:list -->
<ul>${listHtml}</ul>
<!-- /wp:list -->

`
      gutenbergContent += block
    }
    return '___PROCESSED___'
  })
  
  // 5. Convertir listas ordenadas
  processedHtml = processedHtml.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
    if (items.length > 0) {
      const listHtml = items.map((item: string) => {
        const itemContent = item.replace(/<\/?li[^>]*>/gi, '')
        return `<li>${itemContent}</li>`
      }).join('')
      
      const block = `<!-- wp:list {"ordered":true} -->
<ol>${listHtml}</ol>
<!-- /wp:list -->

`
      gutenbergContent += block
    }
    return '___PROCESSED___'
  })
  
  // 6. Convertir blockquotes
  processedHtml = processedHtml.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
    const block = createQuoteBlock(content)
    gutenbergContent += block
    return '___PROCESSED___'
  })
  
  // 7. Convertir párrafos
  processedHtml = processedHtml.replace(/<p[^>]*>(.*?)<\/p>/gis, (match, content) => {
    // Ignorar párrafos vacíos o ya procesados
    if (content.trim() && !content.includes('___PROCESSED___')) {
      const block = createParagraphBlock(content)
      gutenbergContent += block
    }
    return '___PROCESSED___'
  })
  
  // 8. Procesar texto suelto que no está en etiquetas
  const remainingText = processedHtml.replace(/___PROCESSED___/g, '').trim()
  if (remainingText && !remainingText.match(/^<[^>]+>$/)) {
    // Dividir por saltos de línea y crear párrafos
    const lines = remainingText.split('\n').filter(line => line.trim())
    lines.forEach(line => {
      const cleanLine = line.replace(/<[^>]+>/g, '').trim()
      if (cleanLine) {
        gutenbergContent += createParagraphBlock(cleanLine)
      }
    })
  }
  
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
