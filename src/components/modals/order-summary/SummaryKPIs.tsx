import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Timer } from "lucide-react";

interface SummaryKPIsProps {
  fechaCreacion: string | null;
  fechaCierre: string | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calcularDuracion(fechaInicio: string | null, fechaFin: string | null): string {
  if (!fechaInicio || !fechaFin) return 'N/A';

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diffTime = Math.abs(fin.getTime() - inicio.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Mismo día';
  if (diffDays === 1) return '1 día';
  return `${diffDays} días`;
}

export function SummaryKPIs({ fechaCreacion, fechaCierre }: SummaryKPIsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Creada</p>
              <p className="text-sm font-bold text-blue-700">
                {formatDate(fechaCreacion)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cerrada</p>
              <p className="text-sm font-bold text-green-700">
                {formatDate(fechaCierre)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Timer className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Duración</p>
              <p className="text-sm font-bold text-purple-700">
                {calcularDuracion(fechaCreacion, fechaCierre)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
