/**
 * Hook Mock de Optimización - Solo UI
 * NO hace optimización real
 */

import { useState } from 'react'
import { OptimizationType, OptimizationChange } from '../types'
import { SEOAnalysisResult } from '../hooks/useSEOAnalysis'

export const useOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationType, setOptimizationType] = useState<OptimizationType>(null)
  const [optimizationStep, setOptimizationStep] = useState('')
  const [optimizationChanges, setOptimizationChanges] = useState<OptimizationChange[]>([])
  const [highlightedSections, setHighlightedSections] = useState<Set<string>>(new Set())
  const [fixingIssue, setFixingIssue] = useState<string | null>(null)

  // Función mock - no hace nada real
  const optimizeContent = async (
    editedContent: string,
    keyword: string,
    title: string,
    description: string | undefined,
    seoAnalysis: SEOAnalysisResult | null,
    type: 'readability' | 'seo' | 'all',
    onContentUpdate: (content: string) => void,
    onSeoUpdate: (analysis: SEOAnalysisResult) => void
  ) => {
    console.log('⚠️ Optimización deshabilitada - Solo UI mock')
  }

  // Función mock - no hace nada real
  const fixSpecificIssue = async (
    editedContent: string,
    keyword: string,
    title: string,
    description: string | undefined,
    issueId: string,
    issueType: 'seo' | 'readability',
    onContentUpdate: (content: string) => void,
    onSeoUpdate: (analysis: SEOAnalysisResult) => void
  ) => {
    console.log('⚠️ Fix Issue deshabilitado - Solo UI mock')
  }

  return {
    isOptimizing,
    optimizationType,
    optimizationStep,
    optimizationChanges,
    highlightedSections,
    fixingIssue,
    optimizeContent,
    fixSpecificIssue
  }
}
