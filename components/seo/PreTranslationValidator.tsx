"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import {
  validateForTranslation,
  getSeverityColor,
  getCategoryIcon,
  type ValidationResult,
  type ValidationIssue
} from '@/lib/utils/pre-translation-validator'
import { quickFixService, type QuickFixResult } from '@/lib/api/quick-fix-service'

interface PreTranslationValidatorProps {
  content: string
  keyword: string
  title: string
  onContentUpdate: (newContent: string) => void
  modelId?: number
}

export function PreTranslationValidator({
  content,
  keyword,
  title,
  onContentUpdate,
  modelId
}: PreTranslationValidatorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['estructura', 'seo', 'legibilidad']))
  const [fixingIssue, setFixingIssue] = useState<string | null>(null)

  // Validar contenido
  const validation: ValidationResult = useMemo(() => {
    if (!content || !keyword) {
      return {
        isValid: false,
        score: 0,
        criticalIssues: [],
        warnings: [],
        infos: [],
        allIssues: [],
        canTranslate: false
      }
    }

    return validateForTranslation({ title, content, keyword })
  }, [content, keyword, title])

  // Agrupar issues por categoría
  const issuesByCategory = useMemo(() => {
    const grouped = new Map<string, ValidationIssue[]>()

    validation.allIssues.forEach(issue => {
      if (!grouped.has(issue.category)) {
        grouped.set(issue.category, [])
      }
      grouped.get(issue.category)!.push(issue)
    })

    return grouped
  }, [validation.allIssues])

  // Toggle categoría expandida
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Aplicar Quick Fix
  const handleQuickFix = async (issue: ValidationIssue) => {
    if (!issue.autoFixable) return

    setFixingIssue(issue.id)

    try {
      let result: QuickFixResult | null = null

      // Mapear issue a tipo de fix
      switch (issue.id) {
        case 'low-transition-words':
          result = await quickFixService.applyQuickFix({
            content,
            keyword,
            fixType: 'transition-words',
            modelId
          })
          break

        case 'low-keyword-density':
        case 'high-keyword-density':
          result = await quickFixService.applyQuickFix({
            content,
            keyword,
            fixType: 'keyword-density',
            modelId
          })
          break

        case 'too-many-long-sentences':
          result = await quickFixService.applyQuickFix({
            content,
            keyword,
            fixType: 'long-sentences',
            modelId
          })
          break

        case 'long-paragraphs':
          result = await quickFixService.applyQuickFix({
            content,
            keyword,
            fixType: 'long-paragraphs',
            modelId
          })
          break

        case 'images-without-alt':
          result = await quickFixService.applyQuickFix({
            content,
            keyword,
            fixType: 'images-alt',
            modelId
          })
          break

        case 'keyword-not-in-first-paragraph':
          result = await quickFixService.applyQuickFix({
            content,
            keyword,
            fixType: 'keyword-first-paragraph',
            modelId
          })
          break
      }

      if (result && result.success) {
        onContentUpdate(result.fixedContent)
        alert(result.message)
      } else {
        alert(result?.message || '❌ No se pudo aplicar el fix')
      }
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setFixingIssue(null)
    }
  }

  // Auto-fix todos los problemas críticos
  const handleAutoFixAll = async () => {
    if (!confirm('🔧 ¿Aplicar auto-fix a TODOS los problemas solucionables?\n\nEsto modificará el contenido automáticamente.')) {
      return
    }

    setFixingIssue('all')

    try {
      let currentContent = content
      const fixableIssues = validation.criticalIssues.filter(i => i.autoFixable)

      for (const issue of fixableIssues) {
        let result: QuickFixResult | null = null

        switch (issue.id) {
          case 'low-transition-words':
            result = await quickFixService.applyQuickFix({
              content: currentContent,
              keyword,
              fixType: 'transition-words',
              modelId
            })
            break

          case 'images-without-alt':
            result = await quickFixService.applyQuickFix({
              content: currentContent,
              keyword,
              fixType: 'images-alt',
              modelId
            })
            break

          case 'keyword-not-in-first-paragraph':
            result = await quickFixService.applyQuickFix({
              content: currentContent,
              keyword,
              fixType: 'keyword-first-paragraph',
              modelId
            })
            break
        }

        if (result && result.success) {
          currentContent = result.fixedContent
        }
      }

      onContentUpdate(currentContent)
      alert(`✅ Auto-fix completado: ${fixableIssues.length} problema(s) solucionado(s)`)
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setFixingIssue(null)
    }
  }

  // Obtener color del score
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-50 border-green-200'
    if (score >= 70) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  if (!content || !keyword) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header con Score */}
      <Card className={`p-4 border-2 ${getScoreBgColor(validation.score)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {validation.canTranslate ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
            <div>
              <h3 className="text-lg font-bold">
                Validación Pre-Traducción
              </h3>
              <p className="text-sm text-gray-600">
                {validation.canTranslate
                  ? '✅ Listo para traducir'
                  : `❌ ${validation.criticalIssues.length} problema(s) crítico(s)`
                }
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(validation.score)}`}>
              {validation.score}
            </div>
            <div className="text-sm text-gray-600">/ 100</div>
          </div>
        </div>

        {/* Resumen de Issues */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          {validation.criticalIssues.length > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <XCircle className="h-3 w-3" />
              <span>{validation.criticalIssues.length} Críticos</span>
            </Badge>
          )}
          {validation.warnings.length > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span>{validation.warnings.length} Advertencias</span>
            </Badge>
          )}
          {validation.infos.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {validation.infos.length} Sugerencias
            </Badge>
          )}
        </div>

        {/* Botón Auto-Fix All */}
        {validation.criticalIssues.some(i => i.autoFixable) && (
          <Button
            onClick={handleAutoFixAll}
            disabled={fixingIssue !== null}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
          >
            {fixingIssue === 'all' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aplicando fixes...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Auto-Fix Todos los Críticos
              </>
            )}
          </Button>
        )}
      </Card>

      {/* Lista de Issues por Categoría */}
      {Array.from(issuesByCategory.entries()).map(([category, issues]) => (
        <Card key={category} className="overflow-hidden">
          <button
            onClick={() => toggleCategory(category)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getCategoryIcon(category)}</span>
              <div className="text-left">
                <h4 className="font-semibold capitalize">{category}</h4>
                <p className="text-sm text-gray-600">
                  {issues.length} problema(s)
                </p>
              </div>
            </div>

            {expandedCategories.has(category) ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedCategories.has(category) && (
            <div className="border-t divide-y">
              {issues.map((issue) => (
                <div key={issue.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge
                          variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}
                          className={
                            issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            issue.severity === 'info' ? 'bg-blue-100 text-blue-800' : ''
                          }
                        >
                          {issue.severity === 'critical' ? 'Crítico' :
                           issue.severity === 'warning' ? 'Advertencia' : 'Info'}
                        </Badge>
                        <h5 className="font-medium">{issue.title}</h5>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {issue.description}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Actual:</span> {issue.currentValue}
                        </div>
                        <div>
                          <span className="font-medium">Esperado:</span> {issue.expectedValue}
                        </div>
                      </div>
                    </div>

                    {issue.autoFixable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickFix(issue)}
                        disabled={fixingIssue !== null}
                        className="ml-4 flex-shrink-0"
                      >
                        {fixingIssue === issue.id ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Fixing...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-1 h-3 w-3" />
                            Fix
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* Mensaje de bloqueo si no puede traducir */}
      {!validation.canTranslate && (
        <Card className="p-4 bg-red-50 border-2 border-red-200">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">
                ⚠️ No se puede traducir aún
              </h4>
              <p className="text-sm text-red-700">
                Debes corregir los <strong>{validation.criticalIssues.length} problema(s) crítico(s)</strong> antes de poder traducir este artículo.
                Las traducciones heredan la estructura del artículo original, por lo que es esencial que esté perfectamente optimizado.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}