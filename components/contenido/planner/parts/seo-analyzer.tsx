'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Loader2
} from 'lucide-react'

interface SEOIssue {
  id: string
  type: 'error' | 'warning' | 'success'
  category: 'keyword' | 'structure' | 'links' | 'length' | 'readability'
  title: string
  description: string
  currentValue?: string | number
  expectedValue?: string | number
  severity: number // 1-10
}

interface SEOAnalyzerProps {
  content: string
  keyword: string
  title: string
  metaDescription: string
}

export function SEOAnalyzer({
  content,
  keyword,
  title,
  metaDescription
}: SEOAnalyzerProps) {
  const [issues, setIssues] = useState<SEOIssue[]>([])
  const [score, setScore] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)

  // Analizar contenido cuando cambie
  useEffect(() => {
    analyzeContent()
  }, [content, keyword, title, metaDescription])

  // Función principal de análisis
  const analyzeContent = () => {
    setAnalyzing(true)
    const detectedIssues: SEOIssue[] = []
    let currentScore = 100

    // 1. ✅ ANÁLISIS DE PALABRA CLAVE
    const keywordCount = countKeywordOccurrences(content, keyword)
    const keywordInTitle = title.toLowerCase().includes(keyword.toLowerCase())

    if (keywordCount === 0) {
      detectedIssues.push({
        id: 'keyword-missing',
        type: 'error',
        category: 'keyword',
        title: 'Palabra clave no encontrada',
        description: `La palabra clave "${keyword}" NO aparece en el contenido. Úsala al menos 3 veces.`,
        currentValue: 0,
        expectedValue: '3-5',
        severity: 10
      })
      currentScore -= 20
    } else if (keywordCount < 3) {
      detectedIssues.push({
        id: 'keyword-low',
        type: 'warning',
        category: 'keyword',
        title: 'Uso insuficiente de palabra clave',
        description: `La palabra clave "${keyword}" solo aparece ${keywordCount} ${keywordCount === 1 ? 'vez' : 'veces'}. Úsala al menos 3 veces.`,
        currentValue: keywordCount,
        expectedValue: '3-5',
        severity: 7
      })
      currentScore -= 10
    } else if (keywordCount > 10) {
      detectedIssues.push({
        id: 'keyword-spam',
        type: 'warning',
        category: 'keyword',
        title: 'Sobreuso de palabra clave',
        description: `La palabra clave aparece ${keywordCount} veces. Reduce a 5-7 para evitar keyword stuffing.`,
        currentValue: keywordCount,
        expectedValue: '5-7',
        severity: 6
      })
      currentScore -= 8
    } else {
      detectedIssues.push({
        id: 'keyword-optimal',
        type: 'success',
        category: 'keyword',
        title: 'Densidad de palabra clave óptima',
        description: `La palabra clave aparece ${keywordCount} veces. ¡Perfecto!`,
        currentValue: keywordCount,
        expectedValue: '3-5',
        severity: 0
      })
    }

    if (!keywordInTitle) {
      detectedIssues.push({
        id: 'keyword-title',
        type: 'warning',
        category: 'keyword',
        title: 'Palabra clave no en título',
        description: `El título no contiene la palabra clave "${keyword}". Agrégala para mejorar SEO.`,
        severity: 5
      })
      currentScore -= 5
    }

    // 2. ✅ ANÁLISIS DE ESTRUCTURA
    const h2Count = (content.match(/^## /gm) || []).length
    const h3Count = (content.match(/^### /gm) || []).length

    if (h2Count === 0) {
      detectedIssues.push({
        id: 'h2-missing',
        type: 'error',
        category: 'structure',
        title: 'Sin subtítulos H2',
        description: 'No hay subtítulos H2. Agrega al menos 3 para mejorar la estructura.',
        currentValue: 0,
        expectedValue: '3-5',
        severity: 8
      })
      currentScore -= 15
    } else if (h2Count < 3) {
      detectedIssues.push({
        id: 'h2-low',
        type: 'warning',
        category: 'structure',
        title: 'Pocos subtítulos H2',
        description: `Solo ${h2Count} subtítulos H2. Agrega más para mejorar la estructura.`,
        currentValue: h2Count,
        expectedValue: '3-5',
        severity: 6
      })
      currentScore -= 8
    } else {
      detectedIssues.push({
        id: 'h2-good',
        type: 'success',
        category: 'structure',
        title: 'Buena estructura de encabezados',
        description: `${h2Count} subtítulos H2. Buena organización.`,
        currentValue: h2Count,
        severity: 0
      })
    }

    // 3. ✅ ANÁLISIS DE ENLACES
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length
    
    if (linkCount === 0) {
      detectedIssues.push({
        id: 'links-missing',
        type: 'warning',
        category: 'links',
        title: 'Sin enlaces internos',
        description: 'No hay enlaces. Agrega al menos 2 enlaces internos.',
        currentValue: 0,
        expectedValue: '2-3',
        severity: 5
      })
      currentScore -= 5
    } else if (linkCount < 2) {
      detectedIssues.push({
        id: 'links-low',
        type: 'warning',
        category: 'links',
        title: 'Pocos enlaces',
        description: `Solo ${linkCount} enlace. Agrega más para mejor SEO.`,
        currentValue: linkCount,
        expectedValue: '2-3',
        severity: 4
      })
      currentScore -= 3
    } else {
      detectedIssues.push({
        id: 'links-good',
        type: 'success',
        category: 'links',
        title: 'Buenos enlaces',
        description: `${linkCount} enlaces encontrados. ¡Excelente!`,
        currentValue: linkCount,
        severity: 0
      })
    }

    // 4. ✅ ANÁLISIS DE LONGITUD
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
    
    if (wordCount < 300) {
      detectedIssues.push({
        id: 'length-short',
        type: 'error',
        category: 'length',
        title: 'Contenido muy corto',
        description: `Solo ${wordCount} palabras. Se recomiendan al menos 800 palabras.`,
        currentValue: wordCount,
        expectedValue: '800+',
        severity: 9
      })
      currentScore -= 20
    } else if (wordCount < 800) {
      detectedIssues.push({
        id: 'length-low',
        type: 'warning',
        category: 'length',
        title: 'Contenido corto',
        description: `${wordCount} palabras. Agrega más contenido (800+ recomendado).`,
        currentValue: wordCount,
        expectedValue: '800+',
        severity: 7
      })
      currentScore -= 10
    } else {
      detectedIssues.push({
        id: 'length-good',
        type: 'success',
        category: 'length',
        title: 'Longitud óptima',
        description: `${wordCount} palabras. ¡Perfecto!`,
        currentValue: wordCount,
        severity: 0
      })
    }

    // 5. ✅ ANÁLISIS DE READABILITY
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0)
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 100)

    if (longParagraphs.length > 0) {
      detectedIssues.push({
        id: 'paragraphs-long',
        type: 'warning',
        category: 'readability',
        title: 'Párrafos muy largos',
        description: `${longParagraphs.length} párrafos tienen más de 100 palabras. Divide para mejor lectura.`,
        currentValue: longParagraphs.length,
        severity: 4
      })
      currentScore -= 5
    }

    // 6. ✅ ANÁLISIS DE META DESCRIPCIÓN
    if (!metaDescription || metaDescription.length < 120) {
      detectedIssues.push({
        id: 'meta-short',
        type: 'warning',
        category: 'keyword',
        title: 'Meta descripción corta',
        description: `Meta descripción tiene ${metaDescription?.length || 0} caracteres. Recomendado: 120-160.`,
        currentValue: metaDescription?.length || 0,
        expectedValue: '120-160',
        severity: 5
      })
      currentScore -= 5
    } else if (metaDescription.length > 160) {
      detectedIssues.push({
        id: 'meta-long',
        type: 'warning',
        category: 'keyword',
        title: 'Meta descripción larga',
        description: `Meta descripción tiene ${metaDescription.length} caracteres. Se truncará en Google.`,
        currentValue: metaDescription.length,
        expectedValue: '120-160',
        severity: 3
      })
      currentScore -= 3
    }

    setIssues(detectedIssues)
    setScore(Math.max(0, currentScore))
    setAnalyzing(false)
  }

  // Contar ocurrencias de palabra clave
  const countKeywordOccurrences = (text: string, keyword: string): number => {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    return (text.match(regex) || []).length
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#ff6900' }} />
        <h3 className="text-xs font-bold" style={{ color: '#000000' }}>Análisis y Sugerencias</h3>
        <span className="ml-auto text-[10px] text-gray-500">{score} puntos</span>
      </div>

      {analyzing ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="ml-2 text-xs text-gray-500">Analizando...</span>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-start gap-2"
            >
              {issue.type === 'error' && (
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              )}
              {issue.type === 'warning' && (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#ff6900' }} />
              )}
              {issue.type === 'success' && (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#009689' }} />
              )}
              
              <p className="text-xs flex-1 leading-relaxed text-gray-700">
                {issue.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
