/**
 * useServiceLines
 *
 * Hook para manejar las líneas de servicio (operador, plan, APN) en la pestaña comercial
 * Gestiona CRUD de servicios, validaciones y tracking de eliminaciones
 *
 * Cada línea de servicio incluye:
 * - Operador (ID)
 * - Plan (ID)
 * - APN (ID)
 * - Permanencia en meses (1-36)
 * - Clase de cobro (mensual/anual)
 * - Valor mensual
 *
 * @example
 * const { serviceLines, addLine, removeLine, updateLine } = useServiceLines();
 * addLine(); // Agrega nueva línea vacía
 * updateLine(1, "operadorId", "123"); // Actualiza operador de línea 1
 */

import { useState, useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";

type ClaseCobro = Database["public"]["Enums"]["clase_cobro"];

// Interfaz para una línea de servicio
export interface ServiceLine {
  id_linea_detalle: number; // ID local para UI (temporal)
  id_orden_detalle?: number; // ID de BD (si existe en BD)
  operadorId: string;
  planId: string;
  apnId: string;
  permanencia: string; // Meses de permanencia (1-36)
  claseCobro: ClaseCobro | "";
  valorMensual: string;
  cantidadLineas: string; // Cantidad de líneas
  esBackup: boolean; // Si es línea de backup (no facturable)
  isConfirmed: boolean; // Indica si la línea fue confirmada por el usuario
}

// Línea de servicio inicial vacía
const INITIAL_SERVICE_LINE: ServiceLine = {
  id_linea_detalle: 1,
  id_orden_detalle: undefined,
  operadorId: "",
  planId: "",
  apnId: "",
  permanencia: "",
  claseCobro: "",
  valorMensual: "",
  cantidadLineas: "",
  esBackup: false,
  isConfirmed: false,
};

export const useServiceLines = () => {
  // Estado de líneas de servicio
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([INITIAL_SERVICE_LINE]);

  // IDs de servicios marcados para eliminar (se procesan al guardar)
  const [deletedServiceIds, setDeletedServiceIds] = useState<number[]>([]);

  /**
   * Agrega una nueva línea de servicio vacía
   * Genera un nuevo ID único basado en el máximo ID existente
   */
  const addLine = useCallback(() => {
    const newId =
      serviceLines.length > 0 ? Math.max(...serviceLines.map((line) => line.id_linea_detalle)) + 1 : 1;
    setServiceLines([...serviceLines, { ...INITIAL_SERVICE_LINE, id_linea_detalle: newId }]);
  }, [serviceLines]);

  /**
   * Elimina una línea de servicio
   * Si la línea existe en BD (tiene id_orden_detalle), la marca para eliminación
   * @param id - ID local de la línea a eliminar
   */
  const removeLine = useCallback(
    (id: number) => {
      const lineToRemove = serviceLines.find((line) => line.id_linea_detalle === id);

      // Si existe en BD, marcarla para eliminación
      if (lineToRemove?.id_orden_detalle) {
        setDeletedServiceIds((prev) => [...prev, lineToRemove.id_orden_detalle!]);
      }

      // Eliminar de la lista local
      setServiceLines((prev) => prev.filter((line) => line.id_linea_detalle !== id));
    },
    [serviceLines]
  );

  /**
   * Actualiza un campo específico de una línea
   * @param id - ID local de la línea
   * @param field - Campo a actualizar
   * @param value - Nuevo valor
   */
  const updateLine = useCallback((id: number, field: keyof ServiceLine, value: unknown) => {
    setServiceLines((prev) =>
      prev.map((line) => (line.id_linea_detalle === id ? { ...line, [field]: value } : line))
    );
  }, []);

  /**
   * Establece todas las líneas de servicio
   * Útil para cargar datos desde el servidor
   * @param lines - Array completo de líneas
   */
  const setLines = useCallback((lines: ServiceLine[]) => {
    setServiceLines(lines);
  }, []);

  /**
   * Resetea las líneas a estado inicial (una línea vacía)
   * Limpia también la lista de eliminados
   */
  const resetLines = useCallback(() => {
    setServiceLines([INITIAL_SERVICE_LINE]);
    setDeletedServiceIds([]);
  }, []);

  /**
   * Obtiene solo las líneas válidas para guardar
   * Una línea es válida si está confirmada y tiene todos los campos completos
   * @returns Array de líneas válidas
   */
  const getValidLines = useCallback(() => {
    return serviceLines.filter(
      (l) =>
        l.isConfirmed &&
        l.operadorId &&
        l.planId &&
        l.apnId &&
        l.permanencia &&
        l.claseCobro &&
        l.valorMensual &&
        Number(l.valorMensual) > 0 &&
        Number(l.permanencia) >= 1 &&
        Number(l.permanencia) <= 36
    );
  }, [serviceLines]);

  /**
   * Confirma una línea de servicio
   * Solo se puede confirmar si tiene operador, plan, APN, clase cobro, valor y permanencia válida
   * @param id - ID local de la línea
   * @returns true si se confirmó exitosamente, false si faltan datos
   */
  const confirmLine = useCallback((id: number): boolean => {
    const line = serviceLines.find((l) => l.id_linea_detalle === id);
    if (!line) return false;

    // Validar que tenga todos los datos necesarios
    const isValid =
      line.operadorId &&
      line.planId &&
      line.apnId &&
      line.permanencia &&
      Number(line.permanencia) >= 1 &&
      Number(line.permanencia) <= 36 &&
      line.claseCobro &&
      line.valorMensual &&
      Number(line.valorMensual) > 0;

    if (!isValid) return false;

    setServiceLines((prev) =>
      prev.map((l) => (l.id_linea_detalle === id ? { ...l, isConfirmed: true } : l))
    );
    return true;
  }, [serviceLines]);

  /**
   * Desconfirma una línea de servicio (permite editar de nuevo)
   * @param id - ID local de la línea
   */
  const unconfirmLine = useCallback((id: number) => {
    setServiceLines((prev) =>
      prev.map((l) => (l.id_linea_detalle === id ? { ...l, isConfirmed: false } : l))
    );
  }, []);

  /**
   * Verifica si una línea puede ser confirmada
   * @param id - ID local de la línea
   * @returns true si la línea tiene todos los datos necesarios
   */
  const canConfirmLine = useCallback((id: number): boolean => {
    const line = serviceLines.find((l) => l.id_linea_detalle === id);
    if (!line) return false;

    return !!(
      line.operadorId &&
      line.planId &&
      line.apnId &&
      line.permanencia &&
      Number(line.permanencia) >= 1 &&
      Number(line.permanencia) <= 36 &&
      line.claseCobro &&
      line.valorMensual &&
      Number(line.valorMensual) > 0
    );
  }, [serviceLines]);

  /**
   * Limpia la lista de servicios marcados para eliminar
   * Útil después de guardar exitosamente
   */
  const clearDeletedIds = useCallback(() => {
    setDeletedServiceIds([]);
  }, []);

  return {
    serviceLines,
    deletedServiceIds,
    addLine,
    removeLine,
    updateLine,
    setLines,
    resetLines,
    getValidLines,
    confirmLine,
    unconfirmLine,
    canConfirmLine,
    clearDeletedIds,
  };
};