// NuevaOrdenModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ClienteSelector, { type ClienteOption } from '@/components/catalogs/ClienteSelector';
import { Building2, Save, Plus, Truck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

interface NuevaOrdenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: (orderId: number) => void;
}

// Función de validación de email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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
  plazo: string | null;
  aprobado_cartera: boolean | null;
}

interface TipoDespacho {
  id_tipo_despacho: number;
  nombre_tipo: string;
  requiere_direccion: boolean | null;
  requiere_transportadora: boolean | null;
}

interface TipoServicio {
  id_tipo_servicio: number;
  nombre_tipo_servicio: string | null;
}

interface Transportadora {
  id_transportadora: number;
  nombre_transportadora: string;
}

type AppRole = Database["public"]["Enums"]["app_role"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function NuevaOrdenModal({ open, onOpenChange, onOrderCreated }: NuevaOrdenModalProps) {
  // Estado para cliente seleccionado (objeto completo para el selector)
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [asignables, setAsignables] = useState<Array<{ user_id: string; label: string; role: AppRole }>>([]);
  const [clasesOrden, setClasesOrden] = useState<Array<ClaseOrden>>([]);
  const [tiposPago, setTiposPago] = useState<Array<TipoPago>>([]);
  const [tiposDespacho, setTiposDespacho] = useState<Array<TipoDespacho>>([]);
  const [tiposServicio, setTiposServicio] = useState<Array<TipoServicio>>([]);
  const [transportadoras, setTransportadoras] = useState<Array<Transportadora>>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id_proyecto: '',
    id_clase_orden: '',
    id_tipo_pago: '',
    id_tipo_despacho: '',
    id_tipo_servicio: '',
    pago_flete: '',
    observaciones_orden: '',
    orden_compra: '',
  });

  const [despachoData, setDespachoData] = useState({
    direccion: '',
    ciudad: '',
    nombre_contacto: '',
    telefono_contacto: '',
    email_contacto: '',
    id_transportadora: '',
  });

  const [selectedComercial, setSelectedComercial] = useState<string>('');
  const [comerciales, setComerciales] = useState<Array<{ user_id: string; label: string; role: AppRole }>>([]);
  const [selectedComercialAdicional, setSelectedComercialAdicional] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadInitialData();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setSelectedCliente(null);
    setFormData({
      id_proyecto: '',
      id_clase_orden: '',
      id_tipo_pago: '',
      id_tipo_despacho: '',
      id_tipo_servicio: '',
      pago_flete: '',
      observaciones_orden: '',
      orden_compra: '',
    });
    setDespachoData({
      direccion: '',
      ciudad: '',
      nombre_contacto: '',
      telefono_contacto: '',
      email_contacto: '',
      id_transportadora: '',
    });
    setSelectedComercial('');
    setSelectedComercialAdicional('');
    setProyectos([]);
  };

  const loadInitialData = async () => {
    try {
      // NOTA: Los clientes ya no se cargan aquí - el ClienteSelector los busca dinámicamente

      // Cargar usuarios asignables - Solo usuarios con rol "ingenieria"
      const { data: ingenierosData, error: ingErr } = await supabase
        .from('profiles')
        .select('user_id, nombre, username, role')
        .eq('role', 'ingenieria' as AppRole)
        .order('nombre', { ascending: true, nullsFirst: false })
        .order('username', { ascending: true });
      if (ingErr) throw ingErr;

      setAsignables(
        (ingenierosData ?? []).map((u: ProfileRow) => ({
          user_id: u.user_id,
          label: u.nombre ?? u.username ?? '(sin nombre)',
          role: u.role as AppRole,
        }))
      );

      // Cargar comerciales para asignar comercial adicional
      const { data: comercialesListData, error: comListErr } = await supabase
        .from('profiles')
        .select('user_id, nombre, username, role')
        .eq('role', 'comercial' as AppRole)
        .order('nombre', { ascending: true, nullsFirst: false })
        .order('username', { ascending: true });
      if (comListErr) throw comListErr;

      setComerciales(
        (comercialesListData ?? []).map((u: ProfileRow) => ({
          user_id: u.user_id,
          label: u.nombre ?? u.username ?? '(sin nombre)',
          role: u.role as AppRole,
        }))
      );

      const [proyectosRes, clasesOrdenRes, tipoPagoRes, metodoDespachoRes, tiposServicioRes, transportadorasRes] = await Promise.all ([
        supabase.from('proyecto').select('*').order('nombre_proyecto'),
        supabase.from('clase_orden').select('*').order('tipo_orden'),
        supabase.from('tipo_pago').select('*').order('forma_pago'),
        supabase.from('tipo_despacho').select('*').order('nombre_tipo'),
        supabase.from('tipo_servicio').select('*').order('nombre_tipo_servicio'),
        supabase.from('transportadora').select('*').order('nombre_transportadora')
      ]);

      if (proyectosRes.error) throw proyectosRes.error;
      if (clasesOrdenRes.error) throw clasesOrdenRes.error;
      if (tipoPagoRes.error) throw tipoPagoRes.error;
      if (metodoDespachoRes.error) throw metodoDespachoRes.error;
      if (tiposServicioRes.error) throw tiposServicioRes.error;
      if (transportadorasRes.error) throw transportadorasRes.error;

      setProyectos(proyectosRes.data ?? []);
      setClasesOrden(clasesOrdenRes.data ?? []);
      setTiposPago(tipoPagoRes.data ?? []);
      setTiposDespacho(metodoDespachoRes.data ?? []);
      setTiposServicio(tiposServicioRes.data ?? []);
      setTransportadoras(transportadorasRes.data ?? []);

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

  const handleClienteChange = (cliente: ClienteOption | null) => {
    setSelectedCliente(cliente);
    setFormData(prev => ({ ...prev, id_proyecto: '' }));
    if (cliente) {
      loadProyectos(cliente.id_cliente.toString());
    } else {
      setProyectos([]);
    }
  };


  const handleSubmit = async () => {
    // Basic validation
    if (!selectedCliente) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    // Validate required fields
    if (!formData.id_clase_orden || !formData.id_tipo_pago || !formData.id_tipo_servicio) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    // Validate dispatch information if tipo_despacho is selected
    if (formData.id_tipo_despacho) {
      const tipoSeleccionado = tiposDespacho.find(t => t.id_tipo_despacho.toString() === formData.id_tipo_despacho);

      if (tipoSeleccionado?.requiere_direccion) {
        if (!despachoData.direccion || !despachoData.nombre_contacto) {
          toast.error('Por favor complete la información de dirección y contacto');
          return;
        }

        // Validar email si se proporciona
        if (despachoData.email_contacto && !validateEmail(despachoData.email_contacto)) {
          toast.error('El email de contacto no es válido');
          return;
        }
      }

      if (tipoSeleccionado?.requiere_transportadora && !despachoData.id_transportadora) {
        toast.error('Por favor seleccione una transportadora');
        return;
      }
    }

    setLoading(true);
    try {
      // Tipo para pago_flete según el enum de la BD
      type PagoFleteEnum = 'no_aplica' | 'pago_contraentrega' | 'paga_bismark_factura_cliente' | 'flete_costo_negocio';

      // Create the order with the new fields
      const ordenData = {
        id_cliente: selectedCliente!.id_cliente,
        id_proyecto: formData.id_proyecto ? parseInt(formData.id_proyecto) : null,
        id_clase_orden: formData.id_clase_orden ? parseInt(formData.id_clase_orden) : null,
        id_tipo_pago: formData.id_tipo_pago ? parseInt(formData.id_tipo_pago) : null,
        id_tipo_servicio: formData.id_tipo_servicio ? parseInt(formData.id_tipo_servicio) : null,
        pago_flete: (formData.pago_flete as PagoFleteEnum) || null,
        orden_compra: formData.orden_compra || null,
        observaciones_orden: formData.observaciones_orden || null,
        // Establecer estatus y fase inicial
        estatus: 'borrador' as const,
        fase: 'comercial' as const,
      };

      const { data: order, error: orderError } = await supabase
        .from('orden_pedido')
        .insert(ordenData)
        .select('id_orden_pedido')
        .single();

      if (orderError) throw orderError;

      const orderId = order.id_orden_pedido;

      // Create responsable_orden if a responsible is selected
      if (selectedComercial) {
        // Obtener el rol real del usuario seleccionado
        const usuarioSeleccionado = asignables.find(u => u.user_id === selectedComercial);
        const rolUsuario = usuarioSeleccionado?.role || 'ingenieria' as AppRole;

        const { error: responsableError } = await supabase
          .from('responsable_orden')
          .insert({
            id_orden_pedido: orderId,
            user_id: selectedComercial,
            role: rolUsuario,
          });

        if (responsableError) {
          console.error('Error creating responsable:', responsableError);
          // Don't fail the entire operation, just log the error
        }
      }

      // Create comercial adicional if selected
      if (selectedComercialAdicional) {
        const { error: comercialAdicionalError } = await supabase
          .from('responsable_orden')
          .insert({
            id_orden_pedido: orderId,
            user_id: selectedComercialAdicional,
            role: 'comercial' as AppRole,
          });

        if (comercialAdicionalError) {
          console.error('Error creating comercial adicional:', comercialAdicionalError);
          // Don't fail the entire operation, just log the error
        }
      }

      // Create dispatch information if tipo_despacho is selected
      if (formData.id_tipo_despacho) {
        const tipoSeleccionado = tiposDespacho.find(t => t.id_tipo_despacho.toString() === formData.id_tipo_despacho);
        let id_direccion: number | null = null;
        let id_contacto: number | null = null;

        // Create direccion_despacho if required
        if (tipoSeleccionado?.requiere_direccion && despachoData.direccion) {
          const { data: direccion, error: direccionError } = await supabase
            .from('direccion_despacho')
            .insert({
              id_cliente: selectedCliente!.id_cliente,
              direccion: despachoData.direccion,
              ciudad: despachoData.ciudad || null,
            })
            .select('id_direccion')
            .single();

          if (direccionError) {
            console.error('Error creating direccion:', direccionError);
            throw new Error('Error al crear la dirección de despacho');
          }

          id_direccion = direccion.id_direccion;

          // Create contacto_despacho if direccion was created and contact info provided
          if (id_direccion && despachoData.nombre_contacto) {
            const { data: contacto, error: contactoError } = await supabase
              .from('contacto_despacho')
              .insert({
                id_direccion: id_direccion,
                nombre_contacto: despachoData.nombre_contacto,
                telefono: despachoData.telefono_contacto || null,
                email: despachoData.email_contacto || null,
              })
              .select('id_contacto')
              .single();

            if (contactoError) {
              console.error('Error creating contacto:', contactoError);
              // Don't fail, contacto is optional
            } else {
              id_contacto = contacto.id_contacto;
            }
          }
        }

        // Create despacho_orden
        const { data: despacho, error: despachoError } = await supabase
          .from('despacho_orden')
          .insert({
            id_orden_pedido: orderId,
            id_tipo_despacho: parseInt(formData.id_tipo_despacho),
            id_direccion: id_direccion,
            id_contacto: id_contacto,
            id_transportadora: despachoData.id_transportadora ? parseInt(despachoData.id_transportadora) : null,
            fecha_despacho: null, // Se diligencia en la etapa de logística
          })
          .select('id_despacho_orden')
          .single();

        if (despachoError) {
          console.error('Error creating despacho_orden:', despachoError);
          throw new Error('Error al crear la información de despacho');
        }

        // No es necesario actualizar orden_pedido con id_despacho_orden
        // La relación se maneja por el id_orden_pedido en la tabla despacho_orden
        console.log('Despacho creado exitosamente para orden:', orderId);
      }

      toast.success('Orden creada exitosamente');

      // Pass the new order ID to the parent component
      onOrderCreated(orderId);

      // Close the modal
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear la orden');
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
                  <ClienteSelector
                    value={selectedCliente}
                    onChange={handleClienteChange}
                    placeholder="Buscar cliente por nombre o NIT..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Proyecto</Label>
                  <Select
                    value={formData.id_proyecto}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_proyecto: value }))}
                    disabled={!selectedCliente}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ingeniero asignado</Label>
                  <Select value={selectedComercial} onValueChange={setSelectedComercial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {asignables.map((u) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Comercial adicional</Label>
                  <Select value={selectedComercialAdicional} onValueChange={setSelectedComercialAdicional}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar comercial (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {comerciales.map((u) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

                {/* Condiciones de Pago */}
                <div className="space-y-2">
                    <Label>Condiciones de Pago <span className="text-red-500">*</span></Label>
                    <Select
                    value={formData.id_tipo_pago}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_tipo_pago: value }))}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar condición de pago" />
                    </SelectTrigger>
                    <SelectContent>
                        {tiposPago.map((pago) => (
                        <SelectItem key={pago.id_tipo_pago} value={pago.id_tipo_pago.toString()}>
                            {pago.plazo ? `${pago.forma_pago} - ${pago.plazo}` : pago.forma_pago}
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
                    <Label>Tipo de Despacho</Label>
                    <Select
                    value={formData.id_tipo_despacho}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, id_tipo_despacho: value }))}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        {tiposDespacho.map((tipo) => (
                        <SelectItem
                            key={tipo.id_tipo_despacho}
                            value={tipo.id_tipo_despacho.toString()}
                        >
                            {tipo.nombre_tipo}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                </div>

                {/* Segunda fila: Pago del Flete */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                    <Label>Pago del Flete</Label>
                    <Select
                    value={formData.pago_flete}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, pago_flete: value }))}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de pago" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no_aplica">No Aplica</SelectItem>
                        <SelectItem value="pago_contraentrega">Pago Contraentrega</SelectItem>
                        <SelectItem value="paga_bismark_factura_cliente">Paga Bismark y lo factura al cliente</SelectItem>
                        <SelectItem value="flete_costo_negocio">Flete es Costo del Negocio</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                </div>
            </CardContent>
          </Card>

          {/* Información de Despacho */}
          {formData.id_tipo_despacho && (() => {
            const tipoSeleccionado = tiposDespacho.find(t => t.id_tipo_despacho.toString() === formData.id_tipo_despacho);
            const requiereDireccion = tipoSeleccionado?.requiere_direccion ?? false;
            const requiereTransportadora = tipoSeleccionado?.requiere_transportadora ?? false;

            return (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="w-5 h-5" />
                    <span>Información de Despacho</span>
                  </CardTitle>
                  <CardDescription>
                    Complete la información requerida para {tipoSeleccionado?.nombre_tipo}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Campos de Dirección - solo si requiere_direccion es true */}
                  {requiereDireccion && (
                    <>
                      <div className="space-y-2">
                        <Label>Dirección de Envío *</Label>
                        <Textarea
                          value={despachoData.direccion}
                          onChange={(e) => setDespachoData(prev => ({ ...prev, direccion: e.target.value }))}
                          placeholder="Dirección completa de entrega"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ciudad</Label>
                        <Input
                          value={despachoData.ciudad}
                          onChange={(e) => setDespachoData(prev => ({ ...prev, ciudad: e.target.value }))}
                          placeholder="Ciudad"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3">Contacto de Entrega</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Nombre del Contacto *</Label>
                            <Input
                              value={despachoData.nombre_contacto}
                              onChange={(e) => setDespachoData(prev => ({ ...prev, nombre_contacto: e.target.value }))}
                              placeholder="Nombre completo"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Teléfono</Label>
                              <Input
                                value={despachoData.telefono_contacto}
                                onChange={(e) => setDespachoData(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                                placeholder="Teléfono de contacto"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={despachoData.email_contacto}
                                onChange={(e) => setDespachoData(prev => ({ ...prev, email_contacto: e.target.value }))}
                                placeholder="Email de contacto"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Campo de Transportadora - solo si requiere_transportadora es true */}
                  {requiereTransportadora && (
                    <div className="space-y-2">
                      <Label>Transportadora *</Label>
                      <Select
                        value={despachoData.id_transportadora}
                        onValueChange={(value) => setDespachoData(prev => ({ ...prev, id_transportadora: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar transportadora" />
                        </SelectTrigger>
                        <SelectContent>
                          {transportadoras.map((transp) => (
                            <SelectItem key={transp.id_transportadora} value={transp.id_transportadora.toString()}>
                              {transp.nombre_transportadora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

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
              disabled={loading || !selectedCliente}
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