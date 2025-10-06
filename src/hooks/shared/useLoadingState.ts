/**
 * useLoadingState
 *
 * Hook genérico para manejar estados de carga en operaciones asíncronas
 * Útil para mostrar spinners, deshabilitar botones, etc.
 *
 * @example
 * const { isLoading, startLoading, stopLoading } = useLoadingState();
 *
 * const handleSubmit = async () => {
 *   startLoading();
 *   await saveData();
 *   stopLoading();
 * }
 */

import { useState, useCallback } from "react";

export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  /**
   * Inicia el estado de carga
   */
  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  /**
   * Detiene el estado de carga
   */
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  /**
   * Toggle del estado de carga
   */
  const toggleLoading = useCallback(() => {
    setIsLoading((prev) => !prev);
  }, []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading,
  };
};
