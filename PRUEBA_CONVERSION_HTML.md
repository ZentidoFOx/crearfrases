# 🧪 GUÍA DE PRUEBA: Conversión Markdown → HTML

**Fecha**: 2025-11-11  
**Estado**: ✅ Corregido

---

## 🔍 Problema Identificado

El contenido se guardaba en **Markdown** en lugar de **HTML** en la base de datos.

**Síntoma**: Al abrir un artículo, se veía código markdown como `**texto**` en lugar de HTML `<strong>texto</strong>`.

---

## ✅ Solución Implementada

### 1. Función de Conversión Mejorada (`utils.ts`)

La función `markdownToHtml()` ahora procesa en **7 pasos ordenados**:

```typescript
export const markdownToHtml = (markdown: string): string => {
  // Paso 1: Convertir imágenes
  // ![alt](url) → <img src="url" alt="alt" />
  
  // Paso 2: Convertir encabezados
  // ## Título → <h2>Título</h2>
  
  // Paso 3: Convertir formato inline
  // **negrita** → <strong>negrita</strong>
  // *cursiva* → <em>cursiva</em>
  
  // Paso 4: Convertir enlaces
  // [texto](url) → <a href="url">texto</a>
  
  // Paso 5: Convertir listas
  // - item → <li>item</li>
  
  // Paso 6: Envolver listas en <ul>
  
  // Paso 7: Envolver líneas en <p>
  // texto → <p>texto</p>
}
```

### 2. Logs de Debug

La función ahora muestra logs en consola para cada paso:

```
🔄 [MD→HTML] Iniciando conversión, longitud: 5234
✅ [MD→HTML] Paso 1: Imágenes convertidas
✅ [MD→HTML] Paso 2: Encabezados convertidos
✅ [MD→HTML] Paso 3: Formato inline convertido
✅ [MD→HTML] Paso 4: Enlaces convertidos
✅ [MD→HTML] Paso 5: Listas convertidas
✅ [MD→HTML] Paso 6: Listas envueltas en <ul>
✅ [MD→HTML] Paso 7: Párrafos envueltos
✅ [MD→HTML] Conversión completa, longitud: 6892
```

---

## 🧪 Cómo Probar

### Prueba 1: Generar Nuevo Contenido

1. **Ir al Planner**
   ```
   /contenido/planner
   ```

2. **Configurar y generar**
   - Keyword: "mejores lugares para viajar"
   - Generar estructura
   - Generar contenido (esperar a que termine)

3. **Abrir la consola del navegador (F12)**
   - Buscar los logs: `[MD→HTML]`
   - Verificar que diga "Conversión completa"

4. **Verificar en el Editor**
   - Se debe redirigir al editor
   - El contenido debe verse normal (sin `**` ni `##`)

5. **Verificar en Base de Datos**
   - Abrir phpMyAdmin o SQL
   - Ver tabla `planner_articles`
   - El campo `content` debe tener HTML:
   ```html
   <h2>Título</h2>
   <p>Texto con <strong>negrita</strong> y <em>cursiva</em>.</p>
   ```

### Prueba 2: Verificar Conversión Manual

Puedes probar la conversión directamente en consola:

```javascript
// Abrir consola del navegador en el editor
const markdown = `
## Mi Título

Este es un párrafo con **negrita** y *cursiva*.

- Item 1
- Item 2
- Item 3
`

// Importar la función (solo en dev)
// Buscar en el código fuente y copiar la función markdownToHtml
// O ejecutar desde el componente
```

---

## 📊 Casos de Prueba

### Caso 1: Texto Simple
```markdown
INPUT:
Este es un párrafo simple.

OUTPUT:
<p>Este es un párrafo simple.</p>
```

### Caso 2: Negrita y Cursiva
```markdown
INPUT:
Este texto tiene **negrita** y *cursiva*.

OUTPUT:
<p>Este texto tiene <strong>negrita</strong> y <em>cursiva</em>.</p>
```

### Caso 3: Encabezados
```markdown
INPUT:
## Mi Sección
### Subsección

OUTPUT:
<h2>Mi Sección</h2>
<h3>Subsección</h3>
```

### Caso 4: Listas
```markdown
INPUT:
- Item 1
- Item 2
- Item 3

OUTPUT:
<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ul>
```

### Caso 5: Enlaces
```markdown
INPUT:
Visita [mi sitio](https://example.com)

OUTPUT:
<p>Visita <a href="https://example.com" target="_blank" rel="noopener noreferrer">mi sitio</a></p>
```

### Caso 6: Imágenes
```markdown
INPUT:
![Descripción](https://example.com/imagen.jpg)

OUTPUT:
<img src="https://example.com/imagen.jpg" alt="Descripción" style="max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5em auto; display: block;" />
```

### Caso 7: Contenido Completo
```markdown
INPUT:
## Introducción

Este es el primer párrafo con **negrita**.

Este es el segundo párrafo con *cursiva*.

## Lista de Beneficios

Los beneficios incluyen:

- Beneficio 1
- Beneficio 2
- Beneficio 3

## Conclusión

Para más información, visita [nuestro sitio](https://example.com).

OUTPUT:
<h2>Introducción</h2>

<p>Este es el primer párrafo con <strong>negrita</strong>.</p>

<p>Este es el segundo párrafo con <em>cursiva</em>.</p>

<h2>Lista de Beneficios</h2>

<p>Los beneficios incluyen:</p>

<ul>
<li>Beneficio 1</li>
<li>Beneficio 2</li>
<li>Beneficio 3</li>
</ul>

<h2>Conclusión</h2>

<p>Para más información, visita <a href="https://example.com" target="_blank" rel="noopener noreferrer">nuestro sitio</a>.</p>
```

---

## 🔍 Verificación en Base de Datos

### SQL para verificar
```sql
-- Ver el último artículo creado
SELECT id, title, SUBSTRING(content, 1, 200) as content_preview, created_at
FROM planner_articles
ORDER BY created_at DESC
LIMIT 1;

-- Ver si el contenido tiene HTML (debe tener tags)
SELECT id, title, 
  CASE 
    WHEN content LIKE '%<h2>%' THEN '✅ Tiene HTML'
    WHEN content LIKE '%##%' THEN '❌ Tiene Markdown'
    ELSE '⚠️ No claro'
  END as formato
FROM planner_articles
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Solución de Problemas

### Problema: Todavía se guarda Markdown

**Verificar:**
1. ¿Se está llamando `markdownToHtml()`?
   ```typescript
   // En step3/index.tsx línea 88-89
   const { markdownToHtml } = await import('./utils')
   const htmlContent = markdownToHtml(markdown)
   ```

2. ¿Se está usando la variable correcta?
   ```typescript
   // Debe ser htmlContent, NO markdown
   await handleSaveArticleWithContent(htmlContent) // ✅ Correcto
   await handleSaveArticleWithContent(markdown)    // ❌ Incorrecto
   ```

3. ¿La función está actualizada?
   - Verificar que `utils.ts` tiene la versión nueva (con logs)
   - Reiniciar el servidor Next.js: `npm run dev`

### Problema: Los logs no aparecen

**Solución:**
1. Abrir consola del navegador (F12)
2. Filtrar por `MD→HTML`
3. Si no aparecen logs, la función no se está llamando
4. Verificar en Network tab que el JS se está recargando

### Problema: Conversión incorrecta

**Verificar el orden:**
- Las negritas deben convertirse ANTES de envolver en `<p>`
- Los encabezados deben estar en su propia línea
- Las listas deben envolverse en `<ul>` después de convertir `<li>`

---

## ✅ Checklist de Verificación

Después de generar un artículo, verificar:

- [ ] Los logs `[MD→HTML]` aparecen en consola
- [ ] El log dice "Conversión completa"
- [ ] El editor muestra el contenido correctamente
- [ ] No se ven `**negrita**` ni `##título` en el editor
- [ ] La base de datos tiene HTML (tags como `<h2>`, `<p>`, `<strong>`)
- [ ] El contenido se puede publicar en WordPress sin problemas
- [ ] Las imágenes se muestran correctamente
- [ ] Los enlaces funcionan

---

## 📝 Resumen

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Formato guardado | Markdown | HTML |
| Conversión | En editor (cada vez) | Una vez al guardar |
| Logs | No | Sí (7 pasos) |
| Detección | Incorrecta | Mejorada |
| Orden procesamiento | Incorrecto | Correcto |
| Párrafos | Al final | Al final (correcto) |

---

## 🎯 Próximos Pasos

1. **Probar generación de contenido** ✅
2. **Verificar en base de datos** ✅
3. **Probar edición** ✅
4. **Probar publicación WordPress** ✅
5. **Probar traducción** ✅

---

**Estado**: ✅ Listo para pruebas  
**Urgencia**: Alta (problema crítico resuelto)  
**Prioridad**: Verificar en ambiente de desarrollo antes de producción
