import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Clock,
  XCircle,
  AlertTriangle
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
  produccion: "financiera",    // Nuevo flujo: produccion → financiera
  financiera: "facturacion",   // financiera → facturacion
  facturacion: "logistica",    // facturacion → logistica
  logistica: null,             // logistica es la fase final
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
  const [showAnularConfirm, setShowAnularConfirm] = useState(false);
  const [razonAnulacion, setRazonAnulacion] = useState("");
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Estado dirty por cada tab
  const [tabDirtyStates, setTabDirtyStates] = useState<Record<OrdenStageUI, boolean>>({
    comercial: false,
    inventarios: false,
    produccion: false,
    logistica: false,
    facturacion: false,
    financiera: false,
  });

  // Callback para que cada tab reporte su estado dirty
  const handleTabDirtyChange = useCallback((tab: OrdenStageUI, isDirty: boolean) => {
    setTabDirtyStates(prev => ({ ...prev, [tab]: isDirty }));
  }, []);


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

  const handleAnularOrden = async () => {
    if (!order || !razonAnulacion.trim()) {
      toast({
        title: "Error",
        description: "Debe proporcionar una razón para anular la orden",
        variant: "destructive"
      });
      return;
    }

    try {
      // Cambiar estatus a anulada
      const { error: updateError } = await supabase
        .from('orden_pedido')
        .update({ estatus: 'anulada' })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (updateError) throw updateError;

      // Registrar en historial
      await supabase.from('historial_orden').insert({
        id_orden_pedido: order.id_orden_pedido,
        accion_clave: 'orden_anulada',
        fase_anterior: order.fase,
        fase_nueva: order.fase,
        observaciones: `Orden anulada por admin. Razón: ${razonAnulacion}`,
      });

      onUpdateOrder(order.id_orden_pedido, { estatus: 'anulada' });

      toast({
        title: "Orden anulada",
        description: "La orden ha sido anulada exitosamente",
        variant: "default"
      });

      setShowAnularConfirm(false);
      setRazonAnulacion("");
      onClose();
    } catch (error) {
      console.error('Error anulando orden:', error);
      toast({
        title: "Error",
        description: "No se pudo anular la orden",
        variant: "destructive"
      });
    }
  };

  // Intento de avanzar fase - primero verifica cambios sin guardar
  const handleAdvanceStageClick = () => {
    if (!order) return;

    const currentFaseUI = FASE_TO_UI[order.fase as FaseOrdenDB] ?? "comercial";

    // Verificar si el tab actual tiene cambios sin guardar
    if (tabDirtyStates[currentFaseUI]) {
      setShowAdvanceConfirm(true);
      return;
    }

    // Si no hay cambios sin guardar, avanzar directamente
    executeAdvanceStage();
  };

  // Ejecutar el avance de fase
  const executeAdvanceStage = async () => {
    if (!order) return;

    setIsAdvancing(true);

    // Usar la fase REAL de la orden, no el tab activo
    const currentFaseUI = FASE_TO_UI[order.fase as FaseOrdenDB] ?? "comercial";
    const nextFase = NEXT_FASE[currentFaseUI];
    if (!nextFase) {
      setIsAdvancing(false);
      return;
    }

    // Validar permisos sobre la fase ACTUAL de la orden
    if (!canUserEditFase(order.fase as FaseOrdenDB)) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para avanzar esta orden desde su fase actual.",
        variant: "destructive"
      });
      setIsAdvancing(false);
      return;
    }

    const updates = {
      fase: nextFase,
      estatus: "abierta" as const,
      fecha_modificacion: new Date().toISOString(),
    };

    try {
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

      // Nota: El historial se registra en los tabs específicos que manejan el avance

      // Limpiar estados dirty del tab actual
      setTabDirtyStates(prev => ({ ...prev, [currentFaseUI]: false }));

      // Actualizar orden en el padre
      onUpdateOrder(order.id_orden_pedido, updates);

      // Cambiar al tab de la nueva fase
      setActiveTab(uiTabFromFase(nextFase));

      toast({
        title: "¡Éxito!",
        description: `La orden ha avanzado a la etapa de ${STAGE_UI[uiTabFromFase(nextFase)].label}`,
        variant: "default"
      });
    } catch (err) {
      console.error("Error advancing stage:", err);
      toast({
        title: "Error",
        description: "Ocurrió un error al avanzar la orden.",
        variant: "destructive"
      });
    } finally {
      setIsAdvancing(false);
      setShowAdvanceConfirm(false);
    }
  };

  if (!order) return null;

  // Usar la fase real de la orden (no el tab activo) para el badge
  const currentFaseUI = FASE_TO_UI[order.fase as FaseOrdenDB] ?? "comercial";
  const stageMeta = STAGE_UI[currentFaseUI];
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
          {/* Header mejorado con borde de fase */}
          <div className={`border-l-8 ${stageMeta.borderColor}`}>
            <DialogHeader className={`${stageMeta.bgColor} px-6 py-5 space-y-4`}>
              {/* Primera fila: Título, badges y botón anular */}
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-2xl font-bold">
                  Orden #{order.consecutivo || order.id_orden_pedido}
                </DialogTitle>
                {/* Badge de fase con diseño moderno */}
                <div className={`${stageMeta.color} rounded-lg px-4 py-2 shadow-md`}>
                  <span className="text-sm font-bold tracking-wide">
                    {stageMeta.label}
                  </span>
                </div>
                {/* Badge de estatus */}
                <Badge
                  className={cn(
                    "font-medium px-3 py-1.5 shadow-sm",
                    estMeta.color
                  )}
                >
                  {estMeta.label}
                </Badge>
                {/* Botón de anular (solo admin y órdenes no cerradas/anuladas) */}
                {isAdmin && order.estatus !== 'cerrada' && order.estatus !== 'anulada' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowAnularConfirm(true)}
                    className="ml-2"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Anular Orden
                  </Button>
                )}
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
          </div>

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

              {/* Contenido SCROLLEABLE con fondo gris */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 bg-black/10 border-radius ">
                <TabsContent value="comercial" className="mt-4">
                  <ComercialTab
                    order={order}
                    onUpdateOrder={onUpdateOrder}
                    onRequestClose={handleClose}
                    onUnsavedChangesChange={(isDirty) => {
                      setHasUnsavedChanges(isDirty);
                      handleTabDirtyChange("comercial", isDirty);
                    }}
                  />
                </TabsContent>

                <TabsContent value="inventarios" className="mt-4">
                  <InventariosTab
                    order={order}
                    onUpdateOrder={onUpdateOrder}
                    onDirtyChange={(isDirty) => handleTabDirtyChange("inventarios", isDirty)}
                  />
                </TabsContent>

                <TabsContent value="produccion" className="mt-4">
                  <ProduccionTab
                    order={order}
                    onUpdateOrder={onUpdateOrder}
                    onDirtyChange={(isDirty) => handleTabDirtyChange("produccion", isDirty)}
                  />
                </TabsContent>

                <TabsContent value="logistica" className="mt-4">
                  <LogisticaTab
                    order={order}
                    onUpdateOrder={onUpdateOrder}
                    onDirtyChange={(isDirty) => handleTabDirtyChange("logistica", isDirty)}
                  />
                </TabsContent>

                <TabsContent value="facturacion" className="mt-4">
                  <FacturacionTab
                    order={order}
                    onUpdateOrder={onUpdateOrder}
                    onDirtyChange={(isDirty) => handleTabDirtyChange("facturacion", isDirty)}
                  />
                </TabsContent>

                <TabsContent value="financiera" className="mt-4">
                  <FinancieraTab
                    order={order}
                    onUpdateOrder={onUpdateOrder}
                    onDirtyChange={(isDirty) => handleTabDirtyChange("financiera", isDirty)}
                  />
                </TabsContent>
              </div>

              {/* Footer con botón de avanzar - FIJO al fondo - USA FASE REAL DE LA ORDEN */}
              {(() => {
                const currentFaseUI = FASE_TO_UI[order.fase as FaseOrdenDB] ?? "comercial";
                const nextFase = NEXT_FASE[currentFaseUI];
                const canAdvance = nextFase && canUserEditFase(order.fase as FaseOrdenDB);

                return canAdvance ? (
                  <div className="border-t bg-background px-6 py-4 shrink-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        {tabDirtyStates[currentFaseUI] ? (
                          <span className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            Tienes cambios sin guardar en <strong>{STAGE_UI[currentFaseUI].label}</strong>
                          </span>
                        ) : (
                          <>¿Completaste todas las tareas de <strong>{STAGE_UI[currentFaseUI].label}</strong>?</>
                        )}
                      </div>
                      <Button
                        onClick={handleAdvanceStageClick}
                        size="lg"
                        className="gap-2 shadow-sm"
                        disabled={isAdvancing}
                      >
                        {isAdvancing ? "Avanzando..." : `Avanzar a ${STAGE_UI[uiTabFromFase(nextFase as FaseOrdenDB)].label}`}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : null;
              })()}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de cierre */}
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

      {/* Modal de confirmación para avanzar con cambios sin guardar */}
      <ConfirmationDialog
        open={showAdvanceConfirm}
        onOpenChange={setShowAdvanceConfirm}
        title="Cambios sin guardar"
        description="Tienes cambios sin guardar en esta fase. Debes guardar los cambios antes de avanzar a la siguiente fase, o perderás la información ingresada."
        confirmText="Guardar y continuar"
        cancelText="Cancelar"
        variant="default"
        onConfirm={() => {
          // El usuario debe guardar primero
          setShowAdvanceConfirm(false);
          toast({
            title: "Guarda tus cambios",
            description: "Por favor guarda los cambios antes de avanzar a la siguiente fase.",
            variant: "default"
          });
        }}
        onCancel={() => setShowAdvanceConfirm(false)}
      />

      {/* Modal de anulación de orden */}
      <Dialog open={showAnularConfirm} onOpenChange={setShowAnularConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Orden #{order?.consecutivo || order?.id_orden_pedido}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Esta acción cambiará el estatus de la orden a <strong>"anulada"</strong> y la orden desaparecerá del tablero Kanban.
              Podrá consultarla en el historial de órdenes archivadas.
            </p>
            <div className="space-y-2">
              <Label htmlFor="razon-anulacion">
                Razón de anulación <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="razon-anulacion"
                placeholder="Explica por qué se está anulando esta orden..."
                value={razonAnulacion}
                onChange={(e) => setRazonAnulacion(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setShowAnularConfirm(false);
              setRazonAnulacion("");
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnularOrden}
              disabled={!razonAnulacion.trim()}
            >
              Sí, anular orden
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}