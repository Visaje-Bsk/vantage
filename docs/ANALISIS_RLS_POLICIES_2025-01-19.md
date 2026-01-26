# 🔒 Análisis de RLS Policies - Sistema de Gestión de Órdenes

**Fecha del análisis**: 2025-01-19  
**Base de datos**: PostgreSQL con Supabase  
**Total de policies analizadas**: 32 policies en 11 tablas

---

## 📊 **Resumen Ejecutivo**

Las RLS policies están **bien estructuradas** pero tienen **inconsistencias críticas** que afectan el flujo de negocio. El sistema de permisos está basado en roles y funciones personalizadas (`is_admin()`, `has_role()`, `has_permission()`), lo cual es robusto.

**Estado general**: 70% correcto, 30% necesita ajustes críticos

---

## 🏗️ **Arquitectura de Seguridad Analizada**

### **✅ Fortalezas Detectadas**

#### 1. **Sistema de Permisos Basado en Funciones**
```sql
-- Funciones personalizadas bien implementadas
is_admin()                    -- Verifica si es admin
has_role('rol'::app_role)     -- Verifica rol específico
has_permission('permiso'::text) -- Verifica permiso granular
```

#### 2. **Control de Acceso por Rol y Fase**
```sql
-- Política UPDATE bien estructurada (línea 26)
"OP: update by fase"
CONDICIÓN: 
- Solo si estatus NO es 'cerrada' o 'anulada'
- Y el rol coincide con la fase actual
```

#### 3. **Protección de Órdenes Propias**
```sql
-- SELECT solo permite ver propias órdenes o asignadas (línea 25)
"OP: select owner/responsable/admin"
```

#### 4. **Permisos de Catálogos Estandarizados**
```sql
-- Patrón consistente para todos los catálogos
"{tabla}: read with permission"
"{tabla}: manage with permission"
```

### **❌ Problemas Críticos Identificados**

#### 1. **POLÍTICA SELECT DUPLICADA EN orden_pedido** 🔴
```sql
-- Línea 23: "Enable users to view their own data only"
CONDICIÓN: (auth.uid() = created_by)

-- Línea 25: "OP: select owner/responsable/admin"  
CONDICIÓN: (is_admin() OR created_by = auth.uid() OR EXISTS(...))
```
**Problema**: La primera política es más restrictiva y podría bloquear accesos válidos.

#### 2. **PERMISOS DE ACTUALIZACIÓN INCOMPLETOS** 🔴
```sql
-- "OP: update by fase" (línea 26) NO incluye algunos roles críticos:
-- ❌ FALTA: rol 'ingenieria' para la fase 'comercial'
-- ❌ FALTA: Validación de responsable_orden para fase 'comercial'
```

#### 3. **PERMISOS DELETE DEMASIADO RESTRICTIVOS** 🟡
```sql
-- detalle_orden (línea 10): Solo 'admin' y 'comercial' pueden eliminar
-- linea_servicio (línea 17): Solo 'admin' puede eliminar
```
**Problema**: ¿Deberían poder eliminarse líneas de servicios en otras fases?

#### 4. **FALTA DE POLÍTICAS EN TABLAS CRÍTICAS** 🔴
**Tablas sin políticas identificadas**:
- `despacho_orden` - ¡CRÍTICO para la fase de logística!
- `remision` - Necesaria para el flujo completo
- `responsable_orden` - Tabla intermedia clave
- `profiles` - Gestión de usuarios
- `tipo_despacho`, `tipo_pago`, `transportadora` - Catálogos faltantes

#### 5. **INCONSISTENCIA EN ROLES PERMITIDOS** 🟡
```sql
-- linea_servicio (línea 18-20): Permite ['comercial', 'admin', 'ingenieria', 'inventarios']
-- detalle_orden (línea 11): Solo permite ['admin', 'comercial']
```
**Problema**: ¿Por qué 'inventarios' puede modificar líneas de servicio pero no productos?

---

## 📋 **Análisis por Tabla**

### **🔥 Tablas Críticas del Flujo**

#### **orden_pedido** (3 policies)
- ✅ **INSERT**: Solo 'comercial' y 'admin' - CORRECTO
- ✅ **UPDATE**: Control por fase y estatus - BUENO pero incompleto
- ⚠️ **SELECT**: Políticas duplicadas - PROBLEMA
- 🔴 **DELETE**: Sin política de eliminación - ¿Intencional?

#### **detalle_orden** (4 policies)
- ✅ **INSERT**: Solo usuarios autenticados - ACEPTABLE
- ✅ **SELECT**: Todos los usuarios - CORRECTO
- ✅ **UPDATE**: Solo 'admin' y 'comercial' - ¿Correcto?
- ✅ **DELETE**: 'admin' y 'comercial' si estatus = 'abierta' - CORRECTO

#### **linea_servicio** (4 policies)
- ✅ **INSERT**: ['comercial', 'admin', 'ingenieria', 'inventarios'] - BIEN
- ✅ **SELECT**: Todos los usuarios - CORRECTO
- ✅ **UPDATE**: Mismos roles que INSERT - CORRECTO
- 🔴 **DELETE**: Solo 'admin' - ¿Demasiado restrictivo?

#### **factura** (2 policies)
- ✅ **SELECT**: Si orden visible - CORRECTO
- ✅ **ALL**: Solo 'facturacion' y 'admin' - CORRECTO

#### **orden_produccion** (2 policies)
- ✅ **SELECT**: Si orden visible - CORRECTO
- ✅ **ALL**: Solo 'produccion' y 'admin' - CORRECTO

### **🔴 Tablas CRÍTICAS SIN POLÍTICAS**

#### **despacho_orden** - ¡ALTO RIESGO!
- **Impacto**: Fase de logística no puede operar
- **Necesario**: Políticas para 'logistica' y 'admin'
- **Campos críticos**: `valor_servicio_flete`, `numero_guia`

#### **remision** - ¡FLUJO ROTO!
- **Impacto**: No se pueden generar remisiones
- **Necesario**: Políticas para 'logistica' y 'admin'

#### **responsable_orden** - ¡GESTIÓN ROTA!
- **Impacto**: No se pueden asignar responsables
- **Necesario**: Políticas para todos los roles

### **📚 Catálogos (Bien Implementados)**

#### **Catálogos con políticas correctas:**
- `apn`, `clase_orden`, `cliente`, `operador`, `plan`
- **Patrón**: `{tabla}: read with permission` y `{tabla}: manage with permission`
- **Control**: Basado en `has_permission()` - EXCELENTE

#### **Catálogos FALTANTES:**
- `tipo_despacho`
- `tipo_pago` 
- `transportadora`
- `metodo_despacho`

---

## 🚨 **Problemas de Seguridad Identificados**

### **🔴 Críticos (Inmediato)**

#### 1. **Acceso Denegado a Funciones Críticas**
```sql
-- despacho_orden SIN POLÍTICAS
-- Logística no puede:
-- - Registrar valor del flete (RF-8)
-- - Agregar número de guía
-- - Asignar transportadora
```

#### 2. **Inyección de Contexto Incorrecto**
```sql
-- Política SELECT duplicada en orden_pedido
-- Puede causar acceso denegado inesperado
```

#### 3. **Roles Incompletos en Fase Comercial**
```sql
-- 'ingenieria' no puede modificar orden en fase comercial
-- Pero sí puede modificar líneas de servicio
```

### **🟡 Medios (Corto Plazo)**

#### 4. **Permisos Delete Inconsistentes**
- ¿Deberían poder eliminarse detalles en otras fases?
- ¿Quién puede eliminar líneas de servicio?

#### 5. **Falta de Validación de Responsables**
- No se valida que el responsable esté asignado a la orden
- Posible acceso no autorizado

---

## 🛠️ **Plan de Corrección**

### **🔥 FASE 1: Críticos Inmediatos (1-2 días)**

#### 1.1 Corregir Políticas SELECT Duplicadas
```sql
-- Eliminar política restrictiva (línea 23)
DROP POLICY "Enable users to view their own data only" ON orden_pedido;
-- La política "OP: select owner/responsable/admin" es suficiente
```

#### 1.2 Crear Políticas para despacho_orden
```sql
-- Política SELECT
CREATE POLICY "Despacho: read si OP visible" ON despacho_orden
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM orden_pedido op 
        WHERE op.id_orden_pedido = despacho_orden.id_orden_pedido
        AND (is_admin() OR op.created_by = auth.uid() OR EXISTS(
            SELECT 1 FROM responsable_orden ro 
            WHERE ro.id_orden_pedido = op.id_orden_pedido 
            AND ro.user_id = auth.uid()
        ))
    ));

-- Política ALL para logística
CREATE POLICY "Despacho: write logistica/admin" ON despacho_orden
    FOR ALL TO authenticated
    USING (has_role('logistica'::app_role) OR is_admin())
    WITH CHECK (has_role('logistica'::app_role) OR is_admin());
```

#### 1.3 Crear Políticas para remision
```sql
CREATE POLICY "Remision: read si OP visible" ON remision
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM orden_pedido op 
        WHERE op.id_orden_pedido = remision.id_orden_pedido
        AND (is_admin() OR op.created_by = auth.uid() OR EXISTS(
            SELECT 1 FROM responsable_orden ro 
            WHERE ro.id_orden_pedido = op.id_orden_pedido 
            AND ro.user_id = auth.uid()
        ))
    ));

CREATE POLICY "Remision: write logistica/admin" ON remision
    FOR ALL TO authenticated
    USING (has_role('logistica'::app_role) OR is_admin())
    WITH CHECK (has_role('logistica'::app_role) OR is_admin());
```

#### 1.4 Corregir Política UPDATE de orden_pedido
```sql
-- Agregar rol 'ingenieria' para fase comercial
-- Y validar responsables asignados
CREATE OR REPLACE POLICY "OP: update by fase" ON orden_pedido
    FOR UPDATE TO authenticated
    USING (is_admin() OR (
        estatus <> ALL (ARRAY['cerrada'::estatus_orden_enum, 'anulada'::estatus_orden_enum])
        AND (
            (has_role('comercial'::app_role) AND fase = 'comercial'::fase_orden_enum AND created_by = auth.uid())
            OR (has_role('ingenieria'::app_role) AND fase = 'comercial'::fase_orden_enum)
            OR (has_role('inventarios'::app_role) AND fase = 'inventarios'::fase_orden_enum AND EXISTS(
                SELECT 1 FROM responsable_orden ro 
                WHERE ro.id_orden_pedido = orden_pedido.id_orden_pedido 
                AND ro.user_id = auth.uid() AND ro.role = 'inventarios'::app_role
            ))
            OR (has_role('produccion'::app_role) AND fase = 'produccion'::fase_orden_enum AND EXISTS(
                SELECT 1 FROM responsable_orden ro 
                WHERE ro.id_orden_pedido = orden_pedido.id_orden_pedido 
                AND ro.user_id = auth.uid() AND ro.role = 'produccion'::app_role
            ))
            OR (has_role('logistica'::app_role) AND fase = 'logistica'::fase_orden_enum AND EXISTS(
                SELECT 1 FROM responsable_orden ro 
                WHERE ro.id_orden_pedido = orden_pedido.id_orden_pedido 
                AND ro.user_id = auth.uid() AND ro.role = 'logistica'::app_role
            ))
            OR (has_role('facturacion'::app_role) AND fase = 'facturacion'::fase_orden_enum AND EXISTS(
                SELECT 1 FROM responsable_orden ro 
                WHERE ro.id_orden_pedido = orden_pedido.id_orden_pedido 
                AND ro.user_id = auth.uid() AND ro.role = 'facturacion'::app_role
            ))
            OR (has_role('financiera'::app_role) AND fase = 'financiera'::fase_orden_enum AND EXISTS(
                SELECT 1 FROM responsable_orden ro 
                WHERE ro.id_orden_pedido = orden_pedido.id_orden_pedido 
                AND ro.user_id = auth.uid() AND ro.role = 'financiera'::app_role
            ))
        )
    ))
    WITH CHECK (is_admin() OR (
        estatus <> ALL (ARRAY['cerrada'::estatus_orden_enum, 'anulada'::estatus_orden_enum])
        AND (
            (has_role('comercial'::app_role) AND fase = 'comercial'::fase_orden_enum AND created_by = auth.uid())
            OR (has_role('ingenieria'::app_role) AND fase = 'comercial'::fase_orden_enum)
            -- ... resto de condiciones
        )
    ));
```

#### 1.5 Crear Políticas para responsable_orden
```sql
CREATE POLICY "Responsable: read si OP visible" ON responsable_orden
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM orden_pedido op 
        WHERE op.id_orden_pedido = responsable_orden.id_orden_pedido
        AND (is_admin() OR op.created_by = auth.uid() OR EXISTS(
            SELECT 1 FROM responsable_orden ro 
            WHERE ro.id_orden_pedido = op.id_orden_pedido 
            AND ro.user_id = auth.uid()
        ))
    ));

CREATE POLICY "Responsable: write admin/owner" ON responsable_orden
    FOR ALL TO authenticated
    USING (is_admin() OR created_by = auth.uid())
    WITH CHECK (is_admin() OR created_by = auth.uid());
```

### **⚡ FASE 2: Medios (1 semana)**

#### 2.1 Crear Políticas para Catálogos Faltantes
```sql
-- Para tipo_despacho, tipo_pago, transportadora
-- Usar el mismo patrón que los otros catálogos:
CREATE POLICY "{tabla}: read with permission" ON {tabla}
    FOR SELECT TO public
    USING (is_admin() OR has_permission('catalogo.{tabla}.read'::text) OR has_permission('catalogo.{tabla}.manage'::text));

CREATE POLICY "{tabla}: manage with permission" ON {tabla}
    FOR ALL TO public
    USING (is_admin() OR has_permission('catalogo.{tabla}.manage'::text))
    WITH CHECK (is_admin() OR has_permission('catalogo.{tabla}.manage'::text));
```

#### 2.2 Revisar Permisos de Eliminación
- Evaluar quién debería poder eliminar detalles en cada fase
- Ajustar políticas DELETE según reglas de negocio

#### 2.3 Agregar Permisos para profiles
```sql
CREATE POLICY "Profiles: read all" ON profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Profiles: write admin" ON profiles
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
```

### **📈 FASE 3: Mejoras (2-4 semanas)**

#### 3.1 Implementar Validaciones de Data Gates en RLS
- Integrar las validaciones de `types/dataGates.ts` en las políticas
- Agregar funciones como `can_advance_to_phase()`

#### 3.2 Auditoría y Logging
- Agregar triggers para auditoría
- Log de cambios críticos en seguridad

#### 3.3 Optimización de Performance
- Índices en columnas usadas en políticas
- Optimizar consultas anidadas

---

## 🎯 **Impacto de las Correcciones**

### **✅ Después de FASE 1:**
- **Logística podrá operar** (despacho_orden, remision)
- **Ingeniería podrá editar** en fase comercial
- **Acceso SELECT consistente** sin duplicación
- **Asignación de responsables** funcionará

### **✅ Después de FASE 2:**
- **Todos los catálogos protegidos**
- **Permisos de eliminación claros**
- **Gestión de usuarios segura**

### **✅ Después de FASE 3:**
- **Data Gates integrados en BD**
- **Auditoría completa**
- **Performance optimizado**

---

## 🔍 **Validaciones Recomendadas**

### **Después de FASE 1:**
1. **Probar flujo completo** con cada rol
2. **Verificar que logística pueda** crear despachos
3. **Confirmar que ingeniería pueda** editar en comercial
4. **Validar acceso SELECT** consistente

### **Después de FASE 2:**
1. **Probar CRUD de todos los catálogos**
2. **Verificar permisos de eliminación**
3. **Test de gestión de usuarios**

---

## 📝 **Consideraciones Adicionales**

### **Seguridad**
- Mantener principio de mínimo privilegio
- Validar cada cambio con diferentes roles
- Documentar todas las políticas

### **Performance**
- Monitorear impacto de políticas complejas
- Considerar índices adicionales
- Optimizar subconsultas anidadas

### **Mantenimiento**
- Documentar cada política en comentarios
- Versionar cambios de seguridad
- Revisión periódica de accesos

---

## 🎖️ **Conclusión**

El sistema de RLS policies tiene una **base sólida** pero necesita **ajustes críticos** para funcionar correctamente. Las políticas existentes muestran buen diseño pero están **incompletas** en áreas clave del flujo de negocio.

**Prioridad inmediata**: Corregir las políticas que impiden el funcionamiento básico del sistema (despacho_orden, remision, responsable_orden).

**Estado final esperado**: Sistema seguro con control granular por rol, fase y estatus, permitiendo el flujo completo de negocio manteniendo la seguridad.

---

**Próximo paso**: Implementar FASE 1 de correcciones críticas y validar que el flujo de negocio funcione correctamente.