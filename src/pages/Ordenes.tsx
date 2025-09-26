import React from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { OrdenKanban } from '@/types/kanban';

const Capitalize = <T extends string>(str: T): Capitalize<T> => {
  return str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
}

const Ordenes: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1  className="text-3xl font-bold text-foreground">Ordenes</h1>
          <p className="text-muted-foreground">
            Bienvenido, {currentUserProfile?.nombre}
            {currentUserProfile && (
              <Badge variant="default" className="ml-2">
                {Capitalize(currentUserProfile.role)}
              </Badge>
            )}
          </p>
        </div>
      </div>


      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Gestion de Ordenes de Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KanbanBoard onOrderClick={(order: OrdenKanban) => {}} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Ordenes;
