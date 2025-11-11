/**
 * Componente de Alerta para Data Gates
 *
 * Muestra los errores de validación de forma visual y clara,
 * ayudando al usuario a entender qué campos faltan para avanzar.
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ValidationError, ValidationSeverity } from '@/types/dataGates';
import { cn } from '@/lib/utils';

interface DataGateAlertProps {
  errors: ValidationError[];
  canAdvance: boolean;
  phaseName: string;
  className?: string;
}

/**
 * Componente principal de alerta
 */
export const DataGateAlert: React.FC<DataGateAlertProps> = ({
  errors,
  canAdvance,
  phaseName,
  className,
}) => {
  // Si puede avanzar, mostrar mensaje de éxito
  if (canAdvance) {
    return (
      <Alert className={cn('border-success/50 bg-success/10', className)}>
        <CheckCircle2 className="h-5 w-5 text-success" />
        <AlertTitle className="text-success">Fase {phaseName} Completa</AlertTitle>
        <AlertDescription className="text-success-foreground/80">
          ✓ Todos los campos obligatorios están completos. Puede avanzar a la siguiente fase.
        </AlertDescription>
      </Alert>
    );
  }

  // Agrupar errores por severidad
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const regularErrors = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning');

  return (
    <div className={cn('space-y-3', className)}>
      {/* Errores Críticos */}
      {criticalErrors.length > 0 && (
        <Alert variant="destructive" className="border-destructive bg-destructive/10">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="flex items-center gap-2">
            Campos Críticos Faltantes
            <Badge variant="destructive" className="text-xs">
              {criticalErrors.length}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2 text-sm">
              Los siguientes campos son <strong>OBLIGATORIOS</strong> para avanzar:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {criticalErrors.map((error, idx) => (
                <li key={idx} className="text-sm">
                  <strong>{error.message}</strong>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Errores Regulares */}
      {regularErrors.length > 0 && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertCircle className="h-5 w-5 text-warning" />
          <AlertTitle className="flex items-center gap-2 text-warning">
            Campos Obligatorios Faltantes
            <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">
              {regularErrors.length}
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-warning-foreground/80">
            <ul className="list-disc pl-5 space-y-1">
              {regularErrors.map((error, idx) => (
                <li key={idx} className="text-sm">
                  {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Advertencias */}
      {warnings.length > 0 && (
        <Alert className="border-muted bg-muted/30">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <AlertTitle className="flex items-center gap-2 text-muted-foreground">
            Advertencias
            <Badge variant="outline" className="text-xs">
              {warnings.length}
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              {warnings.map((error, idx) => (
                <li key={idx} className="text-sm">
                  {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
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
