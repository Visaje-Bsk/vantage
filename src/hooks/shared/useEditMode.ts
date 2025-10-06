/**
 * useEditMode
 *
 * Hook para manejar el modo de edición de un formulario
 * Controla el toggle entre modo lectura y edición, y maneja los snapshots del estado inicial
 *
 * @example
 * const { isEditMode, enterEditMode, exitEditMode, setInitialSnapshot } = useEditMode();
 *
 * const handleEdit = () => {
 *   setInitialSnapshot({ formData: currentData });
 *   enterEditMode();
 * }
 */

import { useState, useCallback } from "react";

interface UseEditModeOptions {
  initialMode?: boolean;
  onEnterEditMode?: () => void;
  onExitEditMode?: () => void;
}

export const useEditMode = (options: UseEditModeOptions = {}) => {
  const { initialMode = false, onEnterEditMode, onExitEditMode } = options;

  // Estado del modo edición
  const [isEditMode, setIsEditMode] = useState(initialMode);

  // Estado de campos bloqueados (útil para formularios con restricciones)
  const [isFieldsLocked, setIsFieldsLocked] = useState(false);

  // Snapshots del estado inicial (para detectar cambios)
  const [initialSnapshots, setInitialSnapshots] = useState<Record<string, unknown>>({});

  /**
   * Entra al modo edición
   * Ejecuta callback opcional si está definido
   */
  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
    onEnterEditMode?.();
  }, [onEnterEditMode]);

  /**
   * Sale del modo edición
   * Ejecuta callback opcional si está definido
   */
  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    onExitEditMode?.();
  }, [onExitEditMode]);

  /**
   * Toggle del modo edición
   */
  const toggleEditMode = useCallback(() => {
    if (isEditMode) {
      exitEditMode();
    } else {
      enterEditMode();
    }
  }, [isEditMode, enterEditMode, exitEditMode]);

  /**
   * Establece un snapshot del estado inicial
   * Útil para comparar cambios más tarde
   * @param key - Clave del snapshot (ej: "formData", "productLines")
   * @param value - Valor a guardar
   */
  const setInitialSnapshot = useCallback((key: string, value: unknown) => {
    setInitialSnapshots((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Obtiene un snapshot del estado inicial
   * @param key - Clave del snapshot
   * @returns El valor guardado o undefined si no existe
   */
  const getInitialSnapshot = useCallback(
    (key: string): unknown => {
      return initialSnapshots[key];
    },
    [initialSnapshots]
  );

  /**
   * Limpia todos los snapshots
   */
  const clearSnapshots = useCallback(() => {
    setInitialSnapshots({});
  }, []);

  return {
    isEditMode,
    isFieldsLocked,
    initialSnapshots,
    enterEditMode,
    exitEditMode,
    toggleEditMode,
    setIsEditMode,
    setIsFieldsLocked,
    setInitialSnapshot,
    getInitialSnapshot,
    clearSnapshots,
  };
};
