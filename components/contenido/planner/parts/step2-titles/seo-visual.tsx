import { Check, Target, BarChart3, Sparkles, TrendingUp } from 'lucide-react'
import { containsKeyword, normalizeText } from './utils'
import type { TitleData } from './types'

export const SEOFactors = ({ titleData, keyword }: { titleData: TitleData; keyword: string }) => {
  const factors = [
    {
      icon: Target,
      label: 'Keyword',
      status: containsKeyword(titleData.title, keyword),
      detail: (() => {
        if (!containsKeyword(titleData.title, keyword)) return 'Ausente'
        const normalizedTitle = normalizeText(titleData.title)
        const normalizedKeyword = normalizeText(keyword)
        return normalizedTitle.startsWith(normalizedKeyword) ? 'Al inicio ✨' : 'Presente'
      })()
    },
    {
      icon: BarChart3,
      label: 'Longitud',
      status: titleData.title.length >= 50 && titleData.title.length <= 60,
      detail: `${titleData.title.length} chars`
    },
    {
      icon: Sparkles,
      label: 'Poder',
      status: ['guía', 'completa', 'mejor', 'mejores', 'top', 'secretos', 'cómo', 'tutorial', 'definitiva', 'increíble', 'nuevo', 'actualizado'].some(word => normalizeText(titleData.title).includes(word)),
      detail: 'Palabras atractivas'
    },
    {
      icon: TrendingUp,
      label: 'Números',
      status: /\d+/.test(titleData.title) || titleData.title.includes('2024') || titleData.title.includes('2025'),
      detail: 'Años/números'
    }
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {factors.map((factor, idx) => {
        const Icon = factor.icon
        return (
          <div
            key={idx}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              factor.status
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}
            title={factor.detail}
          >
            <Icon className="h-3 w-3" />
            <span>{factor.label}</span>
            {factor.status && <Check className="h-3 w-3" />}
          </div>
        )
      })}
    </div>
  )
}

export const SEOScoreCircle = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }

  const getColor = (score: number) => {
    if (score >= 80) return { stroke: '#10b981', bg: 'bg-green-50', text: 'text-green-700' }
    if (score >= 60) return { stroke: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' }
    return { stroke: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' }
  }

  const color = getColor(score)
  const circumference = 2 * Math.PI * 20
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={`${sizeClasses[size]} ${color.bg} rounded-full flex items-center justify-center relative`}>
      <svg className="absolute inset-0 -rotate-90" width="100%" height="100%" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          fill="none" 
          stroke={color.stroke} 
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className={`${textSizes[size]} font-bold ${color.text} relative z-10`}>{score}</span>
    </div>
  )
}
