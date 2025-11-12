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

🔑 PALABRAS CLAVE ADICIONALES - INCORPORAR NATURALMENTE:
${additionalKeywords}

🎯 ESTRATEGIA DE INCORPORACIÓN:
- Distribuir las palabras adicionales entre los ${count} títulos
- Integrarlas de forma NATURAL y que tenga SENTIDO
- Priorizar la LEGIBILIDAD sobre el keyword stuffing
- Usar sinónimos y variaciones cuando sea apropiado`
    : ''

  return `🚨 INSTRUCCIONES OBLIGATORIAS - LEE COMPLETO ANTES DE GENERAR 🚨

Eres un redactor experto. Debes generar ${count} títulos que cumplan EXACTAMENTE estos requisitos:

FRASE CLAVE OBJETIVA: "${keyword}"${additionalSection}

🚨 **REQUISITOS OBLIGATORIOS - SI NO LOS CUMPLES, TU RESPUESTA SERÁ RECHAZADA:**

1. **KEYWORD COMPLETA**: "${keyword}" debe aparecer EXACTA y COMPLETA en cada título
2. **LONGITUD TÍTULO**: EXACTAMENTE entre 50-60 caracteres (cuenta antes de generar)
3. **LONGITUD DESCRIPCIÓN**: EXACTAMENTE entre 150-160 caracteres (cuenta antes de generar)
4. **SIN PALABRAS DE IA**: NO uses palabras como "increíble", "fascinante", "descubre", etc.
5. **NATURALES**: Que suenen como escritos por una persona real
6. **ÚNICOS**: Cada título debe ser COMPLETAMENTE diferente

📝 **PROCESO OBLIGATORIO:**

**PASO 1:** Escribe el título
**PASO 2:** Cuenta los caracteres (debe ser 50-60)
**PASO 3:** Si no cumple, reescríbelo hasta que cumpla
**PASO 4:** Escribe la descripción
**PASO 5:** Cuenta los caracteres (debe ser 150-160)
**PASO 6:** Si no cumple, reescríbela hasta que cumpla

✅ **EJEMPLOS CORRECTOS (con conteo):**

✅ "Cómo hacer ${keyword} como un experto local" (52 chars) ✓
✅ "Los mejores lugares para ${keyword} en Brasil" (51 chars) ✓
✅ "${keyword}: guía práctica y consejos útiles" (54 chars) ✓
✅ "Mi experiencia personal con ${keyword} real" (50 chars) ✓
✅ "${keyword} para principiantes: todo lo esencial" (55 chars) ✓

🚫 **PALABRAS Y FRASES PROHIBIDAS - NO USES NINGUNA:**

**PALABRAS POMPOSAS:**
- Crucial, Intrincado, Pivotal, Meticuloso, Imprescindible
- Revolucionar, Fundamental, Esencial, Clave, Primordial
- Sustancial, Considerable, Notable, Significativo

**VERBOS ROBÓTICOS:**
- Aprovechar, Embarcarse, Profundizar, Optimizar, Potenciar
- Utilizar, Facilitar, Maximizar, Implementar, Ejecutar
- Analice, Explore, Descubre, Navegue, Examine

**DESCRIPTORES EXAGERADOS:**
- Vibrante, Vital, Dinámico, Versátil, Exhaustivo
- Completo, Integral, Intrigante, Fascinante, Cautivador
- Impresionante, Asombroso, Increíble, Espectacular

**CONCEPTOS ABSTRACTOS:**
- Tapiz, Reino, Panorama, Ecosistema, Esfera
- Interacción, Resonar, Elevar, Transformar
- Inmersión, Conexión, Sinergia, Dimensión

**FRASES TÍPICAS DE IA:**
- "Descubre las maravillas", "Explora el mundo de", "Sumérgete en"
- "En el mundo de", "En el ámbito de", "En el contexto de"
- "Juegan un papel importante", "Desempeñan un rol clave"
- "Tiene como objetivo", "Busca proporcionar"

**CONECTORES DE IA:**
- "En resumen", "En conclusión", "Para resumir"
- "Recuerda que", "No olvides que", "Ten en cuenta que"
- "Profundizar en", "Ahondar en", "Adentrarse en"

**TAMBIÉN PROHIBIDO:**
- "Guía Definitiva", "Secretos Revelados", "Top X"
- Títulos que no incluyan "${keyword}" completa
- Preguntas vagas como "¿Qué pescar?"

📝 ESTRUCTURA JSON REQUERIDA:
{
  "title": "Título SEO optimizado 50-60 chars",
  "h1Title": "MISMO título que 'title' (deben ser idénticos)",
  "description": "Meta descripción persuasiva 150-160 chars",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "objectivePhrase": "Frase objetivo clara de 8-12 palabras"
}

🚨 **VERIFICACIÓN FINAL ANTES DE RESPONDER:**

✅ ¿Cada título tiene "${keyword}" completa?
✅ ¿Cada título tiene 50-60 caracteres?
✅ ¿Cada descripción tiene 150-160 caracteres?
✅ ¿"title" y "h1Title" son idénticos?
✅ ¿No hay palabras de IA (increíble, fascinante, etc.)?
✅ ¿Todos los títulos son diferentes?

⚠️ **SI ALGUNA RESPUESTA ES NO, REESCRIBE TODO HASTA QUE SEA SÍ**${additionalKeywords ? `

🔑 **PALABRAS ADICIONALES**: Incorpora naturalmente: ${additionalKeywords}` : ''}

📊 **EJEMPLO COMPLETO CORRECTO:**

Título: "Cómo hacer ${keyword} como un experto local" (52 caracteres) ✅
Descripción: "Aprende las mejores técnicas para ${keyword} con consejos de expertos locales. Descubre los lugares secretos y equipos necesarios para una experiencia exitosa." (158 caracteres) ✅

❌ **EJEMPLOS INCORRECTOS:**
❌ Título con 38 caracteres (muy corto)
❌ Descripción con 126 caracteres (muy corta)
❌ Sin "${keyword}" completa
❌ Con palabras de IA

🚀 **GENERA AHORA ${count} TÍTULOS QUE CUMPLAN TODO:**

⚠️ **RECUERDA:** Si no cumples EXACTAMENTE con las longitudes (50-60 chars título, 150-160 chars descripción), tu respuesta será rechazada automáticamente.

📝 **CUENTA LOS CARACTERES DE CADA TÍTULO Y DESCRIPCIÓN ANTES DE RESPONDER**

JSON array:`
}
