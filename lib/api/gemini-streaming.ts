/**
 * Gemini Streaming Service
 * Modern wrapper using multi-llm-ts with streaming support
 */

import { aiService, type StreamCallback } from './ai-service'

/**
 * Generate keyword suggestions with streaming
 */
export async function* generateKeywordSuggestionsStream(
  baseKeyword: string,
  existingKeywords: string[]
): AsyncGenerator<string, void, unknown> {
  const prompt = `Eres un experto en SEO y palabras clave en español. Basándote en la palabra clave: "${baseKeyword}"
      
Palabras clave existentes en el sitio:
${existingKeywords.length > 0 ? existingKeywords.map(k => `- ${k}`).join('\n') : '- Ninguna'}

Genera 15 sugerencias de palabras clave NUEVAS y DIFERENTES que NO estén en la lista anterior.

🚨 REQUISITO CRÍTICO YOAST SEO: 3-5 PALABRAS TOTALES POR FRASE CLAVE

IMPORTANTE: Las frases DEBEN ser NATURALES y GRAMATICALMENTE CORRECTAS en español.
Usa preposiciones y artículos cuando sean necesarios para que suene natural.

EJEMPLOS CORRECTOS (3-5 palabras totales, naturales):
✅ "tours de jaguares" → 3 palabras, natural ✓
✅ "safari en el pantanal" → 4 palabras, natural ✓
✅ "avistamiento de jaguares salvajes" → 4 palabras, natural ✓
✅ "mejor época para ver jaguares" → 5 palabras, natural ✓

REQUISITOS OBLIGATORIOS:
✓ EXACTAMENTE 3-5 palabras TOTALES (estándar Yoast SEO)
✓ Frases NATURALES en español con preposiciones/artículos necesarios
✓ Gramáticamente correctas y que suenen bien
✓ Relacionadas con "${baseKeyword}"
✓ Diferentes a las existentes

Genera ahora 15 palabras clave NATURALES (3-5 palabras totales).
Devuelve SOLO las 15 palabras clave, una por línea, sin numeración ni explicaciones adicionales.`

  const countTotalWords = (phrase: string): number => {
    return phrase.trim().split(/\s+/).length
  }

  try {
    for await (const suggestion of aiService.generateListStream(prompt, { temperature: 0.8 })) {
      const wordCount = countTotalWords(suggestion)
      if (suggestion.length > 0 && wordCount >= 3 && wordCount <= 5) {
        yield suggestion
      }
    }
  } catch (error) {
    console.error('Error generating keyword suggestions stream:', error)
  }
}

/**
 * Generate titles with streaming
 */
export async function* generateTitlesStream(
  keyword: string,
  count: number = 10
): AsyncGenerator<string, void, unknown> {
  const prompt = `Genera ${count} títulos creativos y atractivos para artículos de blog sobre "${keyword}". 
      
REQUISITOS OBLIGATORIOS PARA CADA TÍTULO:
✓ Incluir la palabra clave "${keyword}" en el título
✓ Longitud: entre 40 y 60 caracteres (CRÍTICO para SEO)
✓ Llamativos y que generen clicks
✓ Usar números cuando sea apropiado (ej: "5 formas de...")
✓ Usar palabras de poder: "guía", "completa", "paso a paso", "secretos", etc.
✓ En español
      
FORMATO: Devuelve solo los títulos, uno por línea, sin numeración ni formato adicional.
      
Genera ahora ${count} títulos siguiendo estos requisitos:`

  try {
    for await (const title of aiService.generateListStream(prompt, { temperature: 0.8 })) {
      if (title.length > 0) {
        yield title
      }
    }
  } catch (error) {
    console.error('Error generating titles stream:', error)
  }
}

/**
 * Generate content with streaming and progress callbacks
 */
export async function generateContentWithStreaming(
  title: string,
  keyword: string,
  numSections: number,
  detailLevel: 'basic' | 'medium' | 'advanced',
  callbacks?: StreamCallback & {
    onSectionStart?: (sectionTitle: string) => void
    onSectionComplete?: (sectionTitle: string, content: string) => void
  }
): Promise<{
  introduction: string
  sections: { heading: string; content: string }[]
  conclusion: string
}> {
  // Build prompt (reusing existing logic)
  const prompt = `TÍTULO DEL ARTÍCULO: "${title}"
PALABRA CLAVE: "${keyword}"

Genera un artículo completo con ${numSections} secciones.

ESTRUCTURA REQUERIDA:
- Introducción (2 párrafos)
- ${numSections} secciones con títulos descriptivos
- Conclusión

FORMATO:
Usa [SECTION:Título] para marcar cada sección.

REGLAS:
✓ Incluye "${keyword}" naturalmente
✓ Frases cortas (máx. 20 palabras)
✓ Párrafos breves (máx. 150 palabras)
✓ Contenido en español`

  try {
    let fullText = ''
    let currentSection = ''
    let sectionBuffer = ''

    await aiService.generateWithStreaming(prompt, {
      onChunk: (chunk, full) => {
        fullText = full
        
        // Detect section markers
        if (chunk.includes('[SECTION:')) {
          if (currentSection && sectionBuffer) {
            callbacks?.onSectionComplete?.(currentSection, sectionBuffer)
          }
          
          const match = chunk.match(/\[SECTION:\s*([^\]]+)\]/)
          if (match) {
            currentSection = match[1]
            sectionBuffer = ''
            callbacks?.onSectionStart?.(currentSection)
          }
        }
        
        sectionBuffer += chunk
        callbacks?.onChunk?.(chunk, fullText)
      },
      onComplete: (text) => {
        // Final section
        if (currentSection && sectionBuffer) {
          callbacks?.onSectionComplete?.(currentSection, sectionBuffer)
        }
        callbacks?.onComplete?.(text)
      },
      onError: callbacks?.onError
    }, {
      temperature: 0.7,
      maxTokens: 8192
    })

    // Parse final result
    return parseArticleContent(fullText, keyword)
    
  } catch (error) {
    console.error('Error generating content with streaming:', error)
    throw error
  }
}

/**
 * Helper function to parse article content
 */
function parseArticleContent(text: string, keyword: string): {
  introduction: string
  sections: { heading: string; content: string }[]
  conclusion: string
} {
  const sections: { heading: string; content: string }[] = []
  let introduction = ''
  let conclusion = ''

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[SECTION:[^\]]+\]/gi, '')
      .trim()
  }

  // Extract intro
  const firstSectionIndex = text.indexOf('[SECTION:')
  if (firstSectionIndex > 0) {
    introduction = cleanMarkdown(text.substring(0, firstSectionIndex))
  }

  // Extract sections
  const sectionMatches = text.matchAll(/\[SECTION:\s*([^\]]+)\](.*?)(?=\[SECTION:|$)/gs)
  for (const match of sectionMatches) {
    const heading = match[1].trim()
    const content = cleanMarkdown(match[2])
    
    if (!heading.toLowerCase().includes('conclusión')) {
      sections.push({ heading, content })
    } else {
      conclusion = content
    }
  }

  return { introduction, sections, conclusion }
}
