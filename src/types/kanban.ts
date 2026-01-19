// src/types/kanban.ts
import type { Database } from "@/integrations/supabase/types";

/** Enums reales de la BD */
export type AppRole        = Database["public"]["Enums"]["app_role"];
export type FaseOrdenDB    = Database["public"]["Enums"]["fase_orden_enum"];
export type EstatusOrdenDB = Database["public"]["Enums"]["estatus_orden_enum"];

/** Claves de columnas/pestañas del Kanban (UI) - Orden del flujo */
export type OrdenStageUI =
  | "comercial"
  | "inventarios"
  | "produccion"
  | "financiera"    // financiera viene después de producción
  | "facturacion"   // facturación viene después de financiera
  | "logistica";    // logística es la fase final

/** Mapeo UI → fase (BD) - Orden del nuevo flujo */
export const UI_TO_FASE: Record<OrdenStageUI, FaseOrdenDB> = {
  comercial: "comercial",
  inventarios: "inventarios",
  produccion: "produccion",
  financiera: "financiera",
  facturacion: "facturacion",
  logistica: "logistica",
};

/** Mapeo fase (BD) → UI (para posicionar en una columna) - Orden del nuevo flujo */
export const FASE_TO_UI: Record<FaseOrdenDB, OrdenStageUI> = {
  comercial: "comercial",
  inventarios: "inventarios",
  produccion: "produccion",
  financiera: "financiera",
  facturacion: "facturacion",
  logistica: "logistica",
};

/** Helper: pasar de fase BD a columna UI */
export const faseDbToUi = (fase: FaseOrdenDB): OrdenStageUI => FASE_TO_UI[fase];

/** Config visual por columna UI (label y color) - Orden del nuevo flujo */
export const STAGE_UI: Record<
  OrdenStageUI,
  { label: string; color: string; bgColor: string; borderColor: string; icon?: any }
> = {
  comercial: {
    label: "Comercial",
    color: "bg-red-500 text-white",
    bgColor: "bg-red-50",
    borderColor: "border-red-700"
  },
  inventarios: {
    label: "Inventarios",
    color: "bg-yellow-500 text-white",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-600"
  },
  produccion: {
    label: "Producción",
    color: "bg-cyan-400 text-white",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-500"
  },
  financiera: {
    label: "Financiera",
    color: "bg-yellow-600 text-white",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-500"
  },
  facturacion: {
    label: "Facturación",
    color: "bg-blue-900 text-white",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-900"
  },
  logistica: {
    label: "Logística",
    color: "bg-green-700 text-white",
    bgColor: "bg-green-50",
    borderColor: "border-green-700"
  },
};

/** Badge visual por estatus (ciclo de vida) */
export const estatusBadge: Record<
  EstatusOrdenDB,
  { label: string; color: string }
> = {
  borrador:  { label: "Borrador",  color: "bg-muted text-muted-foreground" },
  abierta:   { label: "Abierta",   color: "bg-primary text-primary-foreground" },
  enviada:   { label: "Enviada",   color: "bg-success text-success-foreground" },
  facturada: { label: "Facturada", color: "bg-secondary text-secondary-foreground" },
  cerrada:   { label: "Cerrada",   color: "bg-muted text-muted-foreground" },
  anulada:   { label: "Anulada",   color: "bg-muted text-muted-foreground" },
};

/** Entidades que usas en el tablero */
export interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  nit: string;
}

export interface Proyecto {
  id_proyecto: number;
  nombre_proyecto: string;
  descripcion_proyecto?: string;
  id_cliente: number;
}

/** Orden tal como la consume el Kanban/Modal */
export interface OrdenKanban {
  id_orden_pedido: number;
  consecutivo: string | null;
  consecutivo_code?: string | null;
  nombre_cliente: string;
  tipo_orden?: string;

  // NUEVO: separados
  fase: FaseOrdenDB;
  estatus: EstatusOrdenDB;

  fecha_modificacion: string | null;
  fecha_creacion: string | null;
  observaciones_orden?: string | null;
  orden_compra?: string | null;
  proyecto_nombre?: string;
  nombre_tipo_servicio?: string | null;
  
  // Campos adicionales para Data Gates
  id_cliente?: number;
  id_clase_orden?: number;
  id_tipo_servicio?: number;
  id_ingeniero_asignado?: string | null;
  id_tipo_despacho?: number | null;

  detalles?: Array<{
    cantidad: number;
    valor_unitario: number;
    descripcion?: string;
    equipo?: {
      nombre_equipo: string;
      codigo: string;
    };
  }>;
  created_by?: string;

  // solo para mostrar (si lo usas en la tarjeta)
  comercial_encargado?: string;
}

/** Estructura de columna del Kanban */
export interface KanbanColumnType {
  id: OrdenStageUI;
  title: string;
  description: string;
  color: string;
  bgColor?: string;
  borderColor?: string;
  orders: OrdenKanban[];
}

/** (Opcional) rol requerido para editar en cada fase (útil en UI; RLS ya lo refuerza) */
export const REQUIRED_ROLE_BY_FASE: Record<FaseOrdenDB, AppRole> = {
  comercial: "comercial",
  inventarios: "inventarios",
  produccion: "produccion",
  financiera: "financiera",
  facturacion: "facturacion",
  logistica: "logistica",
};

/** (Opcional) saber si un estatus es terminal para bloquear acciones en UI */
export const isTerminalEstatus = (e: EstatusOrdenDB) =>
  e === "cerrada" || e === "anulada";
