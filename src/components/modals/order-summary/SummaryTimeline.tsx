import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ArrowRight, CheckCircle2, XCircle, PlayCircle } from "lucide-react";
import type { OrderSummaryData } from "@/hooks/useOrderSummary";

interface SummaryTimelineProps {
  historial: OrderSummaryData['historial'];
  fechaCreacion: string | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFaseLabel(fase: string | null): string {
  if (!fase) return 'N/A';
  const fases: Record<string, string> = {
    'comercial': 'Comercial',
    'inventarios': 'Inventarios',
    'produccion': 'Producción',
    'financiera': 'Financiera',
    'facturacion': 'Facturación',
    'logistica': 'Logística',
  };
  return fases[fase] || fase;
}

function getAccionIcon(accion: string) {
  if (accion.includes('cerrada') || accion.includes('completada')) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (accion.includes('anulada')) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  return <PlayCircle className="h-4 w-4 text-blue-500" />;
}

function getAccionLabel(accion: string): string {
  const acciones: Record<string, string> = {
    'orden_creada': 'Orden creada',
    'fase_avanzada': 'Fase avanzada',
    'orden_cerrada': 'Orden cerrada',
    'orden_anulada': 'Orden anulada',
    'orden_reabierta': 'Orden reabierta',
  };
  return acciones[accion] || accion;
}

export function SummaryTimeline({ historial, fechaCreacion }: SummaryTimelineProps) {
  // Si no hay historial, mostrar mensaje
  if (!historial || historial.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="h-4 w-4" />
            Timeline del Proceso
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          <p>No hay historial de cambios registrado</p>
          {fechaCreacion && (
            <p className="text-sm mt-2">
              Orden creada el {formatDate(fechaCreacion)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Timeline del Proceso ({historial.length} eventos)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Línea vertical de conexión */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {historial.map((evento) => (
              <div key={evento.id_historial} className="flex gap-4 relative">
                {/* Icono con punto */}
                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-border shadow-sm">
                  {getAccionIcon(evento.accion_clave)}
                </div>

                {/* Contenido */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {getAccionLabel(evento.accion_clave)}
                    </span>
                    {evento.fase_anterior && evento.fase_nueva && evento.fase_anterior !== evento.fase_nueva && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">
                          {getFaseLabel(evento.fase_anterior)}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                          {getFaseLabel(evento.fase_nueva)}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{formatDate(evento.timestamp_accion)}</span>
                    <span>{formatTime(evento.timestamp_accion)}</span>
                    {evento.actor_nombre && (
                      <span className="font-medium text-foreground">
                        {evento.actor_nombre}
                      </span>
                    )}
                  </div>

                  {evento.observaciones && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {evento.observaciones}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
