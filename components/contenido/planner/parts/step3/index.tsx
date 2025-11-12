"use client"

import React, { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useWebsite } from '@/contexts/website-context'
import { OutlineEditorAdvanced } from '../outline-editor-advanced'

// Types
import { Step3ContentProps, DetailLevel } from './types'

// Utils
import { generateMarkdown, markdownToHtml } from './utils'

// Hooks
import { useContentGeneration } from './hooks/useContentGeneration'
import { useSaveArticle } from './hooks/useSaveArticle'
import { useSectionBySection } from './hooks/useSectionBySection'

// Components
import { PlannerConfig } from './components/PlannerConfig'
import { SidebarTabs } from './components/SidebarTabs'
import { InfoPanel } from './components/InfoPanel'
import { LoadingOutline, LoadingContent } from './components/LoadingStates'
import { SectionProgress } from './components/SectionProgress'
import { SectionCard } from './components/SectionCard'

export function Step3Content({ 
  keyword, 
  title, 
  h1Title: initialH1Title, 
  description, 
  keywords, 
  objectivePhrase,
  modelId,
  onContentGenerated, 
  onBack,
  initialData
}: Step3ContentProps) {
  const { activeWebsite } = useWebsite()
  
  // Planificador de contenido - inicializar con datos guardados
  const [showPlanner, setShowPlanner] = useState(initialData?.showPlanner ?? true)
  const [numSections, setNumSections] = useState(initialData?.numSections ?? 5)
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(initialData?.detailLevel ?? 'medium')
  
  // H1 Title (diferente del SEO title)
  const [h1Title, setH1Title] = useState(initialH1Title || title)
  
  // Hooks
  const contentGeneration = useContentGeneration(modelId)
  const saveArticle = useSaveArticle()
  const sectionBySection = useSectionBySection(modelId)
  
  // Restaurar outline y secciones si existen
  React.useEffect(() => {
    if (initialData?.outline && initialData.outline.length > 0) {
      contentGeneration.setOutline(initialData.outline)
      contentGeneration.setShowOutline(true)
      setShowPlanner(false)
      if (initialData.introParagraphs) {
        contentGeneration.setIntroParagraphs(initialData.introParagraphs)
      }
    }
  }, [initialData])

  const handleGenerateOutline = async () => {
    setShowPlanner(false)
    await contentGeneration.generateOutline(title, keyword, numSections, detailLevel)
  }

  const handleGenerateContent = async () => {
    try {
      // Iniciar generación sección por sección
      await sectionBySection.startGeneration(
        title,
        keyword,
        contentGeneration.outline,
        contentGeneration.introParagraphs,
        detailLevel
      )
      
      // Una vez completado, obtener el markdown con enforcement final y convertir a HTML
      const markdown = sectionBySection.getFullMarkdown(keyword)
      
      if (markdown) {
        // 🔥 CONVERTIR MARKDOWN A HTML antes de guardar
        console.log('🔄 [STEP3] Markdown obtenido, longitud:', markdown.length)
        console.log('🔄 [STEP3] Primeros 300 chars:', markdown.substring(0, 300))
        
        const htmlContent = markdownToHtml(markdown)
        
        console.log('✅ [STEP3] Contenido convertido de Markdown a HTML')
        console.log('📏 [STEP3] Markdown length:', markdown.length)
        console.log('📏 [STEP3] HTML length:', htmlContent.length)
        console.log('📄 [STEP3] Primeros 300 chars HTML:', htmlContent.substring(0, 300))
        
        await handleSaveArticleWithContent(htmlContent)
      }
    } catch (error) {
      console.error('Error generando contenido:', error)
      // El error ya se maneja en el hook
    }
  }

  const handleRegenerateSection = async (sectionIndex: number) => {
    try {
      await sectionBySection.regenerateSection(
        sectionIndex,
        title,
        keyword,
        contentGeneration.outline,
        detailLevel
      )
    } catch (error) {
      console.error('Error regenerando sección:', error)
    }
  }
  
  const handleSaveArticleWithContent = async (content: string) => {
    if (!content) {
      alert('No hay contenido para guardar')
      return
    }

    // 🔥 Extraer secciones del contenido HTML (buscar <h2> tags)
    const sectionsMatch = content.match(/<h2[^>]*>(.*?)<\/h2>/gi)
    const sections = sectionsMatch?.map((heading, idx) => {
      const title = heading.replace(/<\/?h2[^>]*>/gi, '').trim()
      return {
        heading: title,
        content: '',
        order: idx
      }
    }) || []

    console.log('💾 [SAVE] Guardando artículo con contenido HTML')
    console.log('📊 [SAVE] Secciones detectadas:', sections.length)
    console.log('📏 [SAVE] Tamaño del contenido:', content.length, 'caracteres')
    console.log('🔍 [SAVE] ¿Es HTML? Verificando tags...')
    console.log('   - Tiene <h2>:', content.includes('<h2>'))
    console.log('   - Tiene <p>:', content.includes('<p>'))
    console.log('   - Tiene <strong>:', content.includes('<strong>'))
    console.log('   - Tiene ## (markdown):', content.includes('##'))
    console.log('   - Tiene ** (markdown):', content.includes('**'))
    console.log('📄 [SAVE] Primeros 500 chars del content:', content.substring(0, 500))

    const articleData = {
      title: title,
      h1_title: h1Title,
      keyword: keyword,
      objective_phrase: objectivePhrase || undefined,
      keywords_array: keywords && keywords.length > 0 ? keywords : undefined,
      content: content, // 🔥 Ahora es HTML, no markdown
      sections_json: sections.length > 0 ? sections : undefined,
      meta_description: description || undefined,
      // SEO data se calcula dinámicamente en AnalyticsTab con readability-scores
      seo_data: undefined,
      website_id: activeWebsite?.id,
      language: 'es',
      content_type: 'planner' as const,
      status: 'draft' as const
    }
    
    console.log('📤 [SAVE] Enviando articleData.content (primeros 300 chars):', articleData.content.substring(0, 300))

    await saveArticle.saveAndRedirect(articleData)
  }

  const handleRegenerateOutline = async () => {
    await contentGeneration.generateOutline(title, keyword, numSections, detailLevel)
  }

  const handleBack = () => {
    // Guardar estado actual antes de volver
    const step3Data = {
      showPlanner,
      numSections,
      detailLevel,
      outline: contentGeneration.outline,
      introParagraphs: contentGeneration.introParagraphs,
      sections: sectionBySection.sections
    }
    
    // Llamar onBack con los datos
    onBack(step3Data)
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
              onBack={handleBack}
            />
          )}

          {/* Outline Editor (Vista Previa del Esqueleto) */}
          {!showPlanner && contentGeneration.showOutline && contentGeneration.outline.length > 0 && !contentGeneration.isGenerating && !sectionBySection.isGenerating && sectionBySection.sections.length === 0 && (
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
          {(contentGeneration.error || sectionBySection.error) && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{contentGeneration.error || sectionBySection.error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State - Generating Outline */}
          {contentGeneration.isGeneratingOutline && (
            <LoadingOutline numSections={numSections} />
          )}

          {/* Section by Section Generation Progress */}
          {(sectionBySection.isGenerating || sectionBySection.sections.length > 0) && (
            <div className="space-y-4">
              {/* Progress Panel */}
              <SectionProgress
                sections={sectionBySection.sections}
                currentSectionIndex={sectionBySection.currentSectionIndex}
                isGenerating={sectionBySection.isGenerating}
                isPaused={sectionBySection.isPaused}
                progress={sectionBySection.progress}
                error={sectionBySection.error}
                onPause={sectionBySection.pauseGeneration}
                onResume={() => sectionBySection.resumeGeneration(title, keyword, contentGeneration.outline, detailLevel)}
                onCancel={sectionBySection.cancelGeneration}
                onRegenerateSection={handleRegenerateSection}
                onBack={handleBack}
              />

              {/* Generated Sections Preview */}
              {sectionBySection.sections.filter(s => s.status === 'completed').length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Secciones Generadas</h3>
                  {sectionBySection.sections
                    .filter(s => s.status === 'completed')
                    .map((section, idx) => (
                      <SectionCard key={section.id} section={section} index={idx} />
                    ))}
                </div>
              )}

              {/* Save Button - Show when all completed */}
              {!sectionBySection.isGenerating && 
               sectionBySection.sections.length > 0 && 
               sectionBySection.sections.every(s => s.status === 'completed') && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      // 🔥 CONVERTIR MARKDOWN A HTML antes de guardar con enforcement final
                      const markdown = sectionBySection.getFullMarkdown(keyword)
                      console.log('🔄 [BUTTON] Markdown obtenido del botón, longitud:', markdown.length)
                      console.log('🔄 [BUTTON] Primeros 200 chars:', markdown.substring(0, 200))
                      
                      const htmlContent = markdownToHtml(markdown)
                      
                      console.log('✅ [BUTTON] Conversión completada')
                      console.log('📏 [BUTTON] HTML length:', htmlContent.length)
                      console.log('📄 [BUTTON] Primeros 200 chars HTML:', htmlContent.substring(0, 200))
                      
                      handleSaveArticleWithContent(htmlContent)
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Guardar Artículo Completo
                  </Button>
                  <Button
                    onClick={() => {
                      sectionBySection.reset()
                      setShowPlanner(true)
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Empezar Nuevo
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Information Panel - Modern Design */}
      <InfoPanel />
    </div>
  )
}
