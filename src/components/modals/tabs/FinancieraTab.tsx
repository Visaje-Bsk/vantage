/**
 * Tab de Financiera
 *
 * FASE 4: FINANCIERA
 * Responsable: Rol financiera
 *
 * Según el nuevo flujo:
 * - Estado de validación de pago (Cupo, Cancelado, MORA, N/A, OK)
 * - Medio de pago
 * - Tipo de pago (desde catálogo tipo_pago)
 * - Condiciones de pago
 * - Pago del flete
 * - Observaciones financieras
 * - Avanza a Facturación solo si estado = OK o N/A
 */

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { CreditCard, CheckCircle2, AlertCircle, Wallet, Truck, FileText, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TabLoadingSkeleton } from "./TabLoadingSkeleton";

// Tipos para los enums
type EstadoValidacionPago = "cupo" | "cancelado" | "mora" | "na" | "ok" | "";
type MedioPago = "no_aplica" | "debito_ach_pse" | "efectivo" | "consignacion_bancaria" |
  "transferencia_debito_interbancario" | "transferencia_debito_bancaria" |
  "tarjeta_credito" | "tarjeta_debito" | "giro_referenciado" | "otro" | "";
type PagoFlete = "no_aplica" | "pago_contraentrega" | "paga_bismark_factura_cliente" | "flete_costo_negocio" | "";

// Interfaz para el tipo de pago del catálogo
interface TipoPago {
  id_tipo_pago: number;
  forma_pago: string;
  plazo: string | null;
  aprobado_cartera: boolean;
}

// Opciones para los selects con labels legibles
const ESTADO_VALIDACION_OPTIONS: { value: EstadoValidacionPago; label: string }[] = [
  { value: "cupo", label: "Cupo" },
  { value: "cancelado", label: "Cancelado" },
  { value: "mora", label: "MORA" },
  { value: "na", label: "N/A" },
  { value: "ok", label: "OK" },
];

const MEDIO_PAGO_OPTIONS: { value: MedioPago; label: string }[] = [
  { value: "no_aplica", label: "No Aplica" },
  { value: "debito_ach_pse", label: "3-Débito ACH (PSE)" },
  { value: "efectivo", label: "10-Efectivo" },
  { value: "consignacion_bancaria", label: "42-Consignación bancaria (consignación efectivo en sucursal)" },
  { value: "transferencia_debito_interbancario", label: "46-Transferencia Débito Interbancario (pago desde otro banco)" },
  { value: "transferencia_debito_bancaria", label: "47-Transferencia Débito Bancaria (pago desde mismo banco)" },
  { value: "tarjeta_credito", label: "48-Tarjeta Crédito" },
  { value: "tarjeta_debito", label: "49-Tarjeta Débito" },
  { value: "giro_referenciado", label: "93-Giro referenciado (giro internacional)" },
  { value: "otro", label: "ZZZ-Otro" },
];

const PAGO_FLETE_OPTIONS: { value: PagoFlete; label: string }[] = [
  { value: "no_aplica", label: "No Aplica" },
  { value: "pago_contraentrega", label: "Pago Contraentrega" },
  { value: "paga_bismark_factura_cliente", label: "Paga Bismark y lo factura al cliente" },
  { value: "flete_costo_negocio", label: "Flete es Costo del Negocio" },
];

interface FinancieraTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  readOnly?: boolean;
}

interface FinancieraInitialState {
  estadoValidacionPago: EstadoValidacionPago;
  medioPago: MedioPago;
  idTipoPago: string;
  pagoFlete: PagoFlete;
  observaciones: string;
}

export interface TabSaveHandle {
  save: () => Promise<void>;
}

export const FinancieraTab = forwardRef<TabSaveHandle, FinancieraTabProps>(function FinancieraTab({ order, onUpdateOrder, onDirtyChange, readOnly = false }, ref) {
  const [estadoValidacionPago, setEstadoValidacionPago] = useState<EstadoValidacionPago>("");
  const [medioPago, setMedioPago] = useState<MedioPago>("");
  const [idTipoPago, setIdTipoPago] = useState<string>("");
  const [pagoFlete, setPagoFlete] = useState<PagoFlete>("");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Catálogo de tipos de pago
  const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);

  // Estado inicial para detectar cambios
  const [initialState, setInitialState] = useState<FinancieraInitialState | null>(null);

  // Cargar catálogo de tipos de pago
  useEffect(() => {
    const loadTiposPago = async () => {
      const { data, error } = await supabase
        .from("tipo_pago")
        .select("id_tipo_pago, forma_pago, plazo, aprobado_cartera")
        .order("id_tipo_pago", { ascending: true });

      if (!error && data) {
        setTiposPago(data);
      }
    };

    loadTiposPago();
  }, []);

  // Cargar datos iniciales de la orden
  useEffect(() => {
    const loadTabData = async () => {
      setIsInitialLoading(true);
      try {
        const { data: ordenData, error } = await supabase
          .from("orden_pedido")
          .select("estado_validacion_pago, medio_pago, id_tipo_pago, pago_flete, observaciones_financieras")
          .eq("id_orden_pedido", order.id_orden_pedido)
          .single();

        if (!error && ordenData) {
          const loadedEstado = (ordenData.estado_validacion_pago || "") as EstadoValidacionPago;
          const loadedMedio = (ordenData.medio_pago || "") as MedioPago;
          const loadedIdTipoPago = ordenData.id_tipo_pago ? String(ordenData.id_tipo_pago) : "";
          const loadedPagoFlete = (ordenData.pago_flete || "") as PagoFlete;
          const loadedObservaciones = ordenData.observaciones_financieras || "";

          setEstadoValidacionPago(loadedEstado);
          setMedioPago(loadedMedio);
          setIdTipoPago(loadedIdTipoPago);
          setPagoFlete(loadedPagoFlete);
          setObservaciones(loadedObservaciones);

          setInitialState({
            estadoValidacionPago: loadedEstado,
            medioPago: loadedMedio,
            idTipoPago: loadedIdTipoPago,
            pagoFlete: loadedPagoFlete,
            observaciones: loadedObservaciones,
          });
        } else {
          setInitialState({
            estadoValidacionPago: "",
            medioPago: "",
            idTipoPago: "",
            pagoFlete: "",
            observaciones: "",
          });
        }
      } catch (error) {
        console.error("Error cargando datos financieros:", error);
        setInitialState({
          estadoValidacionPago: "",
          medioPago: "",
          idTipoPago: "",
          pagoFlete: "",
          observaciones: "",
        });
      } finally {
        setTimeout(() => setIsInitialLoading(false), 300);
      }
    };

    loadTabData();
  }, [order.id_orden_pedido]);

  // Detectar cambios comparando con estado inicial
  useEffect(() => {
    if (initialState === null) return;

    const hasChanges =
      estadoValidacionPago !== initialState.estadoValidacionPago ||
      medioPago !== initialState.medioPago ||
      idTipoPago !== initialState.idTipoPago ||
      pagoFlete !== initialState.pagoFlete ||
      observaciones !== initialState.observaciones;

    onDirtyChange?.(hasChanges);
  }, [estadoValidacionPago, medioPago, idTipoPago, pagoFlete, observaciones, initialState, onDirtyChange]);

  // Solo puede avanzar si el estado de validación es OK o N/A
  const canAdvance = estadoValidacionPago === "ok" || estadoValidacionPago === "na";

  // Validación de campos obligatorios para guardar
  const canSave = estadoValidacionPago !== "" && medioPago !== "" && idTipoPago !== "";

  const handleSave = async () => {
    if (!canSave) {
      toast.error('Complete los campos obligatorios: Estado de validación, Medio de pago y Tipo de pago');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('orden_pedido')
        .update({
          estado_validacion_pago: estadoValidacionPago || null,
          medio_pago: medioPago || null,
          id_tipo_pago: idTipoPago ? parseInt(idTipoPago) : null,
          pago_flete: pagoFlete || null,
          observaciones_financieras: observaciones,
          fecha_modificacion: new Date().toISOString(),
        })
        .eq('id_orden_pedido', order.id_orden_pedido);

      if (error) throw error;

      setInitialState({
        estadoValidacionPago,
        medioPago,
        idTipoPago,
        pagoFlete,
        observaciones,
      });

      toast.success('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ save: readOnly ? async () => {} : handleSave }), [handleSave, readOnly]);

  if (isInitialLoading) {
    return <TabLoadingSkeleton />;
  }

  return (
    <div className="space-y-3">
      {/* Estado de Validación de Pago */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Validación de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="space-y-1">
            <Label htmlFor="estado-validacion" className="flex items-center gap-1.5 text-xs">
              Estado de Validación <span className="text-destructive">*</span>
            </Label>
            <Select
              value={estadoValidacionPago}
              onValueChange={(value) => setEstadoValidacionPago(value as EstadoValidacionPago)}
              disabled={readOnly}
            >
              <SelectTrigger id="estado-validacion">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADO_VALIDACION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Solo se puede avanzar a Facturación si el estado es "OK" o "N/A"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Medio de Pago */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Medio de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="space-y-1">
            <Label htmlFor="medio-pago" className="flex items-center gap-1.5 text-xs">
              Medio de Pago <span className="text-destructive">*</span>
            </Label>
            <Select
              value={medioPago}
              onValueChange={(value) => setMedioPago(value as MedioPago)}
              disabled={readOnly}
            >
              <SelectTrigger id="medio-pago">
                <SelectValue placeholder="Seleccionar medio de pago" />
              </SelectTrigger>
              <SelectContent>
                {MEDIO_PAGO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tipo de Pago */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5" />
            Tipo de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="space-y-1">
            <Label htmlFor="tipo-pago" className="flex items-center gap-1.5 text-xs">
              Tipo de Pago <span className="text-destructive">*</span>
            </Label>
            <Select
              value={idTipoPago}
              onValueChange={(value) => setIdTipoPago(value)}
              disabled={readOnly}
            >
              <SelectTrigger id="tipo-pago">
                <SelectValue placeholder="Seleccionar tipo de pago" />
              </SelectTrigger>
              <SelectContent>
                {tiposPago.map((tipo) => (
                  <SelectItem key={tipo.id_tipo_pago} value={String(tipo.id_tipo_pago)}>
                    {tipo.forma_pago}{tipo.plazo ? ` (${tipo.plazo})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pago del Flete */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Pago del Flete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="space-y-1">
            <Label htmlFor="pago-flete" className="text-xs">Tipo de Pago del Flete</Label>
            <Select
              value={pagoFlete}
              onValueChange={(value) => setPagoFlete(value as PagoFlete)}
              disabled={readOnly}
            >
              <SelectTrigger id="pago-flete">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {PAGO_FLETE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones Financieras */}
      <div className="space-y-1">
        <Label htmlFor="observaciones-financieras" className="text-xs">Observaciones (Opcional)</Label>
        <Textarea
          id="observaciones-financieras"
          placeholder="Detalles del pago, referencia bancaria, notas adicionales..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
          disabled={readOnly}
        />
      </div>

      {/* Validación visual */}
      {!canAdvance && estadoValidacionPago && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se puede avanzar</AlertTitle>
          <AlertDescription>
            El estado de validación "{ESTADO_VALIDACION_OPTIONS.find(o => o.value === estadoValidacionPago)?.label}"
            no permite avanzar a Facturación. Debe ser "OK" o "N/A".
          </AlertDescription>
        </Alert>
      )}

      {!canSave && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campos Obligatorios</AlertTitle>
          <AlertDescription>
            Complete: Estado de validación, Medio de pago y Tipo de pago
          </AlertDescription>
        </Alert>
      )}

      {canAdvance && canSave && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Validación Completa</AlertTitle>
          <AlertDescription className="text-success-foreground/80">
            Información financiera registrada correctamente. Puede avanzar a Facturación.
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
});
