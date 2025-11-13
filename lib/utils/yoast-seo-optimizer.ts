/**
 * Optimizador específico para Yoast SEO
 * Resuelve problemas comunes de Yoast como palabras de transición y longitud de oraciones
 */

// Lista completa de palabras de transición en español para Yoast SEO
export const TRANSITION_WORDS = [
  // Adición
  'además', 'también', 'asimismo', 'igualmente', 'del mismo modo', 'por otra parte',
  'por otro lado', 'sumado a esto', 'adicionalmente', 'encima de todo',
  
  // Contraste
  'sin embargo', 'no obstante', 'por el contrario', 'en cambio', 'mientras que',
  'aunque', 'a pesar de', 'aun así', 'pero', 'mas',
  
  // Causa y efecto
  'por lo tanto', 'en consecuencia', 'como resultado', 'debido a', 'por esta razón',
  'así que', 'por eso', 'de ahí que', 'por consiguiente', 'entonces',
  
  // Tiempo
  'primero', 'segundo', 'luego', 'después', 'finalmente', 'antes', 'durante',
  'mientras tanto', 'posteriormente', 'más tarde', 'al principio', 'al final',
  
  // Ejemplos
  'por ejemplo', 'como', 'tal como', 'específicamente', 'en particular',
  'es decir', 'o sea', 'esto es', 'a saber', 'como muestra',
  
  // Énfasis
  'especialmente', 'sobre todo', 'principalmente', 'en especial', 'particularmente',
  'notablemente', 'ciertamente', 'efectivamente', 'realmente', 'verdaderamente',
  
  // Conclusión
  'en resumen', 'en conclusión', 'para concluir', 'en definitiva', 'en suma',
  'para resumir', 'dicho de otro modo', 'en otras palabras', 'brevemente'
]

// Palabras clave que se pueden poner en negrita SI YA EXISTEN en el contenido
export const KEYWORDS_TO_BOLD = [
  'mejor', 'útil', 'práctico', 'fácil', 'simple', 'rápido'
]

/**
 * Detecta si el contenido es una FAQ manual que no debe ser modificada
 */
function isManualFAQContent(content: string): boolean {
  // Detectar patrones típicos de FAQs manuales
  const faqPatterns = [
    /^##?\s+.*[Pp]reguntas?\s+[Ff]recuentes?/m, // Títulos de FAQ
    /^##?\s+.*FAQ/m, // Títulos con FAQ
    /^\s*[-*]\s*¿.*\?/m, // Lista de preguntas con viñetas
    /^\s*\d+\.\s*¿.*\?/m, // Lista de preguntas numeradas
  ]
  
  return faqPatterns.some(pattern => pattern.test(content))
}

/**
 * Optimiza el contenido para cumplir con los criterios de Yoast SEO
 * EXCLUYE las FAQs manuales de las optimizaciones automáticas
 */
export function optimizeForYoastSEO(content: string, keyword: string): string {
  // Si es una FAQ manual, NO aplicar optimizaciones automáticas
  if (isManualFAQContent(content)) {
    console.log('🔒 [YOAST-OPTIMIZER] FAQ manual detectada - SALTANDO optimizaciones automáticas')
    return content // Retornar sin modificaciones
  }

  let optimizedContent = content

  // 1. Agregar palabras de transición si faltan
  optimizedContent = addTransitionWords(optimizedContent)
  
  // 2. Acortar oraciones largas
  optimizedContent = shortenLongSentences(optimizedContent)
  
  // 3. Agregar negritas a palabras clave importantes
  optimizedContent = addBoldToKeywords(optimizedContent, keyword)
  
  return optimizedContent
}

/**
 * Agrega palabras de transición al contenido si no las tiene
 * EXCLUYE las FAQs manuales
 */
export function addTransitionWords(content: string): string {
  // Si es una FAQ manual, NO agregar palabras de transición
  if (isManualFAQContent(content)) {
    console.log('🔒 [TRANSITION-WORDS] FAQ manual detectada - NO agregando palabras de transición')
    return content
  }

  const paragraphs = content.split('\n\n')
  const optimizedParagraphs: string[] = []
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim()
    
    if (!paragraph || paragraph.startsWith('#') || paragraph.startsWith('-') || paragraph.startsWith('1.')) {
      optimizedParagraphs.push(paragraph)
      continue
    }
    
    // Verificar si el párrafo ya tiene palabras de transición
    const hasTransitionWord = TRANSITION_WORDS.some(word => 
      paragraph.toLowerCase().includes(word.toLowerCase())
    )
    
    if (!hasTransitionWord && i > 0) {
      // Agregar palabra de transición apropiada según el contexto
      const transitionWord = selectTransitionWord(i, paragraphs.length)
      const sentences = paragraph.split('. ')
      
      if (sentences.length > 0) {
        // Agregar la palabra de transición al inicio de la primera oración
        sentences[0] = `${transitionWord}, ${sentences[0].toLowerCase()}`
        optimizedParagraphs.push(sentences.join('. '))
      } else {
        optimizedParagraphs.push(paragraph)
      }
    } else {
      optimizedParagraphs.push(paragraph)
    }
  }
  
  return optimizedParagraphs.join('\n\n')
}

/**
 * Selecciona una palabra de transición apropiada según el contexto
 */
function selectTransitionWord(paragraphIndex: number, totalParagraphs: number): string {
  // Palabras de transición más naturales y menos robóticas
  const naturalTransitions = [
    'También', 'Además', 'Por otra parte', 'Asimismo', 'Del mismo modo',
    'Por ejemplo', 'En este caso', 'De hecho', 'Igualmente', 'Por eso'
  ]
  
  // Usar diferentes palabras según la posición
  if (paragraphIndex === 1) {
    return naturalTransitions[0] // "También"
  } else if (paragraphIndex < totalParagraphs / 2) {
    return naturalTransitions[paragraphIndex % 5]
  } else {
    return naturalTransitions[5 + (paragraphIndex % 5)]
  }
}

/**
 * Acorta oraciones que excedan 20 palabras
 * EXCLUYE las FAQs manuales
 */
export function shortenLongSentences(content: string): string {
  // Si es una FAQ manual, NO acortar oraciones
  if (isManualFAQContent(content)) {
    console.log('🔒 [SHORTEN-SENTENCES] FAQ manual detectada - NO acortando oraciones')
    return content
  }

  const paragraphs = content.split('\n\n')
  const optimizedParagraphs: string[] = []
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim() || paragraph.startsWith('#') || paragraph.startsWith('-') || paragraph.startsWith('1.')) {
      optimizedParagraphs.push(paragraph)
      continue
    }
    
    const sentences = paragraph.split('. ')
    const optimizedSentences: string[] = []
    
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/)
      
      if (words.length > 20) {
        // Dividir oración larga en oraciones más cortas
        const shortenedSentences = splitLongSentence(sentence)
        optimizedSentences.push(...shortenedSentences)
      } else {
        optimizedSentences.push(sentence)
      }
    }
    
    optimizedParagraphs.push(optimizedSentences.join('. '))
  }
  
  return optimizedParagraphs.join('\n\n')
}

/**
 * Divide una oración larga en oraciones más cortas
 */
function splitLongSentence(sentence: string): string[] {
  const words = sentence.trim().split(/\s+/)
  
  if (words.length <= 20) {
    return [sentence]
  }
  
  // Buscar puntos de división naturales
  const conjunctions = ['y', 'pero', 'aunque', 'porque', 'cuando', 'donde', 'que', 'cual', 'quien']
  const result: string[] = []
  let currentSentence: string[] = []
  
  for (let i = 0; i < words.length; i++) {
    currentSentence.push(words[i])
    
    // Si encontramos una conjunción y ya tenemos suficientes palabras, dividir
    if (currentSentence.length >= 10 && conjunctions.includes(words[i].toLowerCase())) {
      if (i < words.length - 1) {
        result.push(currentSentence.join(' '))
        currentSentence = []
      }
    }
    
    // Si llegamos a 18 palabras, forzar división
    if (currentSentence.length >= 18 && i < words.length - 2) {
      result.push(currentSentence.join(' '))
      currentSentence = []
    }
  }
  
  // Agregar las palabras restantes
  if (currentSentence.length > 0) {
    result.push(currentSentence.join(' '))
  }
  
  return result.filter(s => s.trim().length > 0)
}

/**
 * Agrega negritas a palabras clave importantes y al keyword principal
 * EXCLUYE las FAQs manuales
 */
export function addBoldToKeywords(content: string, keyword: string): string {
  // Si es una FAQ manual, NO agregar negritas automáticas
  if (isManualFAQContent(content)) {
    console.log('🔒 [BOLD-KEYWORDS] FAQ manual detectada - NO agregando negritas automáticas')
    return content
  }

  let optimizedContent = content
  
  // 1. Poner en negrita el keyword principal (primera aparición en cada párrafo)
  const keywordVariations = [
    keyword,
    keyword.toLowerCase(),
    keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase()
  ]
  
  for (const variation of keywordVariations) {
    // Solo la primera aparición en cada párrafo
    const paragraphs = optimizedContent.split('\n\n')
    const processedParagraphs = paragraphs.map(paragraph => {
      if (paragraph.includes(variation) && !paragraph.includes(`**${variation}**`)) {
        return paragraph.replace(variation, `**${variation}**`)
      }
      return paragraph
    })
    optimizedContent = processedParagraphs.join('\n\n')
  }
  
  // 2. Poner en negrita palabras clave importantes SOLO SI YA EXISTEN (máximo 2-3 por párrafo)
  const paragraphs = optimizedContent.split('\n\n')
  const processedParagraphs = paragraphs.map(paragraph => {
    let boldCount = (paragraph.match(/\*\*[^*]+\*\*/g) || []).length
    
    for (const keywordToBold of KEYWORDS_TO_BOLD) {
      if (boldCount >= 3) break // Máximo 3 negritas por párrafo
      
      const regex = new RegExp(`\\b${keywordToBold}\\b`, 'gi')
      if (paragraph.includes(keywordToBold) && !paragraph.includes(`**${keywordToBold}**`)) {
        paragraph = paragraph.replace(regex, (match) => {
          boldCount++
          return `**${match}**`
        })
      }
    }
    
    return paragraph
  })
  optimizedContent = processedParagraphs.join('\n\n')
  
  return optimizedContent
}

/**
 * Valida si el contenido cumple con los criterios de Yoast SEO
 */
export interface YoastSEOValidation {
  hasTransitionWords: boolean
  sentenceLengthOk: boolean
  longSentencesPercentage: number
  transitionWordsCount: number
  boldKeywordsCount: number
  imageAltOk: boolean
  imagesWithKeyword: number
  totalImages: number
  issues: string[]
  suggestions: string[]
}

export function validateYoastSEO(content: string, keyword: string): YoastSEOValidation {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // 1. Verificar palabras de transición
  const hasTransitionWords = TRANSITION_WORDS.some(word => 
    content.toLowerCase().includes(word.toLowerCase())
  )
  
  const transitionWordsCount = TRANSITION_WORDS.filter(word => 
    content.toLowerCase().includes(word.toLowerCase())
  ).length
  
  if (!hasTransitionWords) {
    issues.push('Palabras de transición: Ninguna de las frases contiene palabras de transición.')
    suggestions.push('Agrega palabras como "además", "por ejemplo", "sin embargo", "por lo tanto".')
  }
  
  // 2. Verificar longitud de oraciones
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const longSentences = sentences.filter(sentence => {
    const words = sentence.trim().split(/\s+/)
    return words.length > 20
  })
  
  const longSentencesPercentage = (longSentences.length / sentences.length) * 100
  const sentenceLengthOk = longSentencesPercentage <= 25
  
  if (!sentenceLengthOk) {
    issues.push(`Longitud de las oraciones: El ${longSentencesPercentage.toFixed(1)}% de las oraciones contienen más de 20 palabras, lo que supera el máximo recomendado del 25%.`)
    suggestions.push('Divide las oraciones largas en oraciones más cortas usando puntos o comas.')
  }
  
  // 3. Verificar negritas en keywords
  const boldKeywordsCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
  
  if (boldKeywordsCount === 0) {
    suggestions.push('Agrega negritas a palabras clave importantes para mejorar la legibilidad.')
  }
  
  // 4. Verificar alt attributes en imágenes
  const imageRegex = /!\[([^\]]*)\]\([^)]+\)/g
  const images = content.match(imageRegex) || []
  const imagesWithKeyword = images.filter(img => {
    const altMatch = img.match(/!\[([^\]]*)\]/)
    const altText = altMatch ? altMatch[1].toLowerCase() : ''
    return altText.includes(keyword.toLowerCase())
  }).length
  
  const totalImages = images.length
  const imageAltOk = totalImages === 0 || imagesWithKeyword === totalImages
  
  if (totalImages > 0 && !imageAltOk) {
    issues.push('Alt attributes de imágenes: Las imágenes no tienen atributos alt que reflejen el tema del texto.')
    suggestions.push(`Agrega "${keyword}" o sinónimos a los alt tags de las imágenes relevantes.`)
  }
  
  return {
    hasTransitionWords,
    sentenceLengthOk,
    longSentencesPercentage,
    transitionWordsCount,
    boldKeywordsCount,
    imageAltOk,
    imagesWithKeyword,
    totalImages,
    issues,
    suggestions
  }
}
