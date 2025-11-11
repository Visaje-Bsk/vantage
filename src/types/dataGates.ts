/**
 * Sistema de Data Gates - Validaciones por Fase del Kanban
 *
 * Este archivo define los tipos y estructuras para el sistema de validación
 * que controla el avance entre fases del flujo Kanban.
 */

import { FaseOrdenDB } from './kanban';

/**
 * Severidad del error de validación
 */
export type ValidationSeverity = 'error' | 'warning' | 'critical';

/**
 * Error de validación individual
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
}

/**
 * Resultado de la validación de Data Gates
 */
export interface DataGateValidationResult {
  canAdvance: boolean;
  errors: ValidationError[];
  missingFields: string[];
  phase: FaseOrdenDB;
  nextPhase?: FaseOrdenDB;
}

/**
 * Configuración de campo obligatorio por fase
 */
export interface RequiredField {
  field: string;
  label: string;
  table?: string;
  severity: ValidationSeverity;
  condition?: (order: any) => boolean; // Validación condicional
}

/**
 * Configuración de Data Gates por fase
 */
export interface PhaseDataGateConfig {
  phase: FaseOrdenDB;
  phaseName: string;
  nextPhase?: FaseOrdenDB;
  requiredFields: RequiredField[];
  customValidations?: ((order: any) => ValidationError[])[];
}

/**
 * Mapeo completo de Data Gates por fase
 */
export const DATA_GATE_CONFIG: Record<FaseOrdenDB, PhaseDataGateConfig> = {
  comercial: {
    phase: 'comercial',
    phaseName: 'Comercial',
    nextPhase: 'inventarios',
    requiredFields: [
      {
        field: 'id_cliente',
        label: 'Cliente',
        severity: 'critical',
      },
      {
        field: 'id_clase_orden',
        label: 'Clase de Orden',
        severity: 'critical',
      },
      {
        field: 'id_tipo_servicio',
        label: 'Tipo de Servicio',
        severity: 'critical',
      },
      {
        field: 'id_ingeniero_asignado',
        label: 'Ingeniero Asignado',
        severity: 'critical',
      },
      {
        field: 'id_tipo_despacho',
        label: 'Tipo de Despacho',
        severity: 'error',
      },
    ],
    customValidations: [
      (order) => {
        const errors: ValidationError[] = [];

        // Validar que tenga al menos un detalle de producto
        if (!order.detalles || order.detalles.length === 0) {
          errors.push({
            field: 'detalles',
            message: 'Debe agregar al menos un producto a la orden',
            severity: 'critical',
          });
        }

        return errors;
      },
    ],
  },

  inventarios: {
    phase: 'inventarios',
    phaseName: 'Inventarios',
    nextPhase: 'produccion',
    requiredFields: [
      {
        field: 'stock_validado',
        label: 'Validación de Stock',
        severity: 'critical',
      },
    ],
  },

  produccion: {
    phase: 'produccion',
    phaseName: 'Producción',
    nextPhase: 'logistica',
    requiredFields: [
      {
        field: 'observaciones_produccion',
        label: 'Observaciones de Producción',
        table: 'orden_produccion',
        severity: 'critical',
      },
      {
        field: 'numero_produccion',
        label: 'Número de Producción (Sapiens)',
        table: 'orden_produccion',
        severity: 'error',
      },
    ],
  },

  logistica: {
    phase: 'logistica',
    phaseName: 'Logística',
    nextPhase: 'facturacion',
    requiredFields: [
      {
        field: 'valor_servicio_flete',
        label: 'Valor del Flete',
        table: 'despacho_orden',
        severity: 'critical', // Data Gate RF-8 - CRÍTICO para Facturación
      },
      {
        field: 'numero_guia',
        label: 'Número de Guía',
        table: 'despacho_orden',
        severity: 'error',
      },
      {
        field: 'id_transportadora',
        label: 'Transportadora',
        table: 'despacho_orden',
        severity: 'error',
      },
      {
        field: 'numero_remision',
        label: 'Número de Remisión',
        table: 'remision',
        severity: 'error',
      },
    ],
    customValidations: [
      (order) => {
        const errors: ValidationError[] = [];

        // Validación especial RF-8: Valor de flete es CRÍTICO para facturación
        if (!order.despacho?.valor_servicio_flete) {
          errors.push({
            field: 'valor_servicio_flete',
            message: '⛔ BLOQUEANTE RF-8: El valor del flete es OBLIGATORIO para que Facturación pueda emitir la factura. Sin este dato, la orden no puede avanzar.',
            severity: 'critical',
          });
        }

        return errors;
      },
    ],
  },

  facturacion: {
    phase: 'facturacion',
    phaseName: 'Facturación',
    nextPhase: 'financiera',
    requiredFields: [
      {
        field: 'numero_factura',
        label: 'Número de Factura',
        table: 'factura',
        severity: 'critical',
      },
      {
        field: 'fecha_factura',
        label: 'Fecha de Factura',
        table: 'factura',
        severity: 'critical',
      },
      {
        field: 'moneda_base',
        label: 'Moneda Base',
        table: 'factura',
        severity: 'error',
      },
      {
        field: 'trm_aplicada',
        label: 'TRM Aplicada',
        table: 'factura',
        severity: 'error',
        condition: (order) => order.factura?.moneda_base === 'USD', // Solo si es USD
      },
    ],
  },

  financiera: {
    phase: 'financiera',
    phaseName: 'Financiera',
    nextPhase: undefined, // Fase final
    requiredFields: [
      {
        field: 'pago_confirmado',
        label: 'Confirmación de Pago',
        severity: 'critical',
      },
    ],
  },
};

/**
 * Mensajes de error predefinidos
 */
export const VALIDATION_MESSAGES = {
  FIELD_REQUIRED: (label: string) => `${label} es obligatorio`,
  CRITICAL_FIELD: (label: string) => `⛔ CRÍTICO: ${label} es obligatorio para continuar`,
  CANNOT_ADVANCE: (phase: string) => `No se puede avanzar desde ${phase} hasta completar todos los campos obligatorios`,
  PHASE_COMPLETE: (phase: string) => `✓ Fase ${phase} completa. Puede avanzar a la siguiente fase.`,
};
