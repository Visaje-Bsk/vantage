import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrdenKanban } from "@/types/kanban";
import { Building2, Clock, RotateCcw, Zap } from "lucide-react";

interface ProduccionTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function ProduccionTab({ order }: ProduccionTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Gestión de Producción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tiempos de Proceso
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Fecha/Hora de Ingreso</Label>
                  <Input type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label>Fecha/Hora de Salida</Label>
                  <Input type="datetime-local" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Orden de Producción (OP)</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Número de OP</Label>
                  <Input placeholder="OP-2024-XXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Estado de Producción</Label>
                  <Input placeholder="En proceso" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Devoluciones
            </h4>
            <Textarea 
              placeholder="Registrar devoluciones o rechazos..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Activaciones
            </h4>
            <Textarea 
              placeholder="Registro de activaciones de servicios o equipos..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Observaciones de Producción</h4>
            <Textarea 
              placeholder="Observaciones técnicas, incidencias, notas especiales..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}