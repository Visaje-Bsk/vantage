# Arquitectura del Proyecto

## Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Estado**: React Query (TanStack Query) para caché de catálogos
- **Routing**: React Router

## Estructura de carpetas clave

```
src/
  components/
    kanban/           → KanbanBoard, KanbanColumn, OrderCard
    modals/
      OrderModal.tsx  → Modal principal de orden (tabs + avance de fase)
      tabs/           → Tab por fase: VentasTab, InventariosTab, ProduccionTab, etc.
    catalogs/         → SyncClientesButton, etc.
    ui/               → shadcn/ui components
  contexts/
    AuthContext.tsx   → useAuth(), user, profile, hasRole(), isAdmin()
  hooks/
    queries/          → React Query hooks para catálogos
  integrations/
    supabase/
      client.ts       → createClient con import.meta.env
      types.ts        → tipos generados de la BD (Database, Tables, etc.)
  pages/
    Ordenes.tsx       → Página principal con KanbanBoard
  types/
    kanban.ts         → OrdenKanban (tipo principal de orden)
```

## Tablas principales en Supabase

| Tabla | Descripción |
|---|---|
| `orden_pedido` | Tabla central. Tiene `fase` (enum de fases del kanban) |
| `orden_produccion` | Datos específicos de la fase producción |
| `responsable_orden` | Multi-usuario por orden/fase (`user_id`, `role`, `id_orden_pedido`) |
| `profiles` | Perfiles de usuario con `role` (AppRole) |
| `detalle_orden` | Ítems/productos de cada orden |
| `equipo` | Catálogo de equipos |
| `cliente` | Catálogo de clientes (sincronizado desde Sapiens vía Edge Function) |

## Roles de usuario (AppRole)

`admin` | `comercial` | `inventarios` | `produccion` | `logistica` | `facturacion` | `financiera` | `ingenieria`

## Fases del Kanban (columnas)

El campo `orden_pedido.fase` avanza linealmente entre fases definidas como enum en PostgreSQL.

## Edge Functions

| Función | Descripción |
|---|---|
| `sapiens-clientes` | Proxy a webhook n8n para sincronizar catálogo de clientes desde Sapiens ERP |
| `admin-users` | CRUD de usuarios (solo admin) |
| `admin-permissions` | Gestión de roles/permisos RBAC |

### Invocar edge function desde frontend

```typescript
const { data, error } = await supabase.functions.invoke("sapiens-clientes");
```

## Patrones importantes

### Tab con forwardRef + save handle

Todos los tabs del OrderModal usan este patrón para que el modal pueda llamar `tab.save()`:

```typescript
export const MiTab = forwardRef<TabSaveHandle, Props>(function MiTab({ ... }, ref) {
  const handleSave = async () => { ... };
  useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);
  ...
});
```

### Dirty detection

Los tabs notifican al modal cuando hay cambios sin guardar via `onDirtyChange(isDirty)`.

### RLS policies — IMPORTANTE

Hay un ciclo de recursión que fue corregido:
- `responsable_orden` SELECT policy: solo `user_id = auth.uid() OR is_admin()` — NO hacer subquery a `orden_pedido`
- `profiles` SELECT policy: `auth.uid() IS NOT NULL` — NO usar `is_admin()` dentro de la policy de profiles
- `is_admin()` es SECURITY DEFINER → seguro usar en otras políticas

## Comandos útiles

```bash
npm run dev          # desarrollo local (ldkjcvuahfyxgnbyitqm)
npm run build        # build producción (coyyavooqplsywtxelou → servidor Ubuntu)
npm run build:dev    # build apuntando a BD de desarrollo
npx serve dist       # probar el build localmente antes de subir al servidor
```
