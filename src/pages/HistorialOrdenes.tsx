/**
 * HistorialOrdenes
 *
 * Vista de historial con todas las órdenes cerradas y anuladas.
 * Incluye tabla con filtros, búsqueda, y funcionalidad de re-apertura para admins.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive, Search, RotateCcw, Eye, Calendar, Building2 } from "lucide-react";
import { OrdenKanban, estatusBadge, STAGE_UI, FASE_TO_UI } from "@/types/kanban";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import { OrderModal } from "@/components/modals/OrderModal";
import { SidebarTrigger } from "@/components/ui/sidebar";

type EstatusOrdenDB = Database["public"]["Enums"]["estatus_orden_enum"];

export default function HistorialOrdenes() {
  const { profile } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenKanban[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<OrdenKanban[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estatusFilter, setEstatusFilter] = useState<"all" | "cerrada" | "anulada">("all");
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [selectedOrderToReopen, setSelectedOrderToReopen] = useState<OrdenKanban | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrdenKanban | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    fetchArchivedOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ordenes, searchTerm, estatusFilter]);

  const fetchArchivedOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orden_pedido")
        .select(`
          *,
          cliente:cliente(nombre_cliente, nit),
          proyecto:proyecto(nombre_proyecto),
          clase_orden:clase_orden(tipo_orden),
          tipo_servicio:tipo_servicio(nombre_tipo_servicio),
          detalles:detalle_orden(cantidad, valor_unitario, equipo:equipo(nombre_equipo, codigo))
        `)
        .in("estatus", ["cerrada", "anulada"])
        .order("fecha_modificacion", { ascending: false });

      if (error) throw error;

      const transformed: OrdenKanban[] = (data || []).map((order: any) => ({
        id_orden_pedido: order.id_orden_pedido,
        consecutivo_code: order.consecutivo_code ?? null,
        consecutivo: order.consecutivo_code ?? (order.consecutivo != null ? String(order.consecutivo) : null),
        nombre_cliente: order.cliente?.nombre_cliente || "Cliente no especificado",
        tipo_orden: order.clase_orden?.tipo_orden || "Tipo no especificado",
        fase: order.fase,
        estatus: order.estatus as EstatusOrdenDB,
        fecha_creacion: order.fecha_creacion,
        fecha_modificacion: order.fecha_modificacion,
        observaciones_orden: order.observaciones_orden,
        proyecto_nombre: order.proyecto?.nombre_proyecto,
        nombre_tipo_servicio: order.tipo_servicio?.nombre_tipo_servicio,
        detalles: order.detalles,
        created_by: order.created_by,
        id_cliente: order.id_cliente,
        id_proyecto: order.id_proyecto,
        estado_orden: order.estatus,
        tipo_servicio: order.tipo_servicio?.nombre_tipo_servicio,
      }));

      setOrdenes(transformed);
    } catch (error) {
      console.error("Error fetching archived orders:", error);
      toast.error("Error al cargar el historial de órdenes");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = ordenes;

    // Filtro por búsqueda
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter((o) => {
        const consecutivoMatch = (o.consecutivo_code?.toString().toLowerCase() ?? o.consecutivo?.toString().toLowerCase() ?? "").includes(t);
        const clienteMatch = o.nombre_cliente?.toString().toLowerCase().includes(t) ?? false;
        const proyectoMatch = (o.proyecto_nombre?.toString().toLowerCase() ?? "").includes(t);
        return consecutivoMatch || clienteMatch || proyectoMatch;
      });
    }

    // Filtro por estatus
    if (estatusFilter !== "all") {
      filtered = filtered.filter((o) => o.estatus === estatusFilter);
    }

    setFilteredOrdenes(filtered);
  };

  const handleReopenOrder = (order: OrdenKanban) => {
    setSelectedOrderToReopen(order);
    setShowReopenDialog(true);
  };

  const confirmReopenOrder = async () => {
    if (!selectedOrderToReopen) return;

    try {
      const { error } = await supabase
        .from("orden_pedido")
        .update({
          estatus: "abierta",
          fecha_modificacion: new Date().toISOString(),
        })
        .eq("id_orden_pedido", selectedOrderToReopen.id_orden_pedido);

      if (error) throw error;

      // Registrar en historial
      await supabase.from("historial_orden").insert({
        id_orden_pedido: selectedOrderToReopen.id_orden_pedido,
        accion_clave: "orden_reabierta",
        fase_anterior: selectedOrderToReopen.fase,
        fase_nueva: selectedOrderToReopen.fase,
        observaciones: `Orden reabierta por admin desde historial`,
      });

      toast.success("Orden reabierta exitosamente");
      fetchArchivedOrders(); // Recargar lista
    } catch (error) {
      console.error("Error reopening order:", error);
      toast.error("Error al reabrir la orden");
    } finally {
      setShowReopenDialog(false);
      setSelectedOrderToReopen(null);
    }
  };

  const handleViewOrder = (order: OrdenKanban) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleUpdateOrder = (orderId: number, updates: Partial<OrdenKanban>) => {
    setOrdenes((prev) =>
      prev.map((o) =>
        o.id_orden_pedido === orderId ? { ...o, ...updates } : o
      )
    );
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Sin fecha";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
          <div className="bg-muted rounded-lg p-3">
            <Archive className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Historial de Órdenes</h1>
            <p className="text-sm text-muted-foreground">
              {filteredOrdenes.length} órdenes archivadas
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por consecutivo, cliente, proyecto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por estatus */}
            <Select
              value={estatusFilter}
              onValueChange={(value: any) => setEstatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="cerrada">Cerradas</SelectItem>
                <SelectItem value="anulada">Anuladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de órdenes */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consecutivo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Fecha Cierre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron órdenes archivadas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrdenes.map((orden) => {
                    const faseUI = FASE_TO_UI[orden.fase];
                    const faseConfig = STAGE_UI[faseUI];
                    const estatusConfig = estatusBadge[orden.estatus];

                    return (
                      <TableRow key={orden.id_orden_pedido}>
                        <TableCell className="font-medium">
                          #{orden.consecutivo || orden.id_orden_pedido}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {orden.nombre_cliente}
                          </div>
                        </TableCell>
                        <TableCell>{orden.proyecto_nombre || "-"}</TableCell>
                        <TableCell>
                          <Badge className={`${faseConfig.color} text-xs`}>
                            {faseConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${estatusConfig.color} text-xs`}>
                            {estatusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(orden.fecha_modificacion)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(orden)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            {isAdmin && orden.estatus !== "anulada" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReopenOrder(orden)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reabrir
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación para reabrir */}
      <ConfirmationDialog
        open={showReopenDialog}
        onOpenChange={setShowReopenDialog}
        onConfirm={confirmReopenOrder}
        title="¿Reabrir esta orden?"
        description={`¿Está seguro de reabrir la orden #${selectedOrderToReopen?.consecutivo || selectedOrderToReopen?.id_orden_pedido}? La orden volverá a aparecer en el tablero Kanban con estatus "Abierta".`}
        confirmText="Sí, reabrir orden"
        cancelText="Cancelar"
      />

      {/* Modal para ver detalle de orden */}
      <OrderModal
        order={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onUpdateOrder={handleUpdateOrder}
        currentUserRole={profile?.role ?? "comercial"}
      />
    </div>
  );
}
