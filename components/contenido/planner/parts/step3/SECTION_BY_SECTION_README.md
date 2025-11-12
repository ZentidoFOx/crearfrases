# Generación Sección por Sección - Documentación

## 🎯 Descripción General

Este sistema permite generar artículos completos sección por sección de manera secuencial, proporcionando feedback visual en tiempo real y control total sobre el proceso de generación.

## 📋 Características Principales

### ✅ Generación Secuencial
- **Introducción** → Se genera primero (2-3 párrafos)
- **Secciones del Outline** → Cada sección se genera individualmente con contexto
- **Conclusión** → Se genera al final con resumen de puntos principales

### ✅ Control en Tiempo Real
- **Pausar/Reanudar**: Detén la generación en cualquier momento
- **Cancelar**: Cancela completamente el proceso
- **Regenerar Sección**: Regenera secciones individuales que tuvieron errores

### ✅ Feedback Visual
- Barra de progreso global (X de Y secciones)
- Estados visuales por sección:
  - ⏳ **Pendiente**: No ha iniciado
  - 🔄 **Generando**: En progreso con spinner
  - ✅ **Completada**: Sección terminada exitosamente
  - ❌ **Error**: Falló la generación (puede reintentar)

### ✅ Contexto Inteligente
- Cada sección recibe el contexto de las 2 secciones anteriores
- Mantiene coherencia narrativa a lo largo del artículo
- Genera contenido alineado con el outline original

## 🏗️ Arquitectura

### Archivos Creados/Modificados

```
step3/
├── hooks/
│   └── useSectionBySection.ts      [NUEVO] - Hook principal para generación secuencial
├── components/
│   ├── SectionProgress.tsx         [NUEVO] - Panel de progreso visual
│   └── SectionCard.tsx             [NUEVO] - Tarjeta para mostrar secciones completadas
├── index.tsx                       [MODIFICADO] - Integración del nuevo flujo
└── SECTION_BY_SECTION_README.md    [NUEVO] - Esta documentación

lib/api/
└── ai-service.ts                   [MODIFICADO] - Nuevos métodos:
    ├── generateSingleSection()     - Genera una sección individual
    ├── generateIntroduction()      - Genera introducción
    └── generateConclusion()        - Genera conclusión
```

## 🔧 Hook: `useSectionBySection`

### Estados

```typescript
sections: SectionState[]           // Array de todas las secciones con su estado
currentSectionIndex: number        // Índice de la sección actual
isGenerating: boolean             // Si está generando actualmente
isPaused: boolean                 // Si está pausado
error: string                     // Error global
progress: { current, total }      // Progreso actual
```

### Funciones Principales

```typescript
startGeneration()        // Inicia la generación secuencial
pauseGeneration()        // Pausa la generación
resumeGeneration()       // Reanuda desde donde quedó
cancelGeneration()       // Cancela completamente
regenerateSection()      // Regenera una sección específica
getFullMarkdown()        // Obtiene el markdown completo
reset()                  // Reinicia todo el estado
```

## 🎨 Componentes UI

### SectionProgress
Panel principal que muestra:
- Barra de progreso global
- Lista de todas las secciones con su estado
- Botones de control (Pausar/Reanudar/Cancelar)
- Estadísticas: Completadas, Generando, Pendientes, Errores
- Botón de reintentar en secciones con error

### SectionCard
Tarjeta expandible que muestra:
- Título de la sección
- Preview del contenido (150 caracteres)
- Contador de caracteres
- Estado completado con checkmark verde

## 🔄 Flujo de Ejecución

1. **Usuario hace clic en "Generar Contenido"**
   ```
   handleGenerateContent() ejecutado
   ```

2. **Inicialización de secciones**
   ```
   initializeSections(outline, introParagraphs)
   - Crea array con: [Intro, Sección1, Sección2, ..., Conclusión]
   - Marca todas como 'pending'
   ```

3. **Generación secuencial**
   ```
   Para cada sección:
     1. Marcar como 'generating'
     2. Llamar generateSection()
        - Intro: generateIntroduction()
        - Sección: generateSingleSection() con contexto
        - Conclusión: generateConclusion()
     3. Actualizar como 'completed' con contenido
     4. Pausa de 500ms (evitar rate limiting)
   ```

4. **Finalización**
   ```
   - Todas las secciones completadas
   - Mostrar botón "Guardar Artículo Completo"
   - Generar markdown con getFullMarkdown()
   - Guardar en base de datos
   ```

## 🚨 Manejo de Errores

### Error en Sección Individual
- Se marca la sección con status 'error'
- Se muestra el mensaje de error
- Se detiene la generación automática
- Usuario puede **Reintentar** solo esa sección

### Error Global
- Se muestra alert en la parte superior
- Se detiene la generación
- Se mantienen las secciones ya completadas
- Usuario puede continuar o cancelar

## 📊 Contexto entre Secciones

Cada sección recibe contexto de las anteriores:

```typescript
const previousContext = allSections
  .slice(Math.max(0, sectionIndex - 2), sectionIndex)
  .filter(s => s.status === 'completed')
  .map(s => `## ${s.title}\n\n${s.content}`)
  .join('\n\n')
```

Esto asegura:
- ✅ Coherencia narrativa
- ✅ Sin repetición de información
- ✅ Transiciones naturales entre secciones

## 🎯 Ventajas vs Generación de Golpe

| Aspecto | Generación de Golpe | Sección por Sección |
|---------|-------------------|---------------------|
| **Progreso Visual** | ❌ No visible | ✅ En tiempo real |
| **Control** | ❌ Todo o nada | ✅ Pausar/Reanudar |
| **Errores** | ❌ Reintentar todo | ✅ Solo la sección |
| **Timeouts** | ❌ Frecuentes | ✅ Poco probable |
| **Feedback** | ❌ Espera larga | ✅ Inmediato |
| **Coherencia** | ✅ Alta | ✅ Alta (con contexto) |

## 🔐 Características de Seguridad

### Rate Limiting
- Pausa de 500ms entre secciones
- Previene bloqueos por exceso de peticiones

### Cancelación Segura
- AbortController para cancelar peticiones en curso
- Limpieza apropiada de estados
- Sin efectos secundarios

### Manejo de Memoria
- Solo mantiene el contexto necesario (últimas 2 secciones)
- Limpieza automática al reset
- No acumula referencias

## 📈 Mejoras Futuras

- [ ] Soporte para editar secciones antes de continuar
- [ ] Guardar progreso en localStorage (recuperar sesión)
- [ ] Streaming por sección para ver contenido generándose
- [ ] Estimación de tiempo por sección
- [ ] Logs detallados de generación
- [ ] Exportar solo secciones seleccionadas

## 🧪 Testing

Para probar el sistema:

1. Genera un outline de 5 secciones
2. Haz clic en "Generar Contenido"
3. Observa el progreso sección por sección
4. Prueba **Pausar** durante la generación
5. Prueba **Reanudar**
6. Simula un error (desconecta el modelo) y prueba **Reintentar**

## 💡 Notas Importantes

- ⚠️ No refresques la página durante la generación (se perderá el progreso)
- ⚠️ El modelo de IA debe soportar múltiples peticiones secuenciales
- ⚠️ Tokens: Genera más tokens totales que la generación de golpe (por el contexto repetido)
- ✅ Mejor experiencia de usuario justifica el costo adicional

---

**Desarrollado con ❤️ para mejorar la experiencia de generación de contenido**
