/**
 * FILTRO ANTI-CONTENIDO ROBÓTICO
 * 
 * Detecta y filtra palabras y frases robóticas típicas de IA
 * que hacen que el contenido se vea artificial y poco natural.
 */

export interface RoboticContentAnalysis {
  isRobotic: boolean
  roboticWords: string[]
  roboticPhrases: string[]
  score: number // 0-100, donde 100 es muy robótico
  suggestions: string[]
  cleanedContent?: string
}

/**
 * Palabras robóticas típicas de IA que deben evitarse
 */
const ROBOTIC_WORDS = [
  // Palabras de inicio típicas de IA
  'sueñas', 'anhelas', 'descubre', 'imagina', 'visualiza',
  'sumérgete', 'embárcate', 'adéntrate', 'explora',
  'desentraña', 'desvelamos', 'revelamos',
  
  // Palabras dramáticas excesivas
  'fascinante', 'extraordinario', 'increíble', 'asombroso',
  'espectacular', 'maravilloso', 'impresionante', 'sorprendente',
  'cautivador', 'deslumbrante', 'mágico', 'épico',
  
  // Palabras de transición robóticas
  'además', 'asimismo', 'por otro lado', 'cabe destacar',
  'es importante mencionar', 'vale la pena señalar',
  'no obstante', 'sin embargo', 'por consiguiente',
  
  // Palabras de cierre robóticas
  'en conclusión', 'para finalizar', 'en resumen',
  'como hemos visto', 'tal como se ha mencionado'
]

/**
 * Frases robóticas completas típicas de IA
 */
const ROBOTIC_PHRASES = [
  // Inicios robóticos
  '¿sueñas con',
  '¿anhelas',
  '¿te imaginas',
  'descubre el fascinante mundo',
  'sumérgete en el apasionante',
  'embárcate en una aventura',
  'adéntrate en el mundo de',
  'explora las maravillas de',
  
  // Frases de transición robóticas
  'es importante tener en cuenta que',
  'cabe destacar que',
  'vale la pena mencionar que',
  'no podemos dejar de lado',
  'es fundamental comprender que',
  'resulta esencial considerar',
  
  // Frases de cierre robóticas
  'en conclusión, podemos afirmar',
  'para finalizar, es importante',
  'como hemos podido observar',
  'tal como se ha demostrado',
  'sin lugar a dudas',
  'definitivamente podemos decir'
]

/**
 * Patrones robóticos (expresiones regulares)
 */
const ROBOTIC_PATTERNS = [
  /^¿(sueñas|anhelas|imaginas|visualizas)/i,
  /descubre el (fascinante|increíble|asombroso)/i,
  /(sumérgete|embárcate|adéntrate) en/i,
  /es (importante|fundamental|esencial) (mencionar|destacar|considerar)/i,
  /(sin lugar a dudas|definitivamente)/i,
  /^(además|asimismo|por otro lado)/i
]

/**
 * Alternativas naturales para reemplazar contenido robótico
 */
const NATURAL_ALTERNATIVES = {
  // Inicios naturales
  'sueñas': ['quieres', 'buscas', 'necesitas', 'planeas'],
  'anhelas': ['quieres', 'deseas', 'buscas', 'necesitas'],
  'descubre': ['conoce', 'aprende sobre', 'entiende', 'explora'],
  'imagina': ['considera', 'piensa en', 'visualiza'],
  'sumérgete': ['conoce', 'aprende', 'estudia'],
  'embárcate': ['comienza', 'inicia', 'empieza'],
  'adéntrate': ['conoce', 'aprende sobre', 'estudia'],
  
  // Palabras dramáticas → naturales
  'fascinante': ['interesante', 'útil', 'importante'],
  'extraordinario': ['notable', 'destacado', 'importante'],
  'increíble': ['notable', 'interesante', 'sorprendente'],
  'asombroso': ['notable', 'interesante', 'destacado'],
  'espectacular': ['excelente', 'muy bueno', 'destacado'],
  'maravilloso': ['excelente', 'muy bueno', 'estupendo'],
  
  // Transiciones naturales
  'además': ['también', 'igualmente', 'del mismo modo'],
  'asimismo': ['también', 'de igual forma', 'igualmente'],
  'por otro lado': ['también', 'además', 'otra opción es'],
  'cabe destacar': ['es importante', 'hay que mencionar', 'conviene saber'],
  
  // Cierres naturales
  'en conclusión': ['para terminar', 'finalmente', 'por último'],
  'para finalizar': ['finalmente', 'por último', 'para terminar'],
  'en resumen': ['resumiendo', 'en pocas palabras', 'básicamente']
}

/**
 * Analiza el contenido para detectar elementos robóticos
 */
export function analyzeRoboticContent(content: string): RoboticContentAnalysis {
  const lowerContent = content.toLowerCase()
  const roboticWords: string[] = []
  const roboticPhrases: string[] = []
  let roboticScore = 0
  
  console.log(`🤖 [ROBOTIC-FILTER] === ANALIZANDO CONTENIDO ROBÓTICO ===`)
  console.log(`🤖 [ROBOTIC-FILTER] Contenido: ${content.length} caracteres`)
  
  // Detectar palabras robóticas
  ROBOTIC_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = content.match(regex)
    if (matches) {
      roboticWords.push(word)
      roboticScore += matches.length * 10 // 10 puntos por palabra robótica
      console.log(`🤖 [ROBOTIC-FILTER] Palabra robótica encontrada: "${word}" (${matches.length} veces)`)
    }
  })
  
  // Detectar frases robóticas
  ROBOTIC_PHRASES.forEach(phrase => {
    if (lowerContent.includes(phrase.toLowerCase())) {
      roboticPhrases.push(phrase)
      roboticScore += 20 // 20 puntos por frase robótica
      console.log(`🤖 [ROBOTIC-FILTER] Frase robótica encontrada: "${phrase}"`)
    }
  })
  
  // Detectar patrones robóticos
  ROBOTIC_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      roboticScore += 15 // 15 puntos por patrón robótico
      console.log(`🤖 [ROBOTIC-FILTER] Patrón robótico ${index + 1} encontrado`)
    }
  })
  
  // Penalizar inicios robóticos (más graves)
  const firstSentence = content.split('.')[0]
  if (firstSentence) {
    ROBOTIC_WORDS.forEach(word => {
      if (firstSentence.toLowerCase().includes(word)) {
        roboticScore += 25 // Penalización extra por inicio robótico
        console.log(`🤖 [ROBOTIC-FILTER] INICIO ROBÓTICO detectado: "${word}"`)
      }
    })
  }
  
  const isRobotic = roboticScore > 30 || roboticWords.length > 2 || roboticPhrases.length > 0
  
  // Generar sugerencias
  const suggestions = []
  if (roboticWords.length > 0) {
    suggestions.push(`Evita palabras robóticas: ${roboticWords.slice(0, 3).join(', ')}`)
  }
  if (roboticPhrases.length > 0) {
    suggestions.push(`Evita frases robóticas: ${roboticPhrases.slice(0, 2).join(', ')}`)
  }
  if (isRobotic) {
    suggestions.push('Usa un tono más natural y directo')
    suggestions.push('Comienza con información práctica, no con preguntas dramáticas')
    suggestions.push('Evita adjetivos excesivamente dramáticos')
  }
  
  console.log(`🤖 [ROBOTIC-FILTER] === RESULTADO DEL ANÁLISIS ===`)
  console.log(`🤖 [ROBOTIC-FILTER] Es robótico: ${isRobotic}`)
  console.log(`🤖 [ROBOTIC-FILTER] Score robótico: ${roboticScore}/100`)
  console.log(`🤖 [ROBOTIC-FILTER] Palabras robóticas: ${roboticWords.length}`)
  console.log(`🤖 [ROBOTIC-FILTER] Frases robóticas: ${roboticPhrases.length}`)
  
  return {
    isRobotic,
    roboticWords,
    roboticPhrases,
    score: Math.min(roboticScore, 100),
    suggestions
  }
}

/**
 * Genera instrucciones específicas para la IA para evitar contenido robótico
 */
export function generateAntiRoboticInstructions(): string {
  return `
🚫 **PROHIBIDO ABSOLUTO - PALABRAS Y FRASES ROBÓTICAS:**

**NUNCA uses estas palabras de inicio:**
- ❌ "¿Sueñas con...", "¿Anhelas...", "¿Te imaginas..."
- ❌ "Descubre el fascinante mundo de..."
- ❌ "Sumérgete en...", "Embárcate en...", "Adéntrate en..."
- ❌ "Explora las maravillas de..."

**NUNCA uses adjetivos excesivos:**
- ❌ fascinante, extraordinario, increíble, asombroso
- ❌ espectacular, maravilloso, deslumbrante, mágico

**NUNCA uses transiciones robóticas:**
- ❌ "Además", "Asimismo", "Por otro lado"
- ❌ "Cabe destacar que", "Es importante mencionar"
- ❌ "Vale la pena señalar"

**NUNCA uses cierres robóticos:**
- ❌ "En conclusión", "Para finalizar", "En resumen"
- ❌ "Como hemos visto", "Sin lugar a dudas"

**✅ EN SU LUGAR, USA:**
- Comienza directamente con información útil
- Usa un tono natural y conversacional
- Emplea adjetivos moderados: útil, importante, práctico
- Usa transiciones simples: también, además, otra opción
- Termina con información práctica, no con resúmenes dramáticos

**EJEMPLO CORRECTO:**
"La pesca en el Amazonas requiere técnicas específicas. Los pescadores locales utilizan..."

**EJEMPLO INCORRECTO:**
"¿Sueñas con descubrir el fascinante mundo de la pesca en el Amazonas? Sumérgete en esta increíble aventura..."
`
}

/**
 * Limpia automáticamente el contenido robótico reemplazándolo con alternativas naturales
 */
export function cleanRoboticContent(content: string): string {
  let cleanedContent = content
  
  console.log(`🤖 [ROBOTIC-CLEANER] === LIMPIANDO CONTENIDO ROBÓTICO ===`)
  
  // Reemplazar palabras robóticas con alternativas naturales
  Object.entries(NATURAL_ALTERNATIVES).forEach(([robotic, alternatives]) => {
    const regex = new RegExp(`\\b${robotic}\\b`, 'gi')
    if (regex.test(cleanedContent)) {
      const alternative = alternatives[Math.floor(Math.random() * alternatives.length)]
      cleanedContent = cleanedContent.replace(regex, alternative)
      console.log(`🤖 [ROBOTIC-CLEANER] Reemplazado: "${robotic}" → "${alternative}"`)
    }
  })
  
  // Limpiar frases robóticas específicas
  ROBOTIC_PHRASES.forEach(phrase => {
    if (cleanedContent.toLowerCase().includes(phrase.toLowerCase())) {
      // Reemplazar con versión más natural
      cleanedContent = cleanedContent.replace(new RegExp(phrase, 'gi'), '')
      console.log(`🤖 [ROBOTIC-CLEANER] Frase robótica removida: "${phrase}"`)
    }
  })
  
  // Limpiar inicios robóticos específicos
  cleanedContent = cleanedContent.replace(/^¿(sueñas|anhelas|imaginas)[^.]*\./i, '')
  cleanedContent = cleanedContent.replace(/^(descubre el fascinante|sumérgete en el|embárcate en)[^.]*\./i, '')
  
  // Limpiar espacios extra
  cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim()
  
  console.log(`🤖 [ROBOTIC-CLEANER] Contenido limpiado: ${cleanedContent.length} caracteres`)
  
  return cleanedContent
}

/**
 * Valida que el contenido no sea robótico antes de enviarlo
 */
export function validateNonRoboticContent(content: string): {
  isValid: boolean
  issues: string[]
  cleanedContent: string
} {
  const analysis = analyzeRoboticContent(content)
  const cleanedContent = analysis.isRobotic ? cleanRoboticContent(content) : content
  
  const issues = []
  if (analysis.isRobotic) {
    issues.push(`Contenido robótico detectado (score: ${analysis.score}/100)`)
  }
  if (analysis.roboticWords.length > 0) {
    issues.push(`Palabras robóticas: ${analysis.roboticWords.join(', ')}`)
  }
  if (analysis.roboticPhrases.length > 0) {
    issues.push(`Frases robóticas: ${analysis.roboticPhrases.join(', ')}`)
  }
  
  return {
    isValid: !analysis.isRobotic,
    issues,
    cleanedContent
  }
}
