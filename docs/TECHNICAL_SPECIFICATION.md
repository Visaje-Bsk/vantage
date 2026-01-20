# Especificación Técnica - Sistema de Órdenes de Pedido

**Versión:** 1.0
**Última actualización:** Enero 2026
**Estado del proyecto:** En desarrollo activo (~75% funcionalidad core)

---

## 1. Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.8.3 | Tipado estático |
| Vite | 5.4.19 | Build tool y dev server |
| Tailwind CSS | 3.4.17 | Estilos utilitarios |
| shadcn/ui | Latest | Componentes UI (Radix-based) |
| React Router | 6.30.1 | Enrutamiento SPA |
| TanStack Query | 5.83.0 | Server state management |
| React Hook Form | 7.61.1 | Manejo de formularios |
| Zod | 3.25.76 | Validación de esquemas |
| Recharts | 2.15.4 | Gráficos y visualizaciones |
| Lucide React | 0.462.0 | Iconografía |

### Backend
| Tecnología | Propósito |
|------------|-----------|
| Supabase | BaaS (PostgreSQL + Auth + Storage + RLS) |
| PostgreSQL | Base de datos relacional |
| Row Level Security (RLS) | Control de acceso a nivel de fila |
| Funciones RPC | Operaciones atómicas complejas |

---

## 2. Arquitectura del Sistema

### 2.1 Estructura de Directorios

```
src/
├── components/
│   ├── admin/              # Componentes de administración
│   │   └── catalogs/       # Gestión de catálogos (CRUD)
│   ├── auth/               # Autenticación (ProtectedRoute)
│   ├── catalogs/           # Selectores y listas de catálogos
│   ├── dataGates/          # Sistema de validaciones por fase
│   ├── kanban/             # Tablero Kanban (columnas, tarjetas)
│   ├── layout/             # Header, Sidebar, PageHeader
│   ├── modals/             # Modales (OrderModal, NuevaOrdenModal)
│   │   └── tabs/           # Tabs por fase (ComercialTab, etc.)
│   └── ui/                 # Componentes shadcn/ui
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación
├── hooks/
│   ├── comercial/          # Hooks específicos del tab comercial
│   ├── shared/             # Hooks reutilizables
│   └── useDataGateValidation.ts
├── integrations/
│   └── supabase/           # Cliente y tipos auto-generados
├── lib/                    # Utilidades (cn, auth-utils)
├── pages/                  # Páginas de la aplicación
└── types/                  # Definiciones de tipos
```

### 2.2 Patrón de Componentes

```
Página → Componente Principal → Hooks Modulares → Supabase
          (KanbanBoard)         (useProductLines)   (RPC/Query)
                ↓
           Modal/Tab
        (OrderModal)
              ↓
         Sub-componentes
       (DataGateAlert)
```

---

## 3. Sistema de Autenticación y Roles

### 3.1 Roles del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador | Acceso total a todas las fases y configuración |
| `comercial` | Equipo comercial | Crear órdenes, gestionar fase comercial |
| `inventarios` | Control de inventario | Validar stock, fase inventarios |
| `produccion` | Producción | Gestionar fabricación, fase producción |
| `logistica` | Logística | Despachos, guías, fase logística |
| `facturacion` | Facturación | Emisión de facturas, fase facturación |
| `financiera` | Financiera | Confirmación de pagos, fase final |

### 3.2 Implementación

```typescript
// AuthContext.tsx
interface AuthState {
  user: User | null;
  role: AppRole | null;
  isLoading: boolean;
}

// Hook de uso
const { user, role, isAdmin } = useAuth();
```

---

## 4. Flujo de Órdenes (Kanban)

### 4.1 Fases del Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  COMERCIAL  │ →  │ INVENTARIOS │ →  │ PRODUCCIÓN  │
│   (Rojo)    │    │  (Amarillo) │    │   (Cyan)    │
└─────────────┘    └─────────────┘    └─────────────┘
                                            │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  LOGÍSTICA  │ ←  │ FACTURACIÓN │ ←  │ FINANCIERA  │
│   (Verde)   │    │   (Azul)    │    │ (Amarillo)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 4.2 Estados de Orden

| Estado | Descripción |
|--------|-------------|
| `borrador` | Orden en creación |
| `abierta` | En proceso en la fase actual |
| `enviada` | Procesada y enviada |
| `facturada` | Con factura emitida |
| `cerrada` | Completada exitosamente |
| `anulada` | Cancelada |

---

## 5. Sistema de Data Gates

### 5.1 Concepto

Los Data Gates son validaciones que controlan el avance entre fases. Una orden no puede avanzar si no cumple con los campos obligatorios de su fase actual.

### 5.2 Configuración por Fase

```typescript
// src/types/dataGates.ts
DATA_GATE_CONFIG: {
  comercial: {
    // Nota: id_cliente NO se valida aquí porque ya viene de la creación
    requiredFields: ['id_ingeniero_asignado'],
    customValidations: [validateProductos] // Al menos 1 producto confirmado
  },
  inventarios: {
    requiredFields: ['stock_validado']
  },
  produccion: {
    requiredFields: ['observaciones_produccion', 'numero_produccion']
  },
  // ... más fases
}
```

### 5.4 Bloqueo de Avance con Cambios Sin Guardar

El botón "Avanzar a [siguiente fase]" se deshabilita automáticamente si:
- Hay cambios sin guardar en el tab actual (`tabDirtyStates`)
- El mensaje cambia a: "Debes guardar los cambios antes de avanzar"

### 5.3 Severidades

| Severidad | Efecto |
|-----------|--------|
| `critical` | Bloquea avance completamente |
| `error` | Bloquea avance |
| `warning` | Permite avance con advertencia |

---

## 6. Hooks Modulares

### 6.1 Hooks Comerciales (`src/hooks/comercial/`)

| Hook | Propósito | Líneas |
|------|-----------|--------|
| `useProductLines` | Gestión de líneas de productos/equipos | ~200 |
| `useServiceLines` | Gestión de líneas de servicio | ~150 |
| `useComercialForm` | Estado del formulario principal | ~100 |
| `useDespachoForm` | Formulario de despacho | ~80 |
| `useResponsableSelection` | Selección de ingeniero asignado | ~120 |
| `useComercialValidation` | Validaciones de formulario | ~100 |
| `useComercialData` | Carga de catálogos y datos | ~300 |
| `useComercialSave` | Guardado vía RPC | ~180 |
| `useUnsavedChanges` | Detección de cambios sin guardar | ~150 |
| `useComercialDisplay` | Estados de UI (expandir/colapsar) | ~50 |

### 6.2 Hooks Compartidos (`src/hooks/shared/`)

| Hook | Propósito |
|------|-----------|
| `useEditMode` | Modo lectura/edición |
| `useLoadingState` | Estados de carga |
| `useConfirmationDialog` | Diálogos de confirmación |
| `useCurrencyFormatter` | Formateo de moneda (COP) |
| `useTabDirtyState` | Cambios sin guardar por tab |

---

## 7. Modelo de Datos (PostgreSQL)

### 7.1 Tablas Principales

```sql
-- Orden principal
orden_pedido (
  id_orden_pedido SERIAL PRIMARY KEY,
  consecutivo VARCHAR,
  id_cliente INT REFERENCES cliente,
  id_proyecto INT REFERENCES proyecto,
  fase fase_orden_enum,
  estatus estatus_orden_enum,
  created_by UUID REFERENCES profiles,
  fecha_creacion TIMESTAMP,
  fecha_modificacion TIMESTAMP
)

-- Detalles de productos
detalle_orden (
  id_orden_detalle SERIAL PRIMARY KEY,
  id_orden_pedido INT REFERENCES orden_pedido,
  id_equipo INT REFERENCES equipo,
  cantidad INT,
  valor_unitario NUMERIC,
  plantilla TEXT
)

-- Despacho
despacho_orden (
  id_despacho_orden SERIAL PRIMARY KEY,
  id_orden_pedido INT REFERENCES orden_pedido,
  id_tipo_despacho INT,
  id_transportadora INT,
  numero_guia VARCHAR,
  valor_servicio_flete NUMERIC
)
```

### 7.2 Catálogos

| Tabla | Descripción |
|-------|-------------|
| `cliente` | Clientes (NIT, nombre) |
| `proyecto` | Proyectos por cliente |
| `equipo` | Productos/equipos |
| `operador` | Operadores de servicio |
| `plan` | Planes de servicio |
| `apn` | APNs por operador |
| `transportadora` | Empresas de transporte |
| `tipo_despacho` | Métodos de despacho |
| `tipo_pago` | Condiciones de pago (forma_pago + plazo) |
| `clase_orden` | Tipos de orden |

---

## 8. Funciones RPC

### 8.1 `upsert_comercial_tab`

Función atómica para guardar todos los datos del tab comercial:

```sql
upsert_comercial_tab(
  p_orden_id INT,
  p_orden_data JSONB,
  p_despacho_data JSONB,
  p_responsable_user_id UUID,
  p_responsable_role app_role,
  p_equipos JSONB[],
  p_servicios JSONB[],
  p_deleted_equipos INT[],
  p_deleted_servicios INT[]
)
```

---

## 9. Seguridad (RLS)

### 9.1 Políticas Implementadas

- Usuarios solo ven órdenes según su rol
- Escritura restringida por fase y rol
- Catálogos: lectura para todos, escritura solo admin
- `responsable_orden`: CRUD para usuarios autenticados

### 9.2 Ejemplo de Política

```sql
CREATE POLICY "Usuarios pueden ver órdenes de su fase"
ON orden_pedido FOR SELECT
USING (
  auth.role() = 'admin' OR
  fase::text = (SELECT role FROM profiles WHERE user_id = auth.uid())
);
```

---

## 10. Componentes UI Clave

### 10.1 KanbanBoard
- Renderiza 6 columnas (una por fase)
- Drag & drop deshabilitado (avance controlado)
- Filtros por estado y búsqueda

### 10.2 OrderModal
- Modal con tabs por fase
- Footer con botón "Avanzar" controlado por Data Gates
- Detección de cambios sin guardar

### 10.3 ComercialTab
- Formulario más complejo (~1500 líneas)
- Sistema de confirmación de equipos
- Acordeones para secciones colapsables

---

## 11. Estado del Desarrollo

### 11.1 Funcionalidades Completadas (~75%)

- [x] Autenticación y roles
- [x] Tablero Kanban funcional
- [x] CRUD de órdenes
- [x] Tab Comercial completo
- [x] Sistema de Data Gates
- [x] Gestión de catálogos
- [x] Sistema de confirmación de equipos (UI con check verde)
- [x] Validaciones de cambios sin guardar
- [x] Bloqueo de avance con cambios pendientes
- [x] Búsqueda de equipos con caracteres especiales
- [x] Condiciones de pago (forma_pago + plazo combinados)
- [x] Políticas RLS para responsable_orden

### 11.2 En Desarrollo (~15%)

- [ ] Tabs Inventarios, Producción (parcial)
- [ ] Tabs Logística, Facturación, Financiera (parcial)
- [ ] Historial de cambios

### 11.3 Pendiente (~10%)

- [ ] Reportes y dashboards
- [ ] Notificaciones
- [ ] Tests automatizados
- [ ] PWA/Mobile

---

## 12. Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Build en modo desarrollo
npm run build:dev

# Linting
npm run lint

# Preview del build
npm run preview
```

---

## 13. Variables de Entorno

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 14. Convenciones de Código

- **Componentes:** PascalCase (`OrderModal.tsx`)
- **Hooks:** camelCase con prefijo `use` (`useProductLines.ts`)
- **Tipos:** PascalCase (`OrdenKanban`)
- **Constantes:** UPPER_SNAKE_CASE (`DATA_GATE_CONFIG`)
- **Archivos:** kebab-case para utilidades (`auth-utils.ts`)

---

## 15. Dependencias Clave

### Producción
- `@supabase/supabase-js`: Cliente de Supabase
- `@tanstack/react-query`: Cache y sincronización de datos
- `react-hook-form` + `zod`: Formularios con validación
- `sonner`: Notificaciones toast
- `date-fns`: Manipulación de fechas

### Desarrollo
- `typescript`: Tipado estático
- `eslint`: Linting
- `vite`: Bundler y dev server
- `tailwindcss`: Framework CSS

---

*Documento generado para facilitar la transferencia de conocimiento a agentes de IA y nuevos desarrolladores.*
