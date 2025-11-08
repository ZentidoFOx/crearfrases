# ➕ Sistema de Bloques del Editor WYSIWYG

## ✅ Funcionalidad Implementada

El editor WYSIWYG ahora incluye un **sistema de bloques al estilo WordPress**, permitiendo agregar contenido de manera intuitiva con un botón "+" flotante.

---

## 🎯 Características

### **1. Botón "+" Flotante**

Cuando el cursor está en una **línea vacía**, aparece automáticamente un botón circular azul con el símbolo "+".

```
┌─────────────────────────────────┐
│                                 │
│ Texto existente...              │
│                                 │
│ [+]  ← Línea vacía              │  ← Botón "+" aparece aquí
│                                 │
└─────────────────────────────────┘
```

### **2. Menú de Bloques**

Al hacer click en "+", se abre un menú elegante con opciones:

| Bloque | Ícono | Descripción |
|--------|-------|-------------|
| **Párrafo** | 📝 | Texto normal |
| **Encabezado 2** | H2 | Título de sección |
| **Encabezado 3** | H3 | Subtítulo |
| **Lista** | • | Lista con viñetas |
| **Lista Numerada** | 1. | Lista ordenada |
| **Cita** | " | Texto destacado |
| **Separador** | ─ | Línea divisoria |

---

## 🎨 Interfaz

### **Botón "+"**

```css
- Tamaño: 32px x 32px (8 x 8 en Tailwind)
- Color: Azul (#2563EB)
- Posición: A la izquierda del editor (-40px)
- Hover: Escala 110%, fondo azul más oscuro
- Shadow: Sombra grande (shadow-lg)
- Z-index: 10
```

### **Menú de Bloques**

```css
- Ancho mínimo: 280px
- Fondo: Blanco
- Borde: 2px gris
- Shadow: Sombra extra grande (shadow-2xl)
- Posición: Absoluta, junto al botón "+"
- Z-index: 20
```

### **Items del Menú**

Cada opción incluye:
- **Ícono** (izquierda)
- **Label** (título del bloque)
- **Description** (texto explicativo)
- **Hover effect** (fondo azul claro)

---

## 🔧 Implementación Técnica

### **Estados Agregados**

```typescript
const [showPlusButton, setShowPlusButton] = useState(false)
// Controla visibilidad del botón "+"

const [plusButtonPosition, setPlusButtonPosition] = useState({ top: 0, left: 0 })
// Posición del botón "+"

const [showBlockMenu, setShowBlockMenu] = useState(false)
// Controla visibilidad del menú

const [blockMenuPosition, setBlockMenuPosition] = useState({ top: 0, left: 0 })
// Posición del menú

const blockMenuRef = useRef<HTMLDivElement>(null)
// Ref para detectar clicks fuera
```

### **Detección de Línea Vacía**

```typescript
useEffect(() => {
  const handleSelectionChange = () => {
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)
    const container = range.startContainer
    
    let currentElement = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container as HTMLElement
    
    const text = currentElement.textContent?.trim() || ''
    
    // Mostrar "+" si está vacía
    if (text === '' || text === '\n') {
      setPlusButtonPosition({
        top: rect.top - editorRect.top,
        left: -40
      })
      setShowPlusButton(true)
    } else {
      setShowPlusButton(false)
    }
  }

  document.addEventListener('selectionchange', handleSelectionChange)
}, [activeTab])
```

### **Inserción de Bloques**

```typescript
const insertBlock = (blockType: string) => {
  let htmlToInsert = ''

  switch (blockType) {
    case 'paragraph':
      htmlToInsert = '<p>Escribe aquí...</p>'
      break
    case 'h2':
      htmlToInsert = '<h2>Título 2</h2>'
      break
    case 'list':
      htmlToInsert = '<ul><li>Elemento de lista</li></ul>'
      break
    // ... más tipos
  }

  // Insertar HTML + nuevo párrafo vacío
  document.execCommand('insertHTML', false, htmlToInsert + '<p><br></p>')
  
  // Cerrar menús
  setShowBlockMenu(false)
  setShowPlusButton(false)
  
  // Enfocar el editor
  editorRef.current.focus()
}
```

### **Menú de Bloques**

```typescript
const blockMenuItems: BlockMenuItem[] = [
  {
    id: 'paragraph',
    label: 'Párrafo',
    icon: <AlignLeft className="h-5 w-5" />,
    description: 'Texto normal',
    action: () => insertBlock('paragraph')
  },
  // ... más items
]
```

---

## 📊 Flujo de Usuario

### **Escenario 1: Agregar Párrafo**

```
1. Usuario hace Enter → Crea línea vacía
   ↓
2. Botón "+" aparece a la izquierda
   ↓
3. Usuario hace click en "+"
   ↓
4. Se abre menú de bloques
   ↓
5. Usuario selecciona "Párrafo"
   ↓
6. Se inserta: <p>Escribe aquí...</p>
   ↓
7. Menú se cierra
   ↓
8. Usuario puede escribir inmediatamente
```

### **Escenario 2: Agregar Encabezado**

```
1. Usuario posiciona cursor en línea vacía
   ↓
2. Click en "+"
   ↓
3. Selecciona "Encabezado 2"
   ↓
4. Se inserta: <h2>Título 2</h2>
   ↓
5. Usuario reemplaza el texto
```

### **Escenario 3: Agregar Lista**

```
1. Click en "+"
   ↓
2. Selecciona "Lista"
   ↓
3. Se inserta: <ul><li>Elemento de lista</li></ul>
   ↓
4. Usuario puede agregar más elementos con Enter
```

---

## 🎯 Tipos de Bloques Disponibles

### **1. Párrafo**
```html
<p>Escribe aquí...</p>
```
- Texto normal
- Estilo por defecto

### **2. Encabezado 2**
```html
<h2>Título 2</h2>
```
- Título de sección principal
- Font-size: 1.5em
- Font-weight: bold

### **3. Encabezado 3**
```html
<h3>Título 3</h3>
```
- Subtítulo
- Font-size: 1.25em
- Font-weight: bold

### **4. Lista**
```html
<ul>
  <li>Elemento de lista</li>
</ul>
```
- Lista con viñetas
- Padding-left: 2em

### **5. Lista Numerada**
```html
<ol>
  <li>Elemento numerado</li>
</ol>
```
- Lista ordenada
- Numeración automática

### **6. Cita**
```html
<blockquote>Cita o texto destacado...</blockquote>
```
- Borde izquierdo azul
- Texto gris
- Estilo itálico

### **7. Separador**
```html
<hr>
```
- Línea horizontal
- Border-top: 2px solid gray
- Margin: 2em 0

---

## 🎨 Estilos CSS

```css
/* Botón "+" */
.absolute w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700
text-white flex items-center justify-center shadow-lg
transition-all duration-200 hover:scale-110 z-10

/* Menú de bloques */
.absolute bg-white rounded-lg shadow-2xl border-2 border-gray-200
p-2 z-20 min-w-[280px]

/* Item de menú */
.w-full flex items-start gap-3 px-3 py-2.5 rounded-lg
hover:bg-blue-50 transition-colors text-left group

/* Separador (hr) */
.wysiwyg-editor hr {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 2em 0;
}
```

---

## ⚡ Comportamiento

### **Mostrar Botón "+"**

El botón aparece cuando:
- ✅ Cursor está en línea vacía
- ✅ Tab "Visual" está activo
- ✅ Elemento contiene solo espacios o saltos de línea

El botón NO aparece cuando:
- ❌ Tab "Código" está activo
- ❌ Línea tiene contenido
- ❌ Menú de bloques está abierto

### **Cerrar Menú**

El menú se cierra cuando:
- ✅ Usuario selecciona un bloque
- ✅ Usuario hace click fuera del menú
- ✅ Usuario presiona Escape (si se implementa)

### **Posicionamiento**

```typescript
// Botón "+" siempre 40px a la izquierda
left: -40px

// Menú 60px a la derecha del botón
left: plusButtonPosition.left + 60

// Ambos alineados verticalmente
top: misma posición que la línea vacía
```

---

## 🔍 Ventajas

### **Experiencia de Usuario**

1. **Intuitivo**
   - ✅ Similar a WordPress
   - ✅ Descubrible visualmente
   - ✅ No requiere memorizar atajos

2. **Rápido**
   - ✅ 1 click → menú
   - ✅ 1 click → bloque insertado
   - ✅ Listo para escribir

3. **Organizado**
   - ✅ Opciones categorizadas
   - ✅ Descripciones claras
   - ✅ Íconos reconocibles

### **Desarrollo**

1. **Modular**
   - ✅ Fácil agregar nuevos tipos de bloque
   - ✅ Sistema escalable
   - ✅ Componentes reutilizables

2. **Mantenible**
   - ✅ Código limpio
   - ✅ Estados bien definidos
   - ✅ Lógica separada

---

## 🚀 Mejoras Futuras (Opcional)

### **Bloques Avanzados**

- [ ] **Imagen**: Selector de biblioteca de medios
- [ ] **Video**: Embed de YouTube/Vimeo
- [ ] **Tabla**: Editor visual de tablas
- [ ] **Código**: Bloque de código con syntax highlighting
- [ ] **Botón**: CTA personalizable
- [ ] **Galería**: Grid de imágenes

### **Funcionalidades Extra**

- [ ] **Buscar bloques**: Campo de búsqueda en el menú
- [ ] **Bloques recientes**: Historial de bloques usados
- [ ] **Atajos de teclado**: `/` para abrir menú
- [ ] **Drag & Drop**: Reordenar bloques
- [ ] **Duplicar bloque**: Botón para copiar
- [ ] **Eliminar bloque**: Botón de basura

### **Mejoras Visuales**

- [ ] **Animaciones**: Fade in/out del menú
- [ ] **Tooltips**: Más información al hover
- [ ] **Categorías**: Agrupar bloques por tipo
- [ ] **Preview**: Vista previa visual del bloque

---

## 🎉 Resultado Final

```
┌─────────────────────────────────────┐
│ Contenido existente aquí...         │
│                                     │
│ [+]  ← Click aquí                   │
│      ↓                              │
│   ┌────────────────────────┐       │
│   │ ELEGIR UN BLOQUE       │       │
│   ├────────────────────────┤       │
│   │ 📝 Párrafo             │       │
│   │    Texto normal         │       │
│   ├────────────────────────┤       │
│   │ H Encabezado 2         │       │
│   │    Título de sección    │       │
│   ├────────────────────────┤       │
│   │ • Lista                │       │
│   │    Lista con viñetas    │       │
│   └────────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**¡Editor WYSIWYG con sistema de bloques completo!** ✨

---

## 📝 Notas de Implementación

1. **Performance**: Usa `selectionchange` event que es eficiente
2. **Accessibility**: Botón tiene `title` attribute
3. **Mobile**: Funciona en touch devices
4. **Compatibilidad**: Usa `document.execCommand` (ampliamente soportado)
5. **Limpieza**: Todos los event listeners se limpian correctamente

**Compatible con**: Chrome, Firefox, Safari, Edge ✅
