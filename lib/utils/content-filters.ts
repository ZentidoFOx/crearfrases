/**
 * Filtros anti-IA para contenido de artículos
 * Similar a los filtros de títulos pero adaptados para contenido largo
 */

// Función para normalizar texto (igual que en títulos)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Función para detectar contenido artificial
export const isArtificialContent = (content: string): { isArtificial: boolean; reasons: string[] } => {
  const normalizedContent = normalizeText(content)
  const reasons: string[] = []
  
  // PALABRAS POMPOSAS
  const pompousWords = [
    'crucial', 'intrincado', 'pivotal', 'meticuloso', 'imprescindible',
    'revolucionar', 'fundamental', 'esencial', 'clave', 'primordial',
    'sustancial', 'considerable', 'notable', 'significativo'
  ]
  
  // VERBOS ROBÓTICOS
  const roboticVerbs = [
    'aprovechar', 'embarcarse', 'profundizar', 'optimizar', 'potenciar',
    'utilizar', 'facilitar', 'maximizar', 'implementar', 'ejecutar',
    'analice', 'explore', 'descubre', 'navegue', 'examine'
  ]
  
  // DESCRIPTORES EXAGERADOS
  const exaggeratedDescriptors = [
    'vibrante', 'vital', 'dinámico', 'versátil', 'exhaustivo',
    'completo', 'integral', 'intrigante', 'fascinante', 'cautivador',
    'impresionante', 'asombroso', 'increíble', 'espectacular'
  ]
  
  // CONCEPTOS ABSTRACTOS
  const abstractConcepts = [
    'tapiz', 'reino', 'panorama', 'ecosistema', 'esfera',
    'interacción', 'resonar', 'elevar', 'transformar',
    'inmersión', 'conexión', 'sinergia', 'dimensión'
  ]
  
  // FRASES TÍPICAS DE IA
  const aiPhrases = [
    'descubre las maravillas', 'explora el mundo de', 'sumérgete en',
    'en el mundo de', 'en el ámbito de', 'en el contexto de',
    'juegan un papel importante', 'desempeñan un rol clave',
    'tiene como objetivo', 'busca proporcionar',
    'en este artículo', 'a lo largo de este artículo',
    'sin más preámbulos', 'dicho esto', 'en última instancia'
  ]
  
  // CONECTORES DE IA
  const aiConnectors = [
    'en resumen', 'en conclusión', 'para resumir',
    'recuerda que', 'no olvides que', 'ten en cuenta que',
    'profundizar en', 'ahondar en', 'adentrarse en',
    'aprovechar al máximo', 'sacar el máximo provecho'
  ]
  
  // Combinar todas las listas
  const allProhibitedWords = [
    ...pompousWords,
    ...roboticVerbs,
    ...exaggeratedDescriptors,
    ...abstractConcepts,
    ...aiPhrases,
    ...aiConnectors
  ]
  
  // Contar ocurrencias de palabras/frases prohibidas
  let totalProhibited = 0
  allProhibitedWords.forEach(phrase => {
    const occurrences = (normalizedContent.match(new RegExp(phrase.replace(/\s+/g, '\\s+'), 'g')) || []).length
    if (occurrences > 0) {
      totalProhibited += occurrences
      reasons.push(`"${phrase}" encontrada ${occurrences} vez(es)`)
    }
  })
  
  // Calcular densidad de palabras prohibidas
  const totalWords = normalizedContent.split(/\s+/).length
  const prohibitedDensity = (totalProhibited / totalWords) * 100
  
  console.log(`🔍 [CONTENT-FILTER] Análisis de contenido artificial:`)
  console.log(`  - Total palabras: ${totalWords}`)
  console.log(`  - Palabras prohibidas: ${totalProhibited}`)
  console.log(`  - Densidad prohibida: ${prohibitedDensity.toFixed(2)}%`)
  
  // Considerar artificial si más del 2% del contenido son palabras prohibidas
  const isArtificial = prohibitedDensity > 2.0
  
  if (isArtificial) {
    console.log(`❌ [CONTENT-FILTER] Contenido considerado ARTIFICIAL (${prohibitedDensity.toFixed(2)}% > 2%)`)
    reasons.forEach(reason => console.log(`  - ${reason}`))
  } else {
    console.log(`✅ [CONTENT-FILTER] Contenido considerado NATURAL (${prohibitedDensity.toFixed(2)}% ≤ 2%)`)
  }
  
  return { isArtificial, reasons }
}

// Función para validar SEO del contenido
export const validateContentSEO = (content: string, keyword: string): {
  score: number
  factors: Array<{ name: string; status: boolean; detail: string; weight: number }>
} => {
  const normalizedContent = normalizeText(content)
  const normalizedKeyword = normalizeText(keyword)
  const wordCount = normalizedContent.split(/\s+/).length
  
  console.log(`📊 [SEO-CONTENT] Analizando SEO del contenido:`)
  console.log(`  - Total palabras: ${wordCount}`)
  console.log(`  - Keyword: "${keyword}"`)
  
  const factors = []
  let score = 0
  
  // 1. Presencia de keyword (25 puntos)
  const keywordOccurrences = (normalizedContent.match(new RegExp(normalizedKeyword.replace(/\s+/g, '\\s+'), 'g')) || []).length
  const keywordDensity = (keywordOccurrences / wordCount) * 100
  const keywordPresent = keywordOccurrences > 0
  const keywordOptimal = keywordDensity >= 1.0 && keywordDensity <= 2.0
  
  if (keywordPresent) {
    if (keywordOptimal) {
      score += 25
      factors.push({
        name: 'Densidad de Keyword',
        status: true,
        detail: `${keywordDensity.toFixed(1)}% (óptimo: 1-2%)`,
        weight: 25
      })
    } else {
      score += 15
      factors.push({
        name: 'Densidad de Keyword',
        status: false,
        detail: `${keywordDensity.toFixed(1)}% (recomendado: 1-2%)`,
        weight: 25
      })
    }
  } else {
    factors.push({
      name: 'Densidad de Keyword',
      status: false,
      detail: 'Keyword no encontrada',
      weight: 25
    })
  }
  
  // 2. Longitud del contenido (20 puntos)
  const optimalLength = wordCount >= 800 && wordCount <= 2500
  const acceptableLength = wordCount >= 500 && wordCount <= 3000
  
  if (optimalLength) {
    score += 20
    factors.push({
      name: 'Longitud del Contenido',
      status: true,
      detail: `${wordCount} palabras (óptimo: 800-2500)`,
      weight: 20
    })
  } else if (acceptableLength) {
    score += 12
    factors.push({
      name: 'Longitud del Contenido',
      status: false,
      detail: `${wordCount} palabras (aceptable: 500-3000)`,
      weight: 20
    })
  } else {
    factors.push({
      name: 'Longitud del Contenido',
      status: false,
      detail: `${wordCount} palabras (recomendado: 800-2500)`,
      weight: 20
    })
  }
  
  // 3. Estructura (encabezados H2, H3) (15 puntos)
  const h2Count = (content.match(/^## /gm) || []).length
  const h3Count = (content.match(/^### /gm) || []).length
  const hasGoodStructure = h2Count >= 3 && (h2Count + h3Count) >= 5
  
  if (hasGoodStructure) {
    score += 15
    factors.push({
      name: 'Estructura de Encabezados',
      status: true,
      detail: `${h2Count} H2, ${h3Count} H3`,
      weight: 15
    })
  } else {
    factors.push({
      name: 'Estructura de Encabezados',
      status: false,
      detail: `${h2Count} H2, ${h3Count} H3 (recomendado: ≥3 H2, ≥5 total)`,
      weight: 15
    })
  }
  
  // 4. Naturalidad (no artificial) (20 puntos)
  const { isArtificial } = isArtificialContent(content)
  if (!isArtificial) {
    score += 20
    factors.push({
      name: 'Contenido Natural',
      status: true,
      detail: 'Sin palabras robóticas de IA',
      weight: 20
    })
  } else {
    factors.push({
      name: 'Contenido Natural',
      status: false,
      detail: 'Contiene palabras típicas de IA',
      weight: 20
    })
  }
  
  // 5. Legibilidad (párrafos y listas) (10 puntos)
  const paragraphCount = (content.match(/\n\n/g) || []).length + 1
  const listCount = (content.match(/^- /gm) || []).length + (content.match(/^\d+\. /gm) || []).length
  const hasGoodReadability = paragraphCount >= 5 && listCount >= 3
  
  if (hasGoodReadability) {
    score += 10
    factors.push({
      name: 'Legibilidad',
      status: true,
      detail: `${paragraphCount} párrafos, ${listCount} items de lista`,
      weight: 10
    })
  } else {
    factors.push({
      name: 'Legibilidad',
      status: false,
      detail: `${paragraphCount} párrafos, ${listCount} items (mejorable)`,
      weight: 10
    })
  }
  
  // 6. Enlaces internos/externos (10 puntos)
  const linkCount = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length
  const hasLinks = linkCount >= 2
  
  if (hasLinks) {
    score += 10
    factors.push({
      name: 'Enlaces',
      status: true,
      detail: `${linkCount} enlaces encontrados`,
      weight: 10
    })
  } else {
    factors.push({
      name: 'Enlaces',
      status: false,
      detail: `${linkCount} enlaces (recomendado: ≥2)`,
      weight: 10
    })
  }
  
  console.log(`🏆 [SEO-CONTENT] Score final: ${score}/100`)
  factors.forEach(factor => {
    const status = factor.status ? '✅' : '❌'
    console.log(`  ${status} ${factor.name}: ${factor.detail}`)
  })
  
  return { score, factors }
}

// Función para sugerir mejoras al contenido
export const suggestContentImprovements = (content: string, keyword: string): string[] => {
  const suggestions: string[] = []
  const { isArtificial, reasons } = isArtificialContent(content)
  const { factors } = validateContentSEO(content, keyword)
  
  if (isArtificial) {
    suggestions.push(`❌ Contenido suena artificial. Palabras detectadas: ${reasons.slice(0, 3).join(', ')}`)
    suggestions.push(`💡 Reescribe usando lenguaje más natural y conversacional`)
  }
  
  factors.forEach(factor => {
    if (!factor.status) {
      switch (factor.name) {
        case 'Densidad de Keyword':
          suggestions.push(`💡 Ajusta la densidad de "${keyword}" a 1-2% del contenido`)
          break
        case 'Longitud del Contenido':
          suggestions.push(`💡 Ajusta la longitud del contenido a 800-2500 palabras`)
          break
        case 'Estructura de Encabezados':
          suggestions.push(`💡 Agrega más encabezados H2 y H3 para mejor estructura`)
          break
        case 'Contenido Natural':
          suggestions.push(`💡 Elimina palabras robóticas y usa lenguaje más humano`)
          break
        case 'Legibilidad':
          suggestions.push(`💡 Agrega más párrafos y listas para mejorar legibilidad`)
          break
        case 'Enlaces':
          suggestions.push(`💡 Incluye al menos 2 enlaces relevantes en el contenido`)
          break
      }
    }
  })
  
  return suggestions
}
