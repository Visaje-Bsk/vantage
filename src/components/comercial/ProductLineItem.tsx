/**
 * ProductLineItem
 *
 * Componente memoizado para renderizar una línea de producto/equipo.
 * Optimizado para evitar re-renders innecesarios cuando cambian otras líneas.
 *
 * Usa React.memo con comparador custom para solo re-renderizar cuando
 * los datos relevantes de esta línea específica cambian.
 */

import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import EquipoSelector, { type EquipoOption } from "@/components/catalogs/EquipoSelector";
import type { ProductLine } from "@/hooks/comercial/useProductLines";

interface ProductLineItemProps {
  line: ProductLine;
  onUpdate: (id: number, field: keyof ProductLine, value: unknown) => void;
  onRemove: (id: number) => void;
  onConfirm: (id: number) => boolean;
  onUnconfirm: (id: number) => void;
  canConfirm: boolean;
  canRemove: boolean;
  quantityError?: string;
  formatCOP: (value: string | number) => string;
  digitsOnly: (value: string) => string;
  onQuantityChange: (id: number, value: string) => void;
}

function ProductLineItemComponent({
  line,
  onUpdate,
  onRemove,
  onConfirm,
  onUnconfirm,
  canConfirm,
  canRemove,
  quantityError,
  formatCOP,
  digitsOnly,
  onQuantityChange,
}: ProductLineItemProps) {
  // Handlers memoizados
  const handleEquipoChange = useCallback(
    (val: EquipoOption | null) => {
      onUpdate(line.id_linea_detalle, "selectedEquipo", val);
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onQuantityChange(line.id_linea_detalle, e.target.value);
    },
    [line.id_linea_detalle, onQuantityChange]
  );

  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = digitsOnly(e.target.value);
      onUpdate(line.id_linea_detalle, "valorUnitario", digits);
    },
    [line.id_linea_detalle, onUpdate, digitsOnly]
  );

  const handlePlantillaChange = useCallback(
    (checked: boolean | "indeterminate") => {
      onUpdate(line.id_linea_detalle, "plantilla", checked === true);
    },
    [line.id_linea_detalle, onUpdate]
  );

  const handlePlantillaTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(line.id_linea_detalle, "plantillaText", e.target.value);
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

  // Vista de equipo confirmado
  if (line.isConfirmed) {
    return (
      <div className="p-4 rounded-lg border-2 transition-all bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Equipo:</span>{" "}
                <span className="font-semibold">
                  {line.selectedEquipo?.nombre_equipo || line.selectedEquipo?.codigo}
                </span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Código:</span>{" "}
                <span>{line.selectedEquipo?.codigo || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Cantidad:</span>{" "}
                <span className="font-semibold">{line.cantidad}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Valor:</span>{" "}
                <span className="font-semibold">{formatCOP(line.valorUnitario)}</span>
              </div>
            </div>
            {line.plantilla && line.plantillaText && (
              <div className="text-xs text-muted-foreground border-l pl-2">
                Plantilla: {line.plantillaText}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUnconfirm}
              title="Editar equipo"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={!canRemove}
              title="Eliminar equipo"
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
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-12 md:col-span-5 space-y-2">
            <Label>
              Equipos <span className="text-red-500">*</span>
            </Label>
            <EquipoSelector
              value={line.selectedEquipo}
              onChange={handleEquipoChange}
              placeholder="Buscar por código o nombre..."
            />
          </div>
          <div className="col-span-5 md:col-span-2 space-y-2">
            <Label>
              Cantidad <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={line.cantidad}
              onChange={handleQuantityChange}
              className={quantityError ? "border-red-300" : ""}
            />
            {quantityError && <p className="text-xs text-red-500">{quantityError}</p>}
          </div>
          <div className="col-span-5 md:col-span-2 space-y-2">
            <Label>
              Valor Unitario <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="$0"
              value={formatCOP(line.valorUnitario)}
              onChange={handleValueChange}
            />
          </div>
          <div className="col-span-2 md:col-span-3 flex gap-2 justify-end">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="bg-green-600 hover:bg-green-700"
              title="Confirmar equipo"
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

        {/* Plantilla section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`plantilla-${line.id_linea_detalle}`}
              checked={line.plantilla}
              onCheckedChange={handlePlantillaChange}
            />
            <Label htmlFor={`plantilla-${line.id_linea_detalle}`}>Plantilla</Label>
          </div>
          {line.plantilla && (
            <Input
              type="text"
              placeholder="Información de plantilla..."
              value={line.plantillaText}
              onChange={handlePlantillaTextChange}
              className="flex-1"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Comparador custom para evitar re-renders innecesarios
function arePropsEqual(prevProps: ProductLineItemProps, nextProps: ProductLineItemProps): boolean {
  const prev = prevProps.line;
  const next = nextProps.line;

  // Comparar campos relevantes de la línea
  if (prev.id_linea_detalle !== next.id_linea_detalle) return false;
  if (prev.selectedEquipo?.id_equipo !== next.selectedEquipo?.id_equipo) return false;
  if (prev.cantidad !== next.cantidad) return false;
  if (prev.valorUnitario !== next.valorUnitario) return false;
  if (prev.isConfirmed !== next.isConfirmed) return false;
  if (prev.plantilla !== next.plantilla) return false;
  if (prev.plantillaText !== next.plantillaText) return false;

  // Comparar props de estado
  if (prevProps.canConfirm !== nextProps.canConfirm) return false;
  if (prevProps.canRemove !== nextProps.canRemove) return false;
  if (prevProps.quantityError !== nextProps.quantityError) return false;

  return true;
}

export const ProductLineItem = memo(ProductLineItemComponent, arePropsEqual);
