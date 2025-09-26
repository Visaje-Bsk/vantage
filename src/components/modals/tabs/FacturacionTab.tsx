import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrdenKanban } from "@/types/kanban";
import { Receipt, Plus, DollarSign, FileText, AlertTriangle } from "lucide-react";

interface FacturacionTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function FacturacionTab({ order }: FacturacionTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5" />
            Gestión de Facturación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <span className="font-medium">Validación de Consistencia</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Validar que los conceptos de facturación sean consistentes con el tipo de orden
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Facturas Generadas</h4>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Factura de Equipos</span>
                  </div>
                  <Badge className="bg-success">Generada</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Número:</span>
                    <p className="font-medium">FE-2024-001234</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <p className="font-medium">$2,450,000</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha:</span>
                    <p className="font-medium">15/01/2024</p>
                  </div>
                </div>
              </div>

              <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Factura de Servicios - Pendiente</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Tipos de Facturación</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Equipos</span>
                  <Badge className="bg-success">Completado</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Servicios</span>
                  <Badge variant="outline" className="text-warning bg-warning/10">Pendiente</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Reemplazos</span>
                  <Badge variant="outline" className="text-muted-foreground">No Aplica</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Fletes</span>
                  <Badge variant="outline" className="text-warning bg-warning/10">Pendiente</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Configuración de Factura
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Forma de Pago</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar forma de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contado">Contado</SelectItem>
                      <SelectItem value="credito_30">Crédito 30 días</SelectItem>
                      <SelectItem value="credito_60">Crédito 60 días</SelectItem>
                      <SelectItem value="credito_90">Crédito 90 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Resumen de Valores</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-semibold">$2,068,965</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">IVA (19%)</p>
                <p className="font-semibold">$393,103</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Descuentos</p>
                <p className="font-semibold">$12,068</p>
              </div>
              <div className="p-3 bg-primary text-primary-foreground rounded-lg text-center">
                <p className="text-sm opacity-90">Total</p>
                <p className="font-bold">$2,450,000</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}