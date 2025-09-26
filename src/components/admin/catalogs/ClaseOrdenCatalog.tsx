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

interface ClaseOrden {
  id_clase_orden: number;
  tipo_orden: string;
}

export function ClaseOrdenCatalog() {
  const [clasesOrden, setClasesOrden] = useState<ClaseOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClaseOrden | null>(null);
  const [formData, setFormData] = useState({
    tipo_orden: ''
  });

  const fetchClasesOrden = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('claseorden')
        .select('*')
        .order('tipo_orden');

      if (error) {
        console.error('Error fetching clases orden:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las clases de orden",
          variant: "destructive",
        });
        return;
      }

      setClasesOrden(data || []);
    } catch (error) {
      console.error('Error fetching clases orden:', error);
      toast({
        title: "Error",
        description: "Error al cargar las clases de orden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasesOrden();
  }, []);

  const handleSubmit = async () => {
    if (!formData.tipo_orden.trim()) {
      toast({
        title: "Error",
        description: "El tipo de orden es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('claseorden')
          .update({
            tipo_orden: formData.tipo_orden.trim()
          })
          .eq('id_clase_orden', editingItem.id_clase_orden);

        if (error) {
          console.error('Error updating clase orden:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar la clase de orden",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Clase de orden actualizada",
          description: "La clase de orden se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('claseorden')
          .insert({
            tipo_orden: formData.tipo_orden.trim()
          });

        if (error) {
          console.error('Error creating clase orden:', error);
          toast({
            title: "Error",
            description: "No se pudo crear la clase de orden",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Clase de orden creada",
          description: "La clase de orden se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ tipo_orden: '' });
      fetchClasesOrden();
    } catch (error) {
      console.error('Error saving clase orden:', error);
      toast({
        title: "Error",
        description: "Error al guardar la clase de orden",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (claseOrden: ClaseOrden) => {
    setEditingItem(claseOrden);
    setFormData({
      tipo_orden: claseOrden.tipo_orden
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('claseorden')
        .delete()
        .eq('id_clase_orden', id);

      if (error) {
        console.error('Error deleting clase orden:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la clase de orden",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Clase de orden eliminada",
        description: "La clase de orden se eliminó correctamente",
      });

      fetchClasesOrden();
    } catch (error) {
      console.error('Error deleting clase orden:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la clase de orden",
        variant: "destructive",
      });
    }
  };

  const filteredClasesOrden = clasesOrden.filter(claseOrden =>
    claseOrden.tipo_orden.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clases de orden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ tipo_orden: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Clase de Orden
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Clase de Orden' : 'Nueva Clase de Orden'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información de la clase de orden' : 'Completa la información de la nueva clase de orden'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_orden">Tipo de Orden</Label>
                <Input
                  id="tipo_orden"
                  value={formData.tipo_orden}
                  onChange={(e) => setFormData({ ...formData, tipo_orden: e.target.value })}
                  placeholder="Venta, Servicio, Garantía..."
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
          <CardTitle>Clases de Orden ({filteredClasesOrden.length})</CardTitle>
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
                  <TableHead>Tipo de Orden</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasesOrden.map((claseOrden) => (
                  <TableRow key={claseOrden.id_clase_orden}>
                    <TableCell>{claseOrden.tipo_orden}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(claseOrden)}
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
                            <AlertDialogTitle>¿Eliminar clase de orden?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              la clase de orden "{claseOrden.tipo_orden}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(claseOrden.id_clase_orden)}
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
                {filteredClasesOrden.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No se encontraron clases de orden
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