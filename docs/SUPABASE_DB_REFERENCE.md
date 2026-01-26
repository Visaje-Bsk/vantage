# Supabase DB Reference (Órdenes de Pedido)

Este documento describe el modelo de datos (Supabase/Postgres) usado por el proyecto, sus relaciones, y dónde se consume en el frontend.

## 1) Ubicación de la integración Supabase en el repo

- **Cliente Supabase**: `src/integrations/supabase/client.ts`
  - Se exporta `supabase = createClient<Database>(...)`.
  - Auth: `persistSession`, `autoRefreshToken`, `localStorage`.

- **Tipos autogenerados**: `src/integrations/supabase/types.ts`
  - Nota: en este repo el archivo actualmente no es legible por el visor (contiene bytes nulos). Ver sección **12** para regeneración.

- **Supabase project id**: `supabase/config.toml` (`project_id = "ldkjcvuahfyxgnbyitqm"`).

## 2) Convenciones de tipos en el frontend

En el código se usan los tipos con el patrón:

- `Database["public"]["Tables"]["<tabla>"]["Row"]`
- `Database["public"]["Tables"]["<tabla>"]["Insert"]`
- `Database["public"]["Tables"]["<tabla>"]["Update"]`
- `Database["public"]["Enums"]["<enum>"]`

Ejemplos reales:

- `src/hooks/queries/useCatalogQueries.ts`
  - `type ClienteRow = Database["public"]["Tables"]["cliente"]["Row"]`
  - `type TipoPagoRow = Database["public"]["Tables"]["tipo_pago"]["Row"]`

- `src/components/modals/tabs/ComercialTab.tsx`
  - `type AppRole = Database["public"]["Enums"]["app_role"]`
  - `type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]`
  - `type ClaseCobro = Database["public"]["Enums"]["clase_cobro"]`

## 3) Entidades principales del dominio (visión conceptual)

El sistema gestiona una **orden de pedido** que recorre fases (Kanban) y se completa por áreas.

- **Orden**: `orden_pedido`
- **Detalle** (líneas): `detalle_orden`
  - Puede representar:
    - **Equipo/Producto** (referencia a `equipo`)
    - **Línea de servicio** (referencia a `linea_servicio` vía `id_linea_detalle`)
- **Despacho**: `despacho_orden`
- **Facturación**: `factura` (posiblemente múltiples por orden y por tipo)
- **Remisión**: `remision`
- **Historial**: `historial_orden`
- **Asignaciones de responsables**: `responsable_orden` (N:M orden ↔ usuario)

Además existen múltiples **catálogos** (maestros) que se usan en selects y validaciones.

## 4) Relaciones (alto nivel)

Basado en el modelo descrito en `docs/TECHNICAL_SPECIFICATION.md` y en queries reales:

- `orden_pedido.id_cliente -> cliente.id_cliente`
- `orden_pedido.id_proyecto -> proyecto.id_proyecto`
- `orden_pedido.created_by -> profiles.user_id` (o equivalente)
- `orden_pedido.id_tipo_pago -> tipo_pago.id_tipo_pago`

- `detalle_orden.id_orden_pedido -> orden_pedido.id_orden_pedido`
- `detalle_orden.id_equipo -> equipo.id_equipo` (si el detalle es de equipo)
- `detalle_orden.id_linea_detalle -> linea_servicio.id_linea_detalle` (si el detalle es línea de servicio)

- `linea_servicio.id_operador -> operador.id_operador`
- `linea_servicio.id_plan -> plan.id_plan`
- `linea_servicio.id_apn -> apn.id_apn`

- `despacho_orden.id_orden_pedido -> orden_pedido.id_orden_pedido`
- `despacho_orden.id_tipo_despacho -> tipo_despacho.id_tipo_despacho`
- `despacho_orden.id_transportadora -> transportadora.id_transportadora`
- `despacho_orden.id_direccion -> direccion_despacho.id_direccion`
- `despacho_orden.id_contacto -> contacto_despacho.id_contacto`

- `direccion_despacho.id_cliente -> cliente.id_cliente` (según RPC `upsert_comercial_tab`)
- `contacto_despacho.id_direccion -> direccion_despacho.id_direccion` (según RPC)

- `factura.id_orden_pedido -> orden_pedido.id_orden_pedido`
- `remision.id_orden_pedido -> orden_pedido.id_orden_pedido`

- `historial_orden.id_orden_pedido -> orden_pedido.id_orden_pedido`
- `historial_orden.actor_user_id -> profiles.user_id` (usado para resolver nombre)

- `responsable_orden.id_orden_pedido -> orden_pedido.id_orden_pedido`
- `responsable_orden.user_id -> profiles.user_id`

## 5) Tablas de negocio (qué son y para qué sirven)

> Nota: el schema completo (DDL) no está versionado en `supabase/migrations` en este repo; esta sección combina lo documentado en `docs/TECHNICAL_SPECIFICATION.md`, `ANALISIS_RLS_POLICIES_2025-01-19.md` y el uso real en el frontend.

### 5.1 `orden_pedido`

- **Propósito**: entidad central; representa una orden que se mueve por fases y estatus.
- **Campos usados en UI** (según `useOrderSummary`, tabs y documentación):
  - Identificadores: `id_orden_pedido`, `consecutivo`, `consecutivo_code`
  - Workflow: `fase`, `estatus`
  - Auditoría: `created_by`, `fecha_creacion`, `fecha_modificacion`
  - Comercial/finanzas: `observaciones_orden`, `orden_compra`, `id_tipo_pago`, `pago_flete`, `medio_pago`, `estado_validacion_pago`, `observaciones_financieras`
  - Asignación: `id_ingeniero_asignado` (se hace join con `profiles`)

### 5.2 `detalle_orden`

- **Propósito**: líneas de la orden. Se reutiliza para equipos y para líneas de servicio.
- **Patrón**:
  - Si `id_equipo` está presente ⇒ es un detalle de equipo.
  - Si `id_linea_detalle` está presente ⇒ es un detalle de servicio (refiere a `linea_servicio`).
- **Campos usados**:
  - `id_orden_detalle`, `id_orden_pedido`, `id_equipo`, `id_linea_detalle`, `cantidad`, `valor_unitario`, `tipo_producto`, `plantilla`

### 5.3 `linea_servicio`

- **Propósito**: entidad “servicio” que luego se vincula como detalle a la orden.
- **Campos usados**:
  - `id_linea_detalle`, `id_operador`, `id_plan`, `id_apn`, `clase_cobro`, `permanencia`, `cantidad_linea`

### 5.4 `despacho_orden`

- **Propósito**: información logística de despacho/entrega.
- **Campos usados**:
  - `id_despacho_orden`, `id_orden_pedido`, `id_tipo_despacho`, `id_transportadora`
  - `numero_guia`, `fecha_despacho`, `fecha_entrega_cliente`
  - `valor_servicio_flete`, `observaciones`, `observaciones_proceso`
  - `id_direccion`, `id_contacto`

### 5.5 `factura`

- **Propósito**: facturación de la orden. Se maneja por tipo de factura: `equipos` | `servicio` | `flete`.
- **Campos usados** (según `FacturacionTab.tsx` y `useOrderSummary.ts`):
  - `id_factura`, `id_orden_pedido`, `tipo_factura`, `numero_factura`, `fecha_factura`
  - `moneda_base` (COP/USD), `trm_aplicada`, `fecha_trm`
  - `estado_factura` (aparece en summary)

### 5.6 `remision`

- **Propósito**: documento de remisión asociado al despacho (fase logística).
- **Campos usados**:
  - `id_remision`, `id_orden_pedido`, `numero_remision`, `fecha_remision`, `estado_remision`.

### 5.7 `historial_orden`

- **Propósito**: auditoría del workflow (acciones y cambios de fase/estatus).
- **Campos usados** (según `useOrderSummary.ts` y `pages/HistorialOrdenes.tsx`):
  - `id_historial`, `id_orden_pedido`, `accion_clave`, `fase_anterior`, `fase_nueva`, `estatus_nuevo`
  - `observaciones`, `timestamp_accion`, `actor_user_id` (y `actor_nombre` se resuelve via `profiles`).

### 5.8 `responsable_orden`

- **Propósito**: asigna usuarios responsables a una orden (p.ej. ingeniero asignado u otros roles).
- **Campos usados**:
  - `id_orden_pedido`, `user_id`, `role`.

### 5.9 `profiles`

- **Propósito**: perfil de usuario de la app (complementa `auth.users`).
- **Campos usados**:
  - `user_id` (UUID), `nombre`, `username`, `role`, `created_at`.
- **Automatización**:
  - Trigger `handle_new_user()` (migración `20250916215338...`) crea un perfil cuando se crea un usuario en auth.

## 6) Catálogos (tablas maestras)

Se consumen principalmente vía `src/hooks/queries/useCatalogQueries.ts` y en tabs.

- `cliente`
  - **Uso**: selector de cliente y resumen de orden.
  - **Índices**: trigram para búsquedas (migración `20260123_add_cliente_search_index.sql`).

- `proyecto` (normalmente ligado a `cliente`)
  - **Uso**: selector de proyecto dependiente de cliente.

- `equipo`
  - **Uso**: selector/búsqueda de equipos, detalle de orden.
  - **Índices**: trigram + índice por código (migración `20260122_add_equipo_search_index.sql`).

- `operador`, `plan`, `apn`
  - **Uso**: construcción de líneas de servicio.

- `transportadora`, `tipo_despacho`
  - **Uso**: despacho/logística.

- `tipo_pago`
  - **Uso**: tab financiera y condiciones de pago.

- `clase_orden`, `tipo_servicio`
  - **Uso**: clasificar orden (resumen y tab comercial).

## 7) Enums (tipos Postgres) relevantes

El frontend referencia estos enums via `Database["public"]["Enums"]`:

- `app_role`
  - Roles: `admin`, `comercial`, `inventarios`, `produccion`, `logistica`, `facturacion`, `financiera`.

- `clase_cobro`
  - Usado en `linea_servicio` (y en la RPC para casteo: `(v_servicio->>'clase_cobro')::clase_cobro`).

- `pago_flete_enum`
  - Usado en `orden_pedido.pago_flete` (casteo en RPC: `...::pago_flete_enum`).

- `fase_orden_enum`, `estatus_orden_enum`
  - Usados en el workflow (Kanban / avance de fases).

## 8) Seguridad (RLS) y RBAC

### 8.1 Tablas RBAC

Definidas en migración `supabase/migrations/20250916215314_a40bed7e-...sql`:

- `permission`
  - `perm_code` (PK), `category`, `description`, `created_at`.

- `role_permissions`
  - PK compuesta (`role`, `perm_code`), `allowed`, `updated_at`.
  - FK: `perm_code -> permission.perm_code`.

- `rbac_event`
  - Auditoría de cambios de permisos.
  - `actor` referencia `auth.users(id)`.

### 8.2 Funciones de seguridad

En migraciones (ver `20250916215314...` y `20250916215338...`):

- `is_admin()`
- `has_role(r app_role)`
- `has_permission(perm_code text)`
- `auth_uid()`
- `can_update_orden(op_id integer)`
- `can_move_fase(op_id integer, to_fase fase_orden_enum)`
- `can_change_estatus(op_id integer, new_estatus estatus_orden_enum)`

### 8.3 Observaciones del análisis de RLS

Ver `ANALISIS_RLS_POLICIES_2025-01-19.md`.

Puntos importantes (para agentes):

- Se detectan riesgos por políticas faltantes en tablas críticas como `despacho_orden`, `remision`, `responsable_orden` (según análisis), lo cual puede impactar funcionalidades por rol.
- Hay una mención de **SELECT duplicado** en `orden_pedido` que podría bloquear accesos válidos.

## 9) RPCs (Postgres Functions) usadas por el frontend

### 9.1 `upsert_comercial_tab`

- **Archivo**: `supabase/migrations/upsert_comercial_tab.sql`
- **Uso en frontend**: `src/hooks/comercial/useComercialSave.ts` (`supabase.rpc("upsert_comercial_tab", ...)`).
- **Propósito**: Guardar de forma atómica el contenido del tab comercial:
  - Update de `orden_pedido`
  - Upsert/insert de `despacho_orden`
  - Insert en `responsable_orden`
  - Upsert/insert de `detalle_orden` (equipos)
  - Upsert/insert de `linea_servicio` + `detalle_orden` (servicios)
  - Eliminación de ítems marcados
  - Manejo especial: si `tipo_despacho.requiere_direccion = false`, asigna dirección “Bismark” (constante `id_direccion = 20`).

## 10) Edge Functions (Supabase Functions)

### 10.1 `admin-permissions`

- **Path**: `supabase/functions/admin-permissions/index.ts`
- **Uso en frontend**: `src/hooks/usePermissions.ts` (`supabase.functions.invoke('admin-permissions')`).
- **Operaciones**:
  - `GET`: devuelve `permission` y `role_permissions`.
  - `PUT`: upsert de `role_permissions` + insert de auditoría en `rbac_event`.
- **Seguridad**:
  - Valida JWT del usuario y revisa que `profiles.role = 'admin'`.
  - Usa `SUPABASE_SERVICE_ROLE_KEY` para operar bypassing RLS.

### 10.2 `admin-users`

- **Path**: `supabase/functions/admin-users/index.ts`
- **Uso en frontend**: (administración de usuarios; el repo también tiene un panel en `pages/Admin.tsx`).
- **Operaciones**: `list`, `create`, `update`, `password`, `delete`.
- **Tablas/servicios**:
  - Lee/escribe `profiles`.
  - Admin de Auth (`supabaseAdmin.auth.admin.*`).

### 10.3 `sapiens-clientes`

- **Path**: `supabase/functions/sapiens-clientes/index.ts`
- **Propósito**: proxy hacia un webhook (n8n) para sincronización/acciones con clientes.
- **Variables env**:
  - `N8N_CLIENTES_SAPIENS`
  - `N8N_WEBHOOK_KEY`

## 11) Mapeo: tablas → dónde se usan en el frontend

> Referencias principales (no exhaustivas) encontradas por lectura directa.

### Orden / workflow

- `orden_pedido`
  - `src/hooks/useOrderSummary.ts`
  - `src/components/modals/tabs/ComercialTab.tsx`
  - `src/components/modals/tabs/InventariosTab.tsx`
  - `src/components/modals/tabs/FinancieraTab.tsx`
  - `src/components/modals/tabs/FacturacionTab.tsx`
  - `src/components/modals/tabs/LogisticaTab.tsx`
  - `src/hooks/useDashboardStats.ts`
  - `pages/HistorialOrdenes.tsx`

- `historial_orden`
  - `src/hooks/useOrderSummary.ts`
  - `pages/HistorialOrdenes.tsx`

- `responsable_orden`
  - `src/hooks/useOrderSummary.ts`
  - `src/components/modals/tabs/ComercialTab.tsx` (join con `profiles`)

- `profiles`
  - `src/contexts/AuthContext.tsx` (fetch de perfil por `user_id`)
  - `src/hooks/useOrderSummary.ts` (resolve nombres)
  - `supabase/functions/admin-users/index.ts`
  - `supabase/functions/admin-permissions/index.ts`

### Comercial: detalles y servicios

- `detalle_orden`
  - `src/hooks/useOrderSummary.ts`
  - `src/hooks/comercial/useComercialData.ts`
  - `supabase/migrations/upsert_comercial_tab.sql`

- `linea_servicio`
  - `src/hooks/useOrderSummary.ts`
  - `src/hooks/comercial/useComercialData.ts`
  - `src/components/modals/tabs/InventariosTab.tsx` (join con catálogos)
  - `supabase/migrations/upsert_comercial_tab.sql`

### Logística / docs

- `despacho_orden`
  - `src/hooks/useOrderSummary.ts`
  - `src/components/modals/tabs/ComercialTab.tsx` (lectura con joins)
  - `src/components/modals/tabs/LogisticaTab.tsx` (insert/update)
  - `supabase/migrations/upsert_comercial_tab.sql` (upsert)

- `remision`
  - `src/hooks/useOrderSummary.ts`
  - `src/components/modals/tabs/LogisticaTab.tsx`

### Facturación

- `factura`
  - `src/hooks/useOrderSummary.ts`
  - `src/components/modals/tabs/FacturacionTab.tsx`

### Catálogos

- `cliente`, `proyecto`, `operador`, `plan`, `apn`, `tipo_despacho`, `transportadora`, `tipo_pago`
  - `src/hooks/queries/useCatalogQueries.ts`
  - `src/hooks/comercial/useComercialData.ts`
  - Tabs correspondientes (Comercial/Financiera/Logística)

## 12) Regeneración de tipos (Database) y sanity checks

Como `src/integrations/supabase/types.ts` no es legible en este repo (posible corrupción), se recomienda regenerarlo desde Supabase.

Opciones típicas:

- **Supabase CLI** (local): generar `Database` a partir del schema remoto.
- **Supabase Dashboard**: usar la herramienta de "Types"/"Generate types" y reemplazar el archivo.

Checklist al regenerar:

- Asegurar que incluya:
  - `public.Tables.*` para todas las tablas usadas (`orden_pedido`, `detalle_orden`, `linea_servicio`, etc.).
  - `public.Enums.*` para `app_role`, `clase_cobro`, `pago_flete_enum`, `fase_orden_enum`, `estatus_orden_enum`.
- Verificar que los nombres de tablas en código coincidan exactamente (`clase_orden` vs `claseorden`, `tipo_pago` vs `tipopago`, etc.).

## 13) Notas y limitaciones de esta referencia

- El repo no incluye el DDL completo (CREATE TABLE …) de las tablas principales dentro de `supabase/migrations`. Por eso:
  - Las columnas listadas son las observadas en el frontend + documentación interna.
  - Las relaciones se deducen de `.select(... joins ...)`, de la documentación técnica y de la RPC.
- Para una referencia 100% authoritative, exportar el schema desde Supabase (o versionarlo en migraciones) y regenerar types.
