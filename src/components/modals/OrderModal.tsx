import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STAGE_UI, UI_TO_FASE, FASE_TO_UI, type OrdenStageUI, type FaseOrdenDB, estatusBadge, OrdenKanban} from "@/types/kanban";
import type { Database } from "@/integrations/supabase/types";
type AppRole = Database["public"]["Enums"]["app_role"];
import { Building2, User, Package, Truck, Receipt, CreditCard, ArrowRight, Calendar } from "lucide-react";
import { ComercialTab } from "./tabs/ComercialTab";
import { InventariosTab } from "./tabs/InventariosTab";
import { ProduccionTab } from "./tabs/ProduccionTab";
import { LogisticaTab } from "./tabs/LogisticaTab";
import { FacturacionTab } from "./tabs/FacturacionTab";
import { FinancieraTab } from "./tabs/FinancieraTab";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


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
  const canUserEditFase = (fase: FaseOrdenDB) => isAdmin || (currentUserRole === REQUIRED_ROLE_BY_FASE[fase]);

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
      .from("ordenpedido")
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-semibold">
                Orden #{order.consecutivo || order.id_orden_pedido}
              </DialogTitle>
              <Badge className={`text-white ${stageMeta.color}`}>
                {stageMeta.label}
              </Badge>
              <Badge className={estMeta.color}>
                {estMeta.label}
              </Badge>
            </div>
            
            {NEXT_FASE[activeTab] && canUserEditFase(UI_TO_FASE[activeTab]) && (
              <Button onClick={handleAdvanceStage} variant="default">
                Avanzar a {STAGE_UI[uiTabFromFase(NEXT_FASE[activeTab] as FaseOrdenDB)].label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              <span>{order.nombre_cliente}</span>
            </div>
            {order.proyecto_nombre && (
              <div>
                Proyecto: {order.proyecto_nombre}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Actualizado: {order.fecha_modificacion ? 
                  new Date(order.fecha_modificacion).toLocaleDateString('es-ES') : 
                  'Sin fecha'
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Comercial: {createdByName || "Sin comercial"}
              </span>
            </div>
            {order.nombre_tipo_servicio && (
              <div className="flex items-center gap-1">
                <span>
                  Servicio: {order.nombre_tipo_servicio}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrdenStageUI)}>
            <TabsList className="grid w-full grid-cols-6 mb-4">
              {Object.entries(STAGE_UI).map(([key, config]) => {
                const Icon = STAGE_UI[key].icon ?? User;
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="flex items-center gap-2 text-xs px-2"
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="overflow-y-auto max-h-[60vh] pr-2">
              <TabsContent value="comercial" className="mt-0">
                <ComercialTab order={order} onUpdateOrder={onUpdateOrder} />
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
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}