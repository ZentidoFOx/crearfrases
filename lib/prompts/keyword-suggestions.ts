/**
 * Prompt for generating keyword suggestions
 */

export interface KeywordSuggestionsPromptParams {
  baseKeyword: string
  existingKeywords: string[]
}

export function buildKeywordSuggestionsPrompt(params: KeywordSuggestionsPromptParams): string {
  const { baseKeyword, existingKeywords } = params
  
  const existingList = existingKeywords.length > 0 
    ? `\n\nPalabras clave YA EXISTENTES (NO incluir):\n${existingKeywords.map(k => `- ${k}`).join('\n')}`
    : ''

  return `Eres un experto en SEO y marketing digital en español. Genera 15 FRASES CLAVE COMPLETAS basadas en: "${baseKeyword}"${existingList}

🎯 OBJETIVO: Frases NATURALES de 3-5 palabras que usuarios realmente escribirían en Google

📌 REGLAS CRÍTICAS YOAST SEO:

1. ✅ EXACTAMENTE 3-5 PALABRAS POR FRASE (obligatorio)
   ✅ "safari de jaguares en Pantanal" (5 palabras) ✓
   ✅ "mejor época para ver jaguares" (5 palabras) ✓
   ✅ "tours de avistamiento jaguares" (4 palabras) ✓
   ✅ "jaguares en Brasil" (3 palabras) ✓
   
   ❌ "safari jaguares" (2 palabras - muy corto) ✗
   ❌ "mejores lugares para ver jaguares salvajes en Brasil" (8 palabras - muy largo) ✗

2. ✅ FRASES COMPLETAS Y NATURALES
   ✅ "safari de jaguares en Pantanal" (completa, natural)
   ✅ "mejor época para ver jaguares" (completa, natural)
   ✅ "tours de avistamiento de jaguares" (completa, natural)
   
   ❌ "safari jaguares Pantanal" (sin preposiciones, suena mal)
   ❌ "mejor época ver jaguares" (falta "para", incompleta)
   ❌ "tours avistamiento jaguares" (sin preposiciones, antinatural)

3. ✅ GRAMÁTICA PERFECTA EN ESPAÑOL
   ✅ "dónde ver jaguares en Brasil" (pregunta completa)
   ✅ "experiencia única con jaguares" (frase completa)
   ✅ "cuándo viajar a ver jaguares" (pregunta natural)
   
   ❌ "dónde ver jaguares Brasil" (falta "en")
   ❌ "experiencia única jaguares" (falta "con")
   ❌ "cuándo viajar ver jaguares" (falta "a")

4. ✅ INCLUIR PREPOSICIONES Y ARTÍCULOS NECESARIOS
   - "de", "en", "con", "para", "a", "el", "la", "los", "las"
   - Ejemplo: "tours DE avistamiento DE jaguares EN el Pantanal"
   - NO: "tours avistamiento jaguares Pantanal" ❌

🌟 TIPOS DE FRASES (todas con sentido completo y 3-5 palabras):

**A) Frases con ubicación:**
✅ "safari de jaguares en Pantanal" (5 palabras)
✅ "tours al Pantanal brasileño" (4 palabras)
✅ "jaguares en el Pantanal" (4 palabras)

**B) Frases con acción completa:**
✅ "cómo ver jaguares salvajes" (4 palabras)
✅ "qué hacer para ver jaguares" (5 palabras)
✅ "dónde observar jaguares" (3 palabras)

**C) Frases con tiempo:**
✅ "mejor época para jaguares" (4 palabras)
✅ "cuándo viajar al Pantanal" (4 palabras)
✅ "temporada ideal de jaguares" (4 palabras)

**D) Frases con tipo de servicio:**
✅ "tours privados de jaguares" (4 palabras)
✅ "excursiones para ver jaguares" (4 palabras)
✅ "guías especializados en jaguares" (4 palabras)

**E) Frases con características:**
✅ "jaguares salvajes del Pantanal" (4 palabras)
✅ "avistamiento nocturno de jaguares" (4 palabras)
✅ "fotografía de jaguares" (3 palabras)

🚨 VALIDACIÓN OBLIGATORIA:
Antes de generar cada frase, cuenta las palabras:
- "safari de jaguares en Pantanal" = 5 palabras ✓
- "mejor época para ver jaguares" = 5 palabras ✓
- "tours de avistamiento" = 3 palabras ✓

⚠️ FORMATO DE RESPUESTA:
Genera EXACTAMENTE 15 frases clave, una por línea.
Cada frase debe tener EXACTAMENTE 3, 4 o 5 palabras.
Sin numeración, sin guiones, sin explicaciones.
SOLO las frases clave.

Ejemplo de respuesta correcta:
safari de jaguares en Pantanal
mejor época para ver jaguares
tours de avistamiento de jaguares
jaguares en el Pantanal brasileño
cómo ver jaguares salvajes

Genera ahora 15 frases clave que cumplan TODOS los requisitos:`
}
