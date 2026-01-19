/**
 * Componente de Alerta para Data Gates
 *
 * Muestra los errores de validación de forma visual y clara,
 * ayudando al usuario a entender qué campos faltan para avanzar.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { ValidationError, ValidationSeverity } from '@/types/dataGates';
import { cn } from '@/lib/utils';

interface DataGateAlertProps {
  errors: ValidationError[];
  canAdvance: boolean;
  phaseName: string;
  className?: string;
}

/**
 * Componente principal de alerta - Diseño compacto y moderno
 */
export const DataGateAlert: React.FC<DataGateAlertProps> = ({
  errors,
  canAdvance,
  phaseName,
  className,
}) => {
  // Si no hay errores y puede avanzar, no mostrar nada (más limpio)
  if (canAdvance && errors.length === 0) {
    return null;
  }

  // Agrupar errores por severidad
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const regularErrors = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning');

  const allRequiredErrors = [...criticalErrors, ...regularErrors];

  // Si no hay errores, no mostrar nada
  if (allRequiredErrors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={cn('mb-4', className)}>
      {/* Errores requeridos - Diseño compacto tipo banner */}
      {allRequiredErrors.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Campos requeridos para continuar:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {allRequiredErrors.map((error, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                >
                  {error.message}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advertencias - Solo si hay */}
      {warnings.length > 0 && (
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700",
          allRequiredErrors.length > 0 && "mt-2"
        )}>
          <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Sugerencias:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {warnings.map((error, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                >
                  {error.message}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente compacto para mostrar el estado en una línea
 */
export const DataGateStatus: React.FC<{
  canAdvance: boolean;
  errorCount: number;
  className?: string;
}> = ({ canAdvance, errorCount, className }) => {
  if (canAdvance) {
    return (
      <div className={cn('flex items-center gap-2 text-success text-sm', className)}>
        <CheckCircle2 className="h-4 w-4" />
        <span>Listo para avanzar</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-destructive text-sm', className)}>
      <XCircle className="h-4 w-4" />
      <span>{errorCount} campo{errorCount !== 1 ? 's' : ''} pendiente{errorCount !== 1 ? 's' : ''}</span>
    </div>
  );
};

/**
 * Badge de severidad
 */
export const SeverityBadge: React.FC<{ severity: ValidationSeverity }> = ({ severity }) => {
  const config = {
    critical: {
      label: 'CRÍTICO',
      className: 'bg-destructive text-destructive-foreground',
    },
    error: {
      label: 'REQUERIDO',
      className: 'bg-warning text-warning-foreground',
    },
    warning: {
      label: 'ADVERTENCIA',
      className: 'bg-muted text-muted-foreground',
    },
  };

  const { label, className } = config[severity];

  return (
    <Badge className={cn('text-xs font-semibold', className)}>
      {label}
    </Badge>
  );
};

export default DataGateAlert;
