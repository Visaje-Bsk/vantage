import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

interface Transportadora {
  id_transportadora: number;
  nombre_transportadora: string | null;
  fecha_transportadora: string | null;
  observaciones_envio: string | null;
}

export function TransportadoraCatalog() {
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Transportadora | null>(null);
  const [formData, setFormData] = useState({
    nombre_transportadora: '',
    fecha_transportadora: '',
    observaciones_envio: ''
  });

  const fetchTransportadoras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transportadora')
        .select('*')
        .order('nombre_transportadora');

      if (error) {
        console.error('Error fetching transportadoras:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las transportadoras",
          variant: "destructive",
        });
        return;
      }

      setTransportadoras(data || []);
    } catch (error) {
      console.error('Error fetching transportadoras:', error);
      toast({
        title: "Error",
        description: "Error al cargar las transportadoras",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportadoras();
  }, []);

  const handleSubmit = async () => {
    if (!formData.nombre_transportadora.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la transportadora es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('transportadora')
          .update({
            nombre_transportadora: formData.nombre_transportadora.trim(),
            fecha_transportadora: formData.fecha_transportadora || null,
            observaciones_envio: formData.observaciones_envio.trim() || null
          })
          .eq('id_transportadora', editingItem.id_transportadora);

        if (error) {
          console.error('Error updating transportadora:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar la transportadora",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Transportadora actualizada",
          description: "La transportadora se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('transportadora')
          .insert({
            nombre_transportadora: formData.nombre_transportadora.trim(),
            fecha_transportadora: formData.fecha_transportadora || null,
            observaciones_envio: formData.observaciones_envio.trim() || null
          });

        if (error) {
          console.error('Error creating transportadora:', error);
          toast({
            title: "Error",
            description: "No se pudo crear la transportadora",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Transportadora creada",
          description: "La transportadora se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ nombre_transportadora: '', fecha_transportadora: '', observaciones_envio: '' });
      fetchTransportadoras();
    } catch (error) {
      console.error('Error saving transportadora:', error);
      toast({
        title: "Error",
        description: "Error al guardar la transportadora",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (transportadora: Transportadora) => {
    setEditingItem(transportadora);
    setFormData({
      nombre_transportadora: transportadora.nombre_transportadora || '',
      fecha_transportadora: transportadora.fecha_transportadora ? 
        new Date(transportadora.fecha_transportadora).toISOString().split('T')[0] : '',
      observaciones_envio: transportadora.observaciones_envio || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('transportadora')
        .delete()
        .eq('id_transportadora', id);

      if (error) {
        console.error('Error deleting transportadora:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la transportadora",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Transportadora eliminada",
        description: "La transportadora se eliminó correctamente",
      });

      fetchTransportadoras();
    } catch (error) {
      console.error('Error deleting transportadora:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la transportadora",
        variant: "destructive",
      });
    }
  };

  const filteredTransportadoras = transportadoras.filter(transportadora =>
    transportadora.nombre_transportadora?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transportadora.observaciones_envio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transportadoras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ nombre_transportadora: '', fecha_transportadora: '', observaciones_envio: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Transportadora
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Transportadora' : 'Nueva Transportadora'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información de la transportadora' : 'Completa la información de la nueva transportadora'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_transportadora">Nombre de la Transportadora</Label>
                <Input
                  id="nombre_transportadora"
                  value={formData.nombre_transportadora}
                  onChange={(e) => setFormData({ ...formData, nombre_transportadora: e.target.value })}
                  placeholder="Servientrega, TCC, Coordinadora..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_transportadora">Fecha de Registro</Label>
                <Input
                  id="fecha_transportadora"
                  type="date"
                  value={formData.fecha_transportadora}
                  onChange={(e) => setFormData({ ...formData, fecha_transportadora: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones_envio">Observaciones de Envío</Label>
                <Textarea
                  id="observaciones_envio"
                  value={formData.observaciones_envio}
                  onChange={(e) => setFormData({ ...formData, observaciones_envio: e.target.value })}
                  placeholder="Notas sobre condiciones de envío, restricciones, etc..."
                  rows={3}
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
          <CardTitle>Transportadoras ({filteredTransportadoras.length})</CardTitle>
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransportadoras.map((transportadora) => (
                  <TableRow key={transportadora.id_transportadora}>
                    <TableCell className="font-medium">
                      {transportadora.nombre_transportadora || '-'}
                    </TableCell>
                    <TableCell>
                      {transportadora.fecha_transportadora ? 
                        new Date(transportadora.fecha_transportadora).toLocaleDateString('es-ES') : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transportadora.observaciones_envio || '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(transportadora)}
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
                            <AlertDialogTitle>¿Eliminar transportadora?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              la transportadora "{transportadora.nombre_transportadora}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(transportadora.id_transportadora)}
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
                {filteredTransportadoras.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron transportadoras
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