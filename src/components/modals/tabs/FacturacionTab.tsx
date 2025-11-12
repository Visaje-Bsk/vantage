/**
 * Tab de Facturación
 *
 * FASE 5: FACTURACIÓN
 * Responsable: Rol facturacion
 *
 * Según FLUJOKANBAN.md:
 * - Emisión de factura (numero_factura, fecha_factura)
 * - Gestión de moneda base (USD o COP)
 * - TRM (Tasa Representativa del Mercado) obligatoria si es USD
 * - Fecha de TRM aplicada
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { Receipt, DollarSign, Calendar, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

interface FacturacionTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function FacturacionTab({ order, onUpdateOrder }: FacturacionTabProps) {
  const [numeroFactura, setNumeroFactura] = useState("");
  const [fechaFactura, setFechaFactura] = useState("");
  const [monedaBase, setMonedaBase] = useState<"COP" | "USD" | "">("");
  const [trmAplicada, setTrmAplicada] = useState("");
  const [fechaTrm, setFechaTrm] = useState("");
  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Cargar datos iniciales del tab
  useEffect(() => {
    const loadTabData = async () => {
      setIsInitialLoading(true);

      try {
        // Cargar datos de factura si existen
        const { data: facturaData, error: facturaError } = await supabase
          .from("factura")
          .select("*")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (!facturaError && facturaData) {
          setNumeroFactura(facturaData.numero_factura || "");
          setFechaFactura(facturaData.fecha_factura || "");
          setMonedaBase((facturaData.moneda_base as "COP" | "USD") || "");
          setTrmAplicada(facturaData.trm_aplicada?.toString() || "");
          setFechaTrm(facturaData.fecha_trm || "");
        }
      } catch (error) {
        console.error("Error cargando datos del tab:", error);
      } finally {
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 300);
      }
    };

    loadTabData();
  }, [order.id_orden_pedido]);

  // Validación: TRM es obligatoria solo si la moneda es USD
  const needsTrm = monedaBase === "USD";
  const trmValid = !needsTrm || (trmAplicada.trim() !== "" && fechaTrm.trim() !== "");

  const canAdvance =
    numeroFactura.trim() !== "" &&
    fechaFactura.trim() !== "" &&
    monedaBase !== "" &&
    trmValid;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('factura')
        .upsert({
          id_orden_pedido: order.id_orden_pedido,
          numero_factura: numeroFactura,
          fecha_factura: fechaFactura,
          moneda_base: monedaBase,
          trm_aplicada: needsTrm ? parseFloat(trmAplicada) : null,
          fecha_trm: needsTrm ? fechaTrm : null,
        }, {
          onConflict: 'id_orden_pedido'
        });

      if (error) throw error;

      // Actualizar fecha de modificación de la orden
      await supabase
        .from('orden_pedido')
        .update({ fecha_modificacion: new Date().toISOString() })
        .eq('id_orden_pedido', order.id_orden_pedido);

      // Registrar en historial
      await supabase.from('historial_orden').insert({
        id_orden_pedido: order.id_orden_pedido,
        accion_clave: 'factura_emitida',
        fase_anterior: order.fase,
        fase_nueva: order.fase,
        observaciones: `Factura ${numeroFactura} emitida. Moneda: ${monedaBase}${needsTrm ? ` - TRM: $${trmAplicada}` : ''}`,
      });

      alert('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAvanzarFinanciera = async () => {
    if (!canAdvance) {
      alert('Debe completar todos los campos obligatorios antes de avanzar a Financiera');
      return;
    }

    setSaving(true);
    try {
      // Primero guardar datos de factura
      const { error: facturaError } = await supabase
        .from('factura')
        .upsert({
          id_orden_pedido: order.id_orden_pedido,
          numero_factura: numeroFactura,
          fecha_factura: fechaFactura,
          moneda_base: monedaBase,
          trm_aplicada: needsTrm ? parseFloat(trmAplicada) : null,
          fecha_trm: needsTrm ? fechaTrm : null,
        }, {
          onConflict: 'id_orden_pedido'
        });

      if (facturaError) throw facturaError;

      // Avanzar fase y cambiar estatus a 'facturada'
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          fase: 'financiera',
          estatus: 'facturada',
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      // Registrar avance en historial
      await supabase.from('historial_orden').insert({
        id_orden_pedido: order.id_orden_pedido,
        accion_clave: 'avance_fase',
        fase_anterior: 'facturacion',
        fase_nueva: 'financiera',
        observaciones: `Facturación completada. Factura: ${numeroFactura} (${monedaBase}). Orden FACTURADA (estatus → facturada).`,
      });

      onUpdateOrder(order.id_orden_pedido, {
        fase: 'financiera',
        estatus: 'facturada'
      });
      alert('Factura emitida y orden enviada a Financiera exitosamente');
    } catch (error) {
      console.error('Error avanzando a Financiera:', error);
      alert('Error al avanzar a Financiera');
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
      {/* Datos de Factura */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Datos de la Factura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Número de Factura */}
          <div className="space-y-2">
            <Label htmlFor="numero-factura" className="flex items-center gap-2">
              Número de Factura <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numero-factura"
              placeholder="FE-2024-001234"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
            />
          </div>

          {/* Fecha de Factura */}
          <div className="space-y-2">
            <Label htmlFor="fecha-factura" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha de Factura <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fecha-factura"
              type="date"
              value={fechaFactura}
              onChange={(e) => setFechaFactura(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Moneda y TRM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Moneda y Conversión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Moneda Base */}
          <div className="space-y-2">
            <Label htmlFor="moneda-base" className="flex items-center gap-2">
              Moneda Base <span className="text-destructive">*</span>
            </Label>
            <Select value={monedaBase} onValueChange={(value) => setMonedaBase(value as "COP" | "USD" | "")}>
              <SelectTrigger id="moneda-base">
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

              <div className="space-y-2">
                <Label htmlFor="trm-aplicada" className="flex items-center gap-2">
                  TRM Aplicada <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="trm-aplicada"
                  type="number"
                  step="0.01"
                  placeholder="4375.86"
                  value={trmAplicada}
                  onChange={(e) => setTrmAplicada(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha-trm" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de TRM <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fecha-trm"
                  type="date"
                  value={fechaTrm}
                  onChange={(e) => setFechaTrm(e.target.value)}
                />
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Validación visual */}
      {!canAdvance && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campos Obligatorios</AlertTitle>
          <AlertDescription>
            Complete los campos requeridos
          </AlertDescription>
        </Alert>
      )}

      {canAdvance && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Validación Completa</AlertTitle>
          <AlertDescription className="text-success-foreground/80">
            Información registrada correctamente
          </AlertDescription>
        </Alert>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={saving || !canAdvance}
          variant="outline"
        >
          Guardar Cambios
        </Button>
        <Button
          onClick={handleAvanzarFinanciera}
          disabled={!canAdvance || saving}
          className="bg-success hover:bg-success/90"
        >
          {canAdvance
            ? 'Enviar a Financiera'
            : 'Completar Campos'}
        </Button>
      </div>
    </div>
  );
}
