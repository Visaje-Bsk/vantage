# Documentación del Proyecto - Sistema de Gestión de Órdenes de Pedido

## Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Funcionalidades Implementadas](#funcionalidades-implementadas)
6. [Flujo de Trabajo y Roles](#flujo-de-trabajo-y-roles)
7. [Base de Datos](#base-de-datos)
8. [Componentes Principales](#componentes-principales)
9. [Estado Actual del Desarrollo](#estado-actual-del-desarrollo)
10. [Próximos Pasos y Mejoras Futuras](#próximos-pasos-y-mejoras-futuras)

---

## Descripción General

Sistema web de gestión de órdenes de pedido con flujo de trabajo tipo Kanban para gestionar el ciclo completo de órdenes a través de diferentes departamentos de una organización. El sistema implementa control de acceso basado en roles (RBAC) y permite el seguimiento de órdenes desde su creación hasta su cierre financiero.

### Propósito del Sistema
- Centralizar la gestión de órdenes de pedido
- Automatizar el flujo de trabajo entre departamentos
- Controlar permisos por rol departamental
- Mantener historial de cambios y responsables
- Facilitar la comunicación entre áreas

---

## Arquitectura del Sistema

### Arquitectura General
```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Kanban     │  │  Catálogos   │  │    Admin     │  │
│  │   Board      │  │  Maestros    │  │    Panel     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              TanStack Query (State Mgmt)                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Client (API Layer)                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │     Auth     │  │     RLS      │  │
│  │   Database   │  │   Service    │  │   Policies   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Patrones de Diseño Implementados
1. **Component Composition**: Componentes reutilizables con shadcn/ui
2. **Custom Hooks**: Lógica de negocio separada en hooks específicos
3. **Context API**: Gestión de autenticación y usuario global
4. **Protected Routes**: Control de acceso a nivel de rutas
5. **Generic Components**: Catálogos genéricos reutilizables

---

## Stack Tecnológico

### Frontend
- **React 18.3.1** - Framework de UI
- **TypeScript 5.8.3** - Tipado estático
- **Vite 5.4.19** - Build tool y dev server
- **React Router v6.30.1** - Enrutamiento
- **Tailwind CSS 3.4.17** - Estilos utilitarios
- **shadcn/ui** - Sistema de componentes basado en Radix UI

### Estado y Datos
- **TanStack Query 5.83.0** - Server state management
- **React Hook Form 7.61.1** - Gestión de formularios
- **Zod 3.25.76** - Validación de esquemas

### Backend y Base de Datos
- **Supabase 2.40.7** - BaaS (Backend as a Service)
  - PostgreSQL - Base de datos
  - Auth - Autenticación de usuarios
  - Row Level Security (RLS) - Seguridad a nivel de fila
  - Real-time subscriptions (potencial)

### UI Components
- **Radix UI** - Primitivos de UI accesibles
- **Lucide React** - Iconos
- **Recharts** - Gráficos (para dashboard)
- **Sonner** - Notificaciones toast
- **date-fns** - Manejo de fechas

---

## Estructura del Proyecto

```
ordenes-pedido/
├── src/
│   ├── components/          # Componentes de UI
│   │   ├── admin/           # Componentes de administración
│   │   │   ├── catalogs/    # Catálogos específicos
│   │   │   ├── CatalogManagement.tsx
│   │   │   ├── GenericAdminCatalog.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── PermissionMatrix.tsx
│   │   ├── auth/            # Autenticación
│   │   │   └── ProtectedRoute.tsx
│   │   ├── catalogs/        # Componentes de catálogos
│   │   │   ├── GenericCatalogList.tsx
│   │   │   └── RoleCatalogs.tsx
│   │   ├── kanban/          # Sistema Kanban
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   └── NuevaOrdenModal.tsx
│   │   ├── modals/          # Modales de la aplicación
│   │   │   ├── OrderModal.tsx
│   │   │   ├── ConfirmationDialog.tsx
│   │   │   └── tabs/        # Tabs por departamento
│   │   │       ├── ComercialTab.tsx
│   │   │       ├── InventariosTab.tsx
│   │   │       ├── ProduccionTab.tsx
│   │   │       ├── LogisticaTab.tsx
│   │   │       ├── FacturacionTab.tsx
│   │   │       └── FinancieraTab.tsx
│   │   ├── ui/              # Componentes UI de shadcn
│   │   └── AppSidebar.tsx   # Sidebar de navegación
│   ├── contexts/            # Contextos de React
│   │   └── AuthContext.tsx  # Contexto de autenticación
│   ├── hooks/               # Custom hooks
│   │   ├── comercial/       # Hooks específicos de Comercial
│   │   │   ├── useComercialData.ts
│   │   │   ├── useComercialDisplay.ts
│   │   │   ├── useComercialForm.ts
│   │   │   ├── useComercialSave.ts
│   │   │   ├── useComercialValidation.ts
│   │   │   ├── useDespachoForm.ts
│   │   │   ├── useProductLines.ts
│   │   │   ├── useServiceLines.ts
│   │   │   ├── useResponsableSelection.ts
│   │   │   └── useUnsavedChanges.ts
│   │   ├── shared/          # Hooks compartidos
│   │   │   ├── useConfirmationDialog.ts
│   │   │   ├── useCurrencyFormatter.ts
│   │   │   ├── useEditMode.ts
│   │   │   └── useLoadingState.ts
│   │   ├── usePermissions.ts
│   │   ├── usePagination.ts
│   │   └── use-toast.ts
│   ├── integrations/        # Integraciones externas
│   │   └── supabase/
│   │       ├── client.ts    # Cliente de Supabase
│   │       └── types.ts     # Tipos auto-generados
│   ├── lib/                 # Utilidades
│   │   ├── utils.ts
│   │   └── auth-utils.ts
│   ├── pages/               # Páginas principales
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Ordenes.tsx
│   │   ├── Catalogos.tsx
│   │   ├── Admin.tsx
│   │   └── NotFound.tsx
│   ├── types/               # Definiciones de tipos
│   │   └── kanban.ts        # Tipos del sistema Kanban
│   ├── App.tsx              # Componente raíz
│   └── main.tsx             # Entry point
├── supabase/                # Configuración de Supabase
│   └── migrations/          # Migraciones de base de datos
├── public/                  # Archivos estáticos
├── CLAUDE.md                # Guía para Claude Code
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Funcionalidades Implementadas

### 1. Sistema de Autenticación y Autorización

#### Autenticación
- Login con email y password (Supabase Auth)
- Registro de usuarios con asignación de nombre
- Cierre de sesión
- Persistencia de sesión
- Recuperación de perfil de usuario

#### Roles Disponibles
```typescript
type AppRole =
  | 'admin'       // Acceso completo al sistema
  | 'comercial'   // Crea y gestiona órdenes iniciales
  | 'inventarios' // Gestiona inventarios y disponibilidad
  | 'produccion'  // Gestiona producción y fabricación
  | 'logistica'   // Gestiona envíos y despachos
  | 'facturacion' // Gestiona facturación
  | 'financiera'  // Cierre financiero de órdenes
```

#### Control de Acceso
- `ProtectedRoute`: Protege rutas que requieren autenticación
- `adminOnly`: Rutas exclusivas para administradores
- `useAuth()`: Hook para verificar permisos y roles
- `hasRole()`: Verifica si el usuario tiene un rol específico
- Row Level Security (RLS) en base de datos

### 2. Tablero Kanban de Órdenes

#### Características
- **Vista tipo Kanban** con 6 columnas (fases del proceso)
- **Búsqueda en tiempo real** por consecutivo, cliente o proyecto
- **Filtrado por columna** basado en fase de la orden
- **Tarjetas de orden** con información resumida
- **Contador de órdenes** por columna
- **Scroll horizontal** para todas las columnas

#### Columnas del Kanban (Fases)
1. **Comercial** - Creación y configuración inicial
2. **Inventarios** - Verificación de stock y disponibilidad
3. **Producción** - Fabricación y ensamblaje
4. **Logística** - Preparación de envío
5. **Facturación** - Emisión de documentos
6. **Financiera** - Cierre contable

#### Estados de Orden
- **Borrador** - Orden en creación
- **Abierta** - Orden activa en proceso
- **Enviada** - Orden despachada
- **Facturada** - Orden facturada
- **Cerrada** - Orden completada
- **Anulada** - Orden cancelada

### 3. Gestión de Órdenes

#### Creación de Órdenes
- Modal `NuevaOrdenModal` para crear órdenes
- Solo usuarios con rol `comercial` o `admin` pueden crear
- Asignación automática de:
  - Fase inicial: `comercial`
  - Estado inicial: `borrador`
  - Usuario creador (`created_by`)
  - Fechas de creación y modificación

#### Edición de Órdenes
- Modal `OrderModal` con pestañas por departamento
- **6 tabs** correspondientes a las fases del proceso
- Información de header:
  - Número de orden (consecutivo)
  - Cliente y proyecto
  - Comercial responsable
  - Fechas de creación y actualización
  - Tipo de servicio
  - Orden de compra
- **Modo edición** vs **modo lectura** por rol
- **Detección de cambios sin guardar**
- **Confirmación al cerrar** si hay cambios pendientes

#### Tabs Implementadas

##### ComercialTab (Completamente funcional)
- **Selección de cliente** con búsqueda avanzada
- **Selección de proyecto** filtrado por cliente
- **Información de despacho**:
  - Responsable de entrega
  - Dirección de despacho
  - Tipo de despacho
  - Transportadora
- **Líneas de productos**:
  - CRUD de productos
  - Cantidad, valor unitario
  - Cálculo automático de subtotales
  - Total general
- **Líneas de servicios**:
  - CRUD de servicios
  - Equipos, operadores, planes, APNs
  - Gestión de SIM cards
  - Valores y totales
- **Observaciones y notas**
- **Modo edición/lectura** según rol
- **Validaciones completas**
- **Guardado automático** con feedback visual

##### Otras Tabs (Estructura base)
- InventariosTab
- ProduccionTab
- LogisticaTab
- FacturacionTab
- FinancieraTab

Nota: Las tabs restantes tienen la estructura base pero requieren implementación de funcionalidad específica.

#### Avance de Fase
- Botón "Avanzar a [siguiente fase]"
- Solo visible para usuarios con permiso en la fase actual
- Actualiza automáticamente:
  - Fase de la orden
  - Estado a "abierta"
  - Fecha de modificación
- Mueve la orden a la siguiente columna del Kanban

### 4. Gestión de Catálogos Maestros

Sistema completo de gestión de datos maestros con 9 catálogos:

#### Catálogos Implementados
1. **Clientes**
   - Sincronización con sistema externo
   - Búsqueda avanzada
   - NIT, nombre, contacto

2. **Proyectos**
   - Asociados a clientes
   - Descripción y metadatos

3. **Clase de Orden**
   - Tipos de órdenes disponibles

4. **Tipos de Pago**
   - Formas de pago permitidas

5. **Operadores**
   - Operadores de telecomunicaciones

6. **Planes**
   - Planes por operador

7. **APN**
   - Access Point Names por operador

8. **Transportadoras**
   - Empresas de transporte

9. **Métodos de Despacho**
   - Tipos de envío disponibles

#### Funcionalidades de Catálogos
- **Componente genérico** reutilizable
- **CRUD completo** (Create, Read, Update, Delete)
- **Paginación** de resultados
- **Búsqueda** en tiempo real
- **Ordenamiento** por columnas
- **Modales** para crear/editar
- **Validación de campos** con React Hook Form + Zod
- **Relaciones** entre catálogos (ej: Proyectos → Clientes)

### 5. Administración del Sistema

#### Panel de Administración (Admin Only)
- **Gestión de Usuarios**
  - Lista de usuarios del sistema
  - Edición de roles
  - Activación/desactivación

- **Gestión de Catálogos**
  - Acceso a todos los catálogos maestros
  - Permisos completos de edición

- **Matriz de Permisos** (estructura base)
  - Visualización de permisos por rol
  - Configuración de accesos

### 6. Dashboard (Estructura base)

- Vista principal del sistema
- Métricas y estadísticas (pendiente de implementar)
- Resumen de órdenes activas
- Indicadores por departamento

### 7. Sistema de Navegación

#### Sidebar
- Navegación principal con iconos
- Secciones:
  - Dashboard
  - Órdenes (Kanban)
  - Catálogos (solo roles permitidos)
  - Admin (solo admin)
- Indicador de usuario actual
- Opción de logout

#### Rutas Implementadas
```typescript
/login              // Pública - Inicio de sesión
/                   // Protegida - Redirige a dashboard
/dashboard          // Protegida - Dashboard principal
/ordenes            // Protegida - Tablero Kanban
/catalogos          // Protegida - Gestión de catálogos
/admin              // Protegida (admin) - Panel admin
```

---

## Flujo de Trabajo y Roles

### Flujo General de una Orden

```
┌─────────────┐
│  COMERCIAL  │ ← Crea la orden, define cliente, productos, servicios
└──────┬──────┘
       │ Avanza
       ▼
┌─────────────┐
│ INVENTARIOS │ ← Verifica stock, confirma disponibilidad
└──────┬──────┘
       │ Avanza
       ▼
┌─────────────┐
│ PRODUCCION  │ ← Fabrica/ensambla, registra producción
└──────┬──────┘
       │ Avanza
       ▼
┌─────────────┐
│  LOGISTICA  │ ← Prepara envío, coordina despacho
└──────┬──────┘
       │ Avanza
       ▼
┌─────────────┐
│ FACTURACION │ ← Genera factura, documentos fiscales
└──────┬──────┘
       │ Avanza
       ▼
┌─────────────┐
│ FINANCIERA  │ ← Registra pago, cierra orden
└─────────────┘
```

### Permisos por Rol

| Funcionalidad | Admin | Comercial | Inventarios | Producción | Logística | Facturación | Financiera |
|---------------|-------|-----------|-------------|------------|-----------|-------------|------------|
| Ver todas las órdenes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear órdenes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar tab Comercial | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar tab Inventarios | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar tab Producción | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Editar tab Logística | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Editar tab Facturación | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Editar tab Financiera | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Avanzar orden de su fase | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver catálogos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar catálogos | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Panel Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

⚠️ = Permisos específicos según implementación RLS

---

## Base de Datos

### Schema Principal (PostgreSQL)

#### Tablas Principales

##### `profiles`
```sql
- user_id (uuid, FK a auth.users)
- nombre (text)
- role (app_role enum)
- created_at (timestamp)
```

##### `ordenpedido`
```sql
- id_orden_pedido (serial, PK)
- consecutivo (integer)
- consecutivo_code (text)
- id_cliente (integer, FK)
- id_proyecto (integer, FK)
- fase (fase_orden_enum)
- estatus (estatus_orden_enum)
- fecha_creacion (timestamp)
- fecha_modificacion (timestamp)
- created_by (uuid, FK a profiles)
- observaciones_orden (text)
- orden_compra (text)
- responsable_entrega (text)
- direccion_despacho (text)
- id_tipo_despacho (integer, FK)
- id_transportadora (integer, FK)
```

##### `detalle_orden` (Líneas de productos)
```sql
- id_detalle (serial, PK)
- id_orden_pedido (integer, FK)
- cantidad (numeric)
- valor_unitario (numeric)
- descripcion (text)
```

##### `servicio_orden` (Líneas de servicios)
```sql
- id_servicio_orden (serial, PK)
- id_orden_pedido (integer, FK)
- id_equipo (integer, FK)
- id_operador (integer, FK)
- id_plan (integer, FK)
- id_apn (integer, FK)
- cantidad (integer)
- valor_servicio (numeric)
- observaciones (text)
- sim_cards (jsonb[])
```

#### Tablas de Catálogos

- `cliente` - Clientes del sistema
- `proyecto` - Proyectos por cliente
- `claseorden` - Tipos de orden
- `tipo_pago` - Formas de pago
- `operador` - Operadores telco
- `plan` - Planes de servicio
- `apn` - Access Point Names
- `transportadora` - Empresas de transporte
- `metodo_despacho` - Tipos de despacho
- `equipo` - Equipos/productos

#### Enums de Base de Datos

```sql
-- Roles de la aplicación
app_role: 'admin' | 'comercial' | 'inventarios' | 'produccion' | 'logistica' | 'facturacion' | 'financiera'

-- Fases del proceso
fase_orden_enum: 'comercial' | 'inventarios' | 'produccion' | 'logistica' | 'facturacion' | 'financiera'

-- Estados de la orden
estatus_orden_enum: 'borrador' | 'abierta' | 'enviada' | 'facturada' | 'cerrada' | 'anulada'
```

### Migraciones Aplicadas

El proyecto cuenta con 5 archivos de migración en `supabase/migrations/`:

1. `20250914210302_*.sql` - Schema inicial
2. `20250916215314_*.sql` - Ajustes de tablas
3. `20250916215338_*.sql` - Relaciones y FKs
4. `20250917164552_*.sql` - RLS policies
5. `upsert_comercial_tab.sql` - Función para guardar tab comercial

### Row Level Security (RLS)

Sistema de políticas RLS para controlar acceso a datos por rol:
- Usuarios solo ven órdenes de su departamento (o todas si admin)
- Usuarios solo pueden editar en su fase asignada
- Políticas específicas por tabla y operación (SELECT, INSERT, UPDATE, DELETE)

---

## Componentes Principales

### Arquitectura de Componentes

#### Nivel 1: Páginas (`pages/`)
Componentes de nivel superior que representan rutas

- **Login.tsx** - Autenticación
- **Dashboard.tsx** - Vista principal
- **Ordenes.tsx** - Tablero Kanban
- **Catalogos.tsx** - Gestión de catálogos
- **Admin.tsx** - Panel de administración

#### Nivel 2: Features (`components/`)
Componentes de funcionalidades específicas

##### Kanban System
- **KanbanBoard.tsx** - Tablero completo con columnas
- **KanbanColumn.tsx** - Columna individual
- **OrderCard.tsx** - Tarjeta de orden
- **NuevaOrdenModal.tsx** - Creación de órdenes

##### Order Management
- **OrderModal.tsx** - Modal principal de edición
- **ComercialTab.tsx** - Tab de comercial (100% funcional)
- **[Departamento]Tab.tsx** - Tabs de otros departamentos

##### Catalogs
- **GenericCatalogList.tsx** - Lista genérica
- **GenericAdminCatalog.tsx** - Admin genérico
- **[Entidad]Catalog.tsx** - Catálogos específicos

##### Admin
- **UserManagement.tsx** - Gestión de usuarios
- **CatalogManagement.tsx** - Gestión de catálogos
- **PermissionMatrix.tsx** - Matriz de permisos

#### Nivel 3: UI Components (`components/ui/`)
Componentes de shadcn/ui reutilizables

- Buttons, Inputs, Selects
- Dialogs, Modals, Sheets
- Tables, Cards, Badges
- Forms, Tabs, Tooltips
- etc. (40+ componentes)

### Custom Hooks Destacados

#### Hooks de Comercial
Conjunto de hooks para modularizar la lógica del tab comercial:

- **useComercialData** - Carga de datos iniciales
- **useComercialForm** - Estado del formulario
- **useComercialValidation** - Validaciones
- **useComercialSave** - Guardado en BD
- **useComercialDisplay** - Lógica de visualización
- **useProductLines** - Gestión de productos
- **useServiceLines** - Gestión de servicios
- **useDespachoForm** - Información de despacho
- **useResponsableSelection** - Selección de responsables
- **useUnsavedChanges** - Detección de cambios

#### Hooks Compartidos
- **useEditMode** - Modo edición/lectura
- **useLoadingState** - Estados de carga
- **useConfirmationDialog** - Diálogos de confirmación
- **useCurrencyFormatter** - Formato de moneda

---

## Estado Actual del Desarrollo

### ✅ Completado (90-100%)

1. **Autenticación y Autorización**
   - Sistema de login/logout
   - Gestión de roles
   - Protected routes
   - Contexto de autenticación

2. **Tab Comercial**
   - Selección de cliente/proyecto
   - Información de despacho
   - Líneas de productos (CRUD completo)
   - Líneas de servicios (CRUD completo)
   - Cálculos automáticos
   - Validaciones
   - Guardado en BD
   - Modo edición/lectura

3. **Sistema Kanban**
   - Tablero con 6 columnas
   - Búsqueda de órdenes
   - Tarjetas de orden
   - Navegación entre fases

4. **Gestión de Catálogos**
   - 9 catálogos implementados
   - CRUD completo
   - Componentes genéricos
   - Paginación y búsqueda

5. **Base de Datos**
   - Schema completo
   - Migraciones aplicadas
   - RLS configurado
   - Función upsert_comercial_tab

### 🚧 En Progreso (40-70%)

1. **OrderModal**
   - Header completo ✅
   - Sistema de tabs ✅
   - ComercialTab completa ✅
   - Tabs restantes con estructura base ⚠️
   - Avance de fase ✅

2. **Panel de Administración**
   - Estructura base ✅
   - Gestión de usuarios (básica) ✅
   - Catálogos admin ✅
   - Matriz de permisos (estructura) ⚠️

### ⏳ Pendiente (0-30%)

1. **Tabs de Departamentos**
   - InventariosTab - Estructura base, sin funcionalidad
   - ProduccionTab - Estructura base, sin funcionalidad
   - LogisticaTab - Estructura base, sin funcionalidad
   - FacturacionTab - Estructura base, sin funcionalidad
   - FinancieraTab - Estructura base, sin funcionalidad

2. **Dashboard**
   - Estructura base
   - Sin métricas ni gráficos
   - Sin indicadores

3. **Funcionalidades Avanzadas**
   - Real-time updates (subscriptions)
   - Notificaciones push
   - Historial de cambios
   - Reportes y exportación
   - Adjuntar archivos/documentos
   - Comentarios en órdenes

4. **Testing**
   - No hay tests configurados
   - Sin cobertura de tests

5. **Documentación Técnica**
   - Sin documentación de API
   - Sin guías de desarrollo

---

## Próximos Pasos y Mejoras Futuras

### Prioridad Alta (Próximas 2-4 semanas)

#### 1. Completar Tabs de Departamentos

**InventariosTab**
- [ ] Formulario de verificación de stock
- [ ] Lista de productos a verificar
- [ ] Indicadores de disponibilidad
- [ ] Comentarios de inventarios
- [ ] Botón "Marcar como verificado"

**ProduccionTab**
- [ ] Información de fabricación
- [ ] Asignación de operarios
- [ ] Fechas estimadas de producción
- [ ] Estado de producción
- [ ] Control de calidad

**LogisticaTab**
- [ ] Información de envío
- [ ] Tracking/guía
- [ ] Fecha de despacho
- [ ] Comprobante de entrega
- [ ] Estado de envío

**FacturacionTab**
- [ ] Generación de factura
- [ ] Datos fiscales
- [ ] Conceptos facturados
- [ ] Total facturado
- [ ] Link a factura PDF

**FinancieraTab**
- [ ] Registro de pagos
- [ ] Método de pago utilizado
- [ ] Fechas de pago
- [ ] Comprobantes
- [ ] Cierre contable

#### 2. Dashboard con Métricas
- [ ] Total de órdenes activas
- [ ] Órdenes por fase
- [ ] Órdenes por estado
- [ ] Gráficos de tendencias
- [ ] Indicadores de rendimiento (KPIs)
- [ ] Órdenes atrasadas
- [ ] Filtros por fecha

#### 3. Mejoras en UX
- [ ] Loader states mejorados
- [ ] Error boundaries
- [ ] Mensajes de error más descriptivos
- [ ] Confirmaciones de acciones críticas
- [ ] Atajos de teclado
- [ ] Tooltips informativos

### Prioridad Media (1-2 meses)

#### 4. Funcionalidades Avanzadas

**Historial de Cambios**
- [ ] Tabla de auditoría
- [ ] Registro de modificaciones
- [ ] Quién cambió qué y cuándo
- [ ] Diff de cambios

**Sistema de Notificaciones**
- [ ] Notificaciones en app
- [ ] Emails automáticos
- [ ] Alertas por rol
- [ ] Centro de notificaciones

**Comentarios y Colaboración**
- [ ] Comentarios en órdenes
- [ ] Menciones a usuarios
- [ ] Thread de conversaciones
- [ ] Archivos adjuntos

**Adjuntos/Documentos**
- [ ] Subir archivos a órdenes
- [ ] Galería de imágenes
- [ ] PDFs de documentos
- [ ] Storage en Supabase

#### 5. Reportes y Exportación
- [ ] Exportar órdenes a Excel
- [ ] Generación de reportes PDF
- [ ] Reportes personalizados
- [ ] Filtros avanzados
- [ ] Dashboards ejecutivos

#### 6. Optimizaciones
- [ ] Lazy loading de componentes
- [ ] Optimistic updates
- [ ] Cache strategies
- [ ] Compresión de imágenes
- [ ] Code splitting

### Prioridad Baja (2-3 meses)

#### 7. Real-time Features
- [ ] Real-time subscriptions
- [ ] Updates en vivo del Kanban
- [ ] Indicador de usuarios activos
- [ ] Conflictos de edición concurrente

#### 8. Configuración y Personalización
- [ ] Temas personalizables
- [ ] Configuración por usuario
- [ ] Preferencias de notificaciones
- [ ] Idioma (i18n)

#### 9. Testing y QA
- [ ] Unit tests (Vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Cobertura > 70%

#### 10. DevOps y Deploy
- [ ] CI/CD pipeline
- [ ] Ambientes (dev, staging, prod)
- [ ] Monitoreo y logs
- [ ] Backups automáticos
- [ ] Documentation deployment

---

## Comandos de Desarrollo

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Build
npm run build            # Build de producción
npm run build:dev        # Build en modo desarrollo
npm run preview          # Preview del build

# Calidad de código
npm run lint             # Ejecutar ESLint

# Supabase (requiere Supabase CLI)
supabase start           # Iniciar Supabase local
supabase db reset        # Reset de BD local
supabase migration new   # Nueva migración
supabase db push         # Push migraciones a remoto
```

---

## Notas de Desarrollo

### Convenciones
- **TypeScript** para todo el código
- **Functional components** con hooks
- **Custom hooks** para lógica reutilizable
- **Path aliases** configurados (`@/components`, `@/lib`, etc.)
- **ESLint** para mantener calidad de código

### Estructura de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
refactor: refactorización sin cambio funcional
style: cambios de estilo/formato
docs: actualización de documentación
test: añadir o modificar tests
chore: tareas de mantenimiento
```

### Consideraciones de Seguridad
- Todas las rutas requieren autenticación excepto `/login`
- RLS activo en todas las tablas
- Validación de permisos en frontend Y backend
- Sanitización de inputs con Zod
- Secrets en variables de entorno

### Performance
- TanStack Query maneja cache automáticamente
- Lazy loading recomendado para rutas
- Imágenes optimizadas
- Bundle size monitoreado

---

## Contacto y Recursos

### Repositorio
- GitHub: (pendiente)

### Documentación Relacionada
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Router](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)

---

**Última actualización**: 2025-10-06
**Versión del documento**: 1.0.0
**Estado del proyecto**: En desarrollo activo
