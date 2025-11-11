/**
 * Tab de Financiera
 *
 * FASE 6: FINANCIERA (FASE FINAL)
 * Responsable: Rol financiera
 *
 * Según FLUJOKANBAN.md:
 * - Validación de pago/crédito (acción final)
 * - Confirmación de pago recibido
 * - Cierre definitivo de la orden (estatus -> 'cerrada')
 * - Última fase del flujo Kanban
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { CreditCard, CheckCircle2, AlertCircle, FileCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

interface FinancieraTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function FinancieraTab({ order, onUpdateOrder }: FinancieraTabProps) {
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [observacionesFinancieras, setObservacionesFinancieras] = useState("");
  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Cargar datos iniciales del tab
  useEffect(() => {
    const loadTabData = async () => {
      setIsInitialLoading(true);

      try {
        // Cargar datos financieros si existen
        const { data: ordenData, error: ordenError } = await supabase
          .from("orden_pedido")
          .select("pago_confirmado, observaciones_financieras")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .single();

        if (!ordenError && ordenData) {
          setPagoConfirmado(ordenData.pago_confirmado || false);
          setObservacionesFinancieras(ordenData.observaciones_financieras || "");
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

  const canClose = pagoConfirmado;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Actualizar datos financieros en orden_pedido
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          pago_confirmado: pagoConfirmado,
          observaciones_financieras: observacionesFinancieras,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      // Registrar en historial
      if (pagoConfirmado) {
        await supabase.from('historial_orden').insert({
          id_orden_pedido: order.id_orden_pedido,
          accion_clave: 'pago_confirmado',
          fase_anterior: order.fase,
          fase_nueva: order.fase,
          observaciones: 'Pago confirmado por Financiera',
        });
      }

      onUpdateOrder(order.id_orden_pedido, {
        pago_confirmado: pagoConfirmado,
        observaciones_financieras: observacionesFinancieras,
      });

      alert('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCerrarOrden = async () => {
    if (!canClose) {
      alert('Debe confirmar el pago antes de cerrar la orden');
      return;
    }

    const confirmacion = confirm(
      '¿Está seguro de cerrar esta orden?\n\nEsta acción marcará la orden como CERRADA.'
    );

    if (!confirmacion) return;

    setSaving(true);
    try {
      // Guardar confirmación de pago
      await supabase
        .from('orden_pedido')
        .update({
          pago_confirmado: pagoConfirmado,
          observaciones_financieras: observacionesFinancieras,
          estatus: 'cerrada',
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      // Registrar cierre en historial
      await supabase.from('historial_orden').insert({
        id_orden_pedido: order.id_orden_pedido,
        accion_clave: 'orden_cerrada',
        fase_anterior: 'financiera',
        fase_nueva: 'financiera',
        observaciones: 'Orden cerrada definitivamente.',
      });

      onUpdateOrder(order.id_orden_pedido, {
        estatus: 'cerrada',
        pago_confirmado: true,
      });

      alert('Orden cerrada exitosamente');
    } catch (error) {
      console.error('Error cerrando orden:', error);
      alert('Error al cerrar la orden');
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
      {/* Confirmación de Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Validación de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checkbox de confirmación de pago */}
          <div className="flex items-start space-x-3 p-4 border-2 rounded-lg bg-muted/30">
            <Checkbox
              id="pago-confirmado"
              checked={pagoConfirmado}
              onCheckedChange={(checked) => setPagoConfirmado(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="pago-confirmado"
                className="text-base font-semibold cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Pago Confirmado
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones Financieras */}
      <div className="space-y-2">
        <Label htmlFor="observaciones-financieras">Observaciones (Opcional)</Label>
        <Textarea
          id="observaciones-financieras"
          placeholder="Detalles del pago, forma de pago, referencia bancaria..."
          value={observacionesFinancieras}
          onChange={(e) => setObservacionesFinancieras(e.target.value)}
          rows={4}
        />
      </div>

      {/* Validación visual para cierre */}
      {!canClose && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campo Obligatorio</AlertTitle>
          <AlertDescription>
            Confirmación de pago pendiente
          </AlertDescription>
        </Alert>
      )}

      {canClose && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Validación Completa</AlertTitle>
          <AlertDescription className="text-success-foreground/80">
            Pago confirmado correctamente
          </AlertDescription>
        </Alert>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="outline"
        >
          Guardar Cambios
        </Button>
        <Button
          onClick={handleCerrarOrden}
          disabled={!canClose || saving}
          className="bg-success hover:bg-success/90"
        >
          {canClose
            ? 'Cerrar Orden'
            : 'Confirmar Pago'}
        </Button>
      </div>
    </div>
  );
}
