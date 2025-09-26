-- Create permission catalog table
CREATE TABLE public.permission (
  perm_code TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create role permissions mapping table
CREATE TABLE public.role_permissions (
  role app_role NOT NULL,
  perm_code TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (role, perm_code),
  FOREIGN KEY (perm_code) REFERENCES public.permission(perm_code) ON DELETE CASCADE
);

-- Create RBAC events audit table
CREATE TABLE public.rbac_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor UUID REFERENCES auth.users(id),
  role app_role NOT NULL,
  perm_code TEXT NOT NULL,
  allowed_before BOOLEAN,
  allowed_after BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_event ENABLE ROW LEVEL SECURITY;

-- Permission policies (read all for authenticated, write only admin)
CREATE POLICY "Permission: read all" ON public.permission FOR SELECT USING (true);
CREATE POLICY "Permission: admin write" ON public.permission FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Role permissions policies
CREATE POLICY "RolePermissions: read all" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "RolePermissions: admin write" ON public.role_permissions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RBAC events policies (read for admins only)
CREATE POLICY "RbacEvent: admin read" ON public.rbac_event FOR SELECT USING (is_admin());
CREATE POLICY "RbacEvent: admin write" ON public.rbac_event FOR INSERT WITH CHECK (is_admin());

-- Create secure function to check user permissions
CREATE OR REPLACE FUNCTION public.has_permission(perm_code TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN role_permissions rp ON p.role = rp.role
    WHERE p.user_id = auth.uid() 
      AND rp.perm_code = has_permission.perm_code 
      AND rp.allowed = true
  ) OR is_admin();
$$;

-- Function to check if user can update a specific order
CREATE OR REPLACE FUNCTION public.can_update_orden(op_id INTEGER)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 
    FROM ordenpedido op
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE op.id_orden_pedido = op_id
      AND op.estatus NOT IN ('cerrada', 'anulada')
      AND (
        -- User owns the order
        op.created_by = auth.uid() OR
        -- User has permission for current phase
        (p.role::text = op.fase::text AND has_permission('orden.update')) OR
        -- User is assigned as responsible
        EXISTS (
          SELECT 1 FROM responsableorden ro 
          WHERE ro.id_orden_pedido = op_id AND ro.user_id = auth.uid()
        )
      )
  );
$$;

-- Function to check if user can move order to different phase
CREATE OR REPLACE FUNCTION public.can_move_fase(op_id INTEGER, to_fase fase_orden_enum)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 
    FROM ordenpedido op
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE op.id_orden_pedido = op_id
      AND op.estatus NOT IN ('cerrada', 'anulada')
      AND p.role::text = op.fase::text -- User must be in current phase
      AND has_permission('orden.move_fase')
  );
$$;

-- Function to check if user can change order status
CREATE OR REPLACE FUNCTION public.can_change_estatus(op_id INTEGER, new_estatus estatus_orden_enum)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 
    FROM ordenpedido op
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE op.id_orden_pedido = op_id
      AND op.estatus NOT IN ('cerrada', 'anulada')
      AND (
        -- User owns the order or is in current phase
        op.created_by = auth.uid() OR
        p.role::text = op.fase::text OR
        EXISTS (
          SELECT 1 FROM responsableorden ro 
          WHERE ro.id_orden_pedido = op_id AND ro.user_id = auth.uid()
        )
      )
      AND has_permission('orden.change_estatus')
  );
$$;

-- Insert base permissions
INSERT INTO public.permission (perm_code, category, description) VALUES
-- Orders permissions
('orden.view_phase', 'ordenes', 'Ver órdenes de su fase'),
('orden.view_own', 'ordenes', 'Ver órdenes propias'),
('orden.view_all', 'ordenes', 'Ver todas las órdenes'),
('orden.create', 'ordenes', 'Crear nuevas órdenes'),
('orden.update', 'ordenes', 'Actualizar órdenes'),
('orden.move_fase', 'ordenes', 'Mover órdenes entre fases'),
('orden.change_estatus', 'ordenes', 'Cambiar estatus de órdenes'),
('orden.assign_responsable', 'ordenes', 'Asignar responsables'),

-- Detail permissions
('detalle.create', 'detalles', 'Crear detalles de orden'),
('detalle.update', 'detalles', 'Actualizar detalles'),
('detalle.delete', 'detalles', 'Eliminar detalles'),

-- Catalog permissions
('catalogo.manage', 'catalogos', 'Gestionar catálogos maestros'),

-- User permissions
('user.manage', 'usuarios', 'Gestionar usuarios'),

-- Export permissions
('export.data', 'reportes', 'Exportar datos y reportes');

-- Insert default role permissions
-- Admin: all permissions
INSERT INTO public.role_permissions (role, perm_code, allowed)
SELECT 'admin'::app_role, perm_code, true
FROM public.permission;

-- Comercial permissions
INSERT INTO public.role_permissions (role, perm_code, allowed) VALUES
('comercial', 'orden.view_own', true),
('comercial', 'orden.create', true),
('comercial', 'orden.update', true),
('comercial', 'orden.move_fase', true),
('comercial', 'orden.change_estatus', true),
('comercial', 'detalle.create', true),
('comercial', 'detalle.update', true),
('comercial', 'detalle.delete', true);

-- Inventarios permissions
INSERT INTO public.role_permissions (role, perm_code, allowed) VALUES
('inventarios', 'orden.view_phase', true),
('inventarios', 'orden.view_own', true),
('inventarios', 'orden.update', true),
('inventarios', 'orden.move_fase', true),
('inventarios', 'orden.change_estatus', true);

-- Produccion permissions
INSERT INTO public.role_permissions (role, perm_code, allowed) VALUES
('produccion', 'orden.view_phase', true),
('produccion', 'orden.view_own', true),
('produccion', 'orden.update', true),
('produccion', 'orden.move_fase', true),
('produccion', 'orden.change_estatus', true);

-- Logistica permissions
INSERT INTO public.role_permissions (role, perm_code, allowed) VALUES
('logistica', 'orden.view_phase', true),
('logistica', 'orden.view_own', true),
('logistica', 'orden.update', true),
('logistica', 'orden.move_fase', true),
('logistica', 'orden.change_estatus', true),
('logistica', 'export.data', true);

-- Facturacion permissions
INSERT INTO public.role_permissions (role, perm_code, allowed) VALUES
('facturacion', 'orden.view_phase', true),
('facturacion', 'orden.view_own', true),
('facturacion', 'orden.update', true),
('facturacion', 'orden.move_fase', true),
('facturacion', 'orden.change_estatus', true),
('facturacion', 'export.data', true);

-- Financiera permissions
INSERT INTO public.role_permissions (role, perm_code, allowed) VALUES
('financiera', 'orden.view_phase', true),
('financiera', 'orden.view_own', true),
('financiera', 'orden.update', true),
('financiera', 'orden.move_fase', true),
('financiera', 'orden.change_estatus', true),
('financiera', 'export.data', true);