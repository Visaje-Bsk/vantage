import React, { useState } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatusFilter, StatusFilterValue } from '@/components/kanban/StatusFilter';

const Ordenes: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [isNuevaOrdenModalOpen, setIsNuevaOrdenModalOpen] = useState(false);

  const canCreateOrders = currentUserProfile?.role === 'comercial' || currentUserProfile?.role === 'admin';

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header fijo con búsqueda y filtros - centrado */}
      <div className="flex-none border-b bg-background px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Título */}
          <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">
            Órdenes de Pedido
          </h1>

          {/* Barra de búsqueda con filtros integrados dentro */}
          <div className="flex-1 max-w-3xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Buscar por consecutivo, cliente o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-[220px]"
            />
            {/* Filtro de estado dentro del input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <StatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
          </div>

          {/* Botón Nueva Orden - a la derecha */}
          {canCreateOrders && (
            <Button
              onClick={() => setIsNuevaOrdenModalOpen(true)}
              className="flex items-center gap-2 whitespace-nowrap"
              size="default"
            >
              <Plus className="w-4 h-4" />
              Nueva Orden
            </Button>
          )}
        </div>
      </div>

      {/* Contenedor del Kanban Board */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <KanbanBoard
          onOrderClick={() => {}}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          isNuevaOrdenModalOpen={isNuevaOrdenModalOpen}
          onNuevaOrdenModalChange={setIsNuevaOrdenModalOpen}
        />
      </div>
    </div>
  );
};

export default Ordenes;
