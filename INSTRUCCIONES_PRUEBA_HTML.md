# ⚠️ INSTRUCCIONES URGENTES: Probar Conversión HTML

**Fecha**: 2025-11-11  
**Estado**: Requiere reinicio del servidor

---

## 🚨 PASO 1: REINICIAR EL SERVIDOR (OBLIGATORIO)

Los cambios NO funcionarán hasta que reinicies el servidor de Next.js.

### Windows PowerShell:
```powershell
# 1. Detener el servidor actual (Ctrl+C en la terminal donde está corriendo)

# 2. Ir al directorio del proyecto
cd "c:\Users\RYZEN 5\Desktop\PROYECTOS NEXTJS\adminresh"

# 3. Reiniciar el servidor
npm run dev
```

**⏱️ Espera 10-15 segundos** hasta que veas:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

---

## 🧪 PASO 2: PROBAR LA CONVERSIÓN

### 1. Abrir el navegador en modo incógnito
```
http://localhost:3000
```

### 2. Abrir la consola del navegador
- **Chrome/Edge**: Presiona `F12`
- **Firefox**: Presiona `F12`
- Ir a la pestaña **Console**

### 3. Ir al Planner
```
/contenido/planner
```

### 4. Generar contenido
1. Ingresar keyword: `"avistamiento de jaguares pantanal"`
2. Click "Generar Estructura"
3. Esperar...
4. Click "Generar Contenido"
5. **OBSERVAR LA CONSOLA**

---

## 🔍 PASO 3: VERIFICAR LOS LOGS EN CONSOLA

Debes ver estos logs en la consola del navegador:

```
🔄 [STEP3] Markdown obtenido, longitud: 5234
🔄 [STEP3] Primeros 300 chars: ## ¿Por qué el Pantanal...
🔄 [MD→HTML] Iniciando conversión, longitud: 5234
✅ [MD→HTML] Paso 1: Imágenes convertidas
✅ [MD→HTML] Paso 2: Encabezados convertidos
✅ [MD→HTML] Paso 3: Formato inline convertido
✅ [MD→HTML] Paso 4: Enlaces convertidos
✅ [MD→HTML] Paso 5: Listas convertidas
✅ [MD→HTML] Paso 6: Listas envueltas en <ul>
✅ [MD→HTML] Paso 7: Párrafos envueltos
✅ [MD→HTML] Conversión completa, longitud: 6892
✅ [STEP3] Contenido convertido de Markdown a HTML
📏 [STEP3] Markdown length: 5234
📏 [STEP3] HTML length: 6892
📄 [STEP3] Primeros 300 chars HTML: <h2>¿Por qué el Pantanal...</h2><p>...
```

### ✅ SI VES ESTOS LOGS:
La conversión está funcionando correctamente. Continúa al PASO 4.

### ❌ SI NO VES LOS LOGS:
1. Verifica que reiniciaste el servidor
2. Limpia la caché del navegador (Ctrl+Shift+Del)
3. Abre en modo incógnito
4. Intenta de nuevo

---

## 📊 PASO 4: VERIFICAR EN BASE DE DATOS

### Opción A: phpMyAdmin
1. Abrir phpMyAdmin
2. Seleccionar la base de datos del proyecto
3. Tabla: `planner_articles`
4. Ver el último registro (ORDER BY id DESC LIMIT 1)
5. Ver la columna `content`

### Opción B: SQL directo
```sql
SELECT 
  id,
  title,
  SUBSTRING(content, 1, 300) as content_preview,
  CASE 
    WHEN content LIKE '%<h2>%' AND content LIKE '%<p>%' THEN '✅ HTML CORRECTO'
    WHEN content LIKE '%##%' AND content LIKE '%**%' THEN '❌ MARKDOWN (ERROR)'
    ELSE '⚠️ NO CLARO'
  END as formato_detectado,
  created_at
FROM planner_articles
ORDER BY created_at DESC
LIMIT 1;
```

### ✅ RESULTADO ESPERADO:
```
content_preview: <h2>¿Por qué el Pantanal es el mejor lugar...</h2><p>El Pantanal se ha ganado su reputación como el mejor destino mundial para el <strong>avistamiento de jaguares en el Pantanal</strong> gracias a su vasta extensión...
formato_detectado: ✅ HTML CORRECTO
```

### ❌ SI VES MARKDOWN EN LA BD:
```
content_preview: ## ¿Por qué el Pantanal es el mejor lugar...

El Pantanal se ha ganado su reputación como el mejor destino mundial para el **avistamiento de jaguares en el Pantanal** gracias a su vasta extensión...
formato_detectado: ❌ MARKDOWN (ERROR)
```

**SOLUCIÓN**: Los cambios no se aplicaron. Volver al PASO 1.

---

## 🔧 PASO 5: VERIFICAR EN EL EDITOR

Después de generar, debes ser redirigido al editor del artículo.

### ✅ CORRECTO:
- El texto se ve normal
- Las negritas aparecen en negrita (no con `**`)
- Los títulos son grandes (no aparece `##`)
- El botón "Código" muestra HTML

### ❌ INCORRECTO:
- Se ven `**negrita**`
- Se ven `## Título`
- El texto parece código

---

## 🎯 PASO 6: VERIFICACIÓN FINAL

### Test de edición:
1. En el editor, agregar un párrafo nuevo
2. Guardar (Ctrl+S o botón Guardar)
3. Recargar la página (F5)
4. Verificar que el contenido sigue viéndose bien

### Test de publicación WordPress:
1. Click "Publicar en WordPress"
2. Seleccionar sitio
3. Verificar que se publica correctamente
4. Abrir el post en WordPress
5. Verificar que se ve bien en Gutenberg

---

## 📋 CHECKLIST DE VERIFICACIÓN

Marca cada punto cuando lo verifiques:

- [ ] **1. Servidor reiniciado**
- [ ] **2. Caché del navegador limpiada**
- [ ] **3. Modo incógnito abierto**
- [ ] **4. Logs `[MD→HTML]` aparecen en consola**
- [ ] **5. Log dice "Conversión completa"**
- [ ] **6. HTML length > Markdown length**
- [ ] **7. Base de datos tiene HTML** (no Markdown)
- [ ] **8. Editor muestra contenido correctamente**
- [ ] **9. No se ven `**` ni `##` en el editor**
- [ ] **10. Publicación en WordPress funciona**

---

## 🐛 PROBLEMAS COMUNES

### Problema 1: "Todavía veo Markdown en la BD"

**Causa**: El servidor no se reinició o caché no se limpió

**Solución**:
1. Matar el proceso de Node.js
2. Borrar `.next` folder:
   ```powershell
   Remove-Item -Path ".\.next" -Recurse -Force
   ```
3. Reiniciar:
   ```powershell
   npm run dev
   ```
4. Limpiar caché navegador (Ctrl+Shift+Del → Todo)
5. Abrir incógnito

### Problema 2: "No veo los logs en consola"

**Causa**: Filtros de consola activos

**Solución**:
1. En la consola del navegador
2. Asegurar que el filtro esté en "All" o "Verbose"
3. Buscar por "MD→HTML" en el campo de filtro
4. Si no aparece nada, la función no se está llamando

### Problema 3: "htmlContent es undefined"

**Causa**: La función `markdownToHtml` retorna vacío

**Solución**:
1. Verificar que `utils.ts` tiene la versión nueva
2. Verificar que la función está exportada:
   ```typescript
   export const markdownToHtml = (markdown: string): string => {
   ```
3. Reiniciar servidor

---

## 📞 SI NADA FUNCIONA

### Verificación manual en consola del navegador:

```javascript
// Pegar esto en la consola del navegador
const testMarkdown = `## Título
Este es un párrafo con **negrita** y *cursiva*.`

// Si la función está disponible, probar:
// markdownToHtml(testMarkdown)
// Debe retornar: "<h2>Título</h2>\n<p>Este es un párrafo con <strong>negrita</strong> y <em>cursiva</em>.</p>"
```

---

## ✅ ÉXITO

Si todos los puntos del checklist están marcados:

🎉 **¡LA CONVERSIÓN ESTÁ FUNCIONANDO CORRECTAMENTE!**

El contenido ahora se guarda en HTML y el sistema está listo para producción.

---

**Última actualización**: 2025-11-11  
**Próximo paso**: Probar con diferentes tipos de contenido (listas, imágenes, enlaces)
