/**
 * Sistema robusto de escaneo y control de keywords
 * Garantiza que se respete el límite de 4-6 keywords en todo el artículo
 */

export interface KeywordScanResult {
  totalKeywords: number
  keywordPositions: Array<{ section: string; position: number; context: string }>
  density: number
  totalWords: number
  canAddMore: boolean
  maxAllowedInSection: number
  forceProhibit: boolean
  detailedAnalysis: string
  alternativesRequired: boolean
}

/**
 * Escanea TODO el contenido acumulado y cuenta keywords exactas
 */
export function scanKeywordsInContent(
  fullContent: string, 
  targetKeyword: string,
  currentSectionTitle: string
): KeywordScanResult {
  
  console.log(`🔍 [KEYWORD-SCANNER] === INICIANDO ESCANEO ROBUSTO ===`)
  console.log(`🔍 [KEYWORD-SCANNER] Keyword objetivo: "${targetKeyword}"`)
  console.log(`🔍 [KEYWORD-SCANNER] Sección actual: "${currentSectionTitle}"`)
  console.log(`🔍 [KEYWORD-SCANNER] Contenido a escanear: ${fullContent.length} caracteres`)
  
  if (!fullContent || !targetKeyword) {
    return {
      totalKeywords: 0,
      keywordPositions: [],
      density: 0,
      totalWords: 0,
      canAddMore: true,
      maxAllowedInSection: 1,
      forceProhibit: false,
      detailedAnalysis: 'Sin contenido previo - primera sección',
      alternativesRequired: false
    }
  }

  // Normalizar keyword para búsqueda exacta
  const normalizedKeyword = targetKeyword.toLowerCase().trim()
  const normalizedContent = fullContent.toLowerCase()
  
  // Contar palabras totales
  const totalWords = fullContent.split(/\s+/).filter(word => word.length > 0).length
  
  // 🔍 BÚSQUEDA EXACTA DE KEYWORDS EN TODO EL CONTENIDO (INCLUYENDO TÍTULOS)
  const keywordRegex = new RegExp(`\\b${normalizedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'gi')
  const matches = Array.from(fullContent.matchAll(keywordRegex))
  
  console.log(`🔍 [KEYWORD-SCANNER] Regex usado: ${keywordRegex}`)
  console.log(`🔍 [KEYWORD-SCANNER] Matches encontrados en contenido: ${matches.length}`)
  
  // 🔍 ESCANEO ADICIONAL EN TÍTULOS DE SECCIONES
  const titleMatches = []
  const h2Titles = fullContent.match(/^## (.+)$/gm) || []
  const h3Titles = fullContent.match(/^### (.+)$/gm) || []
  const h4Titles = fullContent.match(/^#### (.+)$/gm) || []
  
  const allTitles = [...h2Titles, ...h3Titles, ...h4Titles]
  
  console.log(`🔍 [KEYWORD-SCANNER] Títulos encontrados: ${allTitles.length}`)
  console.log(`🔍 [KEYWORD-SCANNER] H2: ${h2Titles.length}, H3: ${h3Titles.length}, H4: ${h4Titles.length}`)
  
  allTitles.forEach((title, index) => {
    const titleText = title.replace(/^#{2,4}\s*/, '') // Remover ## ### ####
    const titleMatches = Array.from(titleText.matchAll(keywordRegex))
    if (titleMatches.length > 0) {
      console.log(`🔍 [KEYWORD-SCANNER] Keyword en título ${index + 1}: "${titleText}" (${titleMatches.length} matches)`)
      titleMatches.forEach((match, i) => {
        console.log(`🔍 [KEYWORD-SCANNER]   - Posición en título: ${match.index} - Contexto: "${match[0]}"`)
      })
    }
  })
  
  // Contar matches en títulos por separado para logging
  const titleKeywordCount = allTitles.reduce((count, title) => {
    const titleText = title.replace(/^#{2,4}\s*/, '')
    const titleMatches = Array.from(titleText.matchAll(keywordRegex))
    return count + titleMatches.length
  }, 0)
  
  console.log(`🔍 [KEYWORD-SCANNER] Keywords en títulos: ${titleKeywordCount}`)
  console.log(`🔍 [KEYWORD-SCANNER] Keywords en contenido: ${matches.length}`)
  console.log(`🔍 [KEYWORD-SCANNER] TOTAL KEYWORDS: ${matches.length + titleKeywordCount}`)
  
  // 🔍 ANALIZAR CADA MATCH Y SU CONTEXTO (CONTENIDO + TÍTULOS)
  const keywordPositions = matches.map((match, index) => {
    const position = match.index || 0
    const contextStart = Math.max(0, position - 50)
    const contextEnd = Math.min(fullContent.length, position + 50)
    const context = fullContent.substring(contextStart, contextEnd)
    
    // Determinar en qué sección está
    const beforeMatch = fullContent.substring(0, position)
    const sectionMatches = beforeMatch.match(/## (.+?)$/gm)
    const lastSection = sectionMatches ? sectionMatches[sectionMatches.length - 1] : 'Introducción'
    
    console.log(`🔍 [KEYWORD-SCANNER] Match ${index + 1}: posición ${position}, sección "${lastSection}"`)
    console.log(`🔍 [KEYWORD-SCANNER] Contexto: "...${context}..."`)
    
    return {
      section: lastSection.replace('## ', ''),
      position,
      context: context.trim()
    }
  })
  
  // 🔍 AGREGAR MATCHES DE TÍTULOS A LAS POSICIONES
  allTitles.forEach((title, index) => {
    const titleText = title.replace(/^#{2,4}\s*/, '')
    const titleMatches = Array.from(titleText.matchAll(keywordRegex))
    titleMatches.forEach(match => {
      keywordPositions.push({
        section: `TÍTULO: ${titleText}`,
        position: -1, // Posición especial para títulos
        context: `Título de sección: "${titleText}"`
      })
    })
  })
  
  // 🔍 TOTAL REAL DE KEYWORDS (CONTENIDO + TÍTULOS)
  const totalKeywords = matches.length + titleKeywordCount
  const density = totalWords > 0 ? (totalKeywords / totalWords) * 100 : 0
  
  // REGLAS ESTRICTAS DE CONTROL
  const ABSOLUTE_MAX = 6
  const TARGET_DENSITY = 0.6
  
  let canAddMore = false
  let maxAllowedInSection = 0
  let forceProhibit = false
  let detailedAnalysis = ''
  let alternativesRequired = false
  
  // ANÁLISIS DETALLADO POR CASOS
  if (totalKeywords >= ABSOLUTE_MAX) {
    canAddMore = false
    maxAllowedInSection = 0
    forceProhibit = true
    detailedAnalysis = `🚨 LÍMITE ALCANZADO: ${totalKeywords}/${ABSOLUTE_MAX} keywords. PROHIBIDO agregar más.`
    alternativesRequired = true
  } else if (totalKeywords >= 5) {
    canAddMore = totalWords > 1500
    maxAllowedInSection = canAddMore ? 1 : 0
    forceProhibit = !canAddMore
    detailedAnalysis = canAddMore 
      ? `⚠️ LÍMITE CERCANO: ${totalKeywords}/6 keywords. Permitir 1 más solo por longitud (${totalWords} palabras).`
      : `🚨 LÍMITE CERCANO: ${totalKeywords}/6 keywords. Artículo corto (${totalWords} palabras). PROHIBIDO.`
    alternativesRequired = !canAddMore
  } else if (totalKeywords >= 4) {
    canAddMore = totalWords > 1000 && density < TARGET_DENSITY
    maxAllowedInSection = canAddMore ? 1 : 0
    forceProhibit = !canAddMore
    detailedAnalysis = canAddMore
      ? `⚠️ CUIDADO: ${totalKeywords}/6 keywords. Permitir 1 más (${totalWords} palabras, ${density.toFixed(2)}% densidad).`
      : `🚨 CUIDADO: ${totalKeywords}/6 keywords. Condiciones insuficientes (${totalWords} palabras, ${density.toFixed(2)}% densidad).`
    alternativesRequired = !canAddMore
  } else if (totalKeywords >= 3) {
    canAddMore = totalWords > 600 && density < TARGET_DENSITY
    maxAllowedInSection = canAddMore ? 1 : 0
    detailedAnalysis = canAddMore
      ? `✅ MODERADO: ${totalKeywords}/6 keywords. Permitir 1 más (${totalWords} palabras, ${density.toFixed(2)}% densidad).`
      : `⚠️ MODERADO: ${totalKeywords}/6 keywords. Preferir sinónimos (${totalWords} palabras, ${density.toFixed(2)}% densidad).`
    alternativesRequired = false
  } else {
    canAddMore = density < TARGET_DENSITY
    maxAllowedInSection = canAddMore ? Math.min(2, ABSOLUTE_MAX - totalKeywords) : 0
    detailedAnalysis = `✅ BAJO: ${totalKeywords}/6 keywords. Permitir hasta ${maxAllowedInSection} más (${totalWords} palabras, ${density.toFixed(2)}% densidad).`
    alternativesRequired = false
  }
  
  // Override por densidad alta
  if (density >= TARGET_DENSITY) {
    canAddMore = false
    maxAllowedInSection = 0
    forceProhibit = true
    detailedAnalysis += ` 🚨 DENSIDAD ALTA (${density.toFixed(2)}% >= ${TARGET_DENSITY}%). FORZAR PROHIBICIÓN.`
    alternativesRequired = true
  }
  
  console.log(`🔍 [KEYWORD-SCANNER] === RESULTADO DEL ESCANEO COMPLETO ===`)
  console.log(`🔍 [KEYWORD-SCANNER] Keywords en contenido: ${matches.length}`)
  console.log(`🔍 [KEYWORD-SCANNER] Keywords en títulos: ${titleKeywordCount}`)
  console.log(`🔍 [KEYWORD-SCANNER] TOTAL KEYWORDS REALES: ${totalKeywords}`)
  console.log(`🔍 [KEYWORD-SCANNER] Densidad: ${density.toFixed(2)}%`)
  console.log(`🔍 [KEYWORD-SCANNER] Puede agregar más: ${canAddMore}`)
  console.log(`🔍 [KEYWORD-SCANNER] Máximo en sección: ${maxAllowedInSection}`)
  console.log(`🔍 [KEYWORD-SCANNER] Forzar prohibición: ${forceProhibit}`)
  console.log(`🔍 [KEYWORD-SCANNER] Análisis: ${detailedAnalysis}`)
  console.log(`🔍 [KEYWORD-SCANNER] Alternativas requeridas: ${alternativesRequired}`)
  
  // 🔍 LOG DETALLADO DE TODAS LAS POSICIONES (CONTENIDO + TÍTULOS)
  keywordPositions.forEach((pos, i) => {
    if (pos.position === -1) {
      console.log(`🔍 [KEYWORD-SCANNER] Keyword ${i + 1}: ${pos.section} - ${pos.context}`)
    } else {
      console.log(`🔍 [KEYWORD-SCANNER] Keyword ${i + 1}: Sección "${pos.section}" - "${pos.context}"`)
    }
  })
  
  return {
    totalKeywords,
    keywordPositions,
    density,
    totalWords,
    canAddMore,
    maxAllowedInSection,
    forceProhibit,
    detailedAnalysis,
    alternativesRequired
  }
}

/**
 * Genera instrucciones específicas para la IA basadas en el escaneo
 */
export function generateKeywordInstructions(
  scanResult: KeywordScanResult,
  targetKeyword: string
): {
  instruction: string
  alternatives: string[]
  severity: 'allow' | 'caution' | 'prohibit'
} {
  
  const alternatives = [
    'pesca amazónica', 'pescar en ríos tropicales', 'actividad pesquera',
    'pesca fluvial', 'pesca en aguas dulces', 'pesca deportiva',
    'esta actividad', 'esta práctica', 'este deporte acuático',
    'turismo pesquero', 'aventura acuática', 'deporte de caña'
  ]
  
  if (scanResult.forceProhibit || !scanResult.canAddMore) {
    return {
      instruction: `🚨 PROHIBICIÓN ABSOLUTA: NO uses "${targetKeyword}" en esta sección. 
${scanResult.detailedAnalysis}
OBLIGATORIO: Usa SOLO sinónimos y variaciones. El límite ya se alcanzó.`,
      alternatives,
      severity: 'prohibit'
    }
  }
  
  if (scanResult.maxAllowedInSection === 1 && scanResult.totalKeywords >= 3) {
    return {
      instruction: `⚠️ EXTREMA PRECAUCIÓN: Puedes usar "${targetKeyword}" MÁXIMO 1 vez en esta sección.
${scanResult.detailedAnalysis}
Usa de forma MUY natural. Después de esta sección, usa solo sinónimos.`,
      alternatives,
      severity: 'caution'
    }
  }
  
  return {
    instruction: `✅ PERMITIDO: Puedes usar "${targetKeyword}" máximo ${scanResult.maxAllowedInSection} vez(es).
${scanResult.detailedAnalysis}
Usa de forma natural y distribuida.`,
    alternatives,
    severity: 'allow'
  }
}

/**
 * Valida si un contenido generado respeta las reglas de keywords
 */
export function validateGeneratedContent(
  generatedContent: string,
  targetKeyword: string,
  previousScanResult: KeywordScanResult
): {
  isValid: boolean
  newKeywordCount: number
  totalKeywords: number
  violations: string[]
} {
  
  // 🔍 VALIDAR CONTENIDO COMPLETO (INCLUYENDO TÍTULOS)
  const keywordRegex = new RegExp(`\\b${targetKeyword.toLowerCase().replace(/\s+/g, '\\s+')}\\b`, 'gi')
  const contentMatches = Array.from(generatedContent.matchAll(keywordRegex))
  
  // Buscar keywords en títulos del contenido generado
  const h2Titles = generatedContent.match(/^## (.+)$/gm) || []
  const h3Titles = generatedContent.match(/^### (.+)$/gm) || []
  const h4Titles = generatedContent.match(/^#### (.+)$/gm) || []
  
  const allNewTitles = [...h2Titles, ...h3Titles, ...h4Titles]
  const titleKeywordCount = allNewTitles.reduce((count, title) => {
    const titleText = title.replace(/^#{2,4}\s*/, '')
    const titleMatches = Array.from(titleText.matchAll(keywordRegex))
    if (titleMatches.length > 0) {
      console.log(`🔍 [VALIDATION] Keyword en nuevo título: "${titleText}" (${titleMatches.length} matches)`)
    }
    return count + titleMatches.length
  }, 0)
  
  const newKeywordCount = contentMatches.length + titleKeywordCount
  const totalKeywords = previousScanResult.totalKeywords + newKeywordCount
  const violations: string[] = []
  
  console.log(`🔍 [VALIDATION] Contenido generado:`, generatedContent.length, 'caracteres')
  console.log(`🔍 [VALIDATION] Keywords en contenido nuevo:`, contentMatches.length)
  console.log(`🔍 [VALIDATION] Keywords en títulos nuevos:`, titleKeywordCount)
  console.log(`🔍 [VALIDATION] Total keywords nuevas:`, newKeywordCount)
  console.log(`🔍 [VALIDATION] Keywords previas:`, previousScanResult.totalKeywords)
  console.log(`🔍 [VALIDATION] TOTAL FINAL:`, totalKeywords, '/6')
  
  // Ya se hace el logging arriba
  
  // Validar límite absoluto
  if (totalKeywords > 6) {
    violations.push(`Excede límite absoluto: ${totalKeywords}/6 keywords`)
  }
  
  // Validar límite por sección
  if (newKeywordCount > previousScanResult.maxAllowedInSection) {
    violations.push(`Excede límite de sección: ${newKeywordCount}/${previousScanResult.maxAllowedInSection} permitidas`)
  }
  
  // Validar prohibición forzada
  if (previousScanResult.forceProhibit && newKeywordCount > 0) {
    violations.push(`Violó prohibición absoluta: ${newKeywordCount} keywords cuando estaba prohibido`)
  }
  
  const isValid = violations.length === 0
  
  console.log(`🔍 [VALIDATION] Resultado: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`)
  if (!isValid) {
    violations.forEach(violation => {
      console.log(`🔍 [VALIDATION] Violación: ${violation}`)
    })
  }
  
  return {
    isValid,
    newKeywordCount,
    totalKeywords,
    violations
  }
}
