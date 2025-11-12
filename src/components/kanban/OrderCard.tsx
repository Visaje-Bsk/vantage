import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrdenKanban, estatusBadge } from '@/types/kanban';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Calendar, User, Building2, Hash, Clock } from 'lucide-react';

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

const formatDateLong = (dateString: string | null): string => {
  if (!dateString) return 'Sin fecha';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, columnColor }) => {
  const statusConfig = estatusBadge[order.estatus];
  const [createdByName, setCreatedByName] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatedByName = async () => {
      if (!order?.created_by) {
        setCreatedByName(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("user_id", order.created_by)
        .single();
      if (error) {
        console.error("Error fetching profile nombre:", error);
        setCreatedByName(null);
        return;
      }
      setCreatedByName(data?.nombre ?? null);
    };

    fetchCreatedByName();
  }, [order?.created_by]);

  return (
    <Card className="group relative overflow-hidden border border-border/40 bg-card hover:bg-card/80 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
      {/* Barra superior coloreada según fase */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 ${columnColor || 'bg-primary'}`}
      />

      <CardContent className="p-4 pt-5">
        {/* Header con número de orden y badge */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-success text-base">
            #{(order.consecutivo_code ?? order.consecutivo) || 'Sin consecutivo'}
          </h3>
          <Badge
            className={`text-xs font-medium px-2.5 py-0.5 rounded-md border-0 ${statusConfig?.color || 'bg-muted text-muted-foreground'}`}
          >
            {statusConfig?.label || order.estatus || 'Sin estado'}
          </Badge>
        </div>

        {/* Información principal */}
        <div className="space-y-2.5">
          {/* Cliente */}
          <div>
            <p className="font-semibold text-card-foreground text-sm leading-tight mb-1">
              {order.nombre_cliente || 'Sin cliente'}
            </p>
            {order.proyecto_nombre && (
              <p className="text-xs text-muted-foreground">
                {order.proyecto_nombre}
              </p>
            )}
          </div>
        </div>

        {/* Footer con fecha y usuario */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center">
              <User className="w-3 h-3 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {createdByName || 'Sin asignar'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(order.fecha_modificacion)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;