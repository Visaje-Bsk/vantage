import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrdenKanban, estatusBadge } from '@/types/kanban';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Calendar, User, Building2, Hash, Clock } from 'lucide-react';

interface OrderCardProps {
  order: OrdenKanban;
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

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
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
  
  const accentColor = statusConfig?.color || '#6366f1';
  
  return (
    <Card className="group relative mb-3 overflow-hidden border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
      {/* Barra de color lateral */}
      <div 
        className="absolute left-0 top-0 w-1 h-full transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: accentColor }}
      />
      
      <CardContent className="p-4 pl-6">
        {/* Header con número de orden y badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 text-sm">
              {(order.consecutivo_code ?? order.consecutivo) || 'Sin consecutivo'}
            </h3>
          </div>
          <Badge 
            variant="secondary" 
            className="text-xs font-medium px-2 py-1 border-0 text-white"
            style={{ backgroundColor: accentColor }}
          >
            {statusConfig?.label || order.estatus || 'Sin estado'}
          </Badge>
        </div>

        {/* Información principal */}
        <div className="space-y-2 mb-4">
          {/* Cliente */}
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm leading-tight">
                {order.nombre_cliente || 'Sin cliente'}
              </p>
              {order.proyecto_nombre && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.proyecto_nombre}
                </p>
              )}
            </div>
          </div>

          {/* Comercial */}
          {createdByName && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500">Comercial: </span>
                <span className="text-xs font-medium text-gray-700">
                  {createdByName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer con fecha */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">
              Actualizado
            </span>
          </div>
          <span className="text-xs font-medium text-gray-600">
            {formatDateLong(order.fecha_modificacion)}
          </span>
        </div>

        {/* Efecto hover sutil */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:to-blue-50/20 pointer-events-none transition-all duration-300"
          style={{ 
            background: `linear-gradient(135deg, transparent 0%, ${accentColor}05 100%)` 
          }}
        />
      </CardContent>
    </Card>
  );
};

export default OrderCard;