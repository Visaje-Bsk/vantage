import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OrdenKanban, estatusBadge } from '@/types/kanban';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface OrderCardProps {
  order: OrdenKanban;
  columnColor?: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Sin fecha';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, columnColor }) => {
  const statusConfig = estatusBadge[order.estatus];
  const [createdByName, setCreatedByName] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatedByName = async () => {
      if (!order?.created_by) { setCreatedByName(null); return; }
      const { data, error } = await supabase
        .from("profiles").select("nombre").eq("user_id", order.created_by).single();
      if (error) { setCreatedByName(null); return; }
      setCreatedByName(data?.nombre ?? null);
    };
    fetchCreatedByName();
  }, [order?.created_by]);

  // Extraer iniciales del nombre
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="group relative bg-card border border-border/50 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-150 cursor-pointer overflow-hidden">
      {/* Barra lateral izquierda de color por fase */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${columnColor || 'bg-primary'}`} />

      <div className="pl-3 pr-3 pt-2.5 pb-2">
        {/* Fila 1: Consecutivo */}
        <span className="font-mono font-bold text-success text-[11px] tracking-wide block mb-1">
          #{(order.consecutivo_code ?? order.consecutivo) || order.id_orden_pedido}
        </span>

        {/* Fila 2: Nombre cliente */}
        <p className="text-[12px] font-semibold text-foreground leading-tight truncate mb-0.5">
          {order.nombre_cliente || 'Sin cliente'}
        </p>

        {/* Fila 3: Proyecto */}
        <p className="text-[11px] text-muted-foreground truncate mb-2 min-h-[16px]">
          {order.proyecto_nombre || ''}
        </p>

        {/* Fila 4: Footer — estatus + avatar + fecha */}
        <div className="flex items-center justify-between pt-1.5 border-t border-border/40 gap-1">
          {/* Badge estatus */}
          <Badge
            className={`text-[10px] font-semibold px-1.5 py-0 rounded border-0 leading-[18px] flex-shrink-0 ${statusConfig?.color || 'bg-muted text-muted-foreground'}`}
          >
            {statusConfig?.label || order.estatus}
          </Badge>

          {/* Avatar + fecha */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary leading-none">
                {getInitials(createdByName)}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDate(order.fecha_modificacion)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;