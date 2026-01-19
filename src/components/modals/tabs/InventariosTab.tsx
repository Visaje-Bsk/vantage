import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { Package, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

// Data Gates
import { useDataGateValidation } from "@/hooks/useDataGateValidation";
import { DataGateAlert } from "@/components/dataGates/DataGateAlert";
import type { FaseOrdenDB } from "@/types/kanban";

interface InventariosTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function InventariosTab({ order, onUpdateOrder, onDirtyChange }: InventariosTabProps) {
  const [stockValidado, setStockValidado] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Estado inicial para detectar cambios
  const [initialState, setInitialState] = useState<{ stockValidado: boolean; observaciones: string } | null>(null);

  // Hooks de Data Gates
  const dataGateValidation = useDataGateValidation({
    order: {
      ...order,
      stock_validado: stockValidado,
      observaciones_inventarios: observaciones,
    },
    currentPhase: 'inventarios' as FaseOrdenDB,
  });


  // Detectar cambios comparando con estado inicial
  useEffect(() => {
    if (initialState === null) return;

    const hasChanges =
      stockValidado !== initialState.stockValidado ||
      observaciones !== initialState.observaciones;

    onDirtyChange?.(hasChanges);
  }, [stockValidado, observaciones, initialState, onDirtyChange]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadTabData = async () => {
      setIsInitialLoading(true);

      try {
        // Cargar datos existentes de la orden
        const { data, error } = await supabase
          .from("orden_pedido")
          .select("estatus, observaciones_orden")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .single();

        if (!error && data) {
          const loadedStockValidado = data.estatus === 'abierta';
          const loadedObservaciones = data.observaciones_orden ?? "";

          setStockValidado(loadedStockValidado);
          setObservaciones(loadedObservaciones);

          // Guardar estado inicial
          setInitialState({
            stockValidado: loadedStockValidado,
            observaciones: loadedObservaciones,
          });
        } else {
          // Si no hay datos, establecer estado inicial vacío
          setInitialState({ stockValidado: false, observaciones: "" });
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        setInitialState({ stockValidado: false, observaciones: "" });
      } finally {
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 300);
      }
    };

    loadTabData();
  }, [order.id_orden_pedido]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          stock_validado: stockValidado,
          observaciones_inventarios: observaciones,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      onUpdateOrder(order.id_orden_pedido, {
        fecha_modificacion: new Date().toISOString(),
      });

      // Actualizar estado inicial para marcar como limpio
      setInitialState({ stockValidado, observaciones });

      alert('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAvanzarProduccion = async () => {
    if (!stockValidado) {
      alert('Debe validar el stock completo antes de avanzar a Producción');
      return;
    }

    // Primero guardar los cambios actuales
    setSaving(true);
    try {
      // Guardar datos de inventarios primero
      const { error: saveError } = await supabase
        .from('orden_pedido')
        .update({
          stock_validado: stockValidado,
          observaciones_inventarios: observaciones,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (saveError) throw saveError;

      // Avanzar fase
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          fase: 'produccion',
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      // Marcar como limpio
      setInitialState({ stockValidado, observaciones });

      onUpdateOrder(order.id_orden_pedido, { fase: 'produccion' });
      alert('Orden enviada a Producción exitosamente');
    } catch (error) {
      console.error('Error avanzando a Producción:', error);
      alert('Error al avanzar a Producción');
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
      {/* Data Gates Validation */}
      <DataGateAlert 
        errors={dataGateValidation.errors}
        canAdvance={dataGateValidation.canAdvance}
        phaseName="Inventarios"
      />

      {/* Productos de la orden */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos en la Orden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Producto</th>
                  <th className="text-left p-3">Código</th>
                  <th className="text-right p-3">Cantidad</th>
                  <th className="text-right p-3">Valor Unit.</th>
                </tr>
              </thead>
              <tbody>
                {order?.detalles?.map((detalle: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{detalle.equipo?.nombre_equipo || 'N/A'}</td>
                    <td className="p-3">{detalle.equipo?.codigo || 'N/A'}</td>
                    <td className="text-right p-3">{detalle.cantidad}</td>
                    <td className="text-right p-3">
                      ${detalle.valor_unitario?.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!order?.detalles || order.detalles.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-muted-foreground">
                      No hay productos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Checkbox de validación */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
            <Checkbox
              id="stock-validado"
              checked={stockValidado}
              onCheckedChange={(checked) => setStockValidado(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="stock-validado"
                className="text-base font-semibold cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Stock Completo y Validado
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Confirmo que he realizado el picking físico y que el stock del pedido está completo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
        <Textarea
          id="observaciones"
          placeholder="Agregue cualquier observación sobre el inventario..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={4}
        />
      </div>

      {/* Validación visual */}
      {!stockValidado && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campo Obligatorio</AlertTitle>
          <AlertDescription>
            Validación de stock pendiente
          </AlertDescription>
        </Alert>
      )}

      {stockValidado && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Validación Completa</AlertTitle>
          <AlertDescription className="text-success-foreground/80">
            Stock validado correctamente
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
          onClick={handleAvanzarProduccion}
          disabled={!stockValidado || saving}
          className="bg-success hover:bg-success/90"
        >
          {stockValidado
            ? 'Enviar a Producción'
            : 'Validar Stock para Continuar'}
        </Button>
      </div>
    </div>
  );
}