# 📝 Prompts Library

Biblioteca centralizada de prompts para el sistema de planificación de contenido.

## 🗂️ Estructura

```
lib/prompts/
├── index.ts                    # Exportaciones centralizadas
├── keyword-suggestions.ts      # Prompt para sugerencias de keywords
├── title-generation.ts         # Prompt para generación de títulos SEO
└── README.md                   # Esta documentación
```

## 📋 Prompts Disponibles

### 1. **Keyword Suggestions** (`keyword-suggestions.ts`)

Genera sugerencias de palabras clave relacionadas con una keyword base.

**Función:** `buildKeywordSuggestionsPrompt(params)`

**Parámetros:**
```typescript
interface KeywordSuggestionsPromptParams {
  baseKeyword: string           // Palabra clave base
  existingKeywords: string[]    // Keywords ya existentes (para evitar duplicados)
}
```

**Uso:**
```typescript
import { buildKeywordSuggestionsPrompt } from '@/lib/prompts'

const prompt = buildKeywordSuggestionsPrompt({
  baseKeyword: 'safari jaguar bolivia',
  existingKeywords: ['tours bolivia', 'aventura pantanal']
})
```

**Salida esperada:**
- Lista de 10 palabras clave únicas
- Variaciones long-tail
- Sin duplicados de las existentes
- Optimizadas para SEO

---

### 2. **Title Generation** (`title-generation.ts`)

Genera títulos completos optimizados para SEO siguiendo mejores prácticas de Yoast y Google.

**Función:** `buildTitleGenerationPrompt(params)`

**Parámetros:**
```typescript
interface TitleGenerationPromptParams {
  keyword: string               // Palabra clave principal
  count: number                 // Cantidad de títulos a generar
  additionalKeywords?: string   // Keywords adicionales (opcional)
}
```

**Uso:**
```typescript
import { buildTitleGenerationPrompt } from '@/lib/prompts'

const prompt = buildTitleGenerationPrompt({
  keyword: 'safari jaguar bolivia',
  count: 5,
  additionalKeywords: 'tours guiados, observación fauna'
})
```

**Estructura de salida JSON:**
```json
{
  "title": "Safari Jaguar Bolivia: Guía Completa 2024",
  "h1Title": "Descubre el Safari de Jaguares en Bolivia",
  "description": "Planifica tu safari jaguar Bolivia...",
  "keywords": ["safari pantanal", "avistamiento jaguares"],
  "objectivePhrase": "el mejor safari de jaguares en Bolivia"
}
```

**Características:**
- ✅ Keyword placement optimizado (al inicio del title)
- ✅ Longitudes óptimas (title: 50-60 chars, description: 150-160 chars)
- ✅ Frase clave objetivo (objectivePhrase) para usar en contenido
- ✅ Keywords relacionadas incluidas
- ✅ CTR optimization (palabras de poder, números, urgencia)
- ✅ Variedad de ángulos (guía, comparación, tips, etc.)

---

## 🎯 Mejores Prácticas

### **Al Crear Nuevos Prompts:**

1. **Usar TypeScript interfaces** para los parámetros
2. **Documentar claramente** qué hace el prompt
3. **Incluir ejemplos** en los comentarios
4. **Especificar formato de salida** esperado
5. **Exportar desde index.ts** para acceso centralizado

### **Nomenclatura:**

- Archivos: `kebab-case.ts` (ej: `title-generation.ts`)
- Funciones: `buildXxxPrompt` (ej: `buildTitleGenerationPrompt`)
- Interfaces: `XxxPromptParams` (ej: `TitleGenerationPromptParams`)

### **Estructura de Archivo:**

```typescript
/**
 * Descripción del prompt
 */

export interface XxxPromptParams {
  // Parámetros necesarios
}

export function buildXxxPrompt(params: XxxPromptParams): string {
  // Construcción del prompt
  return `prompt content...`
}
```

---

## 📊 Uso en ai-service.ts

Los prompts se importan y usan en `lib/api/ai-service.ts`:

```typescript
import { 
  buildKeywordSuggestionsPrompt,
  buildTitleGenerationPrompt 
} from '@/lib/prompts'

// Usar en métodos del servicio
async generateKeywordSuggestions(...) {
  const prompt = buildKeywordSuggestionsPrompt({ baseKeyword, existingKeywords })
  const response = await this.generateWithModel(prompt, modelId)
  // ...
}
```

---

## ✨ Ventajas de Separar Prompts

1. **Mantenibilidad:** Fácil encontrar y editar prompts específicos
2. **Reutilización:** Usar prompts en diferentes partes del código
3. **Testing:** Probar prompts de forma aislada
4. **Versionado:** Historial claro de cambios en cada prompt
5. **Colaboración:** Múltiples personas pueden trabajar en prompts diferentes
6. **Documentación:** Cada prompt tiene su propia documentación clara

---

## 🔮 Prompts Futuros

Próximos prompts a implementar:

- [ ] `content-generation.ts` - Generación de contenido completo (Step3)
- [ ] `content-optimization.ts` - Optimización de contenido existente
- [ ] `content-translation.ts` - Traducción de contenido
- [ ] `content-humanization.ts` - Humanización de contenido
- [ ] `meta-tags-generation.ts` - Generación de meta tags
- [ ] `schema-markup-generation.ts` - Generación de schema markup

---

## 📚 Referencias

- [Yoast SEO Best Practices](https://yoast.com/blog/)
- [Google Search Central](https://developers.google.com/search)
- [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
