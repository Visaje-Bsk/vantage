-- ============================================================
-- ROLLBACK: Restaurar políticas SELECT originales
--
-- Las políticas restrictivas en tablas hijas causaron error 500
-- (recursión infinita entre responsable_orden ↔ orden_pedido).
--
-- Solución: Eliminar las políticas nuevas y restaurar las
-- políticas permisivas originales en tablas hijas.
-- Solo orden_pedido mantiene la política por rol/fase.
-- ============================================================

-- 1. Eliminar políticas nuevas de tablas hijas
DROP POLICY IF EXISTS "DO: select by role/fase/owner/admin" ON detalle_orden;
DROP POLICY IF EXISTS "LS: select by role/fase/owner/admin" ON linea_servicio;
DROP POLICY IF EXISTS "RO: select by role/fase/owner/admin" ON responsable_orden;
DROP POLICY IF EXISTS "DespO: select by role/fase/owner/admin" ON despacho_orden;
DROP POLICY IF EXISTS "Rem: select by role/fase/owner/admin" ON remision;
DROP POLICY IF EXISTS "Fact: select by role/fase/owner/admin" ON factura;
DROP POLICY IF EXISTS "OProd: select by role/fase/owner/admin" ON orden_produccion;

-- 2. Restaurar políticas SELECT permisivas originales
-- (Estas tablas tenían "Enable read access for all users" = true)

CREATE POLICY "Enable read access for all users" ON detalle_orden
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all users" ON linea_servicio
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all users" ON responsable_orden
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all users" ON despacho_orden
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all users" ON remision
    FOR SELECT TO authenticated
    USING (true);

-- Factura y orden_produccion tenían políticas propias, restaurar
CREATE POLICY "Factura: select si OP visible" ON factura
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "OP_Prod: select si OP visible" ON orden_produccion
    FOR SELECT TO authenticated
    USING (true);
