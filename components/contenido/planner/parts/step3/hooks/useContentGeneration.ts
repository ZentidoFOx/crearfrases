import { useState } from 'react'
import { aiService } from '@/lib/api/ai-service'
import { DetailLevel, GenerationStep } from '../types'

export interface OutlineSection {
  id: string
  type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
  title: string
  paragraphs: number
  characters: number
  items?: number
}

export const useContentGeneration = (modelId?: number) => {
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
    if (!modelId) {
      setError('No se ha seleccionado un modelo de IA')
      return
    }

    setIsGeneratingOutline(true)
    setError('')
    setOutline([]) // Limpiar outline anterior

    try {
      console.log('🚀 [STEP3] Iniciando generación de estructura con streaming...')
      console.log('🔑 [STEP3] Título:', title)
      console.log('📊 [STEP3] Secciones:', numSections)
      
      // Intentar con streaming primero
      const streamingSuccess = await aiService.generateOutlineStreaming(
        title,
        keyword,
        numSections,
        detailLevel,
        modelId,
        (newSection) => {
          console.log('🎯 [STEP3] Nueva sección recibida:', newSection.title)
          
          // Usar setState funcional para actualizar en tiempo real
          setOutline(prev => {
            const newOutline = [...prev, newSection]
            console.log('📋 [STEP3] Añadiendo sección. Total:', newOutline.length)
            return newOutline
          })
        }
      )
      
      // Si el streaming no fue exitoso, usar el método normal
      if (!streamingSuccess) {
        console.log('⚠️ [STEP3] Streaming no soportado, usando método normal...')
        
        const generatedOutline = await aiService.generateOutline(
          title,
          keyword,
          numSections,
          detailLevel,
          modelId
        )
        
        console.log('✅ [STEP3] Estructura generada con método normal:', generatedOutline.length)
        setOutline(generatedOutline)
        setShowOutline(true)
        return generatedOutline
      } else {
        console.log('✅ [STEP3] Streaming completado. Total:', outline.length)
        setShowOutline(true)
        return outline
      }
    } catch (err: any) {
      console.error('❌ [STEP3] Error generando outline:', err)
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
    if (!modelId) {
      setError('No se ha seleccionado un modelo de IA')
      throw new Error('No se ha seleccionado un modelo de IA')
    }

    setIsGenerating(true)
    setError('')
    setGenerationStep('content')
    setShowOutline(false)

    try {
      console.log('🚀 [STEP3-CONTENT] Iniciando generación de contenido con streaming...')
      console.log('🔑 [STEP3-CONTENT] Título:', title)
      console.log('📊 [STEP3-CONTENT] Outline:', outline.length, 'secciones')
      
      let accumulatedContent = ''
      
      // Intentar con streaming primero
      const streamingSuccess = await aiService.generateContentStreaming(
        title,
        keyword,
        introParagraphs,
        outline,
        modelId,
        (chunk) => {
          // Callback ejecutado por cada chunk de contenido
          accumulatedContent += chunk
          
          // Actualizar contenido en tiempo real
          const tempContent = {
            introduction: '',
            sections: [],
            conclusion: '',
            fullContent: accumulatedContent
          }
          
          setContent(tempContent)
          onContentGenerated?.(tempContent)
          
          console.log('📦 [STEP3-CONTENT] Contenido acumulado:', accumulatedContent.length, 'caracteres')
        }
      )
      
      // Si el streaming fue exitoso, parsear el contenido final
      if (streamingSuccess) {
        console.log('✅ [STEP3-CONTENT] Streaming completado. Total:', accumulatedContent.length, 'caracteres')
        
        // Parsear el contenido acumulado en secciones
        const parsedContent = parseContentSections(accumulatedContent)
        
        setContent(parsedContent)
        onContentGenerated?.(parsedContent)
        setGenerationStep('done')
        
        return { content: parsedContent, analysis: null }
      } else {
        // Si el streaming no fue exitoso, usar el método normal
        console.log('⚠️ [STEP3-CONTENT] Streaming no soportado, usando método normal...')
        
        const generatedContent = await aiService.generateContent(
          title,
          keyword,
          introParagraphs,
          outline,
          modelId
        )
        
        console.log('✅ [STEP3-CONTENT] Contenido generado con método normal')
        
        setContent(generatedContent)
        onContentGenerated?.(generatedContent)
        setGenerationStep('done')
        
        return { content: generatedContent, analysis: null }
      }
    } catch (err: any) {
      console.error('❌ [STEP3-CONTENT] Error generando contenido:', err)
      setError(err.message || 'Error al generar contenido')
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper function to parse content sections
  const parseContentSections = (fullContent: string) => {
    const sections: Array<{ heading: string; content: string; order: number }> = []
    let introduction = ''
    let conclusion = ''
    
    // Split by H2 headers
    const parts = fullContent.split(/(?=^## )/m)
    
    // First part is introduction
    if (parts.length > 0) {
      introduction = parts[0].trim()
    }
    
    // Process sections
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim()
      const lines = part.split('\n')
      const heading = lines[0].replace(/^##\s*/, '').trim()
      const content = lines.slice(1).join('\n').trim()
      
      sections.push({
        heading,
        content,
        order: i
      })
    }
    
    return {
      introduction,
      sections,
      conclusion,
      fullContent
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
