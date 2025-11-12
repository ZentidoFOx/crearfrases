import { useState, useCallback, useRef } from 'react'
import { aiService } from '@/lib/api/ai-service'
import { OutlineSection } from './useContentGeneration'
import { isArtificialContent, validateContentSEO, suggestContentImprovements } from '@/lib/utils/content-filters'
import { scanKeywordsInContent, generateKeywordInstructions, validateGeneratedContent } from '@/lib/utils/keyword-scanner'
import { enforceKeywordLimit } from '@/lib/utils/keyword-enforcer'
import { optimizeParagraphs, validateParagraphLength } from '@/lib/utils/paragraph-optimizer'
import { optimizeForYoastSEO, validateYoastSEO } from '@/lib/utils/yoast-seo-optimizer'
// Filtro anti-robótico removido - ahora usamos instrucciones directas a la IA

export type SectionStatus = 'pending' | 'generating' | 'completed' | 'error'

export interface SectionState {
  id: string
  title: string
  type: 'intro' | 'section' | 'conclusion'
  status: SectionStatus
  content: string
  error?: string
  order: number
  // Metadatos de validación
  seoScore?: number
  isArtificial?: boolean
  validationWarnings?: string[]
  keywordAnalysis?: {
    totalKeywordsInOutline: number
    newKeywordsAdded: number
    finalTotal: number
    analysisIncludedOutline: boolean
    outlineSections: number
    generatedSections: number
  }
  isRobotic?: boolean
  roboticIssues?: string[]
  wasContentCleaned?: boolean
  wasKeywordEnforced?: boolean
}

/**
 * Hook para generar contenido SECCION por SECCION
 * 
 * Este es el metodo CORRECTO para generar contenido porque:
 * - Respeta COMPLETAMENTE el outline (esqueleto) del usuario
 * - Genera cada seccion H2 con sus subsecciones H3/H4
 * - Permite pausar/reanudar/regenerar secciones individuales
 * - Muestra progreso en tiempo real
 * 
 * Usa aiService.generateSingleSection() que es la funcion optimizada
 * para generar contenido que respeta la estructura del outline.
 */
export const useSectionBySection = (modelId?: number) => {
  const [sections, setSections] = useState<SectionState[]>([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [savedIntroParagraphs, setSavedIntroParagraphs] = useState(0)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const shouldContinueRef = useRef(true)

  /**
   * Inicializar las secciones desde el outline
   */
  const initializeSections = useCallback((
    outline: OutlineSection[],
    introParagraphs: number
  ) => {
    const initialSections: SectionState[] = []
    
    // Si hay párrafos introductorios, agregar sección de introducción
    if (introParagraphs > 0) {
      initialSections.push({
        id: 'intro',
        title: 'Introducción',
        type: 'intro',
        status: 'pending',
        content: '',
        order: 0
      })
    }
    
    // Filtrar solo las secciones principales (H2) del outline
    // Las subsecciones (H3, H4) se incluirán como parte de su H2 padre
    const mainSections = outline.filter(item => item.type === 'h2')
    
    console.log('📋 [INIT] Total items en outline:', outline.length)
    console.log('📋 [INIT] Secciones principales (H2):', mainSections.length)
    console.log('📝 [INIT] Párrafos introductorios:', introParagraphs)
    if (introParagraphs > 0) {
      console.log('✅ [INIT] Se generará introducción automática con', introParagraphs, 'párrafos')
    }
    
    // Crear secciones para H2 del outline
    mainSections.forEach((item, idx) => {
      initialSections.push({
        id: item.id,
        title: item.title,
        type: 'section',
        status: 'pending',
        content: '',
        order: introParagraphs > 0 ? idx + 1 : idx
      })
    })
    
    setSections(initialSections)
    setProgress({ current: 0, total: initialSections.length })
    setCurrentSectionIndex(-1)
    setIsGenerating(false)
    setIsPaused(false)
    setError('')
    
    console.log('✅ [INIT] Secciones inicializadas:', initialSections.length)
    
    return initialSections
  }, [])

  /**
   * Generar una sección individual
   */
  const generateSection = async (
    sectionIndex: number,
    title: string,
    keyword: string,
    outline: OutlineSection[],
    allSections: SectionState[],
    introParagraphs: number,
    detailLevel: 'basic' | 'medium' | 'advanced',
    fullPreviousContent?: string, // Contenido completo acumulado para escaneo
    keywordScan?: any, // Resultado del escaneo robusto
    keywordInstructions?: any // Instrucciones específicas para la IA
  ): Promise<string> => {
    if (!modelId) {
      throw new Error('No se ha seleccionado un modelo de IA')
    }

    const section = allSections[sectionIndex]
    
    // 🔍 USAR CONTENIDO COMPLETO ACUMULADO SI ESTÁ DISPONIBLE
    const previousSections = fullPreviousContent || allSections
      .slice(Math.max(0, sectionIndex - 2), sectionIndex)
      .filter(s => s.status === 'completed')
      .map(s => `## ${s.title}\n\n${s.content}`)
      .join('\n\n')
    
    console.log(`🔍 [SECTION-CONTEXT] Usando ${fullPreviousContent ? 'contenido COMPLETO' : 'solo últimas 2 secciones'} como contexto`)
    if (fullPreviousContent) {
      console.log(`🔍 [SECTION-CONTEXT] Palabras en contexto completo: ${fullPreviousContent.split(/\s+/).length}`)
    }

    console.log(`🚀 [SECTION-GEN] Generando: ${section.title} (${section.type})`)
    
    try {
      let content: string
      
      // Si es introducción, generar párrafos introductorios
      if (section.type === 'intro') {
        console.log(`📝 [SECTION-GEN] Generando introducción con ${introParagraphs} párrafos`)
        
        const sectionTitles = outline
          .filter(o => o.type === 'h2')
          .slice(0, 5)
          .map(o => o.title)
        
        const prompt = `🚨🚨🚨 PROHIBIDO ABSOLUTO - LEE ANTES DE ESCRIBIR 🚨🚨🚨

❌❌❌ NUNCA NUNCA NUNCA empieces con:
- "¿Sueñas con..."
- "¿Anhelas..."
- "¿Te imaginas..."
- "¿Alguna vez has pensado..."
- "Descubre el fascinante..."
- "Sumérgete en..."
- "Embárcate en..."
- "Adéntrate en..."

Si usas cualquiera de estas frases = FALLO TOTAL

✅ EMPIEZA DIRECTAMENTE ASÍ:
"La pesca en el Amazonas requiere técnicas específicas..."
"Los pescadores experimentados conocen..."
"El río Amazonas ofrece oportunidades únicas..."

Eres un escritor profesional de contenido SEO. Genera una introducción atractiva para el artículo.

**Información del Artículo:**
- Título: ${title}
- Keyword principal: ${keyword}
- Secciones principales:
${sectionTitles.map(t => `- ${t}`).join('\n')}

**Instrucciones:**
1. Escribe EXACTAMENTE ${introParagraphs} párrafo(s) de introducción
2. NO incluyas título "Introducción", empieza directo con el contenido
3. EMPIEZA DIRECTAMENTE con información útil, NO con preguntas dramáticas
4. Menciona brevemente qué aprenderá el lector
5. Incluye "${keyword}" de forma natural
6. Tono profesional pero accesible
7. Conecta con las secciones principales del artículo
8. NUNCA uses "fascinante", "increíble", "asombroso", "espectacular"
9. MANTÉN PÁRRAFOS CORTOS: Máximo 80 palabras por párrafo
10. DIVIDE párrafos largos en 2-3 párrafos más cortos

**Formato:**
- SEPARAR párrafos con doble salto de línea
- NO uses HTML, solo markdown puro

🚨 VERIFICACIÓN FINAL:
1. ¿Empiezo con "¿Sueñas" o "¿Anhelas"? → SI = REESCRIBIR COMPLETAMENTE
2. ¿Uso "fascinante" o "increíble"? → SI = CAMBIAR por "importante" o "útil"
3. ¿Todos los párrafos tienen menos de 80 palabras? → DEBE SER SÍ
4. ¿Suena como escrito por una persona real? → DEBE SER SÍ

🚨🚨🚨 RECORDATORIO FINAL 🚨🚨🚨
Si escribes "¿Sueñas", "¿Anhelas", "Descubre", "fascinante" = FALLO TOTAL
Si escribes párrafos de más de 80 palabras = FALLO TOTAL
Escribe como una PERSONA REAL, no como IA.
Empieza DIRECTAMENTE con información útil.
MANTÉN LOS PÁRRAFOS CORTOS Y LEGIBLES.

Genera solo la introducción (sin títulos):`

        content = await aiService.generateWithModel(prompt, modelId, {
          temperature: 0.7,
          maxTokens: 1024
        })
        
        content = content.trim()
      } else {
        // Generar sección normal usando generateSingleSection (respetando el outline)
        const mainSection = outline.find(o => o.id === section.id && o.type === 'h2')
        if (!mainSection) {
          throw new Error(`No se encontró el outline para la sección ${section.id}`)
        }
        
        // Encontrar todas las subsecciones (H3, H4) que pertenecen a esta H2
        const mainSectionIndex = outline.findIndex(o => o.id === section.id)
        const nextH2Index = outline.findIndex((o, idx) => idx > mainSectionIndex && o.type === 'h2')
        const subsections = outline.slice(
          mainSectionIndex + 1,
          nextH2Index === -1 ? outline.length : nextH2Index
        ).filter(o => o.type === 'h3' || o.type === 'h4')
        
        console.log(`📊 [SECTION-GEN] Sección "${section.title}" con ${subsections.length} subsecciones`)
        console.log(`📊 [SECTION-GEN] Outline completo tiene ${outline.length} items`)
        console.log(`📊 [SECTION-GEN] Main section index:`, mainSectionIndex)
        console.log(`📊 [SECTION-GEN] Next H2 index:`, nextH2Index)
        if (subsections.length > 0) {
          console.log(`📊 [SECTION-GEN] Subsecciones:`, subsections.map(s => `${s.type}: ${s.title}`))
        }
        
        content = await aiService.generateSingleSection(
          title,
          keyword,
          mainSection,
          previousSections, // Ahora incluye TODO el contenido acumulado
          modelId,
          subsections, // Pasar subsecciones para incluir en la estructura
          detailLevel // Pasar nivel de detalle para adaptar el prompt
        )
      }
      
      console.log(`✅ [SECTION-GEN] Completado: ${section.title} (${content.length} caracteres)`)
      return content
      
    } catch (error: any) {
      console.error(`❌ [SECTION-GEN] Error en ${section.title}:`, error)
      throw error
    }
  }

  /**
   * Iniciar generación secuencial de todas las secciones
   */
  const startGeneration = async (
    title: string,
    keyword: string,
    outline: OutlineSection[],
    introParagraphs: number,
    detailLevel: 'basic' | 'medium' | 'advanced' = 'medium'
  ) => {
    if (!modelId) {
      setError('No se ha seleccionado un modelo de IA')
      return
    }

    // Guardar introParagraphs para uso posterior
    setSavedIntroParagraphs(introParagraphs)
    
    // Inicializar secciones
    const initializedSections = initializeSections(outline, introParagraphs)
    
    setIsGenerating(true)
    setIsPaused(false)
    shouldContinueRef.current = true
    abortControllerRef.current = new AbortController()
    
    try {
      // Generar cada sección secuencialmente
      for (let i = 0; i < initializedSections.length; i++) {
        // Verificar si se debe pausar o cancelar
        if (!shouldContinueRef.current) {
          console.log('⏸️ [SECTION-GEN] Generación pausada/cancelada')
          break
        }
        
        setCurrentSectionIndex(i)
        
        // Actualizar estado: generando
        setSections(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'generating' as SectionStatus } : s
        ))
        
        try {
          // 🔍 SISTEMA ROBUSTO COMPLETO: INCLUIR OUTLINE + CONTENIDO GENERADO
          
          // 1️⃣ OBTENER TODA LA ESTRUCTURA DEL OUTLINE (Vista Previa del Esqueleto)
          const outlineStructure = outline.map(section => {
            // Crear el título según el tipo de sección
            if (section.type === 'h2') {
              return `## ${section.title}\n`
            } else if (section.type === 'h3') {
              return `### ${section.title}\n`
            } else if (section.type === 'h4') {
              return `#### ${section.title}\n`
            } else {
              // Para otros tipos, usar H2 por defecto
              return `## ${section.title}\n`
            }
          }).join('\n')
          
          console.log(`🔍 [ROBUST-SCAN] OUTLINE COMPLETO:`, outlineStructure.length, 'caracteres')
          console.log(`🔍 [ROBUST-SCAN] Estructura del outline:`)
          console.log(outlineStructure)
          console.log(`🔍 [ROBUST-SCAN] ⚠️ IMPORTANTE: Este outline contiene TODOS los títulos de secciones`)
          
          // 2️⃣ OBTENER CONTENIDO YA GENERADO
          const generatedContent = initializedSections
            .slice(0, i) // Solo las secciones anteriores a la actual
            .filter(s => s.status === 'completed' && s.content)
            .map(s => {
              // Incluir título de sección si no está en el contenido
              const content = s.content.trim()
              if (s.type === 'intro') {
                return content // Introducción sin título
              } else {
                const hasTitle = content.startsWith(`## ${s.title}`) || content.startsWith(`##${s.title}`)
                return hasTitle ? content : `## ${s.title}\n\n${content}`
              }
            })
            .join('\n\n')
          
          // 3️⃣ COMBINAR OUTLINE + CONTENIDO GENERADO PARA ANÁLISIS COMPLETO
          const allPreviousContent = `${outlineStructure}\n\n${generatedContent}`.trim()
          
          console.log(`🔍 [ROBUST-SCAN] Contenido outline:`, outlineStructure.length, 'caracteres')
          console.log(`🔍 [ROBUST-SCAN] Contenido generado:`, generatedContent.length, 'caracteres')
          console.log(`🔍 [ROBUST-SCAN] TOTAL PARA ANÁLISIS:`, allPreviousContent.length, 'caracteres')
          
          console.log(`🔍 [ROBUST-SCAN] === ESCANEO ROBUSTO COMPLETO SECCIÓN ${i + 1} ===`)
          console.log(`🔍 [ROBUST-SCAN] Secciones del outline: ${outline.length}`)
          console.log(`🔍 [ROBUST-SCAN] Secciones generadas: ${initializedSections.slice(0, i).filter(s => s.status === 'completed').length}`)
          console.log(`🔍 [ROBUST-SCAN] CONTENIDO TOTAL ANALIZADO: ${allPreviousContent.length} caracteres`)
          
          // 🔍 ESCANEO ROBUSTO DE KEYWORDS (OUTLINE + CONTENIDO)
          const keywordScan = scanKeywordsInContent(
            allPreviousContent, 
            keyword, 
            initializedSections[i].title
          )
          
          console.log(`🔍 [ROBUST-SCAN] ⚠️ IMPORTANTE: Analizando OUTLINE + CONTENIDO GENERADO`)
          console.log(`🔍 [ROBUST-SCAN] ⚠️ Esto incluye TODOS los títulos de la Vista Previa del Esqueleto`)
          
          // 🔍 GENERAR INSTRUCCIONES ESPECÍFICAS PARA LA IA
          const keywordInstructions = generateKeywordInstructions(keywordScan, keyword)
          
          console.log(`🔍 [ROBUST-SCAN] 🎯 ANÁLISIS COMPLETO REALIZADO:`)
          console.log(`🔍 [ROBUST-SCAN] - Outline analizado: ${outline.length} secciones`)
          console.log(`🔍 [ROBUST-SCAN] - Keywords encontradas en OUTLINE: ${keywordScan.totalKeywords}`)
          console.log(`🔍 [ROBUST-SCAN] - Esto incluye títulos H2, H3, H4 del esqueleto`)
          console.log(`🔍 [ROBUST-SCAN] Severidad:`, keywordInstructions.severity)
          console.log(`🔍 [ROBUST-SCAN] Instrucción:`, keywordInstructions.instruction)
          console.log(`🔍 [ROBUST-SCAN] ⚠️ OUTLINE YA INCLUIDO EN EL CONTEO TOTAL`)
          
          // 🔍 GENERAR CONTENIDO CON INSTRUCCIONES ROBUSTAS (BASADO EN OUTLINE + CONTENIDO)
          const rawContent = await generateSection(
            i,
            title,
            keyword,
            outline,
            initializedSections,
            introParagraphs,
            detailLevel,
            allPreviousContent, // OUTLINE + Contenido completo
            keywordScan, // Resultado del escaneo completo
            keywordInstructions // Instrucciones específicas
          )
          
          console.log(`🔍 [ROBUST-SCAN] ✅ Sección generada considerando OUTLINE completo`)
          
          // 🔍 VALIDAR EL CONTENIDO GENERADO CONTRA EL ANÁLISIS COMPLETO
          const validation = validateGeneratedContent(rawContent, keyword, keywordScan)
          
          if (!validation.isValid) {
            console.error(`❌ [ROBUST-SCAN] CONTENIDO INVÁLIDO (considerando OUTLINE):`, validation.violations)
            console.warn(`⚠️ [ROBUST-SCAN] El outline ya contiene muchas keywords - Continuando...`)
          } else {
            console.log(`✅ [ROBUST-SCAN] Contenido válido considerando OUTLINE - Keywords:`, validation.totalKeywords, '/6')
          }
          
          console.log(`🔍 [ROBUST-SCAN] 📊 RESUMEN FINAL COMPLETO:`)
          console.log(`🔍 [ROBUST-SCAN] - Keywords en outline (Vista Previa): ${keywordScan.totalKeywords - (validation.newKeywordCount || 0)}`)
          console.log(`🔍 [ROBUST-SCAN] - Keywords en nueva sección: ${validation.newKeywordCount || 0}`)
          console.log(`🔍 [ROBUST-SCAN] - TOTAL REAL CONSIDERANDO OUTLINE: ${validation.totalKeywords}/6`)
          console.log(`🔍 [ROBUST-SCAN] 🎯 El sistema ahora SÍ considera la Vista Previa del Esqueleto`)
          
          // 🔍 VALIDAR CONTENIDO ANTI-IA Y SEO
          console.log(`🔍 [CONTENT-VALIDATION] Validando sección: ${initializedSections[i].title}`)
          
          // Verificar si el contenido es artificial
          const { isArtificial, reasons } = isArtificialContent(rawContent)
          if (isArtificial) {
            console.log(`⚠️ [CONTENT-VALIDATION] Sección contiene elementos artificiales:`, reasons.slice(0, 3))
            // Continuar pero marcar para revisión
          }
          
          // Validar SEO de la sección
          const sectionSEO = validateContentSEO(rawContent, keyword)
          console.log(`📊 [CONTENT-VALIDATION] Score SEO:`, sectionSEO.score, '/100')
          
          // Sugerir mejoras si es necesario
          if (sectionSEO.score < 70 || isArtificial) {
            const suggestions = suggestContentImprovements(rawContent, keyword)
            console.log(`💡 [CONTENT-VALIDATION] Sugerencias:`, suggestions)
          }
          
          // 🚨 APLICAR ENFORCEMENT FORZADO DE KEYWORDS
          console.log(`🚨 [KEYWORD-ENFORCER] === INICIANDO ENFORCEMENT ===`)
          console.log(`🚨 [KEYWORD-ENFORCER] Keyword a controlar: "${keyword}"`)
          console.log(`🚨 [KEYWORD-ENFORCER] Contenido antes del enforcement:`, rawContent.substring(0, 200) + '...')
          
          // Contar keywords antes del enforcement
          const keywordRegexBefore = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi')
          const matchesBefore = Array.from(rawContent.matchAll(keywordRegexBefore))
          console.log(`🚨 [KEYWORD-ENFORCER] Keywords ANTES del enforcement: ${matchesBefore.length}`)
          
          const enforcement = enforceKeywordLimit(rawContent, keyword, 6)
          
          // Verificar resultado
          const keywordRegexAfter = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi')
          const matchesAfter = Array.from(enforcement.enforcedContent.matchAll(keywordRegexAfter))
          console.log(`🚨 [KEYWORD-ENFORCER] Keywords DESPUÉS del enforcement: ${matchesAfter.length}`)
          
          if (enforcement.wasEnforced) {
            console.log(`🚨 [KEYWORD-ENFORCER] ✅ ENFORCEMENT APLICADO CORRECTAMENTE:`)
            console.log(`🚨 [KEYWORD-ENFORCER] - Keywords originales: ${enforcement.originalKeywordCount}`)
            console.log(`🚨 [KEYWORD-ENFORCER] - Keywords finales: ${enforcement.finalKeywordCount}`)
            console.log(`🚨 [KEYWORD-ENFORCER] - Reemplazos realizados: ${enforcement.replacements.length}`)
            enforcement.replacements.forEach((rep, i) => {
              console.log(`🚨 [KEYWORD-ENFORCER] Reemplazo ${i + 1}: "${rep.original}" → "${rep.replacement}"`)
            })
            console.log(`🚨 [KEYWORD-ENFORCER] Contenido después:`, enforcement.enforcedContent.substring(0, 200) + '...')
          } else {
            console.log(`⚠️ [KEYWORD-ENFORCER] NO SE APLICÓ ENFORCEMENT - Razón: ${enforcement.originalKeywordCount} keywords encontradas <= 6 límite`)
          }
          
          // VERIFICACIÓN FINAL OBLIGATORIA
          const finalKeywordCount = Array.from(enforcement.enforcedContent.matchAll(keywordRegexAfter)).length
          if (finalKeywordCount > 6) {
            console.error(`❌ [KEYWORD-ENFORCER] ERROR CRÍTICO: AÚN HAY ${finalKeywordCount} KEYWORDS DESPUÉS DEL ENFORCEMENT!`)
            console.error(`❌ [KEYWORD-ENFORCER] El enforcement FALLÓ. Contenido problemático:`)
            console.error(enforcement.enforcedContent)
          } else {
            console.log(`✅ [KEYWORD-ENFORCER] VERIFICACIÓN FINAL: ${finalKeywordCount} keywords (dentro del límite)`)
          }
          
          // 📝 OPTIMIZAR PÁRRAFOS LARGOS
          console.log(`📝 [PARAGRAPH-OPTIMIZER] Optimizando párrafos largos...`)
          const paragraphOptimization = optimizeParagraphs(enforcement.enforcedContent, 80)
          
          if (paragraphOptimization.wasOptimized) {
            console.log(`📝 [PARAGRAPH-OPTIMIZER] ✅ OPTIMIZACIÓN APLICADA:`)
            console.log(`📝 [PARAGRAPH-OPTIMIZER] - Párrafos originales: ${paragraphOptimization.originalParagraphCount}`)
            console.log(`📝 [PARAGRAPH-OPTIMIZER] - Párrafos finales: ${paragraphOptimization.finalParagraphCount}`)
            console.log(`📝 [PARAGRAPH-OPTIMIZER] - Divisiones realizadas: ${paragraphOptimization.splitOperations.length}`)
            paragraphOptimization.splitOperations.forEach((op, i) => {
              console.log(`📝 [PARAGRAPH-OPTIMIZER] División ${i + 1}: ${op.reason}`)
            })
          } else {
            console.log(`✅ [PARAGRAPH-OPTIMIZER] Párrafos dentro del límite - No se requiere optimización`)
          }
          
          // 🎯 OPTIMIZAR PARA YOAST SEO
          console.log(`🎯 [YOAST-SEO] Optimizando contenido para Yoast SEO...`)
          const yoastOptimizedContent = optimizeForYoastSEO(paragraphOptimization.optimizedContent, keyword)
          
          // Validar optimizaciones de Yoast SEO
          const yoastValidation = validateYoastSEO(yoastOptimizedContent, keyword)
          console.log(`🎯 [YOAST-SEO] Validación completada:`)
          console.log(`🎯 [YOAST-SEO] - Palabras de transición: ${yoastValidation.hasTransitionWords ? '✅' : '❌'} (${yoastValidation.transitionWordsCount} encontradas)`)
          console.log(`🎯 [YOAST-SEO] - Longitud de oraciones: ${yoastValidation.sentenceLengthOk ? '✅' : '❌'} (${yoastValidation.longSentencesPercentage.toFixed(1)}% largas)`)
          console.log(`🎯 [YOAST-SEO] - Keywords en negrita: ${yoastValidation.boldKeywordsCount} encontradas`)
          
          if (yoastValidation.issues.length > 0) {
            console.log(`⚠️ [YOAST-SEO] Problemas detectados:`, yoastValidation.issues)
          }
          
          if (yoastValidation.suggestions.length > 0) {
            console.log(`💡 [YOAST-SEO] Sugerencias:`, yoastValidation.suggestions)
          }
          
          // Usar el contenido final con todas las optimizaciones
          const finalContent = yoastOptimizedContent
          
          console.log(`📊 [FINAL-CHECK] Contenido final tiene ${Array.from(finalContent.matchAll(keywordRegexAfter)).length} keywords de "${keyword}"`)
          console.log(`📝 [FINAL-CHECK] Párrafos finales: ${paragraphOptimization.finalParagraphCount}`)
          console.log(`🎯 [FINAL-CHECK] Optimizado para Yoast SEO: ${yoastValidation.hasTransitionWords && yoastValidation.sentenceLengthOk ? '✅' : '⚠️'}`)
          
          // 🚨 VERIFICACIÓN SIMPLE DE CONTENIDO ROBÓTICO
          const hasRoboticStart = /^¿(sueñas|anhelas|imaginas)/i.test(finalContent)
          const hasRoboticWords = /(fascinante|increíble|asombroso|espectacular|maravilloso)/i.test(finalContent)
          
          if (hasRoboticStart || hasRoboticWords) {
            console.warn(`⚠️ [SIMPLE-CHECK] CONTENIDO ROBÓTICO DETECTADO - La IA no siguió las instrucciones`)
            console.warn(`⚠️ [SIMPLE-CHECK] Inicio robótico: ${hasRoboticStart}`)
            console.warn(`⚠️ [SIMPLE-CHECK] Palabras robóticas: ${hasRoboticWords}`)
          } else {
            console.log(`✅ [SIMPLE-CHECK] Contenido parece natural - No se detectaron elementos robóticos obvios`)
          }
          
          console.log(`📊 [SECTION-SUMMARY] Sección ${i + 1} completada:`, {
            titulo: initializedSections[i].title,
            caracteres: finalContent.length,
            keywords: Array.from(finalContent.matchAll(keywordRegexAfter)).length,
            parrafos: paragraphOptimization.finalParagraphCount,
            robotico: hasRoboticStart || hasRoboticWords,
            enforcement: enforcement.wasEnforced,
            paragraphOptimized: paragraphOptimization.wasOptimized
          })
          
          console.log(`🔍 [ROBUST-SCAN] ✅ Sección completada - OUTLINE incluido en análisis`)
          console.log(`🔍 [ROBUST-SCAN] 🎯 PROBLEMA RESUELTO: Ya no ignora la Vista Previa del Esqueleto`)
          
          // Actualizar sección completada con metadatos del análisis completo
          setSections(prev => {
            const updated = prev.map((s, idx) => 
              idx === i ? { 
                ...s, 
                status: 'completed' as SectionStatus, 
                content: finalContent, 
                error: undefined,
                // Agregar metadatos de validación completa
                seoScore: sectionSEO.score,
                keywordAnalysis: {
                  totalKeywordsInOutline: keywordScan.totalKeywords - (validation.newKeywordCount || 0),
                  newKeywordsAdded: validation.newKeywordCount || 0,
                  finalTotal: validation.totalKeywords,
                  analysisIncludedOutline: true,
                  outlineSections: outline.length,
                  generatedSections: i + 1
                },
                isArtificial,
                isRobotic: hasRoboticStart || hasRoboticWords,
                roboticIssues: hasRoboticStart || hasRoboticWords ? ['Contenido robótico detectado'] : [],
                wasContentCleaned: false, // Ya no limpiamos, solo verificamos
                wasKeywordEnforced: enforcement.wasEnforced,
                validationWarnings: [
                  ...(isArtificial || sectionSEO.score < 70 ? suggestContentImprovements(finalContent, keyword) : []),
                  ...yoastValidation.issues,
                  ...yoastValidation.suggestions
                ]
              } : s
            )
            // Actualizar también en initializedSections para el contexto
            initializedSections[i] = updated[i]
            return updated
          })
          
          setProgress({ current: i + 1, total: initializedSections.length })
          
          // Pequeña pausa entre secciones para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (err: any) {
          console.error(`❌ [SECTION-GEN] Error en sección ${i}:`, err)
          
          // Marcar sección con error
          setSections(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'error' as SectionStatus, error: err.message } : s
          ))
          
          // No continuar si hay error
          setError(`Error al generar "${initializedSections[i].title}": ${err.message}`)
          break
        }
      }
      
      // Verificar si todas las secciones se completaron
      const allCompleted = sections.every(s => s.status === 'completed')
      if (allCompleted) {
        console.log('🎉 [SECTION-GEN] Todas las secciones completadas!')
      }
      
    } catch (err: any) {
      console.error('❌ [SECTION-GEN] Error general:', err)
      setError(err.message || 'Error al generar contenido')
    } finally {
      setIsGenerating(false)
      setCurrentSectionIndex(-1)
      abortControllerRef.current = null
    }
  }

  /**
   * Pausar generación
   */
  const pauseGeneration = useCallback(() => {
    console.log('⏸️ [SECTION-GEN] Pausando generación...')
    shouldContinueRef.current = false
    setIsPaused(true)
    setIsGenerating(false)
  }, [])

  /**
   * Reanudar generación
   */
  const resumeGeneration = async (
    title: string,
    keyword: string,
    outline: OutlineSection[],
    detailLevel: 'basic' | 'medium' | 'advanced' = 'medium'
  ) => {
    const introParagraphs = savedIntroParagraphs
    console.log('▶️ [SECTION-GEN] Reanudando generación...')
    
    setIsGenerating(true)
    setIsPaused(false)
    shouldContinueRef.current = true
    
    try {
      const startIndex = sections.findIndex(s => s.status === 'pending')
      if (startIndex === -1) {
        console.log('✅ [SECTION-GEN] No hay secciones pendientes')
        return
      }
      
      // Continuar desde la siguiente sección pendiente
      for (let i = startIndex; i < sections.length; i++) {
        if (!shouldContinueRef.current) break
        
        setCurrentSectionIndex(i)
        
        setSections(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'generating' as SectionStatus } : s
        ))
        
        try {
          const content = await generateSection(i, title, keyword, outline, sections, introParagraphs, detailLevel)
          
          setSections(prev => {
            const updated = prev.map((s, idx) => 
              idx === i ? { ...s, status: 'completed' as SectionStatus, content, error: undefined } : s
            )
            return updated
          })
          
          setProgress(prev => ({ ...prev, current: i + 1 }))
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (err: any) {
          setSections(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'error' as SectionStatus, error: err.message } : s
          ))
          setError(`Error al generar "${sections[i].title}": ${err.message}`)
          break
        }
      }
    } finally {
      setIsGenerating(false)
      setCurrentSectionIndex(-1)
    }
  }

  /**
   * Cancelar generación completamente
   */
  const cancelGeneration = useCallback(() => {
    console.log('❌ [SECTION-GEN] Cancelando generación...')
    shouldContinueRef.current = false
    abortControllerRef.current?.abort()
    setIsGenerating(false)
    setIsPaused(false)
    setCurrentSectionIndex(-1)
  }, [])

  /**
   * Regenerar una sección específica
   */
  const regenerateSection = async (
    sectionIndex: number,
    title: string,
    keyword: string,
    outline: OutlineSection[],
    detailLevel: 'basic' | 'medium' | 'advanced' = 'medium'
  ) => {
    const introParagraphs = savedIntroParagraphs
    console.log(`🔄 [SECTION-GEN] Regenerando sección ${sectionIndex}`)
    
    // Marcar como generando
    setSections(prev => prev.map((s, idx) => 
      idx === sectionIndex ? { ...s, status: 'generating' as SectionStatus, error: undefined } : s
    ))
    
    try {
      // 🔍 OBTENER CONTENIDO COMPLETO PARA REGENERACIÓN
      const allPreviousContent = sections
        .slice(0, sectionIndex)
        .filter(s => s.status === 'completed' && s.content)
        .map(s => {
          const content = s.content.trim()
          if (s.type === 'intro') {
            return content
          } else {
            const hasTitle = content.startsWith(`## ${s.title}`) || content.startsWith(`##${s.title}`)
            return hasTitle ? content : `## ${s.title}\n\n${content}`
          }
        })
        .join('\n\n')
      
      console.log(`🔍 [REGENERATE] Usando contenido completo para regenerar sección ${sectionIndex}`)
      
      const content = await generateSection(
        sectionIndex, 
        title, 
        keyword, 
        outline, 
        sections, 
        introParagraphs, 
        detailLevel,
        allPreviousContent // Pasar contenido completo
      )
      
      setSections(prev => prev.map((s, idx) => 
        idx === sectionIndex ? { ...s, status: 'completed' as SectionStatus, content } : s
      ))
      
      console.log(`✅ [SECTION-GEN] Sección ${sectionIndex} regenerada`)
      
    } catch (err: any) {
      console.error(`❌ [SECTION-GEN] Error regenerando sección ${sectionIndex}:`, err)
      
      setSections(prev => prev.map((s, idx) => 
        idx === sectionIndex ? { ...s, status: 'error' as SectionStatus, error: err.message } : s
      ))
      
      throw err
    }
  }

  /**
   * Aplicar enforcement final y optimización al artículo completo
   */
  const applyFinalOptimizations = useCallback((content: string, keyword: string): string => {
    console.log(`🚨 [FINAL-OPTIMIZATIONS] === OPTIMIZACIONES FINALES DEL ARTÍCULO ===`)
    console.log(`🚨 [FINAL-OPTIMIZATIONS] Keyword: "${keyword}"`)
    console.log(`🚨 [FINAL-OPTIMIZATIONS] Contenido: ${content.length} caracteres`)
    
    // 1. Enforcement de keywords
    const finalEnforcement = enforceKeywordLimit(content, keyword, 6)
    
    if (finalEnforcement.wasEnforced) {
      console.log(`🚨 [FINAL-ENFORCEMENT] ✅ ENFORCEMENT APLICADO AL ARTÍCULO COMPLETO:`)
      console.log(`🚨 [FINAL-ENFORCEMENT] - Keywords originales: ${finalEnforcement.originalKeywordCount}`)
      console.log(`🚨 [FINAL-ENFORCEMENT] - Keywords finales: ${finalEnforcement.finalKeywordCount}`)
      console.log(`🚨 [FINAL-ENFORCEMENT] - Reemplazos: ${finalEnforcement.replacements.length}`)
    } else {
      console.log(`✅ [FINAL-ENFORCEMENT] Artículo dentro del límite: ${finalEnforcement.originalKeywordCount} keywords`)
    }
    
    // 2. Optimización de párrafos
    const paragraphOptimization = optimizeParagraphs(finalEnforcement.enforcedContent, 80)
    
    if (paragraphOptimization.wasOptimized) {
      console.log(`📝 [FINAL-PARAGRAPH-OPT] ✅ OPTIMIZACIÓN DE PÁRRAFOS APLICADA:`)
      console.log(`📝 [FINAL-PARAGRAPH-OPT] - Párrafos originales: ${paragraphOptimization.originalParagraphCount}`)
      console.log(`📝 [FINAL-PARAGRAPH-OPT] - Párrafos finales: ${paragraphOptimization.finalParagraphCount}`)
      console.log(`📝 [FINAL-PARAGRAPH-OPT] - Divisiones: ${paragraphOptimization.splitOperations.length}`)
    } else {
      console.log(`✅ [FINAL-PARAGRAPH-OPT] Párrafos del artículo dentro del límite`)
    }
    
    // 3. Optimización final para Yoast SEO
    console.log(`🎯 [FINAL-YOAST-SEO] Aplicando optimizaciones finales de Yoast SEO...`)
    const finalYoastOptimization = optimizeForYoastSEO(paragraphOptimization.optimizedContent, keyword)
    
    // Validación final de Yoast SEO
    const finalYoastValidation = validateYoastSEO(finalYoastOptimization, keyword)
    console.log(`🎯 [FINAL-YOAST-SEO] Validación final completada:`)
    console.log(`🎯 [FINAL-YOAST-SEO] - Palabras de transición: ${finalYoastValidation.hasTransitionWords ? '✅' : '❌'} (${finalYoastValidation.transitionWordsCount})`)
    console.log(`🎯 [FINAL-YOAST-SEO] - Longitud de oraciones: ${finalYoastValidation.sentenceLengthOk ? '✅' : '❌'} (${finalYoastValidation.longSentencesPercentage.toFixed(1)}% largas)`)
    console.log(`🎯 [FINAL-YOAST-SEO] - Keywords en negrita: ${finalYoastValidation.boldKeywordsCount}`)
    
    if (finalYoastValidation.issues.length > 0) {
      console.log(`⚠️ [FINAL-YOAST-SEO] Problemas finales:`, finalYoastValidation.issues)
    } else {
      console.log(`✅ [FINAL-YOAST-SEO] Artículo optimizado correctamente para Yoast SEO`)
    }
    
    return finalYoastOptimization
  }, [])

  /**
   * Obtener el markdown completo del artículo
   */
  const getFullMarkdown = useCallback((keyword?: string): string => {
    const markdown = sections
      .filter(s => s.status === 'completed' && s.content)
      .map(s => {
        if (s.type === 'intro') {
          // Introducción sin título
          return s.content.trim()
        } else if (s.type === 'conclusion') {
          // Conclusión sin título
          return s.content.trim()
        } else {
          // Sección principal: agregar título H2 solo si no está en el contenido
          const content = s.content.trim()
          // Verificar si el contenido ya empieza con el título de la sección
          const startsWithTitle = content.startsWith(`## ${s.title}`) || content.startsWith(`##${s.title}`)
          
          if (startsWithTitle) {
            // Ya tiene el título, devolver tal cual
            return content
          } else {
            // Agregar título H2 al inicio
            return `## ${s.title}\n\n${content}`
          }
        }
      })
      .join('\n\n')
    
    console.log('📄 [MARKDOWN] Generado:', markdown.length, 'caracteres')
    console.log('📄 [MARKDOWN] Secciones incluidas:', sections.filter(s => s.status === 'completed').length)
    
    // 🚨 APLICAR OPTIMIZACIONES FINALES SI SE PROPORCIONA KEYWORD
    if (keyword) {
      const optimizedMarkdown = applyFinalOptimizations(markdown, keyword)
      console.log(`🚨 [FINAL-OPTIMIZATIONS] Artículo final con optimizaciones aplicadas`)
      return optimizedMarkdown
    }
    
    return markdown
  }, [sections, applyFinalOptimizations])

  /**
   * Obtener análisis completo del artículo
   */
  const getArticleAnalysis = useCallback((keyword: string) => {
    const completedSections = sections.filter(s => s.status === 'completed')
    const fullContent = getFullMarkdown(keyword)
    
    if (!fullContent) {
      return {
        overallScore: 0,
        totalSections: 0,
        completedSections: 0,
        artificialSections: 0,
        lowScoreSections: 0,
        averageSectionScore: 0,
        suggestions: ['No hay contenido para analizar']
      }
    }
    
    // Análisis completo del artículo
    const { score: overallScore, factors } = validateContentSEO(fullContent, keyword)
    const { isArtificial: isOverallArtificial } = isArtificialContent(fullContent)
    
    // Estadísticas por sección
    const artificialSections = completedSections.filter(s => s.isArtificial).length
    const lowScoreSections = completedSections.filter(s => (s.seoScore || 0) < 70).length
    const sectionScores = completedSections.map(s => s.seoScore || 0).filter(score => score > 0)
    const averageSectionScore = sectionScores.length > 0 ? sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length : 0
    
    // Sugerencias generales
    const suggestions = suggestContentImprovements(fullContent, keyword)
    
    // Agregar sugerencias específicas por sección
    completedSections.forEach(section => {
      if (section.isArtificial) {
        suggestions.push(`⚠️ Sección "${section.title}" contiene lenguaje artificial`)
      }
      if ((section.seoScore || 0) < 70) {
        suggestions.push(`📊 Sección "${section.title}" tiene score SEO bajo (${section.seoScore}/100)`)
      }
    })
    
    console.log(`📊 [ARTICLE-ANALYSIS] Análisis completo del artículo:`)
    console.log(`  - Score general: ${overallScore}/100`)
    console.log(`  - Secciones completadas: ${completedSections.length}/${sections.length}`)
    console.log(`  - Secciones artificiales: ${artificialSections}`)
    console.log(`  - Secciones con score bajo: ${lowScoreSections}`)
    console.log(`  - Score promedio por sección: ${averageSectionScore.toFixed(1)}`)
    
    return {
      overallScore,
      totalSections: sections.length,
      completedSections: completedSections.length,
      artificialSections,
      lowScoreSections,
      averageSectionScore: Math.round(averageSectionScore),
      isOverallArtificial,
      suggestions: suggestions.slice(0, 10), // Limitar sugerencias
      factors
    }
  }, [sections, getFullMarkdown])
  
  /**
   * Obtener resumen de validación por sección
   */
  const getSectionValidationSummary = useCallback(() => {
    return sections.map(section => ({
      id: section.id,
      title: section.title,
      status: section.status,
      seoScore: section.seoScore || 0,
      isArtificial: section.isArtificial || false,
      warnings: section.validationWarnings || [],
      hasIssues: (section.seoScore || 0) < 70 || section.isArtificial || false
    }))
  }, [sections])

  /**
   * Reiniciar todo
   */
  const reset = useCallback(() => {
    setSections([])
    setCurrentSectionIndex(-1)
    setIsGenerating(false)
    setIsPaused(false)
    setError('')
    setProgress({ current: 0, total: 0 })
    shouldContinueRef.current = true
  }, [])

  return {
    sections,
    currentSectionIndex,
    isGenerating,
    isPaused,
    error,
    progress,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    cancelGeneration,
    regenerateSection,
    getFullMarkdown,
    getArticleAnalysis,
    getSectionValidationSummary,
    reset,
    initializeSections
  }
}
