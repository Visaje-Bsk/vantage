/**
 * Hook de Validación de Data Gates
 *
 * Este hook centraliza toda la lógica de validación para determinar
 * si una orden puede avanzar a la siguiente fase del Kanban.
 */

import { useMemo } from 'react';
import {
  DataGateValidationResult,
  ValidationError,
  DATA_GATE_CONFIG,
  VALIDATION_MESSAGES,
  RequiredField,
} from '@/types/dataGates';
import { FaseOrdenDB } from '@/types/kanban';

interface UseDataGateValidationProps {
  order: any; // OrdenKanban extendida con datos de todas las tablas
  currentPhase: FaseOrdenDB;
}

/**
 * Hook para validar Data Gates de una fase específica
 */
export const useDataGateValidation = ({
  order,
  currentPhase,
}: UseDataGateValidationProps): DataGateValidationResult => {

  const validationResult = useMemo(() => {
    // Obtener configuración de la fase actual
    const phaseConfig = DATA_GATE_CONFIG[currentPhase];

    if (!phaseConfig) {
      console.warn(`No se encontró configuración de Data Gates para la fase: ${currentPhase}`);
      return {
        canAdvance: true,
        errors: [],
        missingFields: [],
        phase: currentPhase,
        nextPhase: undefined,
      };
    }

    const errors: ValidationError[] = [];
    const missingFields: string[] = [];

    // Validar campos obligatorios
    phaseConfig.requiredFields.forEach((fieldConfig: RequiredField) => {
      // Si hay una condición, evaluarla primero
      if (fieldConfig.condition && !fieldConfig.condition(order)) {
        return; // Skip si la condición no se cumple
      }

      const value = getFieldValue(order, fieldConfig.field, fieldConfig.table);

      if (!value || value === '' || value === null || value === undefined) {
        missingFields.push(fieldConfig.field);

        const message = fieldConfig.severity === 'critical'
          ? VALIDATION_MESSAGES.CRITICAL_FIELD(fieldConfig.label)
          : VALIDATION_MESSAGES.FIELD_REQUIRED(fieldConfig.label);

        errors.push({
          field: fieldConfig.field,
          message,
          severity: fieldConfig.severity,
        });
      }
    });

    // Ejecutar validaciones personalizadas
    if (phaseConfig.customValidations) {
      phaseConfig.customValidations.forEach((customValidation) => {
        const customErrors = customValidation(order);
        errors.push(...customErrors);

        // Agregar campos faltantes de validaciones custom
        customErrors.forEach((err) => {
          if (!missingFields.includes(err.field)) {
            missingFields.push(err.field);
          }
        });
      });
    }

    // Determinar si puede avanzar (solo si no hay errores críticos o errores)
    const canAdvance = errors.length === 0;

    return {
      canAdvance,
      errors,
      missingFields,
      phase: currentPhase,
      nextPhase: phaseConfig.nextPhase,
    };
  }, [order, currentPhase]);

  return validationResult;
};

/**
 * Helper para obtener el valor de un campo en la orden
 * Soporta campos anidados en diferentes tablas
 */
function getFieldValue(order: any, field: string, table?: string): any {
  if (!order) return null;

  // Si hay tabla específica, buscar en esa tabla
  if (table) {
    // Mapeo de nombres de tabla a propiedades del objeto orden
    const tableMap: Record<string, string> = {
      'orden_produccion': 'produccion',
      'despacho_orden': 'despacho',
      'remision': 'remision',
      'factura': 'factura',
    };

    const tableProperty = tableMap[table] || table;
    return order[tableProperty]?.[field];
  }

  // Buscar directamente en la orden
  return order[field];
}

/**
 * Hook auxiliar para obtener el resumen de validación
 * Útil para mostrar en UI
 */
export const useDataGateStatus = ({
  order,
  currentPhase,
}: UseDataGateValidationProps) => {
  const validation = useDataGateValidation({ order, currentPhase });

  const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
  const regularErrors = validation.errors.filter(e => e.severity === 'error');
  const warnings = validation.errors.filter(e => e.severity === 'warning');

  const hasCriticalErrors = criticalErrors.length > 0;
  const hasErrors = regularErrors.length > 0;
  const hasWarnings = warnings.length > 0;

  const statusMessage = validation.canAdvance
    ? VALIDATION_MESSAGES.PHASE_COMPLETE(DATA_GATE_CONFIG[currentPhase].phaseName)
    : VALIDATION_MESSAGES.CANNOT_ADVANCE(DATA_GATE_CONFIG[currentPhase].phaseName);

  return {
    ...validation,
    criticalErrors,
    regularErrors,
    warnings,
    hasCriticalErrors,
    hasErrors,
    hasWarnings,
    statusMessage,
    totalErrors: validation.errors.length,
  };
};

/**
 * Hook para validar si un usuario puede editar una fase específica
 */
export const useCanEditPhase = (
  userRole: string,
  orderPhase: FaseOrdenDB
): boolean => {
  // Mapeo de roles a fases que pueden editar
  const rolePhaseMap: Record<string, FaseOrdenDB[]> = {
    admin: ['comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'],
    comercial: ['comercial'],
    inventarios: ['inventarios'],
    produccion: ['produccion'],
    logistica: ['logistica'],
    facturacion: ['facturacion'],
    financiera: ['financiera'],
  };

  const allowedPhases = rolePhaseMap[userRole] || [];
  return allowedPhases.includes(orderPhase);
};
