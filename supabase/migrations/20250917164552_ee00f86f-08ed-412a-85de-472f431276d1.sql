-- Insert catalog permissions for each area
INSERT INTO permission (perm_code, category, description) VALUES
-- Comercial catalogs
('catalogo.cliente.read', 'catalogos', 'Ver catálogo de clientes'),
('catalogo.cliente.manage', 'catalogos', 'Gestionar catálogo de clientes'),
('catalogo.proyecto.read', 'catalogos', 'Ver catálogo de proyectos'),
('catalogo.proyecto.manage', 'catalogos', 'Gestionar catálogo de proyectos'),
('catalogo.claseorden.read', 'catalogos', 'Ver catálogo de clases de orden'),
('catalogo.claseorden.manage', 'catalogos', 'Gestionar catálogo de clases de orden'),

-- Inventarios catalogs
('catalogo.operador.read', 'catalogos', 'Ver catálogo de operadores'),
('catalogo.operador.manage', 'catalogos', 'Gestionar catálogo de operadores'),
('catalogo.plan.read', 'catalogos', 'Ver catálogo de planes'),
('catalogo.plan.manage', 'catalogos', 'Gestionar catálogo de planes'),
('catalogo.apn.read', 'catalogos', 'Ver catálogo de APN'),
('catalogo.apn.manage', 'catalogos', 'Gestionar catálogo de APN'),

-- Logística catalogs
('catalogo.transportadora.read', 'catalogos', 'Ver catálogo de transportadoras'),
('catalogo.transportadora.manage', 'catalogos', 'Gestionar catálogo de transportadoras'),
('catalogo.metododespacho.read', 'catalogos', 'Ver catálogo de métodos de despacho'),
('catalogo.metododespacho.manage', 'catalogos', 'Gestionar catálogo de métodos de despacho'),

-- Facturación catalogs
('catalogo.tipopago.read', 'catalogos', 'Ver catálogo de tipos de pago'),
('catalogo.tipopago.manage', 'catalogos', 'Gestionar catálogo de tipos de pago');

-- Admin gets all permissions
INSERT INTO role_permissions (role, perm_code, allowed) 
SELECT 'admin', perm_code, true 
FROM permission 
WHERE category = 'catalogos'
ON CONFLICT (role, perm_code) DO UPDATE SET allowed = true;

-- Role-specific permissions (owners get manage, others get read)
INSERT INTO role_permissions (role, perm_code, allowed) VALUES
-- Comercial owns: cliente, proyecto, claseorden
('comercial', 'catalogo.cliente.read', true),
('comercial', 'catalogo.cliente.manage', true),
('comercial', 'catalogo.proyecto.read', true),
('comercial', 'catalogo.proyecto.manage', true),
('comercial', 'catalogo.claseorden.read', true),
('comercial', 'catalogo.claseorden.manage', true),

-- Inventarios owns: operador, plan, apn
('inventarios', 'catalogo.operador.read', true),
('inventarios', 'catalogo.operador.manage', true),
('inventarios', 'catalogo.plan.read', true),
('inventarios', 'catalogo.plan.manage', true),
('inventarios', 'catalogo.apn.read', true),
('inventarios', 'catalogo.apn.manage', true),

-- Logística owns: transportadora, metododespacho
('logistica', 'catalogo.transportadora.read', true),
('logistica', 'catalogo.transportadora.manage', true),
('logistica', 'catalogo.metododespacho.read', true),
('logistica', 'catalogo.metododespacho.manage', true),

-- Facturación owns: tipopago
('facturacion', 'catalogo.tipopago.read', true),
('facturacion', 'catalogo.tipopago.manage', true),

-- Cross-role read permissions (all roles can read all catalogs)
-- Comercial reads others
('comercial', 'catalogo.operador.read', true),
('comercial', 'catalogo.plan.read', true),
('comercial', 'catalogo.apn.read', true),
('comercial', 'catalogo.transportadora.read', true),
('comercial', 'catalogo.metododespacho.read', true),
('comercial', 'catalogo.tipopago.read', true),

-- Inventarios reads others
('inventarios', 'catalogo.cliente.read', true),
('inventarios', 'catalogo.proyecto.read', true),
('inventarios', 'catalogo.claseorden.read', true),
('inventarios', 'catalogo.transportadora.read', true),
('inventarios', 'catalogo.metododespacho.read', true),
('inventarios', 'catalogo.tipopago.read', true),

-- Producción reads all
('produccion', 'catalogo.cliente.read', true),
('produccion', 'catalogo.proyecto.read', true),
('produccion', 'catalogo.claseorden.read', true),
('produccion', 'catalogo.operador.read', true),
('produccion', 'catalogo.plan.read', true),
('produccion', 'catalogo.apn.read', true),
('produccion', 'catalogo.transportadora.read', true),
('produccion', 'catalogo.metododespacho.read', true),
('produccion', 'catalogo.tipopago.read', true),

-- Logística reads others
('logistica', 'catalogo.cliente.read', true),
('logistica', 'catalogo.proyecto.read', true),
('logistica', 'catalogo.claseorden.read', true),
('logistica', 'catalogo.operador.read', true),
('logistica', 'catalogo.plan.read', true),
('logistica', 'catalogo.apn.read', true),
('logistica', 'catalogo.tipopago.read', true),

-- Facturación reads others
('facturacion', 'catalogo.cliente.read', true),
('facturacion', 'catalogo.proyecto.read', true),
('facturacion', 'catalogo.claseorden.read', true),
('facturacion', 'catalogo.operador.read', true),
('facturacion', 'catalogo.plan.read', true),
('facturacion', 'catalogo.apn.read', true),
('facturacion', 'catalogo.transportadora.read', true),
('facturacion', 'catalogo.metododespacho.read', true),

-- Financiera reads all
('financiera', 'catalogo.cliente.read', true),
('financiera', 'catalogo.proyecto.read', true),
('financiera', 'catalogo.claseorden.read', true),
('financiera', 'catalogo.operador.read', true),
('financiera', 'catalogo.plan.read', true),
('financiera', 'catalogo.apn.read', true),
('financiera', 'catalogo.transportadora.read', true),
('financiera', 'catalogo.metododespacho.read', true),
('financiera', 'catalogo.tipopago.read', true)

ON CONFLICT (role, perm_code) DO UPDATE SET allowed = EXCLUDED.allowed;

-- Update RLS policies for catalog tables

-- Cliente table
DROP POLICY IF EXISTS "Cliente: read all" ON cliente;
DROP POLICY IF EXISTS "Cliente: admin write" ON cliente;

CREATE POLICY "Cliente: read with permission" ON cliente
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.cliente.read') OR 
  has_permission('catalogo.cliente.manage')
);

CREATE POLICY "Cliente: manage with permission" ON cliente
FOR ALL USING (
  is_admin() OR has_permission('catalogo.cliente.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.cliente.manage')
);

-- Proyecto table
DROP POLICY IF EXISTS "Proyecto: read all" ON proyecto;
DROP POLICY IF EXISTS "Proyecto: admin write" ON proyecto;

CREATE POLICY "Proyecto: read with permission" ON proyecto
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.proyecto.read') OR 
  has_permission('catalogo.proyecto.manage')
);

CREATE POLICY "Proyecto: manage with permission" ON proyecto
FOR ALL USING (
  is_admin() OR has_permission('catalogo.proyecto.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.proyecto.manage')
);

-- ClaseOrden table
DROP POLICY IF EXISTS "ClaseOrden: read all" ON claseorden;
DROP POLICY IF EXISTS "ClaseOrden: admin write" ON claseorden;

CREATE POLICY "ClaseOrden: read with permission" ON claseorden
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.claseorden.read') OR 
  has_permission('catalogo.claseorden.manage')
);

CREATE POLICY "ClaseOrden: manage with permission" ON claseorden
FOR ALL USING (
  is_admin() OR has_permission('catalogo.claseorden.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.claseorden.manage')
);

-- Operador table
DROP POLICY IF EXISTS "Operador: read all" ON operador;
DROP POLICY IF EXISTS "Operador: admin write" ON operador;

CREATE POLICY "Operador: read with permission" ON operador
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.operador.read') OR 
  has_permission('catalogo.operador.manage')
);

CREATE POLICY "Operador: manage with permission" ON operador
FOR ALL USING (
  is_admin() OR has_permission('catalogo.operador.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.operador.manage')
);

-- Plan table
DROP POLICY IF EXISTS "Plan: read all" ON plan;
DROP POLICY IF EXISTS "Plan: admin write" ON plan;

CREATE POLICY "Plan: read with permission" ON plan
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.plan.read') OR 
  has_permission('catalogo.plan.manage')
);

CREATE POLICY "Plan: manage with permission" ON plan
FOR ALL USING (
  is_admin() OR has_permission('catalogo.plan.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.plan.manage')
);

-- APN table
DROP POLICY IF EXISTS "Apn: read all" ON apn;
DROP POLICY IF EXISTS "Apn: admin write" ON apn;

CREATE POLICY "Apn: read with permission" ON apn
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.apn.read') OR 
  has_permission('catalogo.apn.manage')
);

CREATE POLICY "Apn: manage with permission" ON apn
FOR ALL USING (
  is_admin() OR has_permission('catalogo.apn.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.apn.manage')
);

-- Transportadora table
DROP POLICY IF EXISTS "Transportadora: read all" ON transportadora;
DROP POLICY IF EXISTS "Transportadora: admin write" ON transportadora;

CREATE POLICY "Transportadora: read with permission" ON transportadora
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.transportadora.read') OR 
  has_permission('catalogo.transportadora.manage')
);

CREATE POLICY "Transportadora: manage with permission" ON transportadora
FOR ALL USING (
  is_admin() OR has_permission('catalogo.transportadora.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.transportadora.manage')
);

-- MetodoDespacho table
DROP POLICY IF EXISTS "MetodoDespacho: read all" ON metododespacho;
DROP POLICY IF EXISTS "MetodoDespacho: admin write" ON metododespacho;

CREATE POLICY "MetodoDespacho: read with permission" ON metododespacho
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.metododespacho.read') OR 
  has_permission('catalogo.metododespacho.manage')
);

CREATE POLICY "MetodoDespacho: manage with permission" ON metododespacho
FOR ALL USING (
  is_admin() OR has_permission('catalogo.metododespacho.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.metododespacho.manage')
);

-- TipoPago table
DROP POLICY IF EXISTS "TipoPago: read all" ON tipopago;
DROP POLICY IF EXISTS "TipoPago: admin write" ON tipopago;

CREATE POLICY "TipoPago: read with permission" ON tipopago
FOR SELECT USING (
  is_admin() OR 
  has_permission('catalogo.tipopago.read') OR 
  has_permission('catalogo.tipopago.manage')
);

CREATE POLICY "TipoPago: manage with permission" ON tipopago
FOR ALL USING (
  is_admin() OR has_permission('catalogo.tipopago.manage')
) WITH CHECK (
  is_admin() OR has_permission('catalogo.tipopago.manage')
);