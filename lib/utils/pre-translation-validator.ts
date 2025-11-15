/**
 * 🚦 VALIDADOR PRE-TRADUCCIÓN
 * Valida que el artículo original cumpla con todos los requisitos SEO
 * antes de permitir traducciones
 */

export interface ValidationIssue {
  id: string
  category: 'estructura' | 'seo' | 'legibilidad' | 'multimedia' | 'enlaces'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  currentValue: string | number
  expectedValue: string | number
  autoFixable: boolean
}

export interface ValidationResult {
  isValid: boolean
  score: number // 0-100
  criticalIssues: ValidationIssue[]
  warnings: ValidationIssue[]
  infos: ValidationIssue[]
  allIssues: ValidationIssue[]
  canTranslate: boolean
}

export interface ArticleData {
  title: string
  content: string
  keyword: string
  h1Title?: string
  metaDescription?: string
}

/**
 * 🔍 Valida un artículo antes de traducir
 */
export function validateForTranslation(article: ArticleData): ValidationResult {
  const issues: ValidationIssue[] = []

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📐 VALIDACIÓN DE ESTRUCTURA BÁSICA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Validar H1 único
  const h1Count = (article.content.match(/<h1[^>]*>/gi) || []).length
  if (h1Count === 0) {
    issues.push({
      id: 'no-h1',
      category: 'estructura',
      severity: 'critical',
      title: 'Sin título H1',
      description: 'El artículo necesita un título H1 único',
      currentValue: 0,
      expectedValue: 1,
      autoFixable: true
    })
  } else if (h1Count > 1) {
    issues.push({
      id: 'multiple-h1',
      category: 'estructura',
      severity: 'warning',
      title: 'Múltiples H1',
      description: 'Debe haber solo un H1 por artículo',
      currentValue: h1Count,
      expectedValue: 1,
      autoFixable: true
    })
  }

  // Validar H2
  const h2Count = (article.content.match(/<h2[^>]*>/gi) || []).length
  if (h2Count < 5) {
    issues.push({
      id: 'insufficient-h2',
      category: 'estructura',
      severity: 'critical',
      title: 'Pocos subtítulos H2',
      description: 'Se necesitan al menos 5 H2 para buena estructura',
      currentValue: h2Count,
      expectedValue: '5+',
      autoFixable: false
    })
  }

  // Validar longitud del contenido
  const wordCount = article.content.split(/\s+/).filter(w => w.length > 0).length
  if (wordCount < 1200) {
    issues.push({
      id: 'short-content',
      category: 'estructura',
      severity: 'critical',
      title: 'Contenido muy corto',
      description: 'El artículo debe tener al menos 1,200 palabras',
      currentValue: wordCount,
      expectedValue: '1200+',
      autoFixable: false
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 VALIDACIÓN SEO ON-PAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const lowerContent = article.content.toLowerCase()
  const lowerKeyword = article.keyword.toLowerCase()
  const lowerTitle = article.title.toLowerCase()

  // Keyword en título
  if (!lowerTitle.includes(lowerKeyword)) {
    issues.push({
      id: 'keyword-not-in-title',
      category: 'seo',
      severity: 'critical',
      title: 'Keyword no está en el título',
      description: `El título debe contener "${article.keyword}"`,
      currentValue: 'No',
      expectedValue: 'Sí',
      autoFixable: false
    })
  }

  // Densidad de keyword
  const keywordOccurrences = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length
  const keywordDensity = (keywordOccurrences / wordCount) * 100

  if (keywordDensity < 0.5) {
    issues.push({
      id: 'low-keyword-density',
      category: 'seo',
      severity: 'warning',
      title: 'Densidad de keyword baja',
      description: 'El keyword debe aparecer entre 0.5% y 2.5% del contenido',
      currentValue: `${keywordDensity.toFixed(2)}%`,
      expectedValue: '0.5% - 2.5%',
      autoFixable: true
    })
  } else if (keywordDensity > 2.5) {
    issues.push({
      id: 'high-keyword-density',
      category: 'seo',
      severity: 'warning',
      title: 'Densidad de keyword alta',
      description: 'Demasiadas repeticiones pueden ser keyword stuffing',
      currentValue: `${keywordDensity.toFixed(2)}%`,
      expectedValue: '0.5% - 2.5%',
      autoFixable: true
    })
  }

  // Keyword en primer párrafo
  const firstParagraph = article.content.match(/<p[^>]*>(.*?)<\/p>/i)?.[1] || ''
  if (!firstParagraph.toLowerCase().includes(lowerKeyword)) {
    issues.push({
      id: 'keyword-not-in-first-paragraph',
      category: 'seo',
      severity: 'warning',
      title: 'Keyword no está en el primer párrafo',
      description: 'Es importante que el keyword aparezca al inicio',
      currentValue: 'No',
      expectedValue: 'Sí',
      autoFixable: true
    })
  }

  // Keyword en H2
  const h2WithKeyword = (article.content.match(new RegExp(`<h2[^>]*>[^<]*${lowerKeyword}[^<]*<\/h2>`, 'gi')) || []).length
  if (h2WithKeyword < 2) {
    issues.push({
      id: 'keyword-not-in-h2',
      category: 'seo',
      severity: 'warning',
      title: 'Keyword en pocos H2',
      description: 'El keyword debe aparecer en al menos 2 H2',
      currentValue: h2WithKeyword,
      expectedValue: '2+',
      autoFixable: false
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📖 VALIDACIÓN DE LEGIBILIDAD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Palabras de transición (español)
  const transitionWords = [
    'además', 'también', 'asimismo', 'por ejemplo', 'sin embargo',
    'por lo tanto', 'en consecuencia', 'no obstante', 'en primer lugar',
    'finalmente', 'por otro lado', 'de hecho', 'es decir', 'aunque',
    'mientras que', 'debido a', 'por esta razón', 'así pues'
  ]

  let transitionCount = 0
  const cleanText = article.content.replace(/<[^>]*>/g, ' ').toLowerCase()

  transitionWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g')
    const matches = cleanText.match(regex)
    if (matches) transitionCount += matches.length
  })

  const sentences = article.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const transitionPercentage = (transitionCount / sentences.length) * 100

  if (transitionPercentage < 30) {
    issues.push({
      id: 'low-transition-words',
      category: 'legibilidad',
      severity: 'critical',
      title: 'Pocas palabras de transición',
      description: 'Al menos el 30% de las oraciones deben tener palabras de transición',
      currentValue: `${transitionPercentage.toFixed(0)}%`,
      expectedValue: '30%+',
      autoFixable: true
    })
  }

  // Oraciones largas
  const longSentences = sentences.filter(sentence => {
    const sentenceWords = sentence.trim().split(/\s+/)
    return sentenceWords.length > 20
  }).length

  if (longSentences > sentences.length * 0.25) {
    issues.push({
      id: 'too-many-long-sentences',
      category: 'legibilidad',
      severity: 'warning',
      title: 'Muchas oraciones largas',
      description: 'Más del 25% de oraciones tienen más de 20 palabras',
      currentValue: longSentences,
      expectedValue: `< ${Math.ceil(sentences.length * 0.25)}`,
      autoFixable: true
    })
  }

  // Párrafos largos
  const paragraphs = article.content.match(/<p[^>]*>.*?<\/p>/gi) || []
  const longParagraphs = paragraphs.filter(p => {
    const pWords = p.replace(/<[^>]*>/g, '').split(/\s+/).length
    return pWords > 150
  }).length

  if (longParagraphs > 0) {
    issues.push({
      id: 'long-paragraphs',
      category: 'legibilidad',
      severity: 'warning',
      title: 'Párrafos muy largos',
      description: 'Los párrafos no deben exceder 150 palabras',
      currentValue: longParagraphs,
      expectedValue: 0,
      autoFixable: true
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🖼️ VALIDACIÓN DE MULTIMEDIA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Imágenes
  const imageCount = (article.content.match(/<img[^>]*>/gi) || []).length

  if (imageCount < 3) {
    issues.push({
      id: 'insufficient-images',
      category: 'multimedia',
      severity: 'critical',
      title: 'Pocas imágenes',
      description: 'El artículo debe tener al menos 3 imágenes',
      currentValue: imageCount,
      expectedValue: '3+',
      autoFixable: false
    })
  }

  // Imágenes sin alt
  const imagesWithoutAlt = (article.content.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length

  if (imagesWithoutAlt > 0) {
    issues.push({
      id: 'images-without-alt',
      category: 'multimedia',
      severity: 'critical',
      title: 'Imágenes sin atributo alt',
      description: 'Todas las imágenes deben tener texto alternativo',
      currentValue: imagesWithoutAlt,
      expectedValue: 0,
      autoFixable: true
    })
  }

  // Primera imagen
  const firstImagePosition = article.content.search(/<img[^>]*>/i)
  const first200Words = article.content.split(/\s+/).slice(0, 200).join(' ')
  const hasEarlyImage = first200Words.includes('<img')

  if (!hasEarlyImage && imageCount > 0) {
    issues.push({
      id: 'no-early-image',
      category: 'multimedia',
      severity: 'info',
      title: 'Primera imagen muy abajo',
      description: 'La primera imagen debe aparecer en las primeras 200 palabras',
      currentValue: 'No',
      expectedValue: 'Sí',
      autoFixable: false
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔗 VALIDACIÓN DE ENLACES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const linkCount = (article.content.match(/<a[^>]*>/gi) || []).length

  if (linkCount < 2) {
    issues.push({
      id: 'insufficient-links',
      category: 'enlaces',
      severity: 'warning',
      title: 'Pocos enlaces',
      description: 'Se recomiendan al menos 2-3 enlaces internos',
      currentValue: linkCount,
      expectedValue: '2-3',
      autoFixable: false
    })
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 CALCULAR RESULTADO FINAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const criticalIssues = issues.filter(i => i.severity === 'critical')
  const warnings = issues.filter(i => i.severity === 'warning')
  const infos = issues.filter(i => i.severity === 'info')

  // Calcular score
  let score = 100
  score -= criticalIssues.length * 15  // -15 por cada crítico
  score -= warnings.length * 5         // -5 por cada warning
  score -= infos.length * 2            // -2 por cada info
  score = Math.max(0, score)

  // Solo puede traducir si no hay problemas críticos
  const canTranslate = criticalIssues.length === 0

  return {
    isValid: canTranslate,
    score,
    criticalIssues,
    warnings,
    infos,
    allIssues: issues,
    canTranslate
  }
}

/**
 * 🎨 Obtiene color según severidad
 */
export function getSeverityColor(severity: 'critical' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical': return 'red'
    case 'warning': return 'yellow'
    case 'info': return 'blue'
  }
}

/**
 * 🎯 Obtiene ícono según categoría
 */
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'estructura': return '📐'
    case 'seo': return '🎯'
    case 'legibilidad': return '📖'
    case 'multimedia': return '🖼️'
    case 'enlaces': return '🔗'
    default: return '📋'
  }
}