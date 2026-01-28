/**
 * useProductLines
 *
 * Hook para manejar las líneas de productos/equipos en la pestaña comercial
 * Gestiona CRUD de equipos, validaciones y tracking de eliminaciones
 *
 * Cada línea de producto incluye:
 * - Equipo seleccionado (EquipoOption)
 * - Cantidad y valor unitario
 * - Información de plantilla (opcional)
 *
 * @example
 * const { productLines, addLine, removeLine, updateLine } = useProductLines();
 * addLine(); // Agrega nueva línea vacía
 * updateLine(1, "cantidad", "5"); // Actualiza cantidad de línea 1
 */

import { useState, useCallback } from "react";
import { EquipoOption } from "@/components/catalogs/EquipoSelector";

// Interfaz para una línea de producto
export interface ProductLine {
  id_linea_detalle: number; // ID local para UI (temporal)
  id_orden_detalle?: number; // ID de BD (si existe en BD)
  selectedEquipo: EquipoOption | null;
  cantidad: string;
  valorUnitario: string;
  claseCobro: string;
  plantilla: boolean;
  plantillaText: string;
  isConfirmed: boolean; // Indica si el equipo fue confirmado por el usuario
  cantidad_linea: string; // Cantidad de líneas
  permanencia: string; // Meses de permanencia (requerido cuando clase_orden es "Renta")
}

// Línea de producto inicial vacía
const INITIAL_PRODUCT_LINE: ProductLine = {
  id_linea_detalle: 1,
  id_orden_detalle: undefined,
  selectedEquipo: null,
  cantidad: "",
  valorUnitario: "",
  claseCobro: "",
  plantilla: false,
  plantillaText: "",
  isConfirmed: false,
  cantidad_linea: "",
  permanencia: "",
};

export const useProductLines = () => {
  // Estado de líneas de productos
  const [productLines, setProductLines] = useState<ProductLine[]>([INITIAL_PRODUCT_LINE]);

  // IDs de equipos marcados para eliminar (se procesan al guardar)
  const [deletedEquipoIds, setDeletedEquipoIds] = useState<number[]>([]);

  /**
   * Agrega una nueva línea de producto vacía
   * Genera un nuevo ID único basado en el máximo ID existente
   */
  const addLine = useCallback(() => {
    const newId = Math.max(...productLines.map((line) => line.id_linea_detalle), 0) + 1;
    setProductLines([...productLines, { ...INITIAL_PRODUCT_LINE, id_linea_detalle: newId }]);
  }, [productLines]);

  /**
   * Elimina una línea de producto
   * Si la línea existe en BD (tiene id_orden_detalle), la marca para eliminación
   * @param id - ID local de la línea a eliminar
   */
  const removeLine = useCallback(
    (id: number) => {
      const lineToRemove = productLines.find((line) => line.id_linea_detalle === id);

      // Si existe en BD, marcarla para eliminación
      if (lineToRemove?.id_orden_detalle) {
        setDeletedEquipoIds((prev) => [...prev, lineToRemove.id_orden_detalle!]);
      }

      // Eliminar de la lista local
      setProductLines((prev) => prev.filter((line) => line.id_linea_detalle !== id));
    },
    [productLines]
  );

  /**
   * Actualiza un campo específico de una línea
   * @param id - ID local de la línea
   * @param field - Campo a actualizar
   * @param value - Nuevo valor
   */
  const updateLine = useCallback((id: number, field: keyof ProductLine, value: unknown) => {
    setProductLines((prev) =>
      prev.map((line) => (line.id_linea_detalle === id ? { ...line, [field]: value } : line))
    );
  }, []);

  /**
   * Establece todas las líneas de productos
   * Útil para cargar datos desde el servidor
   * @param lines - Array completo de líneas
   */
  const setLines = useCallback((lines: ProductLine[]) => {
    setProductLines(lines);
  }, []);

  /**
   * Resetea las líneas a estado inicial (una línea vacía)
   * Limpia también la lista de eliminados
   */
  const resetLines = useCallback(() => {
    setProductLines([INITIAL_PRODUCT_LINE]);
    setDeletedEquipoIds([]);
  }, []);

  /**
   * Obtiene solo las líneas válidas para guardar
   * Una línea es válida si está confirmada, tiene equipo, cantidad > 0 y valor > 0
   * @returns Array de líneas válidas
   */
  const getValidLines = useCallback(() => {
    return productLines.filter(
      (l) =>
        l.isConfirmed &&
        l.selectedEquipo &&
        l.selectedEquipo.id_equipo &&
        l.cantidad &&
        Number(l.cantidad) > 0 &&
        l.valorUnitario &&
        Number(l.valorUnitario) > 0
    );
  }, [productLines]);

  /**
   * Confirma una línea de producto
   * Solo se puede confirmar si tiene equipo, cantidad > 0 y valor > 0
   * @param id - ID local de la línea
   * @param requirePermanencia - Si es true, también valida que permanencia > 0 (para clase Renta)
   * @returns true si se confirmó exitosamente, false si faltan datos
   */
  const confirmLine = useCallback((id: number, requirePermanencia: boolean = false): boolean => {
    const line = productLines.find((l) => l.id_linea_detalle === id);
    if (!line) return false;

    // Validar que tenga todos los datos necesarios
    const isValid =
      line.selectedEquipo &&
      line.selectedEquipo.id_equipo &&
      line.cantidad &&
      Number(line.cantidad) > 0 &&
      line.valorUnitario &&
      Number(line.valorUnitario) > 0 &&
      (!requirePermanencia || (line.permanencia && Number(line.permanencia) > 0));

    if (!isValid) return false;

    setProductLines((prev) =>
      prev.map((l) => (l.id_linea_detalle === id ? { ...l, isConfirmed: true } : l))
    );
    return true;
  }, [productLines]);

  /**
   * Desconfirma una línea de producto (permite editar de nuevo)
   * @param id - ID local de la línea
   */
  const unconfirmLine = useCallback((id: number) => {
    setProductLines((prev) =>
      prev.map((l) => (l.id_linea_detalle === id ? { ...l, isConfirmed: false } : l))
    );
  }, []);

  /**
   * Verifica si una línea puede ser confirmada
   * @param id - ID local de la línea
   * @param requirePermanencia - Si es true, también valida que permanencia > 0 (para clase Renta)
   * @returns true si la línea tiene todos los datos necesarios
   */
  const canConfirmLine = useCallback((id: number, requirePermanencia: boolean = false): boolean => {
    const line = productLines.find((l) => l.id_linea_detalle === id);
    if (!line) return false;

    return !!(
      line.selectedEquipo &&
      line.selectedEquipo.id_equipo &&
      line.cantidad &&
      Number(line.cantidad) > 0 &&
      line.valorUnitario &&
      Number(line.valorUnitario) > 0 &&
      (!requirePermanencia || (line.permanencia && Number(line.permanencia) > 0))
    );
  }, [productLines]);

  /**
   * Limpia la lista de equipos marcados para eliminar
   * Útil después de guardar exitosamente
   */
  const clearDeletedIds = useCallback(() => {
    setDeletedEquipoIds([]);
  }, []);

  return {
    productLines,
    deletedEquipoIds,
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