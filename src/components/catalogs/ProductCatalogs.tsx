import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Package, Settings, Boxes } from 'lucide-react';
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

const productCatalogConfigs: CatalogConfig[] = [
  {
    key: 'equipo',
    title: 'Equipos',
    description: 'Gestión de equipos disponibles',
    table: 'equipo',
    icon: <Package className="w-5 h-5" />,
    fields: [
      { key: 'id_equipo', label: 'ID', type: 'number' },
      { key: 'codigo', label: 'Código', type: 'text' },
      { key: 'nombre_equipo', label: 'Nombre', type: 'text' }
    ],
    formFields: [
      { key: 'codigo', label: 'Código del Equipo', type: 'text', required: true },
      { key: 'nombre_equipo', label: 'Nombre del Equipo', type: 'text', required: false }
    ],
    roles: ['comercial', 'inventarios', 'produccion']
  },
  {
    key: 'lineaservicio',
    title: 'Líneas de Servicio',
    description: 'Gestión de líneas de servicio',
    table: 'lineaservicio',
    icon: <Settings className="w-5 h-5" />,
    fields: [
      { key: 'id_linea_detalle', label: 'ID', type: 'number' },
      { key: 'id_operador', label: 'Operador ID', type: 'number' },
      { key: 'id_plan', label: 'Plan ID', type: 'number' },
      { key: 'id_apn', label: 'APN ID', type: 'number' },
      { key: 'clase_cobro', label: 'Clase de Cobro', type: 'text' },
      { key: 'permanencia', label: 'Permanencia', type: 'text' }
    ],
    formFields: [
      { key: 'id_operador', label: 'Operador', type: 'select', required: true, options: [] },
      { key: 'id_plan', label: 'Plan', type: 'select', required: true, options: [] },
      { key: 'id_apn', label: 'APN', type: 'select', required: true, options: [] },
      { key: 'clase_cobro', label: 'Clase de Cobro', type: 'select', required: false, options: [
        { value: 'prepago', label: 'Prepago' },
        { value: 'pospago', label: 'Pospago' }
      ]},
      { key: 'permanencia', label: 'Permanencia', type: 'text', required: false }
    ],
    roles: ['comercial', 'inventarios']
  },
  {
    key: 'servicio',
    title: 'Servicios',
    description: 'Gestión de servicios disponibles',
    table: 'servicio',
    icon: <Database className="w-5 h-5" />,
    fields: [
      { key: 'id_servicio', label: 'ID', type: 'number' },
      { key: 'codigo_servicio', label: 'Código', type: 'text' },
      { key: 'nombre_servicio', label: 'Nombre', type: 'text' }
    ],
    formFields: [
      { key: 'codigo_servicio', label: 'Código del Servicio', type: 'text', required: false },
      { key: 'nombre_servicio', label: 'Nombre del Servicio', type: 'text', required: false }
    ],
    roles: ['comercial', 'inventarios']
  },
  {
    key: 'accesorio',
    title: 'Accesorios',
    description: 'Gestión de accesorios disponibles',
    table: 'accesorio',
    icon: <Boxes className="w-5 h-5" />,
    fields: [
      { key: 'id_accesorio', label: 'ID', type: 'number' },
      { key: 'codigo_accesorio', label: 'Código', type: 'text' },
      { key: 'nombre_accesorio', label: 'Nombre', type: 'text' }
    ],
    formFields: [
      { key: 'codigo_accesorio', label: 'Código del Accesorio', type: 'text', required: false },
      { key: 'nombre_accesorio', label: 'Nombre del Accesorio', type: 'text', required: false }
    ],
    roles: ['comercial', 'inventarios']
  }
];

export default function ProductCatalogs() {
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
  const catalogPermissions = productCatalogConfigs.reduce((acc, config) => ({
    ...acc,
    [config.key]: {
      read: usePermission(`catalogo.${config.key}.read`),
      manage: usePermission(`catalogo.${config.key}.manage`)
    }
  }), {});

  // Get available catalogs for current role
  const availableCatalogs = productCatalogConfigs.filter(config =>
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
        case 'equipo':
          query = supabase.from('equipo').select('*').order('id_equipo', { ascending: true });
          break;
        case 'lineaservicio':
          query = supabase.from('linea_servicio').select('*').order('id_linea_detalle', { ascending: true });
          break;
        case 'servicio':
          query = supabase.from('servicio').select('*').order('id_servicio', { ascending: true });
          break;
        case 'accesorio':
          query = supabase.from('accesorio').select('*').order('id_accesorio', { ascending: true });
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
    const config = productCatalogConfigs.find(c => c.key === catalogKey);
    if (!config) return;

    try {
      let query;
      const idField = `id_${config.key}`;

      // Type-safe delete queries
      switch (config.table) {
        case 'equipo':
          query = supabase.from('equipo').delete().eq('id_equipo', Number(id));
          break;
        case 'lineaservicio':
          query = supabase.from('linea_servicio').delete().eq('id_linea_detalle', Number(id));
          break;
        case 'servicio':
          query = supabase.from('servicio').delete().eq('id_servicio', Number(id));
          break;
        case 'accesorio':
          query = supabase.from('accesorio').delete().eq('id_accesorio', Number(id));
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
    const config = productCatalogConfigs.find(c => c.key === modalState.catalogKey);
    if (!config) return;

    try {
      // Normalize payload: convert select string IDs to numbers as needed
      const payload: any = { ...data };
      switch (config.table) {
        case 'lineaservicio':
          payload.id_operador = data.id_operador ? Number(data.id_operador) : null;
          payload.id_plan = data.id_plan ? Number(data.id_plan) : null;
          payload.id_apn = data.id_apn ? Number(data.id_apn) : null;
          break;
      }

      let result;

      if (modalState.editingItem) {
        // Update - type-safe queries
        const idField = `id_${config.key}`;
        const idValue = modalState.editingItem[idField];

        switch (config.table) {
          case 'equipo':
            result = await supabase.from('equipo').update(payload).eq('id_equipo', Number(idValue));
            break;
          case 'lineaservicio':
            result = await supabase.from('linea_servicio').update(payload).eq('id_linea_detalle', Number(idValue));
            break;
          case 'servicio':
            result = await supabase.from('servicio').update(payload).eq('id_servicio', Number(idValue));
            break;
          case 'accesorio':
            result = await supabase.from('accesorio').update(payload).eq('id_accesorio', Number(idValue));
            break;
          default:
            throw new Error(`Unknown table: ${config.table}`);
        }
      } else {
        // Insert - type-safe queries
        switch (config.table) {
          case 'equipo':
            result = await supabase.from('equipo').insert([payload]);
            break;
          case 'lineaservicio':
            result = await supabase.from('linea_servicio').insert([payload]);
            break;
          case 'servicio':
            result = await supabase.from('servicio').insert([payload]);
            break;
          case 'accesorio':
            result = await supabase.from('accesorio').insert([payload]);
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
      if (f.type === 'select' && !f.options?.length) {
        // Lineaservicio -> Operador, Plan, APN options
        if (config.table === 'lineaservicio') {
          if (f.key === 'id_operador') {
            const operadores = catalogData['operador'] || [];
            return {
              ...f,
              options: operadores.map((o: any) => ({ value: o.id_operador, label: o.nombre_operador }))
            };
          }
          if (f.key === 'id_plan') {
            const planes = catalogData['plan'] || [];
            return {
              ...f,
              options: planes.map((p: any) => ({ value: p.id_plan, label: p.nombre_plan }))
            };
          }
          if (f.key === 'id_apn') {
            const apns = catalogData['apn'] || [];
            return {
              ...f,
              options: apns.map((a: any) => ({ value: a.id_apn, label: a.apn }))
            };
          }
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
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Sin catálogos de productos disponibles
          </h3>
          <p className="text-sm text-muted-foreground">
            No tienes acceso a ningún catálogo de productos
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentModal = productCatalogConfigs.find(c => c.key === modalState.catalogKey);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Catálogos de Productos</h2>
        <p className="text-muted-foreground">
          Gestiona equipos, líneas de servicio, servicios y accesorios
        </p>
      </div>

      <Tabs defaultValue={visibleCatalogs[0]?.key || ''} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
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
