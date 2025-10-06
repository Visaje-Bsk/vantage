/**
 * useCurrencyFormatter
 *
 * Hook para formatear valores monetarios en COP (Peso Colombiano)
 * Proporciona funciones para formatear números a moneda y limpiar strings a solo dígitos
 *
 * @example
 * const { formatCOP, digitsOnly } = useCurrencyFormatter();
 * formatCOP("1000000") // "$1.000.000"
 * digitsOnly("$1.000.000") // "1000000"
 */

import { useMemo, useCallback } from "react";

export const useCurrencyFormatter = () => {
  // Crear formateador COP usando Intl.NumberFormat
  // Esto se memoriza para evitar recrear el formateador en cada render
  const formatterCOP = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  /**
   * Formatea un string numérico a formato COP
   * @param raw - String con el valor numérico (ej: "1000000")
   * @returns String formateado (ej: "$1.000.000") o string vacío si inválido
   */
  const formatCOP = useCallback(
    (raw: string): string => {
      if (!raw) return "";
      const num = Number(raw);
      if (Number.isNaN(num)) return "";
      return formatterCOP.format(num);
    },
    [formatterCOP]
  );

  /**
   * Extrae solo los dígitos de un string
   * Útil para limpiar inputs de usuario que pueden contener caracteres especiales
   * @param s - String a limpiar (ej: "$1.000.000")
   * @returns String con solo dígitos (ej: "1000000")
   */
  const digitsOnly = useCallback((s: string): string => {
    return s.replace(/[^0-9]/g, "");
  }, []);

  return {
    formatCOP,
    digitsOnly,
    formatterCOP,
  };
};
