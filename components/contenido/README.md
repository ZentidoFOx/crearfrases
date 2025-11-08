# Componentes de Contenido

## Estructura Organizada en Parts

Los componentes de la sección de Contenido están organizados en **partes modulares** para facilitar el mantenimiento y la búsqueda de archivos.

### 📁 Estructura de Carpetas

```
components/contenido/
├── parts/
│   ├── contenido-header.tsx       # Header con título y botón de acción
│   ├── contenido-stats.tsx        # Cards de estadísticas
│   ├── contenido-filters.tsx      # Barra de búsqueda y filtros
│   └── contenido-table.tsx        # Tabla de contenido con datos
└── README.md                      # Este archivo
```

### 📝 Descripción de Componentes

#### `contenido-header.tsx`
- **Propósito**: Muestra el título de la página y botón principal de acción
- **Características**: 
  - Título con ícono
  - Descripción
  - Botón "Nuevo Contenido"

#### `contenido-stats.tsx`
- **Propósito**: Muestra tarjetas de estadísticas principales
- **Métricas mostradas**:
  - Total de Artículos
  - Visitas Totales
  - Engagement
  - Conversiones
- **Props**: Ninguna (usa datos estáticos)

#### `contenido-filters.tsx`
- **Propósito**: Barra de búsqueda y filtros de contenido
- **Props**:
  ```typescript
  {
    search: string
    onSearchChange: (value: string) => void
    filterStatus: string
    onFilterStatusChange: (value: string) => void
    filterType: string
    onFilterTypeChange: (value: string) => void
  }
  ```
- **Filtros disponibles**:
  - Por estado: Todos, Publicado, Borrador, Programado
  - Por tipo: Todos, Blog, Landing, Guía, Video

#### `contenido-table.tsx`
- **Propósito**: Tabla con lista de contenido
- **Props**:
  ```typescript
  {
    search: string
    filterStatus: string
    filterType: string
  }
  ```
- **Características**:
  - Búsqueda en tiempo real
  - Filtrado por estado y tipo
  - Acciones: Ver, Editar, Eliminar
  - Métricas por contenido

### 🎯 Uso en la Página Principal

```tsx
import { ContenidoHeader } from '@/components/contenido/parts/contenido-header'
import { ContenidoStats } from '@/components/contenido/parts/contenido-stats'
import { ContenidoFilters } from '@/components/contenido/parts/contenido-filters'
import { ContenidoTable } from '@/components/contenido/parts/contenido-table'

export default function ContenidoPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  return (
    <div>
      <ContenidoHeader />
      <ContenidoStats />
      <ContenidoFilters
        search={search}
        onSearchChange={setSearch}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />
      <ContenidoTable
        search={search}
        filterStatus={filterStatus}
        filterType={filterType}
      />
    </div>
  )
}
```

### ✨ Ventajas de esta Estructura

1. **Fácil de encontrar**: Cada componente tiene un nombre descriptivo
2. **Modular**: Cada parte se puede modificar independientemente
3. **Reutilizable**: Los componentes pueden usarse en otras páginas
4. **Mantenible**: Cambios en una parte no afectan a las demás
5. **Escalable**: Fácil agregar nuevas partes

### 🔄 Próximas Mejoras

- [ ] Conectar con API real en `contenido-table.tsx`
- [ ] Agregar modal de creación de contenido
- [ ] Implementar edición inline
- [ ] Agregar exportación de datos
- [ ] Implementar paginación real
