-- Migración: Índices trigram para búsqueda eficiente en tabla equipo
-- Mejora el rendimiento de búsquedas ILIKE en código y nombre_equipo
--
-- Beneficio esperado: Reducción de ~50ms a <10ms en búsquedas
--
-- NOTA: No usar CONCURRENTLY en Supabase Dashboard (no soporta transacciones)

-- Habilitar extensión pg_trgm si no existe
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice GIN trigram para búsquedas ILIKE en código
CREATE INDEX IF NOT EXISTS idx_equipo_codigo_trgm
  ON equipo USING gin (codigo gin_trgm_ops);

-- Índice GIN trigram para búsquedas ILIKE en nombre_equipo
CREATE INDEX IF NOT EXISTS idx_equipo_nombre_trgm
  ON equipo USING gin (nombre_equipo gin_trgm_ops);

-- Índice compuesto para ordenamiento por código (usado en EquipoSelector)
CREATE INDEX IF NOT EXISTS idx_equipo_codigo_asc
  ON equipo (codigo ASC NULLS LAST);
