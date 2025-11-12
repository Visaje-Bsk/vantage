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

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { SuccessModal } from "../SuccessModal";
import { toast } from "sonner";

interface FinancieraTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function FinancieraTab({ order, onUpdateOrder }: FinancieraTabProps) {
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const canClose = pagoConfirmado;

  const handleCerrarOrden = () => {
    if (!canClose) {
      toast.error('Debe confirmar el pago antes de cerrar la orden');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmCerrarOrden = async () => {
    setShowConfirmDialog(false);
    setSaving(true);

    try {
      // Cambiar estatus a cerrada
      const { error: updateError } = await supabase
        .from('orden_pedido')
        .update({
          estatus: 'cerrada',
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (updateError) throw updateError;

      // Registrar cierre en historial con observaciones
      await supabase.from('historial_orden').insert({
        id_orden_pedido: order.id_orden_pedido,
        accion_clave: 'orden_cerrada',
        fase_anterior: 'financiera',
        fase_nueva: 'financiera',
        observaciones: observaciones
          ? `Orden cerrada definitivamente. Observaciones: ${observaciones}`
          : 'Orden cerrada definitivamente. Pago confirmado.',
      });

      onUpdateOrder(order.id_orden_pedido, {
        estatus: 'cerrada',
      });

      // Mostrar modal de éxito
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error cerrando orden:', error);
      toast.error('Error al cerrar la orden');
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
          onClick={handleCerrarOrden}
          disabled={!canClose || saving}
          className="bg-success hover:bg-success/90"
        >
          {canClose
            ? 'Cerrar Orden'
            : 'Confirmar Pago Primero'}
        </Button>
      </div>

      {/* Modal de confirmación */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmCerrarOrden}
        title="¿Cerrar esta orden?"
        description="Esta acción marcará la orden como CERRADA. Esta es la etapa final del flujo y la orden desaparecerá del tablero Kanban. Podrá consultarla en el historial."
        confirmText="Sí, cerrar orden"
        cancelText="Cancelar"
        variant="destructive"
      />

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Orden Cerrada!"
        message={`La orden #${order.consecutivo || order.id_orden_pedido} ha sido cerrada exitosamente. El proceso ha finalizado.`}
        autoCloseDuration={3500}
      />
    </div>
  );
}
