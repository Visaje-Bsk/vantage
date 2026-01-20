# Sistema de Gestión de Órdenes de Pedido

**Nombre del proyecto:** Órdenes de Pedido
**Tipo:** Aplicación Web SPA
**Industria:** Gestión empresarial / ERP
**Estado:** En desarrollo activo

---

## 1. Descripción General

Sistema de gestión de órdenes de pedido diseñado para empresas que manejan flujos de trabajo complejos desde la venta hasta la entrega. La aplicación implementa un **tablero Kanban** con 6 fases que representan el ciclo de vida completo de una orden.

### Propósito Principal

Digitalizar y controlar el proceso de órdenes de pedido que involucra múltiples departamentos:
- **Comercial**: Captura la orden del cliente
- **Inventarios**: Valida disponibilidad de stock
- **Producción**: Fabrica/prepara los productos
- **Financiera**: Gestiona aprobaciones de crédito
- **Facturación**: Emite documentos fiscales
- **Logística**: Coordina el despacho y entrega

---

## 2. Problema que Resuelve

### Antes (Proceso Manual)
- Órdenes en papel o Excel sin trazabilidad
- Comunicación por email/WhatsApp entre departamentos
- Sin visibilidad del estado real de las órdenes
- Errores por falta de validación de datos
- Retrasos por información incompleta

### Después (Con el Sistema)
- Flujo digital con estados claros
- Cada departamento tiene su "columna" en el Kanban
- Validaciones automáticas (Data Gates) antes de avanzar
- Historial completo de cambios
- Roles y permisos granulares

---

## 3. Usuarios del Sistema

### 3.1 Perfiles de Usuario

| Rol | Responsabilidades | Fase Principal |
|-----|-------------------|----------------|
| Comercial | Crear órdenes, asignar clientes, agregar productos | Comercial |
| Inventarios | Verificar stock, reservar productos | Inventarios |
| Producción | Registrar fabricación, números de producción | Producción |
| Financiera | Aprobar créditos, confirmar pagos | Financiera |
| Facturación | Emitir facturas, registrar TRM | Facturación |
| Logística | Coordinar despachos, registrar guías | Logística |
| Admin | Gestión de usuarios, catálogos, configuración | Todas |

### 3.2 Capacidad del Sistema

- **Usuarios concurrentes:** Diseñado para equipos de 10-50 usuarios
- **Volumen de órdenes:** Cientos de órdenes activas simultáneas
- **Multi-tenant:** No (single-tenant por instalación)

---

## 4. Funcionalidades Principales

### 4.1 Tablero Kanban

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TABLERO DE ÓRDENES                            │
├───────────┬───────────┬───────────┬───────────┬───────────┬─────────┤
│ COMERCIAL │INVENTARIOS│PRODUCCIÓN │ FINANCIERA│FACTURACIÓN│LOGÍSTICA│
│    🔴     │    🟡     │    🔵     │    🟠     │    🔷     │    🟢   │
├───────────┼───────────┼───────────┼───────────┼───────────┼─────────┤
│ [Orden 1] │ [Orden 4] │ [Orden 7] │ [Orden 9] │[Orden 11] │[Orden 13│
│ [Orden 2] │ [Orden 5] │ [Orden 8] │[Orden 10] │[Orden 12] │         │
│ [Orden 3] │ [Orden 6] │           │           │           │         │
└───────────┴───────────┴───────────┴───────────┴───────────┴─────────┘
```

**Características:**
- Vista de todas las órdenes por fase
- Tarjetas con información resumida (cliente, fecha, estado)
- Filtros por estado (abierta, borrador, cerrada, anulada)
- Búsqueda por número de orden o cliente
- Colores distintivos por fase

### 4.2 Modal de Orden

Al hacer clic en una tarjeta, se abre un modal con:

- **Header:** Número de orden, cliente, fase actual, estado
- **Tabs:** Una pestaña por cada fase del flujo
- **Footer:** Botón "Avanzar a [siguiente fase]"

### 4.3 Tab Comercial (Ejemplo Detallado)

```
┌─────────────────────────────────────────────────────────────────┐
│ INFORMACIÓN COMERCIAL                                            │
├─────────────────────────────────────────────────────────────────┤
│ Cliente: [Selector]        Proyecto: [Selector]                 │
│ Ingeniero Asignado: [Selector de usuarios]                      │
├─────────────────────────────────────────────────────────────────┤
│ PRODUCTOS Y SERVICIOS                                            │
├─────────────────────────────────────────────────────────────────┤
│ ✅ SIERRA MODEM RAVEN XT  |  Cant: 10  |  Valor: $150.000       │
│    [Editar] [Eliminar]                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Equipo: [Buscar...]  Cant: [___]  Valor: [$___]  [Confirmar]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│ [+ Agregar Equipo]                                              │
├─────────────────────────────────────────────────────────────────┤
│ INFORMACIÓN DE DESPACHO (expandible)                            │
│ > Tipo de despacho, transportadora, dirección, contacto...     │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Sistema de Data Gates (Validaciones)

Antes de avanzar de una fase a otra, el sistema valida:

| Fase | Validaciones Obligatorias |
|------|---------------------------|
| Comercial → Inventarios | Ingeniero asignado, al menos 1 producto **confirmado** |
| Inventarios → Producción | Stock validado |
| Producción → Financiera | Observaciones, número de producción |
| Financiera → Facturación | Aprobación de crédito |
| Facturación → Logística | Número de factura, fecha |
| Logística → Cerrar | Guía de transporte, valor de flete |

### 4.5 Gestión de Catálogos

Panel administrativo para gestionar:

- **Clientes:** Nombre, NIT
- **Proyectos:** Asociados a clientes
- **Equipos/Productos:** Código, nombre
- **Operadores:** Para líneas de servicio
- **Planes y APNs:** Configuración de servicios
- **Transportadoras:** Empresas de logística
- **Tipos de pago:** Condiciones comerciales
- **Tipos de despacho:** Métodos de entrega

### 4.6 Control de Acceso

- **Login:** Autenticación con email/password
- **Roles:** Cada usuario tiene un rol asignado
- **Permisos:** Solo puede editar en su fase correspondiente
- **Admin:** Acceso total a todas las funciones

---

## 5. Flujo de Trabajo Típico

### Escenario: Nueva orden de equipos

```
1. COMERCIAL crea nueva orden
   ├── Selecciona cliente "Empresa XYZ"
   ├── Agrega producto "Modem Sierra" x 10 unidades
   ├── Asigna ingeniero responsable
   └── Avanza a Inventarios ✅

2. INVENTARIOS revisa la orden
   ├── Verifica stock disponible
   ├── Marca como "Stock validado"
   └── Avanza a Producción ✅

3. PRODUCCIÓN prepara el pedido
   ├── Registra número de producción (Sapiens)
   ├── Agrega observaciones del proceso
   └── Avanza a Financiera ✅

4. FINANCIERA aprueba
   ├── Verifica condiciones de pago
   ├── Confirma aprobación de crédito
   └── Avanza a Facturación ✅

5. FACTURACIÓN emite documentos
   ├── Genera factura electrónica
   ├── Registra número y fecha
   └── Avanza a Logística ✅

6. LOGÍSTICA coordina entrega
   ├── Asigna transportadora
   ├── Registra número de guía
   ├── Registra valor del flete
   └── Cierra la orden ✅
```

---

## 6. Características Técnicas Destacadas

### 6.1 Confirmación de Equipos

Sistema de "confirmar" antes de guardar:
- El usuario selecciona equipo, cantidad y valor
- Hace clic en "Confirmar" ✓
- El equipo queda marcado con check verde
- Solo los equipos confirmados se guardan

**Beneficio:** Evita guardar datos incompletos accidentalmente.

### 6.2 Detección de Cambios Sin Guardar

- El sistema detecta si hay cambios sin guardar
- Muestra advertencia al intentar cerrar o avanzar
- El botón "Avanzar" se deshabilita si hay cambios pendientes

### 6.3 Búsqueda Inteligente de Equipos

- Búsqueda en tiempo real por código o nombre
- Maneja caracteres especiales (/, -, etc.)
- Debounce para optimizar peticiones

### 6.4 Formateo de Moneda

- Valores se muestran formateados: `$ 1.500.000`
- Al editar, solo se ingresan números
- Conversión automática al guardar

---

## 7. Integraciones

### 7.1 Actuales

| Sistema | Tipo | Propósito |
|---------|------|-----------|
| Supabase | BaaS | Base de datos, autenticación, RLS |

### 7.2 Potenciales (Futuras)

| Sistema | Propósito |
|---------|-----------|
| Sapiens ERP | Sincronizar números de producción |
| Facturación electrónica | Emisión automática de facturas |
| Transportadoras | APIs de tracking |
| Email/WhatsApp | Notificaciones |

---

## 8. Métricas del Proyecto

### 8.1 Tamaño del Código

| Categoría | Cantidad |
|-----------|----------|
| Archivos TypeScript/TSX | ~100 |
| Componentes React | ~60 |
| Hooks personalizados | ~20 |
| Páginas | 7 |
| Líneas de código (estimado) | ~15,000 |

### 8.2 Complejidad por Componente

| Componente | Líneas | Complejidad |
|------------|--------|-------------|
| ComercialTab | ~1,500 | Alta |
| OrderModal | ~800 | Alta |
| KanbanBoard | ~400 | Media |
| NuevaOrdenModal | ~700 | Alta |
| Otros tabs | ~300 c/u | Media |

---

## 9. Roadmap

### Fase 1: MVP (Completado ~75%)
- [x] Autenticación y roles
- [x] Tablero Kanban
- [x] Creación de órdenes
- [x] Tab Comercial completo con sistema de confirmación de equipos
- [x] Sistema Data Gates con bloqueo de avance
- [x] Catálogos básicos
- [x] Condiciones de pago (forma + plazo)
- [x] Políticas RLS completas

### Fase 2: Funcionalidad Completa (En progreso ~15%)
- [ ] Completar tabs restantes
- [ ] Historial de cambios por orden
- [ ] Dashboard con métricas

### Fase 3: Mejoras (Pendiente ~10%)
- [ ] Notificaciones en tiempo real
- [ ] Reportes exportables
- [ ] App móvil (PWA)
- [ ] Integración con sistemas externos

---

## 10. Glosario

| Término | Definición |
|---------|------------|
| **Orden de Pedido** | Solicitud de productos/servicios de un cliente |
| **Fase** | Etapa del flujo de trabajo (Comercial, Inventarios, etc.) |
| **Estado** | Condición actual de la orden (abierta, cerrada, anulada) |
| **Data Gate** | Validación que controla el avance entre fases |
| **Kanban** | Metodología visual de gestión de trabajo |
| **RLS** | Row Level Security - seguridad a nivel de fila en BD |
| **RPC** | Remote Procedure Call - funciones del servidor |
| **Tab** | Pestaña del modal de orden correspondiente a una fase |

---

## 11. Contacto y Soporte

Para consultas técnicas o de negocio sobre este proyecto, contactar al equipo de desarrollo.

---

*Este documento proporciona una visión general del proyecto para stakeholders, nuevos miembros del equipo y agentes de IA que necesiten contexto sobre el sistema.*
