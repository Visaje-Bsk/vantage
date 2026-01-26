import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { STAGE_UI, estatusBadge, type FaseOrdenDB, type EstatusOrdenDB } from "@/types/kanban";

interface SummaryHeaderProps {
  consecutivo: string | number | null;
  estatus: EstatusOrdenDB;
  fase: FaseOrdenDB;
  clienteNombre: string | null;
}

export function SummaryHeader({ consecutivo, estatus, fase, clienteNombre }: SummaryHeaderProps) {
  const stageMeta = STAGE_UI[fase as keyof typeof STAGE_UI] || STAGE_UI.comercial;
  const statusMeta = estatusBadge[estatus] || estatusBadge.borrador;

  return (
    <div className={`${stageMeta.bgColor} border-l-4 ${stageMeta.borderColor} rounded-lg p-6 pr-14`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background rounded-lg shadow-sm">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              Orden #{consecutivo || 'N/A'}
            </h2>
            {clienteNombre && (
              <p className="text-sm text-muted-foreground mt-1">
                {clienteNombre}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge className={`${statusMeta.color} font-semibold px-3 py-1`}>
            {statusMeta.label}
          </Badge>
          <Badge className={`${stageMeta.color} font-semibold px-3 py-1`}>
            {stageMeta.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}
