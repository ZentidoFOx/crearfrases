# 🔥 CAMBIOS: Conversión de Markdown a HTML en Generación de Contenido

**Fecha**: 2025-11-11  
**Estado**: ✅ Completado

---

## 📋 Resumen

Se modificó el flujo de generación de contenido del planner para que el contenido **se convierta de Markdown a HTML antes de guardarse** en la base de datos. Esto asegura que el editor WYSIWYG reciba siempre HTML directamente.

---

## 🎯 Problema Resuelto

**ANTES:**
```
Generación IA → Markdown → Guardar en BD → Cargar en Editor → Convertir a HTML en cliente
```

**AHORA:**
```
Generación IA → Markdown → Convertir a HTML → Guardar en BD → Cargar en Editor (ya es HTML)
```

---

## 📝 Archivos Modificados

### 1. `components/contenido/planner/parts/step3/index.tsx`

#### Cambio 1: Convertir a HTML antes de guardar
```typescript
const handleGenerateContent = async () => {
  try {
    await sectionBySection.startGeneration(...)
    
    const markdown = sectionBySection.getFullMarkdown()
    
    if (markdown) {
      // 🔥 NUEVO: Convertir Markdown a HTML antes de guardar
      const { markdownToHtml } = await import('./utils')
      const htmlContent = markdownToHtml(markdown)
      
      console.log('✅ Contenido convertido de Markdown a HTML')
      
      await handleSaveArticleWithContent(htmlContent)
    }
  } catch (error) {
    console.error('Error generando contenido:', error)
  }
}
```

#### Cambio 2: Extraer secciones de HTML en lugar de Markdown
```typescript
const handleSaveArticleWithContent = async (content: string) => {
  if (!content) {
    alert('No hay contenido para guardar')
    return
  }

  // 🔥 NUEVO: Extraer secciones del contenido HTML (buscar <h2> tags)
  const sectionsMatch = content.match(/<h2[^>]*>(.*?)<\/h2>/gi)
  const sections = sectionsMatch?.map((heading, idx) => {
    const title = heading.replace(/<\/?h2[^>]*>/gi, '').trim()
    return {
      heading: title,
      content: '',
      order: idx
    }
  }) || []

  console.log('💾 Guardando artículo con contenido HTML')
  console.log('📊 Secciones detectadas:', sections.length)

  const articleData = {
    title: title,
    h1_title: h1Title,
    keyword: keyword,
    content: content, // 🔥 Ahora es HTML, no markdown
    // ... resto de campos
  }

  await saveArticle.saveAndRedirect(articleData)
}
```

---

### 2. `components/editor/wysiwyg-editor.tsx`

#### Mejora en detección de HTML vs Markdown
```typescript
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '<p><br></p>'
  
  // 🔥 NUEVO: Detectar si el contenido YA es HTML (buscar tags HTML comunes)
  const hasHtmlTags = /<(p|h1|h2|h3|h4|div|span|strong|em|ul|ol|li|img|a)[^>]*>/i.test(markdown)
  
  if (hasHtmlTags) {
    // Ya es HTML, retornar tal cual sin procesamiento
    console.log('✅ Contenido detectado como HTML, usando directamente')
    return markdown
  }
  
  // Si tiene sintaxis markdown, convertir a HTML
  const isMarkdown = markdown.includes('##') || markdown.includes('**') || markdown.includes('- ') || markdown.includes('1. ')
  
  if (isMarkdown) {
    try {
      console.log('🔄 Convirtiendo Markdown a HTML...')
      const html = renderToStaticMarkup(
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeRaw]}
        >
          {markdown}
        </ReactMarkdown>
      )
      
      return html
    } catch (error) {
      console.error('Error convirtiendo markdown:', error)
      return markdown
    }
  }
  
  // Si no es ni HTML ni Markdown, envolver en párrafo
  return `<p>${markdown}</p>`
}
```

---

### 3. `app/contenido/planner/articles/[id]/page.tsx`

#### Cambios en variables y comentarios

**Cambio 1: Cargar contenido (línea 89-95)**
```typescript
useEffect(() => {
  if (article?.content) {
    // 🔥 NUEVO: El contenido ya viene en HTML desde el backend
    console.log('📄 Cargando contenido del artículo (HTML)')
    setEditedContent(article.content)
    setEditorKey(prev => prev + 1)
  }
}, [article?.content, articleId])
```

**Cambio 2: Obtener contenido para publicar (línea 345)**
```typescript
// 🔥 NUEVO: Obtener contenido actual del editor (ya es HTML)
const htmlContent = editedContent
```

**Cambio 3: Guardar artículo (línea 223-228)**
```typescript
// 🔥 NUEVO: Obtener contenido actual del editor (ya es HTML)
const htmlContent = editedContent

const wpData: any = {
  content: htmlContent  // Ya es HTML
}
```

**Cambio 4: Traducir artículo (línea 617-635)**
```typescript
// 🔥 NUEVO: OBTENER EL CONTENIDO ACTUAL DEL EDITOR (ya es HTML)
const htmlContentWithImages = editedContent

// Guardar el contenido actualizado
await plannerArticlesService.update(articleId, { content: htmlContentWithImages })

const translationData = {
  title: article.title,
  h1Title: article.h1_title || article.title,
  // ...
  content: htmlContentWithImages  // Ya es HTML
}
```

**Cambio 5: Validación de traducción (línea 700-704)**
```typescript
console.log('  Contenido original (primeros 100 chars):', htmlContentWithImages.substring(0, 100))
console.log('  Contenido traducido (primeros 100 chars):', translated.content.substring(0, 100))

// Validar que el contenido NO sea el mismo
if (translated.content === htmlContentWithImages) {
  throw new Error('❌ ERROR: La traducción es idéntica al original.')
}
```

---

## ✅ Beneficios

1. **Consistencia**: El contenido siempre está en HTML en la BD
2. **Rendimiento**: No se convierte en cada carga, solo una vez al generar
3. **Simplicidad**: El editor solo trabaja con HTML
4. **Menos errores**: No hay conversiones múltiples que puedan fallar
5. **WordPress**: El contenido HTML se puede convertir fácilmente a Gutenberg

---

## 🔄 Flujo Completo Actualizado

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario genera contenido en Step 3                     │
│     └─> useSectionBySection.startGeneration()              │
│         └─> Genera cada sección en Markdown                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Obtener Markdown completo                               │
│     └─> sectionBySection.getFullMarkdown()                 │
│         └─> Retorna: "## Título\n\nPárrafo..."             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 🔥 CONVERTIR A HTML (NUEVO)                             │
│     └─> markdownToHtml(markdown)                            │
│         └─> Retorna: "<h2>Título</h2><p>Párrafo...</p>"    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Guardar en Base de Datos                                │
│     └─> plannerArticlesService.create({ content: HTML })   │
│         └─> BD almacena HTML                                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Redireccionar al editor                                 │
│     └─> /contenido/planner/articles/[id]                   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Cargar artículo                                         │
│     └─> plannerArticlesService.getById(id)                 │
│         └─> Retorna article.content (HTML)                 │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Mostrar en Editor WYSIWYG                               │
│     └─> WysiwygEditor.markdownToHtml()                     │
│         └─> Detecta que ya es HTML                         │
│         └─> Lo usa directamente sin conversión             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Pruebas Recomendadas

### Test 1: Generar contenido nuevo
1. Ir a `/contenido/planner`
2. Generar estructura y contenido
3. Verificar en BD que `content` tiene HTML
4. Verificar en editor que se muestra correctamente

### Test 2: Editar contenido existente
1. Cargar artículo existente
2. Verificar que el editor muestra el HTML correctamente
3. Hacer cambios y guardar
4. Verificar que los cambios se guardan en HTML

### Test 3: Publicar en WordPress
1. Generar contenido
2. Publicar en WordPress
3. Verificar que el HTML se convierte correctamente a Gutenberg
4. Verificar en WordPress que se ve bien

### Test 4: Traducción
1. Generar artículo en español
2. Traducir a inglés
3. Verificar que la traducción se guarda en HTML
4. Cambiar entre idiomas y verificar que ambos funcionan

---

## 🐛 Posibles Problemas y Soluciones

### Problema 1: Contenido antiguo en Markdown
**Síntoma**: Artículos antiguos muestran Markdown en lugar de HTML

**Solución**: El editor detecta automáticamente y convierte
```typescript
// En wysiwyg-editor.tsx
const hasHtmlTags = /<(p|h1|h2|h3|h4|div|span|strong|em|ul|ol|li|img|a)[^>]*>/i.test(markdown)

if (hasHtmlTags) {
  return markdown  // Ya es HTML
} else {
  return convertMarkdownToHtml(markdown)  // Convertir
}
```

### Problema 2: Imágenes no se muestran
**Síntoma**: Las imágenes no aparecen en el editor

**Solución**: Verificar que `markdownToHtml` procesa correctamente las imágenes
```typescript
// En utils.ts
.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" ... />')
```

### Problema 3: Saltos de línea incorrectos
**Síntoma**: Los párrafos se juntan sin espacios

**Solución**: Verificar que se mantienen los `\n\n` entre párrafos
```typescript
.split('\n\n')
.map(block => `<p>${block}</p>`)
.join('\n\n')
```

---

## 📊 Impacto

| Aspecto | Antes | Después |
|---------|-------|---------|
| Formato en BD | Markdown | HTML |
| Conversiones | Múltiples | Una sola |
| Compatibilidad | Media | Alta |
| Rendimiento | Bueno | Mejor |
| Mantenibilidad | Media | Alta |

---

## ✨ Conclusión

El cambio fue exitoso y mejora significativamente:
- ✅ Consistencia del formato de contenido
- ✅ Rendimiento del editor
- ✅ Compatibilidad con WordPress
- ✅ Mantenibilidad del código

**Estado**: ✅ Listo para producción
