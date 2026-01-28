/**
 * useCatalogQueries
 *
 * Hooks de React Query para caching de catálogos.
 * Los catálogos se cachean por 5 minutos ya que cambian poco.
 *
 * Beneficios:
 * - Reduce llamadas a Supabase de 12-14 a 3-4 por sesión
 * - Cache compartido entre componentes/tabs
 * - Revalidación automática en focus
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Tipos
type ClienteRow = Database["public"]["Tables"]["cliente"]["Row"];
type ProyectoRow = Database["public"]["Tables"]["proyecto"]["Row"];
type OperadorRow = Database["public"]["Tables"]["operador"]["Row"];
type PlanRow = Database["public"]["Tables"]["plan"]["Row"];
type ApnRow = Database["public"]["Tables"]["apn"]["Row"];
type TipoDespachoRow = Database["public"]["Tables"]["tipo_despacho"]["Row"];
type TransportadoraRow = Database["public"]["Tables"]["transportadora"]["Row"];
type TipoPagoRow = Database["public"]["Tables"]["tipo_pago"]["Row"];

// Query keys centralizados para invalidación
export const catalogKeys = {
  all: ["catalogs"] as const,
  clientes: () => [...catalogKeys.all, "clientes"] as const,
  proyectos: (clienteId: number | string | null) =>
    [...catalogKeys.all, "proyectos", clienteId] as const,
  operadores: () => [...catalogKeys.all, "operadores"] as const,
  planes: () => [...catalogKeys.all, "planes"] as const,
  apns: () => [...catalogKeys.all, "apns"] as const,
  tiposDespacho: () => [...catalogKeys.all, "tipos-despacho"] as const,
  transportadoras: () => [...catalogKeys.all, "transportadoras"] as const,
  tiposPago: () => [...catalogKeys.all, "tipos-pago"] as const,
  clasesOrden: () => [...catalogKeys.all, "clases-orden"] as const,
};

// staleTime: 5 minutos (catálogos cambian poco)
const CATALOG_STALE_TIME = 5 * 60 * 1000;

/**
 * Hook para cargar clientes
 */
export function useClientes() {
  return useQuery({
    queryKey: catalogKeys.clientes(),
    queryFn: async (): Promise<ClienteRow[]> => {
      const { data, error } = await supabase
        .from("cliente")
        .select("id_cliente, nombre_cliente, nit")
        .order("nombre_cliente");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

/**
 * Hook para cargar proyectos de un cliente específico
 */
export function useProyectos(clienteId: number | string | null) {
  const parsedId = clienteId ? parseInt(String(clienteId)) : null;

  return useQuery({
    queryKey: catalogKeys.proyectos(parsedId),
    queryFn: async (): Promise<ProyectoRow[]> => {
      if (!parsedId) return [];

      const { data, error } = await supabase
        .from("proyecto")
        .select("id_proyecto, nombre_proyecto, id_cliente")
        .eq("id_cliente", parsedId)
        .order("nombre_proyecto");

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!parsedId,
    staleTime: CATALOG_STALE_TIME,
  });
}

/**
 * Hook para cargar operadores
 */
export function useOperadores() {
  return useQuery({
    queryKey: catalogKeys.operadores(),
    queryFn: async (): Promise<OperadorRow[]> => {
      const { data, error } = await supabase
        .from("operador")
        .select("id_operador, nombre_operador")
        .order("nombre_operador");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

/**
 * Hook para cargar planes
 */
export function usePlanes() {
  return useQuery({
    queryKey: catalogKeys.planes(),
    queryFn: async (): Promise<PlanRow[]> => {
      const { data, error } = await supabase
        .from("plan")
        .select("id_plan, nombre_plan, id_operador")
        .order("nombre_plan");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

/**
 * Hook para cargar APNs
 */
export function useApns() {
  return useQuery({
    queryKey: catalogKeys.apns(),
    queryFn: async (): Promise<ApnRow[]> => {
      const { data, error } = await supabase
        .from("apn")
        .select("id_apn, apn, id_operador")
        .order("apn");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

/**
 * Hook para cargar tipos de despacho
 */
export function useTiposDespacho() {
  return useQuery({
    queryKey: catalogKeys.tiposDespacho(),
    queryFn: async (): Promise<TipoDespachoRow[]> => {
      const { data, error } = await supabase
        .from("tipo_despacho")
        .select("id_tipo_despacho, nombre_tipo, requiere_direccion, requiere_transportadora")
        .order("nombre_tipo");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

/**
 * Hook para cargar transportadoras
 */
export function useTransportadoras() {
  return useQuery({
    queryKey: catalogKeys.transportadoras(),
    queryFn: async (): Promise<TransportadoraRow[]> => {
      const { data, error } = await supabase
        .from("transportadora")
        .select("id_transportadora, nombre_transportadora")
        .order("nombre_transportadora");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

/**
 * Hook para cargar tipos de pago
 */
export function useTiposPago() {
  return useQuery({
    queryKey: catalogKeys.tiposPago(),
    queryFn: async (): Promise<TipoPagoRow[]> => {
      const { data, error } = await supabase
        .from("tipo_pago")
        .select("id_tipo_pago, forma_pago, plazo, aprobado_cartera")
        .order("forma_pago");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

// Tipo para clase_orden
export interface ClaseOrdenRow {
  id_clase_orden: number;
  tipo_orden: string;
}

/**
 * Hook para cargar clases de orden
 */
export function useClasesOrden() {
  return useQuery({
    queryKey: catalogKeys.clasesOrden(),
    queryFn: async (): Promise<ClaseOrdenRow[]> => {
      const { data, error } = await supabase
        .from("clase_orden")
        .select("id_clase_orden, tipo_orden")
        .order("tipo_orden");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: CATALOG_STALE_TIME,
  });
}

/**
 * Hook combinado para cargar todos los catálogos a la vez
 * Útil para precargar datos al entrar en modo edición
 */
export function useAllCatalogs() {
  const clientes = useClientes();
  const operadores = useOperadores();
  const planes = usePlanes();
  const apns = useApns();
  const tiposDespacho = useTiposDespacho();
  const transportadoras = useTransportadoras();
  const tiposPago = useTiposPago();

  const isLoading =
    clientes.isLoading ||
    operadores.isLoading ||
    planes.isLoading ||
    apns.isLoading ||
    tiposDespacho.isLoading ||
    transportadoras.isLoading ||
    tiposPago.isLoading;

  const isError =
    clientes.isError ||
    operadores.isError ||
    planes.isError ||
    apns.isError ||
    tiposDespacho.isError ||
    transportadoras.isError ||
    tiposPago.isError;

  return {
    clientes: clientes.data ?? [],
    operadores: operadores.data ?? [],
    planes: planes.data ?? [],
    apns: apns.data ?? [],
    tiposDespacho: tiposDespacho.data ?? [],
    transportadoras: transportadoras.data ?? [],
    tiposPago: tiposPago.data ?? [],
    isLoading,
    isError,
  };
}
