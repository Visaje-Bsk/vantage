import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

interface TipoDespacho {
  id_tipo_despacho: number;
  nombre_tipo: string;
  requiere_direccion: boolean | null;
  requiere_transportadora: boolean | null;
}

export function MetodoDespachoCatalog() {
  const [tiposDespacho, setTiposDespacho] = useState<TipoDespacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TipoDespacho | null>(null);
  const [formData, setFormData] = useState({
    nombre_tipo: '',
    requiere_direccion: false,
    requiere_transportadora: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tipos de despacho
      const { data: tiposData, error: tiposError } = await supabase
        .from('tipo_despacho')
        .select('*')
        .order('nombre_tipo');

      if (tiposError) {
        console.error('Error fetching tipos despacho:', tiposError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los tipos de despacho",
          variant: "destructive",
        });
        return;
      }

      setTiposDespacho(tiposData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.nombre_tipo.trim()) {
      toast({
        title: "Error",
        description: "El nombre del tipo de despacho es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('tipo_despacho')
          .update({
            nombre_tipo: formData.nombre_tipo.trim(),
            requiere_direccion: formData.requiere_direccion,
            requiere_transportadora: formData.requiere_transportadora
          })
          .eq('id_tipo_despacho', editingItem.id_tipo_despacho);

        if (error) {
          console.error('Error updating tipo despacho:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el tipo de despacho",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Tipo de despacho actualizado",
          description: "El tipo de despacho se actualizó correctamente",
        });
      } else {
        // Create
        const { error, data } = await supabase
          .from('tipo_despacho')
          .insert({
            nombre_tipo: formData.nombre_tipo.trim(),
            requiere_direccion: formData.requiere_direccion,
            requiere_transportadora: formData.requiere_transportadora
          })
          .select()
          .single();

        console.log('Insert result:', { error, data });

        if (error) {
          console.error('Error creating tipo despacho:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el tipo de despacho",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Tipo de despacho creado",
          description: "El tipo de despacho se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        nombre_tipo: '',
        requiere_direccion: false,
        requiere_transportadora: false
      });
      fetchData();
    } catch (error) {
      console.error('Error saving tipo despacho:', error);
      toast({
        title: "Error",
        description: "Error al guardar el tipo de despacho",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (tipoDespacho: TipoDespacho) => {
    setEditingItem(tipoDespacho);
    setFormData({
      nombre_tipo: tipoDespacho.nombre_tipo || '',
      requiere_direccion: tipoDespacho.requiere_direccion || false,
      requiere_transportadora: tipoDespacho.requiere_transportadora || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tipo_despacho')
        .delete()
        .eq('id_tipo_despacho', id);

      if (error) {
        console.error('Error deleting tipo despacho:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el tipo de despacho",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tipo de despacho eliminado",
        description: "El tipo de despacho se eliminó correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting tipo despacho:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el tipo de despacho",
        variant: "destructive",
      });
    }
  };

  const filteredTiposDespacho = tiposDespacho.filter(tipo =>
    tipo.nombre_tipo?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipos de despacho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingItem(null);
            setFormData({
              nombre_tipo: '',
              requiere_direccion: false,
              requiere_transportadora: false
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Tipo de Despacho
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Tipo de Despacho' : 'Nuevo Tipo de Despacho'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información del tipo de despacho' : 'Completa la información del nuevo tipo de despacho'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_tipo">Nombre del Tipo</Label>
                <Input
                  id="nombre_tipo"
                  value={formData.nombre_tipo}
                  onChange={(e) => setFormData({ ...formData, nombre_tipo: e.target.value })}
                  placeholder="Domicilio, Recoger en oficina, Envío express..."
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiere_direccion"
                    checked={formData.requiere_direccion}
                    onChange={(e) => setFormData({ ...formData, requiere_direccion: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="requiere_direccion">Requiere dirección de envío</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiere_transportadora"
                    checked={formData.requiere_transportadora}
                    onChange={(e) => setFormData({ ...formData, requiere_transportadora: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="requiere_transportadora">Requiere transportadora</Label>
                </div>
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
          <CardTitle>Tipos de Despacho ({filteredTiposDespacho.length})</CardTitle>
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
                  <TableHead>Nombre del Tipo</TableHead>
                  <TableHead>Requiere Dirección</TableHead>
                  <TableHead>Requiere Transportadora</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTiposDespacho.map((tipo) => (
                  <TableRow key={tipo.id_tipo_despacho}>
                    <TableCell className="font-medium">
                      {tipo.nombre_tipo || '-'}
                    </TableCell>
                    <TableCell>
                      {tipo.requiere_direccion ? 'Sí' : 'No'}
                    </TableCell>
                    <TableCell>
                      {tipo.requiere_transportadora ? 'Sí' : 'No'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tipo)}
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
                            <AlertDialogTitle>¿Eliminar tipo de despacho?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente
                              el tipo de despacho "{tipo.nombre_tipo}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(tipo.id_tipo_despacho)}
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
                {filteredTiposDespacho.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron tipos de despacho
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