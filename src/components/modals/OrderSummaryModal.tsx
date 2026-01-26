import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, X } from "lucide-react";
import { useOrderSummary } from "@/hooks/useOrderSummary";
import { useDuplicateOrder } from "@/hooks/useDuplicateOrder";
import { SummaryHeader } from "./order-summary/SummaryHeader";
import { SummaryKPIs } from "./order-summary/SummaryKPIs";
import { SummaryClienteProyecto } from "./order-summary/SummaryClienteProyecto";
import { SummaryProducts } from "./order-summary/SummaryProducts";
import { SummaryDespacho } from "./order-summary/SummaryDespacho";
import { SummaryFacturacion } from "./order-summary/SummaryFacturacion";
import { SummaryTimeline } from "./order-summary/SummaryTimeline";
import type { FaseOrdenDB, EstatusOrdenDB } from "@/types/kanban";

interface OrderSummaryModalProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onDuplicate?: (newOrderId: number) => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

export function OrderSummaryModal({
  orderId,
  isOpen,
  onClose,
  onDuplicate,
}: OrderSummaryModalProps) {
  const { data, isLoading, error } = useOrderSummary(orderId);
  const { duplicateOrder, isDuplicating } = useDuplicateOrder();

  const handleDuplicate = async () => {
    if (!orderId) return;

    const newOrderId = await duplicateOrder(orderId);
    if (newOrderId) {
      onClose();
      onDuplicate?.(newOrderId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-destructive">Error al cargar la orden</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Cerrar
            </Button>
          </div>
        ) : data?.orden ? (
          <>
            {/* Header fijo */}
            <div className="shrink-0">
              <SummaryHeader
                consecutivo={data.orden.consecutivo_code || data.orden.consecutivo}
                estatus={data.orden.estatus as EstatusOrdenDB}
                fase={data.orden.fase as FaseOrdenDB}
                clienteNombre={data.orden.cliente?.nombre_cliente || null}
              />
            </div>

            {/* Contenido scrolleable */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-6">
                {/* KPIs */}
                <SummaryKPIs
                  fechaCreacion={data.orden.fecha_creacion}
                  fechaCierre={data.orden.fecha_modificacion}
                />

                <Separator />

                {/* Cliente y Proyecto */}
                <SummaryClienteProyecto
                  clienteNombre={data.orden.cliente?.nombre_cliente || null}
                  clienteNit={data.orden.cliente?.nit || null}
                  proyectoNombre={data.orden.proyecto?.nombre_proyecto || null}
                  comercialNombre={data.createdByProfile?.nombre || data.createdByProfile?.username || null}
                  tipoServicio={data.orden.tipo_servicio?.nombre_tipo_servicio || null}
                />

                <Separator />

                {/* Productos y Servicios */}
                <SummaryProducts detalles={data.detalles} />

                <Separator />

                {/* Despacho */}
                <SummaryDespacho despacho={data.despacho} />

                <Separator />

                {/* Facturación */}
                <SummaryFacturacion
                  facturas={data.facturas}
                  remision={data.remision}
                />

                <Separator />

                {/* Timeline */}
                <SummaryTimeline
                  historial={data.historial}
                  fechaCreacion={data.orden.fecha_creacion}
                />

                {/* Observaciones de la orden */}
                {data.orden.observaciones_orden && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        Observaciones de la Orden
                      </p>
                      <p className="text-sm">{data.orden.observaciones_orden}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Footer con acciones */}
            <div className="shrink-0 border-t bg-background px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {isDuplicating ? 'Duplicando...' : 'Duplicar Orden'}
                </Button>
                <Button variant="default" onClick={onClose}>
                  <X className="h-4 w-4 mr-2" />
                  Cerrar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            No se encontró la orden
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
