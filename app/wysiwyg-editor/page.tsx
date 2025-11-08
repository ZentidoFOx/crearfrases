"use client"

import { useState } from 'react'
import { WysiwygEditor } from '@/components/editor/wysiwyg-editor'
import { useWebsite } from '@/contexts/website-context'

export default function WysiwygEditorPage() {
  const { activeWebsite } = useWebsite()
  const [content, setContent] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Editor WYSIWYG</h1>
          {activeWebsite && (
            <span className="text-sm text-gray-600">
              Sitio: <strong className="text-blue-600">{activeWebsite.name}</strong>
            </span>
          )}
        </div>

        <WysiwygEditor 
          initialContent={content}
          onChange={(newContent) => setContent(newContent)}
          showImagePicker={true}
        />
      </div>
    </div>
  )
}
