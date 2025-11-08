import { useState } from 'react'
import { geminiService } from '@/lib/api/gemini'
import { DetailLevel, GenerationStep } from '../types'

export interface OutlineSection {
  id: string
  type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
  title: string
  paragraphs: number
  characters: number
  items?: number
}

export const useContentGeneration = () => {
  const [content, setContent] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [generationStep, setGenerationStep] = useState<GenerationStep>('content')
  
  // Outline states
  const [outline, setOutline] = useState<OutlineSection[]>([])
  const [showOutline, setShowOutline] = useState(false)
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  const [introParagraphs, setIntroParagraphs] = useState(2)

  const generateOutline = async (
    title: string,
    keyword: string,
    numSections: number,
    detailLevel: DetailLevel
  ) => {
    setIsGeneratingOutline(true)
    setError('')

    try {
      const generatedOutline = await geminiService.generateOutline(
        title,
        keyword,
        numSections,
        detailLevel
      )
      
      // Agregar IDs únicos a cada sección
      const outlineWithIds = generatedOutline.map((section, index) => ({
        ...section,
        id: `section-${Date.now()}-${index}`
      }))
      
      setOutline(outlineWithIds)
      setShowOutline(true)
      return outlineWithIds
    } catch (err: any) {
      console.error('Error generando outline:', err)
      setError(err.message || 'Error al generar estructura')
      throw err
    } finally {
      setIsGeneratingOutline(false)
    }
  }

  const generateContent = async (
    title: string,
    keyword: string,
    numSections: number,
    detailLevel: DetailLevel,
    description?: string,
    onContentGenerated?: (content: any) => void,
    onSeoAnalysisGenerated?: (analysis: any) => void
  ) => {
    setIsGenerating(true)
    setError('')
    setGenerationStep('content')
    setShowOutline(false)

    try {
      // Convert outline to detailed structure for content generation
      const detailedOutline = outline.length > 0 
        ? outline.map(s => ({
            id: s.id,
            type: s.type,
            title: s.title,
            paragraphs: s.paragraphs,
            characters: s.characters,
            items: s.items
          }))
        : undefined

      console.log('🎯 Generando contenido con outline:', {
        hasOutline: !!detailedOutline,
        outlineLength: outline.length,
        outline: detailedOutline
      })

      // Use custom outline if available, otherwise let Gemini create it
      const generatedContent = await geminiService.generateContent(
        title, 
        keyword, 
        numSections, 
        detailLevel,
        introParagraphs,
        detailedOutline
      )
      
      setContent(generatedContent)
      onContentGenerated?.(generatedContent)

      setGenerationStep('done')
      
      return { content: generatedContent, analysis: null }
    } catch (err: any) {
      console.error('Error generando contenido:', err)
      setError(err.message || 'Error al generar contenido')
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    content,
    setContent,
    isGenerating,
    error,
    setError,
    generationStep,
    outline,
    setOutline,
    showOutline,
    setShowOutline,
    isGeneratingOutline,
    introParagraphs,
    setIntroParagraphs,
    generateOutline,
    generateContent
  }
}
