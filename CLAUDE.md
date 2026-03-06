# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **order management ERP system** (ordenes-pedido) built with React, TypeScript, Vite, and Supabase. The application manages orders through a Kanban-style workflow with role-based access control and integrates with external SAPIENS database for client synchronization.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Shadcn/UI components with Radix UI primitives, Tailwind CSS
- **Backend**: Supabase (self-hosted at `http://10.10.1.81:4352`)
- **State Management**: React Query (TanStack Query) for server state, React Context for auth
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **External Integration**: SQL Server SAPIENS database for client data sync

## Development Commands

```bash
# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development mode (includes component tagging)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Supabase Commands

```bash
# Generate TypeScript types from database schema
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# Run migrations on remote database
npx supabase db remote commit
```

## Architecture

### Authentication System

The app uses a **username-based authentication** system that internally converts to email format for Supabase Auth:
- Usernames are converted to `username@erp.local` format (see `src/lib/auth-utils.ts`)
- Username format: lowercase alphanumeric with `.`, `_`, `-` (3-32 chars)
- Session persists in localStorage with auto-refresh enabled

### Role-Based Access Control (RBAC)

The system implements a comprehensive permission system with 8 roles:

**Roles**: `admin`, `comercial`, `inventarios`, `produccion`, `logistica`, `facturacion`, `financiera`, `ingenieria`

- Admin has all permissions and can access `/admin` routes
- Each role corresponds to a phase in the order workflow
- Permissions are enforced both in UI (via `usePermission` hook) and database (via RLS policies)
- Permissions are managed through Supabase Edge Functions (`admin-permissions`, `admin-users`)

### Order Workflow (Kanban)

Orders flow through **6 sequential phases** matching the role structure:

1. **Comercial** → 2. **Inventarios** → 3. **Producción** → 4. **Financiera** → 5. **Facturación** → 6. **Logística**

**Order lifecycle** (estatus field):
- `borrador` → `abierta` → `enviada` → `facturada` → `cerrada` (or `anulada`)

Key concepts:
- **fase**: The current workflow phase (which department/role owns the order)
- **estatus**: The lifecycle status of the order (independent of phase)
- Orders can only be edited by users with the role matching the current phase (enforced by RLS)
- Phase transitions are controlled by moving orders between Kanban columns
- See `src/types/kanban.ts` for complete type definitions and mappings

### Data Flow

**Catalog Data (React Query)**:
- All catalog tables (clientes, proyectos, equipos, etc.) are cached via React Query
- Cache TTL: 5 minutes (defined in `src/hooks/queries/useCatalogQueries.ts`)
- Catalogs are prefetched on login (see `AuthContext.tsx`)
- Centralized query keys in `catalogKeys` object for easy invalidation

**Order Data**:
- Orders are fetched per-phase with RLS filtering by role
- Real-time updates via Supabase subscriptions in `KanbanBoard.tsx`
- Order details include joined data from catalogs (cliente, proyecto, equipo, etc.)

**Edge Functions**:
- `admin-users`: CRUD operations for user management (admin only)
- `admin-permissions`: Permission matrix management (admin only)
- `sapiens-clientes`: Syncs client data from external SQL Server database

### Component Structure

```
src/
├── components/
│   ├── admin/              # Admin-only components (user mgmt, catalogs, permissions)
│   ├── auth/               # ProtectedRoute wrapper
│   ├── kanban/             # Kanban board, columns, cards, filters
│   ├── catalogs/           # Catalog management (CRUD forms, selectors)
│   ├── comercial/          # Product/service line items
│   ├── modals/             # Order creation/edit modals, summaries
│   ├── layout/             # Headers, sidebar
│   ├── dataGates/          # Data validation alerts
│   └── ui/                 # Shadcn UI components
├── contexts/
│   └── AuthContext.tsx     # Auth provider with role checking
├── hooks/
│   ├── queries/            # React Query hooks for catalogs
│   ├── usePermissions.ts   # Permission checking hook
│   └── useDataGateValidation.ts  # Order validation logic
├── integrations/supabase/
│   ├── client.ts           # Supabase client config
│   └── types.ts            # Generated DB types (DO NOT EDIT MANUALLY)
├── lib/
│   ├── auth-utils.ts       # Username ↔ email conversion
│   └── utils.ts            # Tailwind cn() helper
├── pages/                  # Route pages
└── types/
    ├── kanban.ts           # Order workflow types and mappings
    └── dataGates.ts        # Validation rule types
```

### Database

The database uses Supabase PostgreSQL with:
- **Row Level Security (RLS)** enabled on all tables
- Policies enforce role-based read/write access
- Schema migrations in `supabase/migrations/`
- Self-hosted instance at `http://10.10.1.81:4352`

Key tables:
- `orden_pedido`: Main orders table with `fase` and `estatus` columns
- `detalle_orden`: Order line items (productos/servicios)
- `profiles`: User profiles with role assignments
- `permissions` / `role_permissions`: RBAC permission matrix
- Catalog tables: `cliente`, `proyecto`, `equipo`, `operador`, `plan`, `apn`, `tipo_despacho`, etc.

### Path Aliases

TypeScript path alias `@/*` maps to `./src/*` (configured in `tsconfig.json` and `vite.config.ts`)

## Important Conventions

### TypeScript Configuration
- `noImplicitAny: false` - Implicit any is allowed
- `strictNullChecks: false` - Null checks are relaxed
- `skipLibCheck: true` - Skip type checking of declaration files
- Use explicit types when clarity is needed, but implicit any is acceptable

### Code Style
- Use functional components with hooks
- Prefer `const` arrow functions for components
- Use React Query for all server state
- Use React Hook Form + Zod for form validation
- Keep business logic in custom hooks
- Component files use `.tsx` extension, utility files use `.ts`

### Database Type Safety
- Always regenerate types after schema changes using the Supabase gen command
- Import types from `@/integrations/supabase/types` (Database type)
- Never edit `types.ts` manually - it's auto-generated

### Permission Checking
- Use `usePermission(permCode)` hook to check permissions in components
- Use `isAdmin()` or `hasRole(role)` from `useAuth()` for role checks
- Admin role bypasses all permission checks

### Order Editing
- Check `fase` field to determine which role can edit
- Respect terminal statuses (`cerrada`, `anulada`) - block edits in UI
- Use Data Gates validation before allowing phase transitions

## External Integration

**SAPIENS Database Sync**:
- SQL Server instance at `10.10.12.5:1433`
- Database: `Bismark_sql`
- Sync triggered via "Sincronizar Clientes" button in UI
- Edge function `sapiens-clientes` handles the sync via Deno
- Credentials stored in `.env` (SAPIENS_DB_*)

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=http://10.10.1.81:4352
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
SAPIENS_DB_USER=<username>
SAPIENS_DB_PASSWORD=<password>
SAPIENS_DB_HOST=<host>
SAPIENS_DB_PORT=<port>
SAPIENS_DB_NAME=<database>
```

## Common Tasks

### Adding a New Catalog Table
1. Create migration in `supabase/migrations/`
2. Add RLS policies for role-based access
3. Run migration on remote: `npx supabase db remote commit`
4. Regenerate types: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`
5. Add query hook in `src/hooks/queries/useCatalogQueries.ts`
6. Create catalog component in `src/components/admin/catalogs/`
7. Add to `CatalogManagement.tsx` or `Catalogos.tsx` page

### Adding a New Permission
1. Insert into `permissions` table via migration
2. Assign default role permissions in `role_permissions` table
3. Use `usePermission('new_perm_code')` hook in components
4. Update UI to show/hide features based on permission

### Modifying Order Workflow
1. Update `fase_orden_enum` or `estatus_orden_enum` in migrations
2. Update `src/types/kanban.ts` mappings (`UI_TO_FASE`, `STAGE_UI`, etc.)
3. Update RLS policies if needed for new phases
4. Regenerate types
5. Update Kanban components to reflect new columns/statuses

### Testing Order Permissions
- Log in as different roles to test RLS policies
- Orders should only be editable by the role matching the current `fase`
- Admin should see and edit all orders regardless of phase
- Use browser dev tools to verify Supabase RLS is blocking unauthorized access
