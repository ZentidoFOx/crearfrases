# Guía de Pruebas - Generación Sección por Sección

## 🧪 Checklist de Pruebas

### ✅ Test 1: Generación Completa Exitosa

**Objetivo**: Verificar que todas las secciones se generen correctamente

**Pasos**:
1. Navega al Planner de Contenido
2. Configura:
   - Número de secciones: 3
   - Nivel de detalle: Medio
3. Click en "Generar Estructura"
4. Espera a que se genere el outline
5. Click en "Generar Contenido"
6. Observa el progreso sección por sección

**Resultado Esperado**:
- ✅ Barra de progreso avanza de 0% → 100%
- ✅ Cada sección cambia de ⏳ → 🔄 → ✅
- ✅ Se muestran 5 secciones: Intro + 3 secciones + Conclusión
- ✅ Al finalizar aparece botón "Guardar Artículo Completo"
- ✅ Estadísticas muestran: 5 Completadas, 0 Errores

**Tiempo Estimado**: 2-3 minutos

---

### ⏸️ Test 2: Pausar y Reanudar

**Objetivo**: Verificar funcionalidad de pausa

**Pasos**:
1. Inicia generación de 5 secciones
2. Espera a que se completen 2 secciones
3. Click en "Pausar"
4. Verifica que se detenga
5. Espera 5 segundos
6. Click en "Reanudar"
7. Observa que continúe desde la siguiente sección

**Resultado Esperado**:
- ✅ Se pausa después de completar la sección actual
- ✅ Botón cambia a "Reanudar"
- ✅ Estado muestra "⏸️ Generación pausada"
- ✅ Al reanudar, continúa sin regenerar las completadas
- ✅ Coherencia en el contenido

**Tiempo Estimado**: 3-4 minutos

---

### ❌ Test 3: Manejo de Errores

**Objetivo**: Verificar recuperación de errores por sección

**Pasos**:
1. Inicia generación
2. **Simular error**: Desconecta internet después de 1 sección completada
3. Observa que la siguiente sección falle
4. Reconecta internet
5. Click en "Reintentar" en la sección con error
6. Verifica que regenere solo esa sección

**Resultado Esperado**:
- ✅ Sección marca con ❌ y muestra mensaje de error
- ✅ Generación se detiene automáticamente
- ✅ Secciones anteriores permanecen completadas
- ✅ Botón "Reintentar" aparece en sección con error
- ✅ Al reintentar, regenera sin afectar las demás

**Tiempo Estimado**: 3-5 minutos

---

### 🚫 Test 4: Cancelar Generación

**Objetivo**: Verificar cancelación completa

**Pasos**:
1. Inicia generación de 7 secciones
2. Espera a que se completen 3 secciones
3. Click en "Cancelar"
4. Verifica que se detenga inmediatamente

**Resultado Esperado**:
- ✅ Generación se detiene de inmediato
- ✅ Secciones completadas permanecen visibles
- ✅ Secciones pendientes quedan en estado "pending"
- ✅ No aparece botón "Guardar" (incompleto)
- ✅ Puede iniciar nueva generación

**Tiempo Estimado**: 2 minutos

---

### 📝 Test 5: Calidad del Contenido

**Objetivo**: Verificar coherencia y calidad del contenido generado

**Pasos**:
1. Genera un artículo completo de 5 secciones
2. Expande cada tarjeta de sección
3. Lee el contenido de cada sección
4. Verifica:
   - Coherencia entre secciones
   - Keyword incluida naturalmente
   - Sin repeticiones innecesarias
   - Transiciones naturales

**Resultado Esperado**:
- ✅ Introducción menciona los temas a tratar
- ✅ Cada sección fluye naturalmente a la siguiente
- ✅ Keyword aparece 1-2 veces por sección
- ✅ Conclusión resume los puntos principales
- ✅ Longitud aproximada según configuración

**Tiempo Estimado**: 5-7 minutos

---

### 💾 Test 6: Guardar Artículo

**Objetivo**: Verificar guardado correcto en base de datos

**Pasos**:
1. Completa generación de artículo
2. Click en "Guardar Artículo Completo"
3. Espera redirección
4. Verifica que el artículo aparezca en la lista
5. Abre el artículo guardado
6. Verifica que el contenido esté completo

**Resultado Esperado**:
- ✅ Redirecciona a la página del artículo
- ✅ Artículo aparece en lista de artículos
- ✅ Contenido completo guardado correctamente
- ✅ Metadata (título, keywords, descripción) correcta
- ✅ Secciones en el orden correcto
- ✅ Formato markdown preservado

**Tiempo Estimado**: 2-3 minutos

---

### 🔄 Test 7: Regenerar Sección Individual

**Objetivo**: Verificar regeneración de sección específica

**Pasos**:
1. Completa generación de artículo
2. Identifica una sección (ej: Sección 3)
3. Simula error en esa sección (desconectar internet momentáneamente)
4. Click en "Reintentar" en esa sección
5. Verifica que solo regenere esa sección

**Resultado Esperado**:
- ✅ Solo la sección seleccionada entra en estado "generating"
- ✅ Las demás permanecen intactas
- ✅ Contenido regenerado es diferente pero coherente
- ✅ No afecta el contexto de las secciones siguientes
- ✅ Progreso se actualiza correctamente

**Tiempo Estimado**: 2-3 minutos

---

### 📱 Test 8: Responsive Design

**Objetivo**: Verificar funcionalidad en móvil

**Pasos**:
1. Abre DevTools (F12)
2. Activa modo responsive (Ctrl+Shift+M)
3. Selecciona iPhone 12 Pro
4. Inicia generación
5. Verifica que la UI sea usable

**Resultado Esperado**:
- ✅ Panel de progreso se adapta al ancho
- ✅ Lista de secciones scrolleable
- ✅ Botones accesibles
- ✅ Texto legible
- ✅ Sin overflow horizontal

**Tiempo Estimado**: 2-3 minutos

---

## 🐛 Casos Edge

### Edge Case 1: Artículo con 1 Sección
```
Resultado: Intro + 1 Sección + Conclusión = 3 secciones totales
```

### Edge Case 2: Artículo con 10 Secciones
```
Resultado: Intro + 10 Secciones + Conclusión = 12 secciones totales
Tiempo estimado: 8-10 minutos
```

### Edge Case 3: Modelo sin Streaming
```
Resultado: Usa método normal (fallback automático)
```

### Edge Case 4: Timeout en API
```
Resultado: Marca sección como error, permite reintentar
```

### Edge Case 5: Cerrar Pestaña Durante Generación
```
Resultado: ⚠️ Se pierde el progreso (no implementado localStorage aún)
```

---

## 📊 Métricas de Performance

### Tiempo de Generación Esperado

| Secciones | Nivel | Tiempo Estimado |
|-----------|-------|-----------------|
| 3         | Básico | 1-2 min |
| 5         | Medio | 2-3 min |
| 7         | Avanzado | 4-5 min |
| 10        | Avanzado | 6-8 min |

### Uso de Tokens Aproximado

| Secciones | Tokens/Sección | Total Tokens |
|-----------|----------------|--------------|
| 3         | 500-800 | 1,500-2,400 |
| 5         | 500-800 | 2,500-4,000 |
| 7         | 500-800 | 3,500-5,600 |

---

## ✅ Checklist de Funcionalidad

Marca cuando hayas probado cada función:

- [ ] Generación completa exitosa
- [ ] Pausar generación
- [ ] Reanudar generación
- [ ] Cancelar generación
- [ ] Regenerar sección con error
- [ ] Expandir/colapsar tarjetas de sección
- [ ] Guardar artículo completo
- [ ] Empezar nuevo artículo
- [ ] Barra de progreso actualizada
- [ ] Estadísticas en tiempo real
- [ ] Responsive en móvil
- [ ] Manejo de errores por sección
- [ ] Coherencia del contenido
- [ ] Markdown correcto

---

## 🚨 Problemas Comunes y Soluciones

### Problema: "No se ha seleccionado un modelo de IA"
**Solución**: Asegúrate de tener un modelo configurado en tu cuenta

### Problema: Secciones con contenido vacío
**Solución**: Verifica que el modelo de IA esté respondiendo correctamente

### Problema: Timeout frecuente
**Solución**: 
- Reduce el número de secciones
- Cambia a nivel "Básico"
- Verifica tu conexión a internet

### Problema: Barra de progreso no actualiza
**Solución**: Refresca la página y reintenta

### Problema: Botón "Guardar" no aparece
**Solución**: Asegúrate de que TODAS las secciones estén completadas

---

## 📝 Reporte de Bugs

Si encuentras un bug, reporta con:

1. **Pasos para reproducir**
2. **Resultado esperado**
3. **Resultado actual**
4. **Capturas de pantalla**
5. **Consola del navegador** (F12 → Console)

---

**Última actualización**: 2025-11-10  
**Versión**: 2.0.0
