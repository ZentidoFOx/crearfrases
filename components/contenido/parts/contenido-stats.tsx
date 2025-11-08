"use client"

import { FileText, Eye, ThumbsUp, TrendingUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change: string
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {change}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

export function ContenidoStats() {
  const stats = [
    {
      title: 'Total de Artículos',
      value: '248',
      change: '+12%',
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-100'
    },
    {
      title: 'Visitas Totales',
      value: '125.4K',
      change: '+18%',
      icon: <Eye className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Engagement',
      value: '8.4K',
      change: '+24%',
      icon: <ThumbsUp className="h-6 w-6 text-emerald-600" />,
      color: 'bg-emerald-100'
    },
    {
      title: 'Conversiones',
      value: '2.1K',
      change: '+32%',
      icon: <TrendingUp className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
