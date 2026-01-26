import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, FileText } from "lucide-react";
import type { OrderSummaryData } from "@/hooks/useOrderSummary";

interface SummaryFacturacionProps {
  facturas: OrderSummaryData['facturas'];
  remision: OrderSummaryData['remision'];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getTipoFacturaLabel(tipo: string | null): string {
  if (!tipo) return 'General';
  const tipos: Record<string, string> = {
    'equipos': 'Equipos',
    'servicio': 'Servicio',
    'flete': 'Flete',
  };
  return tipos[tipo] || tipo;
}

function getEstadoFacturaBadge(estado: string | null) {
  if (!estado) return null;
  const estados: Record<string, { label: string; color: string }> = {
    'pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    'emitida': { label: 'Emitida', color: 'bg-blue-100 text-blue-800' },
    'pagada': { label: 'Pagada', color: 'bg-green-100 text-green-800' },
    'anulada': { label: 'Anulada', color: 'bg-red-100 text-red-800' },
  };
  const meta = estados[estado] || { label: estado, color: 'bg-gray-100 text-gray-800' };
  return <Badge className={meta.color}>{meta.label}</Badge>;
}

function getEstadoRemisionBadge(estado: string | null) {
  if (!estado) return null;
  const estados: Record<string, { label: string; color: string }> = {
    'pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    'generada': { label: 'Generada', color: 'bg-blue-100 text-blue-800' },
    'entregada': { label: 'Entregada', color: 'bg-green-100 text-green-800' },
    'anulada': { label: 'Anulada', color: 'bg-red-100 text-red-800' },
  };
  const meta = estados[estado] || { label: estado, color: 'bg-gray-100 text-gray-800' };
  return <Badge className={meta.color}>{meta.label}</Badge>;
}

export function SummaryFacturacion({ facturas, remision }: SummaryFacturacionProps) {
  const hasFacturas = facturas && facturas.length > 0;
  const hasRemision = remision && remision.numero_remision;

  if (!hasFacturas && !hasRemision) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Facturación
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          No hay información de facturación registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Facturación
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Facturas */}
        {hasFacturas && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Moneda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.map((factura) => (
                <TableRow key={factura.id_factura}>
                  <TableCell className="font-mono font-medium">
                    {factura.numero_factura || 'Sin número'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTipoFacturaLabel(factura.tipo_factura)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(factura.fecha_factura)}
                  </TableCell>
                  <TableCell>
                    {getEstadoFacturaBadge(factura.estado_factura)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {factura.moneda_base || 'COP'}
                    {factura.trm_aplicada && ` (TRM: ${factura.trm_aplicada})`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Remisión */}
        {hasRemision && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Remisión</p>
              <p className="font-mono font-medium">{remision.numero_remision}</p>
            </div>
            {remision.estado_remision && (
              <div>
                {getEstadoRemisionBadge(remision.estado_remision)}
              </div>
            )}
            {remision.fecha_remision && (
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-sm">{formatDate(remision.fecha_remision)}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
