/**
 * useComercialData
 *
 * Hook para manejar la carga de datos desde Supabase para la pesta�a comercial
 * Gestiona la carga de cat�logos (clientes, proyectos, operadores, etc.) y datos de la orden
 *
 * Responsabilidades:
 * - Cargar cat�logos necesarios (clientes, proyectos, operadores, planes, apns, transportadoras, tipos despacho)
 * - Cargar datos existentes de la orden
 * - Cargar detalles de orden (equipos y servicios)
 * - Cargar responsables asignados
 *
 * @param orderId - ID de la orden de pedido
 *
 * @example
 * const { loadInitialData, loadEditData, clientes, proyectos } = useComercialData(orderId);
 * await loadInitialData();
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Cliente, Proyecto } from "@/types/kanban";
import type { ProductLine } from "./useProductLines";
import type { ServiceLine } from "./useServiceLines";
import { EquipoOption } from "@/components/catalogs/EquipoSelector";

type AppRole = Database["public"]["Enums"]["app_role"];

export const useComercialData = (orderId: number) => {
  // Cat �logos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [operadores, setOperadores] = useState<Array<Database["public"]["Tables"]["operador"]["Row"]>>([]);
  const [planes, setPlanes] = useState<Array<Database["public"]["Tables"]["plan"]["Row"]>>([]);
  const [apns, setApns] = useState<Array<Database["public"]["Tables"]["apn"]["Row"]>>([]);
  const [tiposDespacho, setTiposDespacho] = useState<Array<Database["public"]["Tables"]["tipo_despacho"]["Row"]>>([]);
  const [transportadoras, setTransportadoras] = useState<Array<Database["public"]["Tables"]["transportadora"]["Row"]>>(
    []
  );

  /**
   * Carga proyectos asociados a un cliente
   * @param clienteId - ID del cliente
   */
  const loadProyectos = useCallback(async (clienteId: string) => {
    if (!clienteId) {
      setProyectos([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("proyecto")
        .select("*")
        .eq("id_cliente", parseInt(clienteId))
        .order("nombre_proyecto");

      if (error) throw error;
      setProyectos(data ?? []);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProyectos([]);
    }
  }, []);

  /**
   * Carga todos los cat�logos necesarios para modo edici�n
   */
  const loadCatalogos = useCallback(async () => {
    try {
      const [
        clientesRes,
        operadoresRes,
        planesRes,
        apnsRes,
        tiposDespachoRes,
        transportadorasRes,
      ] = await Promise.all([
        supabase.from("cliente").select("*").order("nombre_cliente"),
        supabase.from("operador").select("*").order("nombre_operador"),
        supabase.from("plan").select("*").order("nombre_plan"),
        supabase.from("apn").select("*").order("apn"),
        supabase.from("tipo_despacho").select("*").order("nombre_tipo"),
        supabase.from("transportadora").select("*").order("nombre_transportadora"),
      ]);

      if (clientesRes.error) throw clientesRes.error;
      if (operadoresRes.error) throw operadoresRes.error;
      if (planesRes.error) throw planesRes.error;
      if (apnsRes.error) throw apnsRes.error;
      if (tiposDespachoRes.error) throw tiposDespachoRes.error;
      if (transportadorasRes.error) throw transportadorasRes.error;

      setClientes(clientesRes.data ?? []);
      setOperadores(operadoresRes.data ?? []);
      setPlanes(planesRes.data ?? []);
      setApns(apnsRes.data ?? []);
      setTiposDespacho(tiposDespachoRes.data ?? []);
      setTransportadoras(transportadorasRes.data ?? []);
    } catch (error) {
      console.error("Error loading catalogos:", error);
      throw error;
    }
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

      // 3) Cargar l�neas de servicio
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

              const detalleWithPlantilla = d as typeof d & { plantilla?: string | null };

              return {
                id_linea_detalle: d.id_orden_detalle,
                id_orden_detalle: d.id_orden_detalle,
                selectedEquipo,
                cantidad: d.cantidad != null ? String(d.cantidad) : "",
                valorUnitario: d.valor_unitario != null ? String(d.valor_unitario) : "",
                claseCobro: "",
                plantilla: Boolean(detalleWithPlantilla.plantilla),
                plantillaText: detalleWithPlantilla.plantilla ?? "",
              };
            })
          : [
              {
                id_linea_detalle: 1,
                id_orden_detalle: undefined,
                selectedEquipo: null,
                cantidad: "",
                valorUnitario: "",
                claseCobro: "",
                plantilla: false,
                plantillaText: "",
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
              },
            ];

      return { productLines, serviceLines };
    } catch (error) {
      console.error("Error loading detalle_orden:", error);
      throw error;
    }
  }, [orderId]);

  return {
    // Estados
    clientes,
    proyectos,
    operadores,
    planes,
    apns,
    tiposDespacho,
    transportadoras,

    // Funciones
    loadProyectos,
    loadCatalogos,
    loadDetalleOrden,

    // Setters (para casos especiales)
    setClientes,
    setProyectos,
    setOperadores,
    setPlanes,
    setApns,
    setTiposDespacho,
    setTransportadoras,
  };
};
