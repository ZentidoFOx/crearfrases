# 🤖 Sistema de Análisis SEO con Corrección Automática por IA

## ✨ **NUEVO SISTEMA - Creado desde cero**

Sistema inteligente que detecta problemas SEO y los corrige automáticamente usando **IA contextual (Gemini)**.

---

## 🎯 Características Principales

### ✅ **Detección Automática de Problemas**
- Análisis en tiempo real del contenido
- Puntuación SEO de 0-100
- Categorización por tipo: error, warning, success
- 6 categorías: keyword, structure, links, length, readability

### 🔧 **Corrección Automática con IA**
- Cada problema tiene un botón "Corregir"
- La IA analiza el contexto del párrafo
- Inserta cambios de forma natural y coherente
- Marcadores visuales 🔹 para identificar cambios

### 📍 **Indicadores Visuales**
- Marcador 🔹 rodea el contenido modificado
- Se muestra durante 5 segundos
- Logs en consola con descripción del cambio
- Limpieza automática de marcadores

---

## 🔍 Problemas que Detecta y Corrige

### 1. **Palabra Clave Faltante/Insuficiente**
**Problema:**
```
❌ La palabra clave "tours de jaguares en Pantanal" NO aparece en el contenido. Úsala al menos 3 veces.
```

**Corrección con IA:**
```typescript
// ✅ La IA analiza el contexto del párrafo
const contextualSentence = await generateContextualSentence(paragraph, keyword)

// Ejemplo de salida:
"🔹 Para los amantes de la naturaleza, los **tours de jaguares en Pantanal** 
representan una experiencia única e irrepetible. 🔹"
```

**Cómo funciona:**
1. Selecciona párrafos estratégicos (inicio, medio, final)
2. Envía el contexto del párrafo a Gemini
3. La IA genera una oración natural que incluye la keyword
4. La inserta al final del párrafo con marcadores 🔹

---

### 2. **Subtítulos H2 Faltantes**
**Problema:**
```
❌ No hay subtítulos H2. Agrega al menos 3 para mejorar la estructura.
```

**Corrección con IA:**
```typescript
// ✅ Genera H2 basándose en el contexto anterior
const h2Title = await generateContextualH2(contextBefore, keyword)

// Ejemplo de salida:
"🔹 ## Mejores Épocas para Tours de Jaguares en Pantanal 🔹"
```

**Cómo funciona:**
1. Identifica posiciones estratégicas (25%, 50%, 75% del contenido)
2. Analiza el contexto de los párrafos anteriores
3. La IA genera un H2 que continúa naturalmente el tema
4. Lo inserta con marcadores 🔹

---

### 3. **Contenido Muy Corto**
**Problema:**
```
❌ El artículo tiene 450 palabras. Mínimo recomendado: 800 palabras para buen SEO.
```

**Corrección con IA:**
```typescript
// ✅ Genera 150-200 palabras de contenido adicional contextual
const additionalContent = await generateAdditionalContent(lastParagraphs, keyword)

// Ejemplo de salida:
"🔹 ## Preparación para tu Aventura
Cuando planifiques tus **tours de jaguares en Pantanal**, 
considera varios factores esenciales... [continúa con 2-3 párrafos] 🔹"
```

**Cómo funciona:**
1. Analiza los últimos 3 párrafos del artículo
2. La IA genera contenido adicional (H2 + 2-3 párrafos)
3. Mantiene coherencia con el tema y tono
4. Agrega al final con marcadores 🔹

---

### 4. **Enlaces Faltantes**
**Problema:**
```
⚠️ No hay enlaces. Agrega enlaces internos y externos para mejorar SEO.
```

**Corrección:**
```
🔹 Para más información, consulta nuestra 
[guía completa sobre tours de jaguares en Pantanal](/guia-tours-de-jaguares-en-pantanal). 🔹
```

---

### 5. **Sobreuso de Palabra Clave**
**Problema:**
```
⚠️ La palabra clave aparece 15 veces. Reduce a 5-7 para evitar keyword stuffing.
```

**Corrección:**
- Elimina las últimas ocurrencias
- Reemplaza con pronombres ("esto", "ello")
- Mantiene las primeras menciones (más importantes)

---

### 6. **Párrafos Muy Largos**
**Problema:**
```
⚠️ Oraciones muy largas (promedio: 32 palabras). 
Acorta las oraciones para mejorar legibilidad.
```

**Corrección:**
- Divide párrafos >100 palabras en dos
- Mejora la lecturabilidad

---

## 🎨 Diseño del Componente

### **Diseño Compacto y Limpio**
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
  <div className="flex items-center gap-1.5 mb-2.5">
    <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#ff6900' }} />
    <h3 className="text-xs font-bold">Análisis y Sugerencias</h3>
    <span className="ml-auto text-[10px] text-gray-500">{score} puntos</span>
  </div>
  
  {/* Lista de problemas con iconos y botones pequeños */}
  <div className="space-y-2.5">
    {issues.map((issue) => (
      <div className="flex items-start gap-2">
        {/* Icono según tipo (error/warning/success) */}
        <AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} />
        
        {/* Descripción del problema */}
        <p className="text-xs flex-1 text-gray-700">{issue.description}</p>
        
        {/* Botón pequeño de corrección */}
        <Button 
          size="sm" 
          variant="ghost"
          className="h-6 px-2 text-[10px] hover:bg-blue-50"
        >
          <Wand2 className="h-3 w-3 mr-1" />
          Corregir
        </Button>
      </div>
    ))}
  </div>
</div>
```

### **Iconos según Tipo**
- ❌ **Error** → `<AlertCircle />` (rojo)
- ⚠️ **Warning** → `<AlertTriangle />` (naranja)
- ✅ **Success** → `<CheckCircle2 />` (verde)

---

## 🔄 Flujo de Corrección

```
1. Usuario hace clic en "Corregir"
   ↓
2. Componente identifica el tipo de problema
   ↓
3. Ejecuta función de corrección específica
   ↓
4. La función usa IA (Gemini) para analizar contexto
   ↓
5. IA genera corrección contextual
   ↓
6. Se agrega al contenido con marcadores 🔹
   ↓
7. onContentUpdate() actualiza el editor
   ↓
8. Usuario VE los cambios marcados con 🔹
   ↓
9. Después de 5 segundos → Limpia marcadores
   ↓
10. Re-analiza y actualiza puntuación SEO
```

---

## 🤖 Prompts de IA Utilizados

### **Para Insertar Keyword Contextualmente**
```
Analiza este párrafo y genera UNA SOLA ORACIÓN (máximo 25 palabras) que:
1. Se integre naturalmente con el contexto del párrafo
2. Incluya la palabra clave: "${keyword}"
3. Aporte valor adicional
4. Esté en español

PÁRRAFO EXISTENTE: "${paragraphContext}..."

IMPORTANTE: 
- Responde SOLO con la oración
- Debe fluir naturalmente después del párrafo
- La palabra clave debe estar en negritas: **${keyword}**
```

### **Para Generar H2 Contextual**
```
Basándote en este contexto, genera UN TÍTULO H2 (máximo 8 palabras) que:
1. Continúe naturalmente con el tema del contexto
2. Incluya la palabra clave: "${keyword}"
3. Sea descriptivo y atractivo
4. Esté en español

CONTEXTO: "${contextBefore}..."

IMPORTANTE:
- Responde SOLO con el título
- NO uses "##", sin comillas
- Ejemplo: "Beneficios de ${keyword} para tu Viaje"
```

### **Para Expandir Contenido**
```
Basándote en este contexto, genera contenido adicional de calidad (150-200 palabras) que:
1. Continúe naturalmente con el tema
2. Incluya la palabra clave "${keyword}" 2-3 veces de forma natural
3. Aporte información valiosa y práctica
4. Esté en español

FORMATO:
- Genera un H2 contextual seguido de 2-3 párrafos
- Usa markdown: ## para títulos, **${keyword}** para negritas
- NO uses listas, solo texto fluido
```

---

## 📂 Estructura de Archivos

```
/components/contenido/planner/parts/
  └─ seo-analyzer.tsx         ← NUEVO COMPONENTE (creado desde cero)
       ├─ SEOAnalyzer          → Componente principal
       ├─ analyzeContent()     → Detecta problemas SEO
       ├─ applyFix()           → Aplica corrección
       ├─ generateContextualSentence() → IA para keywords
       ├─ generateContextualH2()       → IA para H2
       └─ generateAdditionalContent()  → IA para expandir

/app/contenido/planner/articles/parts/
  └─ AnalyticsTab.tsx         ← Integra SEOAnalyzer
       └─ Reemplaza lista estática por componente dinámico
```

---

## 🔗 Integración en la Aplicación

### **En `AnalyticsTab.tsx`:**
```typescript
import { SEOAnalyzer } from '@/components/contenido/planner/parts/seo-analyzer'

<SEOAnalyzer
  content={editedContent}
  keyword={article?.keyword || ''}
  title={article?.title || ''}
  metaDescription={article?.meta_description || ''}
  onContentUpdate={(newContent) => {
    // Actualiza el editor con el contenido corregido
    if (onContentUpdate) {
      onContentUpdate(newContent)
    }
  }}
  onFixApplied={(issueId) => {
    console.log('✅ Corrección aplicada:', issueId)
  }}
/>
```

### **En `page.tsx` (Artículo):**
```typescript
{activeTab === 'analytics' && (
  <AnalyticsTab
    article={displayArticle}
    editedContent={htmlToMarkdown(editedContent)}
    onContentUpdate={(newContent) => {
      // Convierte Markdown → HTML y actualiza editor
      const htmlContent = markdownToHtml(newContent)
      setEditedContent(htmlContent)
      setEditorKey(prev => prev + 1) // Fuerza re-render
    }}
  />
)}
```

---

## ⚡ Ventajas del Sistema

### ✅ **Corrección Inteligente**
- No solo agrega texto genérico
- La IA entiende el contexto del párrafo
- Genera contenido natural y coherente

### ✅ **Feedback Visual Inmediato**
- Marcadores 🔹 muestran dónde se hicieron cambios
- El usuario ve exactamente qué se modificó
- Limpieza automática después de 5 segundos

### ✅ **Diseño Compacto**
- Mismo estilo que el panel original
- Botones pequeños para no saturar
- Iconos de colores para identificar rápido

### ✅ **Fallback Inteligente**
- Si la IA falla, usa texto predeterminado
- Nunca deja al usuario sin corrección
- Manejo de errores robusto

---

## 📊 Tipos de Problemas SEO

| ID | Categoría | Tipo | Fixable | Descripción |
|----|-----------|------|---------|-------------|
| `keyword-missing` | keyword | error | ✅ | Palabra clave no aparece |
| `keyword-low` | keyword | warning | ✅ | Palabra clave aparece <3 veces |
| `keyword-spam` | keyword | warning | ✅ | Palabra clave aparece >10 veces |
| `keyword-title` | keyword | error | ❌ | Keyword no está en título |
| `h2-missing` | structure | error | ✅ | No hay subtítulos H2 |
| `h2-low` | structure | warning | ✅ | Menos de 3 H2 |
| `links-missing` | links | warning | ✅ | No hay enlaces |
| `length-short` | length | error | ✅ | <300 palabras |
| `length-low` | length | warning | ✅ | <800 palabras |
| `paragraphs-long` | readability | warning | ✅ | Párrafos >150 palabras promedio |

---

## 🎯 Resultado Final

**ANTES:**
```
❌ Problema detectado
→ Usuario no sabe qué hacer
→ Tiene que editar manualmente
```

**AHORA:**
```
❌ Problema detectado
→ Botón "Corregir" visible
→ 1 clic → IA analiza contexto
→ Inserta cambio natural con marcadores 🔹
→ Usuario ve exactamente qué se agregó
→ Marcadores desaparecen automáticamente
→ Score SEO se actualiza
```

---

## 🚀 Tecnologías Utilizadas

- **React** + **TypeScript**
- **Google Gemini AI** (`gemini-2.0-flash-exp`)
- **Lucide Icons** (CheckCircle2, AlertCircle, AlertTriangle, Wand2)
- **Shadcn/UI** (Button component)
- **Markdown** (para formateo de contenido)

---

**¡Sistema completamente funcional y listo para usar!** ✨🎉
