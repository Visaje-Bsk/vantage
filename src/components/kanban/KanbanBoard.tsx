import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrdenKanban, KanbanColumnType, OrdenStageUI, FaseOrdenDB, EstatusOrdenDB, UI_TO_FASE, STAGE_UI } from "@/types/kanban";
import { OrderModal } from '../modals/OrderModal';
import { OrderCard } from './OrderCard';
import { NuevaOrdenModal } from './NuevaOrdenModal';

interface KanbanBoardProps {
  onOrderClick: (order: OrdenKanban) => void;
  searchTerm: string;
  statusFilter: EstatusOrdenDB | 'all';
  isNuevaOrdenModalOpen: boolean;
  onNuevaOrdenModalChange: (open: boolean) => void;
  openOrderId?: number | null;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOrderClick, searchTerm, statusFilter, isNuevaOrdenModalOpen, onNuevaOrdenModalChange, openOrderId }) => {
  const { profile } = useAuth();
  const [allOrders, setAllOrders] = useState<OrdenKanban[]>([]); // Mantener todas las órdenes originales
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrdenKanban | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const EMPTY_COLUMNS = useMemo<KanbanColumnType[]>(
    () =>
      (Object.keys(STAGE_UI) as OrdenStageUI[]).map((key) => ({
        id: key,
        title: STAGE_UI[key].label,
        color: STAGE_UI[key].color,
        bgColor: STAGE_UI[key].bgColor,
        borderColor: STAGE_UI[key].borderColor,
        orders: [],
        description: "",
      })),
    []
  );

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orden_pedido')
        .select(`
          *,
          cliente:cliente(nombre_cliente, nit),
          proyecto:proyecto(nombre_proyecto),
          clase_orden:clase_orden(tipo_orden),
          tipo_servicio:tipo_servicio(nombre_tipo_servicio),
          detalles:detalle_orden(cantidad, valor_unitario, equipo:equipo(nombre_equipo, codigo))
        `)
        .order('fecha_modificacion', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      const transformed: OrdenKanban[] = (ordersData || []).map((order: any) => ({
        id_orden_pedido: order.id_orden_pedido,
        consecutivo_code: order.consecutivo_code ?? null,
        consecutivo: (order.consecutivo_code ?? (order.consecutivo != null ? String(order.consecutivo) : null)),
        nombre_cliente: order.cliente?.nombre_cliente || 'Cliente no especificado',
        tipo_orden: order.clase_orden?.tipo_orden || 'Tipo no especificado',
        fase: order.fase as FaseOrdenDB,
        estatus: order.estatus as EstatusOrdenDB,
        fecha_creacion: order.fecha_creacion,
        fecha_modificacion: order.fecha_modificacion,
        observaciones_orden: order.observaciones_orden,
        proyecto_nombre: order.proyecto?.nombre_proyecto,
        nombre_tipo_servicio: order.tipo_servicio?.nombre_tipo_servicio,
        detalles: order.detalles,
        created_by: order.created_by,
        // Agregamos campos que pueden faltar en órdenes nuevas
        id_cliente: order.id_cliente,
        id_clase_orden: order.id_clase_orden,
        id_proyecto: order.id_proyecto,
        estado_orden: order.estatus, // Para compatibilidad con el modal
        tipo_servicio: order.tipo_servicio?.nombre_tipo_servicio,
      }));

      setAllOrders(transformed); // Guardar todas las órdenes
      applyIntoColumns(transformed);
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
    }
  };

  // Función helper para determinar si una orden está activa (no archivada)
  const isActiveOrder = (order: OrdenKanban): boolean => {
    return order.estatus !== 'cerrada' && order.estatus !== 'anulada';
  };

  const applyIntoColumns = (allOrders: OrdenKanban[]) => {
    // 0) Filtrar solo órdenes activas (excluir cerradas y anuladas del Kanban)
    const activeOrders = allOrders.filter(isActiveOrder);

    // 1) Filtrado por búsqueda (consecutivo, cliente, proyecto, fechas)
    let filtered = searchTerm
      ? activeOrders.filter((o) => {
          const t = searchTerm.toLowerCase();

          // Buscar en consecutivo
          const consecutivoMatch = (o.consecutivo_code?.toString().toLowerCase() ?? o.consecutivo?.toString().toLowerCase() ?? "").includes(t);

          // Buscar en cliente
          const clienteMatch = o.nombre_cliente?.toString().toLowerCase().includes(t) ?? false;

          // Buscar en proyecto
          const proyectoMatch = (o.proyecto_nombre?.toString().toLowerCase() ?? "").includes(t);

          // Buscar en fechas (formato completo o parcial: "2024", "2024-07", "2024-07-20")
          const fechaCreacionMatch = o.fecha_creacion?.includes(t) ?? false;
          const fechaModificacionMatch = o.fecha_modificacion?.includes(t) ?? false;

          // Buscar en fechas formateadas legibles (ej: "julio", "20 de julio")
          let fechaFormateadaMatch = false;
          if (o.fecha_creacion || o.fecha_modificacion) {
            try {
              const fecha = o.fecha_modificacion ?? o.fecha_creacion;
              if (fecha) {
                const fechaObj = new Date(fecha);
                const fechaLegible = fechaObj.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).toLowerCase();
                fechaFormateadaMatch = fechaLegible.includes(t);
              }
            } catch (e) {
              // Ignorar errores de parseo de fecha
            }
          }

          return consecutivoMatch || clienteMatch || proyectoMatch || fechaCreacionMatch || fechaModificacionMatch || fechaFormateadaMatch;
        })
      : activeOrders;

    // 2) Filtrado por estatus
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.estatus === statusFilter);
    }

    // 3) Reparto por columnas UI a partir del estado DB
    const nextCols = EMPTY_COLUMNS.map((col) => ({
      ...col,
      orders: filtered.filter((o) => o.fase === UI_TO_FASE[col.id]),
    }));

    setColumns(nextCols);
  };

  const handleOrderClick = (order: OrdenKanban) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
    onOrderClick(order);
  };

  const handleUpdateOrder = (orderId: number, updates: Partial<OrdenKanban>) => {
    // Actualizar el estado de allOrders
    setAllOrders((prev) => {
      const updated = prev.map((o) =>
        o.id_orden_pedido === orderId ? { ...o, ...updates } : o
      );
      // Re-aplicar filtros con las órdenes actualizadas
      applyIntoColumns(updated);
      return updated;
    });
  };

  // Función que se ejecuta cuando se crea una nueva orden
  const handleOrderCreated = async (orderId: number) => {
    try {
      // Fetch the specific newly created order with all its relations
      const { data: newOrderData, error } = await supabase
        .from('orden_pedido')
        .select(`
          *,
          cliente:cliente(nombre_cliente, nit),
          proyecto:proyecto(nombre_proyecto),
          clase_orden:clase_orden(tipo_orden),
          tipo_servicio:tipo_servicio(nombre_tipo_servicio),
          detalles:detalle_orden(cantidad, valor_unitario, equipo:equipo(nombre_equipo, codigo))
        `)
        .eq('id_orden_pedido', orderId)
        .single();

      if (error) {
        console.error('Error fetching new order:', error);
        await fetchOrders(); // Fallback to refresh all orders
        return;
      }

      // Transform the new order to match OrdenKanban interface
      const transformedOrder: OrdenKanban = {
        id_orden_pedido: newOrderData.id_orden_pedido,
        consecutivo_code: newOrderData.consecutivo_code ?? null,
        consecutivo: (newOrderData.consecutivo_code ?? (newOrderData.consecutivo != null ? String(newOrderData.consecutivo) : null)),
        nombre_cliente: newOrderData.cliente?.nombre_cliente || 'Cliente no especificado',
        tipo_orden: newOrderData.clase_orden?.tipo_orden || 'Tipo no especificado',
        fase: newOrderData.fase as FaseOrdenDB,
        estatus: newOrderData.estatus as EstatusOrdenDB,
        fecha_creacion: newOrderData.fecha_creacion,
        fecha_modificacion: newOrderData.fecha_modificacion,
        observaciones_orden: newOrderData.observaciones_orden,
        proyecto_nombre: newOrderData.proyecto?.nombre_proyecto,
        nombre_tipo_servicio: newOrderData.tipo_servicio?.nombre_tipo_servicio,
         detalles: newOrderData.detalles,
         created_by: newOrderData.created_by,
         id_cliente: newOrderData.id_cliente,
         id_clase_orden: newOrderData.id_clase_orden,
      };

      // Refrescar todas las órdenes del kanban
      await fetchOrders();

      // Directly open the OrderModal with the new order
      setSelectedOrder(transformedOrder);
      setIsOrderModalOpen(true);

    } catch (error) {
      console.error('Error in handleOrderCreated:', error);
      await fetchOrders(); // Fallback to refresh all orders
    }
  };

  // Función que se ejecuta cuando se duplica una orden
  const handleOrderDuplicated = async (newOrderId: number) => {
    // Reutilizamos la lógica de handleOrderCreated
    await handleOrderCreated(newOrderId);
  };

  // Re-apply filters when search term or status filter changes
  useEffect(() => {
    if (loading || allOrders.length === 0) return;
    applyIntoColumns(allOrders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  // Abrir orden automáticamente cuando se navega desde otra página (ej: duplicación desde historial)
  useEffect(() => {
    if (openOrderId && !loading) {
      handleOrderCreated(openOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openOrderId, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando órdenes...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 min-w-max h-full">
          {columns.map((column) => (
            <div key={column.id} className="w-[340px] flex-shrink-0 h-full">
              {/* Header de columna estilo moderno */}
              <div className="flex flex-col h-full">
                {/* Panel header moderno con gradiente y sombra */}
                <div className={`${column.bgColor} border-l-4 ${column.borderColor} rounded-lg shadow-sm mb-4 p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${column.color} rounded-lg px-3 py-1.5 shadow-sm`}>
                        <h3 className="text-sm font-bold tracking-wide">
                          {column.title}
                        </h3>
                      </div>
                    </div>
                    <Badge
                      className={`${column.color} rounded-full h-7 min-w-[28px] px-2.5 font-semibold shadow-sm`}
                    >
                      {column.orders.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards container */}
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-3">
                    {column.orders.map((order) => (
                      <div
                        key={order.id_orden_pedido}
                        onClick={() => handleOrderClick(order)}
                        className="cursor-pointer"
                      >
                        <OrderCard order={order} columnColor={column.color} />
                      </div>
                    ))}

                    {column.orders.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground/50">
                        <div className="text-xs">Sin órdenes</div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para órdenes existentes */}
      <OrderModal
        order={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onUpdateOrder={handleUpdateOrder}
        currentUserRole={profile?.role ?? "comercial"}
        onOrderDuplicated={handleOrderDuplicated}
      />

      {/* Modal para nueva orden */}
      <NuevaOrdenModal
        open={isNuevaOrdenModalOpen}
        onOpenChange={onNuevaOrdenModalChange}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};

export default KanbanBoard;