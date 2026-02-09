/**
 * useUnsavedChanges
 *
 * Hook para detectar cambios sin guardar en el formulario comercial
 * Compara el estado actual con snapshots iniciales para determinar si hay cambios
 *
 * OPTIMIZADO: Usa comparación shallow en lugar de JSON.stringify para mejor rendimiento
 *
 * Detecta cambios en:
 * - Datos del formulario básico
 * - Líneas de productos
 * - Líneas de servicio
 * - Formulario de despacho
 * - Responsable seleccionado
 * - Items marcados para eliminar
 */

import { useCallback, useRef, useState, useEffect } from "react";
import type { ComercialFormData } from "./useComercialForm";
import type { ProductLine } from "./useProductLines";
import type { ServiceLine } from "./useServiceLines";
import type { DespachoFormData } from "./useDespachoForm";

// Throttle delay para evitar recálculos excesivos (ms)
const THROTTLE_DELAY = 500;

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

// Tipos para los snapshots
interface InitialSnapshot {
  formData: ComercialFormData | null;
  productLines: ProductLine[];
  serviceLines: ServiceLine[];
  despachoForm: DespachoFormData | null;
  selectedResponsable: string;
}

/**
 * Comparación shallow de objetos planos
 */
function shallowEqual<T extends object>(obj1: T | null, obj2: T | null): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1) as Array<keyof T>;
  const keys2 = Object.keys(obj2) as Array<keyof T>;

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

/**
 * Compara dos líneas de producto (campos relevantes)
 */
function compareProductLine(a: ProductLine, b: ProductLine): boolean {
  return (
    a.selectedEquipo?.id_equipo === b.selectedEquipo?.id_equipo &&
    a.cantidad === b.cantidad &&
    a.cantidad_linea === b.cantidad_linea &&
    a.valorUnitario === b.valorUnitario &&
    a.isConfirmed === b.isConfirmed &&
    a.plantilla === b.plantilla &&
    a.plantillaText === b.plantillaText &&
    a.id_orden_detalle === b.id_orden_detalle
  );
}

/**
 * Compara dos líneas de servicio (campos relevantes)
 */
function compareServiceLine(a: ServiceLine, b: ServiceLine): boolean {
  return (
    a.operadorId === b.operadorId &&
    a.planId === b.planId &&
    a.apnId === b.apnId &&
    a.permanencia === b.permanencia &&
    a.claseCobro === b.claseCobro &&
    a.valorMensual === b.valorMensual &&
    a.cantidadLineas === b.cantidadLineas &&
    a.isConfirmed === b.isConfirmed &&
    a.id_orden_detalle === b.id_orden_detalle
  );
}

/**
 * Compara arrays de líneas de producto
 */
function compareProductLines(current: ProductLine[], initial: ProductLine[]): boolean {
  if (current.length !== initial.length) return false;

  for (let i = 0; i < current.length; i++) {
    if (!compareProductLine(current[i], initial[i])) return false;
  }

  return true;
}

/**
 * Compara arrays de líneas de servicio
 */
function compareServiceLines(current: ServiceLine[], initial: ServiceLine[]): boolean {
  if (current.length !== initial.length) return false;

  for (let i = 0; i < current.length; i++) {
    if (!compareServiceLine(current[i], initial[i])) return false;
  }

  return true;
}

/**
 * Crea una copia profunda de una línea de producto
 */
function cloneProductLine(line: ProductLine): ProductLine {
  return {
    ...line,
    selectedEquipo: line.selectedEquipo ? { ...line.selectedEquipo } : null,
  };
}

/**
 * Crea una copia profunda de una línea de servicio
 */
function cloneServiceLine(line: ServiceLine): ServiceLine {
  return { ...line };
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

  // Usar ref para snapshots (evita re-renders innecesarios)
  const snapshotRef = useRef<InitialSnapshot>({
    formData: null,
    productLines: [],
    serviceLines: [],
    despachoForm: null,
    selectedResponsable: "",
  });

  // Estado throttled para hasUnsavedChanges
  const [throttledHasChanges, setThrottledHasChanges] = useState(false);
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCalculatedRef = useRef(false);

  /**
   * Establece los estados iniciales para comparación
   * Debe llamarse al entrar en modo edición
   */
  const setInitialStates = useCallback(() => {
    snapshotRef.current = {
      formData: { ...formData },
      productLines: productLines.map(cloneProductLine),
      serviceLines: serviceLines.map(cloneServiceLine),
      despachoForm: { ...despachoForm },
      selectedResponsable: selectedResponsable,
    };
  }, [formData, productLines, serviceLines, despachoForm, selectedResponsable]);

  /**
   * Limpia los snapshots iniciales
   */
  const clearInitialStates = useCallback(() => {
    snapshotRef.current = {
      formData: null,
      productLines: [],
      serviceLines: [],
      despachoForm: null,
      selectedResponsable: "",
    };
  }, []);

  /**
   * Función pura para calcular si hay cambios (sin hooks)
   */
  const calculateHasChanges = useCallback((): boolean => {
    const snapshot = snapshotRef.current;

    // Si no está en modo edición o no hay snapshots, no hay cambios
    if (!isEditMode || !snapshot.formData) return false;

    // Verificar si hay elementos marcados para eliminar (check rápido)
    if (deletedEquipoIds.length > 0 || deletedServicioIds.length > 0) return true;

    // Comparar responsable (check rápido)
    if (selectedResponsable !== snapshot.selectedResponsable) return true;

    // Comparar cantidad de líneas (check rápido)
    if (productLines.length !== snapshot.productLines.length) return true;
    if (serviceLines.length !== snapshot.serviceLines.length) return true;

    // Comparar formData (shallow)
    if (!shallowEqual(formData, snapshot.formData)) return true;

    // Comparar despachoForm (shallow)
    if (!shallowEqual(despachoForm, snapshot.despachoForm)) return true;

    // Comparar productLines (detallado)
    if (!compareProductLines(productLines, snapshot.productLines)) return true;

    // Comparar serviceLines (detallado)
    if (!compareServiceLines(serviceLines, snapshot.serviceLines)) return true;

    return false;
  }, [
    isEditMode,
    formData,
    productLines,
    serviceLines,
    despachoForm,
    selectedResponsable,
    deletedEquipoIds,
    deletedServicioIds,
  ]);

  /**
   * Efecto throttled para actualizar el estado de cambios
   * Solo recalcula después de THROTTLE_DELAY ms de inactividad
   */
  useEffect(() => {
    // Limpiar timeout anterior
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }

    // Programar recálculo
    throttleTimeoutRef.current = setTimeout(() => {
      const hasChanges = calculateHasChanges();
      if (hasChanges !== lastCalculatedRef.current) {
        lastCalculatedRef.current = hasChanges;
        setThrottledHasChanges(hasChanges);
      }
    }, THROTTLE_DELAY);

    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [calculateHasChanges]);

  return {
    hasUnsavedChanges: throttledHasChanges,
    setInitialStates,
    clearInitialStates,
    // Exponer snapshots para casos que los necesiten (readonly)
    initialFormData: snapshotRef.current.formData,
    initialProductLines: snapshotRef.current.productLines,
    initialServiceLines: snapshotRef.current.serviceLines,
    initialDespachoForm: snapshotRef.current.despachoForm,
    initialSelectedResponsable: snapshotRef.current.selectedResponsable,
  };
};
