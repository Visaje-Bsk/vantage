/**
 * usePrefetchCatalogs
 *
 * Hook para precargar todos los catálogos al iniciar la aplicación.
 * Esto mejora significativamente el rendimiento del modal de órdenes
 * ya que los datos estarán en cache cuando se abra.
 *
 * Estrategia:
 * - Se ejecuta una vez al hacer login
 * - Precarga todos los catálogos en paralelo
 * - Los catálogos quedan en cache de React Query por 5 minutos
 * - Las cargas subsecuentes son instantáneas desde cache
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { catalogKeys } from "./useCatalogQueries";

export const usePrefetchCatalogs = () => {
  const queryClient = useQueryClient();

  /**
   * Precarga todos los catálogos principales en paralelo
   * Llamar después del login exitoso
   */
  const prefetchAllCatalogs = useCallback(async () => {
    console.log("[usePrefetchCatalogs] Iniciando precarga de catálogos...");
    const startTime = performance.now();

    try {
      // Ejecutar todas las precargas en paralelo
      await Promise.all([
        // Clientes
        queryClient.prefetchQuery({
          queryKey: catalogKeys.clientes(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from("cliente")
              .select("id_cliente, nombre_cliente, nit")
              .order("nombre_cliente");
            if (error) throw error;
            return data ?? [];
          },
          staleTime: 5 * 60 * 1000, // 5 minutos
        }),

        // Operadores
        queryClient.prefetchQuery({
          queryKey: catalogKeys.operadores(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from("operador")
              .select("id_operador, nombre_operador")
              .order("nombre_operador");
            if (error) throw error;
            return data ?? [];
          },
          staleTime: 5 * 60 * 1000,
        }),

        // Planes
        queryClient.prefetchQuery({
          queryKey: catalogKeys.planes(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from("plan")
              .select("id_plan, nombre_plan, id_operador")
              .order("nombre_plan");
            if (error) throw error;
            return data ?? [];
          },
          staleTime: 5 * 60 * 1000,
        }),

        // APNs
        queryClient.prefetchQuery({
          queryKey: catalogKeys.apns(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from("apn")
              .select("id_apn, apn, id_operador")
              .order("apn");
            if (error) throw error;
            return data ?? [];
          },
          staleTime: 5 * 60 * 1000,
        }),

        // Tipos de despacho
        queryClient.prefetchQuery({
          queryKey: catalogKeys.tiposDespacho(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from("tipo_despacho")
              .select("id_tipo_despacho, nombre_tipo, requiere_direccion, requiere_transportadora")
              .order("nombre_tipo");
            if (error) throw error;
            return data ?? [];
          },
          staleTime: 5 * 60 * 1000,
        }),

        // Transportadoras
        queryClient.prefetchQuery({
          queryKey: catalogKeys.transportadoras(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from("transportadora")
              .select("id_transportadora, nombre_transportadora")
              .order("nombre_transportadora");
            if (error) throw error;
            return data ?? [];
          },
          staleTime: 5 * 60 * 1000,
        }),

        // Tipos de pago
        queryClient.prefetchQuery({
          queryKey: catalogKeys.tiposPago(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from("tipo_pago")
              .select("id_tipo_pago, forma_pago, plazo, aprobado_cartera")
              .order("forma_pago");
            if (error) throw error;
            return data ?? [];
          },
          staleTime: 5 * 60 * 1000,
        }),

        // Clases de orden
        queryClient.prefetchQuery({
          queryKey: catalogKeys.clasesOrden(),
          queryFn: async () => {
            const { data, error } = await supabase
              .from("clase_orden")
              .select("id_clase_orden, tipo_orden")
              .order("tipo_orden");
            if (error) throw error;
            return data ?? [];
          },
          staleTime: 5 * 60 * 1000,
        }),
      ]);

      const endTime = performance.now();
      console.log(`[usePrefetchCatalogs] Catálogos precargados en ${(endTime - startTime).toFixed(0)}ms`);
    } catch (error) {
      console.error("[usePrefetchCatalogs] Error precargando catálogos:", error);
      // No lanzamos el error para no bloquear la app
    }
  }, [queryClient]);

  return { prefetchAllCatalogs };
};
