/**
 * ENFORCER DE KEYWORDS - CONTROL FORZADO
 * 
 * Este módulo FUERZA el límite de keywords reemplazando automáticamente
 * las keywords excedentes con sinónimos después de la generación.
 * 
 * Es el último recurso cuando la IA no respeta las instrucciones.
 */

export interface KeywordEnforcementResult {
  originalContent: string
  enforcedContent: string
  originalKeywordCount: number
  finalKeywordCount: number
  replacements: Array<{
    position: number
    original: string
    replacement: string
    context: string
  }>
  wasEnforced: boolean
}

/**
 * Sinónimos y variaciones para reemplazar keywords excedentes
 */
const getKeywordAlternatives = (keyword: string): string[] => {
  const lowerKeyword = keyword.toLowerCase()
  
  // Generar sinónimos basados en la keyword
  if (lowerKeyword.includes('pesca') && lowerKeyword.includes('amazonas')) {
    return [
      'pesca amazónica',
      'pescar en ríos tropicales',
      'actividad pesquera',
      'pesca fluvial',
      'pesca en aguas dulces',
      'pesca deportiva',
      'turismo pesquero',
      'aventura acuática',
      'esta actividad',
      'esta práctica',
      'este deporte acuático',
      'esta experiencia',
      'la actividad',
      'la práctica',
      'el deporte',
      'la experiencia'
    ]
  }
  
  // Sinónimos genéricos
  return [
    'esta actividad',
    'esta práctica',
    'este tema',
    'esta experiencia',
    'la actividad',
    'la práctica',
    'el tema',
    'la experiencia',
    'esto',
    'ello',
    'dicha actividad',
    'tal práctica'
  ]
}

/**
 * FUERZA el límite de keywords reemplazando automáticamente las excedentes
 */
export function enforceKeywordLimit(
  content: string,
  targetKeyword: string,
  maxKeywords: number = 6
): KeywordEnforcementResult {
  
  console.log(`🚨 [KEYWORD-ENFORCER] === INICIANDO CONTROL FORZADO ===`)
  console.log(`🚨 [KEYWORD-ENFORCER] Keyword objetivo: "${targetKeyword}"`)
  console.log(`🚨 [KEYWORD-ENFORCER] Límite máximo: ${maxKeywords}`)
  console.log(`🚨 [KEYWORD-ENFORCER] Contenido: ${content.length} caracteres`)
  
  const originalContent = content
  let enforcedContent = content
  const replacements: Array<{
    position: number
    original: string
    replacement: string
    context: string
  }> = []
  
  // Buscar todas las keywords
  const keywordRegex = new RegExp(`\\b${targetKeyword.replace(/\s+/g, '\\s+')}\\b`, 'gi')
  const matches = Array.from(content.matchAll(keywordRegex))
  
  const originalKeywordCount = matches.length
  
  console.log(`🚨 [KEYWORD-ENFORCER] Keywords encontradas: ${originalKeywordCount}`)
  
  if (originalKeywordCount <= maxKeywords) {
    console.log(`✅ [KEYWORD-ENFORCER] Dentro del límite - No se requiere enforcement`)
    return {
      originalContent,
      enforcedContent,
      originalKeywordCount,
      finalKeywordCount: originalKeywordCount,
      replacements: [],
      wasEnforced: false
    }
  }
  
  // NECESITA ENFORCEMENT - Reemplazar keywords excedentes
  console.log(`🚨 [KEYWORD-ENFORCER] EXCEDE LÍMITE: ${originalKeywordCount}/${maxKeywords}`)
  console.log(`🚨 [KEYWORD-ENFORCER] Reemplazando ${originalKeywordCount - maxKeywords} keywords excedentes`)
  
  const alternatives = getKeywordAlternatives(targetKeyword)
  let alternativeIndex = 0
  
  // Reemplazar keywords desde la posición maxKeywords en adelante
  const matchesToReplace = matches.slice(maxKeywords)
  
  // Procesar desde el final hacia el principio para mantener las posiciones
  for (let i = matchesToReplace.length - 1; i >= 0; i--) {
    const match = matchesToReplace[i]
    const position = match.index || 0
    const original = match[0]
    
    // Obtener contexto
    const contextStart = Math.max(0, position - 30)
    const contextEnd = Math.min(content.length, position + original.length + 30)
    const context = content.substring(contextStart, contextEnd)
    
    // Seleccionar reemplazo
    const replacement = alternatives[alternativeIndex % alternatives.length]
    alternativeIndex++
    
    // Reemplazar en el contenido
    enforcedContent = enforcedContent.substring(0, position) + 
                    replacement + 
                    enforcedContent.substring(position + original.length)
    
    replacements.unshift({
      position,
      original,
      replacement,
      context: context.trim()
    })
    
    console.log(`🚨 [KEYWORD-ENFORCER] Reemplazo ${i + 1}: "${original}" → "${replacement}"`)
    console.log(`🚨 [KEYWORD-ENFORCER] Contexto: "...${context}..."`)
  }
  
  // Verificar resultado final
  const finalMatches = Array.from(enforcedContent.matchAll(keywordRegex))
  const finalKeywordCount = finalMatches.length
  
  console.log(`🚨 [KEYWORD-ENFORCER] === RESULTADO DEL ENFORCEMENT ===`)
  console.log(`🚨 [KEYWORD-ENFORCER] Keywords originales: ${originalKeywordCount}`)
  console.log(`🚨 [KEYWORD-ENFORCER] Keywords finales: ${finalKeywordCount}`)
  console.log(`🚨 [KEYWORD-ENFORCER] Reemplazos realizados: ${replacements.length}`)
  console.log(`🚨 [KEYWORD-ENFORCER] Enforcement exitoso: ${finalKeywordCount <= maxKeywords ? '✅' : '❌'}`)
  
  if (finalKeywordCount > maxKeywords) {
    console.error(`🚨 [KEYWORD-ENFORCER] ERROR: Aún excede el límite después del enforcement`)
  }
  
  return {
    originalContent,
    enforcedContent,
    originalKeywordCount,
    finalKeywordCount,
    replacements,
    wasEnforced: true
  }
}

/**
 * Aplica enforcement a contenido completo (incluyendo títulos)
 */
export function enforceKeywordLimitInFullContent(
  content: string,
  targetKeyword: string,
  maxKeywords: number = 6
): KeywordEnforcementResult {
  
  console.log(`🚨 [KEYWORD-ENFORCER] === ENFORCEMENT EN CONTENIDO COMPLETO ===`)
  
  // Separar títulos y contenido para enforcement inteligente
  const lines = content.split('\n')
  const titleLines: string[] = []
  const contentLines: string[] = []
  
  lines.forEach(line => {
    if (line.match(/^#{1,4}\s+/)) {
      titleLines.push(line)
    } else {
      contentLines.push(line)
    }
  })
  
  const titleContent = titleLines.join('\n')
  const bodyContent = contentLines.join('\n')
  
  console.log(`🚨 [KEYWORD-ENFORCER] Títulos: ${titleLines.length} líneas`)
  console.log(`🚨 [KEYWORD-ENFORCER] Contenido: ${contentLines.length} líneas`)
  
  // Contar keywords en títulos
  const titleKeywordRegex = new RegExp(`\\b${targetKeyword.replace(/\s+/g, '\\s+')}\\b`, 'gi')
  const titleMatches = Array.from(titleContent.matchAll(titleKeywordRegex))
  const titleKeywordCount = titleMatches.length
  
  console.log(`🚨 [KEYWORD-ENFORCER] Keywords en títulos: ${titleKeywordCount}`)
  
  // Si los títulos ya exceden el límite, reemplazar en títulos también
  if (titleKeywordCount >= maxKeywords) {
    console.log(`🚨 [KEYWORD-ENFORCER] TÍTULOS EXCEDEN LÍMITE - Enforcement en títulos`)
    const titleEnforcement = enforceKeywordLimit(titleContent, targetKeyword, Math.floor(maxKeywords / 2))
    const bodyEnforcement = enforceKeywordLimit(bodyContent, targetKeyword, maxKeywords - titleEnforcement.finalKeywordCount)
    
    const finalContent = content
      .replace(titleContent, titleEnforcement.enforcedContent)
      .replace(bodyContent, bodyEnforcement.enforcedContent)
    
    return {
      originalContent: content,
      enforcedContent: finalContent,
      originalKeywordCount: titleEnforcement.originalKeywordCount + bodyEnforcement.originalKeywordCount,
      finalKeywordCount: titleEnforcement.finalKeywordCount + bodyEnforcement.finalKeywordCount,
      replacements: [...titleEnforcement.replacements, ...bodyEnforcement.replacements],
      wasEnforced: true
    }
  } else {
    // Solo enforcement en contenido del cuerpo
    const allowedInBody = maxKeywords - titleKeywordCount
    console.log(`🚨 [KEYWORD-ENFORCER] Keywords permitidas en cuerpo: ${allowedInBody}`)
    
    const bodyEnforcement = enforceKeywordLimit(bodyContent, targetKeyword, allowedInBody)
    
    if (bodyEnforcement.wasEnforced) {
      const finalContent = content.replace(bodyContent, bodyEnforcement.enforcedContent)
      
      return {
        originalContent: content,
        enforcedContent: finalContent,
        originalKeywordCount: titleKeywordCount + bodyEnforcement.originalKeywordCount,
        finalKeywordCount: titleKeywordCount + bodyEnforcement.finalKeywordCount,
        replacements: bodyEnforcement.replacements,
        wasEnforced: true
      }
    }
  }
  
  // No se necesita enforcement
  return enforceKeywordLimit(content, targetKeyword, maxKeywords)
}
