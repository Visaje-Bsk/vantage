/**
 * Tab de Facturación
 *
 * FASE 5: FACTURACIÓN
 * Responsable: Rol facturacion
 *
 * Según el nuevo flujo:
 * - Emisión de facturas por tipo (equipos, servicio, flete)
 * - Cada tipo puede tener una factura independiente
 * - Gestión de moneda base (USD o COP)
 * - TRM (Tasa Representativa del Mercado) obligatoria si es USD
 * - Al menos una factura es requerida para avanzar a Logística
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { Receipt, DollarSign, Calendar, CheckCircle2, AlertCircle, TrendingUp, Package, Wrench, Truck, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";
import { toast } from "sonner";

interface FacturacionTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

// Tipos de factura disponibles
type TipoFactura = "equipos" | "servicio" | "flete";

interface FacturaData {
  id_factura?: number;
  tipo_factura: TipoFactura;
  numero_factura: string;
  fecha_factura: string;
  moneda_base: "COP" | "USD" | "";
  trm_aplicada: string;
  fecha_trm: string;
}

interface FacturacionInitialState {
  facturas: FacturaData[];
}

// Configuración de tipos de factura
const TIPO_FACTURA_CONFIG: Record<TipoFactura, { label: string; icon: typeof Package }> = {
  equipos: { label: "Factura de Equipos", icon: Package },
  servicio: { label: "Factura de Servicio", icon: Wrench },
  flete: { label: "Factura de Flete", icon: Truck },
};

// Estado inicial de una factura vacía
const createEmptyFactura = (tipo: TipoFactura): FacturaData => ({
  tipo_factura: tipo,
  numero_factura: "",
  fecha_factura: "",
  moneda_base: "",
  trm_aplicada: "",
  fecha_trm: "",
});

export function FacturacionTab({ order, onUpdateOrder, onDirtyChange }: FacturacionTabProps) {
  // Estado para las facturas (una por cada tipo)
  const [facturas, setFacturas] = useState<FacturaData[]>([]);
  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Tipos de factura activos (visibles en el formulario)
  const [activeTipos, setActiveTipos] = useState<TipoFactura[]>([]);

  // Estado inicial para detectar cambios
  const [initialState, setInitialState] = useState<FacturacionInitialState | null>(null);

  // Detectar cambios comparando con estado inicial
  useEffect(() => {
    if (initialState === null) return;

    const hasChanges = JSON.stringify(facturas) !== JSON.stringify(initialState.facturas);
    onDirtyChange?.(hasChanges);
  }, [facturas, initialState, onDirtyChange]);

  // Cargar datos iniciales del tab
  useEffect(() => {
    const loadTabData = async () => {
      setIsInitialLoading(true);

      try {
        // Cargar todas las facturas de la orden
        const { data: facturasData, error: facturasError } = await supabase
          .from("factura")
          .select("*")
          .eq("id_orden_pedido", order.id_orden_pedido);

        if (facturasError) throw facturasError;

        if (facturasData && facturasData.length > 0) {
          const loadedFacturas: FacturaData[] = facturasData.map((f) => ({
            id_factura: f.id_factura,
            tipo_factura: (f.tipo_factura as TipoFactura) || "equipos",
            numero_factura: f.numero_factura || "",
            fecha_factura: f.fecha_factura || "",
            moneda_base: (f.moneda_base as "COP" | "USD") || "",
            trm_aplicada: f.trm_aplicada?.toString() || "",
            fecha_trm: f.fecha_trm || "",
          }));

          setFacturas(loadedFacturas);
          setActiveTipos(loadedFacturas.map((f) => f.tipo_factura));
          setInitialState({ facturas: loadedFacturas });
        } else {
          // Si no hay facturas, iniciar con factura de equipos por defecto
          const defaultFactura = createEmptyFactura("equipos");
          setFacturas([defaultFactura]);
          setActiveTipos(["equipos"]);
          setInitialState({ facturas: [defaultFactura] });
        }
      } catch (error) {
        console.error("Error cargando datos del tab:", error);
        const defaultFactura = createEmptyFactura("equipos");
        setFacturas([defaultFactura]);
        setActiveTipos(["equipos"]);
        setInitialState({ facturas: [defaultFactura] });
      } finally {
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 300);
      }
    };

    loadTabData();
  }, [order.id_orden_pedido]);

  // Actualizar un campo de una factura específica
  const updateFactura = (tipo: TipoFactura, field: keyof FacturaData, value: string) => {
    setFacturas((prev) =>
      prev.map((f) => (f.tipo_factura === tipo ? { ...f, [field]: value } : f))
    );
  };

  // Agregar un nuevo tipo de factura
  const addFacturaTipo = (tipo: TipoFactura) => {
    if (activeTipos.includes(tipo)) return;

    const newFactura = createEmptyFactura(tipo);
    setFacturas((prev) => [...prev, newFactura]);
    setActiveTipos((prev) => [...prev, tipo]);
  };

  // Eliminar un tipo de factura
  const removeFacturaTipo = async (tipo: TipoFactura) => {
    const factura = facturas.find((f) => f.tipo_factura === tipo);

    // Si existe en BD, eliminar
    if (factura?.id_factura) {
      try {
        const { error } = await supabase
          .from("factura")
          .delete()
          .eq("id_factura", factura.id_factura);

        if (error) throw error;
        toast.success(`Factura de ${TIPO_FACTURA_CONFIG[tipo].label} eliminada`);
      } catch (error) {
        console.error("Error eliminando factura:", error);
        toast.error("Error al eliminar la factura");
        return;
      }
    }

    setFacturas((prev) => prev.filter((f) => f.tipo_factura !== tipo));
    setActiveTipos((prev) => prev.filter((t) => t !== tipo));
  };

  // Validar si una factura está completa
  const isFacturaComplete = (factura: FacturaData): boolean => {
    const needsTrm = factura.moneda_base === "USD";
    const trmValid = !needsTrm || (factura.trm_aplicada.trim() !== "" && factura.fecha_trm.trim() !== "");

    return (
      factura.numero_factura.trim() !== "" &&
      factura.fecha_factura.trim() !== "" &&
      factura.moneda_base !== "" &&
      trmValid
    );
  };

  // Verificar si al menos una factura está completa
  const hasAtLeastOneCompleteFactura = facturas.some(isFacturaComplete);

  // Tipos disponibles para agregar
  const availableTipos = (["equipos", "servicio", "flete"] as TipoFactura[]).filter(
    (t) => !activeTipos.includes(t)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      // Guardar cada factura que tenga datos
      for (const factura of facturas) {
        if (factura.numero_factura.trim() || factura.fecha_factura.trim()) {
          const needsTrm = factura.moneda_base === "USD";

          const facturaPayload = {
            id_orden_pedido: order.id_orden_pedido,
            tipo_factura: factura.tipo_factura,
            numero_factura: factura.numero_factura,
            fecha_factura: factura.fecha_factura || null,
            moneda_base: factura.moneda_base || null,
            trm_aplicada: needsTrm && factura.trm_aplicada ? parseFloat(factura.trm_aplicada) : null,
            fecha_trm: needsTrm && factura.fecha_trm ? factura.fecha_trm : null,
          };

          if (factura.id_factura) {
            // Actualizar factura existente
            const { error } = await supabase
              .from("factura")
              .update(facturaPayload)
              .eq("id_factura", factura.id_factura);

            if (error) throw error;
          } else {
            // Crear nueva factura
            const { data, error } = await supabase
              .from("factura")
              .insert(facturaPayload)
              .select("id_factura")
              .single();

            if (error) throw error;

            // Actualizar el ID en el estado local
            setFacturas((prev) =>
              prev.map((f) =>
                f.tipo_factura === factura.tipo_factura ? { ...f, id_factura: data.id_factura } : f
              )
            );
          }
        }
      }

      // Actualizar fecha de modificación de la orden
      await supabase
        .from("orden_pedido")
        .update({ fecha_modificacion: new Date().toISOString() })
        .eq("id_orden_pedido", order.id_orden_pedido);

      // Actualizar estado inicial
      setInitialState({ facturas: [...facturas] });

      toast.success("Cambios guardados exitosamente");
    } catch (error) {
      console.error("Error guardando cambios:", error);
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleAvanzarLogistica = async () => {
    if (!hasAtLeastOneCompleteFactura) {
      toast.error("Debe completar al menos una factura antes de avanzar a Logística");
      return;
    }

    setSaving(true);
    try {
      // Primero guardar todas las facturas
      await handleSave();

      // Avanzar fase a Logística y cambiar estatus a 'facturada'
      const { error } = await supabase
        .from("orden_pedido")
        .update({
          fase: "logistica",
          estatus: "facturada",
          fecha_modificacion: new Date().toISOString(),
        })
        .eq("id_orden_pedido", order.id_orden_pedido);

      if (error) throw error;

      onUpdateOrder(order.id_orden_pedido, {
        fase: "logistica",
        estatus: "facturada",
      });

      toast.success("Facturas emitidas y orden enviada a Logística exitosamente");
    } catch (error) {
      console.error("Error avanzando a Logística:", error);
      toast.error("Error al avanzar a Logística");
    } finally {
      setSaving(false);
    }
  };

  // Mostrar skeleton mientras carga
  if (isInitialLoading) {
    return <TabLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Facturas por tipo */}
      {activeTipos.map((tipo) => {
        const factura = facturas.find((f) => f.tipo_factura === tipo);
        if (!factura) return null;

        const config = TIPO_FACTURA_CONFIG[tipo];
        const IconComponent = config.icon;
        const needsTrm = factura.moneda_base === "USD";
        const isComplete = isFacturaComplete(factura);

        return (
          <Card key={tipo} className={isComplete ? "border-success/50" : ""}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {config.label}
                  {isComplete && <CheckCircle2 className="h-4 w-4 text-success" />}
                </span>
                {activeTipos.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeFacturaTipo(tipo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Número de Factura */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Número de Factura <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="FE-2024-001234"
                    value={factura.numero_factura}
                    onChange={(e) => updateFactura(tipo, "numero_factura", e.target.value)}
                  />
                </div>

                {/* Fecha de Factura */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de Factura <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={factura.fecha_factura}
                    onChange={(e) => updateFactura(tipo, "fecha_factura", e.target.value)}
                  />
                </div>
              </div>

              {/* Moneda Base */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Moneda Base <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={factura.moneda_base}
                  onValueChange={(value) => updateFactura(tipo, "moneda_base", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP (Pesos Colombianos)</SelectItem>
                    <SelectItem value="USD">USD (Dólares)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* TRM - Solo si es USD */}
              {needsTrm && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">TRM (Obligatoria para USD)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        TRM Aplicada <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="4375.86"
                        value={factura.trm_aplicada}
                        onChange={(e) => updateFactura(tipo, "trm_aplicada", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fecha de TRM <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={factura.fecha_trm}
                        onChange={(e) => updateFactura(tipo, "fecha_trm", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Botón para agregar más tipos de factura */}
      {availableTipos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground py-2">Agregar factura:</span>
          {availableTipos.map((tipo) => {
            const config = TIPO_FACTURA_CONFIG[tipo];
            const IconComponent = config.icon;
            return (
              <Button
                key={tipo}
                variant="outline"
                size="sm"
                onClick={() => addFacturaTipo(tipo)}
              >
                <Plus className="h-4 w-4 mr-1" />
                <IconComponent className="h-4 w-4 mr-1" />
                {config.label.replace("Factura de ", "")}
              </Button>
            );
          })}
        </div>
      )}

      {/* Validación visual */}
      {!hasAtLeastOneCompleteFactura && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campos Obligatorios</AlertTitle>
          <AlertDescription>
            Complete al menos una factura para poder avanzar a Logística
          </AlertDescription>
        </Alert>
      )}

      {hasAtLeastOneCompleteFactura && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Validación Completa</AlertTitle>
          <AlertDescription className="text-success-foreground/80">
            {facturas.filter(isFacturaComplete).length} factura(s) lista(s) para emitir
          </AlertDescription>
        </Alert>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} variant="outline">
          Guardar Cambios
        </Button>
        <Button
          onClick={handleAvanzarLogistica}
          disabled={!hasAtLeastOneCompleteFactura || saving}
          className="bg-success hover:bg-success/90"
        >
          {hasAtLeastOneCompleteFactura ? "Enviar a Logística" : "Completar Campos"}
        </Button>
      </div>
    </div>
  );
}
