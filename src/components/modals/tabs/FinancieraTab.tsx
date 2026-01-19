/**
 * Tab de Financiera
 *
 * FASE 4: FINANCIERA
 * Responsable: Rol financiera
 *
 * Según el nuevo flujo:
 * - Validación de pago/crédito
 * - Confirmación de pago recibido
 * - Avanza a Facturación
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FinancieraTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function FinancieraTab({ order, onUpdateOrder, onDirtyChange }: FinancieraTabProps) {
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  // Estado inicial para detectar cambios
  const [initialState, setInitialState] = useState<{ pagoConfirmado: boolean; observaciones: string } | null>({
    pagoConfirmado: false,
    observaciones: "",
  });

  // Detectar cambios comparando con estado inicial
  useEffect(() => {
    if (initialState === null) return;

    const hasChanges =
      pagoConfirmado !== initialState.pagoConfirmado ||
      observaciones !== initialState.observaciones;

    onDirtyChange?.(hasChanges);
  }, [pagoConfirmado, observaciones, initialState, onDirtyChange]);

  const canAdvance = pagoConfirmado;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Guardar observaciones financieras en la orden
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          observaciones_financieras: observaciones,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      // Marcar como limpio
      setInitialState({ pagoConfirmado, observaciones });

      toast.success('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAvanzarFacturacion = async () => {
    if (!canAdvance) {
      toast.error('Debe confirmar el pago antes de avanzar a Facturación');
      return;
    }

    setSaving(true);
    try {
      // Guardar observaciones financieras
      await supabase
        .from('orden_pedido')
        .update({
          observaciones_financieras: observaciones,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      // Avanzar fase a Facturación
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          fase: 'facturacion',
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      // Marcar como limpio
      setInitialState({ pagoConfirmado, observaciones });

      onUpdateOrder(order.id_orden_pedido, { fase: 'facturacion' });
      toast.success('Orden enviada a Facturación exitosamente');
    } catch (error) {
      console.error('Error avanzando a Facturación:', error);
      toast.error('Error al avanzar a Facturación');
    } finally {
      setSaving(false);
    }
  };

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
          placeholder="Detalles del pago, forma de pago, referencia bancaria, notas adicionales..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Estas observaciones se guardarán en el historial de la orden
        </p>
      </div>

      {/* Validación visual */}
      {!canAdvance && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campo Obligatorio</AlertTitle>
          <AlertDescription>
            Confirmación de pago pendiente
          </AlertDescription>
        </Alert>
      )}

      {canAdvance && (
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
          onClick={handleAvanzarFacturacion}
          disabled={!canAdvance || saving}
          className="bg-success hover:bg-success/90"
        >
          {canAdvance
            ? '✓ Enviar a Facturación'
            : 'Confirmar Pago Primero'}
        </Button>
      </div>
    </div>
  );
}
