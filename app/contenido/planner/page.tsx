"use client"

import { useState } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { PlannerHeader } from '@/components/contenido/planner/parts/planner-header'
import { PlannerStepper } from '@/components/contenido/planner/parts/planner-stepper'
import { Step1Keyword } from '@/components/contenido/planner/parts/step1-keyword'
import { Step2Titles } from '@/components/contenido/planner/parts/step2-titles'
import { Step3Content } from '@/components/contenido/planner/parts/step3-content'

export default function ContentPlannerPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [keywordAnalysis, setKeywordAnalysis] = useState<any>(null)
  const [selectedTitle, setSelectedTitle] = useState('')
  const [selectedTitleData, setSelectedTitleData] = useState<any>(null)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [step1Data, setStep1Data] = useState<any>(null)
  const [selectedModelId, setSelectedModelId] = useState<number>(0)
  const [additionalKeywords, setAdditionalKeywords] = useState<string>('')

  const handleKeywordSubmit = (kw: string, analysis: any, data?: any) => {
    setKeyword(kw)
    setKeywordAnalysis(analysis)
    setStep1Data(data)
    // Extract modelId and additionalKeywords from data if available
    if (data?.modelId) {
      setSelectedModelId(data.modelId)
    }
    if (data?.additionalKeywords) {
      setAdditionalKeywords(data.additionalKeywords)
    }
    setCurrentStep(2)
  }

  const handleTitleSelect = (title: string, titleData?: any) => {
    setSelectedTitle(title)
    setSelectedTitleData(titleData)
    setCurrentStep(3)
  }

  const handleContentGenerated = (content: any) => {
    setGeneratedContent(content)
  }

  const handleReset = () => {
    setCurrentStep(1)
    setKeyword('')
    setKeywordAnalysis(null)
    setSelectedTitle('')
    setGeneratedContent(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Sidebar />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <PlannerHeader onReset={handleReset} currentStep={currentStep} />

          {/* Stepper */}
          <PlannerStepper currentStep={currentStep} />

          {/* Steps Content */}
          <div className="mt-6">
            {currentStep === 1 && (
              <Step1Keyword onSubmit={handleKeywordSubmit} initialKeyword={keyword} initialData={step1Data} />
            )}

            {currentStep === 2 && selectedModelId > 0 && (
              <Step2Titles
                keyword={keyword}
                modelId={selectedModelId}
                additionalKeywords={additionalKeywords}
                onSelectTitle={handleTitleSelect}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {currentStep === 3 && (
              <Step3Content
                keyword={keyword}
                title={selectedTitle}
                h1Title={selectedTitleData?.h1Title}
                description={selectedTitleData?.description}
                keywords={selectedTitleData?.keywords}
                objectivePhrase={selectedTitleData?.objectivePhrase}
                onContentGenerated={handleContentGenerated}
                onBack={() => setCurrentStep(2)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
