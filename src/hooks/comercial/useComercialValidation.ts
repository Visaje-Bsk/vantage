/**
 * useComercialValidation
 *
 * Hook para manejar todas las validaciones del formulario comercial
 * Incluye validaciones de cantidad, email, teléfono y líneas completas
 *
 * Validaciones disponibles:
 * - Cantidad: entero positivo entre 1 y 9999
 * - Email: formato válido (opcional)
 * - Teléfono: entre 7 y 15 dígitos (opcional)
 * - Líneas de producto: completas o vacías
 * - Líneas de servicio: completas o vacías
 *
 * @example
 * const { validateQuantity, validateEmail, quantityErrors, emailError } = useComercialValidation();
 * const validation = validateQuantity("5");
 * if (!validation.valid) console.error(validation.error);
 */

import { useState, useCallback } from "react";
import type { ProductLine } from "./useProductLines";
import type { ServiceLine } from "./useServiceLines";

// Resultado de validación
interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const useComercialValidation = () => {
  // Errores de validación por línea de producto (key = id_linea_detalle)
  const [quantityErrors, setQuantityErrors] = useState<Record<number, string>>({});

  // Error de email del contacto de despacho
  const [emailError, setEmailError] = useState<string>("");

  // Error de teléfono del contacto de despacho
  const [phoneError, setPhoneError] = useState<string>("");

  /**
   * Valida una cantidad
   * Debe ser un número entero positivo entre 1 y 9999
   * @param value - Valor a validar
   * @returns Resultado de validación
   */
  const validateQuantity = useCallback((value: string): ValidationResult => {
    if (!value) return { valid: false, error: "La cantidad es requerida" };

    const num = Number(value);
    if (isNaN(num)) return { valid: false, error: "Debe ser un número válido" };
    if (!Number.isInteger(num)) return { valid: false, error: "La cantidad debe ser un número entero" };
    if (num <= 0) return { valid: false, error: "La cantidad debe ser mayor a 0" };
    if (num > 9999) return { valid: false, error: "La cantidad no puede superar 9999" };

    return { valid: true };
  }, []);

  /**
   * Valida un email
   * El email es opcional pero si se proporciona debe tener formato válido
   * @param email - Email a validar
   * @returns Resultado de validación
   */
  const validateEmail = useCallback((email: string): ValidationResult => {
    if (!email) return { valid: true }; // Email es opcional

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: "Ingresa un correo electrónico válido" };
    }

    return { valid: true };
  }, []);

  /**
   * Valida un teléfono
   * El teléfono es opcional pero si se proporciona debe tener entre 7 y 15 dígitos
   * @param phone - Teléfono a validar
   * @returns Resultado de validación
   */
  const validatePhone = useCallback((phone: string): ValidationResult => {
    if (!phone) return { valid: true }; // Teléfono es opcional

    const digitsOnly = phone.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 7) {
      return { valid: false, error: "El teléfono debe tener al menos 7 dígitos" };
    }
    if (digitsOnly.length > 15) {
      return { valid: false, error: "El teléfono no puede tener más de 15 dígitos" };
    }

    return { valid: true };
  }, []);

  /**
   * Establece un error de cantidad para una línea específica
   * @param lineId - ID de la línea
   * @param error - Mensaje de error (vacío para limpiar)
   */
  const setQuantityError = useCallback((lineId: number, error: string) => {
    if (error) {
      setQuantityErrors((prev) => ({ ...prev, [lineId]: error }));
    } else {
      setQuantityErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[lineId];
        return newErrors;
      });
    }
  }, []);

  /**
   * Limpia todos los errores de cantidad
   */
  const clearQuantityErrors = useCallback(() => {
    setQuantityErrors({});
  }, []);

  /**
   * Limpia todos los errores de validación
   */
  const clearAllErrors = useCallback(() => {
    setQuantityErrors({});
    setEmailError("");
    setPhoneError("");
  }, []);

  /**
   * Valida todas las líneas de productos
   * Verifica que las líneas con datos estén completas
   * @param productLines - Líneas de productos a validar
   * @returns true si todas las líneas son válidas
   */
  const validateProductLines = useCallback(
    (productLines: ProductLine[]): { valid: boolean; error?: string } => {
      const invalidLines = productLines.filter((line) => {
        const hasEquipo = line.selectedEquipo && line.selectedEquipo.id_equipo;
        const hasData = line.cantidad || line.valorUnitario;

        // Si hay datos pero no hay equipo seleccionado
        if (hasData && !hasEquipo) {
          return true;
        }

        // Si hay equipo pero faltan datos requeridos
        if (
          hasEquipo &&
          (!line.cantidad || Number(line.cantidad) <= 0 || !line.valorUnitario || Number(line.valorUnitario) <= 0)
        ) {
          return true;
        }

        return false;
      });

      if (invalidLines.length > 0) {
        const hasDataWithoutEquipo = invalidLines.some(
          (line) => (line.cantidad || line.valorUnitario) && !(line.selectedEquipo && line.selectedEquipo.id_equipo)
        );

        if (hasDataWithoutEquipo) {
          return { valid: false, error: "No puedes guardar cantidad o valor sin seleccionar un equipo" };
        } else {
          return {
            valid: false,
            error: "Todos los equipos seleccionados deben tener cantidad y valor unitario válidos",
          };
        }
      }

      return { valid: true };
    },
    []
  );

  /**
   * Valida todas las líneas de servicio
   * Verifica que las líneas con datos estén completas
   * @param serviceLines - Líneas de servicio a validar
   * @returns true si todas las líneas son válidas
   */
  const validateServiceLines = useCallback(
    (serviceLines: ServiceLine[]): { valid: boolean; error?: string } => {
      const invalidLines = serviceLines.filter(
        (line) =>
          (line.operadorId ||
            line.planId ||
            line.apnId ||
            line.claseCobro ||
            line.valorMensual ||
            line.permanencia) &&
          (!line.operadorId || !line.planId || !line.apnId || !line.claseCobro || !line.valorMensual || !line.permanencia)
      );

      if (invalidLines.length > 0) {
        return {
          valid: false,
          error: "Todas las líneas de servicio deben estar completamente configuradas o vacías",
        };
      }

      return { valid: true };
    },
    []
  );

  return {
    // Estados de errores
    quantityErrors,
    emailError,
    phoneError,

    // Funciones de validación
    validateQuantity,
    validateEmail,
    validatePhone,
    validateProductLines,
    validateServiceLines,

    // Setters de errores
    setQuantityError,
    setEmailError,
    setPhoneError,

    // Funciones de limpieza
    clearQuantityErrors,
    clearAllErrors,
  };
};
