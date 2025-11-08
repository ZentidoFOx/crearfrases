"use client"

import React, { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWebsite } from '@/contexts/website-context'
import { OutlineEditorAdvanced } from '../outline-editor-advanced'

// Types
import { Step3ContentProps, DetailLevel } from './types'

// Utils
import { generateMarkdown } from './utils'

// Hooks
import { useContentGeneration } from './hooks/useContentGeneration'
import { useSaveArticle } from './hooks/useSaveArticle'

// Components
import { PlannerConfig } from './components/PlannerConfig'
import { SidebarTabs } from './components/SidebarTabs'
import { InfoPanel } from './components/InfoPanel'
import { LoadingOutline, LoadingContent } from './components/LoadingStates'

export function Step3Content({ 
  keyword, 
  title, 
  h1Title: initialH1Title, 
  description, 
  keywords, 
  objectivePhrase, 
  onContentGenerated, 
  onBack 
}: Step3ContentProps) {
  const { activeWebsite } = useWebsite()
  
  // Planificador de contenido
  const [showPlanner, setShowPlanner] = useState(true)
  const [numSections, setNumSections] = useState(5)
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('medium')
  
  // H1 Title (diferente del SEO title)
  const [h1Title, setH1Title] = useState(initialH1Title || title)
  
  // Hooks
  const contentGeneration = useContentGeneration()
  const saveArticle = useSaveArticle()

  const handleGenerateOutline = async () => {
    setShowPlanner(false)
    await contentGeneration.generateOutline(title, keyword, numSections, detailLevel)
  }

  const handleGenerateContent = async () => {
    try {
      const result = await contentGeneration.generateContent(
        title,
        keyword,
        numSections,
        detailLevel,
        description,
        undefined, // No llamar onContentGenerated para evitar mostrar el editor
        undefined // Ya no necesitamos el callback de SEO, se analiza en AnalyticsTab
      )
      
      // Generar markdown del contenido
      const markdown = generateMarkdown(result.content)
      
      // Guardar automáticamente y redirigir SIN actualizar el estado del editor
      await handleSaveArticleWithContent(markdown)
    } catch (error) {
      console.error('Error generando contenido:', error)
      // El error ya se maneja en el hook
    }
  }
  
  const handleSaveArticleWithContent = async (content: string) => {
    if (!content) {
      alert('No hay contenido para guardar')
      return
    }

    // Extraer secciones del contenido markdown
    const sectionsMatch = content.match(/##\s+([^\n]+)/g)
    const sections = sectionsMatch?.map((heading, idx) => {
      const title = heading.replace(/^##\s+/, '')
      return {
        heading: title,
        content: '',
        order: idx
      }
    }) || []

    const articleData = {
      title: title,
      h1_title: h1Title,
      keyword: keyword,
      objective_phrase: objectivePhrase || undefined,
      keywords_array: keywords && keywords.length > 0 ? keywords : undefined,
      content: content,
      sections_json: sections.length > 0 ? sections : undefined,
      meta_description: description || undefined,
      // SEO data se calcula dinámicamente en AnalyticsTab con readability-scores
      seo_data: undefined,
      website_id: activeWebsite?.id,
      language: 'es',
      content_type: 'planner' as const,
      status: 'draft' as const
    }

    await saveArticle.saveAndRedirect(articleData)
  }

  const handleRegenerateOutline = async () => {
    await contentGeneration.generateOutline(title, keyword, numSections, detailLevel)
  }

  return (
    <div className="bg-white">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Info (Sticky) */}
        <SidebarTabs
          showPlanner={showPlanner}
          keyword={keyword}
          title={title}
          description={description}
          keywords={keywords}
          h1Title={h1Title}
          onH1TitleChange={setH1Title}
          onTitleChange={() => {}} // No se usa
          onDescriptionChange={() => {}} // No se usa
          onKeywordsChange={() => {}} // No se usa
        />

        {/* RIGHT COLUMN - Content */}
        <div className="lg:col-span-2 bg-white border-2 border-gray-200 rounded-xl p-6">
          {/* Planificador de Contenido */}
          {showPlanner && (
            <PlannerConfig
              numSections={numSections}
              setNumSections={setNumSections}
              detailLevel={detailLevel}
              setDetailLevel={setDetailLevel}
              isGeneratingOutline={contentGeneration.isGeneratingOutline}
              onGenerateOutline={handleGenerateOutline}
              onBack={onBack}
            />
          )}

          {/* Outline Editor (Vista Previa del Esqueleto) */}
          {!showPlanner && contentGeneration.showOutline && contentGeneration.outline.length > 0 && !contentGeneration.isGenerating && (
            <OutlineEditorAdvanced
              outline={contentGeneration.outline}
              keyword={keyword}
              introParagraphs={contentGeneration.introParagraphs}
              onOutlineChange={contentGeneration.setOutline}
              onIntroParagraphsChange={contentGeneration.setIntroParagraphs}
              onGenerate={handleGenerateContent}
              onRegenerate={handleRegenerateOutline}
              onBack={() => setShowPlanner(true)}
            />
          )}

          {/* Error Message */}
          {contentGeneration.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{contentGeneration.error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State - Generating Outline */}
          {contentGeneration.isGeneratingOutline && (
            <LoadingOutline numSections={numSections} />
          )}

          {/* Loading State - Generating Content */}
          {contentGeneration.isGenerating && (
            <LoadingContent generationStep={contentGeneration.generationStep} />
          )}
        </div>
      </div>

      {/* Information Panel - Modern Design */}
      <InfoPanel />
    </div>
  )
}
