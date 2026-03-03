/**
 * Tab de Producción — Fase 3
 * - Recepción de la orden (check + timestamp automático)
 * - Número de OP y Observaciones
 * (La asignación de configuradores se hace en el tab de Inventarios)
 */

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { OrdenKanban } from "@/types/kanban";
import { FileText, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";
import { useAuth } from "@/contexts/AuthContext";

export interface TabSaveHandle {
  save: () => Promise<void>;
}

interface ProduccionTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  readOnly?: boolean;
}

interface ProduccionData {
  id_orden_produccion: number;
  numero_produccion: string | null;
  observaciones_produccion: string | null;
  recibido_en_produccion: boolean;
  fecha_ingreso_produccion: string | null;
  fecha_salida_produccion: string | null;
  recibido_por: string | null;
}

function formatHora(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}

function formatFechaHora(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}

export const ProduccionTab = forwardRef<TabSaveHandle, ProduccionTabProps>(
  function ProduccionTab({ order, onUpdateOrder, onDirtyChange, readOnly = false }, ref) {
    const { user } = useAuth();

    const [observaciones, setObservaciones] = useState("");
    const [numeroProduccion, setNumeroProduccion] = useState("");
    const [saving, setSaving] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Recepción
    const [produccionData, setProduccionData] = useState<ProduccionData | null>(null);
    const [recibidoPorNombre, setRecibidoPorNombre] = useState<string | null>(null);

    // Estado inicial para dirty detection
    const [initialState, setInitialState] = useState<{
      observaciones: string;
      numeroProduccion: string;
    } | null>(null);

    // Detectar cambios
    useEffect(() => {
      if (initialState === null) return;
      const hasChanges =
        observaciones !== initialState.observaciones ||
        numeroProduccion !== initialState.numeroProduccion;
      onDirtyChange?.(hasChanges);
    }, [observaciones, numeroProduccion, initialState, onDirtyChange]);

    // Cargar datos
    useEffect(() => {
      const loadTabData = async () => {
        setIsInitialLoading(true);
        try {
          // 1. Datos de orden_produccion
          const { data: prod } = await supabase
            .from("orden_produccion")
            .select("*")
            .eq("id_orden_pedido", order.id_orden_pedido)
            .maybeSingle();

          if (prod) {
            setProduccionData(prod as ProduccionData);
            const obs = prod.observaciones_produccion || "";
            const num = prod.numero_produccion || "";
            setObservaciones(obs);
            setNumeroProduccion(num);
            setInitialState({ observaciones: obs, numeroProduccion: num });

            // Nombre del usuario que recibió
            if (prod.recibido_por) {
              const { data: perfil } = await supabase
                .from("profiles")
                .select("nombre")
                .eq("user_id", prod.recibido_por)
                .maybeSingle();
              setRecibidoPorNombre(perfil?.nombre || "Usuario desconocido");
            }
          } else {
            setInitialState({ observaciones: "", numeroProduccion: "" });
          }

        } catch (error) {
          console.error("Error cargando datos del tab producción:", error);
          setInitialState({ observaciones: "", numeroProduccion: "" });
        } finally {
          setTimeout(() => setIsInitialLoading(false), 300);
        }
      };

      loadTabData();
    }, [order.id_orden_pedido]);

    // Marcar recepción
    const handleRecibirOrden = async () => {
      if (!user || readOnly) return;

      const now = new Date().toISOString();

      try {
        // Verificar si ya existe registro de produccion
        const { data: existing } = await supabase
          .from("orden_produccion")
          .select("id_orden_produccion")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("orden_produccion")
            .update({
              recibido_en_produccion: true,
              fecha_ingreso_produccion: now,
              recibido_por: user.id,
            })
            .eq("id_orden_produccion", existing.id_orden_produccion);
        } else {
          await supabase.from("orden_produccion").insert({
            id_orden_pedido: order.id_orden_pedido,
            recibido_en_produccion: true,
            fecha_ingreso_produccion: now,
            recibido_por: user.id,
          });
        }

        // Actualizar estado local
        const { data: prod } = await supabase
          .from("orden_produccion")
          .select("*")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (prod) setProduccionData(prod as ProduccionData);

        // Nombre del usuario actual
        const { data: perfil } = await supabase
          .from("profiles")
          .select("nombre")
          .eq("user_id", user.id)
          .maybeSingle();
        setRecibidoPorNombre(perfil?.nombre || "—");
      } catch (error) {
        console.error("Error al recepcionar orden:", error);
      }
    };

    const handleSave = async () => {
      if (readOnly) return;
      setSaving(true);
      try {
        const { data: existing } = await supabase
          .from("orden_produccion")
          .select("id_orden_produccion")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("orden_produccion")
            .update({
              observaciones_produccion: observaciones,
              numero_produccion: numeroProduccion,
              fecha_produccion: new Date().toISOString(),
            })
            .eq("id_orden_produccion", existing.id_orden_produccion);
        } else {
          await supabase.from("orden_produccion").insert({
            id_orden_pedido: order.id_orden_pedido,
            observaciones_produccion: observaciones,
            numero_produccion: numeroProduccion,
            fecha_produccion: new Date().toISOString(),
          });
        }

        await supabase
          .from("orden_pedido")
          .update({ fecha_modificacion: new Date().toISOString() })
          .eq("id_orden_pedido", order.id_orden_pedido);

        setInitialState({ observaciones, numeroProduccion });
      } catch (error) {
        console.error("Error guardando cambios:", error);
      } finally {
        setSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({ save: readOnly ? async () => {} : handleSave }), [
      handleSave,
      readOnly,
    ]);

    if (isInitialLoading) return <TabLoadingSkeleton />;

    const yaRecibido = produccionData?.recibido_en_produccion === true;

    return (
      <div className="space-y-3">

        {/* ── RECEPCIÓN ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5" />
              Recepción en Producción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">

            {/* Checkbox de recepción */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="recibido"
                checked={yaRecibido}
                disabled={yaRecibido || readOnly}
                onCheckedChange={(checked) => {
                  if (checked) handleRecibirOrden();
                }}
              />
              <Label htmlFor="recibido" className="text-xs font-medium cursor-pointer">
                {yaRecibido ? "Recibido en producción" : "Marcar como recibido en producción"}
              </Label>
              {yaRecibido && produccionData?.fecha_ingreso_produccion && (
                <Badge variant="secondary" className="text-xs ml-auto">
                  {formatHora(produccionData.fecha_ingreso_produccion)}
                </Badge>
              )}
            </div>

            {/* Info de quién recibió */}
            {yaRecibido && (
              <div className="text-xs text-muted-foreground pl-6 space-y-0.5">
                <div>
                  <span className="font-medium">Ingreso:</span>{" "}
                  {formatFechaHora(produccionData?.fecha_ingreso_produccion ?? null)}
                  {recibidoPorNombre && <span className="ml-1">— {recibidoPorNombre}</span>}
                </div>
                {produccionData?.fecha_salida_produccion && (
                  <div>
                    <span className="font-medium">Salida:</span>{" "}
                    {formatFechaHora(produccionData.fecha_salida_produccion)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── ORDEN DE PRODUCCIÓN ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Orden de Producción
            </CardTitle>
          </CardHeader>
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

        {/* ── OBSERVACIONES ── */}
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

      </div>
    );
  }
);
