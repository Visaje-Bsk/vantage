import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Phone, DollarSign, Calendar } from "lucide-react";
import type { OrderSummaryData } from "@/hooks/useOrderSummary";

interface SummaryDespachoProps {
  despacho: OrderSummaryData['despacho'];
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SummaryDespacho({ despacho }: SummaryDespachoProps) {
  if (!despacho) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Despacho
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          No hay información de despacho registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Despacho
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          {/* Columna izquierda */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Tipo de Despacho</p>
              <p className="font-medium">
                {despacho.tipo_despacho?.nombre_tipo_despacho || 'No especificado'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transportadora</p>
              <p className="font-medium">
                {despacho.transportadora?.nombre_transportadora || 'No especificada'}
              </p>
            </div>
            {despacho.numero_guia && (
              <div>
                <p className="text-xs text-muted-foreground">Número de Guía</p>
                <p className="font-medium font-mono">{despacho.numero_guia}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Valor del Flete</p>
                <p className="font-semibold text-primary">
                  {formatCurrency(despacho.valor_servicio_flete)}
                </p>
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha Despacho</p>
                <p className="font-medium">{formatDate(despacho.fecha_despacho)}</p>
              </div>
            </div>
            {despacho.fecha_entrega_cliente && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Entregado</p>
                  <p className="font-medium text-green-600">
                    {formatDate(despacho.fecha_entrega_cliente)}
                  </p>
                </div>
              </div>
            )}
            {(despacho.direccion_despacho?.direccion || despacho.direccion_despacho?.ciudad) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="font-medium">
                    {[despacho.direccion_despacho.direccion, despacho.direccion_despacho.ciudad]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}
            {(despacho.contacto_despacho?.nombre_contacto || despacho.contacto_despacho?.telefono) && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Contacto</p>
                  <p className="font-medium">
                    {[despacho.contacto_despacho.nombre_contacto, despacho.contacto_despacho.telefono]
                      .filter(Boolean)
                      .join(' - ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        {(despacho.observaciones || despacho.observaciones_proceso) && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {despacho.observaciones && (
              <div>
                <p className="text-xs text-muted-foreground">Observaciones de Logística</p>
                <p className="text-sm">{despacho.observaciones}</p>
              </div>
            )}
            {despacho.observaciones_proceso && (
              <div>
                <p className="text-xs text-muted-foreground">Observaciones del Proceso</p>
                <p className="text-sm">{despacho.observaciones_proceso}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
