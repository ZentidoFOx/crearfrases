import { containsKeyword, isArtificialTitle, normalizeText } from './utils'
import type { TitleData } from './types'

export const calculateRealSEOScore = (titleData: TitleData, keyword: string): number => {
  let score = 0

  // 1. Keyword en título (30 puntos)
  if (containsKeyword(titleData.title, keyword)) {
    const normalizedTitle = normalizeText(titleData.title)
    const normalizedKeyword = normalizeText(keyword)
    if (normalizedTitle.startsWith(normalizedKeyword)) {
      score += 30
    } else {
      score += 25
    }
  }

  // 2. Keyword en descripción (25 puntos)
  if (containsKeyword(titleData.description, keyword)) {
    score += 25
  }

  // 3. Longitud del título (20 puntos)
  const titleLength = titleData.title.length
  if (titleLength >= 50 && titleLength <= 60) {
    score += 20
  } else if (titleLength >= 45 && titleLength <= 65) {
    score += 15
  } else if (titleLength >= 40 && titleLength <= 70) {
    score += 10
  }

  // 4. Longitud de la descripción (15 puntos)
  const descLength = titleData.description.length
  if (descLength >= 150 && descLength <= 160) {
    score += 15
  } else if (descLength >= 140 && descLength <= 170) {
    score += 12
  } else if (descLength >= 120 && descLength <= 180) {
    score += 8
  }

  // 5. Bonus por naturalidad (10 puntos)
  if (!isArtificialTitle(titleData.title)) {
    score += 10
  }

  return Math.min(score, 100)
}

export const getSEOBreakdown = (titleData: TitleData, keyword: string) => {
  const lowerTitle = titleData.title.toLowerCase()
  const lowerDescription = titleData.description.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const combined = `${titleData.title} ${titleData.description}`.toLowerCase()

  const factors = [
    {
      name: 'Keyword en Título',
      status: lowerTitle.includes(lowerKeyword),
      bonus: lowerTitle.startsWith(lowerKeyword) ? 'Al inicio' : null,
      weight: 25
    },
    {
      name: 'Keyword en Descripción',
      status: lowerDescription.includes(lowerKeyword),
      bonus: (lowerDescription.match(new RegExp(lowerKeyword, 'g')) || []).length >= 2 ? 'Múltiples' : null,
      weight: 20
    },
    {
      name: 'Longitud Título',
      status: titleData.title.length >= 50 && titleData.title.length <= 60,
      bonus: `${titleData.title.length} chars`,
      weight: 15
    },
    {
      name: 'Longitud Descripción',
      status: titleData.description.length >= 150 && titleData.description.length <= 160,
      bonus: `${titleData.description.length} chars`,
      weight: 15
    },
    {
      name: 'Palabras de Poder',
      status: ['guía', 'completa', 'mejor', 'mejores', 'top', 'secretos', 'cómo', 'tutorial', 'paso a paso', 'definitiva', 'increíble', 'imperdible', 'exclusivo', 'nuevo', 'actualizado'].some(word => lowerTitle.includes(word) || lowerDescription.includes(word)),
      bonus: null,
      weight: 10
    },
    {
      name: 'Números/Años',
      status: /\d+/.test(titleData.title) || titleData.title.includes('2024') || titleData.title.includes('2025'),
      bonus: null,
      weight: 5
    },
    {
      name: 'Keywords Relacionadas',
      status: titleData.keywords && titleData.keywords.some(kw => combined.includes(kw.toLowerCase())),
      bonus: titleData.keywords ? `${titleData.keywords.filter(kw => combined.includes(kw.toLowerCase())).length}/${titleData.keywords.length}` : null,
      weight: 10
    }
  ]

  return factors
}

export const getSEOScore = (titleData: TitleData, keyword: string): number => {
  return titleData.seoScore.overall || calculateRealSEOScore(titleData, keyword)
}
