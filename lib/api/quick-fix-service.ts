/**
 * 🔧 QUICK FIX SERVICE
 * Arregla problemas SEO específicos sin modificar todo el artículo
 */

import { aiService } from './ai-service'

export interface QuickFixRequest {
  content: string
  keyword: string
  fixType: 'transition-words' | 'keyword-density' | 'long-sentences' | 'long-paragraphs' | 'images-alt' | 'keyword-first-paragraph'
  modelId?: number
}

export interface QuickFixResult {
  success: boolean
  fixedContent: string
  changes: string[]
  message: string
}

class QuickFixService {
  /**
   * 🔧 Arregla palabras de transición
   */
  async fixTransitionWords(content: string, keyword: string, modelId?: number): Promise<QuickFixResult> {
    console.log('🔧 [QUICK-FIX] Arreglando palabras de transición...')

    const prompt = `Agrega palabras de transición a este contenido HTML para alcanzar 30%+ de oraciones con transiciones.

KEYWORD: "${keyword}"

INSTRUCCIONES:
1. SOLO agrega palabras de transición al inicio de oraciones
2. USA: además, sin embargo, por lo tanto, no obstante, en consecuencia, asimismo, por otro lado, de hecho, en primer lugar, finalmente
3. NO modifiques la estructura, párrafos ni significado
4. NO agregues ni quites contenido
5. Mantén TODOS los tags HTML exactamente igual
6. Objetivo: 30%+ de oraciones con palabras de transición

EJEMPLO:
❌ ANTES: "El Amazonas es único. Ofrece biodiversidad. Los turistas lo visitan."
✅ DESPUÉS: "Además, el Amazonas es único. Por lo tanto, ofrece biodiversidad. Sin embargo, los turistas lo visitan."

CONTENIDO:
${content}

Responde SOLO con el HTML modificado, sin explicaciones.`

    try {
      const fixedContent = await aiService.generateWithModel(prompt, modelId || 16, {
        temperature: 0.3,
        maxTokens: 4000
      })

      const changes = ['Palabras de transición agregadas']

      return {
        success: true,
        fixedContent: this.cleanAIResponse(fixedContent),
        changes,
        message: '✅ Palabras de transición agregadas exitosamente'
      }
    } catch (error) {
      return {
        success: false,
        fixedContent: content,
        changes: [],
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * 🔧 Arregla densidad de keyword
   */
  async fixKeywordDensity(content: string, keyword: string, targetDensity: 'increase' | 'decrease', modelId?: number): Promise<QuickFixResult> {
    console.log(`🔧 [QUICK-FIX] ${targetDensity === 'increase' ? 'Aumentando' : 'Disminuyendo'} densidad de keyword...`)

    const action = targetDensity === 'increase'
      ? `Agrega "${keyword}" naturalmente 3-5 veces más en el contenido`
      : `Reduce el uso de "${keyword}" para evitar keyword stuffing, manteniendo solo apariciones naturales`

    const prompt = `${action} en este contenido HTML.

KEYWORD: "${keyword}"

INSTRUCCIONES:
1. ${targetDensity === 'increase' ? 'Inserta' : 'Reduce'} "${keyword}" de manera NATURAL
2. NO fuerces el keyword donde no tiene sentido
3. Mantén la estructura y párrafos exactos
4. NO agregues ni quites información
5. Mantén TODOS los tags HTML exactamente igual

CONTENIDO:
${content}

Responde SOLO con el HTML modificado, sin explicaciones.`

    try {
      const fixedContent = await aiService.generateWithModel(prompt, modelId || 16, {
        temperature: 0.3,
        maxTokens: 4000
      })

      const changes = [targetDensity === 'increase' ? 'Keyword agregado naturalmente' : 'Keyword reducido']

      return {
        success: true,
        fixedContent: this.cleanAIResponse(fixedContent),
        changes,
        message: `✅ Densidad de keyword optimizada`
      }
    } catch (error) {
      return {
        success: false,
        fixedContent: content,
        changes: [],
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * 🔧 Acorta oraciones largas
   */
  async fixLongSentences(content: string, keyword: string, modelId?: number): Promise<QuickFixResult> {
    console.log('🔧 [QUICK-FIX] Acortando oraciones largas...')

    const prompt = `Divide SOLO las oraciones largas (más de 20 palabras) en este contenido HTML.

KEYWORD: "${keyword}"

INSTRUCCIONES:
1. Identifica oraciones con más de 20 palabras
2. Divídelas en 2-3 oraciones más cortas
3. Mantén el significado exacto
4. NO modifiques oraciones que ya son cortas
5. Mantén TODOS los párrafos y estructura igual
6. Mantén TODOS los tags HTML exactamente igual

EJEMPLO:
❌ LARGO: "El Amazonas es un ecosistema único que ofrece una biodiversidad increíble y atrae a turistas de todo el mundo que buscan aventuras."
✅ CORTO: "El Amazonas es un ecosistema único. Ofrece una biodiversidad increíble. Atrae a turistas de todo el mundo que buscan aventuras."

CONTENIDO:
${content}

Responde SOLO con el HTML modificado, sin explicaciones.`

    try {
      const fixedContent = await aiService.generateWithModel(prompt, modelId || 16, {
        temperature: 0.3,
        maxTokens: 4000
      })

      const changes = ['Oraciones largas divididas']

      return {
        success: true,
        fixedContent: this.cleanAIResponse(fixedContent),
        changes,
        message: '✅ Oraciones largas acortadas'
      }
    } catch (error) {
      return {
        success: false,
        fixedContent: content,
        changes: [],
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * 🔧 Divide párrafos largos
   */
  async fixLongParagraphs(content: string, keyword: string, modelId?: number): Promise<QuickFixResult> {
    console.log('🔧 [QUICK-FIX] Dividiendo párrafos largos...')

    const prompt = `Divide SOLO los párrafos largos (más de 150 palabras) en este contenido HTML.

KEYWORD: "${keyword}"

INSTRUCCIONES:
1. Identifica párrafos <p> con más de 150 palabras
2. Divídelos en 2-3 párrafos más cortos
3. Mantén el significado y flujo del contenido
4. NO modifiques párrafos que ya son cortos
5. Mantén TODOS los tags HTML exactamente igual
6. NO cambies la estructura general

EJEMPLO:
❌ LARGO: <p>Texto muy largo con más de 150 palabras aquí...</p>
✅ CORTO: <p>Primera parte del texto.</p><p>Segunda parte del texto.</p>

CONTENIDO:
${content}

Responde SOLO con el HTML modificado, sin explicaciones.`

    try {
      const fixedContent = await aiService.generateWithModel(prompt, modelId || 16, {
        temperature: 0.3,
        maxTokens: 4000
      })

      const changes = ['Párrafos largos divididos']

      return {
        success: true,
        fixedContent: this.cleanAIResponse(fixedContent),
        changes,
        message: '✅ Párrafos largos divididos'
      }
    } catch (error) {
      return {
        success: false,
        fixedContent: content,
        changes: [],
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * 🔧 Agrega alt a imágenes
   */
  fixImagesAlt(content: string, keyword: string): QuickFixResult {
    console.log('🔧 [QUICK-FIX] Agregando alt a imágenes...')

    try {
      let fixedContent = content
      const changes: string[] = []

      // Buscar todas las imágenes sin alt
      const imgRegex = /<img([^>]*)>/gi
      let match

      while ((match = imgRegex.exec(content)) !== null) {
        const imgTag = match[0]
        const imgAttributes = match[1]

        // Si no tiene alt, agregarlo
        if (!imgAttributes.includes('alt=')) {
          // Extraer src si existe
          const srcMatch = imgAttributes.match(/src=["']([^"']+)["']/i)
          const src = srcMatch ? srcMatch[1] : ''

          // Generar alt desde el nombre del archivo
          const fileName = src.split('/').pop() || ''
          const fileNameWithoutExt = fileName.replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, '')
          const altText = fileNameWithoutExt
            .replace(/[-_]/g, ' ')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ') || keyword

          // Crear nuevo tag img con alt
          const newImgTag = imgTag.replace('<img', `<img alt="${altText}"`)

          fixedContent = fixedContent.replace(imgTag, newImgTag)
          changes.push(`Alt agregado: "${altText}"`)
        }
      }

      if (changes.length === 0) {
        return {
          success: true,
          fixedContent: content,
          changes: ['Todas las imágenes ya tienen alt'],
          message: '✅ Todas las imágenes ya tienen atributo alt'
        }
      }

      return {
        success: true,
        fixedContent,
        changes,
        message: `✅ Alt agregado a ${changes.length} imagen(es)`
      }
    } catch (error) {
      return {
        success: false,
        fixedContent: content,
        changes: [],
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * 🔧 Agrega keyword al primer párrafo
   */
  async fixKeywordFirstParagraph(content: string, keyword: string, modelId?: number): Promise<QuickFixResult> {
    console.log('🔧 [QUICK-FIX] Agregando keyword al primer párrafo...')

    const prompt = `Agrega "${keyword}" NATURALMENTE en el primer párrafo de este contenido HTML.

KEYWORD: "${keyword}"

INSTRUCCIONES:
1. Identifica el primer párrafo <p>
2. Inserta "${keyword}" de manera natural y coherente
3. NO fuerces el keyword si no tiene sentido
4. Mantén el resto del contenido EXACTAMENTE igual
5. Mantén TODOS los tags HTML exactamente igual

CONTENIDO:
${content}

Responde SOLO con el HTML modificado, sin explicaciones.`

    try {
      const fixedContent = await aiService.generateWithModel(prompt, modelId || 16, {
        temperature: 0.3,
        maxTokens: 4000
      })

      const changes = ['Keyword agregado al primer párrafo']

      return {
        success: true,
        fixedContent: this.cleanAIResponse(fixedContent),
        changes,
        message: '✅ Keyword agregado al primer párrafo'
      }
    } catch (error) {
      return {
        success: false,
        fixedContent: content,
        changes: [],
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }
    }
  }

  /**
   * 🧹 Limpia la respuesta de la IA
   */
  private cleanAIResponse(content: string): string {
    let cleaned = content
      .replace(/^.*?(?=<|#|\w)/s, '')
      .replace(/```html\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .trim()

    return cleaned
  }

  /**
   * 🎯 Ejecuta un quick fix específico
   */
  async applyQuickFix(request: QuickFixRequest): Promise<QuickFixResult> {
    console.log(`🔧 [QUICK-FIX] Aplicando fix: ${request.fixType}`)

    switch (request.fixType) {
      case 'transition-words':
        return this.fixTransitionWords(request.content, request.keyword, request.modelId)

      case 'keyword-density':
        // Detectar si debe aumentar o disminuir
        const wordCount = request.content.split(/\s+/).length
        const keywordCount = (request.content.toLowerCase().match(new RegExp(request.keyword.toLowerCase(), 'g')) || []).length
        const density = (keywordCount / wordCount) * 100
        const target = density < 0.5 ? 'increase' : 'decrease'
        return this.fixKeywordDensity(request.content, request.keyword, target, request.modelId)

      case 'long-sentences':
        return this.fixLongSentences(request.content, request.keyword, request.modelId)

      case 'long-paragraphs':
        return this.fixLongParagraphs(request.content, request.keyword, request.modelId)

      case 'images-alt':
        return this.fixImagesAlt(request.content, request.keyword)

      case 'keyword-first-paragraph':
        return this.fixKeywordFirstParagraph(request.content, request.keyword, request.modelId)

      default:
        return {
          success: false,
          fixedContent: request.content,
          changes: [],
          message: '❌ Tipo de fix desconocido'
        }
    }
  }
}

export const quickFixService = new QuickFixService()
