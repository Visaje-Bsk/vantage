/**
 * useComercialSave
 *
 * Hook para manejar el guardado de datos de la pesta�a comercial
 * Prepara los datos y ejecuta la llamada RPC a Supabase
 *
 * Responsabilidades:
 * - Preparar datos de orden, despacho, equipos y servicios
 * - Ejecutar llamada RPC at�mica a la funci�n upsert_comercial_tab
 * - Manejar respuestas y errores
 * - Actualizar estados despu�s del guardado exitoso
 *
 * @example
 * const { saveComercialData, isSaving } = useComercialSave(orderId);
 * await saveComercialData({ formData, productLines, ...etc });
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import type { ComercialFormData } from "./useComercialForm";
import type { ProductLine } from "./useProductLines";
import type { ServiceLine } from "./useServiceLines";
import type { DespachoFormData } from "./useDespachoForm";
import { useLoadingState } from "../shared/useLoadingState";

type AppRole = Database["public"]["Enums"]["app_role"];

interface SaveComercialDataParams {
  formData: ComercialFormData;
  productLines: ProductLine[];
  serviceLines: ServiceLine[];
  despachoForm: DespachoFormData;
  selectedResponsable: string;
  selectedResponsableRole: AppRole | null;
  deletedEquipoIds: number[];
  deletedServicioIds: number[];
}

export const useComercialSave = (orderId: number) => {
  const { isLoading: isSaving, startLoading, stopLoading } = useLoadingState();

  /**
   * Guarda todos los datos del formulario comercial
   * Usa la funci�n RPC upsert_comercial_tab para operaci�n at�mica
   *
   * @param params - Todos los datos a guardar
   * @returns Resultado del RPC con despacho_id si se cre� uno nuevo
   */
  const saveComercialData = useCallback(
    async (params: SaveComercialDataParams): Promise<{ despacho_id?: number } | null> => {
      startLoading();

      try {
        const {
          formData,
          productLines,
          serviceLines,
          despachoForm,
          selectedResponsable,
          selectedResponsableRole,
          deletedEquipoIds,
          deletedServicioIds,
        } = params;

        // 1. Preparar datos de la orden
        // Si el proyecto es "no_aplica" o vacío, enviar "0" (null en la BD)
        const proyectoValue = formData.id_proyecto === "no_aplica" || !formData.id_proyecto
          ? "0"
          : formData.id_proyecto;

        const ordenData = {
          id_cliente: formData.id_cliente || "0",
          id_proyecto: proyectoValue,
          observaciones_orden: formData.observaciones_orden || "",
          orden_compra: formData.orden_compra || "",
          // Campos de pago desde despachoForm
          pago_flete: despachoForm.pago_flete || "",
          id_tipo_pago: despachoForm.id_tipo_pago || "0",
        };

        // 2. Preparar datos de despacho
        const hasDespachoValues = Boolean(
          despachoForm.id_tipo_despacho || despachoForm.id_transportadora || despachoForm.observaciones
        );

        const despachoData = {
          has_values: hasDespachoValues.toString(),
          id_tipo_despacho: despachoForm.id_tipo_despacho || "0",
          id_transportadora: despachoForm.id_transportadora || "0",
          direccion: despachoForm.direccion || "",
          ciudad: despachoForm.ciudad || "",
          nombre_contacto: despachoForm.nombre_contacto || "",
          telefono_contacto: despachoForm.telefono_contacto || "",
          email_contacto: despachoForm.email_contacto || "",
          email_contacto2: despachoForm.email_contacto2 || "",
          email_contacto3: despachoForm.email_contacto3 || "",
          observaciones: despachoForm.observaciones || "",
        };

        // 3. Preparar equipos válidos
        console.log("[useComercialSave] productLines recibidos:", productLines);

        const validProductLines = productLines.filter(
          (l) =>
            l.selectedEquipo &&
            l.selectedEquipo.id_equipo &&
            l.cantidad &&
            Number(l.cantidad) > 0 &&
            l.valorUnitario &&
            Number(l.valorUnitario) > 0
        );

        console.log("[useComercialSave] productLines válidos después del filtro:", validProductLines);

        const equiposData = validProductLines.map((line) => ({
          id_orden_detalle: line.id_orden_detalle || 0,
          id_equipo: line.selectedEquipo!.id_equipo,
          cantidad: line.cantidad,
          cantidad_linea: line.cantidad_linea || "",
          valor_unitario: line.valorUnitario,
          plantilla: line.plantilla && line.plantillaText ? line.plantillaText : "",
          permanencia: line.permanencia || "",
        }));

        console.log("[useComercialSave] equiposData a enviar al RPC:", equiposData);

        // 4. Preparar servicios v�lidos
        const validServicios = serviceLines.filter(
          (sl) =>
            sl.operadorId &&
            sl.planId &&
            sl.apnId &&
            sl.claseCobro &&
            sl.valorMensual &&
            sl.permanencia &&
            Number(sl.permanencia) >= 1 &&
            Number(sl.permanencia) <= 36
        );

        const serviciosData = validServicios.map((sl) => ({
          id_orden_detalle: sl.id_orden_detalle || 0,
          id_linea_detalle: sl.id_linea_detalle || 0,
          id_operador: sl.operadorId,
          id_plan: sl.planId,
          id_apn: sl.apnId,
          clase_cobro: sl.claseCobro,
          permanencia: sl.permanencia,
          valor_mensual: sl.valorMensual,
          cantidad_linea: sl.cantidadLineas,
          es_backup: sl.esBackup ?? false,
        }));

        // 5. Llamar a la función RPC atómica
        console.log("[useComercialSave] Llamando RPC upsert_comercial_tab con:", {
          p_orden_id: orderId,
          p_orden_data: ordenData,
          p_despacho_data: despachoData,
          p_responsable_user_id: selectedResponsable || null,
          p_responsable_role: selectedResponsable ? selectedResponsableRole : null,
          p_equipos: equiposData,
          p_servicios: serviciosData,
          p_deleted_equipos: deletedEquipoIds,
          p_deleted_servicios: deletedServicioIds,
        });

        const { data: result, error: rpcError } = await supabase.rpc("upsert_comercial_tab", {
          p_orden_id: orderId,
          p_orden_data: ordenData,
          p_despacho_data: despachoData,
          p_responsable_user_id: selectedResponsable || null,
          p_responsable_role: selectedResponsable ? selectedResponsableRole : null,
          p_equipos: equiposData,
          p_servicios: serviciosData,
          p_deleted_equipos: deletedEquipoIds,
          p_deleted_servicios: deletedServicioIds,
        });

        console.log("[useComercialSave] Resultado RPC:", { result, rpcError });

        if (rpcError) throw rpcError;

        toast.success("Datos guardados correctamente");
        // Castear el resultado a nuestro tipo esperado
        const typedResult = result as unknown as { despacho_id?: number };
        return typedResult;
      } catch (error) {
        console.error("Error al guardar:", error);
        toast.error("Error al guardar los datos");
        return null;
      } finally {
        stopLoading();
      }
    },
    [orderId, startLoading, stopLoading]
  );

  return {
    saveComercialData,
    isSaving,
  };
};
