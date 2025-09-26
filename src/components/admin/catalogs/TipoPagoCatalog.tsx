import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface TipoPago {
  id_tipo_pago: number;
  forma_pago: string;
  aprobado_cartera: boolean | null;
  plazo: string | null;
}

export function TipoPagoCatalog() {
  const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TipoPago | null>(null);
  const [formData, setFormData] = useState({
    forma_pago: '',
    aprobado_cartera: false,
    plazo: ''
  });

  const fetchTiposPago = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tipopago')
        .select('*')
        .order('forma_pago');

      if (error) {
        console.error('Error fetching tipos pago:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los tipos de pago",
          variant: "destructive",
        });
        return;
      }

      setTiposPago(data || []);
    } catch (error) {
      console.error('Error fetching tipos pago:', error);
      toast({
        title: "Error",
        description: "Error al cargar los tipos de pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiposPago();
  }, []);

  const handleSubmit = async () => {
    if (!formData.forma_pago.trim()) {
      toast({
        title: "Error",
        description: "La forma de pago es requerida",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('tipopago')
          .update({
            forma_pago: formData.forma_pago.trim(),
            aprobado_cartera: formData.aprobado_cartera,
            plazo: formData.plazo.trim() || null
          })
          .eq('id_tipo_pago', editingItem.id_tipo_pago);

        if (error) {
          console.error('Error updating tipo pago:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el tipo de pago",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Tipo de pago actualizado",
          description: "El tipo de pago se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('tipopago')
          .insert({
            forma_pago: formData.forma_pago.trim(),
            aprobado_cartera: formData.aprobado_cartera,
            plazo: formData.plazo.trim() || null
          });

        if (error) {
          console.error('Error creating tipo pago:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el tipo de pago",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Tipo de pago creado",
          description: "El tipo de pago se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ forma_pago: '', aprobado_cartera: false, plazo: '' });
      fetchTiposPago();
    } catch (error) {
      console.error('Error saving tipo pago:', error);
      toast({
        title: "Error",
        description: "Error al guardar el tipo de pago",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (tipoPago: TipoPago) => {
    setEditingItem(tipoPago);
    setFormData({
      forma_pago: tipoPago.forma_pago,
      aprobado_cartera: tipoPago.aprobado_cartera || false,
      plazo: tipoPago.plazo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tipopago')
        .delete()
        .eq('id_tipo_pago', id);

      if (error) {
        console.error('Error deleting tipo pago:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el tipo de pago",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tipo de pago eliminado",
        description: "El tipo de pago se eliminó correctamente",
      });

      fetchTiposPago();
    } catch (error) {
      console.error('Error deleting tipo pago:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el tipo de pago",
        variant: "destructive",
      });
    }
  };

  const filteredTiposPago = tiposPago.filter(tipoPago =>
    tipoPago.forma_pago.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipoPago.plazo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipos de pago..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ forma_pago: '', aprobado_cartera: false, plazo: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Tipo de Pago
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Tipo de Pago' : 'Nuevo Tipo de Pago'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información del tipo de pago' : 'Completa la información del nuevo tipo de pago'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pago">Forma de Pago</Label>
                <Input
                  id="forma_pago"
                  value={formData.forma_pago}
                  onChange={(e) => setFormData({ ...formData, forma_pago: e.target.value })}
                  placeholder="Contado, Crédito 30 días..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plazo">Plazo</Label>
                <Input
                  id="plazo"
                  value={formData.plazo}
                  onChange={(e) => setFormData({ ...formData, plazo: e.target.value })}
                  placeholder="30 días, 60 días, Inmediato..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aprobado_cartera"
                  checked={formData.aprobado_cartera}
                  onCheckedChange={(checked) => setFormData({ ...formData, aprobado_cartera: checked as boolean })}
                />
                <Label htmlFor="aprobado_cartera">Aprobado por cartera</Label>
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
          <CardTitle>Tipos de Pago ({filteredTiposPago.length})</CardTitle>
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
                  <TableHead>Forma de Pago</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead>Aprobado Cartera</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTiposPago.map((tipoPago) => (
                  <TableRow key={tipoPago.id_tipo_pago}>
                    <TableCell className="font-medium">{tipoPago.forma_pago}</TableCell>
                    <TableCell>{tipoPago.plazo || '-'}</TableCell>
                    <TableCell>
                      {tipoPago.aprobado_cartera ? (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Sí
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tipoPago)}
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
                            <AlertDialogTitle>¿Eliminar tipo de pago?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              el tipo de pago "{tipoPago.forma_pago}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(tipoPago.id_tipo_pago)}
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
                {filteredTiposPago.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron tipos de pago
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