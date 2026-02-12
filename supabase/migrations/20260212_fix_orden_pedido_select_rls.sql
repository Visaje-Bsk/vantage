-- ============================================================
-- FIX: Permitir que cada rol vea las órdenes en su fase
--
-- Regla: Cada usuario autenticado puede VER órdenes según:
--   1. Admin → ve todo
--   2. Creador de la orden → ve su orden
--   3. Responsable asignado → ve la orden asignada
--   4. Rol coincide con fase → logistica ve fase logistica, etc.
--   5. Comercial → ve todas (necesita visibilidad completa)
--
-- NOTA: Solo se modifica orden_pedido. Las tablas hijas
-- (detalle_orden, linea_servicio, etc.) mantienen políticas
-- permisivas (true) para evitar recursión infinita con
-- responsable_orden.
-- ============================================================

-- 1. Eliminar políticas SELECT conflictivas
DROP POLICY IF EXISTS "Enable users to view their own data only" ON orden_pedido;
DROP POLICY IF EXISTS "OP: select owner/responsable/admin" ON orden_pedido;
DROP POLICY IF EXISTS "OP: select by role/fase/owner/admin" ON orden_pedido;

-- 2. Crear nueva política SELECT con acceso por rol/fase
CREATE POLICY "OP: select by role/fase/owner/admin" ON orden_pedido
    FOR SELECT TO authenticated
    USING (
        is_admin()
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM responsable_orden ro
            WHERE ro.id_orden_pedido = orden_pedido.id_orden_pedido
            AND ro.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role::text = orden_pedido.fase::text
        )
        OR has_role('comercial'::app_role)
    );
