import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { OrdenKanban } from "@/types/kanban";
import { Truck, DollarSign, MapPin, CheckCircle } from "lucide-react";

interface LogisticaTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function LogisticaTab({ order }: LogisticaTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="w-5 h-5" />
            Gestión Logística
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-warning" />
              <span className="font-medium">Validación Crítica</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta orden no puede avanzar a Facturación sin confirmación de entrega
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Transportadora
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Empresa de Transporte</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar transportadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servientrega">Servientrega</SelectItem>
                      <SelectItem value="tcc">TCC</SelectItem>
                      <SelectItem value="coordinadora">Coordinadora</SelectItem>
                      <SelectItem value="deprisa">Deprisa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de Guía</Label>
                  <Input placeholder="Ingrese número de guía" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Costos de Envío
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Costo de Flete</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Flete</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagado">Flete Pagado</SelectItem>
                      <SelectItem value="contra_entrega">Contra Entrega</SelectItem>
                      <SelectItem value="por_cobrar">Por Cobrar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Estado de Entrega
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <Badge variant="outline" className="mb-2">Despachado</Badge>
                <p className="text-xs text-muted-foreground">15/01/2024</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Badge variant="outline" className="mb-2 text-warning bg-warning/10">En Tránsito</Badge>
                <p className="text-xs text-muted-foreground">16/01/2024</p>
              </div>
              <div className="p-3 border-dashed border rounded-lg text-center">
                <Badge variant="outline" className="mb-2 text-muted-foreground">Entregado</Badge>
                <p className="text-xs text-muted-foreground">Pendiente</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Dirección de Entrega</h4>
            <Textarea 
              placeholder="Dirección completa de entrega, incluyendo ciudad y código postal..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Observaciones de Logística</h4>
            <Textarea 
              placeholder="Instrucciones especiales de entrega, horarios, contactos..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}