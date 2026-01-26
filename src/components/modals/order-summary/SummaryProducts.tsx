import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Radio } from "lucide-react";
import type { OrderSummaryData } from "@/hooks/useOrderSummary";

interface SummaryProductsProps {
  detalles: OrderSummaryData['detalles'];
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function SummaryProducts({ detalles }: SummaryProductsProps) {
  // Separar equipos y líneas de servicio
  const equipos = detalles.filter(d => d.equipo !== null);
  const servicios = detalles.filter(d => d.linea_servicio !== null);

  // Calcular totales
  const totalEquipos = equipos.reduce((acc, item) => {
    const cantidad = item.cantidad || 0;
    const valorUnitario = item.valor_unitario || 0;
    return acc + (cantidad * valorUnitario);
  }, 0);

  const totalServicios = servicios.reduce((acc, item) => {
    const cantidad = item.linea_servicio?.cantidad_linea || 1;
    const valorUnitario = item.valor_unitario || 0;
    return acc + (cantidad * valorUnitario);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Equipos */}
      {equipos.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Equipos ({equipos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">V. Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipos.map((item) => (
                  <TableRow key={item.id_orden_detalle}>
                    <TableCell className="font-medium">
                      {item.equipo?.nombre_equipo || 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.equipo?.codigo || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.cantidad || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.valor_unitario)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency((item.cantidad || 0) * (item.valor_unitario || 0))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Subtotal Equipos:
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalEquipos)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Líneas de Servicio */}
      {servicios.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Líneas de Servicio ({servicios.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>APN</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">V. Mensual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicios.map((item) => (
                  <TableRow key={item.id_orden_detalle}>
                    <TableCell className="font-medium">
                      {item.linea_servicio?.operador?.nombre_operador || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.linea_servicio?.plan?.nombre_plan || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.linea_servicio?.apn?.nombre_apn || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.linea_servicio?.cantidad_linea || 1}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.valor_unitario)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Subtotal Servicios:
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalServicios)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Total General */}
      {(equipos.length > 0 || servicios.length > 0) && (
        <div className="flex justify-end">
          <div className="bg-primary/10 rounded-lg px-6 py-3">
            <span className="text-sm font-medium text-muted-foreground mr-4">
              Total General:
            </span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(totalEquipos + totalServicios)}
            </span>
          </div>
        </div>
      )}

      {/* Mensaje si no hay productos */}
      {equipos.length === 0 && servicios.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay productos o servicios registrados en esta orden
          </CardContent>
        </Card>
      )}
    </div>
  );
}
