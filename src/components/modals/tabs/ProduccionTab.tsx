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

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

// Data Gates
import { useDataGateValidation } from "@/hooks/useDataGateValidation";
import { DataGateAlert } from "@/components/dataGates/DataGateAlert";
import type { FaseOrdenDB } from "@/types/kanban";

export interface TabSaveHandle {
  save: () => Promise<void>;
}

interface ProduccionTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  readOnly?: boolean;
}

export const ProduccionTab = forwardRef<TabSaveHandle, ProduccionTabProps>(function ProduccionTab({ order, onUpdateOrder, onDirtyChange, readOnly = false }, ref) {
  const [observaciones, setObservaciones] = useState("");
  const [numeroProduccion, setNumeroProduccion] = useState("");
  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Estado inicial para detectar cambios
  const [initialState, setInitialState] = useState<{ observaciones: string; numeroProduccion: string } | null>(null);

  // Hooks de Data Gates
  const dataGateValidation = useDataGateValidation({
    order: {
      ...order,
      observaciones_produccion: observaciones,
      numero_produccion: numeroProduccion,
    },
    currentPhase: 'produccion' as FaseOrdenDB,
  });


  // Detectar cambios comparando con estado inicial
  useEffect(() => {
    if (initialState === null) return;

    const hasChanges =
      observaciones !== initialState.observaciones ||
      numeroProduccion !== initialState.numeroProduccion;

    onDirtyChange?.(hasChanges);
  }, [observaciones, numeroProduccion, initialState, onDirtyChange]);

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
          const loadedObservaciones = produccionData.observaciones_produccion || "";
          const loadedNumeroProduccion = produccionData.numero_produccion || "";

          setObservaciones(loadedObservaciones);
          setNumeroProduccion(loadedNumeroProduccion);

          // Guardar estado inicial
          setInitialState({
            observaciones: loadedObservaciones,
            numeroProduccion: loadedNumeroProduccion,
          });
        } else {
          // Si no hay datos, establecer estado inicial vacío
          setInitialState({ observaciones: "", numeroProduccion: "" });
        }
      } catch (error) {
        console.error("Error cargando datos del tab:", error);
        setInitialState({ observaciones: "", numeroProduccion: "" });
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
      // Verificar si ya existe un registro de producción
      const { data: existing } = await supabase
        .from('orden_produccion')
        .select('id_orden_produccion')
        .eq('id_orden_pedido', order.id_orden_pedido)
        .maybeSingle();

      if (existing) {
        // UPDATE existente
        const { error } = await supabase
          .from('orden_produccion')
          .update({
            observaciones_produccion: observaciones,
            numero_produccion: numeroProduccion,
            fecha_produccion: new Date().toISOString(),
          })
          .eq('id_orden_produccion', existing.id_orden_produccion);
        if (error) throw error;
      } else {
        // INSERT nuevo
        const { error } = await supabase
          .from('orden_produccion')
          .insert({
            id_orden_pedido: order.id_orden_pedido,
            observaciones_produccion: observaciones,
            numero_produccion: numeroProduccion,
            fecha_produccion: new Date().toISOString(),
          });
        if (error) throw error;
      }

      // Actualizar fecha de modificación de la orden
      await supabase
        .from('orden_pedido')
        .update({ fecha_modificacion: new Date().toISOString() })
        .eq('id_orden_pedido', order.id_orden_pedido);

      // Actualizar estado inicial para marcar como limpio
      setInitialState({ observaciones, numeroProduccion });

      alert('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ save: readOnly ? async () => {} : handleSave }), [handleSave, readOnly]);

  // Mostrar skeleton mientras carga
  if (isInitialLoading) {
    return <TabLoadingSkeleton />;
  }

  return (
    <div className="space-y-3">
      {/* Número de Producción Sapiens */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Orden de Producción
          </CardTitle>
        </CardHeader>

        {/* Data Gates Validation */}
        <DataGateAlert
          errors={dataGateValidation.errors}
          canAdvance={dataGateValidation.canAdvance}
          phaseName="Producción"
        />
        <CardContent className="space-y-2 pt-0">
          <div className="space-y-1">
            <Label htmlFor="numero-produccion" className="flex items-center gap-1.5 text-xs">
              Número de OP <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numero-produccion"
              placeholder="OP-2024-001234"
              value={numeroProduccion}
              onChange={(e) => setNumeroProduccion(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Observaciones de Producción */}
      <div className="space-y-1">
        <Label htmlFor="observaciones" className="flex items-center gap-1.5 text-xs">
          Observaciones de Producción <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="observaciones"
          placeholder="Configuraciones realizadas y resultados de pruebas..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={4}
          disabled={readOnly}
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

    </div>
  );
});
