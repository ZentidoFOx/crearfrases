/**
 * Optimizador específico para Yoast SEO
 * Resuelve problemas comunes de Yoast como palabras de transición y longitud de oraciones
 */

// Lista completa de palabras de transición MULTIIDIOMA para Yoast SEO
export const TRANSITION_WORDS_BY_LANGUAGE = {
  'es': [
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
  ],
  'en': [
    'furthermore', 'for example', 'however', 'therefore', 'also', 'likewise',
    'first of all', 'finally', 'on the other hand', 'consequently',
    'nevertheless', 'instead', 'on the contrary', 'in summary', 'meanwhile',
    'in fact', 'indeed', 'of course', 'certainly', 'obviously', 'moreover',
    'additionally', 'specifically', 'particularly', 'especially',
    'besides', 'thus', 'hence', 'accordingly', 'as a result', 'in addition',
    'what is more', 'in contrast', 'nonetheless', 'still', 'yet', 'although'
  ],
  'pt': [
    'além disso', 'por exemplo', 'no entanto', 'portanto', 'também', 'da mesma forma',
    'em primeiro lugar', 'finalmente', 'por outro lado', 'consequentemente',
    'não obstante', 'em vez disso', 'pelo contrário', 'em resumo', 'enquanto isso',
    'de fato', 'com efeito', 'claro', 'certamente', 'obviamente'
  ],
  'fr': [
    'de plus', 'par exemple', 'cependant', 'par conséquent', 'aussi', 'de même',
    'tout d\'abord', 'finalement', 'd\'autre part', 'en conséquence',
    'néanmoins', 'au lieu de', 'au contraire', 'en résumé', 'pendant ce temps',
    'en fait', 'en effet', 'bien sûr', 'certainement', 'évidemment'
  ],
  'it': [
    'inoltre', 'per esempio', 'tuttavia', 'pertanto', 'anche', 'allo stesso modo',
    'in primo luogo', 'infine', 'd\'altra parte', 'di conseguenza',
    'tuttavia', 'invece', 'al contrario', 'in sintesi', 'nel frattempo',
    'infatti', 'in effetti', 'ovviamente', 'certamente', 'chiaramente'
  ]
}

// Función para obtener palabras de transición por idioma
export function getTransitionWords(language: string = 'es'): string[] {
  return TRANSITION_WORDS_BY_LANGUAGE[language as keyof typeof TRANSITION_WORDS_BY_LANGUAGE] || TRANSITION_WORDS_BY_LANGUAGE['es']
}

// Mantener compatibilidad con código existente
export const TRANSITION_WORDS = TRANSITION_WORDS_BY_LANGUAGE['es']

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
 */
export function optimizeForYoastSEO(content: string, keyword: string): string {
  // Si es una FAQ manual, NO aplicar optimizaciones automáticas
  if (isManualFAQContent(content)) {
    console.log('🔒 [YOAST-OPTIMIZER] FAQ manual detectada - SALTANDO optimizaciones automáticas')
    return content // Retornar sin modificaciones
  }

  console.log('🔧 [YOAST-OPTIMIZER] Aplicando post-procesamiento como RESPALDO para problemas no resueltos por IA')
  
  let optimizedContent = content

  // 1. Acortar oraciones largas si la IA no lo hizo completamente
  optimizedContent = shortenLongSentences(optimizedContent)
  
  // 2. Agregar negritas al keyword si la IA no las agregó
  optimizedContent = addBoldToKeywords(optimizedContent, keyword)
  
  // 3. NO agregar palabras de transición automáticas - IA las maneja mejor
  // optimizedContent = addTransitionWords(optimizedContent)
  console.log('🔧 [YOAST-OPTIMIZER] Palabras de transición: Solo IA las maneja')
  
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

  console.log('🔧 [BOLD-KEYWORDS] Iniciando optimización de negritas para keyword:', keyword)
  
  let optimizedContent = content
  
  // 1. SOLO poner en negrita el keyword principal EXACTO (una vez por párrafo)
  const paragraphs = optimizedContent.split('\n\n')
  let totalKeywordBolds = 0
  
  const processedParagraphs = paragraphs.map((paragraph, index) => {
    // Saltar párrafos que son títulos (empiezan con #)
    if (paragraph.trim().startsWith('#')) {
      return paragraph
    }
    
    // Verificar si ya tiene el keyword en negrita (HTML o Markdown)
    if (paragraph.includes(`<strong>${keyword}</strong>`) || paragraph.includes(`**${keyword}**`)) {
      console.log(`🔧 [BOLD-KEYWORDS] Párrafo ${index + 1}: Keyword ya en negrita`)
      return paragraph
    }
    
    // Buscar el keyword exacto (case-insensitive) pero mantener capitalización original
    const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    const match = paragraph.match(keywordRegex)
    
    if (match && totalKeywordBolds < 2) { // Máximo 2 keywords en negrita en todo el artículo
      const foundKeyword = match[0] // Mantiene la capitalización original
      const updatedParagraph = paragraph.replace(keywordRegex, `<strong>${foundKeyword}</strong>`)
      totalKeywordBolds++
      console.log(`🔧 [BOLD-KEYWORDS] Párrafo ${index + 1}: Agregada negrita HTML a "${foundKeyword}"`)
      return updatedParagraph
    }
    
    return paragraph
  })
  
  optimizedContent = processedParagraphs.join('\n\n')
  
  // 2. SOLO agregar negritas a palabras que YA EXISTEN (máximo 1-2 adicionales por párrafo)
  const finalParagraphs = optimizedContent.split('\n\n')
  const finalProcessedParagraphs = finalParagraphs.map((paragraph, index) => {
    // Saltar párrafos que son títulos
    if (paragraph.trim().startsWith('#')) {
      return paragraph
    }
    
    // Contar negritas existentes en este párrafo
    let boldCount = (paragraph.match(/\*\*[^*]+\*\*/g) || []).length
    
    // Solo agregar 1-2 negritas adicionales por párrafo si hay espacio
    let addedInThisParagraph = 0
    
    for (const keywordToBold of KEYWORDS_TO_BOLD) {
      if (boldCount >= 2 || addedInThisParagraph >= 1) break // Máximo 2 negritas por párrafo, 1 adicional
      
      // Verificar que la palabra existe Y no está ya en negrita
      const regex = new RegExp(`\\b${keywordToBold}\\b`, 'gi')
      const matches = paragraph.match(regex)
      
      if (matches && !paragraph.includes(`**${keywordToBold}**`)) {
        // Solo poner en negrita la PRIMERA aparición
        paragraph = paragraph.replace(regex, `**${matches[0]}**`)
        boldCount++
        addedInThisParagraph++
        console.log(`🔧 [BOLD-KEYWORDS] Párrafo ${index + 1}: Agregada negrita adicional a "${matches[0]}"`)
        break // Solo una palabra adicional por párrafo
      }
    }
    
    return paragraph
  })
  
  optimizedContent = finalProcessedParagraphs.join('\n\n')
  
  console.log(`✅ [BOLD-KEYWORDS] Optimización completada. Keywords en negrita: ${totalKeywordBolds}`)
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

export function validateYoastSEO(content: string, keyword: string, language: string = 'es'): YoastSEOValidation {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // 1. Verificar palabras de transición según el idioma
  const transitionWords = getTransitionWords(language)
  const hasTransitionWords = transitionWords.some(word => 
    content.toLowerCase().includes(word.toLowerCase())
  )
  
  const transitionWordsCount = transitionWords.filter(word => 
    content.toLowerCase().includes(word.toLowerCase())
  ).length
  
  console.log(`🔍 [YOAST-VALIDATION] Validando palabras de transición en ${language}:`, transitionWordsCount)
  
  if (!hasTransitionWords) {
    const exampleWords = language === 'en' 
      ? '"however", "furthermore", "therefore", "moreover"'
      : language === 'pt'
      ? '"além disso", "no entanto", "portanto", "também"'
      : '"además", "por ejemplo", "sin embargo", "por lo tanto"'
    
    issues.push(`Palabras de transición: Ninguna de las frases contiene palabras de transición.`)
    suggestions.push(`Agrega palabras como ${exampleWords}.`)
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
