/**
 * Prompt builder for article content generation
 */

export interface ContentGenerationPromptParams {
  title: string
  keyword: string
  introParagraphs: number
  outline: Array<{
    id: string
    type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
    title: string
    paragraphs: number
    characters: number
    items?: number
  }>
}

export function buildContentGenerationPrompt(params: ContentGenerationPromptParams): string {
  const { title, keyword, introParagraphs, outline } = params
  
  // Construir la estructura del outline
  const outlineStructure = outline.map((section, index) => {
    let prefix = ''
    if (section.type === 'h2') prefix = '## '
    else if (section.type === 'h3') prefix = '### '
    else if (section.type === 'h4') prefix = '#### '
    
    let specs = ''
    if (section.type === 'list' || section.type === 'numbered-list') {
      specs = ` [${section.items || 5} items, ~${section.characters} caracteres por item]`
    } else if (section.type !== 'image') {
      specs = ` [${section.paragraphs} párrafos, ~${section.characters} caracteres]`
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

  return `Eres un redactor experto en creación de contenido SEO optimizado en español. Genera un artículo profesional completo sobre: "${title}"

📌 DATOS DEL ARTÍCULO:
- Palabra clave principal: "${keyword}"
- Número de párrafos introductorios: ${introParagraphs}

📋 ESTRUCTURA A SEGUIR (EXACTAMENTE COMO SE INDICA):
${outlineStructure}

🎯 INSTRUCCIONES CRÍTICAS:

1. **INTRODUCCIÓN**:
   - Genera EXACTAMENTE ${introParagraphs} párrafo(s) introductorio(s)
   - Incluye la palabra clave "${keyword}" en el primer párrafo
   - Engancha al lector desde la primera línea
   - NO pongas título "Introducción", empieza directo con el contenido

2. **ESTRUCTURA DE SECCIONES**:
   - Sigue EXACTAMENTE la estructura proporcionada arriba
   - Cada ## es un H2, ### es un H3, #### es un H4
   - Respeta el número de párrafos y caracteres indicados para cada sección
   - NO agregues secciones que no estén en la estructura
   - NO omitas ninguna sección de la estructura

3. **LISTAS**:
   - Cuando veas [LISTA con viñetas]: genera una lista con viñetas (-)
   - Cuando veas [LISTA numerada]: genera una lista numerada (1., 2., 3., etc.)
   - Respeta el número de items indicado
   - Cada item debe tener el número aproximado de caracteres especificado

4. **IMÁGENES**:
   - Cuando veas [IMAGEN]: coloca el marcador: ![image](URL_DE_IMAGEN)
   - Usa URLs realistas de imágenes relacionadas

5. **CITAS**:
   - Cuando veas [CITA]: genera una cita inspiradora o dato relevante
   - Formato: > "Texto de la cita"

6. **SEO Y CALIDAD**:
   - Incluye la palabra clave "${keyword}" naturalmente en el contenido
   - Densidad de keyword: 1-2% del contenido total
   - Usa sinónimos y variaciones de "${keyword}"
   - Contenido útil, informativo y bien estructurado
   - Tono profesional pero cercano
   - Sin introducciones genéricas tipo "En este artículo..."

7. **FORMATO MARKDOWN**:
   - Usa ## para H2, ### para H3, #### para H4
   - Usa - para listas con viñetas
   - Usa 1., 2., 3. para listas numeradas
   - Usa > para citas
   - NO uses código markdown con \`\`\`, solo texto plano con formato markdown

⚠️ FORMATO DE SALIDA:
Responde ÚNICAMENTE con el contenido del artículo en markdown plano.
NO incluyas explicaciones, NO uses bloques de código \`\`\`, solo el contenido.

Genera el artículo completo ahora:`
}
