# Content Planner con Gemini AI

## 📝 Descripción

Content Planner es una herramienta avanzada de generación de contenido que utiliza **Gemini AI** de Google para crear artículos completos y optimizados para SEO en 3 simples pasos.

## 🎯 Flujo de Trabajo

### Paso 1: Frase Clave Objetivo
- Usuario ingresa una palabra clave objetivo
- La IA analiza la palabra clave y proporciona:
  - Nivel de dificultad (easy/medium/hard)
  - Intención de búsqueda
  - 5 sugerencias de palabras clave relacionadas

### Paso 2: Generar Títulos
- La IA genera 10 títulos optimizados para SEO
- Títulos diseñados para:
  - Incluir la palabra clave naturalmente
  - Ser atractivos y generar clicks
  - Tener longitud óptima (50-60 caracteres)
- El usuario selecciona el título que prefiera
- Opción de regenerar títulos si no satisfacen

### Paso 3: Crear Contenido
- La IA genera un artículo completo con:
  - Introducción atractiva (2-3 párrafos)
  - 4-5 secciones principales con subtítulos
  - Cada sección con contenido detallado
  - Conclusión efectiva
- Longitud total: 1000-1500 palabras
- Optimizado para SEO
- Opciones:
  - Copiar contenido al portapapeles
  - Descargar como archivo Markdown

## 📁 Estructura de Archivos

```
app/contenido/planner/
└── page.tsx                          # Página principal que orquesta el flujo

components/contenido/planner/parts/
├── planner-header.tsx                # Header con título y botón reset
├── planner-stepper.tsx               # Indicador visual de pasos
├── step1-keyword.tsx                 # Paso 1: Análisis de palabra clave
├── step2-titles.tsx                  # Paso 2: Generación de títulos
└── step3-content.tsx                 # Paso 3: Generación de contenido

lib/api/
└── gemini.ts                         # Servicio de Gemini AI
```

## 🚀 Configuración

### 1. Instalar Dependencias

```bash
npm install @google/generative-ai
```

### 2. Configurar API Key de Gemini

1. Obtén tu API key en: https://makersuite.google.com/app/apikey
2. Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_GEMINI_API_KEY=tu_api_key_aqui
```

3. Reinicia el servidor de desarrollo

### 3. Acceder al Content Planner

```
http://localhost:3000/contenido/planner
```

## 🎨 Componentes

### `planner-header.tsx`
- **Propósito**: Mostrar título y permitir reiniciar el proceso
- **Props**: `onReset: () => void`

### `planner-stepper.tsx`
- **Propósito**: Indicador visual del paso actual
- **Props**: `currentStep: number`
- **Características**:
  - Muestra 3 pasos con íconos
  - Indica paso actual, completados y pendientes
  - Animaciones de transición

### `step1-keyword.tsx`
- **Propósito**: Capturar y analizar palabra clave
- **Props**: `onSubmit: (keyword: string, analysis: any) => void`
- **Características**:
  - Input con validación
  - Análisis automático con IA
  - Tips para elegir buenas palabras clave
  - Loading state durante análisis

### `step2-titles.tsx`
- **Propósito**: Generar y seleccionar título
- **Props**:
  ```typescript
  {
    keyword: string
    onSelectTitle: (title: string) => void
    onBack: () => void
  }
  ```
- **Características**:
  - Genera 10 títulos automáticamente
  - Selección con radio buttons
  - Botón para regenerar títulos
  - Muestra longitud de caracteres
  - Tips para elegir mejor título

### `step3-content.tsx`
- **Propósito**: Generar y mostrar contenido completo
- **Props**:
  ```typescript
  {
    keyword: string
    title: string
    onContentGenerated: (content: any) => void
    onBack: () => void
  }
  ```
- **Características**:
  - Generación automática al entrar
  - Preview con formato markdown
  - Estadísticas (palabras, secciones, tiempo lectura)
  - Botones: Copiar y Descargar
  - Secciones diferenciadas visualmente

## 🔧 Servicio de Gemini AI

### `gemini.ts`

Proporciona 3 métodos principales:

#### `analyzeKeyword(keyword: string)`
```typescript
{
  difficulty: 'easy' | 'medium' | 'hard'
  searchIntent: string
  suggestions: string[]
}
```

#### `generateTitles(keyword: string, count: number)`
```typescript
string[] // Array de títulos
```

#### `generateContent(title: string, keyword: string)`
```typescript
{
  introduction: string
  sections: { heading: string, content: string }[]
  conclusion: string
}
```

## 💡 Características Técnicas

### Estado Global
- La página principal (`page.tsx`) mantiene el estado de:
  - Paso actual
  - Palabra clave
  - Análisis de keyword
  - Título seleccionado
  - Contenido generado

### Flujo de Datos
1. Usuario ingresa keyword → Análisis IA → Paso 2
2. IA genera títulos → Usuario selecciona → Paso 3
3. IA genera contenido → Usuario descarga/copia

### Manejo de Errores
- Validación de inputs
- Mensajes de error claros
- Reintentos automáticos
- Estados de loading

## 🎯 Mejoras Futuras

- [ ] Guardar borradores automáticamente
- [ ] Edición inline del contenido generado
- [ ] Exportar en múltiples formatos (HTML, PDF, DOCX)
- [ ] Historial de contenidos generados
- [ ] Ajustes de tono y estilo
- [ ] Integración con WordPress/CMS
- [ ] Análisis de legibilidad
- [ ] Sugerencias de imágenes
- [ ] Optimización de meta descripción
- [ ] Generación de FAQs

## 🔒 Seguridad

- ✅ Ruta protegida por autenticación (middleware)
- ✅ API key en variables de entorno
- ✅ Validación de inputs
- ✅ Rate limiting de Gemini AI

## 📊 Métricas

El contenido generado incluye:
- **Palabras totales**: Suma de introducción + secciones + conclusión
- **Número de secciones**: Cantidad de H2 generados
- **Tiempo de lectura**: Estimado en minutos

## 🐛 Troubleshooting

### Error: "API key not configured"
- Verifica que `.env.local` exista
- Confirma que la variable sea `NEXT_PUBLIC_GEMINI_API_KEY`
- Reinicia el servidor después de agregar la key

### Error: "Failed to generate content"
- Verifica tu conexión a internet
- Confirma que la API key sea válida
- Revisa los límites de uso de Gemini AI

### Títulos vacíos o malformados
- Intenta con una palabra clave más específica
- Regenera los títulos
- Verifica que la API key tenga permisos

## 📝 Ejemplo de Uso

```typescript
// 1. Usuario ingresa: "marketing digital para pymes"
// 2. IA analiza y muestra:
//    - Dificultad: medium
//    - Intención: informational
//    - Sugerencias: estrategias marketing pymes, SEO para pequeñas empresas...

// 3. IA genera títulos como:
//    - "Guía Completa de Marketing Digital para PYMEs en 2024"
//    - "10 Estrategias de Marketing Digital que Toda PYME Debe Conocer"
//    - ...

// 4. Usuario selecciona título

// 5. IA genera artículo completo con introducción, 5 secciones y conclusión
```

## 🎓 Recursos

- [Documentación de Gemini AI](https://ai.google.dev/docs)
- [Mejores prácticas de SEO](https://developers.google.com/search/docs)
- [Guía de contenido optimizado](https://moz.com/learn/seo/on-page-factors)
