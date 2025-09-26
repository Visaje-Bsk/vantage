import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OrdenKanban } from "@/types/kanban";
import { Package, CheckCircle, AlertCircle, User, Calendar, Wifi, Smartphone, Save } from "lucide-react";

interface InventariosTabProps {
  order: OrdenKanban;
  onUpdateOrder: (orderId: number, updates: Partial<OrdenKanban>) => void;
}

export function InventariosTab({ order }: InventariosTabProps) {
  const [formData, setFormData] = useState({
    stockValidated: false,
    assignedResponsible: "",
    assignmentDate: "",
    technicalObservations: "",
    equipmentAssigned: "",
    serviceAssigned: "",
    simAssigned: "",
    planAssigned: "",
    apnAssigned: "",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" />
            Asignación de Inventarios y Servicios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Asignación de Equipos/Servicios */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Asignación de Equipos</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Equipos Asignados</Label>
                  <Input 
                    placeholder="Listar equipos asignados..."
                    value={formData.equipmentAssigned}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipmentAssigned: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Servicios Asignados</Label>
                  <Input 
                    placeholder="Servicios asociados..."
                    value={formData.serviceAssigned}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceAssigned: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Validación de Stock</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <CheckCircle className={`w-5 h-5 ${formData.stockValidated ? 'text-success' : 'text-muted-foreground'}`} />
                  <span className="text-sm">Disponibilidad Validada</span>
                  <Badge variant={formData.stockValidated ? "default" : "outline"} className="ml-auto">
                    {formData.stockValidated ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, stockValidated: !prev.stockValidated }))}
                >
                  {formData.stockValidated ? "Desmarcar" : "Validar Stock"}
                </Button>
              </div>
            </div>
          </div>

          {/* Asignación Técnica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Asignación Técnica SIM/Plan/APN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Wifi className="w-3 h-3" />
                    SIM Asignado
                  </Label>
                  <Input 
                    placeholder="Número de SIM"
                    value={formData.simAssigned}
                    onChange={(e) => setFormData(prev => ({ ...prev, simAssigned: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan Asignado</Label>
                  <Select value={formData.planAssigned} onValueChange={(value) => setFormData(prev => ({ ...prev, planAssigned: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Plan Básico</SelectItem>
                      <SelectItem value="premium">Plan Premium</SelectItem>
                      <SelectItem value="empresarial">Plan Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>APN Configurado</Label>
                  <Input 
                    placeholder="APN de conexión"
                    value={formData.apnAssigned}
                    onChange={(e) => setFormData(prev => ({ ...prev, apnAssigned: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsable y Fecha */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Responsable de Asignación
              </h4>
              <Select value={formData.assignedResponsible} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedResponsible: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inv1">Inventarios - Juan Pérez</SelectItem>
                  <SelectItem value="inv2">Inventarios - María García</SelectItem>
                  <SelectItem value="tec1">Técnico - Carlos Ruiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de Asignación
              </h4>
              <Input 
                type="datetime-local"
                value={formData.assignmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, assignmentDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Observaciones y Bitácora */}
          <div className="space-y-4">
            <h4 className="font-medium">Observaciones Técnicas y Estado</h4>
            <Textarea 
              placeholder="Observaciones sobre el estado técnico, configuraciones especiales, novedades..."
              rows={4}
              value={formData.technicalObservations}
              onChange={(e) => setFormData(prev => ({ ...prev, technicalObservations: e.target.value }))}
            />
          </div>

          {/* Bitácora de Cambios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bitácora de Cambios y Novedades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <strong>15/01/2024 10:30:</strong> Asignación inicial de inventario - Juan Pérez
                </div>
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <strong>15/01/2024 14:15:</strong> Validación de stock completada - María García
                </div>
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <strong>16/01/2024 09:00:</strong> Configuración SIM actualizada - Carlos Ruiz
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="default" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Guardar Asignación de Inventarios
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}