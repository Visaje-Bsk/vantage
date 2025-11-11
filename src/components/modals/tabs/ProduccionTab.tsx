/**
 * Tab de Producción
 *
 * FASE 3: PRODUCCIÓN
 * Responsable: Rol produccion
 *
 * Según FLUJOKANBAN.md:
 * - Registro de configuración y pruebas funcionales
 * - Observaciones de producción (OBLIGATORIO)
 * - Número de producción Sapiens (OBLIGATORIO)
 * - Fecha de producción (auto-generada)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { Settings, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

interface ProduccionTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function ProduccionTab({ order, onUpdateOrder }: ProduccionTabProps) {
  const [observaciones, setObservaciones] = useState("");
  const [numeroProduccion, setNumeroProduccion] = useState("");
  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Cargar datos iniciales del tab
  useEffect(() => {
    const loadTabData = async () => {
      setIsInitialLoading(true);

      try {
        // Cargar datos de orden_produccion si existen
        const { data: produccionData, error: produccionError } = await supabase
          .from("orden_produccion")
          .select("*")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (!produccionError && produccionData) {
          setObservaciones(produccionData.observaciones_produccion || "");
          setNumeroProduccion(produccionData.numero_produccion || "");
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

  const canAdvance = observaciones.trim() !== "" && numeroProduccion.trim() !== "";

  const handleSave = async () => {
    setSaving(true);
    try {
      // Crear o actualizar orden_produccion
      const { error } = await supabase
        .from('orden_produccion')
        .upsert({
          id_orden_pedido: order.id_orden_pedido,
          observaciones_produccion: observaciones,
          numero_produccion: numeroProduccion,
          fecha_produccion: new Date().toISOString(),
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
        accion_clave: 'produccion_completada',
        fase_anterior: order.fase,
        fase_nueva: order.fase,
        observaciones: `Producción completada. OP: ${numeroProduccion}`,
      });

      alert('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAvanzarLogistica = async () => {
    if (!canAdvance) {
      alert('Debe completar las observaciones y el número de producción antes de avanzar');
      return;
    }

    setSaving(true);
    try {
      // Primero guardar los datos de producción
      await supabase
        .from('orden_produccion')
        .upsert({
          id_orden_pedido: order.id_orden_pedido,
          observaciones_produccion: observaciones,
          numero_produccion: numeroProduccion,
          fecha_produccion: new Date().toISOString(),
        }, {
          onConflict: 'id_orden_pedido'
        });

      // Avanzar fase
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          fase: 'logistica',
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      // Registrar avance en historial
      await supabase.from('historial_orden').insert({
        id_orden_pedido: order.id_orden_pedido,
        accion_clave: 'avance_fase',
        fase_anterior: 'produccion',
        fase_nueva: 'logistica',
        observaciones: `Producción completada. Orden enviada a Logística. OP: ${numeroProduccion}`,
      });

      onUpdateOrder(order.id_orden_pedido, { fase: 'logistica' });
      alert('Orden enviada a Logística exitosamente');
    } catch (error) {
      console.error('Error avanzando a Logística:', error);
      alert('Error al avanzar a Logística');
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
      {/* Número de Producción Sapiens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Orden de Producción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numero-produccion" className="flex items-center gap-2">
              Número de OP <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numero-produccion"
              placeholder="OP-2024-001234"
              value={numeroProduccion}
              onChange={(e) => setNumeroProduccion(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Observaciones de Producción */}
      <div className="space-y-2">
        <Label htmlFor="observaciones" className="flex items-center gap-2">
          Observaciones de Producción <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="observaciones"
          placeholder="Configuraciones realizadas y resultados de pruebas..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={6}
        />
      </div>

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
          onClick={handleAvanzarLogistica}
          disabled={!canAdvance || saving}
          className="bg-success hover:bg-success/90"
        >
          {canAdvance
            ? '✓ Enviar a Logística'
            : '⚠️ Completar Campos Obligatorios'}
        </Button>
      </div>
    </div>
  );
}
