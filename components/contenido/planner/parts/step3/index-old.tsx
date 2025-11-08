"use client"

import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWebsite } from '@/contexts/website-context'
import { OutlineEditorAdvanced } from '../outline-editor-advanced'

// Types
import { Step3ContentProps, DetailLevel } from './types'

// Utils
import { generateMarkdown } from './utils'

// Hooks
import { useContentGeneration } from './hooks/useContentGeneration'
import { useSEOAnalysis } from './hooks/useSEOAnalysis'
import { useLanguages } from './hooks/useLanguages'
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
}: Step3ContentProps) {
  const { activeWebsite } = useWebsite()
  
  // Planificador de contenido
  const [showPlanner, setShowPlanner] = useState(true)
  const [numSections, setNumSections] = useState<number>(5)
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('medium')
  
  // H1 Title (diferente del SEO title)
  const [h1Title, setH1Title] = useState<string>(initialH1Title || title)
  
  // Hooks
  const contentGeneration = useContentGeneration()
  const seoAnalysis = useSEOAnalysis(editedContent, currentTitle, currentKeyword, currentDescription, contentGeneration.isGenerating)
  const saveArticle = useSaveArticle()

  const handleGenerateOutline = async () => {
    setShowPlanner(false)
    await contentGeneration.generateOutline(currentTitle, currentKeyword, numSections, detailLevel)
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
        (analysis) => {
          seoAnalysis.setSeoAnalysis(analysis)
        }
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
      title: currentTitle,
      h1_title: h1Title,
      keyword: currentKeyword,
      objective_phrase: currentObjectivePhrase || undefined,
      keywords_array: currentKeywords.length > 0 ? currentKeywords : undefined,
      content: content,
      sections_json: sections.length > 0 ? sections : undefined,
      meta_description: currentDescription || undefined,
      seo_data: seoAnalysis.seoAnalysis ? ({
        score: seoAnalysis.seoAnalysis.score,
        keyword_density: 0,
        readability_score: seoAnalysis.seoAnalysis.readability?.score || 0
      } as any) : undefined,
      website_id: activeWebsite?.id,
      language: languagesHook.currentLanguage,
      content_type: 'planner' as const,
      status: 'draft' as const
    }

    await saveArticle.saveAndRedirect(articleData)
  }

  const handleRegenerateOutline = async () => {
    await contentGeneration.generateOutline(title, keyword, numSections, detailLevel)
  }

  const handleLanguageChange = (langCode: string) => {
    console.log('🌐 Cambiando idioma a:', langCode)
    
    // Guardar contenido actual antes de cambiar
    setContentByLanguage(prev => ({
      ...prev,
      [languagesHook.currentLanguage]: {
        ...prev[languagesHook.currentLanguage] || {
          title: title,
          description: description || '',
          keyword: keyword,
          content: ''
        },
        content: editedContent
      }
    }))
    
    // Cambiar idioma (el useEffect cargará el contenido automáticamente)
    languagesHook.setCurrentLanguage(langCode)
  }

  const handleTranslate = async () => {
    if (!languagesHook.currentLanguage) return
    
    const targetLang = languagesHook.languages.find(l => l.code === languagesHook.currentLanguage)
    if (!targetLang) return
    
    // Obtener contenido del idioma actual (puede ser español u otro ya traducido)
    const currentContent = contentByLanguage[languagesHook.currentLanguage]?.content || 
                          contentByLanguage['es']?.content || 
                          editedContent
    
    if (!currentContent) {
      alert('No hay contenido para traducir')
      return
    }
    
    if (window.confirm(`¿Traducir TODO el contenido (título SEO, descripción, keyword y artículo) a ${targetLang.name}?\n\nEsto creará/actualizará la versión en ${targetLang.name}.`)) {
      setIsTranslating(true)
      
      try {
        console.log('🌐 Iniciando traducción completa a:', targetLang.name)
        
        // Preparar datos para traducción (siempre desde español)
        const sourceData = contentByLanguage['es'] ? contentByLanguage['es'] : {
          title: title,
          h1Title: initialH1Title || title,
          description: description || '',
          keyword: keyword,
          objectivePhrase: objectivePhrase || '',
          keywords: keywords || [],
          content: currentContent
        }
        
        const translationData = {
          title: sourceData.title,
          h1Title: sourceData.h1Title,
          description: sourceData.description,
          keyword: sourceData.keyword,
          objectivePhrase: sourceData.objectivePhrase,
          keywords: sourceData.keywords,
          content: sourceData.content
        }
        
        // Llamar al servicio de traducción
        const translated = await translatorService.translateContent(
          translationData,
          targetLang.code,
          targetLang.name
        )
        
        console.log('✅ Traducción recibida:', translated)
        
        // Guardar contenido traducido en el estado por idioma
        setContentByLanguage(prev => ({
          ...prev,
          [targetLang.code]: {
            title: translated.title,
            h1Title: translated.h1Title,
            description: translated.description,
            keyword: translated.keyword,
            objectivePhrase: translated.objectivePhrase,
            keywords: translated.keywords,
            content: translated.content
          }
        }))
        
        // Actualizar el contenido mostrado en el editor
        setEditedContent(translated.content)
        setEditorKey(prev => prev + 1) // Forzar re-render del editor
        
        // Mostrar resumen de traducción
        alert(`✅ Traducción completada a ${targetLang.name}!\n\n` +
              `Los siguientes datos han sido traducidos:\n\n` +
              `📝 Título SEO: ${translated.title}\n` +
              `🎯 Título H1: ${translated.h1Title}\n` +
              `🔑 Keyword: ${translated.keyword}\n` +
              `🎨 Enfoque: ${translated.objectivePhrase}\n` +
              `🏷️ Keywords: ${translated.keywords.join(', ')}\n` +
              `📄 Descripción: ${translated.description.substring(0, 50)}...\n\n` +
              `✨ Panel izquierdo actualizado con todos los datos en ${targetLang.name}\n` +
              `💾 Traducción guardada - Puedes cambiar de idioma libremente`)
        
      } catch (error) {
        console.error('❌ Error en traducción:', error)
        alert('Error al traducir el contenido. Por favor, intenta de nuevo.')
      } finally {
        setIsTranslating(false)
      }
    }
  }

  const handleOptimizeReadability = async () => {
    await optimization.optimizeContent(
      editedContent,
      keyword,
      title,
      description,
      seoAnalysis.seoAnalysis,
      'readability',
      (content) => {
        setEditedContent(content)
        setEditorKey(prev => prev + 1)
      },
      seoAnalysis.setSeoAnalysis
    )
  }

  const handleOptimizeSEO = async () => {
    await optimization.optimizeContent(
      editedContent,
      keyword,
      title,
      description,
      seoAnalysis.seoAnalysis,
      'seo',
      (content) => {
        setEditedContent(content)
        setEditorKey(prev => prev + 1)
      },
      seoAnalysis.setSeoAnalysis
    )
  }

  const handleOptimizeAll = async () => {
    await optimization.optimizeContent(
      editedContent,
      keyword,
      title,
      description,
      seoAnalysis.seoAnalysis,
      'all',
      (content) => {
        setEditedContent(content)
        setEditorKey(prev => prev + 1)
      },
      seoAnalysis.setSeoAnalysis
    )
  }

  const handleFixIssue = async (issueId: string, issueType: 'seo' | 'readability') => {
    await optimization.fixSpecificIssue(
      editedContent,
      keyword,
      title,
      description,
      issueId,
      issueType,
      (content) => {
        setEditedContent(content)
        setEditorKey(prev => prev + 1)
      },
      seoAnalysis.setSeoAnalysis
    )
  }

  const handlePublishToWordPress = async () => {
    if (!activeWebsite?.url) {
      contentGeneration.setError('No hay sitio web activo seleccionado')
      return
    }

    // Detectar todos los idiomas con contenido
    const availableLanguages = Object.keys(contentByLanguage).filter(
      lang => contentByLanguage[lang].content && contentByLanguage[lang].content.length > 0
    )

    if (availableLanguages.length === 0) {
      contentGeneration.setError('No hay contenido para publicar')
      return
    }

    console.log('🌍 Idiomas a publicar:', availableLanguages)

    // Confirmar publicación multi-idioma
    const languageNames = availableLanguages.map(code => {
      const lang = languagesHook.languages.find(l => l.code === code)
      return lang?.name || code
    }).join(', ')

    if (!window.confirm(
      `¿Publicar artículo en ${availableLanguages.length} idioma(s)?\n\n` +
      `Idiomas: ${languageNames}\n\n` +
      `Se crearán ${availableLanguages.length} artículos en WordPress, uno por cada idioma.`
    )) {
      return
    }

    wordpress.setIsPublishing(true)
    contentGeneration.setError('')

    const publishedResults: Array<{
      lang: string
      langCode: string
      success: boolean
      postId?: number
      postUrl?: string
      error?: string
    }> = []

    // Mapa de traducciones para Polylang (relacionar posts entre idiomas)
    const translationMap: { [langCode: string]: number } = {}

    try {
      // Publicar en cada idioma
      for (const langCode of availableLanguages) {
        const langData = contentByLanguage[langCode]
        const langInfo = languagesHook.languages.find(l => l.code === langCode)
        const langName = langInfo?.name || langCode

        console.log(`\n🌐 Publicando en ${langName} (${langCode})...`)

        try {
          const result = await publishToWordPress(
            {
              title: langData.title,
              h1Title: langData.h1Title,
              content: langData.content,
              metaDescription: langData.description,
              focusKeyword: langData.keyword,
              categories: wordpress.wpCategories,
              tags: wordpress.wpTags,
              featuredImageUrl: wordpress.wpFeaturedImage,
              featuredImageId: wordpress.wpFeaturedImageId || undefined,
              language: langCode, // Parámetro de idioma para Polylang/WPML
              translations: translationMap // Relacionar con otros idiomas (Polylang)
            },
            {
              siteUrl: activeWebsite.url,
              username: 'arturo',
              applicationPassword: 'zgHS Nmvp qnF9 0F70 Aw5s Jnir'
            }
          )

          if (result.success && result.postId) {
            console.log(`✅ ${langName}: Publicado (ID: ${result.postId})`)
            
            // Guardar ID del post para relacionarlo con otros idiomas
            translationMap[langCode] = result.postId
            
            publishedResults.push({
              lang: langName,
              langCode: langCode,
              success: true,
              postId: result.postId,
              postUrl: result.postUrl
            })
          } else {
            console.error(`❌ ${langName}: Error - ${result.error}`)
            publishedResults.push({
              lang: langName,
              langCode: langCode,
              success: false,
              error: result.error
            })
          }
        } catch (error: any) {
          console.error(`❌ ${langName}: Error inesperado -`, error)
          publishedResults.push({
            lang: langName,
            langCode: langCode,
            success: false,
            error: error.message
          })
        }
      }

      // Después de publicar todos, sincronizar relaciones en Polylang
      if (Object.keys(translationMap).length > 1) {
        console.log('\n🔗 Sincronizando relaciones entre idiomas en Polylang...')
        console.log('Traducciones:', translationMap)
        
        try {
          // Actualizar cada post con las traducciones de los demás
          for (const [langCode, postId] of Object.entries(translationMap)) {
            await fetch(`${activeWebsite.url}/wp-json/wp/v2/posts/${postId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa('arturo:zgHS Nmvp qnF9 0F70 Aw5s Jnir')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                meta: {
                  _pll_translations: translationMap // Polylang meta field
                }
              })
            })
          }
          console.log('✅ Relaciones entre idiomas sincronizadas')
        } catch (error) {
          console.warn('⚠️ No se pudieron sincronizar las relaciones:', error)
        }
      }

      // Mostrar resumen de publicaciones
      const successCount = publishedResults.filter(r => r.success).length
      const failCount = publishedResults.length - successCount

      let message = `📊 Resumen de Publicación Multi-Idioma:\n\n`
      message += `✅ Publicados: ${successCount}/${publishedResults.length}\n`
      if (failCount > 0) message += `❌ Fallidos: ${failCount}\n`
      
      // Mostrar si están relacionados en Polylang
      if (Object.keys(translationMap).length > 1) {
        message += `🔗 Artículos relacionados en Polylang\n`
      }
      message += `\n`

      publishedResults.forEach(result => {
        if (result.success) {
          message += `✅ ${result.lang}\n`
          message += `   ID: ${result.postId}\n`
          message += `   URL: ${result.postUrl}\n`
          
          // Mostrar traducciones relacionadas
          if (translationMap[result.langCode]) {
            const otherLangs = Object.keys(translationMap)
              .filter(code => code !== result.langCode)
              .map(code => {
                const lang = publishedResults.find(r => r.langCode === code)
                return lang ? `${lang.lang} (${translationMap[code]})` : code
              })
            if (otherLangs.length > 0) {
              message += `   🔗 Relacionado con: ${otherLangs.join(', ')}\n`
            }
          }
          message += `\n`
        } else {
          message += `❌ ${result.lang}\n`
          message += `   Error: ${result.error}\n\n`
        }
      })

      alert(message)

      if (failCount > 0) {
        contentGeneration.setError(`${failCount} publicación(es) fallaron. Ver consola para detalles.`)
      }

    } catch (error: any) {
      console.error('Error general en publicación:', error)
      contentGeneration.setError(`Error inesperado: ${error.message}`)
    } finally {
      wordpress.setIsPublishing(false)
    }
  }

  const handleSaveArticle = async () => {
    await handleSaveArticleWithContent(editedContent)
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
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        
        .typing-effect {
          animation: pulse 1s ease-in-out infinite;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN - Info (Sticky) */}
        <SidebarTabs
          showPlanner={showPlanner}
          keyword={currentKeyword}
          title={currentTitle}
          description={currentDescription}
          keywords={currentKeywords}
          h1Title={h1Title}
          onH1TitleChange={setH1Title}
          onTitleChange={setCurrentTitle}
          onDescriptionChange={setCurrentDescription}
          onKeywordsChange={setCurrentKeywords}
        />

        {/* RIGHT COLUMN - Content */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
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

          {/* Outline Editor Advanced */}
          {contentGeneration.showOutline && contentGeneration.outline.length > 0 && (
            <OutlineEditorAdvanced
              outline={contentGeneration.outline}
              keyword={keyword}
              introParagraphs={contentGeneration.introParagraphs}
              onOutlineChange={contentGeneration.setOutline}
              onIntroParagraphsChange={contentGeneration.setIntroParagraphs}
              onGenerate={handleGenerateContent}
              onRegenerate={handleRegenerateOutline}
              onBack={() => {
                contentGeneration.setShowOutline(false)
                setShowPlanner(true)
              }}
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
