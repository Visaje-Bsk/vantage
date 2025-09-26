import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

interface Operador {
  id_operador: number;
  nombre_operador: string;
}

export function OperadorCatalog() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Operador | null>(null);
  const [formData, setFormData] = useState({
    nombre_operador: ''
  });

  const fetchOperadores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('operador')
        .select('*')
        .order('nombre_operador');

      if (error) {
        console.error('Error fetching operadores:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los operadores",
          variant: "destructive",
        });
        return;
      }

      setOperadores(data || []);
    } catch (error) {
      console.error('Error fetching operadores:', error);
      toast({
        title: "Error",
        description: "Error al cargar los operadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperadores();
  }, []);

  const handleSubmit = async () => {
    if (!formData.nombre_operador.trim()) {
      toast({
        title: "Error",
        description: "El nombre del operador es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('operador')
          .update({
            nombre_operador: formData.nombre_operador.trim()
          })
          .eq('id_operador', editingItem.id_operador);

        if (error) {
          console.error('Error updating operador:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el operador",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Operador actualizado",
          description: "El operador se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('operador')
          .insert({
            nombre_operador: formData.nombre_operador.trim()
          });

        if (error) {
          console.error('Error creating operador:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el operador",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Operador creado",
          description: "El operador se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ nombre_operador: '' });
      fetchOperadores();
    } catch (error) {
      console.error('Error saving operador:', error);
      toast({
        title: "Error",
        description: "Error al guardar el operador",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (operador: Operador) => {
    setEditingItem(operador);
    setFormData({
      nombre_operador: operador.nombre_operador
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('operador')
        .delete()
        .eq('id_operador', id);

      if (error) {
        console.error('Error deleting operador:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el operador",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Operador eliminado",
        description: "El operador se eliminó correctamente",
      });

      fetchOperadores();
    } catch (error) {
      console.error('Error deleting operador:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el operador",
        variant: "destructive",
      });
    }
  };

  const filteredOperadores = operadores.filter(operador =>
    operador.nombre_operador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar operadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ nombre_operador: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Operador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Operador' : 'Nuevo Operador'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información del operador' : 'Completa la información del nuevo operador'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_operador">Nombre del Operador</Label>
                <Input
                  id="nombre_operador"
                  value={formData.nombre_operador}
                  onChange={(e) => setFormData({ ...formData, nombre_operador: e.target.value })}
                  placeholder="Claro, Movistar, Tigo..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operadores ({filteredOperadores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Operador</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperadores.map((operador) => (
                  <TableRow key={operador.id_operador}>
                    <TableCell>{operador.nombre_operador}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(operador)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar operador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              el operador "{operador.nombre_operador}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(operador.id_operador)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOperadores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No se encontraron operadores
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}