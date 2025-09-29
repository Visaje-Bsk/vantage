# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Project Architecture

### Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL database with authentication)
- **Routing**: React Router v6
- **State Management**: TanStack Query for server state, React Context for auth
- **Forms**: React Hook Form with Zod validation

### Core Structure

This is an "ordenes-pedido" (order management) application with role-based access control and a Kanban-style workflow.

#### Authentication & Authorization
- Authentication handled via Supabase Auth with `AuthContext`
- Role-based permissions with roles: `admin`, `comercial`, `inventarios`, `produccion`, `logistica`, `facturacion`, `financiera`
- Protected routes using `ProtectedRoute` component
- Admin-only sections available

#### Main Application Areas
1. **Dashboard** - Overview and metrics
2. **Ordenes** - Kanban board for order management with different workflow stages
3. **Catalogos** - Catalog management for various entities
4. **Admin** - User management and system administration (admin-only)

#### Order Management Workflow
Orders flow through stages: `comercial` → `inventarios` → `produccion` → `logistica` → `facturacion` → `financiera`

Each stage has different statuses: `borrador`, `abierta`, `enviada`, `facturada`, `cerrada`, `anulada`

Key files:
- `src/types/kanban.ts` - Order workflow types and stage mappings
- `src/components/kanban/KanbanBoard.tsx` - Main Kanban interface
- `src/components/modals/OrderModal.tsx` - Order editing modal with tabs per stage

#### Supabase Integration
- Client configured in `src/integrations/supabase/client.ts`
- Type definitions auto-generated in `src/integrations/supabase/types.ts`
- Uses Row Level Security (RLS) for permission enforcement

#### UI Components
- Uses shadcn/ui component system with path aliases configured
- Custom components in `src/components/`
- Reusable UI components in `src/components/ui/`
- Path aliases: `@/components`, `@/lib/utils`, `@/hooks`, etc.

#### Key Patterns
- Role-based component rendering using `useAuth()` hook
- Generic catalog management with `GenericAdminCatalog` and `GenericCatalogList`
- Tab-based order editing with separate components per workflow stage
- Permission checks integrated throughout the UI

### Development Notes
- The README.md file is for Supabase CLI documentation, not this project
- No existing test setup - check with user before adding tests
- Uses ESLint for code quality (run `npm run lint` before committing)