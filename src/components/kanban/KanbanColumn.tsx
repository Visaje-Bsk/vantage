import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrdenKanban, KanbanColumnType } from "@/types/kanban";
import { Clock, Building2, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface KanbanColumnProps {
  column: KanbanColumnType;
  onOrderClick: (order: OrdenKanban) => void;
}     

export function KanbanColumn({ column, onOrderClick }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-80 min-w-80">
      <Card className="mb-4 border-none shadow-sm bg-kanban-column">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              {column.title}
            </CardTitle>
            <Badge 
              variant="secondary" 
              className={`${column.color} text-xs font-medium px-2 py-1`}
            >
              {column.orders.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{column.description}</p>
        </CardHeader>
      </Card>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {column.orders.map((order) => (
          <Card
            key={order.id_orden_pedido}
            className="cursor-pointer bg-kanban-item hover:bg-kanban-item-hover border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-kanban"
            onClick={() => onOrderClick(order)}
          >
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Header Line: Order # · Client · Type · Status */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-semibold text-primary">
                    #{order.consecutivo || order.id_orden_pedido}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <div className="flex items-center gap-1 text-foreground font-medium min-w-0">
                    <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{order.nombre_cliente}</span>
                  </div>
                  <span className="text-muted-foreground">·</span>
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs py-0">
                      {order.tipo_orden}
                    </Badge>
                  </div>
                </div>

                {/* Project if available */}
                {order.proyecto_nombre && (
                  <div className="text-xs text-muted-foreground">
                    Proyecto: {order.proyecto_nombre}
                  </div>
                )}

                {/* Footer: Last Updated */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {order.fecha_modificacion
                        ? formatDistanceToNow(new Date(order.fecha_modificacion), {
                            addSuffix: true,
                            locale: es,
                          })
                        : "Sin fecha"}
                    </span>
                  </div>
                  
                  {order.comercial_encargado && (
                    <Badge variant="secondary" className="text-xs">
                      {order.comercial_encargado}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {column.orders.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No hay órdenes en esta etapa
          </div>
        )}
      </div>
    </div>
  );
}