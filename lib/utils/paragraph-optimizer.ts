/**
 * OPTIMIZADOR DE PÁRRAFOS
 * 
 * Divide automáticamente párrafos largos en párrafos más cortos y legibles
 * para mejorar la experiencia de lectura.
 */

export interface ParagraphOptimizationResult {
  originalContent: string
  optimizedContent: string
  originalParagraphCount: number
  finalParagraphCount: number
  splitOperations: Array<{
    originalLength: number
    splitInto: number
    reason: string
  }>
  wasOptimized: boolean
}

/**
 * Divide párrafos largos en párrafos más cortos y legibles
 */
export function optimizeParagraphs(
  content: string,
  maxWordsPerParagraph: number = 80
): ParagraphOptimizationResult {
  
  console.log(`📝 [PARAGRAPH-OPTIMIZER] === OPTIMIZANDO PÁRRAFOS ===`)
  console.log(`📝 [PARAGRAPH-OPTIMIZER] Límite máximo: ${maxWordsPerParagraph} palabras por párrafo`)
  console.log(`📝 [PARAGRAPH-OPTIMIZER] Contenido: ${content.length} caracteres`)
  
  const originalContent = content
  let optimizedContent = content
  const splitOperations: Array<{
    originalLength: number
    splitInto: number
    reason: string
  }> = []
  
  // Dividir el contenido en párrafos
  const paragraphs = content.split(/\n\s*\n/)
  const originalParagraphCount = paragraphs.length
  
  console.log(`📝 [PARAGRAPH-OPTIMIZER] Párrafos originales: ${originalParagraphCount}`)
  
  const optimizedParagraphs: string[] = []
  
  paragraphs.forEach((paragraph, index) => {
    const trimmedParagraph = paragraph.trim()
    
    // Saltar párrafos vacíos
    if (!trimmedParagraph) {
      return
    }
    
    // Saltar títulos (empiezan con #)
    if (trimmedParagraph.startsWith('#')) {
      optimizedParagraphs.push(trimmedParagraph)
      return
    }
    
    // Saltar listas
    if (trimmedParagraph.startsWith('-') || trimmedParagraph.match(/^\d+\./)) {
      optimizedParagraphs.push(trimmedParagraph)
      return
    }
    
    // Contar palabras del párrafo
    const words = trimmedParagraph.split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length
    
    console.log(`📝 [PARAGRAPH-OPTIMIZER] Párrafo ${index + 1}: ${wordCount} palabras`)
    
    if (wordCount <= maxWordsPerParagraph) {
      // Párrafo dentro del límite
      optimizedParagraphs.push(trimmedParagraph)
    } else {
      // Párrafo muy largo - necesita división
      console.log(`📝 [PARAGRAPH-OPTIMIZER] Párrafo ${index + 1} excede límite: ${wordCount}/${maxWordsPerParagraph} palabras`)
      
      const splitParagraphs = splitLongParagraph(trimmedParagraph, maxWordsPerParagraph)
      
      splitOperations.push({
        originalLength: wordCount,
        splitInto: splitParagraphs.length,
        reason: `Párrafo de ${wordCount} palabras dividido en ${splitParagraphs.length} párrafos`
      })
      
      console.log(`📝 [PARAGRAPH-OPTIMIZER] Dividido en ${splitParagraphs.length} párrafos:`)
      splitParagraphs.forEach((splitP, i) => {
        const splitWords = splitP.split(/\s+/).length
        console.log(`📝 [PARAGRAPH-OPTIMIZER]   - Párrafo ${i + 1}: ${splitWords} palabras`)
      })
      
      optimizedParagraphs.push(...splitParagraphs)
    }
  })
  
  optimizedContent = optimizedParagraphs.join('\n\n')
  const finalParagraphCount = optimizedParagraphs.length
  const wasOptimized = splitOperations.length > 0
  
  console.log(`📝 [PARAGRAPH-OPTIMIZER] === RESULTADO ===`)
  console.log(`📝 [PARAGRAPH-OPTIMIZER] Párrafos originales: ${originalParagraphCount}`)
  console.log(`📝 [PARAGRAPH-OPTIMIZER] Párrafos finales: ${finalParagraphCount}`)
  console.log(`📝 [PARAGRAPH-OPTIMIZER] Operaciones de división: ${splitOperations.length}`)
  console.log(`📝 [PARAGRAPH-OPTIMIZER] Fue optimizado: ${wasOptimized}`)
  
  return {
    originalContent,
    optimizedContent,
    originalParagraphCount,
    finalParagraphCount,
    splitOperations,
    wasOptimized
  }
}

/**
 * Divide un párrafo largo en párrafos más cortos de forma inteligente
 */
function splitLongParagraph(paragraph: string, maxWords: number): string[] {
  const words = paragraph.split(/\s+/)
  const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  // Si hay pocas oraciones, dividir por palabras
  if (sentences.length <= 2) {
    return splitByWords(paragraph, maxWords)
  }
  
  // Dividir por oraciones de forma inteligente
  return splitBySentences(sentences, maxWords)
}

/**
 * Divide párrafo por oraciones, agrupándolas de forma inteligente
 */
function splitBySentences(sentences: string[], maxWords: number): string[] {
  const result: string[] = []
  let currentParagraph = ''
  let currentWordCount = 0
  
  sentences.forEach((sentence, index) => {
    const sentenceWords = sentence.trim().split(/\s+/).length
    
    // Si agregar esta oración excede el límite y ya tenemos contenido
    if (currentWordCount + sentenceWords > maxWords && currentParagraph.length > 0) {
      // Guardar el párrafo actual
      result.push(currentParagraph.trim() + '.')
      currentParagraph = sentence.trim()
      currentWordCount = sentenceWords
    } else {
      // Agregar la oración al párrafo actual
      if (currentParagraph.length > 0) {
        currentParagraph += '. ' + sentence.trim()
      } else {
        currentParagraph = sentence.trim()
      }
      currentWordCount += sentenceWords
    }
    
    // Si es la última oración, agregar el párrafo final
    if (index === sentences.length - 1 && currentParagraph.length > 0) {
      result.push(currentParagraph.trim() + '.')
    }
  })
  
  return result.filter(p => p.length > 0)
}

/**
 * Divide párrafo por número de palabras cuando no hay suficientes oraciones
 */
function splitByWords(paragraph: string, maxWords: number): string[] {
  const words = paragraph.split(/\s+/)
  const result: string[] = []
  
  for (let i = 0; i < words.length; i += maxWords) {
    const chunk = words.slice(i, i + maxWords).join(' ')
    if (chunk.trim().length > 0) {
      result.push(chunk.trim())
    }
  }
  
  return result
}

/**
 * Valida que los párrafos estén dentro del límite de palabras
 */
export function validateParagraphLength(
  content: string,
  maxWordsPerParagraph: number = 80
): {
  isValid: boolean
  longParagraphs: Array<{
    index: number
    wordCount: number
    preview: string
  }>
  totalParagraphs: number
} {
  const paragraphs = content.split(/\n\s*\n/)
  const longParagraphs: Array<{
    index: number
    wordCount: number
    preview: string
  }> = []
  
  paragraphs.forEach((paragraph, index) => {
    const trimmedParagraph = paragraph.trim()
    
    // Saltar párrafos vacíos, títulos y listas
    if (!trimmedParagraph || 
        trimmedParagraph.startsWith('#') || 
        trimmedParagraph.startsWith('-') || 
        trimmedParagraph.match(/^\d+\./)) {
      return
    }
    
    const wordCount = trimmedParagraph.split(/\s+/).filter(word => word.length > 0).length
    
    if (wordCount > maxWordsPerParagraph) {
      longParagraphs.push({
        index: index + 1,
        wordCount,
        preview: trimmedParagraph.substring(0, 100) + '...'
      })
    }
  })
  
  return {
    isValid: longParagraphs.length === 0,
    longParagraphs,
    totalParagraphs: paragraphs.filter(p => p.trim().length > 0).length
  }
}
