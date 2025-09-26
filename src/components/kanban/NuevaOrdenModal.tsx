// NuevaOrdenModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClienteSearchSelect } from '@/components/ui/cliente-search-select';
import EquipoSelector, { type EquipoOption } from '@/components/catalogs/EquipoSelector';
import { 
  Building2, 
  FolderOpen, 
  User, 
  Save, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Trash2,
  Truck
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

interface NuevaOrdenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: (orderId: number) => void; // Callback para refrescar el kanban y manejar la nueva orden
}

interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  nit: string;
}

interface Proyecto {
  id_proyecto: number;
  nombre_proyecto: string;
  id_cliente: number;
}

interface ClaseOrden {
  id_clase_orden: number;
  tipo_orden: string;
}

interface TipoPago {
  id_tipo_pago: number;
  forma_pago: string;
}

interface MetodoDespacho {
  id_metodo_despacho: number;
  tipo_despacho: string;
}

interface TipoServicio {
  id_tipo_servicio: number;
  siglas_tipo_servicio: string;
  nombre_tipo_servicio: string;
}

type ClaseCobro = Database["public"]["Enums"]["clase_cobro"];
type AppRole = Database["public"]["Enums"]["app_role"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function NuevaOrdenModal({ open, onOpenChange, onOrderCreated }: NuevaOrdenModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [asignables, setAsignables] = useState<Array<{ user_id: string; label: string; role: AppRole }>>([]);
  const [operadores, setOperadores] = useState<Array<Database["public"]["Tables"]["operador"]["Row"]>>([]);
  const [planes, setPlanes] = useState<Array<Database["public"]["Tables"]["plan"]["Row"]>>([]);
  const [apns, setApns] = useState<Array<Database["public"]["Tables"]["apn"]["Row"]>>([]);
  const [clasesOrden , setClasesOrden] = useState<Array<ClaseOrden>>([]);
  const [tiposPago, setTiposPago] = useState<Array<TipoPago>>([]);
  const [metodosDespacho, setMetodosDespacho] = useState<Array<MetodoDespacho>>([]);
  const [tiposServicio, setTiposServicio] = useState<Array<TipoServicio>>([]);
  const [loading, setLoading] = useState(false);
  const [showLineasDetalle, setShowLineasDetalle] = useState(false);
  
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_proyecto: '',
    id_clase_orden: '',
    id_tipo_pago: '',
    id_metodo_despacho: '',
    id_tipo_servicio: '',
    observaciones_orden: '',
    orden_compra: '',
  });

  const [selectedComercial, setSelectedComercial] = useState<string>('');
  

  // Money formatter
  const formatterCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatCOP = (raw: string) => {
    if (!raw) return '';
    const num = Number(raw);
    if (Number.isNaN(num)) return '';
    return formatterCOP.format(num);
  };

  const digitsOnly = (s: string) => s.replace(/[^0-9]/g, '');

  useEffect(() => {
    if (open) {
      loadInitialData();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      id_cliente: '',
      id_proyecto: '',
      id_clase_orden: '',
      id_tipo_pago: '',
      id_metodo_despacho: '',
      id_tipo_servicio: '',
      observaciones_orden: '',
      orden_compra: '',
    });
    setSelectedComercial('');
  };

  const loadInitialData = async () => {
    try {
      // Cargar clientes
      const { data: clientesData, error: cliErr } = await supabase
        .from('cliente')
        .select('*')
        .order('nombre_cliente');
      if (cliErr) throw cliErr;
      setClientes(clientesData ?? []);

      // Cargar usuarios asignables (excluye admin y comercial)
      const { data: comercialesData, error: comErr } = await supabase
        .from('profiles')
        .select('user_id, nombre, username, role')
        .neq('role', 'comercial' as AppRole)
        .neq('role', 'admin' as AppRole)
        .order('nombre', { ascending: true, nullsFirst: false })
        .order('username', { ascending: true });
      if (comErr) throw comErr;

      setAsignables(
        (comercialesData ?? []).map((u: ProfileRow) => ({
          user_id: u.user_id,
          label: u.nombre ?? u.username ?? '(sin nombre)',
          role: u.role as AppRole,
        }))
      );

      const [proyectosRes, clasesOrdenRes, tipoPagoRes, metodoDespachoRes, tiposServicioRes] = await Promise.all ([
        supabase.from('proyecto').select('*').order('nombre_proyecto'),
        supabase.from('claseorden').select('*').order('tipo_orden'),
        supabase.from('tipopago').select('*').order('forma_pago'),
        supabase.from('metododespacho').select('*').order('tipo_despacho'),
        supabase.from('tipo_servicio').select('*').order('nombre_tipo_servicio')
      ]);

      if (proyectosRes.error) throw proyectosRes.error;
      if (clasesOrdenRes.error) throw clasesOrdenRes.error;
      if (tipoPagoRes.error) throw tipoPagoRes.error;
      if (metodoDespachoRes.error) throw metodoDespachoRes.error;
      if (tiposServicioRes.error) throw tiposServicioRes.error;

      setProyectos(proyectosRes.data ?? []);
      setClasesOrden(clasesOrdenRes.data ?? []);
      setTiposPago(tipoPagoRes.data ?? []);
      setMetodosDespacho(metodoDespachoRes.data ?? []);
      setTiposServicio(tiposServicioRes.data ?? []);

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('No se pudo cargar la información inicial');
    }
  };

  const loadProyectos = async (clienteId: string) => {
    if (!clienteId) return;
    try {
      const { data: proyectosData, error } = await supabase
        .from('proyecto')
        .select('*')
        .eq('id_cliente', parseInt(clienteId))
        .order('nombre_proyecto');
      if (error) throw error;
      setProyectos(proyectosData ?? []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('No se pudieron cargar los proyectos');
    }
  };

  const handleClienteChange = (clienteId: string) => {
    setFormData(prev => ({ ...prev, id_cliente: clienteId, id_proyecto: '' }));
    loadProyectos(clienteId);
  };


  const handleSubmit = async () => {
    // Basic validation
    if (!formData.id_cliente) {
      toast.error('Debe seleccionar un cliente');
      return;
    }
  
    // Validate required fields
    if (!formData.id_clase_orden || !formData.id_tipo_pago || !formData.id_tipo_servicio) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
  
    setLoading(true);
    try {
      // Create the order with the new fields
      const ordenData = {
        id_cliente: parseInt(formData.id_cliente),
        id_proyecto: formData.id_proyecto ? parseInt(formData.id_proyecto) : null,
        id_clase_orden: formData.id_clase_orden ? parseInt(formData.id_clase_orden) : null,
        id_tipo_pago: formData.id_tipo_pago ? parseInt(formData.id_tipo_pago) : null,
        id_metodo_despacho: formData.id_metodo_despacho ? parseInt(formData.id_metodo_despacho) : null,
        id_tipo_servicio: formData.id_tipo_servicio ? parseInt(formData.id_tipo_servicio) : null,
        orden_compra: formData.orden_compra || null,
        observaciones_orden: formData.observaciones_orden || null,
      };
  
      const { data: order, error: orderError } = await supabase
        .from('ordenpedido')
        .insert(ordenData)
        .select('id_orden_pedido')
        .single();
  
      if (orderError) throw orderError;
  
      toast.success('Orden creada exitosamente');
      
      // Pass the new order ID to the parent component
      onOrderCreated(order.id_orden_pedido);
      
      // Close the modal
      onOpenChange(false);
  
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nueva Orden de Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <ClienteSearchSelect 
                    clientes={clientes}
                    value={formData.id_cliente}
                    onValueChange={handleClienteChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Proyecto</Label>
                  <Select
                    value={formData.id_proyecto}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_proyecto: value }))}
                    disabled={!formData.id_cliente}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {proyectos.map((p) => (
                        <SelectItem key={p.id_proyecto} value={p.id_proyecto.toString()}>
                          {p.nombre_proyecto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ingeniero asignado</Label>
                <Select value={selectedComercial} onValueChange={setSelectedComercial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignables.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Código OC</Label>
                <Input
                  type="text"
                  placeholder="Código de Orden de Compra"
                  value={formData.orden_compra}
                  onChange={(e) => setFormData(prev => ({ ...prev, orden_compra: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuracion de la Orden */}
          <Card>
            <CardHeader>
                <CardTitle className="text-lg">Configuración de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Clase de Orden */}
                <div className="space-y-2">
                    <Label>Clase de Orden <span className="text-red-500">*</span></Label>
                    <Select
                    value={formData.id_clase_orden}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_clase_orden: value }))}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar clase" />
                    </SelectTrigger>
                    <SelectContent>
                        {clasesOrden.map((clase) => (
                        <SelectItem key={clase.id_clase_orden} value={clase.id_clase_orden.toString()}>
                            {clase.tipo_orden}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                {/* Tipo de Pago */}
                <div className="space-y-2">
                    <Label>Tipo de Pago <span className="text-red-500">*</span></Label>
                    <Select 
                    value={formData.id_tipo_pago}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_tipo_pago: value }))}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de pago" />
                    </SelectTrigger>
                    <SelectContent>
                        {tiposPago.map((pago) => (
                        <SelectItem key={pago.id_tipo_pago} value={pago.id_tipo_pago.toString()}>
                            {pago.forma_pago}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                {/* Tipo de Servicio */}
                <div className="space-y-2">
                    <Label>Tipo de Servicio <span className="text-red-500">*</span></Label>
                    <Select
                    value={formData.id_tipo_servicio}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_tipo_servicio: value }))}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de servicio" />
                    </SelectTrigger>
                    <SelectContent>
                        {tiposServicio.map((servicio) => (
                        <SelectItem 
                            key={servicio.id_tipo_servicio} 
                            value={servicio.id_tipo_servicio.toString()}
                        >
                            {servicio.nombre_tipo_servicio}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                {/* Método de Despacho */}
                <div className="space-y-2">
                    <Label>Método de Despacho</Label>
                    <Select
                    value={formData.id_metodo_despacho}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_metodo_despacho: value }))}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                        {metodosDespacho.map((metodo) => (
                        <SelectItem 
                            key={metodo.id_metodo_despacho} 
                            value={metodo.id_metodo_despacho.toString()}
                        >
                            {metodo.tipo_despacho}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                </div>
            </CardContent>
          </Card>

          {/* Método de Despacho */}
          <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="w-5 h-5" />
                  <span>Método de Despacho</span>
                </CardTitle>
                <CardDescription>
                  Configuración del envío y entrega
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metodo-despacho">Método de Despacho</Label>
                  <Select 
                    value={formData.id_metodo_despacho} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_metodo_despacho: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de despacho" />
                    </SelectTrigger>
                    <SelectContent>
                      {metodosDespacho.map((metodo) => (
                        <SelectItem key={metodo.id_metodo_despacho} value={metodo.id_metodo_despacho.toString()}>
                          {metodo.tipo_despacho}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Observaciones Comerciales</Label>
                <Textarea
                  value={formData.observaciones_orden}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones_orden: e.target.value }))}
                  placeholder="Observaciones comerciales, condiciones especiales, acuerdos..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.id_cliente}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creando orden...' : 'Crear Orden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}