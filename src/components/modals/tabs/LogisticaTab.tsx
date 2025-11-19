/**
 * Tab de Logística
 *
 * FASE 4: LOGÍSTICA
 * Responsable: Rol logistica
 *
 * Según FLUJOKANBAN.md:
 * - RF-8 DATA GATE CRÍTICO: valor_servicio_flete es OBLIGATORIO
 * - Registro de despacho_orden (numero_guia, id_transportadora, fecha_despacho)
 * - Registro de remision (numero_remision)
 * - Sin este data gate completado, Facturación NO puede emitir facturas
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrdenKanban } from "@/types/kanban";
import { Truck, DollarSign, FileText, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

interface LogisticaTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function LogisticaTab({ order, onUpdateOrder }: LogisticaTabProps) {
  // Estado para despacho_orden
  const [valorFlete, setValorFlete] = useState("");
  const [numeroGuia, setNumeroGuia] = useState("");
  const [idTransportadora, setIdTransportadora] = useState("");
  const [fechaDespacho, setFechaDespacho] = useState("");
  const [observacionesLogistica, setObservacionesLogistica] = useState("");

  // Estado para remision
  const [numeroRemision, setNumeroRemision] = useState("");

  // Estado para transportadoras
  const [transportadoras, setTransportadoras] = useState<
    Array<{ id_transportadora: number; nombre_transportadora: string }>
  >([]);

  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Cargar datos iniciales del tab
  useEffect(() => {
    const loadTabData = async () => {
      setIsInitialLoading(true);

      try {
        // Cargar transportadoras
        const { data: transportadorasData, error: transportadorasError } = await supabase
          .from("transportadora")
          .select("id_transportadora, nombre_transportadora")
          .order("nombre_transportadora", { ascending: true });

        if (transportadorasError) {
          console.error("Error cargando transportadoras:", transportadorasError);
        } else if (transportadorasData) {
          setTransportadoras(transportadorasData);
        }

        // Cargar datos de despacho_orden si existen
        const { data: despachoData, error: despachoError } = await supabase
          .from("despacho_orden")
          .select("*")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (!despachoError && despachoData) {
          setValorFlete(despachoData.valor_servicio_flete?.toString() || "");
          setNumeroGuia(despachoData.numero_guia || "");
          setIdTransportadora(despachoData.id_transportadora?.toString() || "");
          setFechaDespacho(despachoData.fecha_despacho || "");
          setObservacionesLogistica(despachoData.observaciones_logistica || "");
        }

        // Cargar datos de remisión si existen
        const { data: remisionData, error: remisionError } = await supabase
          .from("remision")
          .select("*")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (!remisionError && remisionData) {
          setNumeroRemision(remisionData.numero_remision || "");
        }
      } catch (error) {
        console.error("Error cargando datos del tab:", error);
      } finally {
        // Pequeño delay para mostrar el skeleton (mejor UX)
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 300);
      }
    };

    loadTabData();
  }, [order.id_orden_pedido]);

  // RF-8 CRITICAL: valor_servicio_flete es OBLIGATORIO para avanzar
  const canAdvance =
    valorFlete.trim() !== "" &&
    numeroGuia.trim() !== "" &&
    idTransportadora.trim() !== "" &&
    numeroRemision.trim() !== "";

  const handleSave = async () => {
    setSaving(true);
    try {
      // Guardar datos de despacho_orden
      const { error: despachoError } = await supabase
        .from('despacho_orden')
        .upsert({
          id_orden_pedido: order.id_orden_pedido,
          valor_servicio_flete: parseFloat(valorFlete) || 0,
          numero_guia: numeroGuia,
          id_transportadora: parseInt(idTransportadora) || null,
          fecha_despacho: fechaDespacho || new Date().toISOString(),
          observaciones_logistica: observacionesLogistica,
        }, {
          onConflict: 'id_orden_pedido'
        });

      if (despachoError) throw despachoError;

      // Guardar datos de remision
      const { error: remisionError } = await supabase
        .from('remision')
        .upsert({
          id_orden_pedido: order.id_orden_pedido,
          numero_remision: numeroRemision,
          fecha_remision: new Date().toISOString(),
        }, {
          onConflict: 'id_orden_pedido'
        });

      if (remisionError) throw remisionError;

      // Actualizar fecha de modificación de la orden
      await supabase
        .from('orden_pedido')
        .update({ fecha_modificacion: new Date().toISOString() })
        .eq('id_orden_pedido', order.id_orden_pedido);

      // Registrar en historial
      await supabase.from('historial_orden').insert({
        id_orden_pedido: order.id_orden_pedido,
        accion_clave: 'logistica_actualizada',
        fase_anterior: order.fase,
        fase_nueva: order.fase,
        observaciones: `Datos logísticos guardados. Guía: ${numeroGuia}, Remisión: ${numeroRemision}`,
      });

      alert('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAvanzarFacturacion = async () => {
    if (!canAdvance) {
      alert('Debe completar todos los campos obligatorios antes de avanzar a Facturación');
      return;
    }

    setSaving(true);
    try {
      // Primero guardar todos los datos
      const { error: despachoError } = await supabase
        .from('despacho_orden')
        .upsert({
          id_orden_pedido: order.id_orden_pedido,
          valor_servicio_flete: parseFloat(valorFlete) || 0,
          numero_guia: numeroGuia,
          id_transportadora: parseInt(idTransportadora) || null,
          fecha_despacho: fechaDespacho || new Date().toISOString(),
          observaciones_logistica: observacionesLogistica,
        }, {
          onConflict: 'id_orden_pedido'
        });

      if (despachoError) throw despachoError;

      const { error: remisionError } = await supabase
        .from('remision')
        .upsert({
          id_orden_pedido: order.id_orden_pedido,
          numero_remision: numeroRemision,
          fecha_remision: new Date().toISOString(),
        }, {
          onConflict: 'id_orden_pedido'
        });

      if (remisionError) throw remisionError;

      // Avanzar fase y cambiar estatus a 'enviada'
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          fase: 'facturacion',
          estatus: 'enviada',
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      // Registrar avance en historial con énfasis en RF-8
      await supabase.from('historial_orden').insert({
        id_orden_pedido: order.id_orden_pedido,
        accion_clave: 'avance_fase',
        fase_anterior: 'logistica',
        fase_nueva: 'facturacion',
        observaciones: `RF-8 completado: Valor flete $${valorFlete}. Orden DESPACHADA (estatus → enviada). Guía: ${numeroGuia}, Remisión: ${numeroRemision}`,
      });

      onUpdateOrder(order.id_orden_pedido, {
        fase: 'facturacion',
        estatus: 'enviada'
      });
      alert('Orden despachada y enviada a Facturación exitosamente');
    } catch (error) {
      console.error('Error avanzando a Facturación:', error);
      alert('Error al avanzar a Facturación');
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
      {/* Remisión - Arriba de la información de despacho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Remisión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numero-remision" className="flex items-center gap-2">
              Número de Remisión <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numero-remision"
              placeholder="REM-2024-001234"
              value={numeroRemision}
              onChange={(e) => setNumeroRemision(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Despacho y Flete */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Información de Despacho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valor del Flete */}
          <div className="space-y-2">
            <Label htmlFor="valor-flete" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor del Flete <span className="text-destructive">*</span>
            </Label>
            <Input
              id="valor-flete"
              type="number"
              step="0.01"
              placeholder="50000"
              value={valorFlete}
              onChange={(e) => setValorFlete(e.target.value)}
            />
          </div>

          {/* Número de Guía */}
          <div className="space-y-2">
            <Label htmlFor="numero-guia" className="flex items-center gap-2">
              Número de Guía <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numero-guia"
              placeholder="Ej: SERV-2024-001234"
              value={numeroGuia}
              onChange={(e) => setNumeroGuia(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Número de seguimiento de la transportadora
            </p>
          </div>

          {/* Transportadora */}
          <div className="space-y-2">
            <Label htmlFor="id-transportadora" className="flex items-center gap-2">
              Transportadora <span className="text-destructive">*</span>
            </Label>
            <Select
              value={idTransportadora}
              onValueChange={(value) => setIdTransportadora(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una transportadora" />
              </SelectTrigger>
              <SelectContent>
                {transportadoras.map((transportadora) => (
                  <SelectItem
                    key={transportadora.id_transportadora}
                    value={transportadora.id_transportadora.toString()}
                  >
                    {transportadora.nombre_transportadora}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Empresa encargada del envío (ej: MENSAJEROS URBANOS, SERVIMEJIA)
            </p>
          </div>

          {/* Fecha de Despacho */}
          <div className="space-y-2">
            <Label htmlFor="fecha-despacho">Fecha de Despacho</Label>
            <Input
              id="fecha-despacho"
              type="datetime-local"
              value={fechaDespacho}
              onChange={(e) => setFechaDespacho(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Fecha y hora de recolección/envío (se auto-genera si se deja en blanco)
            </p>
          </div>

          {/* Observaciones Logística */}
          <div className="space-y-2">
            <Label htmlFor="observaciones-logistica">Observaciones de Logística (Opcional)</Label>
            <Textarea
              id="observaciones-logistica"
              placeholder="Instrucciones especiales de entrega, horarios, contactos..."
              value={observacionesLogistica}
              onChange={(e) => setObservacionesLogistica(e.target.value)}
              rows={3}
            />
          </div>
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
          onClick={handleAvanzarFacturacion}
          disabled={!canAdvance || saving}
          className="bg-success hover:bg-success/90"
        >
          {canAdvance
            ? 'Enviar a Facturación'
            : 'Completar Campos'}
        </Button>
      </div>
    </div>
  );
}
