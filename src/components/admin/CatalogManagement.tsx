import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Building, FolderOpen, CreditCard, Signal, Phone, Truck, Map } from 'lucide-react';
import { ClienteCatalog } from './catalogs/ClienteCatalog';
import { ProyectoCatalog } from './catalogs/ProyectoCatalog';
import { ClaseOrdenCatalog } from './catalogs/ClaseOrdenCatalog';
import { TipoPagoCatalog } from './catalogs/TipoPagoCatalog';
import { OperadorCatalog } from './catalogs/OperadorCatalog';
import { PlanCatalog } from './catalogs/PlanCatalog';
import { ApnCatalog } from './catalogs/ApnCatalog';
import { TransportadoraCatalog } from './catalogs/TransportadoraCatalog';
import { MetodoDespachoCatalog } from './catalogs/MetodoDespachoCatalog';

const catalogTabs = [
  { 
    value: 'cliente', 
    label: 'Clientes', 
    icon: Building,
    description: 'Gestión de clientes registrados'
  },
  { 
    value: 'proyecto', 
    label: 'Proyectos', 
    icon: FolderOpen,
    description: 'Proyectos asociados a clientes'
  },
  { 
    value: 'clase-orden', 
    label: 'Clase Orden', 
    icon: Database,
    description: 'Tipos de órdenes de pedido'
  },
  { 
    value: 'tipo-pago', 
    label: 'Tipo Pago', 
    icon: CreditCard,
    description: 'Formas de pago disponibles'
  },
  { 
    value: 'operador', 
    label: 'Operadores', 
    icon: Signal,
    description: 'Operadores de telecomunicaciones'
  },
  { 
    value: 'plan', 
    label: 'Planes', 
    icon: Phone,
    description: 'Planes de servicios por operador'
  },
  { 
    value: 'apn', 
    label: 'APN', 
    icon: Database,
    description: 'Access Point Names por operador'
  },
  { 
    value: 'transportadora', 
    label: 'Transportadoras', 
    icon: Truck,
    description: 'Empresas de transporte'
  },
  { 
    value: 'metodo-despacho', 
    label: 'Método Despacho', 
    icon: Map,
    description: 'Métodos de despacho y envío'
  },
];

export default function CatalogManagement() {
  const [activeTab, setActiveTab] = useState('cliente');

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Gestión de Catálogos</span>
        </CardTitle>
        <CardDescription>
          Administración de datos maestros del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 lg:grid-cols-9 h-auto p-1">
            {catalogTabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="flex flex-col items-center p-3 text-xs"
              >
                <tab.icon className="w-4 h-4 mb-1" />
                <span className="hidden sm:block">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="cliente" className="space-y-4">
            <ClienteCatalog />
          </TabsContent>

          <TabsContent value="proyecto" className="space-y-4">
            <ProyectoCatalog />
          </TabsContent>

          <TabsContent value="clase-orden" className="space-y-4">
            <ClaseOrdenCatalog />
          </TabsContent>

          <TabsContent value="tipo-pago" className="space-y-4">
            <TipoPagoCatalog />
          </TabsContent>

          <TabsContent value="operador" className="space-y-4">
            <OperadorCatalog />
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <PlanCatalog />
          </TabsContent>

          <TabsContent value="apn" className="space-y-4">
            <ApnCatalog />
          </TabsContent>

          <TabsContent value="transportadora" className="space-y-4">
            <TransportadoraCatalog />
          </TabsContent>

          <TabsContent value="metodo-despacho" className="space-y-4">
            <MetodoDespachoCatalog />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}