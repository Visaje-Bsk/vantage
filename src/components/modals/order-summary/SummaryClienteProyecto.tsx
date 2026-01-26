import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Briefcase, User } from "lucide-react";

interface SummaryClienteProyectoProps {
  clienteNombre: string | null;
  clienteNit: string | null;
  proyectoNombre: string | null;
  comercialNombre: string | null;
  tipoServicio: string | null;
}

export function SummaryClienteProyecto({
  clienteNombre,
  clienteNit,
  proyectoNombre,
  comercialNombre,
  tipoServicio,
}: SummaryClienteProyectoProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Cliente y Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{clienteNombre || 'No especificado'}</p>
              {clienteNit && (
                <p className="text-xs text-muted-foreground">NIT: {clienteNit}</p>
              )}
            </div>
            {proyectoNombre && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Proyecto
                </p>
                <p className="font-medium">{proyectoNombre}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {comercialNombre && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Comercial
                </p>
                <p className="font-medium">{comercialNombre}</p>
              </div>
            )}
            {tipoServicio && (
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Servicio</p>
                <p className="font-medium">{tipoServicio}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
