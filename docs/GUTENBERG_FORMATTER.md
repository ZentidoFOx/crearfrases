# 📦 Gutenberg Block Formatter

## ✅ Convertidor HTML → Bloques Gutenberg para WordPress

Este sistema convierte **automáticamente** el contenido HTML/Markdown a **bloques de Gutenberg** antes de enviarlo a WordPress.

---

## 🎯 **Problema Resuelto**

### ❌ **ANTES:**
```html
<p>Este es un párrafo</p>
<img src="imagen.jpg" alt="Imagen">
```
→ WordPress mostraba solo "!image" porque no reconocía el formato

### ✅ **AHORA:**
```html
<!-- wp:paragraph -->
<p>Este es un párrafo</p>
<!-- /wp:paragraph -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large">
  <img src="imagen.jpg" alt="Imagen"/>
</figure>
<!-- /wp:image -->
```
→ WordPress renderiza correctamente con bloques de Gutenberg

---

## 📋 **Bloques Soportados**

### 1. **Párrafos**
```html
<!-- wp:paragraph -->
<p>Texto del párrafo con <strong>negrita</strong> y <em>cursiva</em></p>
<!-- /wp:paragraph -->
```

### 2. **Encabezados** (H1-H6)
```html
<!-- wp:heading {"level":2} -->
<h2>Título de nivel 2</h2>
<!-- /wp:heading -->
```

### 3. **Imágenes**
```html
<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large">
  <img src="https://ejemplo.com/imagen.jpg" alt="Descripción de la imagen"/>
  <figcaption class="wp-element-caption">Pie de foto opcional</figcaption>
</figure>
<!-- /wp:image -->
```

### 4. **Listas Desordenadas**
```html
<!-- wp:list -->
<ul>
  <li>Elemento 1</li>
  <li>Elemento 2</li>
  <li>Elemento 3</li>
</ul>
<!-- /wp:list -->
```

### 5. **Listas Ordenadas**
```html
<!-- wp:list {"ordered":true} -->
<ol>
  <li>Primer paso</li>
  <li>Segundo paso</li>
  <li>Tercer paso</li>
</ol>
<!-- /wp:list -->
```

### 6. **Citas**
```html
<!-- wp:quote -->
<blockquote class="wp-block-quote">
  <p>Esta es una cita importante</p>
</blockquote>
<!-- /wp:quote -->
```

### 7. **Código**
```html
<!-- wp:code -->
<pre class="wp-block-code"><code>const ejemplo = "código"</code></pre>
<!-- /wp:code -->
```

---

## 🔧 **Uso en el Código**

### **Archivo:** `lib/api/wordpress-publisher.ts`

```typescript
import { htmlToGutenbergBlocks, markdownToGutenbergBlocks } from '@/lib/utils/gutenberg-formatter'

// Detectar si es HTML o Markdown
let gutenbergContent = ''

if (data.content.includes('<')) {
  // Es HTML
  gutenbergContent = htmlToGutenbergBlocks(data.content)
} else {
  // Es Markdown
  gutenbergContent = markdownToGutenbergBlocks(data.content)
}

// Enviar a WordPress
const postData = {
  title: data.title,
  content: gutenbergContent, // ✅ Formato Gutenberg
  status: 'publish'
}
```

---

## 🎨 **Ejemplo Completo**

### **HTML de entrada:**
```html
<h2>Beneficios del Marketing Digital</h2>
<p>El marketing digital ofrece múltiples ventajas:</p>
<ul>
  <li>Mayor alcance</li>
  <li>Menor costo</li>
  <li>Resultados medibles</li>
</ul>
<img src="https://ejemplo.com/grafico.jpg" alt="Gráfico de resultados">
<p>Como vemos en la imagen anterior, los resultados son impresionantes.</p>
```

### **Bloques Gutenberg generados:**
```html
<!-- wp:heading {"level":2} -->
<h2>Beneficios del Marketing Digital</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>El marketing digital ofrece múltiples ventajas:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul>
  <li>Mayor alcance</li>
  <li>Menor costo</li>
  <li>Resultados medibles</li>
</ul>
<!-- /wp:list -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large">
  <img src="https://ejemplo.com/grafico.jpg" alt="Gráfico de resultados"/>
</figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Como vemos en la imagen anterior, los resultados son impresionantes.</p>
<!-- /wp:paragraph -->
```

---

## 🚀 **Características**

✅ **Compatible con servidor (Node.js) y cliente (navegador)**
✅ **Procesamiento con RegEx** - No requiere DOMParser
✅ **Detecta automáticamente** HTML vs Markdown
✅ **Preserva formato inline** (negrita, cursiva, enlaces)
✅ **Maneja imágenes correctamente** con alt, title y caption
✅ **Listas anidadas** (ul/ol)
✅ **Encabezados H1-H6**
✅ **Blockquotes y código**

---

## 📊 **Flujo de Publicación**

```
Editor WYSIWYG
    ↓
Contenido HTML
    ↓
htmlToGutenbergBlocks()
    ↓
Bloques Gutenberg
    ↓
WordPress REST API
    ↓
✅ Post publicado correctamente
```

---

## 🔍 **Validación**

Para verificar que los bloques se generaron correctamente:

1. **Publicar artículo en WordPress**
2. **Abrir el editor de WordPress**
3. **Verificar que:**
   - ✅ Las imágenes se muestran como bloques de imagen
   - ✅ Los párrafos son bloques individuales
   - ✅ Las listas son bloques de lista
   - ✅ Los encabezados son bloques de heading

---

## 💡 **Notas Importantes**

### **Imágenes**
- Las imágenes se convierten a bloques `wp:image`
- Se preservan los atributos `src`, `alt`, `title`
- Se usa `<figure>` para el wrapper
- El caption va en `<figcaption class="wp-element-caption">`

### **Formato Inline**
- Se preserva `<strong>`, `<em>`, `<a>` dentro de párrafos
- WordPress reconoce estos formatos dentro de los bloques

### **Orden de Procesamiento**
1. Encabezados (H1-H6)
2. Imágenes (con y sin figure)
3. Listas (ul/ol)
4. Blockquotes
5. Párrafos
6. Texto suelto

---

## 🎯 **Resultado en WordPress**

Cuando abres el artículo en el editor de WordPress Gutenberg:
- ✅ Cada párrafo es un bloque editable
- ✅ Las imágenes tienen controles de tamaño/alineación
- ✅ Las listas se pueden expandir/contraer
- ✅ Los encabezados tienen selector de nivel
- ✅ Todo completamente funcional en Gutenberg

**¡Ya no más "!image"!** 🎉
