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
    words: number
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

  return `🚨🚨🚨 INSTRUCCIONES CRÍTICAS - LEE ANTES DE ESCRIBIR 🚨🚨🚨

❌❌❌ PROHIBIDO ABSOLUTO ❌❌❌
NUNCA NUNCA NUNCA empieces con:
- "¿Sueñas con..."
- "¿Anhelas..."
- "¿Te imaginas..."
- "Descubre el fascinante..."

Si usas cualquiera de estas frases = FALLO TOTAL

✅ EMPIEZA DIRECTAMENTE ASÍ:
"La pesca en el Amazonas requiere técnicas específicas..."
"Los pescadores experimentados conocen..."
"El río Amazonas ofrece oportunidades únicas..."

Eres un redactor experto que escribe contenido NATURAL y SEO optimizado en español.

ARTÍCULO: "${title}"
KEYWORD PRINCIPAL: "${keyword}"
PÁRRAFOS INTRODUCTORIOS: ${introParagraphs}

🚨 **PROHIBIDO ABSOLUTO - NUNCA USES ESTAS PALABRAS/FRASES:**

❌ **NUNCA EMPIECES CON:**
- "¿Sueñas con..."
- "¿Anhelas..."
- "¿Te imaginas..."
- "¿Alguna vez has pensado..."
- "Descubre el fascinante..."
- "Sumérgete en..."
- "Embárcate en..."
- "Adéntrate en..."
- "Explora las maravillas..."

❌ **NUNCA USES ESTAS PALABRAS:**
- Fascinante, Increíble, Asombroso, Espectacular
- Maravilloso, Extraordinario, Deslumbrante, Mágico
- Crucial, Fundamental, Esencial, Imprescindible
- Sumérgete, Embárcate, Adéntrate, Descubre
- Tapiz, Reino, Panorama, Ecosistema, Esfera

❌ **NUNCA USES ESTAS FRASES:**
- "En este artículo exploraremos..."
- "A lo largo de este artículo..."
- "Sin más preámbulos..."
- "En conclusión..."
- "Para finalizar..."
- "Es importante destacar que..."
- "Cabe mencionar que..."
- "Vale la pena señalar..."

${ANTI_AI_INSTRUCTIONS}

✅ **EN SU LUGAR, ESCRIBE ASÍ:**
- Comienza DIRECTAMENTE con información útil
- Usa palabras simples: importante, útil, práctico, bueno
- Escribe como si fueras un experto humano real
- Da consejos directos y específicos
- NO hagas preguntas dramáticas al inicio

🚨 **EJEMPLO CORRECTO:**
"La pesca en el Amazonas requiere técnicas específicas. Los pescadores locales utilizan..."

🚨 **EJEMPLO INCORRECTO:**
"¿Sueñas con descubrir el fascinante mundo de la pesca en el Amazonas? Sumérgete en..."
- Ejemplos concretos y específicos
- Tono natural y cercano

🚨 **VERIFICACIÓN OBLIGATORIA ANTES DE ESCRIBIR:**
1. ¿Empiezo con "¿Sueñas" o "¿Anhelas"? → SI = REESCRIBIR
2. ¿Uso "fascinante" o "increíble"? → SI = CAMBIAR por "útil" o "importante"
3. ¿Digo "Descubre" o "Sumérgete"? → SI = CAMBIAR por "Conoce" o "Aprende"
4. ¿Suena como IA o como persona real? → DEBE sonar como PERSONA REAL

📋 ESTRUCTURA A SEGUIR (EXACTAMENTE):
${outlineStructure}

🎯 **INSTRUCCIONES CRÍTICAS - OBLIGATORIAS:**

1. **INTRODUCCIÓN NATURAL**:
   - Genera EXACTAMENTE ${introParagraphs} párrafo(s) introductorio(s)
   - Incluye "${keyword}" NATURALMENTE en el primer párrafo
   - Engancha al lector con una experiencia, pregunta o dato interesante
   - NO uses frases como "En este artículo", "A continuación", "Descubrirás"
   - Empieza directo con contenido útil y específico

2. **ESTRUCTURA DE SECCIONES - OBLIGATORIO**:
   - Debes seguir EXACTAMENTE la estructura proporcionada arriba
   - NO inventes titulos ni secciones adicionales
   - NO omitas ninguna seccion de la estructura
   - NO cambies el orden de las secciones
   - Cada ## es un H2, ### es un H3, #### es un H4
   - Respeta el numero EXACTO de parrafos indicados para cada seccion
   - Respeta el numero aproximado de palabras indicadas

3. **VALIDACION OBLIGATORIA**:
   - Antes de terminar, verifica que TODAS las secciones del outline esten incluidas
   - Verifica que cada seccion tenga el numero de parrafos especificado
   - Si el outline tiene N secciones, tu articulo debe tener EXACTAMENTE N secciones

4. **LISTAS**:
   - Cuando veas [LISTA con vinetas]: genera una lista con vinetas (-)
   - Cuando veas [LISTA numerada]: genera una lista numerada (1., 2., 3., etc.)
   - Respeta el numero de items indicado
   - Cada item debe tener el numero aproximado de palabras especificado

5. **IMAGENES**:
   - Cuando veas [IMAGEN]: coloca el marcador: ![image](URL_DE_IMAGEN)
   - Usa URLs realistas de imagenes relacionadas

6. **CITAS**:
   - Cuando veas [CITA]: genera una cita inspiradora o dato relevante
   - Formato: > "Texto de la cita"

7. **SEO NATURAL Y OPTIMIZACIÓN YOAST:**
   - Incluye "${keyword}" de forma NATURAL (no forzada)
   - Densidad de keyword: 1-1.5% del contenido total
   - Usa sinónimos y variaciones de "${keyword}"
   - **PALABRAS DE TRANSICIÓN OBLIGATORIAS**: Usa palabras como "además", "por ejemplo", "sin embargo", "por lo tanto", "también", "asimismo" para conectar ideas
   - **ORACIONES CORTAS**: Máximo 20 palabras por oración. Si una oración es larga, divídela en dos
   - **NEGRITAS EN KEYWORDS**: Pon en negrita la palabra clave principal y palabras importantes como "importante", "esencial", "mejor", "recomendado"
   - Contenido útil con ejemplos CONCRETOS y ESPECÍficos
   - Tono natural como si fuera escrito por un experto real
   - Evita TODAS las palabras y frases prohibidas listadas arriba
   - Incluye datos, números, ubicaciones específicas cuando sea relevante

8. **OPTIMIZACIÓN YOAST SEO ESPECÍFICA:**
   - **Palabras de transición**: Cada párrafo debe conectarse con el anterior usando palabras como:
     * "Además" / "También" / "Por otra parte" (para agregar información)
     * "Sin embargo" / "Por el contrario" (para contrastar)
     * "Por ejemplo" / "Como muestra" (para ejemplificar)
     * "Por lo tanto" / "En consecuencia" (para conclusiones)
   - **Control de longitud**: Ninguna oración debe superar 20 palabras
   - **Negritas estratégicas**: Usa **negrita** en:
     * La palabra clave principal "${keyword}" (primera aparición por párrafo)
     * Palabras importantes: **importante**, **esencial**, **mejor**, **recomendado**, **útil**, **práctico**
     * Conceptos clave del tema

9. **FORMATO MARKDOWN (Compatible con react-markdown + remark-gfm + rehype-raw)**:
   - Usa ## para H2, ### para H3, #### para H4
   - Usa **negrita** con doble asterisco (no <strong>)
   - Usa *cursiva* con un asterisco (no <em>)
   - Listas con viñetas: línea vacía antes, luego "- item"
   - Listas numeradas: línea vacía antes, luego "1. item"
   - Usa > para citas (blockquotes)
   - NO uses HTML crudo, SOLO markdown puro
   - Separa SIEMPRE bloques (párrafos, listas, títulos) con línea vacía
   - NO uses código markdown con \`\`\`, solo texto plano con formato markdown

🚨 **VERIFICACIÓN FINAL OBLIGATORIA - LEE ANTES DE RESPONDER:**

✅ ¿Empiezo con "¿Sueñas" o "¿Anhelas"? → SI = REESCRIBIR COMPLETAMENTE
✅ ¿Uso "fascinante", "increíble", "asombroso"? → SI = CAMBIAR por "importante", "útil"
✅ ¿Digo "Descubre", "Sumérgete", "Embárcate"? → SI = CAMBIAR por "Conoce", "Aprende"
✅ ¿Empiezo con "En este artículo"? → SI = EMPEZAR DIRECTO CON INFORMACIÓN
✅ ¿"${keyword}" aparece naturalmente?
✅ ¿Suena como escrito por una persona real?
✅ ¿Seguí EXACTAMENTE la estructura del outline?

🎯 **VERIFICACIÓN YOAST SEO OBLIGATORIA:**
✅ ¿Cada párrafo tiene palabras de transición? (además, también, sin embargo, por ejemplo)
✅ ¿Todas las oraciones tienen menos de 20 palabras?
✅ ¿"${keyword}" está en **negrita** al menos una vez por sección?
✅ ¿Hay palabras importantes en **negrita**? (importante, esencial, mejor, útil)
✅ ¿Los párrafos se conectan lógicamente entre sí?

🚨 **SI USAS CUALQUIER PALABRA PROHIBIDA, REESCRIBE TODO**

✅ **EJEMPLO DE INICIO CORRECTO:**
"La pesca en el Amazonas requiere conocimiento local. Los pescadores experimentados..."

❌ **EJEMPLO DE INICIO INCORRECTO:**
"¿Sueñas con vivir una experiencia fascinante? Descubre el increíble mundo..."

📝 **FORMATO DE SALIDA:**
Responde ÚNICAMENTE con el contenido del artículo en markdown plano.
NO incluyas explicaciones, NO uses bloques de código \`\`\`, solo el contenido natural.

🚨 **RECORDATORIO FINAL:**
Si escribes "¿Sueñas", "¿Anhelas", "Descubre", "fascinante" o "increíble" = FALLO TOTAL
Escribe como una PERSONA REAL, no como IA.

Genera el artículo NATURAL y LIBRE DE IA ahora:`
}
