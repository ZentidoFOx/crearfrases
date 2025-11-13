"use client"

import { useParams, useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle, BarChart3, Target, FileText } from 'lucide-react'
import { CircularProgress } from '@/components/ui/circular-progress'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { useOptimization } from '@/components/contenido/planner/parts/step3/hooks/useOptimization'
import { useWordPress } from '@/components/contenido/planner/parts/step3/hooks/useWordPress'
import { useLanguages } from '@/components/contenido/planner/parts/step3/hooks/useLanguages'
import { useWebsite } from '@/contexts/website-context'
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator'
import {
  ArticleHeader,
  AnalyticsTab,
  SEOTab,
  WordPressTab,
  GooglePreview
} from '../parts'

// Hooks modulares
import { useArticleState } from './hooks/useArticleState'
import { useArticleAutoSave } from './hooks/useArticleAutoSave'

// Handlers modulares
import { createArticleHandlers } from './handlers/articleHandlers'
import { createTranslationHandlers } from './handlers/translationHandlers'
import { createOptimizationHandlers } from './handlers/optimizationHandlers'
import { createWordPressHandlers } from './handlers/wordpressHandlers'

export default function ArticleEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { activeWebsite } = useWebsite()
  
  const articleId = params?.id ? parseInt(params.id as string) : null
  
  // Hook principal de estado
  const articleState = useArticleState(articleId)
  
  // Datos del artículo actual (puede ser original o traducción)
  const displayArticle = articleState.currentTranslationData || articleState.article
  
  // Hook de auto-guardado
  const autoSave = useArticleAutoSave({
    article: articleState.article,
    articleId,
    editedContent: articleState.editedContent,
    currentTranslationData: articleState.currentTranslationData,
    currentLanguage: articleState.currentLanguage,
    loading: articleState.loading,
    isAutoSaving: articleState.isAutoSaving,
    setIsAutoSaving: articleState.setIsAutoSaving,
    lastSavedContentRef: articleState.lastSavedContentRef,
    autoSaveTimeoutRef: articleState.autoSaveTimeoutRef,
    setArticle: articleState.setArticle,
    setCurrentTranslationData: articleState.setCurrentTranslationData
  })
  
  // Hooks externos
  const optimization = useOptimization()
  const wordpress = useWordPress(
    articleState.article?.keywords_array || [], 
    activeWebsite?.url,
    displayArticle
  )
  const languagesHook = useLanguages(activeWebsite?.url)
  
  // Handlers modulares
  const articleHandlers = createArticleHandlers({
    ...articleState,
    articleId,
    router,
    wordpress
  })
  
  const translationHandlers = createTranslationHandlers({
    ...articleState,
    articleId,
    languagesHook
  })
  
  const optimizationHandlers = createOptimizationHandlers({
    ...articleState,
    articleId,
    displayArticle
  })
  
  const wordpressHandlers = createWordPressHandlers({
    ...articleState,
    articleId,
    activeWebsite,
    wordpress
  })

  // Estados de carga
  if (articleState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: '#009689' }} />
          <p className="text-base font-semibold" style={{ color: '#2b2b40' }}>Cargando artículo...</p>
        </div>
      </div>
    )
  }

  if (articleState.error || !articleState.article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{articleState.error || 'Artículo no encontrado'}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      {/* Main Content with left margin for sidebar */}
      <main className="ml-20 pt-0">
        <ArticleHeader
          article={articleState.article}
          saving={articleState.saving}
          deleting={articleState.deleting}
          humanizing={articleState.humanizing}
          optimizingReadability={articleState.optimizingReadability}
          currentLanguage={articleState.currentLanguage}
          loadingTranslation={articleState.loadingTranslation}
          selectedModelId={articleState.selectedHumanizeModelId || 0}
          availableModels={articleState.availableModels}
          onModelChange={articleState.setSelectedHumanizeModelId}
          onSave={articleHandlers.handleSave}
          onDelete={articleHandlers.handleDelete}
          showLanguageMenu={articleState.showLanguageMenu}
          setShowLanguageMenu={articleState.setShowLanguageMenu}
          languagesHook={languagesHook}
          onTranslate={translationHandlers.handleTranslate}
          onLanguageChange={translationHandlers.handleLanguageChange}
          onGooglePreview={() => articleState.setShowGooglePreview(true)}
          autoSaveIndicator={
            <AutoSaveIndicator
              isSaving={articleState.isAutoSaving || autoSave.activeAutoSave.isSaving}
              lastSaved={autoSave.activeAutoSave.lastSaved}
              hasUnsavedChanges={articleState.editedContent !== articleState.lastSavedContentRef.current || autoSave.activeAutoSave.hasUnsavedChanges}
              error={autoSave.activeAutoSave.error}
              className="ml-2"
            />
          }
          onDeleteTranslation={articleHandlers.handleDeleteTranslation}
          onHumanize={optimizationHandlers.handleHumanize}
          onOptimizeReadability={optimizationHandlers.handleOptimizeReadability}
        />

        <div className="flex h-[calc(100vh-60px)]">
          <div className="flex-1 overflow-y-auto">
            <div className="p-0">
              <div className="max-w-5xl mx-auto">
                {((articleState.humanizing && !articleState.isStreamingHumanize) || (articleState.translating && !articleState.isStreamingTranslation)) ? (
                  // Skeleton cuando está humanizando o traduciendo SIN streaming
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-center mb-8">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: '#009689' }} />
                        <p className="text-sm font-medium text-gray-600">
                          {articleState.humanizing ? 'Humanizando contenido...' : 'Traduciendo contenido...'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {articleState.humanizing ? articleState.currentHumanizeStep : articleState.currentTranslationStep}
                        </p>
                      </div>
                    </div>
                    
                    {/* Skeleton del contenido */}
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    
                    <Skeleton className="h-8 w-2/3 mt-8" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    
                    <Skeleton className="h-8 w-1/2 mt-8" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    
                    <Skeleton className="h-8 w-3/5 mt-8" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <WysiwygEditor
                    key={articleState.editorKey}
                    initialContent={articleState.editedContent}
                    onChange={articleState.setEditedContent}
                    showImagePicker={true}
                    className="min-h-[600px]"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="w-96 border-l-2 border-gray-200 bg-white overflow-y-auto">
            <div className="p-4">
              <div className="flex mb-6 bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => articleState.setActiveTab('analytics')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all border-r-2 border-gray-200"
                  style={{
                    backgroundColor: articleState.activeTab === 'analytics' ? '#009689' : '#ffffff',
                    color: articleState.activeTab === 'analytics' ? '#ffffff' : '#2b2b40'
                  }}
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </button>
                <button
                  onClick={() => articleState.setActiveTab('seo')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all border-r-2 border-gray-200"
                  style={{
                    backgroundColor: articleState.activeTab === 'seo' ? '#009689' : '#ffffff',
                    color: articleState.activeTab === 'seo' ? '#ffffff' : '#2b2b40'
                  }}
                >
                  <Target className="h-4 w-4" />
                  SEO
                </button>
                <button
                  onClick={() => articleState.setActiveTab('wordpress')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all"
                  style={{
                    backgroundColor: articleState.activeTab === 'wordpress' ? '#009689' : '#ffffff',
                    color: articleState.activeTab === 'wordpress' ? '#ffffff' : '#2b2b40'
                  }}
                >
                  <FileText className="h-4 w-4" />
                  WordPress
                </button>
              </div>

              {articleState.activeTab === 'analytics' && (
                <AnalyticsTab
                  article={displayArticle}
                  editedContent={articleState.editedContent}
                  onContentUpdate={(newContent: string) => {
                    articleState.setEditedContent(newContent)
                    articleState.setEditorKey(prev => prev + 1)
                  }}
                />
              )}

              {articleState.activeTab === 'seo' && (
                <SEOTab
                  article={displayArticle}
                  editedContent={articleState.editedContent}
                />
              )}

              {articleState.activeTab === 'wordpress' && activeWebsite && (
                <WordPressTab
                  activeWebsite={activeWebsite}
                  article={displayArticle}
                  wordpress={wordpress}
                  postStatus={articleState.postStatus}
                  setPostStatus={articleState.setPostStatus}
                  onPublish={wordpressHandlers.handlePublishToWordPress}
                />
              )}
            </div>
          </div>
        </div>

        {/* Google Preview Modal */}
        <GooglePreview
          isOpen={articleState.showGooglePreview}
          onClose={() => articleState.setShowGooglePreview(false)}
          title={displayArticle.title}
          metaDescription={displayArticle.meta_description || ''}
          keyword={displayArticle.keyword}
          websiteUrl={activeWebsite?.url?.replace(/^https?:\/\//, '') || 'www.ejemplo.com'}
        />

        {/* Indicadores de Progreso Circulares - Esquina inferior derecha */}
        
        {/* Progreso circular para TRADUCCIÓN */}
        <CircularProgress
          isActive={articleState.translating}
          type="translating"
          progress={articleState.translationProgress}
          currentStep={articleState.currentTranslationStep}
          targetLanguage={articleState.targetLanguageName}
        />

        {/* Progreso circular para HUMANIZACIÓN */}
        <CircularProgress
          isActive={articleState.humanizing}
          type="humanizing"
          progress={articleState.humanizeProgress}
          currentStep={articleState.currentHumanizeStep}
        />

        {/* Progreso circular para PUBLICACIÓN EN WORDPRESS */}
        <CircularProgress
          isActive={articleState.publishProgress > 0 && articleState.publishProgress < 100}
          type="publishing"
          progress={articleState.publishProgress}
          currentStep={articleState.currentPublishStep}
        />
      </main>
    </div>
  )
}
