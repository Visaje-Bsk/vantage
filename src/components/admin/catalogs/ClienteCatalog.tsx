import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import SyncClientesButton from '@/components/catalogs/SyncClientesButton';

interface Cliente {
  id_cliente: number;
  nit: string;
  nombre_cliente: string;
}

export function ClienteCatalog() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nit: '',
    nombre_cliente: ''
  });

  const { 
    currentPage, 
    totalPages, 
    paginatedData, 
    setCurrentPage, 
    totalItems 
  } = usePagination({
    data: clientes,
    itemsPerPage: 10,
    searchTerm,
    searchFields: ['nombre_cliente', 'nit']
  });

  const fetchClientes = async () => {
    try {
      setLoading(true);
      // Supabase's PostgREST enforces a default max of 1000 rows per request.
      // Fetch in batches using range() until all rows are loaded.
      const pageSize = 1000;
      let from = 0;
      let allClientes: Cliente[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('cliente')
          .select('*')
          .order('nombre_cliente')
          .range(from, from + pageSize - 1);

        if (error) {
          console.error('Error fetching clientes:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los clientes",
            variant: "destructive",
          });
          return;
        }

        if (!data || data.length === 0) break;

        allClientes = allClientes.concat(data);

        if (data.length < pageSize) break; // last page
        from += pageSize;
      }

      setClientes(allClientes);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleSubmit = async () => {
    if (!formData.nit.trim() || !formData.nombre_cliente.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('cliente')
          .update({
            nit: formData.nit.trim(),
            nombre_cliente: formData.nombre_cliente.trim()
          })
          .eq('id_cliente', editingItem.id_cliente);

        if (error) {
          console.error('Error updating cliente:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el cliente",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Cliente actualizado",
          description: "El cliente se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('cliente')
          .insert({
            nit: formData.nit.trim(),
            nombre_cliente: formData.nombre_cliente.trim()
          });

        if (error) {
          console.error('Error creating cliente:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el cliente",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Cliente creado",
          description: "El cliente se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ nit: '', nombre_cliente: '' });
      fetchClientes();
    } catch (error) {
      console.error('Error saving cliente:', error);
      toast({
        title: "Error",
        description: "Error al guardar el cliente",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingItem(cliente);
    setFormData({
      nit: cliente.nit,
      nombre_cliente: cliente.nombre_cliente
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('cliente')
        .delete()
        .eq('id_cliente', id);

      if (error) {
        console.error('Error deleting cliente:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente eliminado",
        description: "El cliente se eliminó correctamente",
      });

      fetchClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el cliente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <SyncClientesButton onDone={() => fetchClientes()} />
          <Dialog open={showModal} onOpenChange={(open) => {
            setShowModal(open);
            if (!open) {
              setEditingItem(null);
              setFormData({ nit: '', nombre_cliente: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Modifica la información del cliente' : 'Completa la información del nuevo cliente'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nit">NIT</Label>
                  <Input
                    id="nit"
                    value={formData.nit}
                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                    placeholder="123456789-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre_cliente">Nombre del Cliente</Label>
                  <Input
                    id="nombre_cliente"
                    value={formData.nombre_cliente}
                    onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                    placeholder="Empresa ABC S.A.S"
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Clientes ({totalItems}) 
            {totalPages > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - Página {currentPage} de {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIT</TableHead>
                    <TableHead>Nombre Cliente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((cliente) => (
                    <TableRow key={cliente.id_cliente}>
                      <TableCell className="font-mono">{cliente.nit}</TableCell>
                      <TableCell>{cliente.nombre_cliente}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cliente)}
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
                              <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente 
                                el cliente "{cliente.nombre_cliente}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(cliente.id_cliente)}
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
                  {paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No se encontraron clientes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {currentPage > 2 && (
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationLink 
                            onClick={() => setCurrentPage(currentPage - 1)}
                            className="cursor-pointer"
                          >
                            {currentPage - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationLink isActive>
                          {currentPage}
                        </PaginationLink>
                      </PaginationItem>
                      
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationLink 
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="cursor-pointer"
                          >
                            {currentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {currentPage < totalPages - 1 && (
                        <PaginationItem>
                          <PaginationLink 
                            onClick={() => setCurrentPage(totalPages)}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}