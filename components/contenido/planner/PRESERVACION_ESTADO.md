# ✅ Preservación de Estado entre Steps - Navegación con "← Volver"

## Problema Resuelto

Cuando el usuario hacía clic en "← Volver" en Step 2 o Step 3, perdía todo el trabajo previo:
- Los títulos generados en Step 2
- Las keywords analizadas en Step 1  
- Las sugerencias de AI
- Los análisis realizados

---

## Solución Implementada

### 🔄 Flujo de Preservación de Datos

```
Step 1 (Keyword)
    ↓ [genera datos]
    ↓ handleKeywordSubmit() → guarda en step1Data
    ↓
Step 2 (Títulos)
    ↓ [genera títulos]
    ↓ handleTitleSelect() → guarda en step2Data
    ↓
Step 3 (Contenido)
    ↓
    ← [Volver] → restaura step2Data → muestra títulos previos
    ↓
Step 2 (Títulos restaurado)
    ↓
    ← [Volver] → ya existe step1Data → muestra keywords previas
    ↓
Step 1 (Keyword restaurado)
```

---

## Archivos Modificados

### 1. `app/contenido/planner/page.tsx`

#### **Estados Agregados:**
```typescript
const [step1Data, setStep1Data] = useState<any>(null)  // Ya existía
const [step2Data, setStep2Data] = useState<any>(null)  // NUEVO
```

#### **handleTitleSelect Modificado:**
```typescript
const handleTitleSelect = (title: string, titleData?: any, step2StateData?: any) => {
  setSelectedTitle(title)
  setSelectedTitleData(titleData)
  
  // Guardar los datos del Step 2 para cuando vuelva
  if (step2StateData) {
    setStep2Data(step2StateData)
  }
  
  setCurrentStep(3)
}
```

#### **JSX - Step2Titles con initialData:**
```tsx
{currentStep === 2 && selectedModelId > 0 && (
  <Step2Titles
    keyword={keyword}
    modelId={selectedModelId}
    additionalKeywords={additionalKeywords}
    onSelectTitle={handleTitleSelect}
    onBack={() => setCurrentStep(1)}
    initialData={step2Data}  // ← NUEVO: Pasar datos guardados
  />
)}
```

---

### 2. `components/contenido/planner/parts/step2-titles.tsx`

#### **Interface Actualizada:**
```typescript
interface Step2TitlesProps {
  keyword: string
  modelId: number
  additionalKeywords?: string
  onSelectTitle: (
    title: string, 
    titleData?: TitleData, 
    step2StateData?: any  // ← NUEVO parámetro
  ) => void
  onBack: () => void
  initialData?: {        // ← NUEVO prop
    titles?: TitleData[]
    selectedTitle?: TitleData | null
  }
}
```

#### **Estados Inicializados con initialData:**
```typescript
const [titles, setTitles] = useState<TitleData[]>(initialData?.titles || [])
const [selectedTitle, setSelectedTitle] = useState<TitleData | null>(
  initialData?.selectedTitle || null
)
```

#### **handleSelectTitle Modificado:**
```typescript
const handleSelectTitle = () => {
  if (selectedTitle) {
    // Pasar también el estado actual de Step 2 para preservarlo cuando vuelva
    const step2StateData = {
      titles,
      selectedTitle
    }
    onSelectTitle(selectedTitle.title, selectedTitle, step2StateData)
  }
}
```

---

### 3. `components/contenido/planner/parts/step1-keyword.tsx`

**Ya existía** la funcionalidad de preservar datos:

```typescript
interface Step1KeywordProps {
  onSubmit: (keyword: string, analysis: any, data?: any) => void
  initialKeyword?: string
  initialData?: any  // Ya existía
}

export function Step1Keyword({ onSubmit, initialKeyword = '', initialData }: Step1KeywordProps) {
  // Estados que se preservan
  const [yoastResults, setYoastResults] = useState<SearchResult[]>(
    initialData?.yoastResults || []
  )
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(
    initialData?.aiSuggestions || []
  )
  const [suggestionAnalysisResults, setSuggestionAnalysisResults] = useState<Record<string, SearchResult[]>>(
    initialData?.suggestionAnalysisResults || {}
  )
  const [hasSearched, setHasSearched] = useState(!!initialData)
  // ... más estados
}
```

---

## Qué se Preserva en Cada Step

### 📊 **Step 1 (Keyword)**
Cuando vuelves del Step 2 al Step 1, se preserva:
- ✅ Keyword buscada
- ✅ Resultados de Yoast/WordPress
- ✅ Sugerencias de AI generadas
- ✅ Análisis de sugerencias individuales
- ✅ Keywords similares generadas
- ✅ Modelo de AI seleccionado
- ✅ Keywords adicionales ingresadas

### 📝 **Step 2 (Títulos)**  
Cuando vuelves del Step 3 al Step 2, se preserva:
- ✅ Lista completa de títulos generados
- ✅ Título seleccionado actualmente
- ✅ Scores SEO calculados
- ✅ Descripciones y keywords por título

---

## Flujo de Usuario Mejorado

### Antes (❌ Problema)
```
1. Usuario genera keywords en Step 1
2. Usuario genera títulos en Step 2
3. Usuario hace clic en "← Volver"
4. ❌ Pierde todos los títulos generados
5. ❌ Tiene que volver a generar todo
```

### Ahora (✅ Corregido)
```
1. Usuario genera keywords en Step 1
2. Usuario genera 5 títulos en Step 2
3. Usuario selecciona un título y va a Step 3
4. Usuario hace clic en "← Volver"
5. ✅ Ve los 5 títulos que había generado
6. ✅ Puede seleccionar otro título sin regenerar
7. Usuario hace clic en "← Volver" otra vez
8. ✅ Ve todas las keywords y análisis del Step 1
```

---

## Casos de Uso

### Caso 1: Comparar Títulos
```
Step 1 → genera keywords
Step 2 → genera 5 títulos
       → selecciona Título A
Step 3 → ve el outline del Título A
       ← Volver
Step 2 → ve los 5 títulos otra vez
       → selecciona Título B
Step 3 → ve el outline del Título B
       → compara y decide cuál es mejor
```

### Caso 2: Ajustar Keyword
```
Step 1 → busca "marketing digital"
Step 2 → genera títulos
       ← Volver
Step 1 → ve búsqueda anterior
       → busca "marketing digital 2024"
       → compara resultados
       → decide cuál usar
```

### Caso 3: Regenerar Títulos
```
Step 1 → genera keywords
Step 2 → genera 5 títulos
       → no le gustan
       → genera 5 títulos más
       → ahora tiene 10 títulos
       → selecciona uno
Step 3 → empieza a generar
       ← Volver (se arrepiente)
Step 2 → ve los 10 títulos
       → selecciona otro diferente
```

---

## Estructura de Datos Guardados

### step1Data
```typescript
{
  yoastResults: SearchResult[],
  aiSuggestions: string[],
  suggestionAnalysisResults: Record<string, SearchResult[]>,
  modelId: number,
  additionalKeywords: string,
  // ... más datos del Step 1
}
```

### step2Data
```typescript
{
  titles: TitleData[],  // Todos los títulos generados
  selectedTitle: TitleData | null  // Título actualmente seleccionado
}
```

#### TitleData
```typescript
{
  title: string,
  h1Title: string,
  description: string,
  keywords: string[],
  objectivePhrase: string,
  seoScore: {
    keywordInTitle: boolean,
    keywordInDescription: boolean,
    keywordDensity: number,
    titleLength: number,
    descriptionLength: number,
    overall?: number
  }
}
```

---

## Beneficios

### Para el Usuario:
1. ✅ **No pierde su trabajo** al navegar entre pasos
2. ✅ **Puede comparar opciones** fácilmente
3. ✅ **Experimenta sin miedo** a perder datos
4. ✅ **Ahorra tiempo** al no tener que regenerar
5. ✅ **Mejor toma de decisiones** al poder volver y comparar

### Para el Sistema:
1. ✅ **Menos llamadas a la API** de AI (no regenera)
2. ✅ **Mejor experiencia de usuario** (más fluido)
3. ✅ **Menor frustración** del usuario
4. ✅ **Más confianza** en el sistema

---

## Testing

### ✅ Test 1: Volver del Step 2 al Step 1
1. Genera keywords en Step 1
2. Observa que genera sugerencias de AI
3. Va a Step 2
4. Haz clic en "← Volver"
5. **Verifica**: Todas las keywords y sugerencias siguen ahí

### ✅ Test 2: Volver del Step 3 al Step 2
1. Genera keywords en Step 1
2. Genera 5 títulos en Step 2
3. Selecciona un título
4. Va a Step 3
5. Haz clic en "← Volver"
6. **Verifica**: Los 5 títulos siguen ahí
7. **Verifica**: El título seleccionado está marcado

### ✅ Test 3: Navegación Múltiple
1. Step 1 → Step 2 → Step 3
2. ← Volver a Step 2
3. ← Volver a Step 1
4. → Avanzar a Step 2
5. **Verifica**: Los títulos previos siguen ahí
6. → Avanzar a Step 3
7. **Verifica**: Todo se mantiene

---

## Notas Técnicas

### ⚠️ Limitaciones Actuales

1. **Datos en Memoria**: Los datos se pierden si recargas la página
   - Solución futura: Guardar en localStorage

2. **Reset Completo**: `handleReset()` limpia todos los datos
   - Esto es intencional para empezar de cero

### 💡 Mejoras Futuras

- [ ] Guardar en localStorage para persistencia entre recargas
- [ ] Añadir botón "Limpiar y Empezar de Nuevo" en cada step
- [ ] Indicador visual de "datos guardados" en cada step
- [ ] Historial de búsquedas anteriores
- [ ] Auto-guardar cada X segundos

---

**Fecha**: 2025-11-10  
**Versión**: 1.1.0  
**Estado**: ✅ FUNCIONAL  
**Impacto**: Mejora significativa en UX
