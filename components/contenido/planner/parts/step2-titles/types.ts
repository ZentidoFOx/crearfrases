export interface TitleData {
  title: string
  h1Title: string
  description: string
  keywords: string[]
  objectivePhrase: string
  seoScore: {
    keywordInTitle: boolean
    keywordInDescription: boolean
    keywordDensity: number
    titleLength: number
    descriptionLength: number
    overall?: number
  }
}

export interface Step2TitlesProps {
  keyword: string
  modelId: number
  additionalKeywords?: string
  onSelectTitle: (title: string, titleData?: TitleData, step2StateData?: any) => void
  onBack: () => void
  initialData?: {
    titles?: TitleData[]
    selectedTitle?: TitleData | null
  }
}
