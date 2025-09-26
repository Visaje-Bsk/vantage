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

interface Apn {
  id_apn: number;
  apn: string;
  id_operador: number;
  operador?: {
    nombre_operador: string;
  };
}

interface Operador {
  id_operador: number;
  nombre_operador: string;
}

export function ApnCatalog() {
  const [apns, setApns] = useState<Apn[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Apn | null>(null);
  const [formData, setFormData] = useState({
    apn: '',
    id_operador: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch apns with operador information
      const { data: apnsData, error: apnsError } = await supabase
        .from('apn')
        .select(`
          *,
          operador:operador(nombre_operador)
        `)
        .order('apn');

      if (apnsError) {
        console.error('Error fetching apns:', apnsError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los APNs",
          variant: "destructive",
        });
        return;
      }

      // Fetch operadores for dropdown
      const { data: operadoresData, error: operadoresError } = await supabase
        .from('operador')
        .select('*')
        .order('nombre_operador');

      if (operadoresError) {
        console.error('Error fetching operadores:', operadoresError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los operadores",
          variant: "destructive",
        });
        return;
      }

      setApns(apnsData || []);
      setOperadores(operadoresData || []);
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
    if (!formData.apn.trim() || !formData.id_operador) {
      toast({
        title: "Error",
        description: "El APN y operador son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('apn')
          .update({
            apn: formData.apn.trim(),
            id_operador: parseInt(formData.id_operador)
          })
          .eq('id_apn', editingItem.id_apn);

        if (error) {
          console.error('Error updating apn:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el APN",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "APN actualizado",
          description: "El APN se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('apn')
          .insert({
            apn: formData.apn.trim(),
            id_operador: parseInt(formData.id_operador)
          });

        if (error) {
          console.error('Error creating apn:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el APN",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "APN creado",
          description: "El APN se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ apn: '', id_operador: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving apn:', error);
      toast({
        title: "Error",
        description: "Error al guardar el APN",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (apn: Apn) => {
    setEditingItem(apn);
    setFormData({
      apn: apn.apn,
      id_operador: apn.id_operador.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('apn')
        .delete()
        .eq('id_apn', id);

      if (error) {
        console.error('Error deleting apn:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el APN",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "APN eliminado",
        description: "El APN se eliminó correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting apn:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el APN",
        variant: "destructive",
      });
    }
  };

  const filteredApns = apns.filter(apn =>
    apn.apn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apn.operador?.nombre_operador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar APNs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ apn: '', id_operador: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo APN
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar APN' : 'Nuevo APN'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información del APN' : 'Completa la información del nuevo APN'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id_operador">Operador</Label>
                <Select value={formData.id_operador} onValueChange={(value) => setFormData({ ...formData, id_operador: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operadores.map((operador) => (
                      <SelectItem key={operador.id_operador} value={operador.id_operador.toString()}>
                        {operador.nombre_operador}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apn">APN</Label>
                <Input
                  id="apn"
                  value={formData.apn}
                  onChange={(e) => setFormData({ ...formData, apn: e.target.value })}
                  placeholder="internet.claro.com.co, web.comcel.com.co..."
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
          <CardTitle>APNs ({filteredApns.length})</CardTitle>
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
                  <TableHead>APN</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApns.map((apn) => (
                  <TableRow key={apn.id_apn}>
                    <TableCell className="font-mono">{apn.apn}</TableCell>
                    <TableCell>{apn.operador?.nombre_operador}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(apn)}
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
                            <AlertDialogTitle>¿Eliminar APN?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              el APN "{apn.apn}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(apn.id_apn)}
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
                {filteredApns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No se encontraron APNs
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