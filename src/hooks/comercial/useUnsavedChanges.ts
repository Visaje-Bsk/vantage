/**
 * useUnsavedChanges
 *
 * Hook para detectar cambios sin guardar en el formulario comercial
 * Compara el estado actual con snapshots iniciales para determinar si hay cambios
 *
 * Detecta cambios en:
 * - Datos del formulario básico
 * - Líneas de productos
 * - Líneas de servicio
 * - Formulario de despacho
 * - Responsable seleccionado
 * - Items marcados para eliminar
 *
 * @example
 * const { hasUnsavedChanges, setInitialStates } = useUnsavedChanges({
 *   formData, productLines, serviceLines, despachoForm, selectedResponsable,
 *   deletedEquipoIds, deletedServicioIds
 * });
 */

import { useMemo, useCallback, useState, useEffect } from "react";
import type { ComercialFormData } from "./useComercialForm";
import type { ProductLine } from "./useProductLines";
import type { ServiceLine } from "./useServiceLines";
import type { DespachoFormData } from "./useDespachoForm";

interface UnsavedChangesProps {
  isEditMode: boolean;
  formData: ComercialFormData;
  productLines: ProductLine[];
  serviceLines: ServiceLine[];
  despachoForm: DespachoFormData;
  selectedResponsable: string;
  deletedEquipoIds: number[];
  deletedServicioIds: number[];
}

export const useUnsavedChanges = (props: UnsavedChangesProps) => {
  const {
    isEditMode,
    formData,
    productLines,
    serviceLines,
    despachoForm,
    selectedResponsable,
    deletedEquipoIds,
    deletedServicioIds,
  } = props;

  // Snapshots de estados iniciales
  const [initialFormData, setInitialFormData] = useState<ComercialFormData | null>(null);
  const [initialProductLines, setInitialProductLines] = useState<ProductLine[]>([]);
  const [initialServiceLines, setInitialServiceLines] = useState<ServiceLine[]>([]);
  const [initialDespachoForm, setInitialDespachoForm] = useState<DespachoFormData | null>(null);
  const [initialSelectedResponsable, setInitialSelectedResponsable] = useState<string>("");

  /**
   * Establece los estados iniciales para comparación
   * Debe llamarse al entrar en modo edición
   */
  const setInitialStates = useCallback(() => {
    setInitialFormData({ ...formData });
    setInitialProductLines(JSON.parse(JSON.stringify(productLines)));
    setInitialServiceLines(JSON.parse(JSON.stringify(serviceLines)));
    setInitialDespachoForm({ ...despachoForm });
    setInitialSelectedResponsable(selectedResponsable);
  }, [formData, productLines, serviceLines, despachoForm, selectedResponsable]);

  /**
   * Limpia los snapshots iniciales
   */
  const clearInitialStates = useCallback(() => {
    setInitialFormData(null);
    setInitialProductLines([]);
    setInitialServiceLines([]);
    setInitialDespachoForm(null);
    setInitialSelectedResponsable("");
  }, []);

  /**
   * Calcula si hay cambios sin guardar
   * Compara todos los estados actuales con los snapshots iniciales
   */
  const hasUnsavedChanges = useMemo(() => {
    // Si no está en modo edición o no hay snapshots, no hay cambios
    if (!isEditMode || !initialFormData) return false;

    // Comparar formData
    const formDataChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);

    // Comparar productLines (excluir id_linea_detalle que es solo para UI)
    const productLinesChanged =
      JSON.stringify(productLines.map(({ id_linea_detalle, ...rest }) => rest)) !==
      JSON.stringify(initialProductLines.map(({ id_linea_detalle, ...rest }) => rest));

    // Comparar serviceLines
    const serviceLinesChanged =
      JSON.stringify(serviceLines.map(({ id_linea_detalle, ...rest }) => rest)) !==
      JSON.stringify(initialServiceLines.map(({ id_linea_detalle, ...rest }) => rest));

    // Comparar despachoForm
    const despachoFormChanged = JSON.stringify(despachoForm) !== JSON.stringify(initialDespachoForm);

    // Comparar selectedResponsable
    const responsableChanged = selectedResponsable !== initialSelectedResponsable;

    // Verificar si hay elementos marcados para eliminar
    const hasDeletedItems = deletedEquipoIds.length > 0 || deletedServicioIds.length > 0;

    return (
      formDataChanged ||
      productLinesChanged ||
      serviceLinesChanged ||
      despachoFormChanged ||
      responsableChanged ||
      hasDeletedItems
    );
  }, [
    isEditMode,
    formData,
    initialFormData,
    productLines,
    initialProductLines,
    serviceLines,
    initialServiceLines,
    despachoForm,
    initialDespachoForm,
    selectedResponsable,
    initialSelectedResponsable,
    deletedEquipoIds,
    deletedServicioIds,
  ]);

  return {
    hasUnsavedChanges,
    setInitialStates,
    clearInitialStates,
    initialFormData,
    initialProductLines,
    initialServiceLines,
    initialDespachoForm,
    initialSelectedResponsable,
  };
};
