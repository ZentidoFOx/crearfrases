import { Globe } from 'lucide-react'

export const GooglePreview = ({ title, description, keyword }: { title: string; description: string; keyword: string }) => {
  const highlightKeyword = (text: string) => {
    const regex = new RegExp(`(${keyword})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase() ?
        <strong key={i} className="font-bold">{part}</strong> : part
    )
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-4 w-4 text-gray-400" />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">https://ejemplo.com › tour</span>
          </div>
        </div>
      </div>
      <h3 className="text-xl text-blue-600 hover:underline cursor-pointer mb-1 line-clamp-1">
        {highlightKeyword(title)}
      </h3>
      <p className="text-sm text-gray-600 line-clamp-2">
        {highlightKeyword(description)}
      </p>
    </div>
  )
}
