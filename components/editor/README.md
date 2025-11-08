# WYSIWYG Editor Component

Editor WYSIWYG reutilizable con funcionalidades completas.

## Uso Básico

```tsx
import { WysiwygEditor } from '@/components/editor'

function MyComponent() {
  const [content, setContent] = useState('')

  return (
    <WysiwygEditor 
      initialContent={content}
      onChange={(newContent) => setContent(newContent)}
    />
  )
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `initialContent` | `string` | `''` | Contenido HTML inicial |
| `onChange` | `(content: string) => void` | `undefined` | Callback cuando cambia el contenido |
| `showImagePicker` | `boolean` | `true` | Mostrar selector de imágenes de WordPress |
| `className` | `string` | `''` | Clases CSS adicionales |

## Características

### ✅ Formateo de Texto
- Encabezados (H2, H3)
- Negrita, cursiva, subrayado
- Listas con viñetas y numeradas
- Enlaces internos y externos
- Imágenes desde biblioteca de WordPress

### ✅ Vistas
- **Vista Visual**: Editor WYSIWYG con contentEditable
- **Vista Código**: Editor de HTML con syntax highlighting

### ✅ Toolbar Flotante
- Aparece al seleccionar texto
- Opciones: Negrita, Cursiva, Subrayado, Enlace

### ✅ Selector de Imágenes
- Búsqueda en biblioteca de WordPress
- Cache de imágenes
- Grid responsivo

## Ejemplos

### Editor Simple
```tsx
<WysiwygEditor />
```

### Con Contenido Inicial
```tsx
<WysiwygEditor 
  initialContent="<p>Hola mundo</p>"
/>
```

### Sin Selector de Imágenes
```tsx
<WysiwygEditor 
  showImagePicker={false}
/>
```

### Con Callback
```tsx
<WysiwygEditor 
  onChange={(content) => {
    console.log('Contenido:', content)
    // Guardar en base de datos
  }}
/>
```

## Dependencias

Requiere:
- `@/contexts/website-context` - Para sitio activo de WordPress
- `@/components/ui/*` - Componentes shadcn/ui

## Notas

- Usa `<p>` como separador de párrafos
- Sincronización bidireccional entre vista Visual y Código
- Compatible con API REST de WordPress
