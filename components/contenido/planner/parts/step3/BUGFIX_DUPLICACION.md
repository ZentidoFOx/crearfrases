# 🐛 Corrección: Duplicación de Títulos y Respeto de Estructura

## Problema Identificado

### Síntoma
- Títulos de secciones aparecían duplicados en el artículo final
- No se respetaba la estructura jerárquica (H2 > H3 > H4) del outline original
- Se creaba una sección separada para cada H3 y H4, en lugar de incluirlas dentro de su H2 padre

### Ejemplo del Error
```markdown
## Mejores Épocas y Lugares para el Avistamiento de Jaguares en el Pantanal

## Mejores Épocas y Lugares para el Avistamiento de Jaguares en el Pantanal
[contenido...]
```

## Causa Raíz

### 1. Inicialización Incorrecta de Secciones
**Antes** (❌ Incorrecto):
```typescript
// Creaba una sección por cada item del outline (H2, H3, H4)
outline.forEach((item, idx) => {
  initialSections.push({
    id: item.id,
    title: item.title,
    type: 'section',
    ...
  })
})
```

**Resultado**: Si el outline tenía:
- 1 H2: "Mejores Épocas"
  - 1 H3: "Temporada Seca"
  - 1 H3: "Temporada Húmeda"

Se creaban **3 secciones separadas** en lugar de 1 sección con 2 subsecciones.

### 2. Prompt No Incluía Subsecciones
El método `generateSingleSection` solo generaba contenido para el H2, ignorando que debía incluir sus H3 y H4 hijos.

### 3. Duplicación en Markdown Final
El método `getFullMarkdown` siempre agregaba `## ${s.title}` al inicio, sin verificar si el contenido ya lo incluía.

---

## Solución Implementada

### ✅ Corrección 1: Filtrar Solo H2 en Inicialización

**Archivo**: `hooks/useSectionBySection.ts`

```typescript
// Filtrar solo las secciones principales (H2) del outline
// Las subsecciones (H3, H4) se incluirán como parte de su H2 padre
const mainSections = outline.filter(item => item.type === 'h2')

console.log('📋 [INIT] Total items en outline:', outline.length)
console.log('📋 [INIT] Secciones principales (H2):', mainSections.length)

// Crear secciones solo para H2
mainSections.forEach((item, idx) => {
  initialSections.push({
    id: item.id,
    title: item.title,
    type: 'section',
    status: 'pending',
    content: '',
    order: idx + 1
  })
})
```

**Resultado**: 
- Outline con 7 items (2 H2 + 3 H3 + 2 H4) → Genera solo 2 secciones (los H2)
- Las subsecciones H3 y H4 se incluirán dentro de su H2 correspondiente

---

### ✅ Corrección 2: Agrupar Subsecciones por H2

**Archivo**: `hooks/useSectionBySection.ts`

```typescript
// Generar sección normal con sus subsecciones
const mainSection = outline.find(o => o.id === section.id && o.type === 'h2')

// Encontrar todas las subsecciones (H3, H4) que pertenecen a esta H2
const mainSectionIndex = outline.findIndex(o => o.id === section.id)
const nextH2Index = outline.findIndex((o, idx) => idx > mainSectionIndex && o.type === 'h2')
const subsections = outline.slice(
  mainSectionIndex + 1,
  nextH2Index === -1 ? outline.length : nextH2Index
).filter(o => o.type === 'h3' || o.type === 'h4')

console.log(`📊 [SECTION-GEN] Sección "${section.title}" con ${subsections.length} subsecciones`)

// Pasar subsecciones al generador
content = await aiService.generateSingleSection(
  title,
  keyword,
  mainSection,
  previousSections,
  modelId,
  subsections // ⬅️ NUEVO: Pasar subsecciones
)
```

**Lógica**:
1. Encuentra el H2 actual
2. Busca el siguiente H2 en el outline
3. Todo lo que está entre el H2 actual y el siguiente H2 son sus subsecciones
4. Filtra solo H3 y H4
5. Las pasa al generador de contenido

---

### ✅ Corrección 3: Prompt Estructurado con Subsecciones

**Archivo**: `lib/api/ai-service.ts`

```typescript
async generateSingleSection(
  title: string,
  keyword: string,
  sectionOutline: {...},
  previousContext: string,
  modelId: number,
  subsections?: Array<{...}> // ⬅️ NUEVO parámetro
): Promise<string> {
  // Construir estructura de subsecciones para el prompt
  let subsectionsStructure = ''
  if (subsections && subsections.length > 0) {
    subsectionsStructure = '\n**Subsecciones que debe incluir:**\n'
    subsections.forEach((sub, idx) => {
      const prefix = sub.type === 'h3' ? '###' : '####'
      subsectionsStructure += `${idx + 1}. ${prefix} ${sub.title}\n   - ${sub.paragraphs} párrafos\n`
    })
  }

  const prompt = `...
**Sección Principal a Generar:**
- Título: ${sectionOutline.title}
${subsectionsStructure}

**Instrucciones IMPORTANTES:**
1. NO incluyas el título de la sección principal (##) al inicio
2. Primero escribe párrafos introductorios
3. Luego desarrolla cada subsección con su título:
   - Usa ### para subsecciones H3
   - Usa #### para subsecciones H4

**Formato esperado:**
[Párrafos introductorios]

### [Primera Subsección]
[Contenido...]

### [Segunda Subsección]
[Contenido...]
`
}
```

**Resultado**: El AI ahora sabe que debe generar:
- Párrafos introductorios de la sección principal
- Cada subsección con su título correcto (### o ####)

---

### ✅ Corrección 4: Evitar Duplicación en Markdown

**Archivo**: `hooks/useSectionBySection.ts`

```typescript
const getFullMarkdown = useCallback((): string => {
  const markdown = sections
    .filter(s => s.status === 'completed' && s.content)
    .map(s => {
      if (s.type === 'intro') {
        return s.content.trim()
      } else if (s.type === 'conclusion') {
        return s.content.trim()
      } else {
        // Verificar si el contenido ya empieza con el título
        const content = s.content.trim()
        const startsWithTitle = content.startsWith(`## ${s.title}`)
        
        if (startsWithTitle) {
          return content // Ya tiene el título
        } else {
          return `## ${s.title}\n\n${content}` // Agregar título
        }
      }
    })
    .join('\n\n')
  
  return markdown
}, [sections])
```

**Resultado**: Solo agrega `##` si no está presente, evitando duplicación.

---

## Resultado Final

### Antes (❌)
```markdown
## Mejores Épocas y Lugares

## Mejores Épocas y Lugares
[contenido intro...]

## Temporada Seca
[contenido...]

## Temporada Húmeda
[contenido...]
```

### Después (✅)
```markdown
## Mejores Épocas y Lugares
[contenido intro de la sección...]

### Temporada Seca
[contenido de subsección...]

### Temporada Húmeda
[contenido de subsección...]
```

---

## Impacto

### Beneficios
✅ **Respeta la estructura jerárquica** del outline original  
✅ **No duplica títulos** de secciones  
✅ **Agrupa correctamente** subsecciones bajo su H2 padre  
✅ **Genera menos secciones** = más rápido  
✅ **Markdown final limpio** y bien formateado  

### Ejemplo Real
**Outline con**:
- 2 secciones H2
- 3 subsecciones H3
- 2 subsecciones H4

**Antes**: Generaba 7 secciones separadas (1+2+3+2)  
**Ahora**: Genera 2 secciones (cada una con sus subsecciones incluidas)

---

## Archivos Modificados

1. ✅ `hooks/useSectionBySection.ts`
   - `initializeSections()` - Filtra solo H2
   - `generateSection()` - Encuentra y pasa subsecciones
   - `getFullMarkdown()` - Evita duplicación de títulos

2. ✅ `lib/api/ai-service.ts`
   - `generateSingleSection()` - Acepta parámetro `subsections`
   - Prompt actualizado con estructura de subsecciones

---

## Testing

### Prueba Manual
1. Crea un outline con estructura:
   ```
   H2: Sección 1
     H3: Subsección 1.1
     H3: Subsección 1.2
   H2: Sección 2
     H3: Subsección 2.1
   ```

2. Genera el contenido

3. Verifica el resultado:
   - ✅ Solo 2 secciones en el progreso (no 5)
   - ✅ Cada H2 incluye sus H3
   - ✅ No hay títulos duplicados
   - ✅ Markdown final respeta jerarquía

---

## Notas Técnicas

### Logs de Debug Añadidos
```typescript
console.log('📋 [INIT] Total items en outline:', outline.length)
console.log('📋 [INIT] Secciones principales (H2):', mainSections.length)
console.log(`📊 [SECTION-GEN] Sección "${section.title}" con ${subsections.length} subsecciones`)
console.log('📄 [MARKDOWN] Generado:', markdown.length, 'caracteres')
```

Estos logs ayudan a verificar que:
- Se filtran correctamente los H2
- Se encuentran las subsecciones correctas
- El markdown final es correcto

---

**Fecha de Corrección**: 2025-11-10  
**Versión**: 2.0.1  
**Estado**: ✅ Corregido y Probado
