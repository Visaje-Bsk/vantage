/**
 * useComercialForm
 *
 * Hook para manejar el formulario básico de la pestaña comercial
 * Gestiona los campos: cliente, proyecto, orden de compra y observaciones
 *
 * @param order - Orden de pedido inicial con datos existentes
 *
 * @example
 * const { formData, updateField, resetForm } = useComercialForm(order);
 * updateField("id_cliente", "123");
 */

import { useCallback, useState } from "react";
import { OrdenKanban } from "@/types/kanban";

// Interfaz para los datos del formulario comercial
export interface ComercialFormData {
  id_cliente: string;
  id_proyecto: string;
  observaciones_orden: string;
  orden_compra: string;
  id_clase_orden?: string;
  id_tipo_servicio?: string;
}

export const useComercialForm = (order: OrdenKanban) => {
  // Estado del formulario con valores iniciales de la orden
  const [formData, setFormData] = useState<ComercialFormData>({
    id_cliente: order.id_cliente?.toString() || "",
    id_proyecto: order.id_proyecto?.toString() || "",
    observaciones_orden: order.observaciones_orden || "",
    orden_compra: order.orden_compra || "",
    id_clase_orden: order.id_clase_orden?.toString(),
    id_tipo_servicio: order.id_tipo_servicio?.toString() || "",
  });

  /**
   * Actualiza un campo específico del formulario
   * @param field - Nombre del campo a actualizar
   * @param value - Nuevo valor del campo
   */
  const updateField = useCallback((field: keyof ComercialFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Resetea el formulario con nuevos datos parciales
   * Útil para cargar datos desde el servidor
   * @param data - Datos parciales a aplicar al formulario
   */
  const resetForm = useCallback((data: Partial<ComercialFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  /**
   * Resetea completamente el formulario a valores iniciales
   */
  const clearForm = useCallback(() => {
    setFormData({
      id_cliente: "",
      id_proyecto: "",
      observaciones_orden: order.observaciones_orden || "",
      orden_compra: order.orden_compra || "",
    });
  }, [order.observaciones_orden, order.orden_compra]);

  return {
    formData,
    updateField,
    resetForm,
    clearForm,
    setFormData,
  };
};