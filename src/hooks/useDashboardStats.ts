import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EstatusOrden = Database['public']['Enums']['estatus_orden_enum'];
type FaseOrden = Database['public']['Enums']['fase_orden_enum'];

interface DashboardStats {
  ordenesActivas: number;
  completadasHoy: number;
  pendientes: number;
  totalMes: number;
  ordenesPorFase: Record<FaseOrden, number>;
  loading: boolean;
  error: Error | null;
}

interface ActividadReciente {
  id_historial: number;
  id_orden_pedido: number;
  consecutivo_code: string | null;
  accion_clave: string;
  fase_nueva: FaseOrden;
  estatus_nuevo: EstatusOrden | null;
  timestamp_accion: string;
  nombre_cliente?: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    ordenesActivas: 0,
    completadasHoy: 0,
    pendientes: 0,
    totalMes: 0,
    ordenesPorFase: {
      comercial: 0,
      inventarios: 0,
      produccion: 0,
      logistica: 0,
      facturacion: 0,
      financiera: 0,
    },
    loading: true,
    error: null,
  });

  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Obtener todas las órdenes del mes actual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Query para órdenes del mes
      const { data: ordenesDelMes, error: ordersError } = await supabase
        .from('orden_pedido')
        .select('id_orden_pedido, estatus, fase, fecha_creacion')
        .gte('fecha_creacion', firstDayOfMonth);

      if (ordersError) throw ordersError;

      // Calcular métricas
      const ordenes = ordenesDelMes || [];

      // Órdenes activas: abierta o enviada
      const ordenesActivas = ordenes.filter(
        o => o.estatus === 'abierta' || o.estatus === 'enviada'
      ).length;

      // Completadas hoy: cerradas hoy
      const completadasHoy = ordenes.filter(
        o => o.estatus === 'cerrada' && o.fecha_creacion >= today
      ).length;

      // Pendientes: borradores
      const pendientes = ordenes.filter(
        o => o.estatus === 'borrador'
      ).length;

      // Total del mes
      const totalMes = ordenes.length;

      // Órdenes por fase
      const ordenesPorFase = ordenes.reduce((acc, orden) => {
        acc[orden.fase] = (acc[orden.fase] || 0) + 1;
        return acc;
      }, {} as Record<FaseOrden, number>);

      // Asegurar que todas las fases tengan un valor
      const fases: FaseOrden[] = ['comercial', 'inventarios', 'produccion', 'logistica', 'facturacion', 'financiera'];
      fases.forEach(fase => {
        if (!ordenesPorFase[fase]) ordenesPorFase[fase] = 0;
      });

      // Obtener actividad reciente (últimos 10 registros del historial)
      const { data: historial, error: historialError } = await supabase
        .from('historial_orden')
        .select(`
          id_historial,
          id_orden_pedido,
          accion_clave,
          fase_nueva,
          estatus_nuevo,
          timestamp_accion,
          orden_pedido!inner(
            consecutivo_code,
            cliente!inner(nombre_cliente)
          )
        `)
        .order('timestamp_accion', { ascending: false })
        .limit(10);

      if (historialError) {
        console.error('Error loading historial:', historialError);
      } else {
        const actividadFormateada = (historial || []).map((h: any) => ({
          id_historial: h.id_historial,
          id_orden_pedido: h.id_orden_pedido,
          consecutivo_code: h.orden_pedido?.consecutivo_code || null,
          accion_clave: h.accion_clave,
          fase_nueva: h.fase_nueva,
          estatus_nuevo: h.estatus_nuevo,
          timestamp_accion: h.timestamp_accion,
          nombre_cliente: h.orden_pedido?.cliente?.nombre_cliente,
        }));
        setActividadReciente(actividadFormateada);
      }

      setStats({
        ordenesActivas,
        completadasHoy,
        pendientes,
        totalMes,
        ordenesPorFase,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  };

  return {
    ...stats,
    actividadReciente,
    refresh: loadDashboardData,
  };
}
