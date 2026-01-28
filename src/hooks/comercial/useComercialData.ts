/**
 * useComercialData
 *
 * Hook para manejar la carga de datos desde Supabase para la pestaña comercial
 * Gestiona la carga de catálogos (clientes, proyectos, operadores, etc.) y datos de la orden
 *
 * OPTIMIZADO: Usa React Query para caching de catálogos
 * - Los catálogos se cachean por 5 minutos
 * - No se recargan al cambiar entre modo readonly/edit
 * - Cache compartido entre órdenes
 *
 * @param orderId - ID de la orden de pedido
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProductLine } from "./useProductLines";
import type { ServiceLine } from "./useServiceLines";
import { EquipoOption } from "@/components/catalogs/EquipoSelector";

// Importar hooks de React Query para catálogos
import {
  useClientes,
  useProyectos,
  useOperadores,
  usePlanes,
  useApns,
  useTiposDespacho,
  useTransportadoras,
  useTiposPago,
} from "@/hooks/queries/useCatalogQueries";

export const useComercialData = (orderId: number, clienteId?: string | null) => {
  // Catálogos con React Query (cacheados)
  const clientesQuery = useClientes();
  const proyectosQuery = useProyectos(clienteId ?? null);
  const operadoresQuery = useOperadores();
  const planesQuery = usePlanes();
  const apnsQuery = useApns();
  const tiposDespachoQuery = useTiposDespacho();
  const transportadorasQuery = useTransportadoras();
  const tiposPagoQuery = useTiposPago();

  // Estado de carga combinado
  const isLoadingCatalogs =
    clientesQuery.isLoading ||
    operadoresQuery.isLoading ||
    planesQuery.isLoading ||
    apnsQuery.isLoading ||
    tiposDespachoQuery.isLoading ||
    transportadorasQuery.isLoading ||
    tiposPagoQuery.isLoading;

  /**
   * Carga proyectos asociados a un cliente
   * NOTA: Con React Query, los proyectos se cargan automáticamente
   * cuando clienteId cambia. Esta función se mantiene por compatibilidad.
   * @deprecated Usar el parámetro clienteId del hook en su lugar
   */
  const loadProyectos = useCallback(async (_clienteId: string) => {
    // Los proyectos ahora se cargan automáticamente via useProyectos(clienteId)
    // Esta función se mantiene por compatibilidad con código existente
    // pero no hace nada - React Query maneja la carga
  }, []);

  /**
   * Carga todos los catálogos necesarios para modo edición
   * NOTA: Con React Query, los catálogos ya están cacheados.
   * Esta función se mantiene por compatibilidad pero no hace llamadas redundantes.
   * @deprecated Los catálogos se cargan automáticamente via React Query
   */
  const loadCatalogos = useCallback(async () => {
    // Los catálogos ya están cargados via React Query hooks
    // Esta función se mantiene por compatibilidad
    // Si los datos no están en cache, React Query los cargará automáticamente
    return Promise.resolve();
  }, []);

  /**
   * Carga el detalle de la orden (equipos y servicios)
   * @returns Object con productLines y serviceLines
   */
  const loadDetalleOrden = useCallback(async (): Promise<{
    productLines: ProductLine[];
    serviceLines: ServiceLine[];
  }> => {
    try {
      // 1) Fetch detalle_orden
      const { data: det, error: detErr } = await supabase
        .from("detalle_orden")
        .select(`
          id_orden_detalle,
          id_equipo,
          id_linea_detalle,
          id_servicio,
          id_accesorio,
          cantidad,
          valor_unitario,
          tipo_producto,
          id_orden_pedido,
          plantilla
        `)
        .eq("id_orden_pedido", orderId)
        .order("id_orden_detalle", { ascending: true });

      if (detErr) throw detErr;

      const detalles = det ?? [];

      // Separar equipos y servicios
      const equipoDetalles = detalles.filter((d) => d.id_equipo);
      const servicioDetalles = detalles.filter((d) => d.id_linea_detalle);

      // 2) Cargar equipos
      const equipoIds = equipoDetalles
        .map((d) => d.id_equipo)
        .filter((v): v is number => typeof v === "number");
      const uniqueEquipoIds = Array.from(new Set(equipoIds));

      const equiposById = new Map<
        number,
        { id_equipo: number; codigo: string | null; nombre_equipo: string | null }
      >();

      if (uniqueEquipoIds.length > 0) {
        const { data: equipos, error: eqErr } = await supabase
          .from("equipo")
          .select("id_equipo, codigo, nombre_equipo")
          .in("id_equipo", uniqueEquipoIds);

        if (eqErr) throw eqErr;
        (equipos ?? []).forEach((e) => equiposById.set(e.id_equipo, e));
      }

      // 3) Cargar líneas de servicio
      const lineaServicioIds = servicioDetalles
        .map((d) => d.id_linea_detalle)
        .filter((v): v is number => typeof v === "number");
      const uniqueLineaIds = Array.from(new Set(lineaServicioIds));

      type LineaServicioJoined = {
        id_linea_detalle: number;
        id_operador: number | null;
        id_plan: number | null;
        id_apn: number | null;
        clase_cobro: string | null;
        permanencia: string | null;
        cantidad_linea: number | null;
        operador?: { id_operador: number; nombre_operador: string } | null;
        plan?: { id_plan: number; nombre_plan: string } | null;
        apn?: { id_apn: number; apn: string } | null;
      };

      const lineasServicioById = new Map<number, LineaServicioJoined>();

      if (uniqueLineaIds.length > 0) {
        const { data: lineasServicio, error: lsErr } = await supabase
          .from("linea_servicio")
          .select(`
            id_linea_detalle,
            id_operador,
            id_plan,
            id_apn,
            clase_cobro,
            permanencia,
            cantidad_linea,
            operador:operador ( id_operador, nombre_operador ),
            plan:plan ( id_plan, nombre_plan ),
            apn:apn ( id_apn, apn )
          `)
          .in("id_linea_detalle", uniqueLineaIds);

        if (lsErr) throw lsErr;

        (lineasServicio ?? []).forEach((ls) => {
          const lsTyped = ls as unknown as LineaServicioJoined;
          if (lsTyped.id_linea_detalle) {
            lineasServicioById.set(lsTyped.id_linea_detalle, lsTyped);
          }
        });
      }

      // 4) Mapear product lines
      const productLines: ProductLine[] =
        equipoDetalles.length > 0
          ? equipoDetalles.map((d) => {
              const eq = d.id_equipo ? equiposById.get(d.id_equipo) : undefined;
              const selectedEquipo = eq
                ? ({ id_equipo: eq.id_equipo, codigo: eq.codigo, nombre_equipo: eq.nombre_equipo } as EquipoOption)
                : null;

              const detalleWithPlantilla = d as typeof d & { plantilla?: string | null; permanencia?: string | null };

              return {
                id_linea_detalle: d.id_orden_detalle,
                id_orden_detalle: d.id_orden_detalle,
                selectedEquipo,
                cantidad: d.cantidad != null ? String(d.cantidad) : "",
                cantidad_linea: "",
                valorUnitario: d.valor_unitario != null ? String(d.valor_unitario) : "",
                claseCobro: "",
                plantilla: Boolean(detalleWithPlantilla.plantilla),
                plantillaText: detalleWithPlantilla.plantilla ?? "",
                isConfirmed: true, // Los equipos que vienen de BD ya están confirmados
                permanencia: detalleWithPlantilla.permanencia ?? "",
              };
            })
          : [
              {
                id_linea_detalle: 1,
                id_orden_detalle: undefined,
                selectedEquipo: null,
                cantidad: "",
                cantidad_linea: "",
                valorUnitario: "",
                claseCobro: "",
                plantilla: false,
                plantillaText: "",
                isConfirmed: false,
                permanencia: "",
              },
            ];

      // 5) Mapear service lines
      const serviceLines: ServiceLine[] =
        servicioDetalles.length > 0
          ? servicioDetalles.map((d) => {
              const ls = d.id_linea_detalle ? lineasServicioById.get(d.id_linea_detalle) : undefined;
              return {
                id_linea_detalle: d.id_linea_detalle ?? 0,
                id_orden_detalle: d.id_orden_detalle,
                operadorId: ls?.id_operador != null ? String(ls.id_operador) : "",
                planId: ls?.id_plan != null ? String(ls.id_plan) : "",
                apnId: ls?.id_apn != null ? String(ls.id_apn) : "",
                permanencia: ls?.permanencia != null ? String(ls.permanencia) : "",
                claseCobro: (ls?.clase_cobro as any) ?? "",
                valorMensual: d.valor_unitario != null ? String(d.valor_unitario) : "",
                cantidadLineas: ls?.cantidad_linea != null ? String(ls.cantidad_linea) : "",
                isConfirmed: true, // Las líneas que vienen de BD ya están confirmadas
              };
            })
          : [
              {
                id_linea_detalle: 1,
                id_orden_detalle: undefined,
                operadorId: "",
                planId: "",
                apnId: "",
                permanencia: "",
                claseCobro: "",
                valorMensual: "",
                cantidadLineas: "",
                isConfirmed: false,
              },
            ];

      return { productLines, serviceLines };
    } catch (error) {
      console.error("Error loading detalle_orden:", error);
      throw error;
    }
  }, [orderId]);

  return {
    // Estados (datos de React Query)
    clientes: clientesQuery.data ?? [],
    proyectos: proyectosQuery.data ?? [],
    operadores: operadoresQuery.data ?? [],
    planes: planesQuery.data ?? [],
    apns: apnsQuery.data ?? [],
    tiposDespacho: tiposDespachoQuery.data ?? [],
    transportadoras: transportadorasQuery.data ?? [],
    tiposPago: tiposPagoQuery.data ?? [],

    // Estado de carga
    isLoadingCatalogs,

    // Funciones (mantenidas por compatibilidad)
    loadProyectos,
    loadCatalogos,
    loadDetalleOrden,

    // Refetch functions (para casos que necesiten forzar recarga)
    refetchClientes: clientesQuery.refetch,
    refetchProyectos: proyectosQuery.refetch,
  };
};
