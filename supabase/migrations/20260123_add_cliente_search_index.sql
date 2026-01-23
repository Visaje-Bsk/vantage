-- Migración: Índices trigram para búsqueda eficiente en tabla cliente
-- Mejora el rendimiento de búsquedas ILIKE en nombre_cliente y nit
--
-- Beneficio esperado: Reducción de ~50ms a <10ms en búsquedas
--
-- NOTA: No usar CONCURRENTLY en Supabase Dashboard (no soporta transacciones)

-- Habilitar extensión pg_trgm si no existe (ya debería estar habilitada)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice GIN trigram para búsquedas ILIKE en nombre_cliente
CREATE INDEX IF NOT EXISTS idx_cliente_nombre_trgm
  ON cliente USING gin (nombre_cliente gin_trgm_ops);

-- Índice GIN trigram para búsquedas ILIKE en nit
CREATE INDEX IF NOT EXISTS idx_cliente_nit_trgm
  ON cliente USING gin (nit gin_trgm_ops);

-- Índice compuesto para ordenamiento por nombre (usado en ClienteSelector)
CREATE INDEX IF NOT EXISTS idx_cliente_nombre_asc
  ON cliente (nombre_cliente ASC NULLS LAST);
