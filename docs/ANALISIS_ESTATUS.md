# Análisis del Sistema de Estatus de Órdenes

## Estado Actual del Sistema

### Estatus Disponibles (según base de datos)
```typescript
type EstatusOrdenDB =
  | "borrador"   // Orden en edición inicial
  | "abierta"    // Orden activa en proceso
  | "enviada"    // Orden enviada/en tránsito
  | "facturada"  // Orden facturada
  | "cerrada"    // Orden completada y cerrada
  | "anulada"    // Orden cancelada
```

### Fases del Kanban
```typescript
type FaseOrdenDB =
  | "comercial"
  | "inventarios"
  | "produccion"
  | "financiera"
  | "facturacion"
  | "logistica"
```

## Problema Identificado

### 1. **Órdenes cerradas aparecen en el Kanban**
- Actualmente, el KanbanBoard muestra TODAS las órdenes independientemente de su estatus
- Línea 147 de KanbanBoard.tsx: `orders: filtered.filter((o) => o.fase === UI_TO_FASE[col.id])`
- Solo filtra por fase, no por estatus
- Resultado: Órdenes cerradas/anuladas siguen apareciendo en sus columnas

### 2. **Los badges usan el estatus correctamente**
- OrderCard.tsx línea 33: `const statusConfig = estatusBadge[order.estatus]`
- ✅ Esto SÍ funciona correctamente
- Los badges SÍ muestran el estatus real de la orden

### 3. **El filtro de estatus existe pero es externo**
- Línea 140-142 de KanbanBoard.tsx: Hay un filtro por estatus
- Este filtro se activa mediante `statusFilter` prop
- Pero no hay filtro automático para excluir órdenes cerradas/anuladas

## Propuesta de Solución

### Opción 1: Excluir automáticamente órdenes cerradas/anuladas del Kanban

**Ventajas:**
- Tablero Kanban más limpio y enfocado en trabajo activo
- Mejor rendimiento (menos órdenes que renderizar)
- Visualmente más claro para el usuario

**Implementación:**
```typescript
// En applyIntoColumns (línea 144)
const nextCols = EMPTY_COLUMNS.map((col) => ({
  ...col,
  orders: filtered.filter((o) =>
    o.fase === UI_TO_FASE[col.id] &&
    o.estatus !== 'cerrada' &&
    o.estatus !== 'anulada'
  ),
}));
```

**Dónde ver órdenes cerradas:**
- Agregar una vista separada "Historial" o "Archivo"
- O usar el filtro de estatus existente para verlas cuando sea necesario

### Opción 2: Mantener órdenes cerradas pero indicarlo visualmente

**Ventajas:**
- Mantiene visibilidad completa del historial
- Útil para referencia inmediata

**Desventajas:**
- Tablero más saturado
- Mezcla trabajo activo con completado

**Implementación:**
```typescript
// En OrderCard.tsx
// Agregar opacidad y estilo diferente para cerradas
className={cn(
  "group relative overflow-hidden border border-border/40 bg-card",
  order.estatus === 'cerrada' && "opacity-60",
  order.estatus === 'anulada' && "opacity-40 grayscale"
)}
```

## Recomendación: Opción 1 + Vista de Historial

### Implementación Recomendada:

1. **Filtrar automáticamente órdenes cerradas/anuladas del Kanban activo**
   ```typescript
   const isActiveOrder = (order: OrdenKanban) =>
     order.estatus !== 'cerrada' && order.estatus !== 'anulada';
   ```

2. **Crear una vista separada "Historial de Órdenes"**
   - Ruta: `/ordenes/historial`
   - Tabla con todas las órdenes cerradas/anuladas
   - Filtros por fecha, cliente, etc.
   - Funcionalidad de búsqueda

3. **Agregar contador en el header**
   - "X órdenes activas"
   - Link a historial: "Y órdenes archivadas"

4. **Permitir re-abrir órdenes cerradas (si admin)**
   - Agregar acción en vista de historial
   - Solo para rol admin
   - Cambiar estatus de 'cerrada' a 'abierta'

## Flujo de Estatus Recomendado

```
Creación → borrador
         ↓
    (completar datos)
         ↓
      abierta ←────────────┐
         ↓                  │
    (moverse por fases)    │
         ↓                  │
      enviada               │
         ↓                  │
      facturada             │
         ↓                  │
      cerrada ──→ (fin)     │
                            │
    anulada ───→ (fin)      │
                            │
    (re-abrir) ─────────────┘
    (solo admin)
```

## Cambios Necesarios

### 1. KanbanBoard.tsx
- Línea ~147: Agregar filtro de estatus activo
- Agregar función `isActiveOrder`

### 2. Crear nueva vista: HistorialOrdenes.tsx
- Componente de tabla con órdenes archivadas
- Filtros y búsqueda
- Acción de re-apertura (admin)

### 3. Routing
- Agregar ruta `/ordenes/historial`

### 4. Navigation
- Agregar link en sidebar o en header de Órdenes

### 5. FinancieraTab.tsx (ya implementado ✅)
- Al cerrar orden, cambiar estatus a 'cerrada'
- La orden desaparecerá automáticamente del Kanban

## Pregunta para el Usuario

¿Deseas que:
1. **Las órdenes cerradas/anuladas se oculten automáticamente del Kanban** y se cree una vista separada de "Historial"?
2. **O prefieres mantenerlas visibles** pero con indicadores visuales (opacidad, etc.)?

**Mi recomendación:** Opción 1 - Ocultar automáticamente y crear vista de historial.
