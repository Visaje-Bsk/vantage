/**
 * Hook para detectar cambios sin guardar en los tabs de orden
 *
 * Proporciona una forma simple de trackear si un formulario tiene cambios
 * pendientes que no se han guardado.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTabDirtyStateOptions {
  /** Callback cuando cambia el estado dirty */
  onDirtyChange?: (isDirty: boolean) => void;
}

interface UseTabDirtyStateReturn {
  /** Indica si hay cambios sin guardar */
  isDirty: boolean;
  /** Marca el estado como modificado */
  markDirty: () => void;
  /** Marca el estado como limpio (después de guardar) */
  markClean: () => void;
  /** Resetea al estado inicial */
  reset: () => void;
}

/**
 * Hook simple para trackear cambios sin guardar
 */
export function useTabDirtyState(options: UseTabDirtyStateOptions = {}): UseTabDirtyStateReturn {
  const { onDirtyChange } = options;
  const [isDirty, setIsDirty] = useState(false);
  const prevDirtyRef = useRef(isDirty);

  // Notificar cambios al padre
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      onDirtyChange?.(isDirty);
      prevDirtyRef.current = isDirty;
    }
  }, [isDirty, onDirtyChange]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  const reset = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    isDirty,
    markDirty,
    markClean,
    reset,
  };
}

/**
 * Hook avanzado que compara valores para detectar cambios
 */
export function useTabDirtyStateWithComparison<T>(
  currentValues: T,
  options: UseTabDirtyStateOptions = {}
): UseTabDirtyStateReturn & { setInitialValues: () => void } {
  const { onDirtyChange } = options;
  const [initialValues, setInitialValuesState] = useState<T | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const prevDirtyRef = useRef(isDirty);

  // Comparar valores actuales con iniciales
  useEffect(() => {
    if (initialValues === null) return;

    const currentIsDirty = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
    if (currentIsDirty !== isDirty) {
      setIsDirty(currentIsDirty);
    }
  }, [currentValues, initialValues, isDirty]);

  // Notificar cambios al padre
  useEffect(() => {
    if (prevDirtyRef.current !== isDirty) {
      onDirtyChange?.(isDirty);
      prevDirtyRef.current = isDirty;
    }
  }, [isDirty, onDirtyChange]);

  const setInitialValues = useCallback(() => {
    setInitialValuesState(currentValues);
    setIsDirty(false);
  }, [currentValues]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setInitialValuesState(currentValues);
    setIsDirty(false);
  }, [currentValues]);

  const reset = useCallback(() => {
    setInitialValuesState(null);
    setIsDirty(false);
  }, []);

  return {
    isDirty,
    markDirty,
    markClean,
    reset,
    setInitialValues,
  };
}
