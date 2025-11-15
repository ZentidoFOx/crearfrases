/**
 * ✨ TEXT IMPROVEMENT SERVICE
 * Mejora texto seleccionado con IA usando acciones contextuales
 */

import { aiService } from './ai-service'

export type ImprovementAction =
  | 'improve-writing'      // Mejorar redacción general
  | 'simplify'             // Simplificar y hacer más claro
  | 'expand'               // Expandir con más detalles
  | 'shorten'              // Acortar y ser más conciso
  | 'fix-grammar'          // Corregir gramática y ortografía
  | 'make-professional'    // Hacer más profesional
  | 'make-friendly'        // Hacer más amigable
  | 'add-transitions'      // Agregar palabras de transición
  | 'improve-seo'          // Optimizar para SEO

export interface TextImprovementRequest {
  selectedText: string
  action: ImprovementAction
  context?: {
    keyword?: string
    articleTitle?: string
    language?: string
  }
  modelId?: number
}

export interface TextImprovementResult {
  success: boolean
  improvedText: string
  changes: string[]
  message: string
}

class TextImprovementService {
  /**
   * 🎨 Mejora texto seleccionado según la acción
   */
  async improveText(request: TextImprovementRequest): Promise<TextImprovementResult> {
    const { selectedText, action, context, modelId } = request
    const language = context?.language || 'es'

    console.log('✨ [TEXT-IMPROVEMENT] Acción:', action)
    console.log('📝 [TEXT-IMPROVEMENT] Texto original:', selectedText.substring(0, 100))

    try {
      const prompt = this.buildPrompt(action, selectedText, context, language)

      const improvedText = await aiService.generateWithModel(prompt, modelId || 16, {
        temperature: action === 'fix-grammar' ? 0.1 : 0.7,
        maxTokens: 1000
      })

      const cleanedText = this.cleanAIResponse(improvedText)
      const changes = this.getActionDescription(action, language)

      return {
        success: true,
        improvedText: cleanedText,
        changes: [changes],
        message: `✅ Texto mejorado con "${this.getActionName(action, language)}"`
      }
    } catch (error) {
      return {
        success: false,
        improvedText: selectedText,
        changes: [],
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * 🏗️ Construye el prompt según la acción
   */
  private buildPrompt(
    action: ImprovementAction,
    text: string,
    context?: { keyword?: string; articleTitle?: string; language?: string },
    language: string = 'es'
  ): string {
    const langName = this.getLanguageName(language)
    const keyword = context?.keyword || ''

    const prompts: Record<ImprovementAction, string> = {
      'improve-writing': `Mejora la redacción de este texto en ${langName}. Hazlo más claro, fluido y profesional.

TEXTO:
${text}

INSTRUCCIONES:
- Mantén el significado exacto
- Mejora la fluidez y claridad
- Usa vocabulario apropiado
- NO cambies el formato (mantén negritas, cursivas, etc.)
- NO agregues explicaciones
${keyword ? `- Incluye naturalmente "${keyword}" si es relevante` : ''}

Responde SOLO con el texto mejorado.`,

      'simplify': `Simplifica este texto en ${langName} para que sea más fácil de entender.

TEXTO:
${text}

INSTRUCCIONES:
- Usa palabras más simples
- Acorta oraciones complejas
- Mantén el significado principal
- NO cambies el formato
- Hazlo accesible para todos

Responde SOLO con el texto simplificado.`,

      'expand': `Expande este texto en ${langName} agregando más detalles y explicaciones.

TEXTO:
${text}

INSTRUCCIONES:
- Agrega ejemplos o detalles relevantes
- Expande las ideas principales
- Mantén coherencia con el texto original
- Aumenta la longitud en 50-100%
${keyword ? `- Incluye "${keyword}" naturalmente 1-2 veces más` : ''}

Responde SOLO con el texto expandido.`,

      'shorten': `Acorta este texto en ${langName} manteniendo lo esencial.

TEXTO:
${text}

INSTRUCCIONES:
- Elimina redundancias
- Mantén solo información clave
- Reduce longitud en 30-50%
- NO pierdas significado importante
- Sé conciso y directo

Responde SOLO con el texto acortado.`,

      'fix-grammar': `Corrige la gramática y ortografía de este texto en ${langName}.

TEXTO:
${text}

INSTRUCCIONES:
- Corrige errores ortográficos
- Arregla concordancia gramatical
- Mejora puntuación
- NO cambies el estilo ni tono
- NO modifiques el contenido, solo corrige errores

Responde SOLO con el texto corregido.`,

      'make-professional': `Reescribe este texto en ${langName} con un tono más profesional y formal.

TEXTO:
${text}

INSTRUCCIONES:
- Usa lenguaje formal y técnico
- Elimina coloquialismos
- Mantén objetividad
- Usa tercera persona si es apropiado
- Profesionaliza sin perder claridad

Responde SOLO con el texto profesional.`,

      'make-friendly': `Reescribe este texto en ${langName} con un tono más amigable y cercano.

TEXTO:
${text}

INSTRUCCIONES:
- Usa lenguaje cálido y accesible
- Habla directamente al lector (tú/usted según contexto)
- Agrega empatía y cercanía
- Mantén profesionalismo
- Hazlo conversacional

Responde SOLO con el texto amigable.`,

      'add-transitions': `Agrega palabras de transición a este texto en ${langName} para mejorar la fluidez.

TEXTO:
${text}

PALABRAS DE TRANSICIÓN EN ${langName.toUpperCase()}:
además, sin embargo, por lo tanto, no obstante, asimismo, por otro lado, en consecuencia, de hecho, en primer lugar, finalmente

INSTRUCCIONES:
- Agrega palabras de transición apropiadas
- Mejora conexión entre ideas
- NO cambies el significado
- Mantén naturalidad
- Usa mínimo 2-3 palabras de transición

Responde SOLO con el texto con transiciones.`,

      'improve-seo': `Optimiza este texto en ${langName} para SEO manteniendo naturalidad.

TEXTO:
${text}

${keyword ? `KEYWORD: "${keyword}"` : ''}

INSTRUCCIONES:
${keyword ? `- Incluye "${keyword}" naturalmente 1-2 veces más` : '- Mejora keywords relevantes'}
- Agrega palabras de transición
- Mejora estructura y claridad
- Mantén lectura natural
- NO sobre-optimices (keyword stuffing)
- Balancea SEO con UX

Responde SOLO con el texto optimizado SEO.`
    }

    return prompts[action]
  }

  /**
   * 🧹 Limpia la respuesta de la IA
   */
  private cleanAIResponse(text: string): string {
    return text
      .replace(/^.*?(?=\w|<)/s, '')
      .replace(/```.*?$/gs, '')
      .trim()
  }

  /**
   * 📝 Obtiene el nombre de la acción en el idioma especificado
   */
  private getActionName(action: ImprovementAction, language: string): string {
    const names: Record<ImprovementAction, Record<string, string>> = {
      'improve-writing': { es: 'Mejorar Redacción', en: 'Improve Writing' },
      'simplify': { es: 'Simplificar', en: 'Simplify' },
      'expand': { es: 'Expandir', en: 'Expand' },
      'shorten': { es: 'Acortar', en: 'Shorten' },
      'fix-grammar': { es: 'Corregir Gramática', en: 'Fix Grammar' },
      'make-professional': { es: 'Hacer Profesional', en: 'Make Professional' },
      'make-friendly': { es: 'Hacer Amigable', en: 'Make Friendly' },
      'add-transitions': { es: 'Agregar Transiciones', en: 'Add Transitions' },
      'improve-seo': { es: 'Optimizar SEO', en: 'Improve SEO' }
    }

    return names[action][language] || names[action]['es']
  }

  /**
   * 📄 Obtiene descripción de los cambios
   */
  private getActionDescription(action: ImprovementAction, language: string): string {
    const descriptions: Record<ImprovementAction, Record<string, string>> = {
      'improve-writing': {
        es: 'Redacción mejorada para mayor claridad y fluidez',
        en: 'Writing improved for clarity and flow'
      },
      'simplify': {
        es: 'Texto simplificado para mejor comprensión',
        en: 'Text simplified for better understanding'
      },
      'expand': {
        es: 'Contenido expandido con más detalles',
        en: 'Content expanded with more details'
      },
      'shorten': {
        es: 'Texto acortado manteniendo lo esencial',
        en: 'Text shortened keeping essentials'
      },
      'fix-grammar': {
        es: 'Gramática y ortografía corregidas',
        en: 'Grammar and spelling corrected'
      },
      'make-professional': {
        es: 'Tono profesional aplicado',
        en: 'Professional tone applied'
      },
      'make-friendly': {
        es: 'Tono amigable y cercano aplicado',
        en: 'Friendly and warm tone applied'
      },
      'add-transitions': {
        es: 'Palabras de transición agregadas',
        en: 'Transition words added'
      },
      'improve-seo': {
        es: 'Texto optimizado para SEO',
        en: 'Text optimized for SEO'
      }
    }

    return descriptions[action][language] || descriptions[action]['es']
  }

  /**
   * 🌍 Obtiene nombre del idioma
   */
  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      es: 'español',
      en: 'inglés',
      fr: 'francés',
      pt: 'portugués',
      de: 'alemán',
      it: 'italiano'
    }
    return names[code] || 'español'
  }
}

export const textImprovementService = new TextImprovementService()