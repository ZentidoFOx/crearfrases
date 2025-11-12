import { useState, useRef, useCallback } from 'react'
import { translatorService } from '@/lib/api/translator'

interface TranslationSection {
  id: string
  title: string
  originalContent: string
  translatedContent: string
  status: 'pending' | 'translating' | 'completed' | 'error'
  error?: string
}

interface TranslatedMetadata {
  title: string
  h1Title: string
  description: string
  keyword: string
  objectivePhrase: string
  keywords: string[]
}

export function useTranslationBySection(modelId: number) {
  const [sections, setSections] = useState<TranslationSection[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [translatedMetadata, setTranslatedMetadata] = useState<TranslatedMetadata | null>(null)
  
  const shouldContinueRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Dividir HTML en secciones por <h2>
   */
  const splitContentIntoSections = (htmlContent: string): TranslationSection[] => {
    const sections: TranslationSection[] = []
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi
    const matches = [...htmlContent.matchAll(h2Regex)]

    if (matches.length === 0) {
      sections.push({
        id: 'content',
        title: 'Contenido Completo',
        originalContent: htmlContent,
        translatedContent: '',
        status: 'pending'
      })
      return sections
    }

    // Introducción (antes del primer H2)
    const firstH2Index = htmlContent.indexOf(matches[0][0])
    if (firstH2Index > 0) {
      const intro = htmlContent.substring(0, firstH2Index).trim()
      if (intro) {
        sections.push({
          id: 'intro',
          title: 'Introducción',
          originalContent: intro,
          translatedContent: '',
          status: 'pending'
        })
      }
    }

    // Secciones principales
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i]
      const currentH2 = currentMatch[1]
      const currentIndex = htmlContent.indexOf(currentMatch[0])
      
      const nextIndex = i < matches.length - 1 
        ? htmlContent.indexOf(matches[i + 1][0])
        : htmlContent.length
      
      const sectionContent = htmlContent.substring(currentIndex, nextIndex).trim()
      
      sections.push({
        id: `section-${i}`,
        title: currentH2,
        originalContent: sectionContent,
        translatedContent: '',
        status: 'pending'
      })
    }

    console.log(`📋 [TRANSLATE] Dividido en ${sections.length} secciones`)
    return sections
  }

  /**
   * Iniciar traducción completa
   */
  const startTranslation = async (
    htmlContent: string,
    targetLang: string,
    targetLangName: string,
    metadata: {
      title: string
      h1Title: string
      description: string
      keyword: string
      objectivePhrase: string
      keywords: string[]
    }
  ) => {
    console.log('🚀 [TRANSLATE] Iniciando traducción sección por sección')
    
    // Dividir en secciones
    const sectionsList = splitContentIntoSections(htmlContent)
    setSections(sectionsList)
    setProgress({ current: 0, total: sectionsList.length })
    
    setIsTranslating(true)
    setIsPaused(false)
    setError('')
    shouldContinueRef.current = true
    abortControllerRef.current = new AbortController()

    // Array para almacenar contenido traducido en orden
    const translatedSections: string[] = []

    try {
      // 1. Traducir metadatos primero
      console.log('📝 [TRANSLATE] Traduciendo metadatos...')
      const translatedMeta = await translatorService.translateMetadata(
        metadata,
        targetLang,
        targetLangName,
        modelId
      )
      setTranslatedMetadata(translatedMeta)
      console.log('✅ [TRANSLATE] Metadatos traducidos')

      // 2. Traducir cada sección
      for (let i = 0; i < sectionsList.length; i++) {
        if (!shouldContinueRef.current) {
          console.log('⏸️ [TRANSLATE] Pausado o cancelado')
          break
        }

        setCurrentIndex(i)
        const section = sectionsList[i]
        
        console.log(`🌐 [TRANSLATE] Traduciendo sección ${i + 1}/${sectionsList.length}: ${section.title}`)

        setSections(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'translating' as const } : s
        ))

        try {
          const translatedContent = await translatorService.translateSingleSection(
            section.originalContent,
            targetLang,
            targetLangName,
            modelId
          )

          // Guardar en array local
          translatedSections.push(translatedContent)

          // Actualizar estado
          setSections(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'completed' as const, translatedContent } : s
          ))

          setProgress({ current: i + 1, total: sectionsList.length })
          
          console.log(`✅ [TRANSLATE] Sección ${i + 1}/${sectionsList.length} completada (${translatedContent.length} chars)`)

          // Pausa entre secciones
          if (i < sectionsList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }

        } catch (err: any) {
          console.error(`❌ [TRANSLATE] Error en sección ${i}:`, err)
          
          setSections(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'error' as const, error: err.message } : s
          ))
        }
      }

      setIsTranslating(false)
      setCurrentIndex(-1)
      
      // Unir todas las secciones traducidas
      const fullTranslatedContent = translatedSections.join('\n\n')
      console.log('🎉 [TRANSLATE] Traducción completa')
      console.log(`📊 [TRANSLATE] Total secciones traducidas: ${translatedSections.length}/${sectionsList.length}`)
      console.log(`📏 [TRANSLATE] Contenido final length: ${fullTranslatedContent.length}`)

      return {
        metadata: translatedMeta,
        content: fullTranslatedContent
      }

    } catch (err: any) {
      console.error('❌ [TRANSLATE] Error general:', err)
      setError(err.message)
      setIsTranslating(false)
      setCurrentIndex(-1)
      throw err
    }
  }

  const pauseTranslation = useCallback(() => {
    console.log('⏸️ [TRANSLATE] Pausando...')
    shouldContinueRef.current = false
    setIsPaused(true)
    setIsTranslating(false)
  }, [])

  const resumeTranslation = useCallback(async (
    targetLang: string,
    targetLangName: string
  ) => {
    console.log('▶️ [TRANSLATE] Reanudando...')
    shouldContinueRef.current = true
    setIsPaused(false)
    setIsTranslating(true)

    const startIndex = currentIndex >= 0 ? currentIndex : 0

    for (let i = startIndex; i < sections.length; i++) {
      if (!shouldContinueRef.current) break

      const section = sections[i]

      if (section.status === 'pending' || section.status === 'error') {
        setCurrentIndex(i)

        setSections(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'translating' as const } : s
        ))

        try {
          const translatedContent = await translatorService.translateSingleSection(
            section.originalContent,
            targetLang,
            targetLangName,
            modelId
          )

          setSections(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'completed' as const, translatedContent } : s
          ))

          setProgress({ current: i + 1, total: sections.length })
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (err: any) {
          setSections(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'error' as const, error: err.message } : s
          ))
        }
      }
    }

    setIsTranslating(false)
    setCurrentIndex(-1)
  }, [currentIndex, sections, modelId])

  const cancelTranslation = useCallback(() => {
    console.log('❌ [TRANSLATE] Cancelando...')
    shouldContinueRef.current = false
    abortControllerRef.current?.abort()
    setIsTranslating(false)
    setIsPaused(false)
    setCurrentIndex(-1)
  }, [])

  const retrySection = useCallback(async (
    sectionIndex: number,
    targetLang: string,
    targetLangName: string
  ) => {
    const section = sections[sectionIndex]

    setSections(prev => prev.map((s, idx) => 
      idx === sectionIndex ? { ...s, status: 'translating' as const, error: undefined } : s
    ))

    try {
      const translatedContent = await translatorService.translateSingleSection(
        section.originalContent,
        targetLang,
        targetLangName,
        modelId
      )

      setSections(prev => prev.map((s, idx) => 
        idx === sectionIndex ? { ...s, status: 'completed' as const, translatedContent } : s
      ))

    } catch (err: any) {
      setSections(prev => prev.map((s, idx) => 
        idx === sectionIndex ? { ...s, status: 'error' as const, error: err.message } : s
      ))
    }
  }, [sections, modelId])

  const getFullTranslatedContent = useCallback((): string => {
    return sections
      .filter(s => s.status === 'completed' && s.translatedContent)
      .map(s => s.translatedContent)
      .join('\n\n')
  }, [sections])

  const reset = useCallback(() => {
    setSections([])
    setCurrentIndex(-1)
    setIsTranslating(false)
    setIsPaused(false)
    setError('')
    setProgress({ current: 0, total: 0 })
    setTranslatedMetadata(null)
    shouldContinueRef.current = true
  }, [])

  return {
    sections,
    currentIndex,
    isTranslating,
    isPaused,
    error,
    progress,
    translatedMetadata,
    startTranslation,
    pauseTranslation,
    resumeTranslation,
    cancelTranslation,
    retrySection,
    getFullTranslatedContent,
    reset
  }
}
