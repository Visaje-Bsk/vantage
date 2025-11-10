import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  STAGE_UI, 
  UI_TO_FASE, 
  FASE_TO_UI, 
  type OrdenStageUI, 
  type FaseOrdenDB, 
  estatusBadge, 
  OrdenKanban
} from "@/types/kanban";
import type { Database } from "@/integrations/supabase/types";
type AppRole = Database["public"]["Enums"]["app_role"];
import { 
  Building2, 
  User, 
  Calendar, 
  ArrowRight,
  FileText,
  Tag,
  Clock
} from "lucide-react";
import { ComercialTab } from "./tabs/ComercialTab";
import { InventariosTab } from "./tabs/InventariosTab";
import { ProduccionTab } from "./tabs/ProduccionTab";
import { LogisticaTab } from "./tabs/LogisticaTab";
import { FacturacionTab } from "./tabs/FacturacionTab";
import { FinancieraTab } from "./tabs/FinancieraTab";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NEXT_FASE: Record<OrdenStageUI, FaseOrdenDB | null> = {
  comercial: "inventarios",
  inventarios: "produccion",
  produccion: "logistica",
  logistica: "facturacion",
  facturacion: "financiera",
  financiera: null,
};

const REQUIRED_ROLE_BY_FASE: Record<FaseOrdenDB, AppRole> = {
  comercial: "comercial",
  inventarios: "inventarios",
  produccion: "produccion",
  logistica: "logistica",
  facturacion: "facturacion",
  financiera: "financiera",
};

interface OrderModalProps {
  order: OrdenKanban | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  currentUserRole?: string;
}

export function OrderModal({
  order,
  isOpen,
  onClose,
  onUpdateOrder,
  currentUserRole = "admin"
}: OrderModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<OrdenStageUI>("comercial");
  const [createdByName, setCreatedByName] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const uiTabFromFase = (fase: FaseOrdenDB): OrdenStageUI => {
    const entry = (Object.entries(UI_TO_FASE) as [OrdenStageUI, FaseOrdenDB][])
      .find(([_, value]) => value === fase);
    return entry ? entry[0] : "comercial";
  };

  useEffect(() => {
    if (order?.fase) {
      setActiveTab(FASE_TO_UI[order.fase as FaseOrdenDB] ?? "comercial");
    }
  }, [order]);

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

  const isAdmin = (currentUserRole as AppRole) === "admin";
  const canUserEditFase = (fase: FaseOrdenDB) => 
    isAdmin || (currentUserRole === REQUIRED_ROLE_BY_FASE[fase]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
  };

  const confirmClose = () => {
    setHasUnsavedChanges(false);
    setShowCloseConfirm(false);
    onClose();
  };

  const handleAdvanceStage = async () => {
    if (!order) return;
    
    const nextFase = NEXT_FASE[activeTab];
    if (!nextFase) return;
    
    if (!canUserEditFase(UI_TO_FASE[activeTab])) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para avanzar a esta etapa.",
        variant: "destructive"
      });
      return;
    }

    const updates = {
      fase: nextFase,
      estatus: "abierta" as const,
      fecha_modificacion: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("orden_pedido")
      .update(updates)
      .eq("id_orden_pedido", order.id_orden_pedido);

    if (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la orden. Por favor, intente de nuevo.",
        variant: "destructive"
      });
      return;
    }

    onUpdateOrder(order.id_orden_pedido, updates);
    toast({
      title: "¡Éxito!",
      description: `La orden ha avanzado a la etapa de ${STAGE_UI[uiTabFromFase(nextFase)].label}`,
      variant: "default"
    });
  };

  if (!order) return null;

  const stageMeta = STAGE_UI[activeTab];
  const estMeta = estatusBadge[order.estatus];

  // Calcular si la orden fue actualizada
  const wasUpdated = order.fecha_modificacion && order.fecha_creacion && 
    new Date(order.fecha_modificacion).getTime() !== new Date(order.fecha_creacion).getTime();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent 
          className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0"
          onPointerDownOutside={(e) => {
            if (hasUnsavedChanges) {
              e.preventDefault();
              setShowCloseConfirm(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (hasUnsavedChanges) {
              e.preventDefault();
              setShowCloseConfirm(true);
            }
          }}
        >
          {/* Header mejorado */}
          <DialogHeader className="border-b bg-muted/30 px-6 py-5 space-y-4">
            {/* Primera fila: Título, badges */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl font-bold">
                  Orden #{order.consecutivo || order.id_orden_pedido}
                </DialogTitle>
                <Badge 
                  className={cn(
                    "text-white font-medium px-3 py-1",
                    stageMeta.color
                  )}
                >
                  {stageMeta.label}
                </Badge>
                <Badge 
                  className={cn(
                    "font-medium px-3 py-1",
                    estMeta.color
                  )}
                >
                  {estMeta.label}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Segunda fila: Información en grid responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2.5 rounded-md bg-background/50 border">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground font-medium">Cliente</span>
                  <span className="font-semibold truncate">
                    {order.nombre_cliente || "Sin asignar"}
                  </span>
                </div>
              </div>

              {order.proyecto_nombre && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-background/50 border">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground font-medium">Proyecto</span>
                    <span className="font-semibold truncate">
                      {order.proyecto_nombre}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-2.5 rounded-md bg-background/50 border">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground font-medium">Comercial</span>
                  <span className="font-semibold truncate">
                    {createdByName || "Sin asignar"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-md bg-background/50 border">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground font-medium">Creada</span>
                  <span className="font-semibold">
                    {order.fecha_creacion 
                      ? new Date(order.fecha_creacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'Sin fecha'
                    }
                  </span>
                </div>
              </div>

              {wasUpdated && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-background/50 border">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground font-medium">Actualizada</span>
                    <span className="font-semibold">
                      {new Date(order.fecha_modificacion!).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {order.nombre_tipo_servicio && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-background/50 border">
                  <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground font-medium">Servicio</span>
                    <span className="font-semibold truncate">
                      {order.nombre_tipo_servicio}
                    </span>
                  </div>
                </div>
              )}

              {order.orden_compra && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-background/50 border">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground font-medium">Orden de Compra</span>
                    <span className="font-semibold truncate">
                      {order.orden_compra}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Contenido con tabs FIJOS y contenido SCROLLEABLE */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as OrdenStageUI)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Tabs FIJAS (no scrollean) */}
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 mx-6 mt-4 mb-2 h-auto p-1 bg-muted/50 shrink-0">
                {Object.entries(STAGE_UI).map(([key, config]) => {
                  const Icon = config.icon ?? User;
                  const isActive = activeTab === key;
                  return (
                    <TabsTrigger 
                      key={key} 
                      value={key}
                      className={cn(
                        "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2",
                        "px-2 py-2 sm:px-3 sm:py-2.5",
                        "text-xs sm:text-sm font-medium",
                        "transition-all duration-200",
                        "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                        isActive && "ring-2 ring-primary/20"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate text-center sm:text-left">{config.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Contenido SCROLLEABLE - Igual al código original */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
                <TabsContent value="comercial" className="mt-0">
                  <ComercialTab
                    order={order}
                    onUpdateOrder={onUpdateOrder}
                    onRequestClose={handleClose}
                    onUnsavedChangesChange={setHasUnsavedChanges}
                  />
                </TabsContent>
                
                <TabsContent value="inventarios" className="mt-0">
                  <InventariosTab order={order} onUpdateOrder={onUpdateOrder} />
                </TabsContent>
                
                <TabsContent value="produccion" className="mt-0">
                  <ProduccionTab order={order} onUpdateOrder={onUpdateOrder} />
                </TabsContent>
                
                <TabsContent value="logistica" className="mt-0">
                  <LogisticaTab order={order} onUpdateOrder={onUpdateOrder} />
                </TabsContent>
                
                <TabsContent value="facturacion" className="mt-0">
                  <FacturacionTab order={order} onUpdateOrder={onUpdateOrder} />
                </TabsContent>
                
                <TabsContent value="financiera" className="mt-0">
                  <FinancieraTab order={order} onUpdateOrder={onUpdateOrder} />
                </TabsContent>
              </div>

              {/* Footer con botón de avanzar - FIJO al fondo */}
              {NEXT_FASE[activeTab] && canUserEditFase(UI_TO_FASE[activeTab]) && (
                <div className="border-t bg-background px-6 py-4 shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      ¿Completaste todas las tareas de esta etapa?
                    </div>
                    <Button 
                      onClick={handleAdvanceStage} 
                      size="lg"
                      className="gap-2 shadow-sm"
                    >
                      Avanzar a {STAGE_UI[uiTabFromFase(NEXT_FASE[activeTab] as FaseOrdenDB)].label}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación */}
      <ConfirmationDialog
        open={showCloseConfirm}
        onOpenChange={setShowCloseConfirm}
        title="Cambios sin guardar"
        description="Tienes cambios sin guardar en esta orden. Si cierras ahora, perderás todos los cambios realizados."
        confirmText="Cerrar sin guardar"
        cancelText="Continuar editando"
        variant="destructive"
        onConfirm={confirmClose}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  );
}