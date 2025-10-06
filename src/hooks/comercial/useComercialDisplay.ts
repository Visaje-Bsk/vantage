/**
 * useComercialDisplay
 *
 * Hook para manejar los datos de visualización inmediata en modo readonly
 * Mantiene información pre-cargada para mostrar al usuario sin esperar la carga completa
 *
 * El displayData contiene:
 * - Nombre del cliente
 * - Nombre del proyecto
 * - Nombre del ingeniero asignado
 * - Orden de compra
 * - Observaciones
 *
 * @example
 * const { displayData, updateDisplayData } = useComercialDisplay();
 * updateDisplayData({ cliente_nombre: "Cliente ABC" });
 */

import { useState, useCallback } from "react";

// Interfaz para datos de visualización
export interface DisplayData {
  cliente_nombre: string;
  proyecto_nombre: string;
  ingeniero_nombre: string;
  orden_compra: string;
  observaciones: string;
}

// Datos iniciales vacíos
const INITIAL_DISPLAY_DATA: DisplayData = {
  cliente_nombre: "",
  proyecto_nombre: "",
  ingeniero_nombre: "",
  orden_compra: "",
  observaciones: "",
};

export const useComercialDisplay = () => {
  // Estado de datos de visualización
  const [displayData, setDisplayData] = useState<DisplayData>(INITIAL_DISPLAY_DATA);

  // Flag para mostrar/ocultar sección de líneas de servicio
  const [showLineasDetalle, setShowLineasDetalle] = useState(false);

  /**
   * Actualiza los datos de visualización completos
   * @param data - Nuevos datos de visualización
   */
  const updateDisplayData = useCallback((data: Partial<DisplayData>) => {
    setDisplayData((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  /**
   * Actualiza un campo específico de visualización
   * @param field - Campo a actualizar
   * @param value - Nuevo valor
   */
  const updateDisplayField = useCallback((field: keyof DisplayData, value: string) => {
    setDisplayData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Resetea los datos de visualización a valores iniciales
   */
  const resetDisplayData = useCallback(() => {
    setDisplayData(INITIAL_DISPLAY_DATA);
  }, []);

  return {
    displayData,
    showLineasDetalle,
    updateDisplayData,
    updateDisplayField,
    resetDisplayData,
    setDisplayData,
    setShowLineasDetalle,
  };
};
