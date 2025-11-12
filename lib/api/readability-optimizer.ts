/**
 * Readability Optimizer Service
 * Optimiza contenido HTML para mejorar legibilidad y SEO:
 * - Simplifica vocabulario complejo
 * - Acorta oraciones largas
 * - Agrega palabras de transición
 */

export interface ReadabilityOptimizationOptions {
  modelId?: number
  seoAnalysis?: {
    keywordCount?: number
    readabilityScore?: number
    internalLinks?: number
    issues?: string[]
  }
}

/**
 * Optimiza el contenido HTML para mejorar legibilidad y SEO
 */
export async function optimizeReadability(
  htmlContent: string,
  keyword: string,
  options: ReadabilityOptimizationOptions = {}
): Promise<string> {
  console.log('🔧 [READABILITY] Iniciando optimización de legibilidad...')
  console.log('📏 [READABILITY] Contenido original:', htmlContent.length, 'chars')

  const { modelId = 1, seoAnalysis } = options

  // Construir análisis de problemas detectados
  let problemsSection = ''
  if (seoAnalysis) {
    problemsSection = `
📊 PROBLEMAS DETECTADOS EN EL ANÁLISIS SEO ACTUAL:

${seoAnalysis.keywordCount ? `❌ Keyword "${keyword}" aparece ${seoAnalysis.keywordCount} veces (DEBE estar entre 5-7 veces)` : ''}
${seoAnalysis.internalLinks !== undefined ? `❌ Enlaces internos: ${seoAnalysis.internalLinks} (DEBE tener al menos 2 enlaces internos)` : ''}
${seoAnalysis.readabilityScore ? `⚠️ Puntuación de legibilidad: ${seoAnalysis.readabilityScore}/100` : ''}
${seoAnalysis.issues && seoAnalysis.issues.length > 0 ? `\n⚠️ Otros problemas:\n${seoAnalysis.issues.map(i => `- ${i}`).join('\n')}` : ''}

🎯 TU MISIÓN: Corregir TODOS estos problemas específicos.
`
  }

  // Construir prompt optimizado
  const prompt = `Eres un experto en optimización de contenido SEO y legibilidad web.

${problemsSection}

TAREA: Debes hacer un ESCANEO COMPLETO del artículo y optimizar CADA SECCIÓN para resolver todos los problemas detectados.

⚠️ PROCESO OBLIGATORIO DE 2 PASOS:

🔍 PASO 1: ESCANEAR TODO EL ARTÍCULO
- Lee COMPLETAMENTE el contenido de principio a fin
- Identifica CADA oración con >20 palabras
- Detecta CADA párrafo sin palabra de transición
- Encuentra TODAS las palabras complejas
- Verifica que el keyword "${keyword}" aparezca 5-7 veces (ni más ni menos)
- Asegúrate que CADA sección tenga buena estructura

✏️ PASO 2: OPTIMIZAR SECCIÓN POR SECCIÓN
- Procesa CADA <h2> y sus párrafos relacionados
- Procesa CADA <p> individualmente
- Procesa CADA <ul>/<ol> si existen

📋 REGLAS DE OPTIMIZACIÓN PARA CADA SECCIÓN:

1. **ACORTAR ORACIONES (CRÍTICO)**:
   - ESCANEA cada oración y cuenta palabras
   - Si tiene >20 palabras: DIVIDE en 2-3 oraciones cortas
   - PRIORIDAD MÁXIMA: Ninguna oración puede tener >20 palabras
   - Usa puntos (.) en lugar de comas (,) largas

2. **PALABRAS DE TRANSICIÓN (OBLIGATORIO)**:
   - CADA párrafo <p> DEBE empezar con palabra de transición
   - Ejemplos: "Además", "Por otro lado", "Sin embargo", "En consecuencia", "Asimismo", "De esta manera", "Por esta razón", "En primer lugar", "Finalmente", "Además de esto", "En resumen", "Como resultado"
   - USA VARIEDAD, NO repitas la misma palabra
   - Si el párrafo ya tiene una, déjala

3. **SIMPLIFICAR VOCABULARIO**:
   - Reemplaza palabras complejas/técnicas con sinónimos simples
   - Nivel de lectura: 8vo grado (13-14 años)
   - Ejemplos: "sumergirse" → "meterse", "vasta" → "gran", "exuberante" → "abundante"

4. **OPTIMIZAR KEYWORD (${keyword}) - CRÍTICO**:
   ${seoAnalysis?.keywordCount ? `
   - ACTUAL: Aparece ${seoAnalysis.keywordCount} veces
   - REQUERIDO: Entre 5-7 veces (MÁXIMO 10 para evitar penalización)
   ${seoAnalysis.keywordCount < 5 ? `- ACCIÓN: AGREGA ${5 - seoAnalysis.keywordCount} menciones naturales más` : ''}
   ${seoAnalysis.keywordCount > 10 ? `- ⚠️ KEYWORD STUFFING DETECTADO: ELIMINA ${seoAnalysis.keywordCount - 7} menciones
     * Usa sinónimos naturales: "experiencia de", "viaje a", "expedición en"
     * Reemplaza algunas menciones con pronombres: "esta actividad", "este destino"
     * NO fuerces el keyword en cada párrafo
   ` : seoAnalysis.keywordCount > 7 ? `- ACCIÓN: REDUCE ${seoAnalysis.keywordCount - 7} menciones (usa sinónimos)` : ''}
   ` : '- El keyword debe aparecer 5-7 veces naturalmente'}

5. **EVITAR SOBREOPTIMIZACIÓN EN SUBTÍTULOS**:
   - NO PONGAS la keyword en más del 75% de los subtítulos H2/H3
   - REVISA cada <h2> y <h3> actual
   - SI más del 75% contienen la keyword: REESCRIBE algunos con sinónimos o paráfrasis
   - Ejemplos: "Guía de pesca" en lugar de repetir keyword completa
   - Los subtítulos deben ser NATURALES y DESCRIPTIVOS, no forzados

6. **DENSIDAD DE KEYWORD**:
   - Máximo: 1 vez por cada 100 palabras
   - Distribución UNIFORME en el artículo (no agrupar en una sección)
   - NUNCA dos menciones en el mismo párrafo a menos que sea absolutamente natural

7. **MANTENER ESTRUCTURA**:
   - NO cambies tags HTML (<h2>, <p>, <ul>, etc.)
   - NO agregues secciones nuevas
   - NO elimines contenido importante
   - SOLO optimiza el texto dentro de los tags

CONTENIDO A OPTIMIZAR:
${htmlContent}

🎯 RESULTADO ESPERADO:
- TODAS las oraciones con ≤20 palabras
- TODOS los párrafos con palabra de transición al inicio
- Vocabulario simplificado en TODO el artículo
- Keyword "${keyword}" entre 5-7 veces en TOTAL (máximo 10)
- Keyword en MÁXIMO 75% de los subtítulos H2/H3
- Densidad de keyword: máximo 1 vez por cada 100 palabras
- Distribución uniforme del keyword en todo el contenido

⚠️ VALIDACIÓN FINAL:
Antes de responder, CUENTA:
1. Total de veces que aparece "${keyword}"
2. En cuántos subtítulos H2/H3 aparece
3. Si alguna oración tiene >20 palabras

RESPONDE SOLO CON EL HTML OPTIMIZADO COMPLETO, procesando TODO el contenido desde el principio hasta el final.`

  try {
    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('No hay token de autenticación')

    const response = await fetch('/api/ai/generate-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt,
        model_id: modelId,
        stream: true // Usar streaming
      })
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    // Procesar streaming
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let optimizedContent = ''

    if (!reader) {
      throw new Error('No se pudo iniciar el streaming')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6) // Quitar "data: "
            if (jsonStr === '[DONE]') continue
            
            const data = JSON.parse(jsonStr)
            if (data.chunk) {
              optimizedContent += data.chunk
            }
          } catch (e) {
            // Ignorar errores de parsing de chunks individuales
          }
        }
      }
    }

    if (!optimizedContent || optimizedContent.length < 100) {
      throw new Error('La IA no generó contenido optimizado válido')
    }

    console.log('✅ [READABILITY] Optimización completada')
    console.log('📏 [READABILITY] Contenido optimizado:', optimizedContent.length, 'chars')
    console.log('📊 [READABILITY] Mejoras aplicadas:')
    console.log('   - Vocabulario simplificado')
    console.log('   - Oraciones acortadas')
    console.log('   - Palabras de transición agregadas')

    return optimizedContent.trim()
  } catch (error: any) {
    console.error('❌ [READABILITY] Error:', error)
    throw new Error(`Error al optimizar legibilidad: ${error.message}`)
  }
}
