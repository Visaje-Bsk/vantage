/**
 * ServiceLineItem
 *
 * Componente memoizado para renderizar una línea de servicio.
 * Optimizado para evitar re-renders innecesarios cuando cambian otras líneas.
 */

import { memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Check, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import type { ServiceLine } from "@/hooks/comercial/useServiceLines";
import type { Database } from "@/integrations/supabase/types";

type OperadorRow = Database["public"]["Tables"]["operador"]["Row"];
type PlanRow = Database["public"]["Tables"]["plan"]["Row"];
type ApnRow = Database["public"]["Tables"]["apn"]["Row"];
type ClaseCobro = Database["public"]["Enums"]["clase_cobro"];

interface ServiceLineItemProps {
  line: ServiceLine;
  operadores: OperadorRow[];
  planesFiltrados: PlanRow[];
  apnsFiltrados: ApnRow[];
  onUpdate: (id: number, field: keyof ServiceLine, value: unknown) => void;
  onRemove: (id: number) => void;
  onConfirm: (id: number) => boolean;
  onUnconfirm: (id: number) => void;
  canConfirm: boolean;
  canRemove: boolean;
  formatCOP: (value: string | number) => string;
  onPermanenciaChange: (id: number, value: string) => void;
}

function ServiceLineItemComponent({
  line,
  operadores,
  planesFiltrados,
  apnsFiltrados,
  onUpdate,
  onRemove,
  onConfirm,
  onUnconfirm,
  canConfirm,
  canRemove,
  formatCOP,
  onPermanenciaChange,
}: ServiceLineItemProps) {
  // Handlers memoizados
  const handleOperadorChange = useCallback(
    (value: string) => {
      onUpdate(line.id_linea_detalle, "operadorId", value);
      // Limpiar plan y APN cuando cambia el operador
      onUpdate(line.id_linea_detalle, "planId", "");
      onUpdate(line.id_linea_detalle, "apnId", "");
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handlePlanChange = useCallback(
    (value: string) => {
      onUpdate(line.id_linea_detalle, "planId", value);
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handleApnChange = useCallback(
    (value: string) => {
      onUpdate(line.id_linea_detalle, "apnId", value);
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handleClaseCobroChange = useCallback(
    (value: string) => {
      onUpdate(line.id_linea_detalle, "claseCobro", value as ClaseCobro);
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handleValorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/[^0-9]/g, "");
      onUpdate(line.id_linea_detalle, "valorMensual", digits);
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handleCantidadChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/[^0-9]/g, "");
      onUpdate(line.id_linea_detalle, "cantidadLineas", digits);
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handlePermanencia = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPermanenciaChange(line.id_linea_detalle, e.target.value);
    },
    [line.id_linea_detalle, onPermanenciaChange]
  );

  const handleEsBackupChange = useCallback(
    (checked: boolean) => {
      onUpdate(line.id_linea_detalle, "esBackup", checked);
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handleConfirm = useCallback(() => {
    onConfirm(line.id_linea_detalle);
  }, [line.id_linea_detalle, onConfirm]);

  const handleUnconfirm = useCallback(() => {
    onUnconfirm(line.id_linea_detalle);
  }, [line.id_linea_detalle, onUnconfirm]);

  const handleRemove = useCallback(() => {
    onRemove(line.id_linea_detalle);
  }, [line.id_linea_detalle, onRemove]);

  // Opciones memoizadas para SearchableSelect
  const operadorOptions = useMemo(() =>
    operadores.map(op => ({ value: op.id_operador.toString(), label: op.nombre_operador })),
    [operadores]
  );
  const planOptions = useMemo(() =>
    planesFiltrados.map(p => ({ value: p.id_plan.toString(), label: p.nombre_plan })),
    [planesFiltrados]
  );
  const apnOptions = useMemo(() =>
    apnsFiltrados.map(a => ({ value: a.id_apn.toString(), label: a.apn })),
    [apnsFiltrados]
  );

  // Obtener nombres para mostrar en modo confirmado
  const operadorNombre = operadores.find(
    (op) => op.id_operador.toString() === line.operadorId
  )?.nombre_operador;
  const planNombre = planesFiltrados.find(
    (p) => p.id_plan.toString() === line.planId
  )?.nombre_plan;
  const apnNombre = apnsFiltrados.find(
    (a) => a.id_apn.toString() === line.apnId
  )?.apn;

  // Vista de línea confirmada
  if (line.isConfirmed) {
    return (
      <div className={`p-4 rounded-lg border-2 transition-all ${line.esBackup ? "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700" : "bg-blue-50 border-blue-300 dark:bg-blue-950/20 dark:border-blue-800"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${line.esBackup ? "text-amber-600" : "text-blue-600"}`} />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Operador:</span>{" "}
                <span className="font-semibold">{operadorNombre || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Plan:</span>{" "}
                <span>{planNombre || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">APN:</span>{" "}
                <span>{apnNombre || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Valor:</span>{" "}
                <span className="font-semibold">{formatCOP(line.valorMensual)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
            {line.esBackup && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                BACKUP
              </span>
            )}
            <span>{line.cantidadLineas || "0"} líneas</span>
            <span>•</span>
            <span>{line.permanencia} meses</span>
            <span>•</span>
            <span>{line.claseCobro}</span>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUnconfirm}
              title="Editar línea"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={!canRemove}
              title="Eliminar línea"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de edición
  return (
    <div className="p-4 rounded-lg border-2 transition-all bg-muted/30 border-muted">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Operador */}
          <div className="space-y-2">
            <Label>
              Operador <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              options={operadorOptions}
              value={line.operadorId}
              onValueChange={handleOperadorChange}
              placeholder="Seleccionar operador"
              searchPlaceholder="Buscar operador..."
              emptyMessage="No se encontraron operadores"
            />
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <Label>
              Plan <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              options={planOptions}
              value={line.planId}
              onValueChange={handlePlanChange}
              placeholder="Seleccionar plan"
              searchPlaceholder="Buscar plan..."
              disabled={!line.operadorId}
              emptyMessage="No se encontraron planes"
            />
          </div>

          {/* APN */}
          <div className="space-y-2">
            <Label>
              APN <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              options={apnOptions}
              value={line.apnId}
              onValueChange={handleApnChange}
              placeholder="Seleccionar APN"
              searchPlaceholder="Buscar APN..."
              disabled={!line.operadorId}
              emptyMessage="No se encontraron APNs"
            />
          </div>

          {/* Clase de Cobro */}
          <div className="space-y-2">
            <Label>
              Clase de Cobro <span className="text-red-500">*</span>
            </Label>
            <Select value={line.claseCobro} onValueChange={handleClaseCobroChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Valor Mensual, Cantidad de Líneas, Permanencia y Botones */}
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-6 md:col-span-3 space-y-2">
            <Label>
              Valor Mensual <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="$0"
              value={formatCOP(line.valorMensual)}
              onChange={handleValorChange}
            />
          </div>
          <div className="col-span-6 md:col-span-2 space-y-2">
            <Label>Cantidad de Líneas</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={line.cantidadLineas}
              onChange={handleCantidadChange}
            />
          </div>
          <div className="col-span-6 md:col-span-2 space-y-2">
            <Label>
              Permanencia <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              max={36}
              placeholder="1-36"
              value={line.permanencia}
              onChange={handlePermanencia}
            />
          </div>
          <div className="col-span-6 md:col-span-5 flex gap-2 justify-end items-end">
            <div className="flex items-center gap-2 mr-2">
              <Switch
                id={`backup-${line.id_linea_detalle}`}
                checked={line.esBackup}
                onCheckedChange={handleEsBackupChange}
              />
              <Label htmlFor={`backup-${line.id_linea_detalle}`} className="text-sm cursor-pointer">
                Backup
              </Label>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="bg-blue-600 hover:bg-blue-700"
              title="Confirmar línea"
            >
              <Check className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                title="Eliminar línea"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Comparador custom para evitar re-renders innecesarios
function arePropsEqual(
  prevProps: ServiceLineItemProps,
  nextProps: ServiceLineItemProps
): boolean {
  const prev = prevProps.line;
  const next = nextProps.line;

  // Comparar campos relevantes de la línea
  if (prev.id_linea_detalle !== next.id_linea_detalle) return false;
  if (prev.operadorId !== next.operadorId) return false;
  if (prev.planId !== next.planId) return false;
  if (prev.apnId !== next.apnId) return false;
  if (prev.permanencia !== next.permanencia) return false;
  if (prev.claseCobro !== next.claseCobro) return false;
  if (prev.valorMensual !== next.valorMensual) return false;
  if (prev.cantidadLineas !== next.cantidadLineas) return false;
  if (prev.esBackup !== next.esBackup) return false;
  if (prev.isConfirmed !== next.isConfirmed) return false;

  // Comparar props de estado
  if (prevProps.canConfirm !== nextProps.canConfirm) return false;
  if (prevProps.canRemove !== nextProps.canRemove) return false;

  // Comparar catálogos filtrados (solo longitud, asumiendo que si el operador no cambió, los filtrados tampoco)
  if (prevProps.planesFiltrados.length !== nextProps.planesFiltrados.length) return false;
  if (prevProps.apnsFiltrados.length !== nextProps.apnsFiltrados.length) return false;

  return true;
}

export const ServiceLineItem = memo(ServiceLineItemComponent, arePropsEqual);
