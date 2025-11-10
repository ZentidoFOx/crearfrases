export interface Step3ContentProps {
  keyword: string
  title: string
  h1Title?: string
  description?: string
  keywords?: string[]
  objectivePhrase?: string
  modelId?: number
  onContentGenerated: (content: any) => void
  onBack: () => void
}

export type DetailLevel = 'basic' | 'medium' | 'advanced'
export type SidebarTab = 'seo' | 'content' | 'analysis'
export type GenerationStep = 'content' | 'seo' | 'done'
export type OptimizationType = 'readability' | 'seo' | 'all' | null

export interface OptimizationChange {
  section: string
  change: string
  timestamp: number
}

export interface Category {
  id: number
  name: string
  slug: string
  count: number
  language?: string
}

export interface DetailLevelConfig {
  name: string
  description: string
  structure: string
  wordsPerSection: number
}
