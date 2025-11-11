Este es el resumen estructurado en formato Markdown, listo para ser pasado a Claude Code como contexto de trabajo. Este documento consolida la arquitectura, el flujo Kanban, y los requisitos de datos (Data Gates) confirmados para cada fase.

```markdown
# CONTEXTO DE DESARROLLO: Sistema de Gestión de Órdenes (Kanban)

## I. ARQUITECTURA TÉCNICA Y ESTRUCTURA

El objetivo principal de esta aplicación es ser un **sistema de registro de flujo** diseñado para **reemplazar el formato de Excel actual**, transformando su flexibilidad en **validación estricta y trazabilidad**.

### Stack Tecnológico
| Componente | Tecnología |
| :--- | :--- |
| **Frontend Framework** | React 18 con TypeScript |
| **Herramienta de Construcción** | Vite |
| **UI Framework** | Tailwind CSS + **shadcn/ui components** |
| **Backend/Base de Datos** | **Supabase** (PostgreSQL) |
| **Gestión de Rutas** | React Router v6 |
| **Gestión de Estado** | TanStack Query (estado del servidor) y React Context (autenticación) |
| **Formularios** | React Hook Form con validación Zod |

### Estructura Core
*   **Tipo de Aplicación:** Gestión de "ordenes-pedido" con flujo de trabajo estilo Kanban.
*   **Autenticación/Autorización:** Gestionada por Supabase Auth (`AuthContext`). Se utiliza **Seguridad a Nivel de Fila (RLS)** para la restricción de permisos.
*   **Roles Definidos:** `admin`, `comercial`, `inventarios`, `produccion`, `logistica`, `facturacion`, `financiera`.
*   **Interfaz Kanban:** El flujo se gestiona mediante el componente `src/components/kanban/KanbanBoard.tsx` y la edición utiliza modales con pestañas por etapa (`OrderModal.tsx`).

## II. FLUJO DE TRABAJO KANBAN Y DATA GATES

El flujo es lineal y secuencial, y el avance entre fases está condicionado a la correcta finalización de los "Data Gates" (campos obligatorios) por parte del rol responsable.

**Flujo:** `comercial` $\rightarrow$ `inventarios` $\rightarrow$ `produccion` $\rightarrow$ `logistica` $\rightarrow$ `facturacion` $\rightarrow$ `financiera`.

---

### FASE 1: COMERCIAL (Rol: `comercial`)

El Comercial es el único rol autorizado para iniciar la orden y debe completar los datos en `public.orden_pedido`, `public.detalle_orden`, y detalles de despacho.

| Campo (Tabla DB) | Requerimiento Confirmado | Fundamento |
| :--- | :--- | :--- |
| **`id_cliente`, `id_clase_orden`, `id_tipo_servicio`** | Datos básicos y línea de negocio. | El Tipo de Orden (Venta, Renta, Préstamo) activa la validación condicional (RF-4). |
| **`id_ingeniero_asignado`** | Asignación obligatoria a **un solo ingeniero**. |
| **Detalle de Productos** | Referencia, Cantidad, Valor Unitario. Si es Renta, el **Tiempo de Permanencia**. |
| **Configuración Línea** | Se requiere una **lista desplegable** para seleccionar el APN si la configuración de línea es "Sí". |
| **Datos Logísticos Iniciales** | Tipo de envío (`id_tipo_despacho`) y datos de contacto/dirección. Incluye el **monto de seguro** (si aplica). |

---

### FASE 2: INVENTARIOS (Rol: `inventarios`)

El proceso de Inventarios está simplificado a una acción de validación interna, ya que los documentos y asignaciones específicas son procesos externos.

| Acción Requerida | Restricciones y Data Gate | Fundamento |
| :--- | :--- | :--- |
| **Validación de Stock** | El usuario debe realizar el *picking* físico y confirmar que el **stock del pedido esté completo**. |
| **Exclusiones** | **No se registra IMEI/Seriales/Placas** en la aplicación. No se genera el documento Sapiens 301 ni el Acta de Préstamo dentro del sistema. |
| **Registro de Avance** | Se registra la acción de "stock completo" en **`public.historial_orden`** al pasar a Producción. |

---

### FASE 3: PRODUCCIÓN (Rol: `produccion`)

El Producción se centra en el registro de la configuración y las pruebas.

| Campo (Tabla DB: `public.orden_produccion`) | Requerimiento Confirmado |
| :--- | :--- |
| **`observaciones_produccion`** | Detalle de las configuraciones y resultados de las pruebas funcionales. |
| **`fecha_produccion`** | Fecha y hora de salida de la fase (finalización de la configuración). |
| **`numero_produccion`** | Referencia a la Orden de Producción generada en Sapiens. |

---

### FASE 4: LOGÍSTICA (Rol: `logistica`)

Esta es la fase de **Data Gate Crítica (RF-8)** para Facturación, registrando datos en `public.despacho_orden` y `public.remision`.

| Campo (Tabla DB) | Requerimiento Confirmado | Fundamento |
| :--- | :--- | :--- |
| **`valor_servicio_flete`** (`despacho_orden`) | **OBLIGATORIO (Data Gate RF-8)**. La orden no puede avanzar a Facturación sin este valor. |
| **`numero_guia`** (`despacho_orden`) | Número de guía para el seguimiento del envío. |
| **`id_transportadora`** (`despacho_orden`) | Selección de la transportadora utilizada (Ej. MENSAJEROS URBANOS, SERVIMEJIA). |
| **`numero_remision`** (`remision`) | Número único de la remisión de entrega. |
| **`fecha_despacho`** (`despacho_orden`) | Fecha y hora de recolección/llegada. |

---

### FASE 5: FACTURACIÓN (Rol: `facturacion`)

El foco está en la emisión de la factura y la gestión de la conversión de moneda.

| Campo (Tabla DB: `public.factura`) | Requerimiento Confirmado | Fundamento |
| :--- | :--- | :--- |
| **`numero_factura`, `fecha_factura`** | Identificación de la factura generada. |
| **`moneda_base`** | Moneda base de la transacción (USD o COP). |
| **`trm_aplicada`, `fecha_trm`** | La **TRM (USD/COP)** específica utilizada para la conversión y su fecha. (Ej. COP $4375,86). |

---

### FASE 6: FINANCIERA (Rol: `financiera`)

Acción final de cierre del flujo.

| Acción Requerida | Impacto en DB |
| :--- | :--- |
| **Validación de Pago/Crédito** | Confirma la aprobación o recepción de pago. |
| **Cierre de Orden** | Cambio de `estatus` en `public.orden_pedido` a **`cerrada`**. |

## III. TRAZABILIDAD Y GESTIÓN DE ESTATUS

### Trazabilidad Inmutable (RF-10)
Cada transición de fase y acción clave debe registrarse en la tabla **`public.historial_orden`**.
*   **Campos clave:** `timestamp_accion`, `actor_user_id`, `rol_actor`, `fase_anterior`, `fase_nueva`, `accion_clave`.

### Cancelación
*   Si la orden es cancelada, el campo **`estatus`** en `public.orden_pedido` cambia a **`anulada`**.
*   El motivo de la cancelación debe registrarse en **`observaciones_orden`** en `public.orden_pedido` y en el historial.
```