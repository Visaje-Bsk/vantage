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

interface MetodoDespacho {
  id_metodo_despacho: number;
  tipo_despacho: string | null;
  direccion_despacho: string | null;
  contacto_despacho: string | null;
  contacto_telefono: string | null;
  contacto_email_guia: string | null;
  id_transportadora: number | null;
  transportadora?: {
    nombre_transportadora: string;
  };
}

interface Transportadora {
  id_transportadora: number;
  nombre_transportadora: string;
}

export function MetodoDespachoCatalog() {
  const [metodosDespacho, setMetodosDespacho] = useState<MetodoDespacho[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MetodoDespacho | null>(null);
  const [formData, setFormData] = useState({
    tipo_despacho: '',
    direccion_despacho: '',
    contacto_despacho: '',
    contacto_telefono: '',
    contacto_email_guia: '',
    id_transportadora: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch metodos despacho with transportadora information
      const { data: metodosData, error: metodosError } = await supabase
        .from('metododespacho')
        .select(`
          *,
          transportadora:transportadora(nombre_transportadora)
        `)
        .order('tipo_despacho');

      if (metodosError) {
        console.error('Error fetching metodos despacho:', metodosError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los métodos de despacho",
          variant: "destructive",
        });
        return;
      }

      // Fetch transportadoras for dropdown
      const { data: transportadorasData, error: transportadorasError } = await supabase
        .from('transportadora')
        .select('id_transportadora, nombre_transportadora')
        .order('nombre_transportadora');

      if (transportadorasError) {
        console.error('Error fetching transportadoras:', transportadorasError);
        toast({
          title: "Error",
          description: "No se pudieron cargar las transportadoras",
          variant: "destructive",
        });
        return;
      }

      setMetodosDespacho(metodosData || []);
      setTransportadoras(transportadorasData || []);
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
    if (!formData.tipo_despacho.trim()) {
      toast({
        title: "Error",
        description: "El tipo de despacho es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('metododespacho')
          .update({
            tipo_despacho: formData.tipo_despacho.trim(),
            direccion_despacho: formData.direccion_despacho.trim() || null,
            contacto_despacho: formData.contacto_despacho.trim() || null,
            contacto_telefono: formData.contacto_telefono.trim() || null,
            contacto_email_guia: formData.contacto_email_guia.trim() || null,
            id_transportadora: formData.id_transportadora ? parseInt(formData.id_transportadora) : null
          })
          .eq('id_metodo_despacho', editingItem.id_metodo_despacho);

        if (error) {
          console.error('Error updating metodo despacho:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el método de despacho",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Método de despacho actualizado",
          description: "El método de despacho se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('metododespacho')
          .insert({
            tipo_despacho: formData.tipo_despacho.trim(),
            direccion_despacho: formData.direccion_despacho.trim() || null,
            contacto_despacho: formData.contacto_despacho.trim() || null,
            contacto_telefono: formData.contacto_telefono.trim() || null,
            contacto_email_guia: formData.contacto_email_guia.trim() || null,
            id_transportadora: formData.id_transportadora ? parseInt(formData.id_transportadora) : null
          });

        if (error) {
          console.error('Error creating metodo despacho:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el método de despacho",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Método de despacho creado",
          description: "El método de despacho se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ 
        tipo_despacho: '', 
        direccion_despacho: '', 
        contacto_despacho: '', 
        contacto_telefono: '', 
        contacto_email_guia: '', 
        id_transportadora: '' 
      });
      fetchData();
    } catch (error) {
      console.error('Error saving metodo despacho:', error);
      toast({
        title: "Error",
        description: "Error al guardar el método de despacho",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (metodoDespacho: MetodoDespacho) => {
    setEditingItem(metodoDespacho);
    setFormData({
      tipo_despacho: metodoDespacho.tipo_despacho || '',
      direccion_despacho: metodoDespacho.direccion_despacho || '',
      contacto_despacho: metodoDespacho.contacto_despacho || '',
      contacto_telefono: metodoDespacho.contacto_telefono || '',
      contacto_email_guia: metodoDespacho.contacto_email_guia || '',
      id_transportadora: metodoDespacho.id_transportadora?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('metododespacho')
        .delete()
        .eq('id_metodo_despacho', id);

      if (error) {
        console.error('Error deleting metodo despacho:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el método de despacho",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Método de despacho eliminado",
        description: "El método de despacho se eliminó correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting metodo despacho:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el método de despacho",
        variant: "destructive",
      });
    }
  };

  const filteredMetodosDespacho = metodosDespacho.filter(metodo =>
    metodo.tipo_despacho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metodo.direccion_despacho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metodo.contacto_despacho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metodo.transportadora?.nombre_transportadora?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar métodos de despacho..."
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
              tipo_despacho: '', 
              direccion_despacho: '', 
              contacto_despacho: '', 
              contacto_telefono: '', 
              contacto_email_guia: '', 
              id_transportadora: '' 
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Método de Despacho
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Método de Despacho' : 'Nuevo Método de Despacho'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información del método de despacho' : 'Completa la información del nuevo método de despacho'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_despacho">Tipo de Despacho</Label>
                <Input
                  id="tipo_despacho"
                  value={formData.tipo_despacho}
                  onChange={(e) => setFormData({ ...formData, tipo_despacho: e.target.value })}
                  placeholder="Domicilio, Recoger en oficina..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_transportadora">Transportadora</Label>
                <Select value={formData.id_transportadora || 'none'} onValueChange={(value) => setFormData({ ...formData, id_transportadora: value === 'none' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar transportadora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin transportadora</SelectItem>
                    {transportadoras.map((transportadora) => (
                      <SelectItem key={transportadora.id_transportadora} value={transportadora.id_transportadora.toString()}>
                        {transportadora.nombre_transportadora}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion_despacho">Dirección de Despacho</Label>
                <Input
                  id="direccion_despacho"
                  value={formData.direccion_despacho}
                  onChange={(e) => setFormData({ ...formData, direccion_despacho: e.target.value })}
                  placeholder="Dirección completa..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto_despacho">Contacto</Label>
                <Input
                  id="contacto_despacho"
                  value={formData.contacto_despacho}
                  onChange={(e) => setFormData({ ...formData, contacto_despacho: e.target.value })}
                  placeholder="Nombre del contacto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto_telefono">Teléfono</Label>
                <Input
                  id="contacto_telefono"
                  value={formData.contacto_telefono}
                  onChange={(e) => setFormData({ ...formData, contacto_telefono: e.target.value })}
                  placeholder="300 123 4567"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contacto_email_guia">Email para Guía</Label>
                <Input
                  id="contacto_email_guia"
                  type="email"
                  value={formData.contacto_email_guia}
                  onChange={(e) => setFormData({ ...formData, contacto_email_guia: e.target.value })}
                  placeholder="contacto@empresa.com"
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
          <CardTitle>Métodos de Despacho ({filteredMetodosDespacho.length})</CardTitle>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetodosDespacho.map((metodo) => (
                  <TableRow key={metodo.id_metodo_despacho}>
                    <TableCell className="font-medium">
                      {metodo.tipo_despacho || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {metodo.direccion_despacho || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{metodo.contacto_despacho || '-'}</div>
                        {metodo.contacto_telefono && (
                          <div className="text-xs text-muted-foreground">{metodo.contacto_telefono}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {metodo.transportadora?.nombre_transportadora || '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(metodo)}
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
                            <AlertDialogTitle>¿Eliminar método de despacho?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              el método de despacho "{metodo.tipo_despacho}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(metodo.id_metodo_despacho)}
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
                {filteredMetodosDespacho.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron métodos de despacho
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