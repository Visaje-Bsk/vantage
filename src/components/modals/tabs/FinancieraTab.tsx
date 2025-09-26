import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { OrdenKanban } from "@/types/kanban";
import { CreditCard, DollarSign, CheckCircle, AlertCircle, FileCheck } from "lucide-react";

interface FinancieraTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function FinancieraTab({ order }: FinancieraTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5" />
            Gestión Financiera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-success/10 p-4 rounded-lg border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-5 h-5 text-success" />
              <span className="font-medium">Etapa Final</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Completar pago, cupo y medio de pago para cerrar la orden
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Estado de Pago
              </h4>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Factura FE-2024-001234</span>
                    <Badge className="bg-success">Pagado</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor:</span>
                      <p className="font-medium">$2,450,000</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha Pago:</span>
                      <p className="font-medium">18/01/2024</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-dashed rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Factura FS-2024-001235</span>
                    <Badge variant="outline" className="text-warning bg-warning/10">Pendiente</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor:</span>
                      <p className="font-medium">$850,000</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vencimiento:</span>
                      <p className="font-medium text-warning">25/01/2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Análisis de Cupo</h4>
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cupo Autorizado:</span>
                      <p className="font-semibold text-success">$5,000,000</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cupo Utilizado:</span>
                      <p className="font-semibold">$3,200,000</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cupo Disponible:</span>
                      <p className="font-semibold text-primary">$1,800,000</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Esta Orden:</span>
                      <p className="font-semibold">$850,000</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm text-success font-medium">Cupo Suficiente</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Configuración de Pago</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Medio de Pago</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar medio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número de Referencia</Label>
                <Input placeholder="Ref. pago o cheque" />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Pago</Label>
                <Input type="date" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Observaciones Financieras</h4>
            <Textarea 
              placeholder="Observaciones sobre pagos, condiciones especiales, acuerdos..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-primary rounded-lg text-primary-foreground">
            <div>
              <p className="font-medium">Estado Final de la Orden</p>
              <p className="text-sm opacity-90">Todos los pagos procesados y orden lista para cierre</p>
            </div>
            <Button variant="secondary" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Cerrar Orden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}