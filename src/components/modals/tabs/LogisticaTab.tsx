/**
 * Tab de Logística
 *
 * FASE 6: LOGÍSTICA (FASE FINAL)
 * Responsable: Rol logistica
 *
 * Según el nuevo flujo:
 * - RF-8 DATA GATE CRÍTICO: valor_servicio_flete es OBLIGATORIO
 * - Registro de despacho_orden (numero_guia, id_transportadora, fecha_despacho)
 * - Registro de remision (numero_remision)
 * - Cierre definitivo de la orden (estatus -> 'cerrada')
 * - Última fase del flujo Kanban
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
import { Truck, DollarSign, FileText, CheckCircle2, AlertCircle, Calendar, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { SuccessModal } from "../SuccessModal";
import { toast } from "sonner";

interface LogisticaTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

interface LogisticaInitialState {
  valorFlete: string;
  numeroGuia: string;
  idTransportadora: string;
  fechaDespacho: string;
  observacionesLogistica: string;
  numeroRemision: string;
  fechaEntregaCliente: string;
  observacionesProceso: string;
}

export function LogisticaTab({ order, onUpdateOrder, onDirtyChange }: LogisticaTabProps) {
  // Estado para despacho_orden
  const [valorFlete, setValorFlete] = useState("");
  const [numeroGuia, setNumeroGuia] = useState("");
  const [idTransportadora, setIdTransportadora] = useState("");
  const [fechaDespacho, setFechaDespacho] = useState("");
  const [observacionesLogistica, setObservacionesLogistica] = useState("");

  // Estado para remision
  const [numeroRemision, setNumeroRemision] = useState("");

  // Nuevos campos obligatorios
  const [fechaEntregaCliente, setFechaEntregaCliente] = useState("");
  const [observacionesProceso, setObservacionesProceso] = useState("");

  // Estado para transportadoras
  const [transportadoras, setTransportadoras] = useState<
    Array<{ id_transportadora: number; nombre_transportadora: string }>
  >([]);

  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Estado inicial para detectar cambios
  const [initialState, setInitialState] = useState<LogisticaInitialState | null>(null);

  // Detectar cambios comparando con estado inicial
  useEffect(() => {
    if (initialState === null) return;

    const hasChanges =
      valorFlete !== initialState.valorFlete ||
      numeroGuia !== initialState.numeroGuia ||
      idTransportadora !== initialState.idTransportadora ||
      fechaDespacho !== initialState.fechaDespacho ||
      observacionesLogistica !== initialState.observacionesLogistica ||
      numeroRemision !== initialState.numeroRemision ||
      fechaEntregaCliente !== initialState.fechaEntregaCliente ||
      observacionesProceso !== initialState.observacionesProceso;

    onDirtyChange?.(hasChanges);
  }, [valorFlete, numeroGuia, idTransportadora, fechaDespacho, observacionesLogistica, numeroRemision, fechaEntregaCliente, observacionesProceso, initialState, onDirtyChange]);

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

        // Variables para el estado inicial
        let loadedValorFlete = "";
        let loadedNumeroGuia = "";
        let loadedIdTransportadora = "";
        let loadedFechaDespacho = "";
        let loadedObservacionesLogistica = "";
        let loadedNumeroRemision = "";
        let loadedFechaEntregaCliente = "";
        let loadedObservacionesProceso = "";

        // Cargar datos de despacho_orden si existen
        const { data: despachoData, error: despachoError } = await supabase
          .from("despacho_orden")
          .select("*")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (!despachoError && despachoData) {
          loadedValorFlete = despachoData.valor_servicio_flete?.toString() || "";
          loadedNumeroGuia = despachoData.numero_guia || "";
          loadedIdTransportadora = despachoData.id_transportadora?.toString() || "";
          loadedFechaDespacho = despachoData.fecha_despacho || "";
          loadedObservacionesLogistica = despachoData.observaciones || "";
          loadedFechaEntregaCliente = despachoData.fecha_entrega_cliente || "";
          loadedObservacionesProceso = despachoData.observaciones_proceso || "";

          setValorFlete(loadedValorFlete);
          setNumeroGuia(loadedNumeroGuia);
          setIdTransportadora(loadedIdTransportadora);
          setFechaDespacho(loadedFechaDespacho);
          setObservacionesLogistica(loadedObservacionesLogistica);
          setFechaEntregaCliente(loadedFechaEntregaCliente);
          setObservacionesProceso(loadedObservacionesProceso);
        }

        // Cargar datos de remisión si existen
        const { data: remisionData, error: remisionError } = await supabase
          .from("remision")
          .select("*")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .maybeSingle();

        if (!remisionError && remisionData) {
          loadedNumeroRemision = remisionData.numero_remision || "";
          setNumeroRemision(loadedNumeroRemision);
        }

        // Guardar estado inicial
        setInitialState({
          valorFlete: loadedValorFlete,
          numeroGuia: loadedNumeroGuia,
          idTransportadora: loadedIdTransportadora,
          fechaDespacho: loadedFechaDespacho,
          observacionesLogistica: loadedObservacionesLogistica,
          numeroRemision: loadedNumeroRemision,
          fechaEntregaCliente: loadedFechaEntregaCliente,
          observacionesProceso: loadedObservacionesProceso,
        });
      } catch (error) {
        console.error("Error cargando datos del tab:", error);
        // Establecer estado inicial vacío en caso de error
        setInitialState({
          valorFlete: "",
          numeroGuia: "",
          idTransportadora: "",
          fechaDespacho: "",
          observacionesLogistica: "",
          numeroRemision: "",
          fechaEntregaCliente: "",
          observacionesProceso: "",
        });
      } finally {
        // Pequeño delay para mostrar el skeleton (mejor UX)
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 300);
      }
    };

    loadTabData();
  }, [order.id_orden_pedido]);

  // RF-8 CRITICAL: Todos los campos obligatorios para cerrar
  const canClose =
    valorFlete.trim() !== "" &&
    numeroGuia.trim() !== "" &&
    idTransportadora.trim() !== "" &&
    numeroRemision.trim() !== "" &&
    fechaEntregaCliente.trim() !== "" &&
    observacionesProceso.trim() !== "";

  const handleSave = async () => {
    setSaving(true);
    try {
      // Verificar si existe despacho_orden
      const { data: existingDespacho } = await supabase
        .from('despacho_orden')
        .select('id_despacho_orden')
        .eq('id_orden_pedido', order.id_orden_pedido)
        .maybeSingle();

      // Guardar datos de despacho_orden (UPDATE o INSERT)
      if (existingDespacho) {
        const { error: despachoError } = await supabase
          .from('despacho_orden')
          .update({
            valor_servicio_flete: parseFloat(valorFlete) || 0,
            numero_guia: numeroGuia,
            id_transportadora: parseInt(idTransportadora) || null,
            fecha_despacho: fechaDespacho || null,
            fecha_entrega_cliente: fechaEntregaCliente || null,
            observaciones: observacionesLogistica,
            observaciones_proceso: observacionesProceso,
          })
          .eq('id_orden_pedido', order.id_orden_pedido);

        if (despachoError) throw despachoError;
      } else {
        const { error: despachoError } = await supabase
          .from('despacho_orden')
          .insert({
            id_orden_pedido: order.id_orden_pedido,
            id_tipo_despacho: 1,
            valor_servicio_flete: parseFloat(valorFlete) || 0,
            numero_guia: numeroGuia,
            id_transportadora: parseInt(idTransportadora) || null,
            fecha_despacho: fechaDespacho || null,
            fecha_entrega_cliente: fechaEntregaCliente || null,
            observaciones: observacionesLogistica,
            observaciones_proceso: observacionesProceso,
          });

        if (despachoError) throw despachoError;
      }

      // Verificar si existe remision
      const { data: existingRemision } = await supabase
        .from('remision')
        .select('id_remision')
        .eq('id_orden_pedido', order.id_orden_pedido)
        .maybeSingle();

      // Guardar datos de remision (UPDATE o INSERT)
      if (existingRemision) {
        const { error: remisionError } = await supabase
          .from('remision')
          .update({
            numero_remision: numeroRemision,
          })
          .eq('id_orden_pedido', order.id_orden_pedido);

        if (remisionError) throw remisionError;
      } else {
        const { error: remisionError } = await supabase
          .from('remision')
          .insert({
            id_orden_pedido: order.id_orden_pedido,
            numero_remision: numeroRemision,
            fecha_remision: new Date().toISOString(),
          });

        if (remisionError) throw remisionError;
      }

      // Actualizar fecha de modificación de la orden
      await supabase
        .from('orden_pedido')
        .update({ fecha_modificacion: new Date().toISOString() })
        .eq('id_orden_pedido', order.id_orden_pedido);

      // Actualizar estado inicial para marcar como limpio
      setInitialState({
        valorFlete,
        numeroGuia,
        idTransportadora,
        fechaDespacho,
        observacionesLogistica,
        numeroRemision,
        fechaEntregaCliente,
        observacionesProceso,
      });

      toast.success('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCerrarOrden = () => {
    if (!canClose) {
      toast.error('Debe completar todos los campos obligatorios antes de cerrar la orden');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmCerrarOrden = async () => {
    setShowConfirmDialog(false);
    setSaving(true);

    try {
      // Verificar si existe despacho_orden
      const { data: existingDespacho } = await supabase
        .from('despacho_orden')
        .select('id_despacho_orden')
        .eq('id_orden_pedido', order.id_orden_pedido)
        .maybeSingle();

      // Guardar datos de despacho_orden (UPDATE o INSERT)
      if (existingDespacho) {
        const { error: despachoError } = await supabase
          .from('despacho_orden')
          .update({
            valor_servicio_flete: parseFloat(valorFlete) || 0,
            numero_guia: numeroGuia,
            id_transportadora: parseInt(idTransportadora) || null,
            fecha_despacho: fechaDespacho || new Date().toISOString(),
            fecha_entrega_cliente: fechaEntregaCliente || null,
            observaciones: observacionesLogistica,
            observaciones_proceso: observacionesProceso,
          })
          .eq('id_orden_pedido', order.id_orden_pedido);

        if (despachoError) throw despachoError;
      } else {
        const { error: despachoError } = await supabase
          .from('despacho_orden')
          .insert({
            id_orden_pedido: order.id_orden_pedido,
            id_tipo_despacho: 1,
            valor_servicio_flete: parseFloat(valorFlete) || 0,
            numero_guia: numeroGuia,
            id_transportadora: parseInt(idTransportadora) || null,
            fecha_despacho: fechaDespacho || new Date().toISOString(),
            fecha_entrega_cliente: fechaEntregaCliente || null,
            observaciones: observacionesLogistica,
            observaciones_proceso: observacionesProceso,
          });

        if (despachoError) throw despachoError;
      }

      // Verificar si existe remision
      const { data: existingRemision } = await supabase
        .from('remision')
        .select('id_remision')
        .eq('id_orden_pedido', order.id_orden_pedido)
        .maybeSingle();

      // Guardar datos de remision (UPDATE o INSERT)
      if (existingRemision) {
        const { error: remisionError } = await supabase
          .from('remision')
          .update({
            numero_remision: numeroRemision,
          })
          .eq('id_orden_pedido', order.id_orden_pedido);

        if (remisionError) throw remisionError;
      } else {
        const { error: remisionError } = await supabase
          .from('remision')
          .insert({
            id_orden_pedido: order.id_orden_pedido,
            numero_remision: numeroRemision,
            fecha_remision: new Date().toISOString(),
          });

        if (remisionError) throw remisionError;
      }

      // CERRAR LA ORDEN - estatus = 'cerrada' (NO avanza a facturación)
      const { error: updateError } = await supabase
        .from('orden_pedido')
        .update({
          estatus: 'cerrada',
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (updateError) throw updateError;

      // Marcar como limpio
      setInitialState({
        valorFlete,
        numeroGuia,
        idTransportadora,
        fechaDespacho,
        observacionesLogistica,
        numeroRemision,
        fechaEntregaCliente,
        observacionesProceso,
      });

      onUpdateOrder(order.id_orden_pedido, {
        estatus: "cerrada",
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

      {/* Entrega al Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Entrega al Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fecha de Entrega al Cliente */}
          <div className="space-y-2">
            <Label htmlFor="fecha-entrega-cliente" className="flex items-center gap-2">
              Fecha de Entrega al Cliente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fecha-entrega-cliente"
              type="datetime-local"
              value={fechaEntregaCliente}
              onChange={(e) => setFechaEntregaCliente(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Fecha y hora real en que el cliente recibió el pedido
            </p>
          </div>

          {/* Observaciones del Proceso */}
          <div className="space-y-2">
            <Label htmlFor="observaciones-proceso" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Observaciones del Proceso <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="observaciones-proceso"
              placeholder="Resumen del proceso de entrega, incidencias, confirmación de recepción..."
              value={observacionesProceso}
              onChange={(e) => setObservacionesProceso(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Documento obligatorio de cierre del proceso completo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validación visual para cierre */}
      {!canClose && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campos Obligatorios</AlertTitle>
          <AlertDescription>
            Complete los campos requeridos para cerrar la orden
          </AlertDescription>
        </Alert>
      )}

      {canClose && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Validación Completa</AlertTitle>
          <AlertDescription className="text-success-foreground/80">
            Información registrada correctamente. Puede cerrar la orden.
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
            : 'Completar Campos Primero'}
        </Button>
      </div>

      {/* Modal de confirmación */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmCerrarOrden}
        title="¿Cerrar la orden?"
        description="Esta acción cerrará definitivamente la orden. La orden pasará al historial y no podrá editarse más."
        confirmText="Sí, cerrar orden"
        cancelText="Cancelar"
        variant="default"
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
