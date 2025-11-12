/**
 * Humanize Content Service - Sistema nuevo desde cero
 * Procesa HTML sección por sección para humanizar contenido generado por IA
 */

import { TokenManager } from '@/lib/utils/token-manager'

// ===================================
// TIPOS
// ===================================

interface HumanizeOptions {
  keyword: string
  articleTitle: string
  modelId: number
  tone?: 'professional' | 'casual' | 'friendly'
  seoIssues?: string[]
  onProgress?: (step: string, progress: number) => void
  onStreaming?: (chunk: string, accumulated: string) => void
  onFallback?: () => void
}

interface HumanizeResult {
  content: string
  stats: {
    originalLength: number
    humanizedLength: number
    sectionsProcessed: number
    boldsAdded: number
    keywordCount: number
  }
  improvements: string[]
}

interface Section {
  title: string
  content: string
  isIntro: boolean
}

// ===================================
// SERVICIO PRINCIPAL
// ===================================

class HumanizeContentService {
  
  /**
   * Método principal - Humanizar contenido HTML sección por sección
   */
  async humanize(htmlContent: string, options: HumanizeOptions): Promise<HumanizeResult> {
    console.log('🚀 [HUMANIZE-NEW] Iniciando humanización...')
    
    const { keyword, articleTitle, modelId, onProgress, onStreaming, seoIssues } = options
    
    // 1. Dividir HTML en secciones
    onProgress?.('Analizando estructura...', 10)
    const sections = this.splitIntoSections(htmlContent)
    console.log(`📋 [HUMANIZE-NEW] ${sections.length} secciones encontradas`)
    
    if (sections.length === 0) {
      throw new Error('No se pudieron identificar secciones')
    }
    
    // 2. Obtener token
    const token = TokenManager.getAccessToken()
    if (!token) throw new Error('No authentication token')
    
    // 3. Procesar cada sección
    const humanizedSections: string[] = []
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const sectionNum = i + 1
      const progress = 20 + ((i / sections.length) * 60)
      
      onProgress?.(`Humanizando: ${section.title}`, Math.round(progress))
      console.log(`\n📝 [HUMANIZE-NEW] Sección ${sectionNum}/${sections.length}: "${section.title}"`)
      
      try {
        // Intentar humanizar con streaming
        const humanizedSection = await this.humanizeSection(
          section,
          { keyword, articleTitle, modelId, token, seoIssues },
          onStreaming ? (chunk, acc) => {
            // Combinar secciones ya procesadas + sección actual
            const fullContent = [...humanizedSections, acc].join('\n\n')
            onStreaming(chunk, fullContent)
          } : undefined
        )
        
        // Verificar que no se agregó contenido extra (permitir cambios si hay problemas SEO)
        const hasSEOIssues = seoIssues && seoIssues.length > 0
        const validatedSection = this.validateStructure(section.content, humanizedSection, hasSEOIssues)
        
        humanizedSections.push(validatedSection)
        console.log(`✅ [HUMANIZE-NEW] Sección ${sectionNum} completada`)
        
      } catch (error: any) {
        console.warn(`⚠️ [HUMANIZE-NEW] Error en sección ${sectionNum}, usando original`)
        humanizedSections.push(section.content)
      }
      
      // Pequeña pausa entre secciones
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    // 4. Combinar y analizar resultado
    onProgress?.('Analizando mejoras...', 90)
    const finalContent = humanizedSections.join('\n\n')
    const stats = this.calculateStats(htmlContent, finalContent, sections.length)
    const improvements = this.generateImprovements(htmlContent, finalContent, keyword, stats)
    
    onProgress?.('Completado', 100)
    console.log('✅ [HUMANIZE-NEW] Humanización completada')
    
    return {
      content: finalContent,
      stats,
      improvements
    }
  }
  
  /**
   * Dividir HTML en secciones (cada H2 + su contenido)
   */
  private splitIntoSections(html: string): Section[] {
    const sections: Section[] = []
    
    // Contenido antes del primer H2 (introducción)
    const firstH2 = html.match(/<h2[^>]*>/i)
    if (firstH2?.index && firstH2.index > 0) {
      const intro = html.substring(0, firstH2.index).trim()
      if (intro) {
        sections.push({
          title: 'Introducción',
          content: intro,
          isIntro: true
        })
      }
    }
    
    // Extraer secciones H2
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi
    const matches = Array.from(html.matchAll(h2Regex))
    
    matches.forEach((match, index) => {
      const h2Position = match.index!
      const h2Title = match[1].replace(/<[^>]+>/g, '').trim()
      
      // Contenido desde este H2 hasta el siguiente (o final)
      const nextMatch = matches[index + 1]
      const endPosition = nextMatch ? nextMatch.index! : html.length
      const sectionContent = html.substring(h2Position, endPosition).trim()
      
      sections.push({
        title: h2Title,
        content: sectionContent,
        isIntro: false
      })
    })
    
    // Si no hay H2, todo es una sección
    if (sections.length === 0) {
      sections.push({
        title: 'Contenido',
        content: html.trim(),
        isIntro: false
      })
    }
    
    return sections
  }
  
  /**
   * Humanizar una sección individual
   */
  private async humanizeSection(
    section: Section,
    context: { keyword: string; articleTitle: string; modelId: number; token: string; seoIssues?: string[] },
    onChunk?: (chunk: string, accumulated: string) => void
  ): Promise<string> {
    
    const prompt = this.buildPrompt(section, context.keyword, context.articleTitle, context.seoIssues)
    
    // Intentar con streaming
    const response = await fetch('/api/ai/generate-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.token}`
      },
      body: JSON.stringify({
        model_id: context.modelId,
        prompt,
        temperature: 0.7
      })
    })
    
    if (!response.ok || !response.body) {
      throw new Error('Streaming failed')
    }
    
    // Procesar stream
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let result = ''
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            if (parsed.chunk) {
              result += parsed.chunk
              onChunk?.(parsed.chunk, result)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
    
    return result.trim() || section.content
  }
  
  /**
   * Construir prompt para humanizar una sección
   */
  private buildPrompt(section: Section, keyword: string, articleTitle: string, seoIssues?: string[]): string {
    const seoSection = seoIssues && seoIssues.length > 0 ? `
═══════════════════════════════════════════════════════════════

🔧 PROBLEMAS SEO CRÍTICOS A CORREGIR EN TODO EL ARTÍCULO:

${seoIssues.map((issue, i) => {
  let instruction = issue
  
  // Instrucciones específicas para cada tipo de problema
  if (issue.includes('KEYWORD STUFFING')) {
    instruction += '\n   ➜ ACCIÓN: Reemplaza repeticiones innecesarias. Usa sinónimos como "este destino", "el lugar", "la región"'
  } else if (issue.includes('PÁRRAFO(S) MUY LARGO(S)')) {
    instruction += '\n   ➜ ACCIÓN: Divide párrafos largos en 2-3 párrafos más cortos. Usa <p></p> para separar.'
  } else if (issue.includes('POCOS PÁRRAFOS')) {
    instruction += '\n   ➜ ACCIÓN: Divide el contenido en más párrafos. Cada párrafo debe tener máximo 100 palabras.'
  } else if (issue.includes('NO HAY SUBTÍTULOS H2')) {
    instruction += '\n   ➜ ACCIÓN: Agrega <h2>Título de sección</h2> para dividir el contenido en temas.'
  } else if (issue.includes('NO HAY ENLACES')) {
    instruction += '\n   ➜ ACCIÓN: Agrega <a href="url">texto del enlace</a> para enlaces internos o externos.'
  } else if (issue.includes('NO HAY PALABRAS EN NEGRITA')) {
    instruction += '\n   ➜ ACCIÓN: Envuelve palabras importantes con <strong>palabra importante</strong>.'
  } else if (issue.includes('KEYWORD aparece solo')) {
    instruction += '\n   ➜ ACCIÓN: Incluye la keyword naturalmente en diferentes partes del texto.'
  }
  
  return `${i + 1}. ${instruction}`
}).join('\n')}

⚠️ CRÍTICO: Mientras humanizas ESTA sección:
• Si hay KEYWORD STUFFING: Reduce repeticiones usando sinónimos
• Si hay PÁRRAFOS LARGOS: Divídelos en párrafos más cortos
• Si falta KEYWORD: Úsala naturalmente 1-2 veces en esta sección
• Si faltan NEGRITAS: Agrega 2-3 palabras importantes con <strong>
• Si faltan ENLACES: Agrega al menos 1 enlace con <a>

═══════════════════════════════════════════════════════════════
` : ''

    return `🚨 ATENCIÓN: LEE MINUCIOSAMENTE TODAS LAS INSTRUCCIONES COMPLETAS ANTES DE RESPONDER 🚨

INSTRUCCIÓN PRINCIPAL: Tu ÚNICA tarea es humanizar el texto dentro de los tags HTML existentes.
${seoSection}
═══════════════════════════════════════════════════════════════

⚠️ REGLAS CRÍTICAS (OBLIGATORIAS):
1. Mantén EXACTAMENTE la misma cantidad de tags HTML (ni uno más, ni uno menos)
2. Si hay 3 <p>, devuelve 3 <p>. Si hay un <h2>, devuelve ese mismo <h2>
3. Si hay lista con 4 <li>, devuelve lista con 4 <li>
4. SOLO cambia el TEXTO dentro de los tags, NO los tags mismos
5. NO agregues nuevos encabezados, conclusiones, introducciones o contenido extra

⚠️ EXCEPCIONES ESPECIALES (CUANDO HAY PROBLEMAS SEO):
• SI HAY KEYWORD STUFFING: Puedes REDUCIR repeticiones de la keyword (reemplaza con sinónimos)
• SI HAY PÁRRAFOS MUY LARGOS: Puedes DIVIDIR <p> en múltiples <p> para mejorar legibilidad
• SI HAY POCOS PÁRRAFOS: Puedes AGREGAR <p> para dividir mejor el contenido
• EN ESTOS CASOS: El número de tags PUEDE cambiar (esto es permitido)

═══════════════════════════════════════════════════════════════

❌❌❌ PALABRAS Y FRASES PROHIBIDAS - NO USES NINGUNA DE ESTAS ❌❌❌

📋 LEE TODA LA LISTA COMPLETA:

PALABRAS POMPOSAS:
• Crucial, Intrincado, Pivotal, Meticuloso, Imprescindible
• Revolucionar, Fundamental, Esencial, Clave, Primordial
• Sustancial, Considerable, Notable, Significativo

VERBOS ROBÓTICOS:
• Aprovechar, Embarcarse, Profundizar, Optimizar, Potenciar
• Utilizar, Facilitar, Maximizar, Implementar, Ejecutar
• Analice, Explore, Descubre, Navegue, Examine

DESCRIPTORES EXAGERADOS:
• Vibrante, Vital, Dinámico, Versátil, Exhaustivo
• Completo, Integral, Intrigante, Fascinante, Cautivador
• Impresionante, Asombroso, Increíble, Espectacular

CONCEPTOS ABSTRACTOS:
• Tapiz, Reino, Panorama, Ecosistema, Esfera
• Interacción, Resonar, Elevar, Transformar
• Inmersión, Conexión, Sinergia, Dimensión

FRASES TÍPICAS DE IA:
• "Descubre las maravillas", "Explora el mundo de", "Sumérgete en"
• "¿Alguna vez has soñado?", "¿Te imaginas poder?"
• "Es importante tener en cuenta", "Es importante notar"
• "Vale la pena mencionar", "Cabe destacar que"
• "En el mundo de", "En el ámbito de", "En el contexto de"
• "Juegan un papel importante", "Desempeñan un rol clave"
• "Tiene como objetivo", "Busca proporcionar"
• "Navegar por el paisaje", "Recorrer el camino"

CONECTORES Y MULETILLAS DE IA:
• "En resumen", "En conclusión", "Para resumir"
• "Recuerda que", "No olvides que", "Ten en cuenta que"
• "Echale un vistazo", "Dale una oportunidad"
• "Profundizar en", "Ahondar en", "Adentrarse en"
• "Aprovechar al máximo", "Sacar el máximo provecho"

ADJETIVOS COMUNES DE IA:
• Mejorar, Ofrendas, Escaparate, Subraya, Exhibición
• Remarcó, Alinea, Garantizar, Impulsar, Fomentar

═══════════════════════════════════════════════════════════════

✅ CÓMO SÍ HUMANIZAR:
• Usa lenguaje simple y directo como habla una persona real
• Escribe oraciones cortas y variadas (mezcla cortas y largas)
• Agrega 1-2 palabras/frases importantes con <strong>texto</strong>
• Incluye "${keyword}" naturalmente 1-2 veces si cabe en el contexto
• Usa contracciones y expresiones coloquiales cuando sea apropiado
• Elimina adjetivos exagerados y usa lenguaje concreto

═══════════════════════════════════════════════════════════════

📄 CONTENIDO A HUMANIZAR:
${section.content}

═══════════════════════════════════════════════════════════════

🎯 RECUERDA ESTAS 3 COSAS:
1. Misma estructura HTML (mismos tags, misma cantidad)
2. Texto humanizado sin palabras prohibidas
3. Responde SOLO con el HTML (sin explicaciones)

RESPONDE AHORA CON EL HTML HUMANIZADO:`
  }
  
  /**
   * Validar que la estructura se mantuvo igual
   * Si hay problemas SEO, permitir cambios en párrafos
   */
  private validateStructure(original: string, humanized: string, allowSEOChanges: boolean = false): string {
    // Contar tags principales
    const originalH2 = (original.match(/<h2[^>]*>/gi) || []).length
    const humanizedH2 = (humanized.match(/<h2[^>]*>/gi) || []).length
    
    const originalH3 = (original.match(/<h3[^>]*>/gi) || []).length
    const humanizedH3 = (humanized.match(/<h3[^>]*>/gi) || []).length
    
    const originalP = (original.match(/<p[^>]*>/gi) || []).length
    const humanizedP = (humanized.match(/<p[^>]*>/gi) || []).length
    
    const originalUl = (original.match(/<ul[^>]*>/gi) || []).length
    const humanizedUl = (humanized.match(/<ul[^>]*>/gi) || []).length
    
    const originalLi = (original.match(/<li[^>]*>/gi) || []).length
    const humanizedLi = (humanized.match(/<li[^>]*>/gi) || []).length
    
    // Determinar tolerancia de cambios en párrafos
    const pTolerance = allowSEOChanges ? 5 : 1 // Si hay problemas SEO, permitir más cambios en párrafos
    
    // Si la estructura cambió significativamente, usar original
    if (
      originalH2 !== humanizedH2 ||
      originalH3 !== humanizedH3 ||
      Math.abs(originalP - humanizedP) > pTolerance ||
      originalUl !== humanizedUl ||
      Math.abs(originalLi - humanizedLi) > 2
    ) {
      console.warn(`⚠️ [HUMANIZE-NEW] Estructura modificada, usando original`)
      console.warn(`   H2: ${originalH2}→${humanizedH2}, H3: ${originalH3}→${humanizedH3}`)
      console.warn(`   P: ${originalP}→${humanizedP}, UL: ${originalUl}→${humanizedUl}, LI: ${originalLi}→${humanizedLi}`)
      return original
    }
    
    return humanized
  }
  
  /**
   * Calcular estadísticas
   */
  private calculateStats(original: string, humanized: string, sectionsCount: number) {
    return {
      originalLength: original.length,
      humanizedLength: humanized.length,
      sectionsProcessed: sectionsCount,
      boldsAdded: (humanized.match(/<strong>/gi) || []).length - (original.match(/<strong>/gi) || []).length,
      keywordCount: 0 // Se calcula en generateImprovements
    }
  }
  
  /**
   * Generar lista de mejoras
   */
  private generateImprovements(original: string, humanized: string, keyword: string, stats: any): string[] {
    const improvements: string[] = []
    
    // Keyword count
    const keywordCount = (humanized.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
    stats.keywordCount = keywordCount
    
    if (keywordCount >= 5 && keywordCount <= 10) {
      improvements.push(`✅ Keyword "${keyword}" aparece ${keywordCount} veces`)
    }
    
    // Negritas
    if (stats.boldsAdded > 0) {
      improvements.push(`✅ Agregadas ${stats.boldsAdded} negritas para SEO`)
    }
    
    // Estructura
    const h2Count = (humanized.match(/<h2>/gi) || []).length
    const h3Count = (humanized.match(/<h3>/gi) || []).length
    improvements.push(`✅ Estructura preservada (${h2Count} H2, ${h3Count} H3)`)
    
    // Longitud
    if (humanized.length > original.length) {
      improvements.push(`✅ Contenido expandido (+${humanized.length - original.length} caracteres)`)
    }
    
    return improvements
  }
}

export const humanizeContentService = new HumanizeContentService()
export type { HumanizeResult, HumanizeOptions }
