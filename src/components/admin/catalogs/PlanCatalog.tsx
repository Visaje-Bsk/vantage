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

interface Plan {
  id_plan: number;
  nombre_plan: string;
  id_operador: number;
  operador?: {
    nombre_operador: string;
  };
}

interface Operador {
  id_operador: number;
  nombre_operador: string;
}

export function PlanCatalog() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    nombre_plan: '',
    id_operador: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch planes with operador information
      const { data: planesData, error: planesError } = await supabase
        .from('plan')
        .select(`
          *,
          operador:operador(nombre_operador)
        `)
        .order('nombre_plan');

      if (planesError) {
        console.error('Error fetching planes:', planesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes",
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

      setPlanes(planesData || []);
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
    if (!formData.nombre_plan.trim() || !formData.id_operador) {
      toast({
        title: "Error",
        description: "El nombre del plan y operador son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('plan')
          .update({
            nombre_plan: formData.nombre_plan.trim(),
            id_operador: parseInt(formData.id_operador)
          })
          .eq('id_plan', editingItem.id_plan);

        if (error) {
          console.error('Error updating plan:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el plan",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Plan actualizado",
          description: "El plan se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('plan')
          .insert({
            nombre_plan: formData.nombre_plan.trim(),
            id_operador: parseInt(formData.id_operador)
          });

        if (error) {
          console.error('Error creating plan:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el plan",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Plan creado",
          description: "El plan se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ nombre_plan: '', id_operador: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "Error al guardar el plan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingItem(plan);
    setFormData({
      nombre_plan: plan.nombre_plan,
      id_operador: plan.id_operador.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('plan')
        .delete()
        .eq('id_plan', id);

      if (error) {
        console.error('Error deleting plan:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el plan",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Plan eliminado",
        description: "El plan se eliminó correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el plan",
        variant: "destructive",
      });
    }
  };

  const filteredPlanes = planes.filter(plan =>
    plan.nombre_plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.operador?.nombre_operador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ nombre_plan: '', id_operador: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Plan' : 'Nuevo Plan'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información del plan' : 'Completa la información del nuevo plan'}
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
                <Label htmlFor="nombre_plan">Nombre del Plan</Label>
                <Input
                  id="nombre_plan"
                  value={formData.nombre_plan}
                  onChange={(e) => setFormData({ ...formData, nombre_plan: e.target.value })}
                  placeholder="Plan Datos 5GB, Plan Voz ilimitada..."
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
          <CardTitle>Planes ({filteredPlanes.length})</CardTitle>
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
                  <TableHead>Nombre del Plan</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlanes.map((plan) => (
                  <TableRow key={plan.id_plan}>
                    <TableCell className="font-medium">{plan.nombre_plan}</TableCell>
                    <TableCell>{plan.operador?.nombre_operador}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(plan)}
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
                            <AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              el plan "{plan.nombre_plan}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(plan.id_plan)}
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
                {filteredPlanes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No se encontraron planes
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