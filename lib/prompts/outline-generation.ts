/**
 * Prompt builder for article outline generation
 */

export interface OutlineGenerationPromptParams {
  title: string
  keyword: string
  numSections: number
  detailLevel: 'basic' | 'medium' | 'advanced'
}

export function buildOutlineGenerationPrompt(params: OutlineGenerationPromptParams): string {
  const { title, keyword, numSections, detailLevel } = params
  
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

  return `Eres un experto en SEO y redacción de contenidos profesionales. Genera una estructura de títulos LÓGICA Y COHERENTE para un artículo sobre: "${title}"

📌 DATOS DEL ARTÍCULO:
- Palabra clave: "${keyword}"
- Número de secciones H2: ${numSections}
- Nivel de detalle: ${detailLevel.toUpperCase()}

${structureInstructions}

${exampleFormat}

⚠️ FORMATO DE SALIDA OBLIGATORIO - SOLO TEXTO PLANO:

Responde ÚNICAMENTE con los títulos de las secciones, uno por línea.
NO uses JSON, NO uses markdown de código (\`\`\`), SOLO texto plano.
Usa ## para H2, ### para H3, #### para H4.
Usa [LIST] para indicar listas con viñetas.
Usa [NUMBERED-LIST] para indicar listas numeradas.

IMPORTANTE: Incluye la palabra clave "${keyword}" o variaciones en al menos el 40% de los títulos H2.

Responde ahora con la estructura:`
}
