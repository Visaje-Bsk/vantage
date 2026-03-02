import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Columns3, Rows3, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatusFilterValue } from '@/components/kanban/StatusFilter';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

export type ViewMode = 'columns' | 'rows' | 'list';

const Ordenes: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [isNuevaOrdenModalOpen, setIsNuevaOrdenModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('columns');

  // Capturar el ID de orden a abrir desde navigation state (ej: duplicación desde historial)
  // Se usa useRef para consumirlo una sola vez y evitar race conditions con navigate replace
  const pendingOpenOrderId = useRef<number | null>(
    (location.state as { openOrderId?: number } | null)?.openOrderId ?? null
  );
  const [openOrderId] = useState(() => pendingOpenOrderId.current);

  // Limpiar el state del historial para evitar re-apertura en refresh
  useEffect(() => {
    if (pendingOpenOrderId.current) {
      pendingOpenOrderId.current = null;
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [navigate, location.pathname]);

  const canCreateOrders = currentUserProfile?.role === 'comercial' || currentUserProfile?.role === 'admin';

  return (
    <div className="flex flex-col h-screen">
      {/* Header oscuro estilo Acme Inc. */}
      <div className="flex-none border-b border-border/40 bg-card/60 backdrop-blur-sm px-6 py-3.5 shadow-md">
        <div className="flex items-center gap-4">
          {/* Botón toggle sidebar */}
          <SidebarTrigger className="h-8 w-8 flex-shrink-0" />

          {/* Barra de búsqueda y navegación estilo tabs */}
          <div className="flex-1 flex items-center gap-3">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Buscar por consecutivo, cliente, proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/30 border-border/40 text-sm h-9 placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Selector de Estado */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterValue)}>
              <SelectTrigger className="w-[130px] bg-muted/30 border-border/40 h-9 text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="facturada">Facturada</SelectItem>
                <SelectItem value="cerrada">Cerrada</SelectItem>
                <SelectItem value="anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>

            {/* Selector de disposición */}
            <div className="flex items-center gap-0.5 bg-muted/30 border border-border/40 rounded-md p-0.5 h-9">
              <button
                onClick={() => setViewMode('columns')}
                className={cn(
                  "flex items-center justify-center w-8 h-7 rounded transition-all",
                  viewMode === 'columns'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Vista columnas"
              >
                <Columns3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('rows')}
                className={cn(
                  "flex items-center justify-center w-8 h-7 rounded transition-all",
                  viewMode === 'rows'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Vista filas"
              >
                <Rows3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center justify-center w-8 h-7 rounded transition-all",
                  viewMode === 'list'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Vista lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Botón Nueva Orden con estilo corporativo */}
          {canCreateOrders && (
            <Button
              onClick={() => setIsNuevaOrdenModalOpen(true)}
              className="flex items-center gap-2 whitespace-nowrap bg-success hover:bg-success/90 text-success-foreground h-9 px-4"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Orden
            </Button>
          )}
        </div>
      </div>

      {/* Contenedor del Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          onOrderClick={() => {}}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          isNuevaOrdenModalOpen={isNuevaOrdenModalOpen}
          onNuevaOrdenModalChange={setIsNuevaOrdenModalOpen}
          openOrderId={openOrderId}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default Ordenes;
