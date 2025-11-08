/**
 * Prompt for generating SEO-optimized titles
 * Based on Yoast SEO and Google best practices
 */

export interface TitleGenerationPromptParams {
  keyword: string
  count: number
  additionalKeywords?: string
}

export function buildTitleGenerationPrompt(params: TitleGenerationPromptParams): string {
  const { keyword, count, additionalKeywords } = params
  
  // Build additional keywords section with concrete examples
  const additionalSection = additionalKeywords 
    ? `

🔑 PALABRAS CLAVE ADICIONALES - DEBES USAR EN TÍTULOS Y DESCRIPCIONES:
${additionalKeywords}

⚠️ CÓMO INCORPORARLAS (EJEMPLOS OBLIGATORIOS):

Si keyword = "safari jaguar bolivia" y adicionales = "tours guiados, observación fauna":

✅ CORRECTO:
- title: "Safari Jaguar Bolivia Tours Guiados: Guía 2024"
- description: "Descubre safari jaguar bolivia con tours guiados. Observación de fauna..."

❌ INCORRECTO:
- title: "Safari Jaguar Bolivia: Guía 2024" (falta palabra adicional)
- description: "Descubre safari jaguar bolivia..." (falta palabra adicional)

REGLAS:
1. CADA "title" debe incluir: "${keyword}" + 1 palabra adicional
2. CADA "description" debe incluir: "${keyword}" + 1-2 palabras adicionales
3. Distribuir TODAS las palabras adicionales entre los ${count} títulos
4. Crear ${count} COMBINACIONES diferentes`
    : ''

  return `Genera ${count} títulos SEO optimizados en español.

KEYWORD PRINCIPAL: "${keyword}"${additionalSection}

ESTRUCTURA JSON REQUERIDA:
{
  "title": "50-60 chars con ${keyword}${additionalKeywords ? ' + PALABRA ADICIONAL' : ''}",
  "h1Title": "50-70 chars creativo",
  "description": "150-160 chars con ${keyword}${additionalKeywords ? ' + PALABRAS ADICIONALES' : ''}",
  "keywords": ["kw1", "kw2", "kw3"],
  "objectivePhrase": "8-12 palabras"
}

REQUISITOS:
1. "${keyword}" AL INICIO de cada title
2. Longitudes EXACTAS${additionalKeywords ? `
3. ⚠️ OBLIGATORIO: Incluir palabras adicionales en title Y description
4. Usar TODAS las palabras adicionales distribuidas entre los ${count} títulos
5. Crear ${count} VARIACIONES ÚNICAS` : `
3. Crear ${count} VARIACIONES ÚNICAS (guía/tutorial/comparación)`}

JSON array:`
}
