"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { SectionState } from '../hooks/useSectionBySection'
import { MarkdownRenderer } from '@/components/markdown-renderer'

interface SectionCardProps {
  section: SectionState
  index: number
}

export function SectionCard({ section, index }: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (section.status !== 'completed' || !section.content) {
    return null
  }

  return (
    <Card className="border-2 border-green-200">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle className="text-base">
                {section.order + 1}. {section.title}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {section.content.length} caracteres
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Completada
            </Badge>
            <Button variant="ghost" size="sm">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <MarkdownRenderer content={section.content} />
        </CardContent>
      )}
    </Card>
  )
}
