# 🧪 TEST DE CONVERSIÓN - DEBUG

## ⚠️ PASO 1: Verificar que el servidor está corriendo

El servidor DEBE estar corriendo con los cambios más recientes:

```powershell
# Si el servidor está corriendo, verás en la terminal:
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

Si no está corriendo o muestra errores, **reiniciarlo**:
```powershell
# Ctrl+C para detener
npm run dev
```

---

## 🔍 PASO 2: Generar contenido y ver logs

### 1. Abrir navegador en modo incógnito
```
http://localhost:3000
```

### 2. Abrir consola del navegador (F12)

### 3. Ir al planner
```
/contenido/planner
```

### 4. Generar contenido
- Keyword: `"avistamiento jaguares pantanal"`
- Click "Generar Estructura"
- Click "Generar Contenido"

---

## 📋 PASO 3: LOGS QUE DEBES VER

Busca estos logs en la consola (en orden):

### A. Logs de conversión Markdown → HTML
```
🔄 [STEP3] Markdown obtenido, longitud: XXXX
🔄 [STEP3] Primeros 300 chars: ## Título...
🔄 [MD→HTML] Iniciando conversión, longitud: XXXX
✅ [MD→HTML] Paso 1: Imágenes convertidas
✅ [MD→HTML] Paso 2: Encabezados convertidos
✅ [MD→HTML] Paso 3: Formato inline convertido
✅ [MD→HTML] Paso 4: Enlaces convertidos
✅ [MD→HTML] Paso 5: Listas convertidas
✅ [MD→HTML] Paso 6: Listas envueltas en <ul>
✅ [MD→HTML] Paso 7: Párrafos envueltos
✅ [MD→HTML] Conversión completa, longitud: YYYY
✅ [STEP3] Contenido convertido de Markdown a HTML
📏 [STEP3] Markdown length: XXXX
📏 [STEP3] HTML length: YYYY
📄 [STEP3] Primeros 300 chars HTML: <h2>Título</h2>...
```

### B. Logs de verificación antes de guardar
```
💾 [SAVE] Guardando artículo con contenido HTML
📊 [SAVE] Secciones detectadas: N
📏 [SAVE] Tamaño del contenido: YYYY caracteres
🔍 [SAVE] ¿Es HTML? Verificando tags...
   - Tiene <h2>: true
   - Tiene <p>: true
   - Tiene <strong>: true
   - Tiene ## (markdown): false
   - Tiene ** (markdown): false
📄 [SAVE] Primeros 500 chars del content: <h2>...
```

### C. Logs de envío al backend
```
📤 [SAVE] Enviando articleData.content (primeros 300 chars): <h2>...
📤 [API] Enviando datos del artículo
🌐 [API] URL: https://api-writer.turin.dev/api/v1/articles
🔍 [API] Content es HTML?
   - Tiene <h2>: true
   - Tiene <p>: true
   - Tiene ## (markdown): false
📄 [API] Content (primeros 300 chars): <h2>...
```

---

## ✅ VERIFICACIÓN DE RESULTADOS

### ¿QUÉ SIGNIFICA CADA RESULTADO?

#### ✅ TODO CORRECTO:
```
- Tiene <h2>: true
- Tiene <p>: true
- Tiene <strong>: true
- Tiene ## (markdown): false
- Tiene ** (markdown): false
```
**SIGNIFICA**: El contenido se convirtió a HTML correctamente

#### ❌ ERROR - Todavía es Markdown:
```
- Tiene <h2>: false
- Tiene <p>: false
- Tiene ## (markdown): true
- Tiene ** (markdown): true
```
**SIGNIFICA**: La conversión NO se ejecutó

---

## 🐛 SI NO VES LOS LOGS [MD→HTML]

### Problema: La función markdownToHtml no se está ejecutando

**Soluciones:**

1. **Verificar importación** en `step3/index.tsx` línea 13:
   ```typescript
   import { generateMarkdown, markdownToHtml } from './utils'
   ```

2. **Reiniciar servidor** completamente:
   ```powershell
   # Matar el proceso
   Ctrl+C
   
   # Borrar caché de Next.js
   Remove-Item -Path ".\.next" -Recurse -Force
   
   # Reiniciar
   npm run dev
   ```

3. **Verificar que el archivo utils.ts tiene la función**:
   - Abrir: `components/contenido/planner/parts/step3/utils.ts`
   - Buscar: `export const markdownToHtml`
   - Debe estar presente en la línea 6

---

## 🔧 TEST MANUAL DE LA FUNCIÓN

Si quieres probar la función manualmente:

### 1. Pega esto en la consola del navegador:

```javascript
// Test de conversión
const testMarkdown = `## Mi Título

Este es un párrafo con **negrita** y *cursiva*.

- Item 1
- Item 2
- Item 3`

console.log("INPUT (Markdown):", testMarkdown)

// La función debería estar disponible globalmente después de importarla
// Si no, necesitamos verificar la exportación
```

### 2. Resultado esperado:

```html
<h2>Mi Título</h2>

<p>Este es un párrafo con <strong>negrita</strong> y <em>cursiva</em>.</p>

<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ul>
```

---

## 📊 VERIFICAR EN BASE DE DATOS

Después de generar el artículo:

### SQL Query:
```sql
SELECT 
    id,
    title,
    LEFT(content, 300) as content_preview,
    CASE 
        WHEN content LIKE '%<h2>%' THEN 'HTML ✅'
        WHEN content LIKE '%##%' THEN 'MARKDOWN ❌'
        ELSE 'DESCONOCIDO ⚠️'
    END as tipo_contenido,
    created_at
FROM planner_articles
ORDER BY id DESC
LIMIT 1;
```

### Resultado esperado:
```
content_preview: <h2>¿Por qué el Pantanal es el mejor lugar...</h2><p>El Pantanal se ha ganado su reputación como el mejor destino mundial para el <strong>avistamiento de jaguares...
tipo_contenido: HTML ✅
```

### Resultado incorrecto:
```
content_preview: ## ¿Por qué el Pantanal es el mejor lugar...

El Pantanal se ha ganado su reputación como el mejor destino mundial para el **avistamiento de jaguares...
tipo_contenido: MARKDOWN ❌
```

---

## ⚡ SOLUCIÓN RÁPIDA SI SIGUE FALLANDO

Si después de todos los pasos anteriores sigue guardando en Markdown:

### Verificar que la función se llama:

Agregar un `debugger` en `step3/index.tsx` línea 91:

```typescript
if (markdown) {
    debugger; // ⬅️ AGREGAR ESTO
    const htmlContent = markdownToHtml(markdown)
    ...
}
```

Luego:
1. Abrir DevTools (F12)
2. Ir a pestaña "Sources"
3. Generar contenido
4. Cuando se detenga en el debugger:
   - Ver el valor de `markdown` (debe tener ## y **)
   - Ejecutar manualmente: `markdownToHtml(markdown)`
   - Ver si retorna HTML o Markdown

---

## 📞 CHECKLIST FINAL

- [ ] Servidor reiniciado
- [ ] Caché del navegador limpiada
- [ ] Modo incógnito abierto
- [ ] Logs `[MD→HTML]` aparecen en consola
- [ ] Logs `[SAVE]` muestran `Tiene <h2>: true`
- [ ] Logs `[API]` muestran `Tiene <h2>: true`
- [ ] Base de datos tiene HTML (no Markdown)

Si TODOS están marcados → ✅ Funcionando  
Si ALGUNO falla → ❌ Revisar ese paso específico

---

**Próximo paso**: Una vez que funcione, documentar y probar con diferentes tipos de contenido.
