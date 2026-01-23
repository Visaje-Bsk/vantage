import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrdenKanban } from "@/types/kanban";
import { CheckCircle2, AlertCircle, Package, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

// Interfaces para líneas de servicio
interface LineaServicioDisplay {
  id_orden_detalle: number;
  operador_nombre: string;
  plan_nombre: string;
  apn: string;
  permanencia: string;
  clase_cobro: string;
  cantidad_lineas: string;
  valor_mensual: number;
}

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
  const [lineasServicio, setLineasServicio] = useState<LineaServicioDisplay[]>([]);

  // Estado inicial para detectar cambios
  const [initialState, setInitialState] = useState<{ stockValidado: boolean; observaciones: string } | null>(null);

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

        // Cargar líneas de servicio
        await loadLineasServicio();

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

  // Función para cargar líneas de servicio
  const loadLineasServicio = async () => {
    try {
      // Obtener detalles de la orden que son líneas de servicio
      const { data: detalles, error: detErr } = await supabase
        .from("detalle_orden")
        .select(`
          id_orden_detalle,
          id_linea_detalle,
          valor_unitario
        `)
        .eq("id_orden_pedido", order.id_orden_pedido)
        .not("id_linea_detalle", "is", null);

      if (detErr) throw detErr;

      if (!detalles || detalles.length === 0) {
        setLineasServicio([]);
        return;
      }

      // Obtener IDs de líneas de servicio
      const lineaIds = detalles
        .map(d => d.id_linea_detalle)
        .filter((v): v is number => typeof v === "number");

      if (lineaIds.length === 0) {
        setLineasServicio([]);
        return;
      }

      // Cargar información de líneas de servicio con joins
      const { data: lineas, error: linErr } = await supabase
        .from("linea_servicio")
        .select(`
          id_linea_detalle,
          permanencia,
          clase_cobro,
          cantidad_linea,
          operador:operador ( nombre_operador ),
          plan:plan ( nombre_plan ),
          apn:apn ( apn )
        `)
        .in("id_linea_detalle", lineaIds);

      if (linErr) throw linErr;

      // Mapear datos para display
      const mappedLineas: LineaServicioDisplay[] = detalles.map(det => {
        const linea = (lineas ?? []).find(l => l.id_linea_detalle === det.id_linea_detalle) as unknown as {
          id_linea_detalle: number;
          permanencia: string | null;
          clase_cobro: string | null;
          cantidad_linea: number | null;
          operador: { nombre_operador: string } | null;
          plan: { nombre_plan: string } | null;
          apn: { apn: string } | null;
        } | undefined;

        return {
          id_orden_detalle: det.id_orden_detalle,
          operador_nombre: linea?.operador?.nombre_operador || "-",
          plan_nombre: linea?.plan?.nombre_plan || "-",
          apn: linea?.apn?.apn || "-",
          permanencia: linea?.permanencia || "-",
          clase_cobro: linea?.clase_cobro || "-",
          cantidad_lineas: linea?.cantidad_linea ? String(linea.cantidad_linea) : "-",
          valor_mensual: det.valor_unitario ?? 0,
        };
      });

      setLineasServicio(mappedLineas);
    } catch (error) {
      console.error("Error cargando líneas de servicio:", error);
      setLineasServicio([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          observaciones_orden: observaciones,
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

  // Mostrar skeleton mientras carga
  if (isInitialLoading) {
    return <TabLoadingSkeleton />;
  }

  // Filtrar detalles para separar equipos de servicios
  const equiposDetalles = order?.detalles?.filter((d: any) => d.equipo) ?? [];
  const hasEquipos = equiposDetalles.length > 0;
  const hasLineasServicio = lineasServicio.length > 0;

  return (
    <div className="space-y-6">
      {/* Equipos de la orden */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            Equipos en la Orden
          </CardTitle>
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
                {hasEquipos ? (
                  equiposDetalles.map((detalle: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{detalle.equipo?.nombre_equipo || 'N/A'}</td>
                      <td className="p-3">{detalle.equipo?.codigo || 'N/A'}</td>
                      <td className="text-right p-3">{detalle.cantidad}</td>
                      <td className="text-right p-3">
                        ${detalle.valor_unitario?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-muted-foreground">
                      No hay equipos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Líneas de Servicio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Líneas de Servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasLineasServicio ? (
            <div className="space-y-3">
              {lineasServicio.map((linea, idx) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Operador:</span>{" "}
                      <span className="font-semibold">{linea.operador_nombre}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Plan:</span>{" "}
                      <span>{linea.plan_nombre}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">APN:</span>{" "}
                      <span>{linea.apn}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-2 pt-2 border-t border-muted">
                    <div>
                      <span className="font-medium text-muted-foreground">Permanencia:</span>{" "}
                      <span>{linea.permanencia} meses</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Clase Cobro:</span>{" "}
                      <span className="capitalize">{linea.clase_cobro}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Cant. Líneas:</span>{" "}
                      <span>{linea.cantidad_lineas}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Valor Mensual:</span>{" "}
                      <span className="font-semibold">${linea.valor_mensual.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">
              No hay líneas de servicio registradas
            </div>
          )}
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
      </div>
    </div>
  );
}