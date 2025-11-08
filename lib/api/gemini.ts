/**
 * Gemini AI Service
 * Handles all interactions with Google Gemini AI
 * API Key is fetched from backend for centralized management
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { apiKeyProvider } from '@/lib/utils/api-key-provider'

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null
  private initPromise: Promise<void> | null = null

  /**
   * Initialize the service with API key from backend
   */
  private async init(): Promise<void> {
    if (this.genAI && this.model) {
      return // Already initialized
    }

    try {
      const apiKey = await apiKeyProvider.getGeminiKey()
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error)
      throw new Error('No se pudo inicializar el servicio de Gemini. Contacta al administrador.')
    }
  }

  /**
   * Ensure service is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.init()
    }
    await this.initPromise
  }

  /**
   * Generate keyword suggestions using AI
   */
  async generateKeywordSuggestions(baseKeyword: string, existingKeywords: string[]): Promise<string[]> {
    await this.ensureInitialized()
    
    try {
      const prompt = `Eres un experto en SEO y marketing digital en español. Genera 15 FRASES CLAVE COMPLETAS basadas en: "${baseKeyword}"

Palabras clave existentes (NO repetir):
${existingKeywords.length > 0 ? existingKeywords.map(k => `- ${k}`).join('\n') : '- Ninguna'}

🎯 OBJETIVO: Frases NATURALES de 3-5 palabras que usuarios realmente escribirían en Google

📌 REGLAS CRÍTICAS:

1. ✅ FRASES COMPLETAS Y NATURALES
   ✅ "safari de jaguares en Pantanal" (completa, natural)
   ✅ "mejor época para ver jaguares" (completa, natural)
   ✅ "tours de avistamiento de jaguares" (completa, natural)
   
   ❌ "safari jaguares Pantanal" (sin preposiciones, suena mal)
   ❌ "mejor época ver jaguares" (falta "para", incompleta)
   ❌ "tours avistamiento jaguares" (sin preposiciones, antinatural)

2. ✅ GRAMÁTICA PERFECTA EN ESPAÑOL
   ✅ "dónde ver jaguares en Brasil" (pregunta completa)
   ✅ "experiencia única con jaguares" (frase completa)
   ✅ "cuándo viajar a ver jaguares" (pregunta natural)
   
   ❌ "dónde ver jaguares Brasil" (falta "en")
   ❌ "experiencia única jaguares" (falta "con")
   ❌ "cuándo viajar ver jaguares" (falta "a")

3. ✅ INCLUIR PREPOSICIONES Y ARTÍCULOS NECESARIOS
   - "de", "en", "con", "para", "a", "el", "la", "los", "las"
   - Ejemplo: "tours DE avistamiento DE jaguares EN el Pantanal"
   - NO: "tours avistamiento jaguares Pantanal" ❌

🌟 TIPOS DE FRASES (todas con sentido completo):

**A) Frases con ubicación:**
✅ "safari de jaguares en Pantanal"
✅ "tours al Pantanal para ver jaguares"
✅ "jaguares en el Pantanal brasileño"

**B) Frases con acción completa:**
✅ "cómo ver jaguares en Brasil"
✅ "qué hacer para ver jaguares"
✅ "dónde observar jaguares salvajes"

**C) Frases con tiempo:**
✅ "mejor época para ver jaguares"
✅ "cuándo viajar a ver jaguares"
✅ "temporada ideal de jaguares"

**D) Frases con tipo de servicio:**
✅ "tours privados de avistamiento jaguares"
✅ "safari fotográfico de jaguares"
✅ "expedición guiada para ver jaguares"

**E) Frases con intención de compra:**
✅ "reservar safari de jaguares"
✅ "precio de tours de jaguares"
✅ "paquetes para ver jaguares"

🎨 EJEMPLOS PERFECTOS (lee en voz alta, deben sonar bien):

✅ "safari de jaguares en Pantanal" → ✓ Suena natural
✅ "mejor época para ver jaguares" → ✓ Frase completa
✅ "tours de avistamiento de jaguares" → ✓ Gramaticalmente correcta
✅ "dónde ver jaguares en Brasil" → ✓ Pregunta natural
✅ "experiencia única con jaguares salvajes" → ✓ Frase atractiva

❌ ERRORES QUE DEBES EVITAR:

❌ "safari jaguares Pantanal" → Falta "de" y "en"
❌ "mejor época ver jaguares" → Falta "para"
❌ "tours avistamiento jaguares" → Falta "de"
❌ "dónde ver jaguares Brasil" → Falta "en"
❌ "jaguares" → Demasiado corta

🔥 VALIDACIÓN: Antes de incluir una frase, pregúntate:
1. ¿La diría un usuario real en Google? ✓
2. ¿Tiene sentido gramatical completo? ✓
3. ¿Incluye todas las preposiciones necesarias? ✓
4. ¿Suena natural al leerla en voz alta? ✓

Si alguna respuesta es NO, NO la incluyas.

Genera 15 frases clave NATURALES Y COMPLETAS (3-5 palabras).
Devuelve SOLO las frases, una por línea, sin numeración.`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Count total words in phrase
      const countTotalWords = (phrase: string): number => {
        return phrase.trim().split(/\s+/).length
      }
      
      const suggestions = text
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter((line: string) => {
          if (line.length === 0) return false
          const totalWords = countTotalWords(line)
          // Accept suggestions with 3-5 TOTAL words (long-tail keywords)
          return totalWords >= 3 && totalWords <= 5
        })
        .slice(0, 15)

      console.log(`✅ Generated ${suggestions.length} long-tail keyword suggestions (3-5 words each)`)
      suggestions.forEach((s: string, i: number) => {
        const wordCount = countTotalWords(s)
        console.log(`${i + 1}. "${s}" (${wordCount} palabras)`)
      })

      return suggestions
    } catch (error) {
      console.error('Error generating keyword suggestions:', error)
      return []
    }
  }

  /**
   * Generate complete title suggestions with description, keywords, and objective phrase
   * Optimized for Yoast SEO standards
   */
  async generateTitlesComplete(keyword: string, count: number = 5, additionalKeywords: string = ''): Promise<Array<{
    title: string
    h1Title: string
    description: string
    keywords: string[]
    objectivePhrase: string
    seoScore: {
      keywordInTitle: boolean
      keywordInDescription: boolean
      keywordDensity: number
      titleLength: number
      descriptionLength: number
    }
  }>> {
    await this.ensureInitialized()
    
    try {
      const keywordsToUse = additionalKeywords.trim() 
        ? `${keyword} (Reforzar con: ${additionalKeywords})`
        : keyword
      
      const additionalKeywordsHint = additionalKeywords.trim()
        ? `\n\n🎯 CONTEXTO ADICIONAL (usar para enriquecer el título):\n${additionalKeywords}\n\n⚠️ IMPORTANTE: Estas palabras son CONTEXTO para crear títulos más específicos y atractivos.\nNO las fuerces todas. Úsalas SOLO si tienen sentido natural.\n\n✅ CÓMO USAR EL CONTEXTO:\n- Si menciona lugar (Brasil, Pantanal): Agrégalo naturalmente\n- Si menciona tema (jaguares, safaris): Incorpóralo en el tema del título\n- Si menciona tipo (guía, consejos): Úsalo en la descripción del contenido\n- Si menciona tiempo (2024, mejor época): Agrégalo si es relevante\n\nEjemplo 1:\nKeyword: "cuándo visitar el Pantanal"\nContexto: "brasil, jaguar, safaris"\nTÍTULO SEO: "Mejor época para safaris de jaguares en el Pantanal" ← Combina naturalmente\nTÍTULO H1: "Cuándo visitar el Pantanal de Brasil: Mejor época para safaris de jaguares" ← Frase completa\n\nEjemplo 2:\nKeyword: "tours al Pantanal"\nContexto: "guía completa, 2024, mejores"\nTÍTULO SEO: "Mejores tours al Pantanal 2024: Guía completa" ← Natural\nTÍTULO H1: "Los mejores tours al Pantanal en 2024: Guía completa para tu aventura" ← Expandido`
        : ''

      const prompt = `Eres un experto en SEO y copywriting en español. Genera ${count} títulos COMPLETOS Y NATURALES para: "${keyword}"${additionalKeywordsHint}

🎯 OBJETIVO: Títulos que suenen NATURALES y COMPLETOS en español, sin fragmentaciones

⚠️ CRÍTICO PARA SEO:
🔴 OBLIGATORIO: La frase clave "${keyword}" DEBE aparecer COMPLETA en AMBOS títulos (SEO y H1)
🔴 NO cambies la keyword principal
🔴 NO omitas ninguna palabra de la keyword
🔴 Puedes agregar palabras ANTES o DESPUÉS, pero la keyword DEBE estar completa

Ejemplo:
Keyword: "cuándo visitar el Pantanal"
✅ CORRECTO: "Cuándo visitar el Pantanal: Mejor época" ← Keyword completa
✅ CORRECTO: "Mejor época para saber cuándo visitar el Pantanal" ← Keyword completa
❌ INCORRECTO: "Mejor época para visitar el Pantanal" ← Falta "cuándo"
❌ INCORRECTO: "Cuándo ir al Pantanal" ← Cambió "visitar" por "ir"

📌 REGLAS CRÍTICAS PARA TÍTULOS:

1. ✅ FRASES COMPLETAS Y NATURALES
   ✅ "Mejor época para visitar el Pantanal: Guía completa" (natural)
   ✅ "Cuándo visitar el Pantanal para ver fauna salvaje" (completo)
   ✅ "Guía completa para visitar el Pantanal en temporada seca" (frase completa)
   
   ❌ "Cuándo visitar el Pantanal: Meses top para fauna" (fragmentado, "top" no es español)
   ❌ "Cuándo visitar el Pantanal: Guía planificación viaje" (sin preposiciones)
   ❌ "Cuándo visitar el Pantanal: Seca vs. Lluvias" (muy fragmentado)

2. ✅ GRAMÁTICA PERFECTA EN ESPAÑOL
   ✅ "Los mejores meses para visitar el Pantanal" (artículo + sustantivo)
   ✅ "Cuándo viajar al Pantanal: Guía de temporadas" (preposiciones correctas)
   ✅ "Visitar el Pantanal: Todo lo que necesitas saber" (frase completa)
   
   ❌ "Visitar Pantanal: Guía completa" (falta artículo "el")
   ❌ "Mejor época Pantanal fauna" (sin preposiciones)
   ❌ "Cuándo visitar Pantanal temporada seca" (sin artículos)

3. ✅ EVITAR ANGLICISMOS Y FRAGMENTACIONES
   ❌ "Meses top" → ✅ "Mejores meses"
   ❌ "Guía planificación" → ✅ "Guía de planificación" o "Guía para planificar"
   ❌ "Seca vs. Lluvias" → ✅ "Temporada seca o de lluvias"
   ❌ "Tips viaje" → ✅ "Consejos para tu viaje"

IMPORTANTE: Genera DOS TÍTULOS DIFERENTES:
1. **TÍTULO SEO**: Para meta title (40-60 caracteres, natural y completo)
2. **TÍTULO H1**: Para el artículo (60-120 caracteres, más descriptivo y atractivo)

REQUISITOS YOAST SEO:
✓ TÍTULO SEO: 40-60 caracteres, incluir "${keyword}" de forma natural${additionalKeywords ? ' + contexto relevante' : ''}
✓ TÍTULO H1: 60-120 caracteres, más descriptivo${additionalKeywords ? ' + contexto enriquecido' : ''}
✓ PALABRA CLAVE EN DESCRIPCIÓN: incluir "${keyword}" naturalmente
✓ DESCRIPCIÓN: 150-160 caracteres, frase completa y natural${additionalKeywords ? ' + contexto' : ''}
✓ Usar palabras profesionales: "guía completa", "todo lo que necesitas saber", "mejores consejos"
✓ NUNCA usar anglicismos: "top", "tips", "vs", etc.
${additionalKeywords ? '✓ Usa el CONTEXTO para hacer títulos más específicos, NO fuerces todas las palabras' : ''}

Para CADA propuesta, formato EXACTO:
---
TÍTULO SEO: [40-60 caracteres, frase COMPLETA y NATURAL]
TÍTULO H1: [60-120 caracteres, frase COMPLETA y DESCRIPTIVA]
DESCRIPCIÓN: [150-160 caracteres, incluir "${keyword}", frase COMPLETA]
KEYWORDS: [palabra1, palabra2, palabra3, palabra4, palabra5]
FRASE CLAVE: [objetivo en 5-8 palabras, FRASE COMPLETA]
---

EJEMPLOS PERFECTOS DE USO DE CONTEXTO:

**Ejemplo 1 (SIN contexto adicional):**
Keyword: "cuándo visitar el Pantanal"
TÍTULO SEO: "Cuándo visitar el Pantanal: Mejor época" ← Keyword COMPLETA
TÍTULO H1: "Cuándo visitar el Pantanal: Guía completa de temporadas y clima" ← Keyword COMPLETA
DESCRIPCIÓN: "Descubre cuándo visitar el Pantanal para ver fauna salvaje. Guía con mejores meses y consejos."

**Ejemplo 2 (CON contexto: "brasil, jaguar, safaris"):**
Keyword: "cuándo visitar el Pantanal"
TÍTULO SEO: "Cuándo visitar el Pantanal para safaris de jaguares" ← Keyword COMPLETA + contexto
TÍTULO H1: "Cuándo visitar el Pantanal de Brasil: Mejor época para safaris de jaguares" ← Keyword COMPLETA + contexto
DESCRIPCIÓN: "Descubre cuándo visitar el Pantanal para safaris de jaguares en Brasil. Guía con mejor época y meses ideales."

**Ejemplo 3 (CON contexto: "guía completa, 2024, mejores"):**
Keyword: "tours al Pantanal"
TÍTULO SEO: "Tours al Pantanal 2024: Guía completa" ← Keyword COMPLETA + contexto
TÍTULO H1: "Los mejores tours al Pantanal en 2024: Guía completa para tu aventura" ← Keyword COMPLETA + contexto
DESCRIPCIÓN: "Descubre los mejores tours al Pantanal en 2024. Guía completa con opciones, precios y consejos para tu viaje."

**Ejemplo 4 (CON contexto: "aventura única, fauna salvaje"):**
Keyword: "viaje al Pantanal"
TÍTULO SEO: "Viaje al Pantanal: Aventura única de fauna" ← Keyword COMPLETA + contexto
TÍTULO H1: "Viaje al Pantanal: Una aventura única para descubrir fauna salvaje" ← Keyword COMPLETA + contexto
DESCRIPCIÓN: "Vive un viaje al Pantanal, una aventura única para observar fauna salvaje en el ecosistema más rico de Brasil."

Genera ahora ${count} propuestas con TÍTULOS COMPLETOS Y NATURALES${additionalKeywords ? ', usando el contexto para enriquecer (NO forzar todas las palabras)' : ''}:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the response
      const titles: Array<{
        title: string
        h1Title: string
        description: string
        keywords: string[]
        objectivePhrase: string
        seoScore: {
          keywordInTitle: boolean
          keywordInDescription: boolean
          keywordDensity: number
          titleLength: number
          descriptionLength: number
        }
      }> = []

      // Split by --- to get each title block
      const blocks = text.split('---').filter((block: string) => block.trim().length > 0)

      for (const block of blocks) {
        const titleSeoMatch = block.match(/TÍTULO SEO:\s*([^\n]+)/i)
        const titleH1Match = block.match(/TÍTULO H1:\s*([^\n]+)/i)
        const descriptionMatch = block.match(/DESCRIPCIÓN:\s*([^\n]+)/i)
        const keywordsMatch = block.match(/KEYWORDS:\s*([^\n]+)/i)
        const phraseMatch = block.match(/FRASE CLAVE:\s*([^\n]+)/i)

        if (titleSeoMatch && titleH1Match && descriptionMatch && keywordsMatch && phraseMatch) {
          const title = titleSeoMatch[1].trim()
          const h1Title = titleH1Match[1].trim()
          const description = descriptionMatch[1].trim()
          const keywordsList = keywordsMatch[1]
            .split(',')
            .map((k: string) => k.trim())
            .filter((k: string) => k.length > 0)

          // Calculate SEO metrics
          const keywordLower = keyword.toLowerCase()
          const titleLower = title.toLowerCase()
          const descriptionLower = description.toLowerCase()

          // Check if keyword is in title
          const keywordInTitle = titleLower.includes(keywordLower)

          // Check if keyword is in description
          const keywordInDescription = descriptionLower.includes(keywordLower)

          // Calculate keyword density in description
          const keywordCount = (descriptionLower.match(new RegExp(keywordLower, 'g')) || []).length
          const descriptionWords = description.split(/\s+/).length
          const keywordDensity = (keywordCount / descriptionWords) * 100

          titles.push({
            title,
            h1Title,
            description,
            keywords: keywordsList,
            objectivePhrase: phraseMatch[1].trim(),
            seoScore: {
              keywordInTitle,
              keywordInDescription,
              keywordDensity: Math.round(keywordDensity * 100) / 100,
              titleLength: title.length,
              descriptionLength: description.length
            }
          })
        }
      }

      return titles.slice(0, count)
    } catch (error) {
      console.error('Error generating complete titles:', error)
      throw new Error('No se pudieron generar títulos. Verifica tu API key de Gemini.')
    }
  }

  /**
   * Generate title suggestions based on keyword
   */
  async generateTitles(keyword: string, count: number = 10): Promise<string[]> {
    await this.ensureInitialized()
    
    try {
      const prompt = `Genera ${count} títulos creativos y atractivos para artículos de blog sobre "${keyword}". 
      
      REQUISITOS OBLIGATORIOS PARA CADA TÍTULO:
      ✓ Incluir la palabra clave "${keyword}" en el título
      ✓ Longitud: entre 40 y 60 caracteres (CRÍTICO para SEO)
      ✓ Llamativos y que generen clicks
      ✓ Usar números cuando sea apropiado (ej: "5 formas de...")
      ✓ Usar palabras de poder: "guía", "completa", "paso a paso", "secretos", etc.
      ✓ En español
      
      FORMATO: Devuelve solo los títulos, uno por línea, sin numeración ni formato adicional.
      
      Ejemplos de buenos títulos:
      - "Guía Completa de Marketing Digital para Principiantes"
      - "5 Estrategias de SEO que Aumentarán tu Tráfico"
      - "Cómo Dominar las Redes Sociales en 30 Días"
      
      Genera ahora ${count} títulos siguiendo estos requisitos:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Split by lines and clean
      const titles = text
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter((title: string) => title.length > 0)

      return titles.slice(0, count)
    } catch (error) {
      console.error('Error generating titles:', error)
      throw new Error('No se pudieron generar títulos. Verifica tu API key de Gemini.')
    }
  }

  /**
   * Generate article outline (section titles with hierarchy based on detail level)
   */
  async generateOutline(
    title: string,
    keyword: string,
    numSections: number = 5,
    detailLevel: 'basic' | 'medium' | 'advanced' = 'medium'
  ): Promise<Array<{
    id: string
    type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
    title: string
    paragraphs: number
    characters: number
    collapsed: boolean
    items?: number
  }>> {
    await this.ensureInitialized()
    
    try {
      // Configure structure based on detail level
      let structureInstructions = ''
      let exampleFormat = ''
      
      if (detailLevel === 'basic') {
        structureInstructions = `
🎯 NIVEL BÁSICO - Solo H2:
✓ Genera EXACTAMENTE ${numSections} títulos de secciones H2
✓ NO incluyas subsecciones H3 ni H4
✓ Estructura simple y directa`
        
        exampleFormat = `
Ejemplo de respuesta correcta:
¿Qué es el ${keyword}?
Beneficios del ${keyword}
Cómo funciona el ${keyword}
Implementación paso a paso
Errores a evitar`
      } else if (detailLevel === 'medium') {
        structureInstructions = `
🎯 NIVEL MEDIO - H2 con subsecciones H3 + Elementos ricos:
✓ Genera ${numSections} secciones principales (H2)
✓ Cada H2 debe tener 2-3 subsecciones H3
✓ Incluye listas y párrafos donde sean útiles
✓ Usa "##" para H2, "###" para H3
✓ Usa "[LIST]" para listas con viñetas
✓ Usa "[NUMBERED-LIST]" para listas numeradas
✓ Estructura moderadamente detallada`
        
        exampleFormat = `
Ejemplo de respuesta correcta:
## ¿Qué es el ${keyword}?
### Definición y concepto básico
### Historia y evolución
### Por qué es importante hoy

[LIST] Características principales del ${keyword}

## Beneficios del ${keyword}
### Ventajas principales
### Impacto en tu negocio

## Cómo implementar ${keyword}
[NUMBERED-LIST] Pasos para implementar ${keyword}
### Paso 1: Preparación
### Paso 2: Ejecución`
      } else { // advanced
        structureInstructions = `
🎯 NIVEL AVANZADO - H2 con H3 y H4:
✓ Genera ${numSections} secciones principales (H2)
✓ Cada H2 debe tener 2-3 subsecciones H3
✓ Cada H3 debe tener 1-2 subsecciones H4
✓ Usa "##" para H2, "###" para H3, "####" para H4
✓ Estructura profunda y detallada`
        
        exampleFormat = `
Ejemplo de respuesta correcta:
## ¿Qué es el ${keyword}?
### Definición y concepto básico
#### Origen del término
#### Aplicaciones modernas
### Historia y evolución
#### Primeros usos
#### Evolución reciente

## Beneficios del ${keyword}
### Ventajas principales
#### Beneficio 1
#### Beneficio 2
### Impacto en tu negocio
#### Corto plazo
#### Largo plazo`
      }

      const prompt = `Eres un experto en SEO y redacción de contenidos profesionales. Genera una estructura de títulos LÓGICA Y COHERENTE para un artículo sobre: "${title}"

📌 DATOS DEL ARTÍCULO:
- Palabra clave: "${keyword}"
- Número de secciones H2: ${numSections}
- Nivel de detalle: ${detailLevel.toUpperCase()}

${structureInstructions}

🎯 ESTRUCTURA LÓGICA DEL ARTÍCULO:

Un artículo profesional debe seguir un FLUJO NARRATIVO COHERENTE. Usa una de estas estructuras probadas:

**ESTRUCTURA 1: Educativa (Explicar un concepto)**
1. ¿Qué es [tema]? (Definición clara)
2. ¿Por qué es importante [tema]? (Relevancia)
3. Características principales de [tema] (Detalles)
4. Beneficios de [tema] (Ventajas)
5. Cómo funciona [tema] (Proceso)
6. Ejemplos prácticos de [tema] (Casos reales)

**ESTRUCTURA 2: Guía Práctica (Enseñar a hacer algo)**
1. ¿Qué necesitas saber sobre [tema]? (Contexto)
2. Preparativos para [tema] (Requisitos)
3. Guía paso a paso: Cómo [acción] (Proceso detallado)
4. Mejores prácticas de [tema] (Recomendaciones)
5. Errores comunes y cómo evitarlos (Precauciones)
6. Consejos de expertos en [tema] (Tips avanzados)

**ESTRUCTURA 3: Comparativa/Selección (Ayudar a elegir)**
1. ¿Qué es [tema] y por qué considerarlo? (Introducción)
2. Tipos de [tema] disponibles (Opciones)
3. Factores a considerar al elegir [tema] (Criterios)
4. Los mejores [tema] recomendados (Top opciones)
5. Comparación: ¿Cuál [tema] elegir? (Análisis)
6. Dónde encontrar/comprar [tema] (Recursos)

**ESTRUCTURA 4: Informativa/Turística (Destinos, lugares)**
1. ¿Qué hace especial a [lugar/experiencia]? (Introducción atractiva)
2. Cuándo visitar/hacer [actividad] (Mejor época/temporada)
3. Qué ver/hacer en [lugar] (Atracciones principales)
4. Cómo llegar y moverse en [lugar] (Logística)
5. Dónde alojarse en [lugar] (Opciones de hospedaje)
6. Consejos prácticos para tu visita (Recomendaciones útiles)

📋 REGLAS OBLIGATORIAS PARA TÍTULOS PROFESIONALES:

✅ HACER:
- Títulos CLAROS que indican exactamente qué aprenderá el lector
- Usar verbos de acción: "Descubre", "Aprende", "Conoce", "Planifica"
- Incluir valor específico: "Los 5 mejores...", "Guía completa de...", "Todo sobre..."
- Ser específico y concreto, no vago ni abstracto
- Usar formato de pregunta cuando sea apropiado: "¿Cómo...?", "¿Cuándo...?", "¿Qué...?"
- Mantener un orden lógico: del concepto básico → detalles → acción práctica

❌ NO HACER:
- Títulos vagos o abstractos: "El Legado de...", "La Filosofía de..."
- Títulos redundantes que dicen lo mismo
- Preguntas sin sentido práctico: "¿Por Qué Buscar...?" (muy forzado)
- Títulos que no aportan valor claro
- Usar palabras innecesarias: "increíble", "asombroso", "mágico"
- Saltar del tema sin conexión lógica

🌟 EJEMPLOS DE TÍTULOS PROFESIONALES POR TIPO:

**Para turismo/viajes:**
✅ "Cuándo visitar el Pantanal: Mejor época para ver jaguares"
✅ "Cómo llegar al Pantanal: Opciones de transporte"
✅ "Los mejores tours de avistamiento de jaguares"
✅ "Qué llevar en tu safari: Lista de equipaje esencial"
✅ "Dónde alojarse en el Pantanal: Lodges recomendados"
❌ "El Legado de tu Avistamiento de Jaguares" (abstracto, sin valor)
❌ "¿Por Qué Buscar el Avistamiento de Jaguares?" (pregunta forzada)

**Para productos/servicios:**
✅ "¿Qué es [producto] y cómo funciona?"
✅ "Características principales de [producto]"
✅ "Los mejores [producto] de 2024: Comparativa"
✅ "Cómo elegir el [producto] adecuado para ti"
✅ "Precio de [producto]: Guía de costos actualizada"

**Para guías prácticas:**
✅ "Cómo [acción]: Guía paso a paso completa"
✅ "Requisitos necesarios para [actividad]"
✅ "Mejores prácticas y consejos de expertos"
✅ "Errores comunes al [acción] y cómo evitarlos"
✅ "Planifica tu [actividad]: Checklist definitivo"

⚠️ VALIDACIÓN FINAL:

Antes de generar, pregúntate:
1. ¿Los títulos siguen un orden lógico y natural?
2. ¿Cada título aporta valor específico al lector?
3. ¿Un usuario real buscaría esta información?
4. ¿Los títulos forman una historia coherente del tema?

${exampleFormat}

📤 FORMATO DE SALIDA:
- Devuelve SOLO los títulos con formato markdown (##, ###, ####)
- Una línea por título
- Sin numeración adicional
- Sin explicaciones

Genera ahora una estructura PROFESIONAL Y COHERENTE:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Parse response - keep markdown format and new element types
      const lines = text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => {
          // Keep headings and special elements (NO QUOTES)
          return (line.startsWith('##') || 
                  line.startsWith('[LIST]') || 
                  line.startsWith('[NUMBERED-LIST]') ||
                  line.startsWith('[PARAGRAPH]')) && line.length > 3
        })
        .filter((line: string) => {
          // Filter out Introduction/Conclusion
          const lower = line.toLowerCase()
          return !lower.includes('introducción') && !lower.includes('conclusión')
        })
        .map((line: string) => {
          // Clean but keep format
          return line.replace(/^\d+\.\s*/, '').trim()
        })

      // Convert to outline sections with metadata
      const sections = lines.map((line: string, index: number) => {
        let type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' = 'h2'
        let title = line
        let paragraphs = 3
        let characters = 450
        let items: number | undefined = undefined

        if (line.startsWith('[LIST]')) {
          type = 'list'
          title = line.replace('[LIST]', '').trim()
          paragraphs = 0
          characters = 200
          items = 5
        } else if (line.startsWith('[NUMBERED-LIST]')) {
          type = 'numbered-list'
          title = line.replace('[NUMBERED-LIST]', '').trim()
          paragraphs = 0
          characters = 200
          items = 7
        } else if (line.startsWith('[PARAGRAPH]')) {
          type = 'paragraph'
          title = line.replace('[PARAGRAPH]', '').trim()
          paragraphs = 1
          characters = 250
        } else if (line.startsWith('#### ')) {
          type = 'h4'
          title = line.replace('#### ', '')
          paragraphs = 1
          characters = 200
        } else if (line.startsWith('### ')) {
          type = 'h3'
          title = line.replace('### ', '')
          paragraphs = 2
          characters = 300
        } else if (line.startsWith('## ')) {
          type = 'h2'
          title = line.replace('## ', '')
          paragraphs = 3
          characters = 450
        }

        return {
          id: `section-${Date.now()}-${index}`,
          type,
          title,
          paragraphs,
          characters,
          collapsed: false,
          ...(items !== undefined && { items })
        }
      })

      // Ensure we have at least numSections H2 headers
      const h2Count = sections.filter((s: { type: string }) => s.type === 'h2').length
      
      if (h2Count < numSections) {
        // Add missing H2 sections
        for (let i = h2Count; i < numSections; i++) {
          sections.push({
            id: `section-${Date.now()}-extra-${i}`,
            type: 'h2',
            title: `${keyword} - Aspecto ${i + 1}`,
            paragraphs: 3,
            characters: 450,
            collapsed: false
          })
        }
      }

      return sections
    } catch (error) {
      console.error('Error generating outline:', error)
      throw new Error('No se pudo generar la estructura. Verifica tu API key de Gemini.')
    }
  }

  /**
   * Generate article content based on title and outline
   */
  async generateContent(
    title: string, 
    keyword: string, 
    numSections: number = 5, 
    detailLevel: 'basic' | 'medium' | 'advanced' = 'medium',
    introParagraphs: number = 2,
    detailedOutline?: Array<{
      type: 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'numbered-list' | 'quote' | 'image'
      title: string
      paragraphs: number
      characters: number
      items?: number
    }>
  ): Promise<{
    introduction: string
    sections: { heading: string; headingLevel?: number; content: string }[]
    conclusion: string
  }> {
    await this.ensureInitialized()
    
    try {
      // Configuración según nivel de detalle
      const detailConfig = {
        basic: {
          structure: 'Solo H2',
          wordsPerSection: 150,
          subsections: 'No incluir H3 ni H4',
          complexity: 'simple y directa',
          instructions: 'Cada sección debe tener un único encabezado H2 con 2-3 párrafos cortos.'
        },
        medium: {
          structure: 'H2 con subsecciones H3',
          wordsPerSection: 250,
          subsections: 'Incluir 2-3 subsecciones H3 por cada H2',
          complexity: 'moderada con ejemplos',
          instructions: 'Cada sección H2 debe tener 2-3 subsecciones H3 con explicaciones detalladas.'
        },
        advanced: {
          structure: 'H2 con H3 y H4',
          wordsPerSection: 350,
          subsections: 'Incluir 2-3 H3 por H2 y 1-2 H4 por cada H3',
          complexity: 'detallada con ejemplos y casos de uso',
          instructions: 'Estructura profunda: cada H2 tiene H3, y cada H3 tiene H4 con ejemplos prácticos.'
        }
      }

      const config = detailConfig[detailLevel]
      
      // Build section structure instructions with detailed outline
      let sectionInstructions = ''
      if (detailedOutline && detailedOutline.length > 0) {
        // Add intro paragraphs as first element if specified
        const introSection = introParagraphs > 0 ? `
📝 PÁRRAFOS INTRODUCTORIOS (sin título):
- Genera ${introParagraphs} párrafo(s) introductorios al inicio
- OBLIGATORIO: Incluye "${keyword}" en el primer párrafo
- Aproximadamente ${introParagraphs * 75} palabras
- NO uses un título para esto, son párrafos directos

` : ''

        sectionInstructions = `
🎯 USA EXACTAMENTE ESTA ESTRUCTURA (en este orden):

${introSection}

${detailedOutline.map((section, idx) => {
  const getElementInstruction = () => {
    switch (section.type) {
      case 'h2':
        return `## ${section.title}
   Tipo: Encabezado H2
   Contenido: ${section.paragraphs} párrafo(s)
   Longitud: ~${section.characters} caracteres
   Instrucciones: Contenido informativo y detallado`
      
      case 'h3':
        return `### ${section.title}
   Tipo: Encabezado H3 (subsección)
   Contenido: ${section.paragraphs} párrafo(s)
   Longitud: ~${section.characters} caracteres
   Instrucciones: Información específica del subtema`
      
      case 'h4':
        return `#### ${section.title}
   Tipo: Encabezado H4 (sub-subsección)
   Contenido: ${section.paragraphs} párrafo(s)
   Longitud: ~${section.characters} caracteres
   Instrucciones: Detalles puntuales`
      
      case 'list':
        return `[LISTA CON VIÑETAS] ${section.title}
   Tipo: Lista UL (viñetas)
   Items: ${section.items || 5} elementos
   Longitud: ~${section.characters} caracteres por item
   Formato: Usa "- " para cada item
   Instrucciones: Lista clara y concisa sobre ${section.title}`
      
      case 'numbered-list':
        return `[LISTA NUMERADA] ${section.title}
   Tipo: Lista OL (numerada)
   Items: ${section.items || 5} elementos
   Longitud: ~${section.characters} caracteres por item
   Formato: Usa "1. ", "2. ", "3. ", etc. para cada item
   Instrucciones: Lista paso a paso o secuencial sobre ${section.title}`
      
      case 'paragraph':
        return `[PÁRRAFO] ${section.title}
   Tipo: Párrafo independiente
   Longitud: ~${section.characters} caracteres
   Instrucciones: Párrafo informativo sobre ${section.title}`
      
      case 'image':
        return `[IMAGEN] ${section.title}
   Tipo: Placeholder para imagen
   Instrucciones: Genera texto descriptivo "[IMAGEN: ${section.title}]"`
      
      default:
        return `${section.title}`
    }
  }
  
  return `${idx + 1}. ${getElementInstruction()}\n`
}).join('\n')}

🎯 FORMATO DE SALIDA EXACTO:

${introParagraphs > 0 ? `PRIMERO: Genera ${introParagraphs} párrafo(s) introductorios (sin título, directo):
Párrafo 1 con mención de "${keyword}"...
Párrafo 2...

LUEGO:` : ''}
Genera EXACTAMENTE estos ${detailedOutline.length} elementos en orden:

${detailedOutline.map((s, idx) => {
  let example = ''
  if (s.type === 'h2' || s.type === 'h3' || s.type === 'h4') {
    example = `[SECTION:${s.title}]
${s.paragraphs} párrafo(s) de ~${s.characters} caracteres sobre ${s.title}.`
  } else if (s.type === 'paragraph') {
    example = `[SECTION:${s.title}]
1 párrafo de ~${s.characters} caracteres sobre ${s.title}.`
  } else if (s.type === 'list') {
    example = `[SECTION:${s.title}]
- Item 1 sobre ${s.title}
- Item 2 sobre ${s.title}
...hasta ${s.items} items (${s.characters} caracteres cada uno)`
  } else if (s.type === 'numbered-list') {
    example = `[SECTION:${s.title}]
1. Paso 1 sobre ${s.title}
2. Paso 2 sobre ${s.title}
...hasta ${s.items} pasos (${s.characters} caracteres cada uno)`
  } else if (s.type === 'image') {
    example = `[SECTION:${s.title}]
[IMAGEN: ${s.title}]`
  }
  return `${idx + 1}. ${example}`
}).join('\n\n')}

⚠️⚠️⚠️ REGLAS ABSOLUTAS:
${introParagraphs > 0 ? `- PRIMERO: Escribe ${introParagraphs} párrafo(s) directos (SIN marcador [SECTION:], SIN título)
` : ''}- DESPUÉS: Genera los ${detailedOutline.length} elementos de arriba
- En el ORDEN EXACTO (del 1 al ${detailedOutline.length})
- Con los TÍTULOS EXACTOS especificados
- NO agregues "Introducción" ni "Conclusión" a menos que estén en la lista
- NO inventes elementos nuevos
- CADA elemento del outline debe tener su marcador [SECTION:título]

EJEMPLO DE FORMATO:
${introParagraphs > 0 ? `
Párrafo introductorio 1 aquí, mencionando "${keyword}" naturalmente...

Párrafo introductorio 2 aquí...

` : ''}[SECTION:${detailedOutline[0]?.title || 'Primer título'}]
Contenido del primer elemento...

[SECTION:${detailedOutline[1]?.title || 'Segundo título'}]
Contenido del segundo elemento...
`
      } else {
        sectionInstructions = `
📝 TÍTULOS DE SECCIÓN:
- Crea ${numSections} títulos descriptivos y naturales
- Incluye "${keyword}" en al menos 3 títulos
- NO uses "Sección 1", "Sección 2", etc.
`
      }
      
      const prompt = `TÍTULO DEL ARTÍCULO: "${title}"
PALABRA CLAVE: "${keyword}"

🚨🚨🚨 INSTRUCCIÓN CRÍTICA - RESPETA LA JERARQUÍA 🚨🚨🚨

Genera el artículo SIGUIENDO EXACTAMENTE ESTA ESTRUCTURA:
⚠️ MANTÉN LA JERARQUÍA: Si el outline dice "H2" usa ##, si dice "H3" usa ###, si dice "H4" usa ####
⚠️ NO conviertas todos los encabezados en H2
⚠️ RESPETA el nivel de cada encabezado

${sectionInstructions}

📋 REGLAS DE FORMATO CRÍTICAS:

🎯 JERARQUÍA DE ENCABEZADOS (OBLIGATORIO):
✓ Elementos tipo "H2" → usa markdown ## 
✓ Elementos tipo "H3" → usa markdown ###
✓ Elementos tipo "H4" → usa markdown ####
✓ NUNCA cambies el nivel del encabezado
✓ Si el outline especifica H3, DEBE ser ### (no ##)
✓ Si el outline especifica H4, DEBE ser #### (no ## ni ###)

🎯 CONTENIDO:
✓ NO uses markdown (**, *) en el contenido de los párrafos
✓ Incluye "${keyword}" naturalmente en el contenido
✓ Frases cortas (máx. 20 palabras)
✓ Párrafos breves (máx. 150 palabras)
✓ SEPARA cada párrafo con una línea en blanco (doble salto de línea)
✓ Tono profesional pero accesible
✓ Contenido en español

⚠️⚠️⚠️ VERIFICACIÓN FINAL - JERARQUÍA:
Antes de enviar, VERIFICA que cada encabezado tenga el nivel correcto:
- H2 = ## (dos símbolos #)
- H3 = ### (tres símbolos #)
- H4 = #### (cuatro símbolos #)

✅ OTRAS VERIFICACIONES:
- Palabra clave "${keyword}" en el primer párrafo
- Contenido útil y de valor
- Lenguaje claro y natural`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the response - process ALL as sections (no forced intro/conclusion)
      const sections: { heading: string; headingLevel?: number; content: string }[] = []
      let introduction = '' // Will be first section if it exists
      let conclusion = '' // Will be last section if it exists

      // Helper function to clean markdown from text while preserving paragraph structure
      const cleanMarkdown = (text: string): string => {
        return text
          .replace(/\[SECTION:[^\]]+\]/gi, '') // Remove section markers first
          .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic
          // Ensure proper paragraph separation
          .split('\n') // Split by lines
          .map(line => line.trim()) // Trim each line
          .join('\n') // Rejoin
          .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to double
          .trim()
      }

      // Check for intro paragraphs BEFORE first section (no title)
      const firstSectionIndex = text.indexOf('[SECTION:')
      if (firstSectionIndex > 0) {
        const introText = text.substring(0, firstSectionIndex).trim()
        if (introText.length > 20) { // Has meaningful content
          introduction = cleanMarkdown(introText)
        }
      }

      // Extract ALL sections with [SECTION:] markers, preserving heading level
      const sectionMatches = text.matchAll(/\[SECTION:\s*([^\]]+)\](.*?)(?=\[SECTION:|$)/gs)
      const allSections = []
      
      for (const match of sectionMatches) {
        const fullSection = match[2] // Contains the heading with markdown and content
        
        // Detect heading level from the markdown in the content
        let headingLevel = 2 // Default H2
        let heading = match[1].trim()
        
        // Check if content starts with markdown heading
        const headingMatch = fullSection.match(/^(#{2,4})\s+(.+?)$/m)
        if (headingMatch) {
          headingLevel = headingMatch[1].length // Count # symbols
          heading = headingMatch[2].trim()
        }
        
        // Clean the content (remove the heading line if it exists)
        const contentWithoutHeading = fullSection.replace(/^#{2,4}\s+.+$/m, '').trim()
        const content = cleanMarkdown(contentWithoutHeading)
        
        allSections.push({
          heading,
          headingLevel, // Preserve the level!
          content
        })
      }

      // All parsed sections go to sections array
      if (allSections.length > 0) {
        sections.push(...allSections)
        
        // Check if last section is conclusion-like (for YoastSEO only)
        const lastSection = allSections[allSections.length - 1]
        if (lastSection && (
            lastSection.heading.toLowerCase().includes('conclusión') || 
            lastSection.heading.toLowerCase().includes('conclusion'))) {
          conclusion = lastSection.content
        }
      }

      // Fallback if parsing fails - Extract based on content structure
      if (!introduction && sections.length === 0) {
        // Clean all text from markdown first
        const cleanedText = cleanMarkdown(text)
        
        // Try to extract based on markdown headings in original text
        const lines = text.split('\n')
        let currentSection: string | null = null
        let currentSectionLevel: number = 2
        let currentContent: string[] = []
        let inIntro = true
        let introContent: string[] = []
        let conclusionContent: string[] = []
        let inConclusion = false
        
        for (const line of lines) {
          // Detect H2, H3, H4 headings (maintain hierarchy)
          const headingMatch = line.match(/^(#{2,4})\s+(.+)$/)
          if (headingMatch) {
            // Save previous section
            if (currentSection && currentContent.length > 0) {
              sections.push({
                heading: currentSection,
                headingLevel: currentSectionLevel,
                content: cleanMarkdown(currentContent.join('\n'))
              })
            }
            
            // Get heading level from markdown symbols
            currentSectionLevel = headingMatch[1].length // 2, 3, or 4
            const heading = headingMatch[2].trim()
            if (heading.toLowerCase().includes('conclusión') || heading.toLowerCase().includes('conclusion')) {
              inConclusion = true
              inIntro = false
              currentSection = null
            } else {
              inIntro = false
              inConclusion = false
              currentSection = heading
              currentContent = []
            }
          } else if (line.trim()) {
            if (inIntro) {
              introContent.push(line)
            } else if (inConclusion) {
              conclusionContent.push(line)
            } else if (currentSection) {
              currentContent.push(line)
            }
          }
        }
        
        // Save last section
        if (currentSection && currentContent.length > 0) {
          sections.push({
            heading: currentSection,
            headingLevel: currentSectionLevel,
            content: cleanMarkdown(currentContent.join('\n'))
          })
        }
        
        introduction = cleanMarkdown(introContent.join('\n'))
        conclusion = cleanMarkdown(conclusionContent.join('\n'))
        
        // If still empty, use basic paragraph splitting as last resort
        if (!introduction && sections.length === 0) {
          const paragraphs = text.split('\n\n').filter((p: string) => p.trim().length > 0).map((p: string) => cleanMarkdown(p))
          introduction = paragraphs.slice(0, 2).join('\n\n')
          
          const remainingParagraphs = paragraphs.slice(2, -2)
          const sectionSize = Math.ceil(remainingParagraphs.length / numSections)
          
          for (let i = 0; i < numSections && i * sectionSize < remainingParagraphs.length; i++) {
            const sectionContent = remainingParagraphs.slice(i * sectionSize, (i + 1) * sectionSize)
            // Extract heading from first line or create descriptive one
            const firstLine = sectionContent[0]?.trim() || ''
            const heading = firstLine.length > 10 && firstLine.length < 100 
              ? firstLine.replace(/[#*]/g, '').trim()
              : `${keyword} - Punto ${i + 1}`
            
            sections.push({
              heading: heading,
              headingLevel: 2, // Default for fallback
              content: sectionContent.join('\n\n')
            })
          }
          
          conclusion = paragraphs.slice(-2).join('\n\n')
        }
      }

      return {
        introduction,
        sections,
        conclusion
      }
    } catch (error) {
      console.error('Error generating content:', error)
      throw new Error('No se pudo generar el contenido. Verifica tu API key de Gemini.')
    }
  }

  /**
   * Analyze keyword and provide insights
   */
  async analyzeKeyword(keyword: string): Promise<{
    difficulty: 'easy' | 'medium' | 'hard'
    searchIntent: string
    suggestions: string[]
  }> {
    try {
      const prompt = `Analiza la palabra clave SEO: "${keyword}"
      
      Proporciona:
      1. Dificultad estimada (easy/medium/hard)
      2. Intención de búsqueda principal
      3. 5 sugerencias de palabras clave relacionadas
      
      Formato de respuesta:
      DIFICULTAD: [easy/medium/hard]
      INTENCIÓN: [descripción breve]
      SUGERENCIAS:
      - sugerencia 1
      - sugerencia 2
      - sugerencia 3
      - sugerencia 4
      - sugerencia 5`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const difficultyMatch = text.match(/DIFICULTAD:\s*(easy|medium|hard)/i)
      const intentMatch = text.match(/INTENCIÓN:\s*([^\n]+)/i)
      const suggestionsMatch = text.match(/SUGERENCIAS:(.*)/s)

      const difficulty = (difficultyMatch?.[1]?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium'
      const searchIntent = intentMatch?.[1]?.trim() || 'No determinada'
      
      const suggestions = suggestionsMatch?.[1]
        ?.split('\n')
        .filter((line: string) => line.trim().startsWith('-'))
        .map((line: string) => line.replace(/^-\s*/, '').trim())
        .filter((s: string) => s.length > 0) || []

      return {
        difficulty,
        searchIntent,
        suggestions: suggestions.slice(0, 5)
      }
    } catch (error) {
      console.error('Error analyzing keyword:', error)
      throw new Error('No se pudo analizar la palabra clave.')
    }
  }
}

export const geminiService = new GeminiService()
