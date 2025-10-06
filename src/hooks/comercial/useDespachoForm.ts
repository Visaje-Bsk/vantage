/**
 * useDespachoForm
 *
 * Hook para manejar el formulario de información de despacho
 * Gestiona los datos de envío/recogida según el tipo de despacho seleccionado
 *
 * El formulario incluye:
 * - Tipo de despacho (requiere_direccion, requiere_transportadora)
 * - Dirección y ciudad (condicional)
 * - Contacto de entrega (condicional)
 * - Transportadora (condicional)
 * - Fecha y observaciones
 *
 * @example
 * const { despachoForm, updateField, resetForm } = useDespachoForm();
 * updateField("direccion", "Calle 123");
 */

import { useState, useCallback } from "react";

// Interfaz para el formulario de despacho
export interface DespachoFormData {
  id_tipo_despacho: string;
  id_transportadora: string;
  direccion: string;
  ciudad: string;
  nombre_contacto: string;
  telefono_contacto: string;
  email_contacto: string;
  fecha_despacho: string;
  observaciones: string;
}

// Valores iniciales vacíos
const INITIAL_DESPACHO_FORM: DespachoFormData = {
  id_tipo_despacho: "",
  id_transportadora: "",
  direccion: "",
  ciudad: "",
  nombre_contacto: "",
  telefono_contacto: "",
  email_contacto: "",
  fecha_despacho: "",
  observaciones: "",
};

export const useDespachoForm = () => {
  // Estado del formulario de despacho
  const [despachoForm, setDespachoForm] = useState<DespachoFormData>(INITIAL_DESPACHO_FORM);

  // ID del registro despacho_orden en BD (null si no existe)
  const [despachoOrdenId, setDespachoOrdenId] = useState<number | null>(null);

  /**
   * Actualiza un campo específico del formulario
   * @param field - Nombre del campo a actualizar
   * @param value - Nuevo valor del campo
   */
  const updateField = useCallback((field: keyof DespachoFormData, value: string) => {
    setDespachoForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Actualiza múltiples campos a la vez
   * Útil para cargar datos desde el servidor
   * @param data - Datos parciales a aplicar al formulario
   */
  const updateMultipleFields = useCallback((data: Partial<DespachoFormData>) => {
    setDespachoForm((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  /**
   * Resetea el formulario con nuevos datos completos
   * @param data - Datos completos del formulario
   */
  const resetForm = useCallback((data: DespachoFormData) => {
    setDespachoForm(data);
  }, []);

  /**
   * Limpia el formulario a valores iniciales vacíos
   */
  const clearForm = useCallback(() => {
    setDespachoForm(INITIAL_DESPACHO_FORM);
    setDespachoOrdenId(null);
  }, []);

  /**
   * Verifica si el formulario tiene valores (para determinar si guardar o no)
   * @returns true si hay al menos un valor relevante
   */
  const hasValues = useCallback(() => {
    return Boolean(
      despachoForm.id_tipo_despacho ||
        despachoForm.id_transportadora ||
        despachoForm.direccion ||
        despachoForm.ciudad ||
        despachoForm.nombre_contacto ||
        despachoForm.telefono_contacto ||
        despachoForm.email_contacto ||
        despachoForm.fecha_despacho ||
        despachoForm.observaciones
    );
  }, [despachoForm]);

  return {
    despachoForm,
    despachoOrdenId,
    updateField,
    updateMultipleFields,
    resetForm,
    clearForm,
    hasValues,
    setDespachoForm,
    setDespachoOrdenId,
  };
};
