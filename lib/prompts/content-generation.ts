/**
 * Prompt builder for article content generation
 */

export interface ContentGenerationPromptParams {
  title: string
  keyword: string
  introParagraphs: number
  outline: Array<{
    id: string
    type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image' | 'faq'
    title: string
    paragraphs: number
    words: number
    items?: number
    contentType?: 'paragraphs' | 'list' | 'numbered-list'
    faqType?: 'ol' | 'ul'
    faqHeadingLevel?: 'h2' | 'h3'
    faqItems?: string[]
    faqBeforeText?: string
    faqAfterText?: string
  }>
}

export function buildContentGenerationPrompt(params: ContentGenerationPromptParams): string {
  const { title, keyword, introParagraphs, outline } = params
  
  // Construir la estructura del outline
  const outlineStructure = outline.map((section, index) => {
    // Si es una FAQ manual, generar el contenido completo directamente
    if (section.faqHeadingLevel && section.faqItems && section.faqItems.length > 0) {
      const headingPrefix = section.faqHeadingLevel === 'h2' ? '## ' : '### '
      let faqContent = `${headingPrefix}${section.title}\n\n`
      
      // Agregar párrafo antes si existe
      if (section.faqBeforeText && section.faqBeforeText.trim()) {
        faqContent += `${section.faqBeforeText.trim()}\n\n`
      }
      
      // Agregar lista de preguntas
      section.faqItems.forEach((question, idx) => {
        if (section.faqType === 'ol') {
          faqContent += `${idx + 1}. ${question}\n`
        } else {
          faqContent += `- ${question}\n`
        }
      })
      
      // Agregar párrafo después si existe
      if (section.faqAfterText && section.faqAfterText.trim()) {
        faqContent += `\n${section.faqAfterText.trim()}`
      }
      
      return `[FAQ MANUAL - USAR EXACTAMENTE ESTE CONTENIDO]:\n${faqContent}`
    }
    
    let prefix = ''
    if (section.type === 'h2') prefix = '## '
    else if (section.type === 'h3') prefix = '### '
    else if (section.type === 'h4') prefix = '#### '
    
    let specs = ''
    if (section.type === 'list' || section.type === 'numbered-list') {
      specs = ` [${section.items || 5} items, ~${section.words} palabras por item]`
    } else if (section.type !== 'image') {
      specs = ` [${section.paragraphs} párrafos, ~${section.words} palabras]`
    }
    
    if (section.type === 'image') {
      return `[IMAGEN: ${section.title}]`
    } else if (section.type === 'list') {
      return `[LISTA con viñetas]: ${section.title}${specs}`
    } else if (section.type === 'numbered-list') {
      return `[LISTA numerada]: ${section.title}${specs}`
    } else if (section.type === 'quote') {
      return `[CITA]: ${section.title}${specs}`
    } else {
      return `${prefix}${section.title}${specs}`
    }
  }).join('\n')

  // Las instrucciones anti-robóticas están en ANTI_AI_INSTRUCTIONS abajo

  // Instrucciones anti-IA específicas y estrictas (mantenidas para compatibilidad)
  const ANTI_AI_INSTRUCTIONS = `
🚫 **PROHIBIDO ABSOLUTO - PALABRAS Y FRASES DE IA:**

**NUNCA uses estas palabras:**
- Crucial, Intrincado, Pivotal, Meticuloso, Sustancial, Robusto
- Aprovechar, Embarcarse, Profundizar, Navegar, Desentrañar
- Vibrante, Dinámico, Innovador, Revolucionario, Vanguardista
- Tapiz, Reino, Panorama, Ecosistema, Espectro, Faceta
- Además, Asimismo, Por otro lado, Sin embargo, No obstante

**NUNCA uses estas frases:**
- "Descubre las maravillas de..."
- "En este artículo exploraremos..."
- "Sumérgete en el fascinante mundo de..."
- "¿Alguna vez te has preguntado...?"
- "¿Sueñas con..."
- "¿Anhelas..."
- "¿Te imaginas..."
- "En el vasto panorama de..."
- "Es importante destacar que..."
- "Cabe mencionar que..."
- "Vale la pena señalar..."

**✅ EN SU LUGAR:**
- Usa palabras simples y directas
- Comienza directamente con información útil
- Escribe como si fueras un experto humano compartiendo conocimiento
- Usa un tono conversacional pero profesional
- Evita introducciones dramáticas o preguntas retóricas

**VERIFICACIÓN FINAL:**
Antes de generar, pregúntate: "¿Esto suena como lo escribiría una persona real?"
Si la respuesta es no, reescribe con un tono más natural.
`

  return `Eres un redactor experto. Escribe un artículo natural y profesional.

ARTÍCULO: "${title}"
KEYWORD: "${keyword}"
PÁRRAFOS INTRODUCTORIOS: ${introParagraphs}

🚫 NUNCA uses:
- "¿Sueñas con...", "¿Anhelas...", "¿Te imaginas..."
- "Descubre", "Sumérgete", "Embárcate"
- "Fascinante", "Increíble", "Asombroso"
- "En este artículo...", "A continuación..."

✅ SÍ escribe:
- Directo al tema desde el primer párrafo
- Como un experto humano real
- Usa "${keyword}" naturalmente
- Oraciones cortas (máximo 20 palabras)
- Conecta párrafos con: además, también, sin embargo, por ejemplo

📋 ESTRUCTURA A SEGUIR:
${outlineStructure}

📝 INSTRUCCIONES CRÍTICAS:
1. Sigue EXACTAMENTE la estructura de arriba - cada sección debe ser DIFERENTE
2. Cada título (##, ###) debe tener contenido ESPECÍFICO para ese tema
3. NO repitas el mismo texto en diferentes secciones
4. Incluye "${keyword}" naturalmente (no forzado)
5. Usa palabras de transición entre párrafos
6. Pon "${keyword}" en **negrita** una vez por sección
7. Escribe en markdown: ## H2, ### H3, **negrita**, - listas

🚨 CRÍTICO - FAQs MANUALES:
- Si ves "[FAQ MANUAL - USAR EXACTAMENTE ESTE CONTENIDO]", copia ese contenido EXACTAMENTE
- NO modifiques, cambies o generes nuevo contenido para las FAQs manuales
- NO agregues ni quites preguntas de las FAQs manuales
- NO cambies el formato de las listas en FAQs manuales
- Las FAQs manuales son contenido final del usuario

🚨 IMPORTANTE: Cada sección debe hablar específicamente de su título, NO del tema general.

Genera el artículo completo ahora:`
}
