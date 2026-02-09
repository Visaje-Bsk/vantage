/**
 * ReadonlyProductosServicios
 *
 * Componente memoizado para mostrar productos y servicios en modo solo lectura.
 * Extraído de ComercialTab para evitar re-renders cuando cambian datos de edición.
 */

import { memo } from "react";
import type { ProductLine } from "@/hooks/comercial/useProductLines";
import type { ServiceLine } from "@/hooks/comercial/useServiceLines";
import type { Database } from "@/integrations/supabase/types";

type OperadorRow = Database["public"]["Tables"]["operador"]["Row"];
type PlanRow = Database["public"]["Tables"]["plan"]["Row"];
type ApnRow = Database["public"]["Tables"]["apn"]["Row"];

interface ReadonlyProductosServiciosProps {
  productLines: ProductLine[];
  serviceLines: ServiceLine[];
  operadores: OperadorRow[];
  planes: PlanRow[];
  apns: ApnRow[];
  formatCOP: (value: string | number) => string;
}

function ReadonlyProductosServiciosComponent({
  productLines,
  serviceLines,
  operadores,
  planes,
  apns,
  formatCOP,
}: ReadonlyProductosServiciosProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Equipos Configurados</h4>
        {productLines.length > 0 && productLines.some(line => line.selectedEquipo) ? (
          <div className="space-y-2">
            {productLines
              .filter(line => line.selectedEquipo)
              .map((line, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Equipo:</span> {line.selectedEquipo?.nombre_equipo}
                  </div>
                  <div>
                    <span className="font-medium">Código:</span> {line.selectedEquipo?.codigo}
                  </div>
                  <div>
                    <span className="font-medium">Cantidad:</span> {line.cantidad || "0"}
                  </div>
                  <div>
                    <span className="font-medium">Valor:</span> {formatCOP(line.valorUnitario)}
                  </div>
                </div>
                {line.plantilla && line.plantillaText && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs border-l-2 border-blue-500">
                    <span className="font-medium">Plantilla:</span> {line.plantillaText}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            No hay equipos configurados
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-sm">Líneas de Servicio</h4>
        {serviceLines.length > 0 && serviceLines.some(line => line.operadorId) ? (
          <div className="space-y-2">
            {serviceLines
              .filter(line => line.operadorId)
              .map((line, idx) => {
                const operadorNombre = operadores.length > 0
                  ? operadores.find(op => op.id_operador.toString() === line.operadorId)?.nombre_operador
                  : null;
                const planNombre = planes.length > 0
                  ? planes.find(p => p.id_plan.toString() === line.planId)?.nombre_plan
                  : null;
                const apnNombre = apns.length > 0
                  ? apns.find(a => a.id_apn.toString() === line.apnId)?.apn
                  : null;

                return (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Operador:</span> {operadorNombre || `ID: ${line.operadorId}`}
                      </div>
                      <div>
                        <span className="font-medium">Plan:</span> {planNombre || `ID: ${line.planId}`}
                      </div>
                      <div>
                        <span className="font-medium">APN:</span> {apnNombre || `ID: ${line.apnId}`}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm mt-2">
                      <div>
                        <span className="font-medium">Permanencia:</span> {line.permanencia} meses
                      </div>
                      <div>
                        <span className="font-medium">Clase Cobro:</span> {line.claseCobro}
                      </div>
                      <div>
                        <span className="font-medium">Cantidad Líneas:</span> {line.cantidadLineas || "0"}
                      </div>
                      <div>
                        <span className="font-medium">Valor:</span> {formatCOP(line.valorMensual)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            No hay líneas de servicio configuradas
          </div>
        )}
      </div>
    </div>
  );
}

export const ReadonlyProductosServicios = memo(ReadonlyProductosServiciosComponent);
