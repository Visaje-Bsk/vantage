# Análisis Completo del Flujo de Estatus de Órdenes

## Estado Actual vs Esperado

### Enums de Base de Datos

```typescript
// Estatus disponibles
type EstatusOrdenDB =
  | "borrador"   // Orden en edición inicial
  | "abierta"    // Orden activa en proceso
  | "enviada"    // Orden enviada/en tránsito
  | "facturada"  // Orden facturada
  | "cerrada"    // Orden completada y cerrada
  | "anulada"    // Orden cancelada

// Fases del Kanban
type FaseOrdenDB =
  | "comercial"
  | "inventarios"
  | "produccion"
  | "logistica"
  | "facturacion"
  | "financiera"
```

---

## Flujo Esperado (Según Requerimientos del Usuario)

```
┌────────────────────────────────────────────────────────────────────┐
│                         CREACIÓN DE ORDEN                           │
└────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   estatus: "borrador"   │
                    │   fase: "comercial"     │
                    └─────────────────────────┘
                                  │
                  Comercial diligencia datos básicos:
                  - Cliente, Proyecto
                  - Productos/Servicios
                  - Ingeniero asignado
                  - Información de despacho
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   estatus: "abierta"    │
                    │   fase: "comercial"     │
                    └─────────────────────────┘
                                  │
                    La orden AVANZA por las fases
                    (Inventarios → Producción → Logística)
                    MANTENIENDO estatus "abierta"
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   estatus: "abierta"    │
                    │   fase: "logistica"     │
                    └─────────────────────────┘
                                  │
                  Logística DESPACHA la orden
                  (registra guía, transportadora)
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   estatus: "enviada"    │
                    │   fase: "facturacion"   │
                    └─────────────────────────┘
                                  │
              Facturación emite factura
              (número, fecha, moneda, TRM)
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   estatus: "facturada"  │
                    │   fase: "financiera"    │
                    └─────────────────────────┘
                                  │
              Financiera confirma pago
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   estatus: "cerrada"    │
                    │   fase: "financiera"    │
                    └─────────────────────────┘
                                  │
              ⚠️ LA ORDEN DESAPARECE DEL KANBAN
              ✅ SE MUEVE A "HISTORIAL"
```

### Flujo de Anulación (Cualquier Momento)

```
                 ┌─────────────────────┐
                 │  CUALQUIER ESTATUS  │
                 └─────────────────────┘
                            │
                   (Admin cancela orden)
                            │
                            ▼
                 ┌─────────────────────┐
                 │  estatus: "anulada" │
                 │  fase: (se mantiene)│
                 └─────────────────────┘
                            │
          ⚠️ LA ORDEN DESAPARECE DEL KANBAN
          ✅ SE MUEVE A "HISTORIAL"
```

---

## Estado Actual del Código

### ✅ Implementado Correctamente

#### 1. **Filtrado de Órdenes Cerradas/Anuladas en el Kanban**
**Archivo:** `src/components/kanban/KanbanBoard.tsx` (línea ~144)

```typescript
// Función para filtrar solo órdenes activas
const isActiveOrder = (order: OrdenKanban): boolean => {
  return order.estatus !== 'cerrada' && order.estatus !== 'anulada';
};

const applyIntoColumns = (allOrders: OrdenKanban[]) => {
  // Filter only active orders
  const activeOrders = allOrders.filter(isActiveOrder);
  // ... resto del código
};
```

**Estado:** ✅ Completo - Las órdenes cerradas/anuladas NO aparecen en el Kanban

#### 2. **Vista de Historial**
**Archivo:** `src/pages/HistorialOrdenes.tsx`

- ✅ Tabla completa de órdenes archivadas
- ✅ Filtros por estatus (cerrada/anulada)
- ✅ Búsqueda por consecutivo/cliente
- ✅ Acción de re-apertura (admin only)
- ✅ Ruta `/ordenes/historial` configurada
- ✅ Link en sidebar

#### 3. **Cierre de Orden en Financiera**
**Archivo:** `src/components/modals/tabs/FinancieraTab.tsx` (línea 116-159)

```typescript
const handleConfirmCerrarOrden = async () => {
  await supabase
    .from('orden_pedido')
    .update({
      estatus: 'cerrada',  // ✅ Cambia estatus a cerrada
      // ...
    })
    .eq('id_orden_pedido', order.id_orden_pedido);

  onUpdateOrder(order.id_orden_pedido, {
    estatus: 'cerrada',
  });

  setShowSuccessModal(true);  // ✅ Modal profesional
};
```

**Estado:** ✅ Completo - Financiera cierra la orden correctamente

---

### ❌ NO Implementado / Necesita Corrección

#### 1. **Creación de Orden en Estatus "borrador"**
**Archivo:** `src/components/kanban/NuevaOrdenModal.tsx` (línea 285-289)

```typescript
const { data: order, error: orderError } = await supabase
  .from('orden_pedido')
  .insert(ordenData)  // ❌ NO especifica estatus ni fase
  .select('id_orden_pedido')
  .single();
```

**Problema:** Al crear la orden, NO se especifica:
- `estatus`: Debería ser `"borrador"`
- `fase`: Debería ser `"comercial"`

**Consecuencia:** La base de datos usa valores por defecto (probablemente NULL o el definido en el schema)

**Solución:** Agregar campos explícitos:
```typescript
const ordenData = {
  // ... campos existentes
  estatus: 'borrador',
  fase: 'comercial',
};
```

---

#### 2. **Cambio de Estatus borrador → abierta en ComercialTab**
**Archivo:** `src/components/modals/tabs/ComercialTab.tsx`

**Problema:** Cuando el comercial guarda los datos básicos (cliente, proyecto, productos, ingeniero), NO se cambia el estatus de `"borrador"` a `"abierta"`.

**Código Actual (línea 466-514):**
```typescript
const handleSave = async () => {
  // Validaciones...

  const result = await saveComercialData({
    formData: form.formData,
    productLines: products.productLines,
    serviceLines: services.serviceLines,
    despachoForm: despacho.despachoForm,
    selectedResponsable: responsable.selectedResponsable,
    selectedResponsableRole: selectedRole,
    deletedEquipoIds: products.deletedEquipoIds,
    deletedServicioIds: services.deletedServiceIds,
  });

  // ❌ NO hay cambio de estatus
};
```

**Solución:** Detectar cuando se completan los campos obligatorios y cambiar estatus a `"abierta"`:
```typescript
// Validar si los datos básicos están completos
const isOrderComplete =
  form.formData.id_cliente &&
  responsable.selectedResponsable &&
  products.productLines.some(line => line.selectedEquipo);

if (isOrderComplete && order.estatus === 'borrador') {
  await supabase
    .from('orden_pedido')
    .update({ estatus: 'abierta' })
    .eq('id_orden_pedido', order.id_orden_pedido);
}
```

---

#### 3. **Cambio de Estatus abierta → enviada en LogisticaTab**
**Archivo:** `src/components/modals/tabs/LogisticaTab.tsx` (línea 161-213)

**Problema:** Cuando logística despacha la orden, NO se cambia el estatus a `"enviada"`.

**Código Actual:**
```typescript
const handleAvanzarFacturacion = async () => {
  // ... validaciones

  // Avanzar fase
  const { error } = await supabase
    .from('orden_pedido')
    .update({
      fase: 'facturacion',  // ✅ Cambia fase
      // ❌ NO cambia estatus a "enviada"
      fecha_modificacion: new Date().toISOString(),
    })
    .eq('id_orden_pedido', order.id_orden_pedido);

  onUpdateOrder(order.id_orden_pedido, { fase: 'facturacion' });
  // ❌ NO actualiza estatus local
};
```

**Solución:** Agregar cambio de estatus:
```typescript
await supabase
  .from('orden_pedido')
  .update({
    fase: 'facturacion',
    estatus: 'enviada',  // ✅ AGREGAR
    fecha_modificacion: new Date().toISOString(),
  })
  .eq('id_orden_pedido', order.id_orden_pedido);

onUpdateOrder(order.id_orden_pedido, {
  fase: 'facturacion',
  estatus: 'enviada'  // ✅ AGREGAR
});
```

---

#### 4. **Cambio de Estatus enviada → facturada en FacturacionTab**
**Archivo:** `src/components/modals/tabs/FacturacionTab.tsx` (línea 124-176)

**Problema:** Cuando facturación emite la factura, NO se cambia el estatus a `"facturada"`.

**Código Actual:**
```typescript
const handleAvanzarFinanciera = async () => {
  // ... guardar factura

  // Avanzar fase
  const { error } = await supabase
    .from('orden_pedido')
    .update({
      fase: 'financiera',  // ✅ Cambia fase
      // ❌ NO cambia estatus a "facturada"
      fecha_modificacion: new Date().toISOString(),
    })
    .eq('id_orden_pedido', order.id_orden_pedido);

  onUpdateOrder(order.id_orden_pedido, { fase: 'financiera' });
  // ❌ NO actualiza estatus local
};
```

**Solución:** Agregar cambio de estatus:
```typescript
await supabase
  .from('orden_pedido')
  .update({
    fase: 'financiera',
    estatus: 'facturada',  // ✅ AGREGAR
    fecha_modificacion: new Date().toISOString(),
  })
  .eq('id_orden_pedido', order.id_orden_pedido);

onUpdateOrder(order.id_orden_pedido, {
  fase: 'financiera',
  estatus: 'facturada'  // ✅ AGREGAR
});
```

---

#### 5. **Funcionalidad de Anular Orden (Admin)**
**Estado:** ❌ NO Implementado

**Ubicación Sugerida:** OrderModal.tsx o un botón en la tarjeta de orden

**Requerimientos:**
- Solo visible para rol `admin`
- Modal de confirmación con razón de anulación
- Cambiar `estatus` a `"anulada"` (mantener fase actual)
- Registrar en historial
- La orden desaparece del Kanban automáticamente

**Implementación Sugerida:**
```typescript
// En OrderModal.tsx
const handleAnularOrden = async (razon: string) => {
  if (profile?.role !== 'admin') return;

  await supabase
    .from('orden_pedido')
    .update({ estatus: 'anulada' })
    .eq('id_orden_pedido', order.id_orden_pedido);

  await supabase.from('historial_orden').insert({
    id_orden_pedido: order.id_orden_pedido,
    accion_clave: 'orden_anulada',
    fase_anterior: order.fase,
    fase_nueva: order.fase,
    observaciones: `Orden anulada por admin. Razón: ${razon}`,
  });

  onUpdateOrder(order.id_orden_pedido, { estatus: 'anulada' });
  onClose();
};
```

---

## Cambios Necesarios - Resumen

### Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `NuevaOrdenModal.tsx` | Agregar `estatus: 'borrador'` y `fase: 'comercial'` al crear orden | 🔴 Alta |
| `ComercialTab.tsx` | Cambiar estatus a `'abierta'` cuando se completan datos básicos | 🔴 Alta |
| `LogisticaTab.tsx` | Cambiar estatus a `'enviada'` al avanzar a Facturación | 🔴 Alta |
| `FacturacionTab.tsx` | Cambiar estatus a `'facturada'` al avanzar a Financiera | 🔴 Alta |
| `OrderModal.tsx` | Agregar botón "Anular Orden" (admin only) | 🟡 Media |
| `Ordenes.tsx` | Agregar contador de órdenes activas | 🟢 Baja |
| `HistorialOrdenes.tsx` | Agregar contador de órdenes archivadas | 🟢 Baja |

---

## Validación del Flujo Completo

### Escenario de Prueba

1. ✅ **Crear orden** → `estatus: "borrador"`, `fase: "comercial"`
2. ✅ **Diligenciar datos básicos** → `estatus: "abierta"`, `fase: "comercial"`
3. ✅ **Avanzar por fases** (Inventarios, Producción) → `estatus: "abierta"`, `fase: cambia`
4. ✅ **Logística despacha** → `estatus: "enviada"`, `fase: "facturacion"`
5. ✅ **Facturación emite** → `estatus: "facturada"`, `fase: "financiera"`
6. ✅ **Financiera confirma pago** → `estatus: "cerrada"`, `fase: "financiera"`
7. ✅ **Orden desaparece del Kanban** → Automático (filtro ya implementado)
8. ✅ **Orden visible en Historial** → Ya implementado

### Escenario de Anulación

1. ✅ **Admin anula orden** → `estatus: "anulada"`, `fase: (mantiene actual)`
2. ✅ **Orden desaparece del Kanban** → Automático (filtro ya implementado)
3. ✅ **Orden visible en Historial** → Ya implementado

---

## Notas Técnicas

### Fase vs Estatus - Diferencia Conceptual

- **`fase`**: Representa el **departamento/área** responsable actualmente
  - Se actualiza cuando la orden **avanza** entre áreas
  - Ejemplos: `"comercial"` → `"inventarios"` → `"produccion"` → etc.

- **`estatus`**: Representa el **estado del ciclo de vida** de la orden
  - Se actualiza en **hitos clave** del proceso
  - Ejemplos: `"borrador"` → `"abierta"` → `"enviada"` → `"facturada"` → `"cerrada"`

### Transiciones Válidas

```
ESTATUS:     borrador → abierta → enviada → facturada → cerrada
FASE:        comercial → inventarios → produccion → logistica → facturacion → financiera

Relación:
- borrador    : fase = comercial
- abierta     : fase = comercial → produccion (varía)
- enviada     : fase = facturacion
- facturada   : fase = financiera
- cerrada     : fase = financiera
- anulada     : fase = (cualquiera)
```

---

## Próximos Pasos

1. **Implementar cambios de estatus en orden de prioridad:**
   - [ ] NuevaOrdenModal: Crear con `borrador` y `comercial`
   - [ ] ComercialTab: Cambiar a `abierta` al completar datos
   - [ ] LogisticaTab: Cambiar a `enviada` al despachar
   - [ ] FacturacionTab: Cambiar a `facturada` al facturar
   - [ ] OrderModal: Agregar funcionalidad de anulación

2. **Agregar mejoras visuales:**
   - [ ] Contadores de órdenes activas/archivadas
   - [ ] Animaciones de transición de estatus

3. **Testing:**
   - [ ] Crear orden desde cero y validar flujo completo
   - [ ] Probar anulación en diferentes fases
   - [ ] Verificar que órdenes cerradas/anuladas desaparecen del Kanban
   - [ ] Verificar que reapertura funciona correctamente
