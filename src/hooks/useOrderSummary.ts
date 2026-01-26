import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderSummaryData {
  orden: {
    id_orden_pedido: number;
    consecutivo: number;
    consecutivo_code: string | null;
    estatus: string;
    fase: string;
    fecha_creacion: string;
    fecha_modificacion: string | null;
    observaciones_orden: string | null;
    orden_compra: string | null;
    pago_flete: string | null;
    created_by: string;
    cliente: {
      nombre_cliente: string;
      nit: string | null;
    } | null;
    proyecto: {
      nombre_proyecto: string;
    } | null;
    clase_orden: {
      tipo_orden: string;
    } | null;
    tipo_servicio: {
      nombre_tipo_servicio: string;
    } | null;
  } | null;
  detalles: Array<{
    id_orden_detalle: number;
    cantidad: number | null;
    valor_unitario: number | null;
    tipo_producto: string | null;
    plantilla: string | null;
    equipo: {
      nombre_equipo: string;
      codigo: string;
    } | null;
    linea_servicio: {
      id_linea_detalle: number;
      permanencia: string | null;
      clase_cobro: string | null;
      operador: {
        nombre_operador: string;
      } | null;
      plan: {
        nombre_plan: string;
      } | null;
      apn: {
        nombre_apn: string;
      } | null;
    } | null;
  }>;
  despacho: {
    id_despacho_orden: number;
    numero_guia: string | null;
    fecha_despacho: string | null;
    fecha_entrega_cliente: string | null;
    valor_servicio_flete: number | null;
    observaciones: string | null;
    observaciones_proceso: string | null;
    transportadora: {
      nombre_transportadora: string;
    } | null;
    tipo_despacho: {
      nombre_tipo_despacho: string;
    } | null;
    direccion_despacho: {
      direccion: string | null;
      ciudad: string | null;
    } | null;
    contacto_despacho: {
      nombre_contacto: string | null;
      telefono: string | null;
    } | null;
  } | null;
  facturas: Array<{
    id_factura: number;
    numero_factura: string | null;
    fecha_factura: string | null;
    tipo_factura: string | null;
    estado_factura: string | null;
    moneda_base: string | null;
    trm_aplicada: number | null;
  }>;
  remision: {
    id_remision: number;
    numero_remision: string | null;
    fecha_remision: string | null;
    estado_remision: string | null;
  } | null;
  historial: Array<{
    id_historial: number;
    accion_clave: string;
    fase_anterior: string | null;
    fase_nueva: string;
    estatus_nuevo: string | null;
    observaciones: string | null;
    timestamp_accion: string;
    actor_user_id: string | null;
    actor_nombre: string | null;
  }>;
  responsables: Array<{
    user_id: string;
    role: string;
    nombre: string | null;
  }>;
  createdByProfile: {
    nombre: string | null;
    username: string | null;
  } | null;
}

export function useOrderSummary(orderId: number | null) {
  return useQuery({
    queryKey: ['order-summary', orderId],
    queryFn: async (): Promise<OrderSummaryData> => {
      if (!orderId) throw new Error('Order ID is required');

      // 1. Orden principal (sin relaciones)
      const { data: ordenBase, error: ordenError } = await supabase
        .from('orden_pedido')
        .select('*')
        .eq('id_orden_pedido', orderId)
        .single();

      if (ordenError) throw ordenError;

      // 1b. Obtener relaciones de orden por separado
      let cliente = null;
      let proyecto = null;
      let claseOrden = null;
      let tipoServicio = null;

      if (ordenBase.id_cliente) {
        const { data } = await supabase
          .from('cliente')
          .select('nombre_cliente, nit')
          .eq('id_cliente', ordenBase.id_cliente)
          .single();
        cliente = data;
      }

      if (ordenBase.id_proyecto) {
        const { data } = await supabase
          .from('proyecto')
          .select('nombre_proyecto')
          .eq('id_proyecto', ordenBase.id_proyecto)
          .single();
        proyecto = data;
      }

      if (ordenBase.id_clase_orden) {
        const { data } = await supabase
          .from('clase_orden')
          .select('tipo_orden')
          .eq('id_clase_orden', ordenBase.id_clase_orden)
          .single();
        claseOrden = data;
      }

      if (ordenBase.id_tipo_servicio) {
        const { data } = await supabase
          .from('tipo_servicio')
          .select('nombre_tipo_servicio')
          .eq('id_tipo_servicio', ordenBase.id_tipo_servicio)
          .single();
        tipoServicio = data;
      }

      const orden = {
        ...ordenBase,
        cliente,
        proyecto,
        clase_orden: claseOrden,
        tipo_servicio: tipoServicio,
      };

      // 2. Detalles (sin relaciones)
      const { data: detallesBase, error: detallesError } = await supabase
        .from('detalle_orden')
        .select('*')
        .eq('id_orden_pedido', orderId);

      if (detallesError) throw detallesError;

      // 2b. Obtener equipos y líneas de servicio por separado
      const detallesCompletos = await Promise.all(
        (detallesBase || []).map(async (detalle) => {
          let equipo = null;
          let lineaServicio = null;

          if (detalle.id_equipo) {
            const { data } = await supabase
              .from('equipo')
              .select('nombre_equipo, codigo')
              .eq('id_equipo', detalle.id_equipo)
              .single();
            equipo = data;
          }

          if (detalle.id_linea_detalle) {
            const { data: lineaBase } = await supabase
              .from('linea_servicio')
              .select('*')
              .eq('id_linea_detalle', detalle.id_linea_detalle)
              .single();

            if (lineaBase) {
              let operador = null;
              let plan = null;
              let apn = null;

              if (lineaBase.id_operador) {
                const { data } = await supabase
                  .from('operador')
                  .select('nombre_operador')
                  .eq('id_operador', lineaBase.id_operador)
                  .single();
                operador = data;
              }

              if (lineaBase.id_plan) {
                const { data } = await supabase
                  .from('plan')
                  .select('nombre_plan')
                  .eq('id_plan', lineaBase.id_plan)
                  .single();
                plan = data;
              }

              if (lineaBase.id_apn) {
                const { data } = await supabase
                  .from('apn')
                  .select('nombre_apn')
                  .eq('id_apn', lineaBase.id_apn)
                  .single();
                apn = data;
              }

              lineaServicio = {
                ...lineaBase,
                operador,
                plan,
                apn,
              };
            }
          }

          return {
            ...detalle,
            equipo,
            linea_servicio: lineaServicio,
          };
        })
      );

      // 3. Despacho (sin relaciones)
      const { data: despachoBase, error: despachoError } = await supabase
        .from('despacho_orden')
        .select('*')
        .eq('id_orden_pedido', orderId)
        .maybeSingle();

      if (despachoError) throw despachoError;

      // 3b. Obtener relaciones de despacho
      let despachoCompleto = null;
      if (despachoBase) {
        let transportadora = null;
        let tipoDespacho = null;
        let direccion = null;
        let contacto = null;

        if (despachoBase.id_transportadora) {
          const { data } = await supabase
            .from('transportadora')
            .select('nombre_transportadora')
            .eq('id_transportadora', despachoBase.id_transportadora)
            .single();
          transportadora = data;
        }

        if (despachoBase.id_tipo_despacho) {
          const { data } = await supabase
            .from('tipo_despacho')
            .select('nombre_tipo_despacho')
            .eq('id_tipo_despacho', despachoBase.id_tipo_despacho)
            .single();
          tipoDespacho = data;
        }

        if (despachoBase.id_direccion) {
          const { data } = await supabase
            .from('direccion_despacho')
            .select('direccion, ciudad')
            .eq('id_direccion', despachoBase.id_direccion)
            .single();
          direccion = data;
        }

        if (despachoBase.id_contacto) {
          const { data } = await supabase
            .from('contacto_despacho')
            .select('nombre_contacto, telefono')
            .eq('id_contacto', despachoBase.id_contacto)
            .single();
          contacto = data;
        }

        despachoCompleto = {
          ...despachoBase,
          transportadora,
          tipo_despacho: tipoDespacho,
          direccion_despacho: direccion,
          contacto_despacho: contacto,
        };
      }

      // 4. Facturas
      const { data: facturas, error: facturasError } = await supabase
        .from('factura')
        .select('*')
        .eq('id_orden_pedido', orderId);

      if (facturasError) throw facturasError;

      // 5. Remisión
      const { data: remision, error: remisionError } = await supabase
        .from('remision')
        .select('*')
        .eq('id_orden_pedido', orderId)
        .maybeSingle();

      if (remisionError) throw remisionError;

      // 6. Historial (sin relaciones, obtenemos profiles por separado)
      const { data: historialBase, error: historialError } = await supabase
        .from('historial_orden')
        .select('*')
        .eq('id_orden_pedido', orderId)
        .order('timestamp_accion', { ascending: true });

      if (historialError) throw historialError;

      // 6b. Obtener nombres de actores
      const historialCompleto = await Promise.all(
        (historialBase || []).map(async (h) => {
          let actorNombre = null;
          if (h.actor_user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('nombre, username')
              .eq('user_id', h.actor_user_id)
              .single();
            actorNombre = data?.nombre || data?.username || null;
          }
          return {
            ...h,
            actor_nombre: actorNombre,
          };
        })
      );

      // 7. Responsables (sin relaciones)
      const { data: responsablesBase, error: responsablesError } = await supabase
        .from('responsable_orden')
        .select('*')
        .eq('id_orden_pedido', orderId);

      if (responsablesError) throw responsablesError;

      // 7b. Obtener nombres de responsables
      const responsablesCompleto = await Promise.all(
        (responsablesBase || []).map(async (r) => {
          let nombre = null;
          if (r.user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('nombre, username')
              .eq('user_id', r.user_id)
              .single();
            nombre = data?.nombre || data?.username || null;
          }
          return {
            ...r,
            nombre,
          };
        })
      );

      // 8. Perfil del creador
      let createdByProfile = null;
      if (orden?.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, username')
          .eq('user_id', orden.created_by)
          .single();
        createdByProfile = profile;
      }

      return {
        orden,
        detalles: detallesCompletos || [],
        despacho: despachoCompleto,
        facturas: facturas || [],
        remision,
        historial: historialCompleto || [],
        responsables: responsablesCompleto || [],
        createdByProfile,
      };
    },
    enabled: !!orderId,
  });
}
