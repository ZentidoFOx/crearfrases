// Utility helpers extracted from step2-titles.tsx

export const normalizeText = (text: string): string => {
  return text.toLowerCase().trim()
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

export const isArtificialTitle = (title: string): boolean => {
  const lowerTitle = title.toLowerCase()

  const pompousWords = [
    'crucial', 'intrincado', 'pivotal', 'meticuloso', 'imprescindible',
    'revolucionar', 'fundamental', 'esencial', 'clave', 'primordial',
    'sustancial', 'considerable', 'notable', 'significativo'
  ]

  const roboticVerbs = [
    'aprovechar', 'embarcarse', 'profundizar', 'optimizar', 'potenciar',
    'utilizar', 'facilitar', 'maximizar', 'implementar', 'ejecutar',
    'analice', 'explore', 'descubre', 'navegue', 'examine'
  ]

  const exaggeratedDescriptors = [
    'vibrante', 'vital', 'dinámico', 'versátil', 'exhaustivo',
    'completo', 'integral', 'intrigante', 'fascinante', 'cautivador',
    'impresionante', 'asombroso', 'increíble', 'espectacular'
  ]

  const abstractConcepts = [
    'tapiz', 'reino', 'panorama', 'ecosistema', 'esfera',
    'interacción', 'resonar', 'elevar', 'transformar',
    'inmersión', 'conexión', 'sinergia', 'dimensión'
  ]

  const aiPhrases = [
    'descubre las maravillas', 'explora el mundo de', 'sumérgete en',
    '¿alguna vez has soñado?', '¿te imaginas poder?',
    'es importante tener en cuenta', 'es importante notar',
    'vale la pena mencionar', 'cabe destacar que',
    'en el mundo de', 'en el ámbito de', 'en el contexto de',
    'juegan un papel importante', 'desempeñan un rol clave',
    'tiene como objetivo', 'busca proporcionar',
    'navegar por el paisaje', 'recorrer el camino'
  ]

  const aiConnectors = [
    'en resumen', 'en conclusión', 'para resumir',
    'recuerda que', 'no olvides que', 'ten en cuenta que',
    'echale un vistazo', 'dale una oportunidad',
    'profundizar en', 'ahondar en', 'adentrarse en',
    'aprovechar al máximo', 'sacar el máximo provecho'
  ]

  const aiAdjectives = [
    'mejorar', 'ofrendas', 'escaparate', 'subraya', 'exhibición',
    'remarcó', 'alinea', 'garantizar', 'impulsar', 'fomentar'
  ]

  const classicArtificial = [
    'guía definitiva', 'guía completa', 'guía ultimate',
    'secretos revelados', 'secretos ocultos', 'secretos increíbles',
    'imperdible', 'exclusivo', 'top ', 'mejores ', ' mejores',
    'paso a paso', 'tutorial completo'
  ]

  const allProhibitedWords = [
    ...pompousWords,
    ...roboticVerbs,
    ...exaggeratedDescriptors,
    ...abstractConcepts,
    ...aiPhrases,
    ...aiConnectors,
    ...aiAdjectives,
    ...classicArtificial
  ]

  const hasProhibitedContent = allProhibitedWords.some(phrase => lowerTitle.includes(phrase))
  return hasProhibitedContent
}

export const isDuplicateTitle = (newTitle: string, existingTitles: string[]): boolean => {
  const normalizedNew = normalizeText(newTitle)
  return existingTitles.some(existing => normalizeText(existing) === normalizedNew)
}

export const containsCompleteKeyword = (title: string, keyword: string): boolean => {
  const normalizedTitle = normalizeText(title)
  const normalizedKeyword = normalizeText(keyword)
  return normalizedTitle.includes(normalizedKeyword)
}

export const hasValidLengths = (titleData: { title: string; description: string }): boolean => {
  const titleLength = titleData.title.length
  const descriptionLength = titleData.description.length
  const titleValid = titleLength >= 40 && titleLength <= 70
  const descriptionValid = descriptionLength >= 120 && descriptionLength <= 180
  return titleValid && descriptionValid
}

export const containsKeyword = (text: string, keyword: string): boolean => {
  if (!text || !keyword) return false
  const normalizedText = normalizeText(text)
  const normalizedKeyword = normalizeText(keyword)
  return normalizedText.includes(normalizedKeyword)
}
