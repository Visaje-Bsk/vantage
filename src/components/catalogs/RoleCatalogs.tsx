import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Database, Users, Package, Truck, FileText, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GenericCatalogList from './GenericCatalogList';
import CatalogFormModal from './CatalogFormModal';

interface CatalogConfig {
  key: string;
  title: string;
  description: string;
  table: string;
  icon: React.ReactNode;
  fields: any[];
  formFields: any[];
  roles: string[];
}

const catalogConfigs: CatalogConfig[] = [
  {
    key: 'cliente',
    title: 'Clientes',
    description: 'Gestión de clientes del sistema',
    table: 'cliente',
    icon: <Users className="w-5 h-5" />,
    fields: [
      { key: 'id_cliente', label: 'ID', type: 'number' },
      { key: 'nombre_cliente', label: 'Nombre', type: 'text' },
      { key: 'nit', label: 'NIT', type: 'text' }
    ],
    formFields: [
      { key: 'nombre_cliente', label: 'Nombre del Cliente', type: 'text', required: true },
      { key: 'nit', label: 'NIT', type: 'text', required: true }
    ],
    roles: ['comercial']
  },
  {
    key: 'proyecto',
    title: 'Proyectos',
    description: 'Gestión de proyectos por cliente',
    table: 'proyecto',
    icon: <FileText className="w-5 h-5" />,
    fields: [
      { key: 'id_proyecto', label: 'ID', type: 'number' },
      { key: 'nombre_proyecto', label: 'Nombre', type: 'text' },
      { key: 'descripcion_proyecto', label: 'Descripción', type: 'text' },
      { key: 'id_cliente', label: 'Cliente ID', type: 'number' }
    ],
    formFields: [
      { key: 'nombre_proyecto', label: 'Nombre del Proyecto', type: 'text', required: true },
      { key: 'descripcion_proyecto', label: 'Descripción', type: 'text' },
      { key: 'id_cliente', label: 'Cliente', type: 'select', required: true, options: [] }
    ],
    roles: ['comercial']
  },
  {
    key: 'claseorden',
    title: 'Clases de Orden',
    description: 'Tipos de órdenes del sistema',
    table: 'claseorden',
    icon: <FileText className="w-5 h-5" />,
    fields: [
      { key: 'id_clase_orden', label: 'ID', type: 'number' },
      { key: 'tipo_orden', label: 'Tipo de Orden', type: 'text' }
    ],
    formFields: [
      { key: 'tipo_orden', label: 'Tipo de Orden', type: 'text', required: true }
    ],
    roles: ['comercial']
  },
  {
    key: 'operador',
    title: 'Operadores',
    description: 'Operadores de telecomunicaciones',
    table: 'operador',
    icon: <Package className="w-5 h-5" />,
    fields: [
      { key: 'id_operador', label: 'ID', type: 'number' },
      { key: 'nombre_operador', label: 'Nombre', type: 'text' }
    ],
    formFields: [
      { key: 'nombre_operador', label: 'Nombre del Operador', type: 'text', required: true }
    ],
    roles: ['inventarios']
  },
  {
    key: 'plan',
    title: 'Planes',
    description: 'Planes de servicios por operador',
    table: 'plan',
    icon: <Package className="w-5 h-5" />,
    fields: [
      { key: 'id_plan', label: 'ID', type: 'number' },
      { key: 'nombre_plan', label: 'Nombre', type: 'text' },
      { key: 'id_operador', label: 'Operador ID', type: 'number' }
    ],
    formFields: [
      { key: 'nombre_plan', label: 'Nombre del Plan', type: 'text', required: true },
      { key: 'id_operador', label: 'Operador', type: 'select', required: true, options: [] }
    ],
    roles: ['inventarios']
  },
  {
    key: 'apn',
    title: 'APN',
    description: 'Access Point Names por operador',
    table: 'apn',
    icon: <Database className="w-5 h-5" />,
    fields: [
      { key: 'id_apn', label: 'ID', type: 'number' },
      { key: 'apn', label: 'APN', type: 'text' },
      { key: 'id_operador', label: 'Operador ID', type: 'number' }
    ],
    formFields: [
      { key: 'apn', label: 'APN', type: 'text', required: true },
      { key: 'id_operador', label: 'Operador', type: 'select', required: true, options: [] }
    ],
    roles: ['inventarios']
  },
  {
    key: 'transportadora',
    title: 'Transportadoras',
    description: 'Empresas de transporte y logística',
    table: 'transportadora',
    icon: <Truck className="w-5 h-5" />,
    fields: [
      { key: 'id_transportadora', label: 'ID', type: 'number' },
      { key: 'nombre_transportadora', label: 'Nombre', type: 'text' },
      { key: 'fecha_transportadora', label: 'Fecha', type: 'date' },
      { key: 'observaciones_envio', label: 'Observaciones', type: 'text' }
    ],
    formFields: [
      { key: 'nombre_transportadora', label: 'Nombre de la Transportadora', type: 'text', required: true },
      { key: 'fecha_transportadora', label: 'Fecha', type: 'date' },
      { key: 'observaciones_envio', label: 'Observaciones de Envío', type: 'text' }
    ],
    roles: ['logistica']
  },
  {
    key: 'metododespacho',
    title: 'Métodos de Despacho',
    description: 'Configuración de métodos de entrega',
    table: 'metododespacho',
    icon: <Truck className="w-5 h-5" />,
    fields: [
      { key: 'id_metodo_despacho', label: 'ID', type: 'number' },
      { key: 'tipo_despacho', label: 'Tipo', type: 'text' },
      { key: 'direccion_despacho', label: 'Dirección', type: 'text' },
      { key: 'contacto_despacho', label: 'Contacto', type: 'text' },
      { key: 'contacto_telefono', label: 'Teléfono', type: 'text' },
      { key: 'contacto_email_guia', label: 'Email', type: 'text' }
    ],
    formFields: [
      { key: 'tipo_despacho', label: 'Tipo de Despacho', type: 'text', required: true },
      { key: 'direccion_despacho', label: 'Dirección', type: 'text' },
      { key: 'contacto_despacho', label: 'Contacto', type: 'text' },
      { key: 'contacto_telefono', label: 'Teléfono', type: 'text' },
      { key: 'contacto_email_guia', label: 'Email', type: 'text' },
      { key: 'id_transportadora', label: 'Transportadora', type: 'select', options: [] }
    ],
    roles: ['logistica']
  },
  {
    key: 'tipopago',
    title: 'Tipos de Pago',
    description: 'Formas de pago disponibles',
    table: 'tipopago',
    icon: <DollarSign className="w-5 h-5" />,
    fields: [
      { key: 'id_tipo_pago', label: 'ID', type: 'number' },
      { key: 'forma_pago', label: 'Forma de Pago', type: 'text' },
      { key: 'plazo', label: 'Plazo', type: 'text' },
      { key: 'aprobado_cartera', label: 'Aprobado', type: 'boolean' }
    ],
    formFields: [
      { key: 'forma_pago', label: 'Forma de Pago', type: 'text', required: true },
      { key: 'plazo', label: 'Plazo', type: 'text' },
      { key: 'aprobado_cartera', label: 'Aprobado por Cartera', type: 'boolean' }
    ],
    roles: ['facturacion']
  }
];

export default function RoleCatalogs() {
  const { profile } = useAuth();
  const [catalogData, setCatalogData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    catalogKey: string;
    editingItem: any;
  }>({
    isOpen: false,
    catalogKey: '',
    editingItem: null
  });

  // Get all permissions at the top level
  const catalogPermissions = catalogConfigs.reduce((acc, config) => ({
    ...acc,
    [config.key]: {
      read: usePermission(`catalogo.${config.key}.read`),
      manage: usePermission(`catalogo.${config.key}.manage`)
    }
  }), {});

  // Get available catalogs for current role
  const availableCatalogs = catalogConfigs.filter(config => 
    profile?.role === 'admin' || (Array.isArray(config.roles) && config.roles.includes(profile?.role || ''))
  );

  const visibleCatalogs = availableCatalogs.filter(config => {
    const permissions = catalogPermissions[config.key];
    return permissions?.read || permissions?.manage;
  });

  useEffect(() => {
    visibleCatalogs.forEach(config => {
      loadCatalogData(config.key, config.table);
    });
  }, [visibleCatalogs.length]);

  const loadCatalogData = async (key: string, table: string) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      let query;
      
      // Type-safe table queries
      switch (table) {
        case 'cliente':
          query = supabase.from('cliente').select('*').order('id_cliente', { ascending: true });
          break;
        case 'proyecto':
          query = supabase.from('proyecto').select('*').order('id_proyecto', { ascending: true });
          break;
        case 'claseorden':
          query = supabase.from('claseorden').select('*').order('id_clase_orden', { ascending: true });
          break;
        case 'operador':
          query = supabase.from('operador').select('*').order('id_operador', { ascending: true });
          break;
        case 'plan':
          query = supabase.from('plan').select('*').order('id_plan', { ascending: true });
          break;
        case 'apn':
          query = supabase.from('apn').select('*').order('id_apn', { ascending: true });
          break;
        case 'transportadora':
          query = supabase.from('transportadora').select('*').order('id_transportadora', { ascending: true });
          break;
        case 'metododespacho':
          query = supabase.from('metododespacho').select('*').order('id_metodo_despacho', { ascending: true });
          break;
        case 'tipopago':
          query = supabase.from('tipopago').select('*').order('id_tipo_pago', { ascending: true });
          break;
        default:
          throw new Error(`Unknown table: ${table}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setCatalogData(prev => ({ ...prev, [key]: data || [] }));
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      toast.error(`Error cargando ${key}`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleAdd = (catalogKey: string) => {
    setModalState({
      isOpen: true,
      catalogKey,
      editingItem: null
    });
  };

  const handleEdit = (catalogKey: string, item: any) => {
    setModalState({
      isOpen: true,
      catalogKey,
      editingItem: item
    });
  };

  const handleDelete = async (catalogKey: string, id: string | number) => {
    const config = catalogConfigs.find(c => c.key === catalogKey);
    if (!config) return;

    try {
      let query;
      const idField = `id_${config.key}`;
      
      // Type-safe delete queries
      switch (config.table) {
        case 'cliente':
          query = supabase.from('cliente').delete().eq('id_cliente', Number(id));
          break;
        case 'proyecto':
          query = supabase.from('proyecto').delete().eq('id_proyecto', Number(id));
          break;
        case 'claseorden':
          query = supabase.from('claseorden').delete().eq('id_clase_orden', Number(id));
          break;
        case 'operador':
          query = supabase.from('operador').delete().eq('id_operador', Number(id));
          break;
        case 'plan':
          query = supabase.from('plan').delete().eq('id_plan', Number(id));
          break;
        case 'apn':
          query = supabase.from('apn').delete().eq('id_apn', Number(id));
          break;
        case 'transportadora':
          query = supabase.from('transportadora').delete().eq('id_transportadora', Number(id));
          break;
        case 'metododespacho':
          query = supabase.from('metododespacho').delete().eq('id_metodo_despacho', Number(id));
          break;
        case 'tipopago':
          query = supabase.from('tipopago').delete().eq('id_tipo_pago', Number(id));
          break;
        default:
          throw new Error(`Unknown table: ${config.table}`);
      }

      const { error } = await query;
      if (error) throw error;

      toast.success('Registro eliminado correctamente');
      loadCatalogData(catalogKey, config.table);
    } catch (error: any) {
      console.error('Error deleting:', error);
      
      if (error.code === '23503') {
        toast.error('No se puede eliminar, está siendo referenciado por otros registros');
      } else {
        toast.error('Error al eliminar el registro');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    const config = catalogConfigs.find(c => c.key === modalState.catalogKey);
    if (!config) return;

    try {
      // Normalize payload: convert select string IDs to numbers as needed
      const payload: any = { ...data };
      switch (config.table) {
        case 'proyecto':
          payload.id_cliente = data.id_cliente ? Number(data.id_cliente) : null;
          break;
        case 'plan':
          payload.id_operador = data.id_operador ? Number(data.id_operador) : null;
          break;
        case 'apn':
          payload.id_operador = data.id_operador ? Number(data.id_operador) : null;
          break;
        case 'metododespacho':
          payload.id_transportadora = data.id_transportadora ? Number(data.id_transportadora) : null;
          break;
      }

      let result;

      if (modalState.editingItem) {
        // Update - type-safe queries
        const idField = `id_${config.key}`;
        const idValue = modalState.editingItem[idField];
        
        switch (config.table) {
          case 'cliente':
            result = await supabase.from('cliente').update(payload).eq('id_cliente', Number(idValue));
            break;
          case 'proyecto':
            result = await supabase.from('proyecto').update(payload).eq('id_proyecto', Number(idValue));
            break;
          case 'claseorden':
            result = await supabase.from('claseorden').update(payload).eq('id_clase_orden', Number(idValue));
            break;
          case 'operador':
            result = await supabase.from('operador').update(payload).eq('id_operador', Number(idValue));
            break;
          case 'plan':
            result = await supabase.from('plan').update(payload).eq('id_plan', Number(idValue));
            break;
          case 'apn':
            result = await supabase.from('apn').update(payload).eq('id_apn', Number(idValue));
            break;
          case 'transportadora':
            result = await supabase.from('transportadora').update(payload).eq('id_transportadora', Number(idValue));
            break;
          case 'metododespacho':
            result = await supabase.from('metododespacho').update(payload).eq('id_metodo_despacho', Number(idValue));
            break;
          case 'tipopago':
            result = await supabase.from('tipopago').update(payload).eq('id_tipo_pago', Number(idValue));
            break;
          default:
            throw new Error(`Unknown table: ${config.table}`);
        }
      } else {
        // Insert - type-safe queries
        switch (config.table) {
          case 'cliente':
            result = await supabase.from('cliente').insert([payload]);
            break;
          case 'proyecto':
            result = await supabase.from('proyecto').insert([payload]);
            break;
          case 'claseorden':
            result = await supabase.from('claseorden').insert([payload]);
            break;
          case 'operador':
            result = await supabase.from('operador').insert([payload]);
            break;
          case 'plan':
            result = await supabase.from('plan').insert([payload]);
            break;
          case 'apn':
            result = await supabase.from('apn').insert([payload]);
            break;
          case 'transportadora':
            result = await supabase.from('transportadora').insert([payload]);
            break;
          case 'metododespacho':
            result = await supabase.from('metododespacho').insert([payload]);
            break;
          case 'tipopago':
            result = await supabase.from('tipopago').insert([payload]);
            break;
          default:
            throw new Error(`Unknown table: ${config.table}`);
        }
      }

      if (result.error) throw result.error;

      toast.success(modalState.editingItem ? 'Registro actualizado' : 'Registro creado');
      setModalState({ isOpen: false, catalogKey: '', editingItem: null });
      loadCatalogData(config.key, config.table);
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Error al guardar el registro');
    }
  };

  const getModalFields = (config: CatalogConfig) => {
    return config.formFields.map((f: any) => {
      if (f.type === 'select') {
        // Proyecto -> Cliente options
        if (config.table === 'proyecto' && f.key === 'id_cliente') {
          const clientes = catalogData['cliente'] || [];
          return {
            ...f,
            options: clientes.map((c: any) => ({ value: c.id_cliente, label: c.nombre_cliente }))
          };
        }
        // Plan/APN -> Operador options
        if ((config.table === 'plan' || config.table === 'apn') && f.key === 'id_operador') {
          const operadores = catalogData['operador'] || [];
          return {
            ...f,
            options: operadores.map((o: any) => ({ value: o.id_operador, label: o.nombre_operador }))
          };
        }
        // Metodo Despacho -> Transportadora options
        if (config.table === 'metododespacho' && f.key === 'id_transportadora') {
          const transportadoras = catalogData['transportadora'] || [];
          return {
            ...f,
            options: transportadoras.map((t: any) => ({ value: t.id_transportadora, label: t.nombre_transportadora }))
          };
        }
      }
      return f;
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, catalogKey: '', editingItem: null });
  };

  if (!visibleCatalogs || visibleCatalogs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Sin catálogos disponibles
          </h3>
          <p className="text-sm text-muted-foreground">
            No tienes acceso a ningún catálogo
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentModal = catalogConfigs.find(c => c.key === modalState.catalogKey);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Catálogos</h2>
        <p className="text-muted-foreground">
          Gestiona los catálogos disponibles para tu rol
        </p>
      </div>

      <Tabs defaultValue={visibleCatalogs[0]?.key || ''} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visibleCatalogs.map(config => (
            <TabsTrigger key={config.key} value={config.key} className="flex items-center space-x-2">
              {config.icon}
              <span className="hidden sm:inline">{config.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleCatalogs.map(config => (
          <TabsContent key={config.key} value={config.key}>
            <GenericCatalogList
              title={config.title}
              description={config.description}
              data={catalogData[config.key] || []}
              fields={config.fields}
              permissionCode={config.key}
              loading={loading[config.key]}
              onAdd={() => handleAdd(config.key)}
              onEdit={(item) => handleEdit(config.key, item)}
              onDelete={(id) => handleDelete(config.key, id)}
              searchPlaceholder={`Buscar ${config.title.toLowerCase()}...`}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Form Modal */}
      {currentModal && (
        <CatalogFormModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          title={modalState.editingItem ? `Editar ${currentModal.title}` : `Nuevo ${currentModal.title}`}
          fields={getModalFields(currentModal)}
          initialData={modalState.editingItem}
        />
      )}
    </div>
  );
}