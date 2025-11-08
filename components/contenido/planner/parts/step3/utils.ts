import { DetailLevel, DetailLevelConfig } from './types'

/**
 * Convert Markdown to HTML
 */
export const markdownToHtml = (markdown: string): string => {
  if (!markdown) return ''
  
  return markdown
    // 🔥 Convert images FIRST (before links, because images also use [](syntax))
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5em auto; display: block;" />')
    // Convert headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Convert bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Convert links (after images)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Convert lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Convert paragraphs (wrap text that's not already in tags)
    .split('\n\n')
    .map(block => {
      // 🔥 Procesar líneas individuales dentro del bloque
      const lines = block.split('\n')
      const processedLines = lines.map(line => {
        const trimmedLine = line.trim()
        // Si la línea ya es un tag HTML, dejarla tal cual
        if (trimmedLine && trimmedLine.match(/^<[a-z]/i)) {
          return trimmedLine
        }
        // Si la línea tiene contenido, envolverla en <p>
        if (trimmedLine) {
          return `<p>${trimmedLine}</p>`
        }
        return ''
      }).filter(line => line.length > 0)
      
      return processedLines.join('\n')
    })
    .filter(block => block.trim().length > 0)
    .join('\n\n') // 🔥 MANTENER SEPARACIÓN DE PÁRRAFOS
}

/**
 * Convert HTML to Markdown preserving paragraph structure
 */
export const htmlToMarkdown = (html: string): string => {
  if (!html) return ''
  
  // 🔥 PRESERVAR IMÁGENES: Primero reemplazar <img> por un placeholder temporal
  const imageMap = new Map<string, string>()
  let imageCounter = 0
  
  let processedHtml = html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, (match, src, alt) => {
    const placeholder = `__IMAGE_PLACEHOLDER_${imageCounter}__`
    imageMap.set(placeholder, `![${alt || 'image'}](${src})`)
    imageCounter++
    return placeholder
  })
  
  // También capturar imágenes sin alt
  processedHtml = processedHtml.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    const placeholder = `__IMAGE_PLACEHOLDER_${imageCounter}__`
    imageMap.set(placeholder, `![image](${src})`)
    imageCounter++
    return placeholder
  })
  
  let result = processedHtml
    // Convert headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    // Convert paragraphs (preserve with double newline)
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Convert lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '')
    .replace(/<\/ol>/gi, '\n')
    // Convert blockquotes
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
    // Convert bold/italic
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
    // Convert links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Remove line breaks (we already have paragraph separation)
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Clean up extra whitespace but preserve paragraph breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  // 🔥 RESTAURAR IMÁGENES: Reemplazar placeholders por markdown de imágenes
  imageMap.forEach((markdownImage, placeholder) => {
    result = result.replace(placeholder, `\n\n${markdownImage}\n\n`)
  })
  
  return result
}

/**
 * Generate Markdown from content object
 */
export const generateMarkdown = (content: any): string => {
  if (!content) return ''
  
  // Helper to ensure proper paragraph spacing
  const formatContent = (text: string): string => {
    // First try to split by existing newlines
    let paragraphs = text.trim().split(/\n\n+/)
    
    // If we only got 1 paragraph (text has no double newlines)
    // then split by single newlines
    if (paragraphs.length === 1) {
      paragraphs = text.trim().split(/\n+/)
    }
    
    // If STILL only 1 paragraph (no newlines at all)
    // then split by sentence groups (every 3-4 sentences = 1 paragraph)
    if (paragraphs.length === 1 && text.length > 300) {
      const sentences = text.split(/\.\s+/)
      paragraphs = []
      let currentParagraph: string[] = []
      
      sentences.forEach((sentence, idx) => {
        currentParagraph.push(sentence.trim())
        
        // Create paragraph every 3 sentences or at the end
        if (currentParagraph.length >= 3 || idx === sentences.length - 1) {
          const para = currentParagraph.join('. ').trim()
          if (para.length > 0) {
            paragraphs.push(para + (para.endsWith('.') ? '' : '.'))
          }
          currentParagraph = []
        }
      })
    }
    
    // Clean and join
    return paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .join('\n\n')
  }
  
  // Build markdown without forcing "Introducción" and "Conclusión" titles
  const parts = []
  
  // Add introduction paragraphs (no title)
  if (content.introduction && content.introduction.trim()) {
    parts.push(formatContent(content.introduction))
  }
  
  // Add all sections with their titles (preserving heading level)
  if (content.sections && content.sections.length > 0) {
    content.sections.forEach((section: any) => {
      const sectionContent = formatContent(section.content)
      // Use headingLevel if provided, default to H2
      const headingLevel = section.headingLevel || 2
      const headingPrefix = '#'.repeat(headingLevel) // ## for H2, ### for H3, #### for H4
      parts.push(`${headingPrefix} ${section.heading}\n\n${sectionContent}`)
    })
  }
  
  // Add conclusion paragraphs (no title)
  if (content.conclusion && content.conclusion.trim()) {
    parts.push(formatContent(content.conclusion))
  }
  
  const markdown = parts.join('\n\n')
  
  // DEBUG: Log generated markdown
  console.log('📝 DEBUG - Generated Markdown:')
  console.log('Total length:', markdown.length)
  console.log('Parts joined:', parts.length)
  console.log('Paragraphs detected (\\n\\n split):', markdown.split(/\n\n+/).filter(p => p.trim().length > 0).length)
  console.log('First 500 chars:', markdown.substring(0, 500))
  console.log('Has double newlines:', markdown.includes('\n\n'))
  console.log('Sample introduction length:', content.introduction?.length || 0)
  console.log('Sample section 0 length:', content.sections?.[0]?.content?.length || 0)
  console.log('---')
  
  return markdown
}

/**
 * Get detail level configuration
 */
export const getDetailLevelConfig = (detailLevel: DetailLevel): DetailLevelConfig => {
  switch (detailLevel) {
    case 'basic':
      return {
        name: 'Básico (Solo H2)',
        description: 'Estructura simple con encabezados H2',
        structure: 'Solo H2',
        wordsPerSection: 150
      }
    case 'medium':
      return {
        name: 'Medio (H2 + H3)',
        description: 'Estructura intermedia con H2 y H3',
        structure: 'H2 + H3',
        wordsPerSection: 250
      }
    case 'advanced':
      return {
        name: 'Avanzado (H2 + H3 + H4)',
        description: 'Estructura detallada con H2, H3 y H4',
        structure: 'H2 + H3 + H4',
        wordsPerSection: 350
      }
  }
}
