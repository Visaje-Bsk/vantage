/**
 * useMemoizedCatalogs
 *
 * Hook para memoizar catálogos filtrados y evitar recálculos en cada render.
 * Los filtros de planes y APNs por operador se cachean para mejorar rendimiento.
 */

import { useMemo } from "react";
import type { Database } from "@/integrations/supabase/types";

type PlanRow = Database["public"]["Tables"]["plan"]["Row"];
type ApnRow = Database["public"]["Tables"]["apn"]["Row"];

interface UseMemoizedCatalogsProps {
  planes: PlanRow[];
  apns: ApnRow[];
}

/**
 * Hook que devuelve versiones memoizadas de los catálogos con funciones de filtrado cacheadas
 */
export const useMemoizedCatalogs = ({ planes, apns }: UseMemoizedCatalogsProps) => {
  // Crear un mapa de planes por operador (O(1) lookup)
  const planesByOperador = useMemo(() => {
    const map = new Map<string, PlanRow[]>();
    planes.forEach((plan) => {
      const key = plan.id_operador?.toString() ?? "";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(plan);
    });
    return map;
  }, [planes]);

  // Crear un mapa de APNs por operador (O(1) lookup)
  const apnsByOperador = useMemo(() => {
    const map = new Map<string, ApnRow[]>();
    apns.forEach((apn) => {
      const key = apn.id_operador?.toString() ?? "";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(apn);
    });
    return map;
  }, [apns]);

  /**
   * Obtiene planes filtrados por operador (O(1))
   */
  const getPlanesByOperador = (operadorId: string): PlanRow[] => {
    return planesByOperador.get(operadorId) ?? [];
  };

  /**
   * Obtiene APNs filtrados por operador (O(1))
   */
  const getApnsByOperador = (operadorId: string): ApnRow[] => {
    return apnsByOperador.get(operadorId) ?? [];
  };

  return {
    planesByOperador,
    apnsByOperador,
    getPlanesByOperador,
    getApnsByOperador,
  };
};
