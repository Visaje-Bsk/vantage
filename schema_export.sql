--
-- PostgreSQL database dump
--

\restrict olOVVHZmP4G5Ltuf1pnVzKRHQCkgP2Ktk6p4QjscSnaDI4arXcE0W1MLctOIdOc

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'comercial',
    'inventarios',
    'produccion',
    'logistica',
    'facturacion',
    'financiera',
    'ingenieria'
);


--
-- Name: clase_cobro; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.clase_cobro AS ENUM (
    'mensual',
    'anual'
);


--
-- Name: condiciones_pago_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.condiciones_pago_enum AS ENUM (
    'backup',
    'contado',
    'credito_15_dias',
    'credito_20_dias',
    'credito_30_dias',
    'credito_60_dias',
    'credito_90_dias',
    'credito_express',
    'garantia',
    'legalizacion',
    'prestamo',
    'reposicion'
);


--
-- Name: estado_factura_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_factura_enum AS ENUM (
    'pendiente',
    'emitida',
    'anulada',
    'pagada'
);


--
-- Name: estado_produccion_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_produccion_enum AS ENUM (
    'pendiente',
    'en_proceso',
    'completada',
    'cancelada'
);


--
-- Name: estado_remision_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_remision_enum AS ENUM (
    'pendiente',
    'emitida',
    'anulada',
    'entregada'
);


--
-- Name: estado_validacion_pago_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_validacion_pago_enum AS ENUM (
    'cupo',
    'cancelado',
    'mora',
    'na',
    'ok'
);


--
-- Name: estatus_orden_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estatus_orden_enum AS ENUM (
    'borrador',
    'abierta',
    'enviada',
    'facturada',
    'cerrada',
    'anulada'
);


--
-- Name: fase_orden_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fase_orden_enum AS ENUM (
    'comercial',
    'inventarios',
    'produccion',
    'logistica',
    'facturacion',
    'financiera'
);


--
-- Name: medio_pago_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.medio_pago_enum AS ENUM (
    'no_aplica',
    'debito_ach_pse',
    'efectivo',
    'consignacion_bancaria',
    'transferencia_debito_interbancario',
    'transferencia_debito_bancaria',
    'tarjeta_credito',
    'tarjeta_debito',
    'giro_referenciado',
    'otro'
);


--
-- Name: pago_flete_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pago_flete_enum AS ENUM (
    'no_aplica',
    'pago_contraentrega',
    'paga_bismark_factura_cliente',
    'flete_costo_negocio'
);


--
-- Name: tipo_factura_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_factura_enum AS ENUM (
    'equipos',
    'servicio',
    'flete'
);


--
-- Name: tipo_producto_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_producto_enum AS ENUM (
    'equipo',
    'linea_servicio'
);


--
-- Name: auth_uid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_uid() RETURNS uuid
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$ 
  SELECT auth.uid() 
$$;


--
-- Name: can_change_estatus(integer, public.estatus_orden_enum); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_change_estatus(op_id integer, new_estatus public.estatus_orden_enum) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1
    FROM orden_pedido op
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE op.id_orden_pedido = op_id
      AND op.estatus NOT IN ('cerrada', 'anulada')
      AND (
        op.created_by = auth.uid() OR
        p.role::text = op.fase::text OR
        EXISTS (
          SELECT 1 FROM responsable_orden ro
          WHERE ro.id_orden_pedido = op_id AND ro.user_id = auth.uid()
        )
      )
      AND has_permission('orden.change_estatus')
  );
$$;


--
-- Name: can_move_fase(integer, public.fase_orden_enum); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_move_fase(op_id integer, to_fase public.fase_orden_enum) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1
    FROM orden_pedido op
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE op.id_orden_pedido = op_id
      AND op.estatus NOT IN ('cerrada', 'anulada')
      AND p.role::text = op.fase::text
      AND has_permission('orden.move_fase')
  );
$$;


--
-- Name: can_update_orden(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_update_orden(op_id integer) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1
    FROM orden_pedido op
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE op.id_orden_pedido = op_id
      AND op.estatus NOT IN ('cerrada', 'anulada')
      AND (
        op.created_by = auth.uid() OR
        (p.role::text = op.fase::text AND has_permission('orden.update')) OR
        EXISTS (
          SELECT 1 FROM responsable_orden ro
          WHERE ro.id_orden_pedido = op_id AND ro.user_id = auth.uid()
        )
      )
  );
$$;


--
-- Name: duplicate_orden_pedido(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.duplicate_orden_pedido(p_id_orden_pedido integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_new_orden_id INTEGER;
  v_new_consecutivo INTEGER;
  v_new_consecutivo_code TEXT;
  v_detalle RECORD;
  v_new_detalle_id INTEGER;
  v_new_linea_id INTEGER;
  v_next_linea_id INTEGER;
  v_source_orden RECORD;
BEGIN
  -- ============================================
  -- 1. VALIDAR ORDEN ORIGEN
  -- ============================================
  SELECT * INTO v_source_orden
  FROM orden_pedido
  WHERE id_orden_pedido = p_id_orden_pedido;

  IF v_source_orden IS NULL THEN
    RAISE EXCEPTION 'Orden con ID % no existe', p_id_orden_pedido;
  END IF;

  IF v_source_orden.estatus = 'anulada' THEN
    RAISE EXCEPTION 'No se puede duplicar una orden anulada';
  END IF;

  -- ============================================
  -- 2. GENERAR NUEVO CONSECUTIVO
  -- ============================================
  SELECT COALESCE(MAX(consecutivo), 0) + 1 INTO v_new_consecutivo
  FROM orden_pedido;

  v_new_consecutivo_code := 'OP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_new_consecutivo::TEXT, 6, '0');

  -- ============================================
  -- 3. COPIAR ORDEN_PEDIDO
  -- ============================================
  INSERT INTO orden_pedido (
    consecutivo,
    consecutivo_code,
    id_cliente,
    id_proyecto,
    fase,
    estatus,
    observaciones_orden,
    orden_compra,
    pago_flete,
    id_tipo_pago,
    id_clase_orden,
    id_tipo_servicio,
    created_by,
    fecha_creacion,
    fecha_modificacion
  )
  VALUES (
    v_new_consecutivo,
    v_new_consecutivo_code,
    v_source_orden.id_cliente,
    v_source_orden.id_proyecto,
    'comercial',  -- Siempre inicia en fase comercial
    'borrador',   -- Siempre inicia como borrador
    v_source_orden.observaciones_orden,
    NULL,  -- orden_compra no se copia (puede ser diferente)
    v_source_orden.pago_flete,
    v_source_orden.id_tipo_pago,
    v_source_orden.id_clase_orden,
    v_source_orden.id_tipo_servicio,
    v_source_orden.created_by,
    NOW(),
    NOW()
  )
  RETURNING id_orden_pedido INTO v_new_orden_id;

  -- ============================================
  -- 4. COPIAR DETALLE_ORDEN Y LINEA_SERVICIO
  -- ============================================
  -- Obtener el siguiente id_linea_detalle disponible
  SELECT COALESCE(MAX(id_linea_detalle), 0) + 1 INTO v_next_linea_id
  FROM linea_servicio;

  FOR v_detalle IN
    SELECT d.*, ls.id_operador, ls.id_plan, ls.id_apn, ls.permanencia, ls.clase_cobro, ls.cantidad_linea
    FROM detalle_orden d
    LEFT JOIN linea_servicio ls ON d.id_linea_detalle = ls.id_linea_detalle
    WHERE d.id_orden_pedido = p_id_orden_pedido
  LOOP
    -- Si tiene línea de servicio, primero crearla
    IF v_detalle.id_linea_detalle IS NOT NULL THEN
      v_new_linea_id := v_next_linea_id;
      v_next_linea_id := v_next_linea_id + 1;

      INSERT INTO linea_servicio (
        id_linea_detalle,
        id_operador,
        id_plan,
        id_apn,
        permanencia,
        clase_cobro,
        cantidad_linea
      )
      VALUES (
        v_new_linea_id,
        v_detalle.id_operador,
        v_detalle.id_plan,
        v_detalle.id_apn,
        v_detalle.permanencia,
        v_detalle.clase_cobro,
        v_detalle.cantidad_linea
      );
    ELSE
      v_new_linea_id := NULL;
    END IF;

    -- Insertar detalle_orden
    INSERT INTO detalle_orden (
      id_orden_pedido,
      id_equipo,
      id_linea_detalle,
      id_servicio,
      id_accesorio,
      cantidad,
      valor_unitario,
      tipo_producto,
      plantilla
    )
    VALUES (
      v_new_orden_id,
      v_detalle.id_equipo,
      v_new_linea_id,
      v_detalle.id_servicio,
      v_detalle.id_accesorio,
      v_detalle.cantidad,
      v_detalle.valor_unitario,
      v_detalle.tipo_producto,
      v_detalle.plantilla
    );
  END LOOP;

  -- ============================================
  -- 5. COPIAR DESPACHO_ORDEN
  -- ============================================
  INSERT INTO despacho_orden (
    id_orden_pedido,
    id_tipo_despacho,
    id_transportadora,
    id_direccion,
    id_contacto,
    observaciones
    -- No copiamos: fecha_despacho, fecha_entrega_cliente, numero_guia, observaciones_proceso, valor_servicio_flete
  )
  SELECT
    v_new_orden_id,
    id_tipo_despacho,
    id_transportadora,
    id_direccion,
    id_contacto,
    observaciones
  FROM despacho_orden
  WHERE id_orden_pedido = p_id_orden_pedido;

  -- ============================================
  -- 6. COPIAR RESPONSABLE_ORDEN
  -- ============================================
  INSERT INTO responsable_orden (id_orden_pedido, user_id, role)
  SELECT v_new_orden_id, user_id, role
  FROM responsable_orden
  WHERE id_orden_pedido = p_id_orden_pedido;

  -- ============================================
  -- 7. RETORNAR ID DE LA NUEVA ORDEN
  -- ============================================
  RETURN v_new_orden_id;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al duplicar orden: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION duplicate_orden_pedido(p_id_orden_pedido integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.duplicate_orden_pedido(p_id_orden_pedido integer) IS 'Duplica una orden de pedido existente con todos sus detalles.

Parámetros:
- p_id_orden_pedido: ID de la orden a duplicar

Datos que SE COPIAN:
- Cliente y proyecto
- Líneas de equipo (detalle_orden con id_equipo)
- Líneas de servicio (detalle_orden + linea_servicio)
- Información de despacho básica (tipo, transportadora, dirección, contacto)
- Responsables asignados
- Observaciones de la orden, pago_flete, id_tipo_pago, clase_orden, tipo_servicio

Datos que NO se copian (se reinician):
- Consecutivo (nuevo generado)
- Fechas (fecha_creacion, fecha_modificacion = NOW())
- Fase (siempre inicia en comercial)
- Estatus (siempre inicia en borrador)
- orden_compra
- Fechas de despacho/entrega
- Número de guía
- Valor de flete

Retorna: ID de la nueva orden creada
';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, role)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'nombre',''), 'comercial');
  RETURN new;
END;
$$;


--
-- Name: has_permission(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission(perm_code text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN role_permissions rp ON p.role = rp.role
    WHERE p.user_id = auth.uid() 
      AND rp.perm_code = has_permission.perm_code 
      AND rp.allowed = true
  ) OR is_admin();
$$;


--
-- Name: has_role(public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(r public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = r
  )
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
$$;


--
-- Name: next_monthly_num(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.next_monthly_num(_ts timestamp with time zone DEFAULT now()) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
  y int := to_char(_ts, 'YY')::int;
  m int := to_char(_ts, 'MM')::int;
  n int;
begin
  insert into public.orden_counter_month(yy, mm, last_num) values (y, m, 1)
  on conflict (yy, mm) do update
    set last_num = orden_counter_month.last_num + 1
  returning last_num into n;
  return n;
end;
$$;


--
-- Name: ordenpedido_before_insert_set_monthly(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ordenpedido_before_insert_set_monthly() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.fecha_creacion is null then
    new.fecha_creacion := now();
  end if;
  if new.consecutivo is null then
    new.consecutivo := public.next_monthly_num(new.fecha_creacion);
  end if;
  if new.fase is null then
    new.fase := 'comercial'::fase_orden_enum;
  end if;
  if new.estatus is null then
    new.estatus := 'abierta'::estatus_orden_enum;
  end if;
  return new;
end $$;


--
-- Name: set_consecutivo_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_consecutivo_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.fecha_creacion is null then
    new.fecha_creacion := now();
  end if;

  new.consecutivo_code :=
    to_char(new.fecha_creacion at time zone 'UTC', 'YY') ||
    to_char(new.fecha_creacion at time zone 'UTC', 'MM') ||
    lpad(new.consecutivo::text, 3, '0');

  return new;
end $$;


--
-- Name: set_fecha_salida_produccion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_fecha_salida_produccion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.fase = 'produccion' AND NEW.fase != 'produccion' THEN
    UPDATE public.orden_produccion
    SET fecha_salida_produccion = now()
    WHERE id_orden_pedido = NEW.id_orden_pedido;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: touch_fecha_modificacion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_fecha_modificacion() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  new.fecha_modificacion = now();
  new.updated_by = auth.uid();
  RETURN new;
END;
$$;


--
-- Name: upsert_comercial_tab(integer, jsonb, jsonb, uuid, text, jsonb, jsonb, integer[], integer[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_comercial_tab(p_orden_id integer, p_orden_data jsonb, p_despacho_data jsonb, p_responsable_user_id uuid, p_responsable_role text, p_equipos jsonb, p_servicios jsonb, p_deleted_equipos integer[], p_deleted_servicios integer[]) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_despacho_id INT;
  v_direccion_id INT;
  v_contacto_id INT;
  v_equipo JSONB;
  v_servicio JSONB;
  v_next_linea_id INT;
  v_linea_ids INT[];
  v_linea_id INT;
  v_detalle_rows JSONB[];
  v_existing_assignment RECORD;
  v_deleted_linea_ids INT[];
  v_requiere_direccion BOOLEAN;
  v_tipo_despacho_id INT;
  -- Constante: ID de la dirección predefinida de Bismark (AK7 84A-29)
  C_DIRECCION_BISMARK CONSTANT INT := 20;
BEGIN
  -- ============================================
  -- 1. UPSERT DESPACHO_ORDEN
  -- ============================================
  IF p_despacho_data IS NOT NULL AND p_despacho_data->>'has_values' = 'true' THEN
    -- Verificar si ya existe despacho para esta orden
    SELECT id_despacho_orden, id_direccion, id_contacto
    INTO v_despacho_id, v_direccion_id, v_contacto_id
    FROM despacho_orden
    WHERE id_orden_pedido = p_orden_id;

    -- Obtener el tipo de despacho y verificar si requiere dirección
    v_tipo_despacho_id := NULLIF((p_despacho_data->>'id_tipo_despacho')::INT, 0);

    IF v_tipo_despacho_id IS NOT NULL THEN
      SELECT COALESCE(requiere_direccion, true) INTO v_requiere_direccion
      FROM tipo_despacho
      WHERE id_tipo_despacho = v_tipo_despacho_id;
    ELSE
      v_requiere_direccion := true; -- Por defecto, requiere dirección
    END IF;

    -- 1a) Manejar dirección de despacho
    IF v_requiere_direccion = false THEN
      -- Si el tipo de despacho NO requiere dirección (ej: "Recoge en Bismark"),
      -- asignar automáticamente la dirección predefinida de Bismark
      v_direccion_id := C_DIRECCION_BISMARK;
    ELSIF NULLIF(TRIM(COALESCE(p_despacho_data->>'direccion', '')), '') IS NOT NULL OR
          NULLIF(TRIM(COALESCE(p_despacho_data->>'ciudad', '')), '') IS NOT NULL THEN
      -- Si requiere dirección y hay datos de dirección proporcionados
      IF v_direccion_id IS NOT NULL AND v_direccion_id != C_DIRECCION_BISMARK THEN
        -- Actualizar dirección existente (solo si no es la de Bismark)
        UPDATE direccion_despacho
        SET
          direccion = COALESCE(NULLIF(TRIM(p_despacho_data->>'direccion'), ''), direccion),
          ciudad = NULLIF(TRIM(p_despacho_data->>'ciudad'), '')
        WHERE id_direccion = v_direccion_id;
      ELSE
        -- Crear nueva dirección (necesita id_cliente de la orden)
        INSERT INTO direccion_despacho (id_cliente, direccion, ciudad)
        SELECT
          o.id_cliente,
          NULLIF(TRIM(p_despacho_data->>'direccion'), ''),
          NULLIF(TRIM(p_despacho_data->>'ciudad'), '')
        FROM orden_pedido o
        WHERE o.id_orden_pedido = p_orden_id
        RETURNING id_direccion INTO v_direccion_id;
      END IF;
    END IF;

    -- 1b) Manejar contacto de despacho (si hay datos de contacto)
    IF (p_despacho_data->>'nombre_contacto') IS NOT NULL OR
       (p_despacho_data->>'telefono_contacto') IS NOT NULL OR
       (p_despacho_data->>'email_contacto') IS NOT NULL THEN
      IF v_contacto_id IS NOT NULL THEN
        -- Actualizar contacto existente
        UPDATE contacto_despacho
        SET
          nombre_contacto = COALESCE(NULLIF(p_despacho_data->>'nombre_contacto', ''), nombre_contacto),
          telefono = NULLIF(p_despacho_data->>'telefono_contacto', ''),
          email = NULLIF(p_despacho_data->>'email_contacto', ''),
          id_direccion = v_direccion_id
        WHERE id_contacto = v_contacto_id;
      ELSE
        -- Crear nuevo contacto
        INSERT INTO contacto_despacho (nombre_contacto, telefono, email, id_direccion)
        VALUES (
          COALESCE(NULLIF(p_despacho_data->>'nombre_contacto', ''), 'Sin nombre'),
          NULLIF(p_despacho_data->>'telefono_contacto', ''),
          NULLIF(p_despacho_data->>'email_contacto', ''),
          v_direccion_id
        )
        RETURNING id_contacto INTO v_contacto_id;
      END IF;
    END IF;

    -- 1c) Actualizar o crear despacho_orden
    IF v_despacho_id IS NOT NULL THEN
      -- Actualizar despacho existente
      UPDATE despacho_orden
      SET
        id_tipo_despacho = NULLIF((p_despacho_data->>'id_tipo_despacho')::INT, 0),
        id_transportadora = NULLIF((p_despacho_data->>'id_transportadora')::INT, 0),
        id_direccion = v_direccion_id,
        id_contacto = v_contacto_id,
        fecha_despacho = CASE
          WHEN NULLIF(p_despacho_data->>'fecha_despacho', '') IS NOT NULL
          THEN (p_despacho_data->>'fecha_despacho')::TIMESTAMP WITH TIME ZONE
          ELSE fecha_despacho
        END
      WHERE id_despacho_orden = v_despacho_id;
    ELSE
      -- Crear nuevo despacho
      INSERT INTO despacho_orden (
        id_orden_pedido,
        id_tipo_despacho,
        id_transportadora,
        id_direccion,
        id_contacto,
        fecha_despacho
      )
      VALUES (
        p_orden_id,
        NULLIF((p_despacho_data->>'id_tipo_despacho')::INT, 0),
        NULLIF((p_despacho_data->>'id_transportadora')::INT, 0),
        v_direccion_id,
        v_contacto_id,
        CASE
          WHEN NULLIF(p_despacho_data->>'fecha_despacho', '') IS NOT NULL
          THEN (p_despacho_data->>'fecha_despacho')::TIMESTAMP WITH TIME ZONE
          ELSE NULL
        END
      )
      RETURNING id_despacho_orden INTO v_despacho_id;
    END IF;
  END IF;

  -- ============================================
  -- 2. UPDATE ORDEN_PEDIDO
  -- ============================================
  IF p_orden_data IS NOT NULL THEN
    UPDATE orden_pedido
    SET
      id_cliente = NULLIF((p_orden_data->>'id_cliente')::INT, 0),
      id_proyecto = NULLIF((p_orden_data->>'id_proyecto')::INT, 0),
      id_clase_orden = NULLIF((p_orden_data->>'id_clase_orden')::INT, 0),
      id_tipo_servicio = NULLIF((p_orden_data->>'id_tipo_servicio')::INT, 0),
      id_tipo_pago = NULLIF((p_orden_data->>'id_tipo_pago')::INT, 0),
      observaciones_orden = NULLIF(p_orden_data->>'observaciones_orden', ''),
      orden_compra = NULLIF(p_orden_data->>'orden_compra', ''),
      pago_flete = CASE
        WHEN NULLIF(p_orden_data->>'pago_flete', '') IS NOT NULL
        THEN (p_orden_data->>'pago_flete')::pago_flete_enum
        ELSE pago_flete
      END,
      fecha_modificacion = NOW()
    WHERE id_orden_pedido = p_orden_id;
  END IF;

  -- ============================================
  -- 3. UPDATE ID_INGENIERO_ASIGNADO
  -- ============================================
  IF p_responsable_user_id IS NOT NULL THEN
    UPDATE orden_pedido
    SET id_ingeniero_asignado = p_responsable_user_id
    WHERE id_orden_pedido = p_orden_id;
  END IF;

  -- ============================================
  -- 4. UPSERT RESPONSABLE_ORDEN
  -- ============================================
  IF p_responsable_user_id IS NOT NULL AND p_responsable_role IS NOT NULL THEN
    -- Verificar si ya existe una asignación para este usuario y orden
    SELECT * INTO v_existing_assignment
    FROM responsable_orden
    WHERE id_orden_pedido = p_orden_id AND user_id = p_responsable_user_id;

    IF v_existing_assignment IS NULL THEN
      -- Insertar nuevo responsable
      INSERT INTO responsable_orden (id_orden_pedido, user_id, role)
      VALUES (p_orden_id, p_responsable_user_id, p_responsable_role::app_role);
    ELSE
      -- Actualizar rol si es diferente
      UPDATE responsable_orden
      SET role = p_responsable_role::app_role
      WHERE id_orden_pedido = p_orden_id AND user_id = p_responsable_user_id;
    END IF;
  END IF;

  -- ============================================
  -- 5. DELETE EQUIPOS MARCADOS
  -- ============================================
  IF p_deleted_equipos IS NOT NULL AND array_length(p_deleted_equipos, 1) > 0 THEN
    DELETE FROM detalle_orden
    WHERE id_orden_detalle = ANY(p_deleted_equipos);
  END IF;

  -- ============================================
  -- 6. UPSERT EQUIPOS (ACTUALIZADO CON PERMANENCIA)
  -- ============================================
  IF p_equipos IS NOT NULL THEN
    FOR v_equipo IN SELECT * FROM jsonb_array_elements(p_equipos)
    LOOP
      -- Si tiene id_orden_detalle, es un UPDATE
      IF (v_equipo->>'id_orden_detalle') IS NOT NULL AND (v_equipo->>'id_orden_detalle')::INT > 0 THEN
        UPDATE detalle_orden
        SET
          cantidad = (v_equipo->>'cantidad')::INT,
          valor_unitario = (v_equipo->>'valor_unitario')::NUMERIC,
          plantilla = NULLIF(v_equipo->>'plantilla', ''),
          permanencia = NULLIF(v_equipo->>'permanencia', '')
        WHERE id_orden_detalle = (v_equipo->>'id_orden_detalle')::INT;
      ELSE
        -- Es un INSERT
        INSERT INTO detalle_orden (
          id_orden_pedido,
          id_equipo,
          id_linea_detalle,
          id_servicio,
          id_accesorio,
          cantidad,
          valor_unitario,
          tipo_producto,
          plantilla,
          permanencia
        )
        VALUES (
          p_orden_id,
          (v_equipo->>'id_equipo')::INT,
          NULL,
          NULL,
          NULL,
          (v_equipo->>'cantidad')::INT,
          (v_equipo->>'valor_unitario')::NUMERIC,
          'equipo',
          NULLIF(v_equipo->>'plantilla', ''),
          NULLIF(v_equipo->>'permanencia', '')
        );
      END IF;
    END LOOP;
  END IF;

  -- ============================================
  -- 7. DELETE SERVICIOS MARCADOS
  -- ============================================
  IF p_deleted_servicios IS NOT NULL AND array_length(p_deleted_servicios, 1) > 0 THEN
    -- Primero obtener los id_linea_detalle de los detalles a eliminar
    SELECT array_agg(id_linea_detalle) INTO v_deleted_linea_ids
    FROM detalle_orden
    WHERE id_orden_detalle = ANY(p_deleted_servicios)
      AND id_linea_detalle IS NOT NULL;

    -- Eliminar detalle_orden
    DELETE FROM detalle_orden
    WHERE id_orden_detalle = ANY(p_deleted_servicios);

    -- Eliminar linea_servicio asociadas
    IF v_deleted_linea_ids IS NOT NULL AND array_length(v_deleted_linea_ids, 1) > 0 THEN
      DELETE FROM linea_servicio
      WHERE id_linea_detalle = ANY(v_deleted_linea_ids);
    END IF;
  END IF;

  -- ============================================
  -- 8. UPSERT SERVICIOS
  -- ============================================
  IF p_servicios IS NOT NULL THEN
    -- Obtener el siguiente id_linea_detalle disponible
    SELECT COALESCE(MAX(id_linea_detalle), 0) + 1 INTO v_next_linea_id
    FROM linea_servicio;

    v_linea_ids := ARRAY[]::INT[];

    FOR v_servicio IN SELECT * FROM jsonb_array_elements(p_servicios)
    LOOP
      -- Si tiene id_orden_detalle, es un UPDATE
      IF (v_servicio->>'id_orden_detalle') IS NOT NULL AND (v_servicio->>'id_orden_detalle')::INT > 0 THEN
        -- Actualizar linea_servicio
        UPDATE linea_servicio
        SET
          id_operador = NULLIF((v_servicio->>'id_operador')::INT, 0),
          id_plan = NULLIF((v_servicio->>'id_plan')::INT, 0),
          id_apn = NULLIF((v_servicio->>'id_apn')::INT, 0),
          clase_cobro = (v_servicio->>'clase_cobro')::clase_cobro,
          permanencia = v_servicio->>'permanencia',
          cantidad_linea = NULLIF((v_servicio->>'cantidad_linea')::INT, 0)
        WHERE id_linea_detalle = (
          SELECT id_linea_detalle FROM detalle_orden
          WHERE id_orden_detalle = (v_servicio->>'id_orden_detalle')::INT
        );

        -- Actualizar valor en detalle_orden
        UPDATE detalle_orden
        SET valor_unitario = (v_servicio->>'valor_mensual')::NUMERIC
        WHERE id_orden_detalle = (v_servicio->>'id_orden_detalle')::INT;
      ELSE
        -- Es un INSERT
        -- 1. Crear linea_servicio
        INSERT INTO linea_servicio (
          id_linea_detalle,
          id_operador,
          id_plan,
          id_apn,
          clase_cobro,
          permanencia,
          cantidad_linea
        )
        VALUES (
          v_next_linea_id,
          NULLIF((v_servicio->>'id_operador')::INT, 0),
          NULLIF((v_servicio->>'id_plan')::INT, 0),
          NULLIF((v_servicio->>'id_apn')::INT, 0),
          (v_servicio->>'clase_cobro')::clase_cobro,
          v_servicio->>'permanencia',
          NULLIF((v_servicio->>'cantidad_linea')::INT, 0)
        );

        -- 2. Crear detalle_orden con referencia a linea_servicio
        INSERT INTO detalle_orden (
          id_orden_pedido,
          id_equipo,
          id_linea_detalle,
          id_servicio,
          id_accesorio,
          cantidad,
          valor_unitario,
          tipo_producto
        )
        VALUES (
          p_orden_id,
          NULL,
          v_next_linea_id,
          NULL,
          NULL,
          1, -- cantidad por defecto para servicios
          (v_servicio->>'valor_mensual')::NUMERIC,
          'servicio'
        );

        v_next_linea_id := v_next_linea_id + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'orden_id', p_orden_id,
    'despacho_id', v_despacho_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;


--
-- Name: FUNCTION upsert_comercial_tab(p_orden_id integer, p_orden_data jsonb, p_despacho_data jsonb, p_responsable_user_id uuid, p_responsable_role text, p_equipos jsonb, p_servicios jsonb, p_deleted_equipos integer[], p_deleted_servicios integer[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.upsert_comercial_tab(p_orden_id integer, p_orden_data jsonb, p_despacho_data jsonb, p_responsable_user_id uuid, p_responsable_role text, p_equipos jsonb, p_servicios jsonb, p_deleted_equipos integer[], p_deleted_servicios integer[]) IS '
Función RPC para guardar toda la información del ComercialTab de forma atómica.
Actualizada para incluir campo permanencia en equipos (requerido para clase_orden Renta).

Parámetros:
- p_orden_id: ID de la orden de pedido
- p_orden_data: JSONB con datos de la orden (id_cliente, id_proyecto, etc.)
- p_despacho_data: JSONB con datos de despacho (incluye has_values para saber si hay datos)
- p_responsable_user_id: UUID del usuario responsable
- p_responsable_role: Rol del responsable (app_role)
- p_equipos: JSONB array con equipos [{id_orden_detalle?, id_equipo, cantidad, valor_unitario, plantilla, permanencia}]
- p_servicios: JSONB array con servicios [{id_orden_detalle?, id_linea_detalle?, id_operador, id_plan, id_apn, clase_cobro, permanencia, valor_mensual, cantidad_linea}]
- p_deleted_equipos: Array de INT con IDs de detalle_orden a eliminar (equipos)
- p_deleted_servicios: Array de INT con IDs de detalle_orden a eliminar (servicios)
';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accesorio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accesorio (
    id_accesorio bigint NOT NULL,
    nombre_accesorio character varying NOT NULL,
    codigo_accesorio character varying
);


--
-- Name: accesorio_id_accesorio_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.accesorio ALTER COLUMN id_accesorio ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.accesorio_id_accesorio_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: apn; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apn (
    id_apn integer NOT NULL,
    id_operador integer NOT NULL,
    apn character varying(100) NOT NULL
);


--
-- Name: apn_id_apn_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.apn_id_apn_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: apn_id_apn_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.apn_id_apn_seq OWNED BY public.apn.id_apn;


--
-- Name: clase_orden; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clase_orden (
    id_clase_orden integer NOT NULL,
    tipo_orden character varying(50) NOT NULL
);


--
-- Name: claseorden_id_clase_orden_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.claseorden_id_clase_orden_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: claseorden_id_clase_orden_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.claseorden_id_clase_orden_seq OWNED BY public.clase_orden.id_clase_orden;


--
-- Name: cliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente (
    id_cliente integer NOT NULL,
    nit character varying(30) NOT NULL,
    nombre_cliente character varying(100) NOT NULL
);


--
-- Name: cliente_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cliente_id_cliente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cliente_id_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cliente_id_cliente_seq OWNED BY public.cliente.id_cliente;


--
-- Name: contacto_despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacto_despacho (
    id_contacto integer NOT NULL,
    id_direccion integer,
    nombre_contacto character varying NOT NULL,
    telefono character varying,
    email character varying,
    es_principal boolean DEFAULT false,
    email2 text,
    email3 text
);


--
-- Name: COLUMN contacto_despacho.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contacto_despacho.email IS 'Email principal del contacto';


--
-- Name: COLUMN contacto_despacho.email2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contacto_despacho.email2 IS 'Email secundario del contacto';


--
-- Name: COLUMN contacto_despacho.email3; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contacto_despacho.email3 IS 'Email terciario del contacto';


--
-- Name: contacto_despacho_id_contacto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.contacto_despacho ALTER COLUMN id_contacto ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.contacto_despacho_id_contacto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: despacho_orden; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.despacho_orden (
    id_despacho_orden integer NOT NULL,
    id_orden_pedido integer NOT NULL,
    id_tipo_despacho integer NOT NULL,
    id_direccion integer,
    id_contacto integer,
    id_transportadora integer,
    numero_guia character varying,
    fecha_despacho timestamp with time zone,
    observaciones text,
    valor_servicio_flete numeric,
    fecha_entrega_cliente timestamp with time zone,
    observaciones_proceso text
);


--
-- Name: COLUMN despacho_orden.observaciones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.despacho_orden.observaciones IS 'Observaciones generales del despacho';


--
-- Name: COLUMN despacho_orden.observaciones_proceso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.despacho_orden.observaciones_proceso IS 'Observaciones internas del proceso logístico (no visible al cliente)';


--
-- Name: despacho_orden_id_despacho_orden_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.despacho_orden ALTER COLUMN id_despacho_orden ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.despacho_orden_id_despacho_orden_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: detalle_orden; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_orden (
    id_orden_detalle bigint NOT NULL,
    id_orden_pedido integer NOT NULL,
    tipo_producto public.tipo_producto_enum,
    id_equipo integer,
    id_linea_detalle integer,
    id_accesorio bigint,
    id_servicio bigint,
    cantidad integer,
    valor_unitario numeric,
    plantilla text,
    permanencia character varying(50) DEFAULT NULL::character varying,
    CONSTRAINT chk_detalle_tipo_producto CHECK ((((tipo_producto = 'equipo'::public.tipo_producto_enum) AND (id_equipo IS NOT NULL) AND (id_linea_detalle IS NULL)) OR ((tipo_producto = 'linea_servicio'::public.tipo_producto_enum) AND (id_linea_detalle IS NOT NULL) AND (id_equipo IS NULL)) OR (tipo_producto IS NULL)))
);


--
-- Name: COLUMN detalle_orden.permanencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.detalle_orden.permanencia IS 'Meses de permanencia del equipo. Requerido cuando clase_orden es Renta.';


--
-- Name: detalle_orden_id_orden_detalle_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.detalle_orden ALTER COLUMN id_orden_detalle ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.detalle_orden_id_orden_detalle_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: direccion_despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.direccion_despacho (
    id_direccion integer NOT NULL,
    id_cliente integer NOT NULL,
    nombre_direccion character varying,
    direccion character varying NOT NULL,
    ciudad character varying,
    latitud numeric,
    longitud numeric,
    activa boolean DEFAULT true
);


--
-- Name: COLUMN direccion_despacho.activa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.direccion_despacho.activa IS 'Indica si la dirección está activa y disponible para nuevas órdenes';


--
-- Name: direccion_despacho_id_direccion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.direccion_despacho ALTER COLUMN id_direccion ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.direccion_despacho_id_direccion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: equipo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipo (
    id_equipo integer NOT NULL,
    codigo character varying(100) NOT NULL,
    nombre_equipo character varying(100)
);


--
-- Name: equipo_id_equipo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.equipo ALTER COLUMN id_equipo ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.equipo_id_equipo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: factura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura (
    id_factura integer NOT NULL,
    numero_factura character varying(50),
    fecha_factura timestamp with time zone,
    id_tipo_pago integer,
    id_orden_pedido integer NOT NULL,
    moneda_base text,
    trm_aplicada numeric,
    fecha_trm date,
    tipo_factura public.tipo_factura_enum,
    estado_factura public.estado_factura_enum
);


--
-- Name: factura_id_factura_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.factura_id_factura_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: factura_id_factura_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.factura_id_factura_seq OWNED BY public.factura.id_factura;


--
-- Name: historial_factura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_factura (
    id_historial integer NOT NULL,
    id_factura integer NOT NULL,
    numero_factura_anterior text,
    numero_factura_nuevo text,
    fecha_factura_anterior date,
    fecha_factura_nueva date,
    usuario_cambio uuid,
    motivo_cambio text,
    timestamp_cambio timestamp with time zone DEFAULT now()
);


--
-- Name: historial_factura_id_historial_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_factura_id_historial_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_factura_id_historial_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_factura_id_historial_seq OWNED BY public.historial_factura.id_historial;


--
-- Name: historial_orden; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_orden (
    id_historial bigint NOT NULL,
    id_orden_pedido integer NOT NULL,
    timestamp_accion timestamp with time zone DEFAULT now() NOT NULL,
    actor_user_id uuid NOT NULL,
    rol_actor public.app_role NOT NULL,
    fase_anterior public.fase_orden_enum,
    fase_nueva public.fase_orden_enum NOT NULL,
    estatus_nuevo public.estatus_orden_enum,
    accion_clave text NOT NULL,
    observaciones text
);


--
-- Name: historial_orden_id_historial_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.historial_orden ALTER COLUMN id_historial ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.historial_orden_id_historial_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicio (
    id_servicio bigint NOT NULL,
    nombre_servicio character varying NOT NULL,
    codigo_servicio character varying,
    ticon integer
);


--
-- Name: COLUMN servicio.ticon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servicio.ticon IS 'Código de integración con sistema externo TICON (opcional)';


--
-- Name: id_servicicio_id_servicio_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.servicio ALTER COLUMN id_servicio ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.id_servicicio_id_servicio_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: linea_servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.linea_servicio (
    id_linea_detalle integer NOT NULL,
    id_operador integer NOT NULL,
    id_plan integer NOT NULL,
    id_apn integer NOT NULL,
    permanencia character varying(50),
    clase_cobro public.clase_cobro,
    cantidad_linea integer
);


--
-- Name: lineaservicio_id_linea_detalle_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.linea_servicio ALTER COLUMN id_linea_detalle ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.lineaservicio_id_linea_detalle_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: operador; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operador (
    id_operador integer NOT NULL,
    nombre_operador character varying(50) NOT NULL
);


--
-- Name: operador_id_operador_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.operador_id_operador_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: operador_id_operador_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.operador_id_operador_seq OWNED BY public.operador.id_operador;


--
-- Name: orden_counter_month; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orden_counter_month (
    yy smallint NOT NULL,
    mm smallint NOT NULL,
    last_num integer DEFAULT 0 NOT NULL
);


--
-- Name: orden_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orden_pedido (
    id_orden_pedido integer NOT NULL,
    consecutivo integer NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    fecha_modificacion timestamp with time zone,
    id_cliente integer NOT NULL,
    id_proyecto integer,
    id_clase_orden integer,
    observaciones_orden text,
    id_tipo_pago integer,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    fase public.fase_orden_enum DEFAULT 'comercial'::public.fase_orden_enum NOT NULL,
    estatus public.estatus_orden_enum DEFAULT 'abierta'::public.estatus_orden_enum NOT NULL,
    consecutivo_code text,
    orden_compra character varying,
    id_tipo_servicio bigint,
    id_ingeniero_asignado uuid,
    updated_by uuid,
    estado_validacion_pago public.estado_validacion_pago_enum,
    medio_pago public.medio_pago_enum,
    condiciones_pago public.condiciones_pago_enum,
    pago_flete public.pago_flete_enum,
    observaciones_financieras text
);


--
-- Name: COLUMN orden_pedido.observaciones_financieras; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orden_pedido.observaciones_financieras IS 'Observaciones del área financiera';


--
-- Name: orden_produccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orden_produccion (
    id_orden_produccion integer NOT NULL,
    numero_produccion character varying(60),
    fecha_produccion timestamp with time zone,
    observaciones_produccion text,
    id_orden_pedido integer NOT NULL,
    estado_orden_produccion public.estado_produccion_enum,
    recibido_en_produccion boolean DEFAULT false NOT NULL,
    fecha_ingreso_produccion timestamp with time zone,
    fecha_salida_produccion timestamp with time zone,
    recibido_por uuid
);


--
-- Name: ordenpedido_consecutivo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orden_pedido ALTER COLUMN consecutivo ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ordenpedido_consecutivo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ordenpedido_id_orden_pedido_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ordenpedido_id_orden_pedido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ordenpedido_id_orden_pedido_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ordenpedido_id_orden_pedido_seq OWNED BY public.orden_pedido.id_orden_pedido;


--
-- Name: ordenproduccion_id_orden_produccion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ordenproduccion_id_orden_produccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ordenproduccion_id_orden_produccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ordenproduccion_id_orden_produccion_seq OWNED BY public.orden_produccion.id_orden_produccion;


--
-- Name: permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission (
    perm_code text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan (
    id_plan integer NOT NULL,
    id_operador integer NOT NULL,
    nombre_plan character varying(100) NOT NULL
);


--
-- Name: plan_id_plan_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plan_id_plan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plan_id_plan_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plan_id_plan_seq OWNED BY public.plan.id_plan;


--
-- Name: producto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto (
    id_producto integer NOT NULL,
    tipo public.tipo_producto_enum NOT NULL,
    nombre_producto character varying(200),
    created_by uuid DEFAULT auth.uid() NOT NULL,
    id_equipo integer,
    id_linea_detalle integer,
    id_accesorio bigint,
    id_servicio bigint
);


--
-- Name: producto_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.producto_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: producto_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.producto_id_producto_seq OWNED BY public.producto.id_producto;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    nombre text,
    role public.app_role DEFAULT 'comercial'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    username text,
    CONSTRAINT username_format_check CHECK ((username ~* '^[a-z0-9._-]{3,32}$'::text))
);


--
-- Name: COLUMN profiles.username; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.username IS 'Username for login (lowercase, 3-32 chars, alphanumeric with ., _, -)';


--
-- Name: proyecto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proyecto (
    id_proyecto integer NOT NULL,
    nombre_proyecto character varying(100) NOT NULL,
    descripcion_proyecto text,
    id_cliente integer NOT NULL,
    nit_cliente character varying NOT NULL
);


--
-- Name: COLUMN proyecto.nit_cliente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.proyecto.nit_cliente IS 'NIT informativo del cliente (sin FK — usar id_cliente para integridad referencial)';


--
-- Name: proyecto_id_proyecto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proyecto_id_proyecto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proyecto_id_proyecto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proyecto_id_proyecto_seq OWNED BY public.proyecto.id_proyecto;


--
-- Name: rbac_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rbac_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor uuid,
    role public.app_role NOT NULL,
    perm_code text NOT NULL,
    allowed_before boolean,
    allowed_after boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: remision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remision (
    id_remision integer NOT NULL,
    numero_remision character varying(50),
    fecha_remision timestamp with time zone,
    id_orden_pedido integer NOT NULL,
    numero_remision_2 text,
    numero_remision_3 text,
    numero_remision_4 text,
    numero_remision_5 text,
    estado_remision public.estado_remision_enum
);


--
-- Name: remision_id_remision_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.remision_id_remision_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: remision_id_remision_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.remision_id_remision_seq OWNED BY public.remision.id_remision;


--
-- Name: responsable_orden; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responsable_orden (
    id_orden_pedido integer NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role public.app_role NOT NULL,
    perm_code text NOT NULL,
    allowed boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tipo_despacho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_despacho (
    id_tipo_despacho integer NOT NULL,
    nombre_tipo character varying NOT NULL,
    requiere_direccion boolean DEFAULT true,
    requiere_transportadora boolean DEFAULT false
);


--
-- Name: tipo_despacho_id_tipo_despacho_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tipo_despacho ALTER COLUMN id_tipo_despacho ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tipo_despacho_id_tipo_despacho_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tipo_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_pago (
    id_tipo_pago integer NOT NULL,
    forma_pago character varying(30) NOT NULL,
    aprobado_cartera boolean,
    plazo character varying(30)
);


--
-- Name: tipo_servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_servicio (
    id_tipo_servicio bigint NOT NULL,
    nombre_tipo_servicio character varying NOT NULL
);


--
-- Name: tipopago_id_tipo_pago_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipopago_id_tipo_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipopago_id_tipo_pago_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipopago_id_tipo_pago_seq OWNED BY public.tipo_pago.id_tipo_pago;


--
-- Name: tiposervicio_id_tipo_servicio_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tipo_servicio ALTER COLUMN id_tipo_servicio ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tiposervicio_id_tipo_servicio_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: transportadora; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transportadora (
    id_transportadora integer NOT NULL,
    nombre_transportadora character varying(100) NOT NULL,
    fecha_transportadora date,
    observaciones_envio text
);


--
-- Name: COLUMN transportadora.fecha_transportadora; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.transportadora.fecha_transportadora IS 'Fecha de alta del transportista en el catálogo';


--
-- Name: transportadora_id_transportadora_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transportadora_id_transportadora_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transportadora_id_transportadora_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transportadora_id_transportadora_seq OWNED BY public.transportadora.id_transportadora;


--
-- Name: apn id_apn; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apn ALTER COLUMN id_apn SET DEFAULT nextval('public.apn_id_apn_seq'::regclass);


--
-- Name: clase_orden id_clase_orden; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clase_orden ALTER COLUMN id_clase_orden SET DEFAULT nextval('public.claseorden_id_clase_orden_seq'::regclass);


--
-- Name: cliente id_cliente; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente ALTER COLUMN id_cliente SET DEFAULT nextval('public.cliente_id_cliente_seq'::regclass);


--
-- Name: factura id_factura; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura ALTER COLUMN id_factura SET DEFAULT nextval('public.factura_id_factura_seq'::regclass);


--
-- Name: historial_factura id_historial; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_factura ALTER COLUMN id_historial SET DEFAULT nextval('public.historial_factura_id_historial_seq'::regclass);


--
-- Name: operador id_operador; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operador ALTER COLUMN id_operador SET DEFAULT nextval('public.operador_id_operador_seq'::regclass);


--
-- Name: orden_pedido id_orden_pedido; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido ALTER COLUMN id_orden_pedido SET DEFAULT nextval('public.ordenpedido_id_orden_pedido_seq'::regclass);


--
-- Name: orden_produccion id_orden_produccion; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_produccion ALTER COLUMN id_orden_produccion SET DEFAULT nextval('public.ordenproduccion_id_orden_produccion_seq'::regclass);


--
-- Name: plan id_plan; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan ALTER COLUMN id_plan SET DEFAULT nextval('public.plan_id_plan_seq'::regclass);


--
-- Name: producto id_producto; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto ALTER COLUMN id_producto SET DEFAULT nextval('public.producto_id_producto_seq'::regclass);


--
-- Name: proyecto id_proyecto; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyecto ALTER COLUMN id_proyecto SET DEFAULT nextval('public.proyecto_id_proyecto_seq'::regclass);


--
-- Name: remision id_remision; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remision ALTER COLUMN id_remision SET DEFAULT nextval('public.remision_id_remision_seq'::regclass);


--
-- Name: tipo_pago id_tipo_pago; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_pago ALTER COLUMN id_tipo_pago SET DEFAULT nextval('public.tipopago_id_tipo_pago_seq'::regclass);


--
-- Name: transportadora id_transportadora; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transportadora ALTER COLUMN id_transportadora SET DEFAULT nextval('public.transportadora_id_transportadora_seq'::regclass);


--
-- Data for Name: accesorio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accesorio (id_accesorio, nombre_accesorio, codigo_accesorio) FROM stdin;
\.


--
-- Data for Name: apn; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.apn (id_apn, id_operador, apn) FROM stdin;
1	2	verticales.movistar.com.co
2	1	internet.claro.com.co
3	3	internet.comcel.com.co
4	1	ath.comcel.com.co
5	1	bancodebogota.comcel.com.co
6	1	bancolbis.claro.com.co
7	1	bbpopular.comcel.com.co
8	1	bbva.claro.com.co
9	1	bismark.comcel.com.co
11	1	bismarkb.claro.com.co
12	1	bismarketb.comcel.com.co
13	1	bismarkfijo.claro.com.co
14	1	bismarkperenco.claro.com.co
15	1	bpopular.comcel.com.co
16	1	credibanco.comcel.com.co
17	1	inssabis.claro.com.co
18	1	inssabis.comcel.com.co
19	1	internet.claro.com.co
20	1	internet.comcel.com.co
21	1	internet.movistar.com.co
22	1	ipfija1.comcel.com.co
23	1	ipfijas.comcel.com.co
24	1	ipfijas1.comcel.com.co
25	1	latcom2.comcel.com.co
26	1	latcom3comcel.com.co
27	1	olimpbis.claro.com.co
28	1	ponal.comcel.com.co
29	1	redebanbis.claro.com.co
30	1	sgcbis.claro.com.co
31	1	static.comcel.com.co
32	1	web.colombiamovil.com.co
33	2	bancopopular.movistar.com.co
34	2	bismark.credibanco.kite
35	2	bismark.movistar.com.co
36	2	bismark.telefonica.com.co
37	2	bismarkalm.movistar.com.co
38	2	bismarkcolombia.telefonica.
39	2	bismarksgc.movistar.com.co
40	2	bistelemetria.movistar.com.co
41	2	internet.movistar.com.co
43	2	verticales.movistar.com.co
42	2	verticales7.movistar.com.co
44	2	verticales3.movistar.com.co
45	5	m2m.tele2.com
47	4	athbismark.tigo.com.co
48	4	m2mco.tigo.com
49	6	internet.wom.com.co
\.


--
-- Data for Name: clase_orden; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clase_orden (id_clase_orden, tipo_orden) FROM stdin;
1	Venta
2	Renta
3	Arriendo
4	Garantia
5	Prueba
6	Prestamo
\.


--
-- Data for Name: cliente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cliente (id_cliente, nit, nombre_cliente) FROM stdin;
2113	810002601	M.P.C. Y ASOCIADOS SAS
2114	819003851	DIALNET DE COLOMBIA S.A.  E.S.P.
2115	890926766	CI BANACOL S.A.
2116	800144355	TELESENTINEL ANTIOQUIA LTDA
2117	800112434	DHS ASOCIADOS LTDA
2118	800040390	APUESTAS DE CORDOBA S.A.
2119	901715154	EVSY COLOMBIA SAS
2120	900989916	TECEP SAS
2121	800101932	FLORES EL CIPRES S.A.S.
2122	830121521	SERVICIOS SEGURIDAD STAR DE COLOMBIA LTDA
2123	800184195	BUREAU VERITAS COLOMBIA LTDA
2124	800248778	LATCOM S.A.
2125	900346223	ITERRA S.A.S.
2126	13923224	FERNANDEZ JAIMES HUGO ALBERTO
2127	830124778	QUICK HELP S.A.S.
2128	900619003	LOCALIZAMOS TSA S.A.S.
2129	900113460	TASPEX LTDA.
2130	811013161	PROLINCO S.A.
2131	901377342	IBERTEC S.A.S.
2132	890205176	ALCALDIA MUNICIPAL DE FLORIDABLANCA
2133	900501143	GPS 24 S.A.S.
2134	900516608	INVERSIONES PHOENIX S.A.S.
2135	860002095	CARULLA VIVERO S.A.
2136	900356296	C.P.C INGENIERIA Y MANTENIMIENTO SAS
2137	1121859000	HERNANDEZ VARELA DIEGO ALEJANDRO
2138	807005005	PROACTIVA ORIENTE S.A. ESP
2139	830141109	TRACKER DE COLOMBIA SAS
2140	900081208	RM&SS CONSULTORES LTDA
2141	901072249	CONEXA IT S.A.S.
2142	76274794	DESERT POINT SPA
2143	23496968	LAGOS ARANDA LUZ CONSUELO
2144	900542743	PROSEGUR GESTION DE ACTIVOS COLOMBIA S.A.S.
2145	900462621	XINAPSYS S.A.S.
2146	900728210	HELIOS CONSULTING S.A.S.
2147	900166687	CONTINENTAL GOLD LTD
2148	900601034	LOGIRASTREO S.A.S.
2149	900093969	ANDES WIRELESS LTDA
2150	800251163	OLEODUCTO CENTRAL S.A.
2151	1005335811	PIMIENTO VELASCO KAREN YURLEY
2152	860028373	ESTACION DE SERVICIO ESSO
2153	890331389	SEGURIDAD DIVISAR LTDA
2154	800093320	PROYECTOS DE INGENIERIA S.A. PROING S.A.
2155	800007813	VANTI  S.A. ESP
2156	901260435	CONNECTE S.A.S.
2157	826002588	PROFEC LTDA
2158	1098131704	CARRILLO CARDENAS JOSE GREGORIO
2159	901251379	CYS MATERIALES ELECTRICOS S.A.S.
2160	830513773	APPLUS NORCONTROL COLOMBIA LIMITADA
2161	34002395	VELASQUEZ ECHEVERRI LUISA FERNANDA
2162	900537202	HWDECO S.A.S.
2163	830510717	SURCOLOMBIANA DE GAS S.A. ESPE - SURGAS S.A. ESP
2164	890200919	GAS DE SANTANDER S.A. ESP
2165	900170350	T&S ELECTRONICA E.U.
2166	860002576	GENERAL DE EQUIPOS DE COLOMBIA S.A. GECOLSA
2167	900236800	SEGURTRAX S.LTDA
2168	900846163	INSTALACIONES TECNICAS GPS S.A.S.
2169	1031157791	ROJAS LEON DANIELA
2170	900493550	ORBIT SOLUTIONS S.A.S.
2171	830036645	SERVIBANCA S.A.
2172	901028377	SMARTRACK GROUP S.A.S.
2173	900140792	SISFO.EXE S.A.S.
2174	800237731	TELEVIGILANCIA LTDA PROTECCION Y SEGURIDAD
2175	901176940	IOTEC SOLUCIONES SAS
2176	93348789	PERDOMO REYES RODRIGO
2177	900612825	LOGISTICA Y SEGURIDAD LOGITRACK S.A.S.
2178	890204162	SEVICOL LTDA
2179	1080900644	GOMEZ BENAVIDES DAVID ESTEBAN
2180	860529301	CIBERGENIUS S.A.
2181	830501341	COPYTEL DEL CARIBE ESTRADA PEÑALOZA S. A.S.
2182	890104633	UNIVERSIDAD SIMON BOLIVAR
2183	830076606	CORPORACION SOLUCIONES ENERGETICAS INTEGRALES S.A.
2184	900427611	LSC SISTEMAS ELECTRONICOS DE CONTROL SAS
2185	890500726	COLGAS S.A. ESP
2186	824001126	INGENIERIA SOFTWARE & COMPUTADORES S.A.S.
2187	7697594	OROZCO NOREÑA HECTOR HAMID
2188	900151158	PROTECCION INTEGRAL E.U.
2189	13926239	ESTUPIÑAN RODRIGUEZ EDGAR
2190	1014252607	PEÑA GALINDO ELVIS FEGALY
2191	900691219	TELESTONE COLOMBIA TECHNOLOGY NETWORKS S.A.S.
2192	816003879	CONENERGIA S.A. - E.S.P.
2193	890929497	MAPER S.A.
2194	900462957	PRODUCCIONES INDUSTRIALES ESPERANZA S.A.S.
2195	860034133	BANCO GRANAHORRAR
2196	14899932	RENTERIA SCARPETTA ANDREY JULIAN
2197	69028060	ROSERO CAJIAO GEOVANNA VICTORIA
2198	891800111	DIACO S.A.
2199	820003419	ECOSS LTDA
2200	891400754	C. Y P. DEL R. S.A.
2201	80158292	OSORIO BAQUERO IVAN MAURICIO
2202	1115912129	GUANEME LANCHEROS MARIA CUSTODIA
2203	79325373	CARLOS ZAMBRANO FLOREZ
2204	901203041	SONENSOL SAS
2205	830109034	INATECH S.A.S.
2206	900062828	MER INFRAESTRUCTURA COLOMBIA LTDA
2207	800232762	TELECARS S.A.
2208	811012753	COINSI S.A.S.
2209	900728375	SISTEMAS SATELITALES S.A.S.
2210	901077489	APPEN FREE S.A.S.
2211	812002183	SEGURIDAD ELECTRONICA DEL CARIBE LTDA
2212	805010599	TRANSOCCIDENTE S.A. E.S.P.
2213	84450009	ALARMAS JM SANTA  MARTA
2214	901863359	EIKONN S.A.S.
2215	901109520	AXUM GROUP S.A.S.
2216	830141369	INSTRU ELECTRONIC COLOMBIA S.A.
2217	800070868	DISCOUNT ELECTRONICS LTDA
2218	800092094	SERVICIOS GENERALES ASESORES LTDA SEGAL LTDA
2219	900810031	RIANSORI S.A.S.
2220	830120413	VIGIA ELECTRONIC DE COLOMBIA S.A.S.
2221	9076895	ARANGO GONZALEZ JOHN JAIRO
2222	901471069	FENIX SATELITAL COLOMBIA S.A.S
2223	820004735	INCUBADORA DE EMPRESAS DEL ORIENTE INCUBAR BOYACA
2224	811038520	VELPA SOLUCIONES INTEGRALES S.A.
2225	830123360	MEDER S.A.
2226	860005108	EXPRESO BOLIVARIANO S.A.
2227	890910354	CELSA S.A.S.
2228	900712051	SOLUCIONES DE INGENIERIA AHOENERGY S.A.S.
2229	900250707	VICELTAS LTDA
2230	820000708	MONITORING LTDA
2231	94284105	GIRALDO HERNANDEZ ALEXANDER
2232	800155572	OCCEL S.A.
2233	830006404	HUMANA VIVIR S.A.  EPS ARS
2234	901506480	INTETRON SAS
2235	901562836	ALTERNATIVA E INGENIERÍA S.A.S
2236	900027618	UNION TEMPORAL QUIMBAYA TELEMETRIA LTDA
2237	830077651	CARULLA TE LLEVA.COM
2238	900238438	GROW DATA SAS
2239	900180801	BELLTECH COLOMBIA S.A.
2240	890100251	CEMENTOS ARGOS S.A.
2241	900732299	COMPAÑIA DE EMPAQUES INTERNACIONAL S.A.S.
2242	900129311	H&M TECNOLOGIES Y CIA S en C
2243	1022333478	CAMACHO ALDANA CRISTIAN JULIAN
2244	900162691	PIVA SECURITY E.U.
2245	900340064	ALTEC TECHOLOGY S.A.S.
2246	890212433	CORP. UNVERSITARIA DE INVESTIGACION Y DESARROLLO
2247	830031182	BISMARK COLOMBIA S.A.S.
2248	900602888	SIMYCO S.A.S.
2249	830106318	STEEL SEGURIDAD PRIVADA LTDA
2250	900428538	PROSEGUR PROCESOS S.A.S.
2251	800143407	GOU PAYMENTS S.A EASPBV
2252	900711074	SKG TECNOLOGIA SAS
2253	822002315	SEGURIDAD JANO LTDA
2254	16944068	PEREZ CARLOS ANDRES
2255	900339664	COMSATELITES GPS MOVIL S.A.S.
2256	901861268	INTEGRA TECH SAS
2257	900386700	IP SYSTEM S.A.S.
2258	900275680	I.C.S. DE COLOMBIA S.A.S.
2259	891101577	ALCANOS DE COLOMBIA S.A. E.S.P.
2260	900199094	CONSTRUCCIONES EN ING. Y SOL. INTEGRALES COISI LTD
2261	900013074	RASTREO Y LOCALIZACIÓN SATELITAL RILSA S.A.
2262	805029521	J K TECNICA E.U.
2263	812001153	E.L.E.C. S.A.
2264	901249413	AUTECO MOBILITY S.A.S.
2265	900534416	PREVINET S.A.S.
2266	890704021	ORGANIZACION PAJONALES S.A.
2267	901347595	TELEMETRIA INTELIGENTE S.A.S.
2268	46381321	MONTAÑA ACEVEDO ALEJANDRA CATHERINE
2269	860007386	UNIVERSIDAD DE LOS ANDES
2270	901050823	INNOVASOFT GPS SOLUCIONES TENCOLOGICAS S.A.S.
2271	900694957	TECNOLOGIA SEGURA S.A.S.
2272	900138726	WIDETECH SAS
2273	20292636	FORERO DE PASCUALI SOLEDAD
2274	800172544	MONTAJES DE INGENIERIA DE COLOMBIA MICOL S.A.
2275	800179218	COOVICOMBEIMA
2276	16797544	TROMPA LASSO FABIAN GUILLERMO
2277	860002190	SHELL COLOMBIA S.A.
2278	890900844	CALCAREOS INDUSTRIALES Y AGRICOLAS LTDA
2279	900146994	TACTICAL INT S.A.S.
2280	64871760	ACOSTA MORENO LUCY MARCELA
2281	79789863	PARRA GARZON CARLOS ALBERTO
2282	892200328	DISELECSA - DISTRIBUCIONES ELECTRICAS DE SABANAS L
2283	900007044	BLANCO Y NEGRO MASIVO S.A.
2284	900109287	GENELCO LTDA
2285	1088309717	LOPEZ VELASQUEZ JHON ESTEBAN
2286	900360646	GROUND ELECTRONICS S.A.S.
2287	900782409	DIGIOCA COLOMBIA S.A.S.
2288	900832413	GENERCOMERCIAL S.A.S. E.S.P.
2289	800014875	TELESENTINEL LTDA
2290	900689424	GLOBAL KORBAN S.A.S.
2291	900673304	EGC CONSULTORES Y ASESORES S.A.S.
2292	800090427	INTERSEG S.A.
2293	901386253	PROMAING S.A.S. BIC.
2294	800059514	SOVIP LTDA
2295	805020072	MONITOREAR LTDA
2296	900479693	GLOBAL SKY DE COLOMBIA SAS
2297	900552394	PHAXSI SOLUTIONS SAS
2298	830051928	DON MAIZ S.A.S
2299	900306309	ARIS MINING SEGOVIA
2300	1026146676	GOMEZ RESTREPO EDWIN JOHAN
2301	860006537	COMPAÑIA TRANSPORTADORA DE VALORES PROSEGUR DE COL
2302	900677495	GLEND ELECTRICAL S.A.S.
2303	4444126	SIXBELL
2304	830058148	PROACTIVA COLOMBIA S.A.
2305	16379723	SUAREZ POVEDA WILLIAM FRANCISCO
2306	813002696	GAS NEIVA S.A. E.S.P.
2307	900824354	CCG ENERGY SAS ESP
2308	890705397	MOLINOS LOS ANDES S.A.S.
2309	860025900	ALPINA PRODUCTOS ALIMENTICIOS S.A.
2310	901911004	PREDADOR 360 GPS SAS
2311	900262482	UTEN SECCIONAL POPAYAN
2312	830032514	TELEDIFUSION SMART SOLUTIONS S.A.
2313	860520097	GUARDIANES COMPAÑIA LIDER DE SEGURIDAD LTDA
2314	900103215	ACSECO LTDA
2315	900079499	SYSCOM TELECOM S.A.
2316	830083756	ACJ HIGH VOLTAGE S.A.S..
2317	900409984	CULTIVOS CASABLANCA SAS
2318	900141516	P.J. TECH S.A.
2319	1030538198	BERMUDEZ QUINAYA EDDY GONZAO
2320	800080177	METROAGUA S.A. E.S.P.
2321	900494060	HYDROCARE S.A.S.
2322	900482757	ELECTRICAS DE MEDELLIN - COMERCIAL S.A.
2323	800170118	PROMOTORA DE GASES DEL SUR S.A. ESP
2324	830079821	INVERSIONES PROMEGA S.A.S.
2325	830120426	ADVANCE CONTROLES COLOMBIA S.A.S.
2326	891900129	INGENIO SANCARLOS S.A.
2327	5165677	PARODY JIMENEZ JESUS ENRIQUE
2328	860068055	TELEFONICA DATA COLOMBIA S.A.
2329	900304040	DESARROLLO Y OPTIMIZACION S.A.S.
2330	814003050	SUPERGAS DE NARIÑO S.A. ESP
2331	52053427	GOMEZ PRADA LUZ ADRIANA
2332	900963722	GLOBAL SYSTEM SECURITY COLOMBIA S.A.S.
2333	860530709	CASA ANDINA LTDA
2334	20011083554	UNAVCO Inc.
2335	900454287	NEGAWATT S.A.S.
2336	891701004	AGROINDUSTRIAL PALMACEITE SAS
2337	800130907	SALUD TOTAL EPS
2338	13720532	ORTIZ JAIMES ALEXANDER
2339	830088250	MONITOREO.NET DE COLOMBIA LTDA
2340	900055755	MARTINEZ & MARTINEZ S EN C
2341	805021626	WATTS INGENIERIA S.A.S.
2342	901594321	EAGLE GPS  SAS
2343	891800213	CAJA DE COMPENSACION FAMILIAR DE BOYACA COMFABOY
2344	900231595	PROCESS SOLUTIONS S.A.S.
2345	804001062	RUITOQUE S.A. ESP
2346	900825557	SEGUITEL S.A.S.
2347	900517365	TRACKING V.I.P S.A.S.
2348	4830948	URIBE FLORES CARLOS ALBERTO
2349	860013771	AJOVER S.A.
2350	900101824	SECURITY SHADAI LTDA
2351	860001963	PROTELA S A
2352	80027582	PARAGUAY SECURITY S.A.
2353	800031930	MARNELL SECURITY LTDA
2354	900269345	TELEAGENCIA NACIONAL DE SEGURIDAD SAS
2355	900506341	PROTECTIVA DE SEGURIDAD E INTEGRACION DE VIGILANCI
2356	901137208	PL SIG SAS
2357	860058956	FIDUCIARIA SKANDIA S.A.
2358	900510539	SERVICIOS CARVAJAL S.A.S.
2359	860071224	SOCOL ENERGY SAS
2360	900127377	ICOTEC COLOMBIA LTDA
2361	830055791	AXITY COLOMBIA SOCIEDAD POR ACCIONES SIMPLIFICADA
2362	830015680	VIMARCO LTDA INVESTIGACION
2363	891180001	ELECTRIFICADORA DEL HUILA S.A. ESP
2364	1030622239	CUBIDES ACOSTA LINA MARIA
2365	1020758556	PRIETO NIÑO JOSE MANUEL
2366	830006021	CONCESIONES CCFC SAS
2367	830111942	GMT VARITEC DE COLOMBIA LTDA
2368	901762199	NEODY ENERGY GROUP SAS
2369	74327768	ALARMAS Y COMUNICACIONES SHADAI
2370	830007540	ACT CONSULTORES LTDA
2371	901056672	SOLOINTEGRAL S.A.S.
2372	900297772	INVERSIONES TECNOLOGICAS DE AMERICA S.A.
2373	890800128	CHEC S.A. E.S.P.  BIC
2374	830109407	CARRUCA LTDA
2375	72157874	ECHEVERRIA RUZ RAFAEL ERNESTO
2376	860500630	INGENIERIA Y SERVICIOS ESP. EN COMUNICACIONES S.A.
2377	901403669	VIRTUAL NETWORK S.A.S.
2378	900450769	SISTELCO DE OCCIDENTE SAS
2379	830033451	SCHLUMBERGER OMNES DE COLOMIBA S.A.
2380	800194984	SEMA S.A.
2381	4444106	GUANGZHOU ROBUSTEL TECHNOLOGIES CO. LIMI
2382	900489210	RASTRELITAL S.A.S.
2383	830092078	IT DIRECTO SAS
2384	809005743	SEGURIDAD PRIVADA AGUIALARMAS LTDA
2385	800155100	INGEOCIM S.A.S.
2386	16203073	MURGUEITIO LUIS FERNANDO
2387	860351432	PRODUCEL INGENIEROS SAS
2388	800226766	PROMIORIENTE S.A. ESP
2389	79788319	MEZA RODOLFO
2390	1065566413	QUINTERO VEGA FLOR
2391	901135887	ISEMEC Y COMPAÑIA SAS
2392	860041227	SONIDO INDUSTRIAL COLOMBIANO LTDA
2393	802025044	INTELPRO S.A.S.
2394	901251752	MACONDO SYSTEMS S.A.S.
2395	79647506	ESCANDON SILVA SILVESTRE
2396	5268971	SALAZAR RUIZ JHON ASDRUBAL
2397	901373806	PROTID INGENIEROS S.A.S.
2398	901557898	ACR INNOVATION S.A.S.
2399	900363977	UNICORP S.A.S
2400	900351736	DREAM REST COLOMBIA S.A.S.
2401	900210464	EMPROCOL
2402	901167267	JM TRACKING S.A.S.
2403	80064701	ROZO ROJAS JOSE GILBERTO
2404	80425167	PRIETO CASTILLO ALVARO GONZALO
2405	900308084	MENTE SIMPLE S.A.S.
2406	901426173	RASTREAMOS CA S.A.S.
2407	828000191	EMSERPUCAR LTDA
2408	86086933	ORTEGON JONATHAN
2409	822006851	ALARMA SEGURA LTDA
2410	830037248	CODENSA S.A. - E.S.P.
2411	802008919	INNECARIBE S.A.S.
2412	900388291	TRILOGY SOFTWARE S.A.S.
2413	900209614	COLTRACK SAS
2414	79573493	URBINA SAMUEL
2415	800121118	ELEMENTOS ELECTRICOS S.A.S.
2416	8508723	CARRANZA REVUELTAS ALEXANDER
2417	901275958	SECURE GPS GLOBAL S.A.S.
2418	901117940	DESAAP SAS
2419	830043941	SERGEMAQ SAS
2420	802020036	V.P. GLOBAL LTDA
2421	900682022	MECATRONIC SYSTEMS SAS
2422	900624220	TECNOLOGIA IMPLENTACION INTEGRACION Y COMU. S.A.S
2423	800083425	I.D.T. ELECTRIC LTDA
2424	900014447	INGEBYTE LTDA
2425	06019017970841	CRAE ELECTRONICA. S. DE R.L. DE C.V.
2426	900742133	DISTRIBUIDORA DE COMUNICACIONES DICOM S.A.S.
2427	901432582	EVOLTI COMPANY SAS BIC
2428	901493936	SEGUIMIENTO ACTIVO S.A.S.
2429	900564496	SOLUTRAFFIC INGENIERIA S.A.S.
2430	901434399	SILVER SECURITY LTDA
2431	830145636	TELERASTREO COMUNICACIONES S.A.S.
2432	800048961	SERVICIO DE VIGILANCIA BOYACA LIMITADA SERVIBOY LT
2433	891857745	WMOH Y CIA. LTDA
2434	94-3338019	SIERRA WIRELESS AMERICA INC
2435	860046201	FORTOX S.A.
2436	830070202	EDEX DE COLOMBIA LTDA
2437	900823024	VIGILANCIA Y SEGURIDAD 365 LIMITADA
2438	900054958	DISTRONICS INGENIERIA LTDA
2439	891104871	SU CHANCE S.A.
2440	900483170	INNOVATE SECURITY S.A.S.
2441	890900317	AUTECO S.A.S.
2442	18518315	GARCIA RESTREPO JULIAN ANDRES
2443	900387481	TELEMETRY AND SECURITY SYSTEMS S.A.S.
2444	80882057	ZABALA AVILA JUAN PABLO
2445	890900608	ALMACENES EXITO S.A.
2446	860007759	COLEGIO MAYOR DE NUESTRA SEÑORA DEL ROSARIO
2447	901765535	TELEMETRY AND SECURITY SYSTEMS INTERNATIONAL S.A.S
2448	901014940	FLYNET SAS
2449	900199031	SERVICIOS ESPECIALIZADOS EN SEGURIDAD DE COLOMBIA
2450	901880722	LOGITRACS SAS
2451	900283350	GEOPLANEACION LTDA
2452	830025968	AUTOMATIZACION AVANZADA S.A.
2453	800006984	CALI SOFTWARE S.A.
2454	900371846	P & P INGENIEROS S.A.S.
2455	830012595	BAWER COMPANY S.A.S.
2456	900149210	AB COMERCIAL S.A.S.
2457	830008146	ANIXTER COLOMBIA SALES
2458	890805453	TECNOLOGIA EN CUBRIMIENTO S.A.
2459	900509375	SOLUCIONES INNOVADORAS EN TECNOLOG EMPRESARIAL SAS
2460	901395630	INGNOVUS TECHNOLOGIES S.A.S.
2461	800130937	ESCOLTAR LTDA
2462	830055579	MONITRONIC LTDA
2463	800188810	REPRESENTACIONES POLIMES SAS
2464	860512237	COLPATRIA SALUD
2465	900034273	EXTREME TECHNOLOGIES S.A.
2466	1130656569	MARTINEZ LOPEZ ELKIN JOSE
2467	13478531	PEREZ ALFONSO SOTERO
2468	800058709	GRUPO LOPERA INGENIEROS SA
2469	41544994	NIÑO DE TOVAR MARTHA CECILIA
2470	B54728340	TERRAL MTR SL
2471	900410244	E.S.O. INGENIERIA SAS
2472	800245520	BRITISH AMERICAN TOBACCO
2473	900165143	INGELET S.A.S.
2474	79852119	NONATO MORA JAMILTON
2475	860069378	CERRO MATOSO S.A.
2476	890203088	COOPCENTRAL LTDA
2477	900377283	NMV SOLUCIONES S.A.S.
2478	901467444	G2 RASTREO SAS
2479	830125972	SEÑALES VIVAS S.A.
2480	811007280	SERACIS LTDA.
2481	900506002	WM SAS
2482	901416116	VIMARCO ING TECNOLOGIA S.A.S.
2483	800152028	COOPTMOTILON LTDA
2484	800211883	MINA LA MARGARITA S.A.S.
2485	800096494	FLORES DEL HATO S.A.S.
2486	901143498	DEFENCE COLOMBIA SAS
2487	32423189	VASQUEZ DE CASTAÑO MARIA TERESA
2488	830113630	TERMOFLORES S.A.S. E.S.P.
2489	860001710	VANSOLIX S.A.
2490	76487782-9	AMC CHILE SPA
2491	830072647	SEGURIDAD EUROVIC DE COLOMBIA LTDA
2492	860017055	PRODUCTOS ALIMENTICIOS DORIA S.A.S.
2493	1792058058001	IMEXPALCOM CIA LTDA
2494	900318527	MULTISEGURIDAD SAS
2495	900427417	INGSA S.A.S.
2496	PCO090813PB7	PAGUIMA COMERCIAL S.A. DE C.V.
2497	900553170	EMBOTELLADORA DE LA SABANA S.A.S.
2498	13923241	URIZA POVEDA ARIEL
2499	813006410	DCOM INGENIERIA LTDA
2500	830023404	ACT TELEMATICA LTDA
2501	52261567	MURCIA PIÑEROS JOISA
2502	900737079	HENKEL INTERNACIONAL SAS
2503	1013606883	VARGAS TAUTIVA CAMILO ANDRES
2504	860020369	SU OPORTUNO SERVICIO LTDA
2505	901300586	ORANGE IDEAS S.A.S.
2506	900337177	PROTEGER SEGURIDAD INTEGRAL LTDA.
2507	900671483	CONSORCIO PIPELINE MAINTENANCE ALLIANCE
2508	900330522	AVANT TECHNOLOGIES REGION ANDINA LTDA
2509	830066747	MAC TOOLS SAS
2510	900477123	GPS MOVIL TRACKS S.A.S.
2511	900429784	ERICTEL M2M COLOMBIA S.A.S.
2512	890200211	COTRANS - COOPERATIVA DE TRANSPORTES
2513	830014193	THOMAS SEGURIDAD INTEGRAL LTDA
2514	830100385	COMUNICACIONES Y SISTEMAS INTEGRALES LTDA
2515	900570262	GASES ANDINOS DE COLOMBIA GASACOL S.A.S. E.S.P.
2516	830039295	INSSA S.A.S.
2517	890939013	VIGILAR COLOMBIA LTDA
2518	899999115	ETB S.A. ESP
2519	1026550870	ROMERO BAQUERO JEISSON GIOVANNY
2520	900627524	SEGURIDAD Y EQUIPOS DE ALTA TECNOLOGIA S.A.S.
2521	860006187	TRANSPORTES ALIANZA S.A.
2522	819006372	CADIMOTO NAUTICA S.A.S.
2523	830065212	JUEGOS & AZAR INVERSIONES S.A.
2524	860000580	MERCK S.A.
2525	830059918	INTEGRAR S.A.
2526	802024688	GRUPO ZAMBRANO S.A.S.
2527	901668793	MUNDIAL DE CAMARAS SAS
2528	900569852	IPROJECTS SAS
2529	860002127	INDUSTRIA COLOMBIANA DE LLANTAS S.A.
2530	901405671	CIMA GPS SAS
2531	08019017906700	Diseño Construccion y Maquinaria S.A.  (DICOMA SA)
2532	860523408	SEGURIDAD NAPOLES LTDA
2533	900498867	MULTIMAX DE COLOMBIA S.A.S.
2534	1016083652	ZAMORA LUISA FERNANDA
2535	5607823	ROJAS ROJAS HERNANDO
2536	901045598	SYSTEM777 SAS
2537	800042175	PRODUCTOS QUIMICOS ANDINOS S.A.S.
2538	890114642	ARIS MINING MARMATO S.A.S.
2539	901014745	INGNOVAC S.A.S.
2540	901521429	ALLIANCE HIGH TECH SAS
2541	830004316	HOLDING SEGTAL LTDA
2542	860511107	ACERTA LTDA
2543	13923845	VARGAS QUINTERO MARIO
2544	900771441	ISEMEC LTDA
2545	901402595	SELTEG ID S.A.S.
2546	79595180	PONCE GARCIA LUIS ALFREDO
2547	899999063	UNIVERSIDAD NACIONAL DE COLOMBIA
2548	807008068	EMSITEL LTDA
2549	804011268	TELECOMUNICACIONES CYBERTEL LTDA
2550	830081479	COEN SECURITY LTDA
2551	80096677	PEÑA SANCHEZ JHON
2552	1118552789	GUERRERO MORA IVAN FERNEY
2553	900190917	PEVEECKA SOCIEDAD ANONIMA
2554	30739936	BENAVIDES FLORES IRMA DEL SOCORRO
2555	830096333	SOLUCIONES TECNOLOGIAS DIVISION SISTEMAS LTDA
2556	900733354	NUTRIMEZCLAS Y ACEITES SAS
2557	900203781	GEINSYS LTDA
2558	900677732	QI ENERGY S.A.S. E.S.P.
2559	804007055	K-2 INGENIERIA S.A.S.
2560	900606867	LOGYSTECH COLOMBIA S.A.S.
2561	900551908	TEI SOLUCIONES INTELIGENTES S.A.S.
2562	16550623	PULGARIN MOLINA OSCAR FERNANDO
2563	900047136	CONSTRUCCIONES ORLANDO VELANDIA JUNCA SAS
2564	890705340	LAS AGUILAS LTDA
2565	830025600	RASTREO SATELITAL S.A.S.
2566	88310869	ESCOBAR CASTELLANOS WILMAN
2567	900492233	SAT CONTROL S.A.S.
2568	53123976	ROJAS VARGAS MONICA ANDREA
2569	901253015	EQUIRENT VEHICULOS Y MAQUINARIAS SAS
2570	890101412	TRASALIANCO S.A.
2571	890929951	CONCRETOS Y ASFALTOS S.A.
2572	805025964	CREDIVALORES-CREDISERVICIOS S.A.
2573	901167378	AMCO ANDINO SAS
2574	900259195	AGRICOLA UBERABA S.A.
2575	900456037	TRACKLINE S.A.S.
2576	1075246923	BARRERO DIAZ ANDRES FELIPE
2577	901456609	TENSOR S.A.S.
2578	900904090	TELINTECH DE COLOMBIA S.A.S.
2579	800186176	LSI INGENIERIA ELECTRONICA LTDA
2580	800149871	ELECMER SOCIEDAD POR ACCIONES SIMPLIFUCADA
2581	860531552	ENERCOM S.A.
2582	900360118	CITY SEGURIDAD S.A.S.
2583	890936071	AGROSAN S.A.
2584	900170865	TRANSBANK LTDA
2585	79962448	PRIETO WILLIAM IVAN
2586	900851451	GRUPO EMPRESARIAL SOLUCIONES TECNOLOGICAS S.A.S.
2587	901123449	DATECSA ENERGIA S.A.S.
2588	901279457	C-TRACKER GPS SAS
2589	830072297	QUIMBAYA TELEMETRIA S.A.S.
2590	900250271	PROYECTOS URBANISTICOS GUTIERREZ LTDA
2591	900805947	INNOVACIONES TECNOLOGICAS CARGACONTROL S.A.S.
2592	860005216	BANCO DE LA REPUBLICA
2593	890204396	MOLINOS SAN MIGUEL S.A.S.
2594	1015995333	BRICEÑO CASTRO WILSON
2595	901613213	ELECTRONIC SERVICES SECURITAS COLOMBIA SAS
2596	901873425	CELTRACK S.A.S
2597	900359527	CONJUNTO CAMPESTRE SANTA CECILIA V
2598	900311442	SERVICAM SOLUCIONES EN SEGURIDAD SAS
2599	901161873	INDUSTRIAS METALICAS IMETAL COLOMBIA S.A.S.
2600	900810859	FARO SOLUCIONES INTEGRALES SAS
2601	900235782	SOLUCIONES ELECTRICAS E INGENIERIA LIMITADA
2602	800125020	SODEAG - S.A. - SOC. DE EMPR. DE  APUESTAS DE GIRA
2603	63359057	DIAZ PEÑA MARIUM
2604	901060665	ENETEL S.A.S
2605	813001177	TELEMONITOREAMOS LTDA
2606	830505339	AGUASCOL ARBELAEZ S.A. ESP
2607	830016046	AVANTEL S.A.S.
2608	890913429	SEGURIDAD TECNICA COLOMBIANA LTDA
2609	900406145	ECO AMERICA S.A.S.
2610	802001831	INDUTRONICA DEL CARIBE S.A.S.
2611	830139893	IMPORTSOLUCIONES S.A.S.
2612	900629844	OPERADORA DE ENTRETENIMIENTO SAS
2613	800233036	METRO ALARMAS LTDA
2614	5678773	ROMERO TORRES CLAUDIO
2615	900439108	ALTRONICA LTDA
2616	901195030	IOTEL COLOMBIA S.A.S.
2617	890304345	ELECTRICOS DEL VALLE S.A.
2618	890210612	CAG S.A.S.
2619	1026267118	SANCHEZ MENDOZA KAREN
2620	890201230	ELECTRIFICADORA DE SANTANDER S.A
2621	900730721	MON-KEY TECH SAS
2622	860034594	SCOTIABANK COLPATRIA S.A.
2623	830099436	ETRA  INTERANDINA S.A.
2624	10033826	MEJIA MELO DIEGO HERNAN
2625	1090447113	CAMACHO QUINTERO MIGUEL ANGEL
2626	805002908	ORGANIZACION MONITOREO AMBIENTAL LTDA
2627	901763204	SEGURIDAD GRICAR LTDA
2628	830510959	TRANSPORTES LAFE S.A.
2629	900118077	B2B CONSULTORIA S.A.S.
2631	900951243	XANTIA-XAMUELS S.A.S. E.S.P.
2632	860029949	DIENES Y CIA S.A.S.
2633	900636731	HIGH SECURITY TRACKING S.A.S.
2634	811019356	EXPLOTACIONES MT S.A.
2635	900279857	ALARMAXX F.L. Y CIA LTDA
2636	900337479	BIONICA PROTECCION S.A.S.
2637	901214960	AO SOLAR S.A.S.
2638	900258177	GLOBENET CABOS SUBMARINOS COLOMBIA SAS
2639	1151968295	MOSQUERA SANCHEZ ESTIVEN
2640	800182042	COMERCIALIZADORA BECOR S.A.
2641	890300279	BANCO DE OCCIDENTE
2642	900414775	STAR SEGUIMIENTO Y CONTROL S.A.S.
2643	900792630	APLICACIONES INTELIGENTES RUIZCON SAS
2644	900278633	ILS LOGISTICA INTEGRAL DE SERVICIOS S.A.
2645	830008194	INTEGRAL ASESORES DE SEGUROS  LTDA
2646	1024512608	GONZALEZ MARCELO HUGO ANDRES
2647	1096953892	PEREZ GOMEZ JAVIER MAURICIO
2648	901072187	SEGURYCAR GPS S.A.S.
2649	811009788	DISTRACOM S.A.
2650	41521280	URIBE MARIA ANGELICA
2651	900010481	M&S ORGANIZACIONES SAS
2652	1030670235	RAMIREZ MONTEALEGRE NICOLAS DANIEL
2653	63394173	VERA JAIMES LUCY
2654	900414114	HOUDING S.A.S.
2655	16918827	SALCEDO ROJAS CARLOS LAUREANO
2656	7707789	MENDEZ LUGO JHON FARID
2657	1191734609001	KRADAC CIA LTDA
2659	31221826	RAMOS ORTEGA MARIA YOLANDA
2660	804009479	ALARMAC LTDA
2661	A201503181120013131	BUZZ SYSTEMS MEXICO SA de CV
2662	900497003	ALIANZA TIC S.A.S.
2663	13922306	ORTIZ BARAJAS SERGIO
2664	819002750	COMPAÑIA DE VIGILANCIA Y SEGURIDAD PRIVADA VIVAC L
2665	800250741	SEGURTRONIC LTDA
2666	830020470	TELEINTE S.A.S.
2667	80852017	QUINTERO ROJAS EDGAR RAUL
2668	800058864	FUNDACION PROGRESO Y CULTURA FUTUR
2669	900593853	ECO-SERVICIOS DE COLOMBIA S.A.S.
2670	900080817	CSI TECHNOLOGY LTDA
2671	1085301770	BARBA MUÑOZ ALEJANDRA KATHERINE
2672	900980686	DLR INGENIERIA S.A.S.
2673	79953374	CANTILLO ARIAS JOSE ALEJANDRO
2674	900134459	TGI S.A. ESP
2675	860001615	AUTOMUNDIAL S.A.
2677	901041718	SIVYTEC PPA COLOMBIA S.A.S.
2678	901162282	INGENIERIA Y SUMINISTROS TIC S.A.S
2679	3277778	CAICEDO DUEÑAS GERSON IVAN
2680	901550593	NUMAR TECHNOLOGIES S.A.S.
2681	900617537	GESTION Y DESARROLLO ELECTRONICO S.A.S.
2682	802011190	GAS NATURAL COMPRIMIDO S.A.S.
2683	830136065	PROCESSA S.A.
2684	805025780	UNIMETRO S.A.
2685	900276770	CNEOG COLOMBIA SUCURSAL COLOMBIA
2686	901622230	SOLUCIONES TECNOLOGICAS AUTOSEGURO S.A.S
2687	860074186	DISICO S.A.
2688	900458771	TECNICONTROLES
2689	1014232109	VELASCO ESPINOSA FABIAN ESTEBAN
2690	800168533	GANADERA MANZANARES S.A.S.
2691	830145888	SUMIELECTRICOS J.E.  E.U.
2692	800196722	TELEGUARDIA LTDA
2693	900857130	ECOSPACE S.A.S.
2694	900986500	TU SOFTWARE SAS
2695	900292966	DISMACOM LTDA
2696	900211457	ITS INFOCOMUNICACION S A S
2697	890939223	O.M.C.  S.A.S.
2698	830009908	DIGITAL DE ALARMAS Y SEGURIDAD LTDA
2699	901366291	REDFOX INTEGRAL SOLUTION S.A.S.
2700	860063875	EMGESA S.A. E.S.P.
2701	13486996	SUAREZ CORREA LUIS AURELIO
2702	900032593	INKCO S.A.S.
2703	900500830	SEKURITEL LTDA
2704	901323579	MANSILLA ORTIZ ENERGIA SOLAR S.A.S.
2705	003849	GEMPLUS INDUSTRIAL S.A. DE C.V.
2706	900719798	SATELIUM S.A.S.
2707	860023264	SECURITAS COLOMBIA S.A.
2708	0502951650	MEDINA HERRERA HECTOR MAURICIO
2709	901352917	PORTRACK S.A.S.
2710	809002625	INTERNACIONAL DE ELECTRICOS S.A.S
2711	900420233	LUIS ROPERO S.A.S.
2712	901454607	SERVICE-TECH SOLUTIONS S.A.S.
2713	900528468	IMTELCOM S.A.S.
2714	900688246	GRUPO EMPRESARIAL AMR S.A.S.
2715	900204109	TELEMETRIA INTEGRAL LTDA
2716	800126325	CORGRANELES S.A.
2717	800147520	COMPEL S.A.
2718	1129570548	MOLINA PASCO CARLOS ANDRES
2719	900041792	FUNDACION MARIANA
2720	900884611	INGEPROY SAS
2721	900463029	ALTEA FARMACEUTICA S.A.
2722	901088480	ZEROO S.A.S.
2723	4444144	SIERRA WIRELESS  INC.
2724	94450857	SIGNOS EDUCACION VIRTUAL
2725	830050633	VERYTEL S.A.
2726	800530005	FALALALA
2727	805000004	SANAMBIENTE S.A.S.
2728	1192817280	JUAN DIEGO PEÑA PADILLA
2729	900767494	EPSILON POWER TELEMATICS SAS
2730	890333105	ANDINA DE SEGURIDAD DEL VALLE LTDA
2731	900103371	INTEGRA SOLUCIONES TECNOLOGICAS LTDA
2732	890927705	SULEASING
2733	900237820	QUANTUM DATA PROCESSING DE COLOMBIA SAS
2734	830032964	INDUSTRIAL COLOMBIA ELECTRONICA LTDA
2735	900606828	CONTROL Y AUTOMATIZACION INDUSTRIAL CONTROLMATICA
2736	860071082	SERVICIO DE VIGILANCIA HORIZONTAL LTDA
2737	800250119	SALUDCOOP EPS
2738	830021842	PURIFICADORES Y FILTROS INTERNACIONAL LTDA
2739	900942627	IGELSAC S.A.S.
2740	901033248	OPERADORA SNACK EXPRESS S.A.S.
2741	830049051	JOHNSON CONTROLS COLOMBIA LIMITADA
2742	900092385	UNE EPM TELECOMUNICACIONES S.A.
2743	900506833	COLTRACKER DE COLOMBIA S.A.S.
2744	900347906	LM SOLUCIONES S.A.S.
2745	900304168	DATATRAFFIC SAS
2746	901603433	GENXAPP S.A.S.
2747	860002962	BANCAFE
2748	901018378	GO SECURITY SAS
2749	890206351	SISTEMAS Y COMPUTADORES S.A.
2750	860007738	BANCO POPULAR
2752	860052064	JUVENIA S.A.
2753	804001081	VEROCO INGENIERIA S.A.S.
2754	802007670	ELECTRIFICADORA DEL CARIBE S.A. ESP
2755	802010910	SISTEMAS INTEGRALES DE SEGURIDAD LTDA
2756	900294833	SEGURIDADES INTELIGENTES SAS
2757	900831237	SSEA SECURITY SAS
2758	1038419145	RAMIREZ ALDANA PAOLA ANDREA
2759	830059699	SATRACK S.A.S.
2760	830067557	INFOTRACK S.A.S.
2761	800136835	CIRION TECHNOLOGIES COLOMBIA S.A.S.
2762	830053800	TELMEX COLOMBIA S.A.
2763	900422798	INFRAESTRUCTURA DIGITAL S.A.S.
2764	860079793	A.C. NIELSEN DE COLOMBIA LTDA
2765	900145668	CLASICA DE SEGURIDAD LIMITADA
2766	830092485	SEGURIRED LTDA
2767	900441996	IMP INGENIERIA MONTAJES Y PROYECTOS S.A.S.
2768	900346481	SOLUCIONES SMS  GPS S.A.S.
2769	830121576	FASE PI LTDA
2770	15505381	ARANGO FORONDA OSCAR MAURICIO
2771	900998707	ECOSUSTENTABLES SAS
2772	33379758	MAHECHA MOLINA JULLIETH PAOLA
2773	901790020	PYLON COLOMBIA SAS
2774	900590590	MN INGENIERIA INTEGRAL S.A.S.
2775	30-70786947-6	NETIO SRL
2776	900926136	CELTRONICA S.A.S.
2777	901188980	EJE SATELITAL S.A.S.
2778	900238775	RASTREO SIGLO XXI S.A.S.
2779	901223743	SIT EXODO S.A.S
2780	900655144	SATELITALES DE COLOMBIA S.A.S.
2781	1045676220	CHAVEZ DACONTE RAFAEL ENRIQUE
2782	900444527	OPTO BUS DE SURAMERICA S.A.S.
2783	80214226	BELTRAN HERNANDEZ JHONNY CAMILO
2784	901151036	COMERCIALIZADORA FQE S.A.S.
2785	800144331	PORVENIR S.A.
2786	800233968	COTECH S.A.
2787	900143749	ARIADNA COMUNICACIONES ESTRATEGICAS S.A.S.
2788	900462517	PROSEGUR SEGURIDAD ELECTRONICA S.A.S.
2789	800019249	DEFENCE SYSTEMS COLOMBIA S.A.
2790	830075976	TYCO SERVICES S.A.
2791	830081475	SECURITY GOLDEN LTDA
2792	901003953	SOLUCIONES EN INGENIERIA Y CONSTRUCCION S.A.S
2793	800205327	INVERSIONES FAGALONI LTDA
2794	805020318	ENIGMA DEVELOPERS SOCIEDAD DE ACCIONES SIMPLIFICAD
2795	79734893	PEREZ ALFONSO MARCO NORBEY
2796	8285124	CASTAÑO YEPES EUGENIO
2797	800112010	PROTELEC S.A.S.
2798	809012701	ENLACES DIGITALES EU
2799	900968320	IT GPS S.A.S.
2800	28386466	GOMEZ BASTO ANA LUISA
2801	13346186	HERNANDEZ LOPEZ LUIS ENRIQUE
2802	901450471	SAFESTART SAS
2803	890904713	COORDINADORA MERCANTIL S.A.
2804	800215592	THOMAS GREG EXPRESS S.A.
2805	901048163	SELF SECURITY SAS
2806	900130943	ATS COLOMBIA S.A.S.
2807	63398227	PARRA MONSALVE YAMILE
2808	900505780	LAN SECURITY NETWORKS S.A.S.
2809	91016685	MEJIA SANCHEZ WILFREDO
2810	1118547326	CRUZ LOPEZ GERMAN AUGUSTO
2811	891200287	COOPERATIVA ESPECIALIZADA SUPERTAXIS DEL SUR LTDA.
2812	899999082	GRUPO ENERGIA BOGOTA S.A. ESP
2813	901067896	RENTING TM SAS
2814	805000206	ATLAS TECNOLOGIA Y CIA LTDA
2815	860514451	CONDIMENTOS Y COMESTIBLES ACOSTA & CIA S EN C
2816	891801317	COBASEC
2817	4372767	BERMUDEZ CARLOS
2818	900952888	IN-NOVA STL S.A.S.
2819	901146260	TRABAJO VEHICULAR SAS
2820	830014769	ASISA OUTSOURCING LTDA
2821	830074852	SELEKTRON SAS
2822	1014184139	VALLEJO VERA NANCI LOREN
2823	33333333	CENTRO DE COMPUTO ALTERNO MOVIL
2824	900104279	XION TECHNOLOGIES & SOLUTIONS LTDA
2825	830058677	IFX NETWORKS COLOMBIA S A S
2826	9145386	VELEZ LIZARAZO LUIS ALBERTO
2827	891303786	SEGURIDAD DE OCCIDENTE LTDA
2828	900838582	SERVITRANS BONILLA S.A.S.
2829	80425593	SANDOVAL JAVIER
2830	844004576	EMPRESA DE ENERGIA DEL CASANARE S.A. ESP
2831	800074033	COMPAÑIAS ASOCIADAS DE GAS S.A. E.S.P.
2832	830119227	SITA INC. COLOMBIA S.A.
2833	800126506	IMCOMELEC INGENIEROS S.A.S.
2834	900718336	HIGH TECH SOFTWARE S.A.S.
2835	900555031	KRONOS ENERGY S.A. E.S.P.
2836	900997166	MOTION IT S.A.S.
2837	860517560	EMPRESA DE SEGURIDAD Y VIGILANCIA PRIVADA SERVICON
2838	80190726	GOMEZ ULLOA LEONARDO ANDRES
2839	900273137	TOOLS SECURITY LTDA
2840	900264393	SISTEMAS INTELIGENTES DE TRANSPORTE DEVITECK SAS
2841	52917285	PORRAS VARGAS MARIA ANGELICA
2842	809011444	ENERTOLIMA S.A. ESP
2843	860002964	BANCO DE BOGOTA
2844	900412151	PROTECCIONES ELECTRICAS DE URABA S.A.S.
2845	901749455	FILPAC SOCIEDAD POR ACCIONES SIMPLIFICADA
2846	900236286	MAXIMA PROTECCION Y CIA LTDA
2847	900223325	SKYSATELITAL S.A.
2848	900431011	TP COLOMBIA S.A.S.
2849	900100553	COINOGAS  SA ESP
2850	860450667	LABORATORIOS NATURCOL S.A.
2851	891902435	TECNOLOGIA Y COMUNICACION VALTRONIK S.A.
2852	7224079	PINTO MORALES LUIS HUMBERTO
2853	860043588	PARDO CARRIZOSA NAVAS S.A.S.
2854	830045722	CONSORCIO CANALES NACIONALES PRIVADOS - CCNP
2855	900071089	MACROELECTRICOS
2856	80225653	RAMIREZ LAMPREA DIEGO ARMANDO
2857	900332949	SEGURIDAD FURTIVA LTDA
2858	830042112	FLORES EL TRIGAL S.A.S.
2859	900121530	EXTRACTORA SAN FERNANDO S.A.
2860	900263665	ERMETRONIC SECURITY SYSTEMS LTDA
2861	900859442	LUZOLAR ENERGIA SOLAR FOTOVOLTAICA S.A.S.3
2862	900341483	PROFESIONALES EN ENERGIA S.A. ESP
2863	1790703657001	AUTOMUNDIAL ECUADOR  S.A.
2864	901353966	LOGISTICA Y RASTREO SATELITAL SAS
2865	900315287	INGENIO DEL OCCIDENTE S.A.S.
2866	900630745	SEGCONTROL S.A.S.
2867	813003747	ASOPORVENIR
2868	816001182	AUDIFARMA S.A.
2869	800178949	UNION TEMPORAL RECAUDO Y TECNOLOGIA UT R&T
2870	900025724	TEKCEN S.A.S.
2871	890805267	C.I. SUPER DE ALIMENTOS S.A.
2872	900567465	INGCONTROL S.A.S.
2873	900565109	PRECISION SECURITY & SERVICES LTDA
2874	901516037	PROCESOS SEGUROS GC S.A.S.
2875	1004148082	TEJADA BEDOYA CESAR AUGUSTO
2876	5747636	SUAREZ JAIMES LUIS FRANCISCO
2877	900080245	SONAR AVL SYSTEM S.A.S.
2878	900789440	SUNTECH INTERNATIONAL SAS
2879	900454427	PATTMOS S.A.S.
2880	810005747	SIGMA INGENIERIA S.A.
2881	900998400	SISEN SECURITY SAS
2882	900664716	VIRTUAL SMART BUSINESS S.A.S.
2883	890906413	EDEMSA INGENIERIA Y SERVICIOS S.A.S.
2884	16693339	CAICEDO GUENGUE SIGIFREDO
2885	860003020	BBVA COLOMBIA
2886	890200928	COOPERATIVA SANTANDEREANA DE TRANSPORTES LTDA
2887	860400538	RAYCO S.A. RODRIGO ARISTIZABAL & CIA S.A.
2888	814001752	TALAMO SEGURIDAD PRIVADA LIMITADA
2889	890902920	UNIVERSIDAD DE MEDELLIN
2890	901616251	MASCONTROL ORIENTE S.A.S.
2891	900791748	SER SOLUCIONES S.A.S.
2892	900324992	MOCION S.A.S.
2893	830042976	MECM PROFESIONALES CONTRATISTAS LTDA
2894	900960556	TRACKING TOM S.A.S.
2895	1090462621	RIOS ANGARITA JORDY YAIMID
2896	860074578	INDUSTRIA AMERICANA DE COLCHONES S.A.
2897	900595940	ANDICE S.A.S.
2898	860055583	EQUIPOS Y CONTROLES INDUSTRIALES S.A.
2899	890200951	TRANSPORTES PIEDECUESTA S.A.
2900	900281947	ORION SOLUCIONES INTEGRALES S.A.S.
2901	900601354	LADRILLERA COSTA CARIBE S.A.S
2902	860013570	CAJA DE COMPENSACION FAMILIAR CAFAM
2903	900655970	LAC LOGYTEL ANDES CARIBE S.A.S.
2904	890903937	BANCO SANTANDER
2905	830018035	CONEXCEL BULEVARD LTDA
2906	88220014	SILVA MIRANDA MIGUEL ALBERTO
2907	74378569	ALCANTAR TORRES NELSON JAHIR
2908	900059238	MAKRO SUPERMAYORISTA S.A.S.
2909	900406150	BANCO COOMEVA S.A.
2910	4444130	TECHNOCOM WIRELESS LOCATION LEDERS
2911	901534458	GMTECH SOLUTIONS SAS
2912	800064783	QFC S.A.S. EN LIQUIDACION
2913	830120848	G&S GAS AND SERVICES S.A.S.
2914	830051455	PROTEKTO S.A.
2915	1022997333	JOHAN SEBASTIAN CASTAÑEDA
2916	901052839	CARTRACKS GPS SAS
2917	901131973	PYMEX S.A.S.
2919	830017927	ARBO S.A.S.
2920	800232449	DANFOSS S.A.
2921	80743411	ORTIZ FLOREZ ELKIN
2922	890312562	CENTRO DE INVESTIGACION DE LA CAÑA DE AZUCAR DE CO
2923	901252162	GS TRACKME
2924	800029692	GRANOS DEL CASANARE GRANDELCA S.A.
2925	830000861	CONSORCIO ASEO CAPITAL S.A.
2926	830043252	SIDERURGICA NACIONAL DE SIDENAL S.A.
2927	900241635	ISERVICES S.A.S.
2928	891800045	COFLONORTE
2929	901133876	WND COLOMBIA S.A.S.
2930	900563580	LOCATOR SECURITY S.A.S.
2931	860024730	ELSTER SOLUCIONES S.A.
2932	901396441	INTERCONEXION DIGITAL S.A.S.
2933	890701718	HOSPITAL REGIONAL E.S.E. DE EL LIBANO TOLIMA
2934	74335504	MORENO CASTAÑEDA RICHARD JAVIER
2935	80124635	SANTANDER SANTACRUZ RUBEN DARIO
2936	900895253	ENLACE GPS S.A.S.
2937	2560002-8	VSR DE GUATEMALA S.A.
2938	830136200	DESTINO SEGURO SAS
2939	900422706	MULTILLANTAS MAS QUE LLANTAS S.A.S.
2940	1792357365001	SISTEMAS TECNOLOGICOS ALCATECNI CIA LTDA
2941	800149923	BANCO DE COMERCIO EXTERIOR DE COLOMBIA S.A.
2942	900283777	INGENIERIA 3 SOCIEDAD S.A.S.
2943	900245981	SERVICIOS INTEGRALES CASAS LOPEZ LTDA
2944	860516041	ASESORIA EN COMUNICACIONES ASECONES SA EN REOGRGAN
2945	900103542	GNI GAS NATURAL INDUSTRIAL DE COLOMBIA S.A.S. E.S.
2946	79638213	MERIZALDE RODRIGUEZ RICARDO ALBERTO
2947	800105847	PROCOLDEXT SAS
2948	900100778	EMPRESA DE TRANSPORTE MASIVO ETM S.A. EN REORGANIZ
2949	17302583	MEZA PARDO BENJAMIN
2950	901407437	TRAFFIC.COLOMBIA SAS
2951	890923825	COMPAÑIA LATINOAMERICANA DE SOFTWARE S.A.-LASC S.A
2952	1044924367	PEÑARANDA RODELO JOSE ANTONIO
2953	830067414	KAESER COMPRESORES DE COLOMBIA LIMITADA
2954	811021654	INTERNEXA S.A.
2955	900166193	COTRASERVICIOS LTDA
2956	901322864	FIBERGROUP S.A.S. ESP
2957	79524782	SUAREZ ORTIZ LUIS HUMBERTO
2958	806000002	TECNOPLUS LTDA
2959	830514629	GEIICO S.A.
2960	900192711	CONSTRUCTORA CAPITAL BOGOTA SAS
2961	900690631	TIELEC INGENIERIA S.A.S.
2962	901049951	IOTLATAM S.A.S.
2963	800171222	GARPER ENERGY SOLUTIONS COLOMBIA S.A.S.
2964	822003832	COMGASCO S.A.
2965	830025104	PROSEGUR TECNOLOGIA SAS
2966	860007638	EMP. DE ENERGIA DE CUNDINAMARCA S.A. - E.S.P.
2967	SXK161122MG6	SXKM S.A de C.V.
2968	901375556	TUS AUTOPARTES S.A.S.
2969	891300959	SUCROAL S.A.
2970	155634760-2-2016	ISTMO ENERGY CONTROL
2971	13924092	ARCINIEGAS JAIMES LUIS FELIPE
2972	901072413	SERVICAM COLSECURITY SAS
2973	890002858	COOTRANSCIEN
2974	900272652	IME INGENIERIA S.A.S.
2975	800202395	EFIGAS GAS NATURAL S.A. E.S.P.
2976	901700285	MIRATEK S.A.S
2977	76.001.597.0	IMMERSIVE TECHONOLOGIES CHILE S.A.
2978	900066099	INZANET LTDA
2979	830071680	SECURITY BUSINESS SOCIEDAD LIMITADA
2980	900290793	SMARTRACK S.A.S. SISTEMAS DE INF. INTELIGENTE
2981	901101693	POSITION SYSTEMS GPS SAS
2982	800256769	PATRIMONIOS AUTONOMOS FIDUCIARIA CORFICOLOMBIANA
2983	830049705	SECURITY CONTROL LTDA
2984	900296861	TEKNIK LTDA
2985	900462942	EMPLUS S.A.S. ESP
2986	860450780	SERVICION DE COLOMBIA Y CIA LTDA
2987	900813990	C2LS  S.A.S.
2988	800185306	COLVANES SAS
2989	860038717	COLMENA
2990	900098348	POWER SUN LTDA
2991	79618161	PEREZ HERNANDEZ LUIS ANTONIO
2992	819006001	BROADBAND COMUNICACIONES
2993	80014297	PARDO OSCAR
2994	830095134	INFORMATICA TECNOL. Y COMUNIC. ITC SOLUCIONES SAS
2995	830006727	SINESER ESTACION DE SERVICIO LAS VILLAS
2996	901253003	SOLUCIONES IT SAS
2997	891500061	EMPRESA MUNICIPAL DE ENERGIA  S.A. E.S.P.
2998	890903938	BANCOLOMBIA S.A.
2999	1032444324	PERILLA LINA
3000	811002937	LA FERRERIA S.A.
3001	860090721	COLVISEG COLOMBIANA DE VIGILANCIA Y SEGURIDAD LTDA
3002	900928538	EON TECHNOLOGY
3003	1013620639	ESPITIA OTALORA LUIS FELIPE
3004	830070780	ISTELCOM LATINA S.A.
3005	806010553	LOGISTICA Y SEGURIDAD LTDA
3006	900313003	TECNEDATOS S.A.S.
3007	830041200	IAC LTDA
3008	830129681	HOLDING SECURITY
3009	900554662	CANAL CLIMA S.A.S.
3010	890111018	SERVICONI LTDA
3011	900265506	SECURITAC LTDA
3012	79979737	BELTRAN YESID
3013	900053922	SEGURIDAD LINEA AZUL LTDA
3014	860025674	CARACOL TELEVISION S.A.
3015	777777777	CORPORATIVAS
3016	802006358	SECURITY SYSTEMS
3017	830102036	ENESIMA LTDA
3018	830512127	CENTINELA DE OCCIDENTE LTDA
3019	900245250	RED724 MTRADE SAS
3020	860351812	LOS NOMINATIVOS 7-24 LTDA Y SIETE24 VIGILANCIA Y S
3021	7543170	MARIN MORALES OSCAR HERNANDO
3022	830111257	APUESTAS EN LINEA S.A.
3023	800197463	POLLOS EL BUCANERO S.A.
3024	890907406	PLASTICOS TRUHER S.A
3025	900321214	DOMOSIS S.A.S.
3026	1791302400001	ALPINA PRODUCTOS ALIMENTICIOS -ALPIECUADOR
3027	830510442	CELMARK LTDA
3028	860518504	COMPAÑIA DE SEGURIDAD NACIONAL COMSENAL LTDA
3029	900256448	MORE SECURITY & TELEMETRY SAS
3030	900671574	GEOTRACK S.A.S.
3031	806009543	UNION FENOSA REDES DE TELECOMUNICACIONES COLOMBIA
3032	811030738	ELECTROMONTAJES LTDA
3033	830030718	MERCANET LTDA
3034	830119130	INSTRUCONT S.A.S.
3035	900034424	ELECTRONICA I+D LTDA
3036	900487831	ASSELC S.A.S.
3037	890321151	CARVAJAL TECNOLOGIA Y SERVICIOS S.A.S.
3038	800210669	TRANSPORTES GALAXIA S.A.
3039	816001431	INSITEL S.A.
3040	901233762	SMART MOBILITY S.A.S.
3041	67025970	MEJIA CARDONA DIANA PAOLA
3042	900755511	EYESECURITY S.A.S.
3043	830014070	SEGURIDAD AMS LTDA BIC
3044	900843454	SEPI GROUP S.A.S.
3045	890406658	INVERAPUESTAS S.A.
3046	830114921	COLOMBIA MOVIL S.A. ESP
3047	830502580	FUTURE SOLUTIONS DEVELOPMENT SAS
3048	1018438801	RODRIGUEZ TAUTIVA DANIEL RICARDO
3049	901395941	SECURYTRACK S.A.S.
3050	800135913	TRIPLE A DE BQ S.A. E.S.P.
3051	900271845	CIPRES SEGURIDAD Y PROTECCION LTDA
3052	79616738	BETANCURT GODOY JUAN CARLOS
3053	900270015	PROYECTOS MULTIPLES SAS
3054	900611114	POSSIBLE SOLUTIONS S.A.S.
3055	830021488	ALARMAS BRAND SEGURIDAD Y EQUIPOS LTDA
3056	900168958	GEOTECH SOLUTIONS S.A.
3057	900204385	WACO INGENIERIA SAS
3058	900525054	AUTOTRACK DE COLOMBIA S.A.S.
3059	890200463	GASEOSAS HIPINTO S.A.S.
3060	807006080	AIC CONTROL S.A.S.
3061	860032550	ALFAGRES S.A. EN REORGANIZACION
3062	900810663	SMARTSOLAR S.A.S.
3063	900320624	SOLUCIONES TECNICAS GPS SAS
3064	900009507	RTA  PUNTO TAXI  SAS
3065	1022338471	RIOS QUIMBAY MIGUEL ANGEL
3066	34066000	MONTOYA BLANDON JENNIFER
3067	1054993460	ALEXA HERRERA LONDOÑO
3068	52023658	YATE TORRES MABEL ADRIANA
3069	1129184-1-566509	CELSIA CENTROAMERICA S.A
3071	901255975	AVOCADO INNOVATION S.A.S.
3072	5206638	ANDRADE RUIZ ALEX FERNANDO
3073	900567880	INGENIUM AG S.A.S.
3074	22222222	SOPORTE
3075	800132368	VENTAS Y AVALUOS LTDA
3076	800128927	COMUNICAR WIRELESS SERVICES S.A.
3077	900138444	SOLUCIONES PRODUCTIVAS COLOMBIA S.A.
3078	900354706	TECNOLOGIA EN SUPRESORES DE TRANSITORIOS LTDA
3080	901707833	SHADDAI MONITORING SAS
3081	860001697	GASEOSAS LUX S.A.S.
3082	890111175	COMPAÑIA DE VIGILANCIA VIASERVIN LIMITADA
3084	800251440	EPS SANITAS S.A.
3085	900141687	PROPUESTA DE MARCA S.A.S.
3086	900713658	CNE OIL & GAS S A S
3087	901795114	SEGURIDAD & LOGISTICA CHL SAS
3088	900884866	CONSORCIO EMPRESARIAL
3089	901191622	YUNEX S.A.S
3090	830037843	WINNER GROUP S.A.
3091	800049458	FLORVAL S.A.S.
3092	79994904	AVILA CUECA JUAN CARLOS
3093	901425577	NEBULA SOFT S.A.S. ZOMAC
3094	900466940	INGENEWS S.A.S.
3095	901483075	SAMTECH COLOMBIA SAS
3096	900729030	UBICACION Y TECNOLOGIA S.A.S.
3097	900861266	TOP DRIVE SAS
3098	830022462	ORICA COLOMBIA SAS
3099	811003209	CORPORACION INTERUNIVERSITARIA DE SERVICIOS-CIS
3100	SME1206297V5	STGPS MEXICO SA DE CV
3101	901118058	MOSSAD RASTREO SATELITAL SAS
3102	46455716	VARGAS RINCON YANETH RUBIELA
3103	900099310	GIT MASIVO S.A.
3104	900388951	WAY TRACK S.A.S.
3105	830510377	E & T DESARROLLOS LTDA
3106	900536369	LOGITEC SOLUTIONS SAS
3107	810003085	VIGILANCIA TECNICA DE COLOMBIA LTDA - VIGITECOL
3108	900112285	TECNOLOGIA Y LOGISTICA SATELITRACK LTDA.
3109	901031910	LUSOTEC S.A.S.
3110	900398767	CARRAO ENERGY S.A. SUCURSAL COLOMBIA
3111	901073049	SOLLIVAN SMART SOLUTIONS S.A.S.
3112	830091683	SNF S.A.S.
3113	824004311	PROTECCION ACTIVA LTDA
3114	830106748	VOXCOM TELECOMUNICACIONES LTDA
3115	800015993	FOTO SANTA BARBARA LTDA
3116	830005674	MOUNTAIN ROSES S.A.S.
3117	821000169	NUTRIUM S.A.S.
3118	901302727	NEU ENERGY S.A.S. E.S.P.
3119	901175650	LINEGPS SAS
3120	76458846	SERVICIOS DE CONTROL Y GESTION DE ACTIVOS MOVILES
3121	80135614	MORENO COCA MANUEL ALFONSO
3122	900256547	UNION TEMPORAL ALIANZA
3123	900152352	SISTEMAS VIRTUALES ZONA ANDINA S.A.S.
3124	890901110	CONCONCRETO S.A.
3125	814002979	A.S.C. INGENIERIA SOCIEDAD ANONIMA ESP
3126	900084822	XYLEM WATER SOLUTIONS COLOMBIA S.A.S.
3127	800143133	MARIA STELLA QUINTERO ESPINOSA LTDA
3128	900522765	AVOLARONLINE.COM S.A.S.
3129	900535168	DCE INGENIERIA SAS
3130	900174004	ASESORIA Y CONSULTORIA PROF. EN ING. DE AVANZADA L
3131	890800788	SUMATEC S.A.
3132	900437215	BUSINESS & SUPPLIES LOGISTICS LTDA
3133	900168467	GRUPO BYZA S.A.S.
3134	860404924	OLEAGINOSAS SAN MARCOS S.A.
3135	900039901	ENERTOTAL S.A. E.S.P.
3136	900966242	NAVIOT S.A.S.
3137	860000292	FAVA
3138	900242000	TANKE CORP S.A.S.
3139	860350234	BRINKS DE COLOMBIA S.A.
3140	80005743	OSPITIA GONZALEZ OSCAR
3141	900450755	TOTAL PETROLEUM SERVICES S.A.S.
3142	901137485	WIDETECH GROUP S.A.S.
3143	900466504	COMERCIALIZADORA E INGENIERIA COLOMBIANA COINCOSAS
3144	900575356	QW HEALTH COLOMBIA S.A.S.
3145	901769719	HARDOMO S.A.S.
3146	812003483	VEOLIA AGUAS DE MONTERIA S.A. ESP
3147	860000596	ESPUMLATEX S.A.
3148	53907337	PRIETO NIÑO NATALIA
3149	1121907621	LOPEZ ALFONSO ALEJANDRA
3150	805001538	VEOLIA SERVICIOS INDUSTRIALES COLOMBIA S.A.A. ESP
3151	900705860	JONYCO S.A.S.
3152	900871753	E-NWAVE S.A.S.
3153	901394158	PIXELART IMPRESION SAS
3154	901013264	INNOVA INDUSTRIES T.S. S.A.S.
3155	800138541	MICROCOM LTDA
3156	830005066	SECURITY VIDEO EQUIPMENT S.A.S.
3157	77777777	EQUIPOS PARA PRODUCCION DISCOUNT ELECTRON.
3158	900185014	OPENWAVE GESTIÓN Y TECNOLOGIA S.A.S
3160	155687824-2-2019 DV	ERCO ENERGIA S.A.
3161	901262685	EPRING S.A.S.
3162	860518253	ULTRA S.A.
3163	901226517	SOL&CIELO S.A.S.
3164	901193527	ENERGY 4.0 S.A.S.
3165	900094502	WI ZENZ TECHNOLOGIES S.A.S.
3166	823004006	AGUAS DE LA SABANA S.A.  E.S.P.
3167	900012687	ACC INGENIERIA SAS
3168	830144236	FIRE & SECURITY E.U.
3169	08019006023612	V.S.R. HONDURAS
3170	900471414	ORIGIN IT SAS
3171	802004283	ALERTA MAXIMA S.A.S.
3172	75070401	PELAEZ CRISTIAN
3173	802013000	SISTEMAS DE COMUNICACIONES LTDA
3174	80850835	GRANADA GONZALEZ DAVID
3175	800111946	PRIMESTONE S.A.
3176	890200474	INCUBADORA SANTANDER S.A.
3177	901199978	RUPKOM COLOMBIA SAS
3178	901402717	OHKLA  S.A.S.
3179	860072172	EMPACOR S.A.
3180	1024469584	PULGARIN GARCIA OSCAR ANDRES
3181	5653629	SIERRA PINZON PEDRO JESUS
3182	900570286	ERCO ENERGIA S.A.S.
3183	860066942	COMPENSAR
3184	5605810	CUADROS MAYORGA MARCO ANTONIO
3185	900207258	AGUITRONICA LTDA
3186	900389855	TRANSPORTADORA DE CARGA Y LOGISTICA  S.A.
3187	901388309	WFE LTDA
3188	1083013302	LINA MARCELA SANDOVAL HERMANDEZ
3189	900526944	GEOESTRATEGIA CONSULTORES S.A.S.
3190	830501400	RAYO SEGURIDAD ARMADA Y MONITOREO ELECTRONICO LTDA
3191	890900285	COMPAÑIA DE EMPAQUES S.A.
3192	900539863	MS MONITOREO SATELITAL S.A.S.
3193	900278121	TAC INGENIERIA S.A.S.
3194	891800219	EMPRESA DE ENERGIA DE BOYACA S.A. ESP
3195	11111111	INGENIERIA
3196	901390660	SISOMOD S.A.S.
3197	830036564	INTELT SECURITY LTDA
3198	900589503	SPECTRUM RENOVAVEIS S.A.S.  E.S.P.
3199	821000448	TULUASEO S.A. ESP
3200	800165463	INTERNACIONAL DE SEGURIDAD LTDA
3201	901013305	CONSORCIO CAIF
3202	900831966	GLOBAL TRACKING S.A.S.
3203	900110290	AUTOMATIZACIÓN & CONTROL INGENIERÍA SAS
3204	900703206	GLOBAL CONEXION DIGITAL SAS
3205	890901389	UNIVERSIDAD EAFIT
3206	71267795	ORTEGA MERCADO CAMILO ERNESTO
3207	900337932	MEDICIONES GEOGRAFICAS S.A.S.
3208	10186839	PEÑA MOSQUERA WILSON YATHIR
3209	800227624	JARDINES DEL ROSAL S.A.S.
3210	900646148	LOGISERVICIOS S.A.S.
3212	890924674	MAVILL S.A.S.
3213	900928262	GMAS SERVICES Y CIA LTDA.
3214	900648031	LOGISTCARGA S.A.S.
3215	900515258	SISTEMAS INTELIGENTES DE GESTION COMPANY S.A.S.
3216	901391137	KONTANDO SAS
3217	830105376	FORERO & CIA COMUNICACIONES LTDA
3218	901043177	ASOCIACION EQUIPO DE MUJERES RURALES DE SAN ALBERT
3219	830136305	MEGATOUR S.A.S.
3220	13327078	ACERO ROMERO ORLANDO
3221	900910876	ANUBIS H & C SEGURIDAD LTDA
3222	700155476	ORMACHEA JORGE DIEGO
3223	900034278	SOLUTEC INGENIERIA S.A.S.
3224	53043136	SANTANDER SANTACRUZ KATERINE LEONORA
3225	901168692	FH ELECTRONIC SECURITY SAS
3226	800089677	FUNDACION CINARA
3227	830505973	ARTHUR SYSTEM S.A.S.
3228	79406613	MAURICIO ALEJANDRO NAVARRETE QUINTANA
3229	4444500	CLIENTES EN DEMO
3230	901335917	VIVE ENERGIA DE COLOMBIA SAS
3231	811017887	SOLUCIONES DE TRAFICO S.A.S.
3232	900543354	ALTA PREVENCION COLOMBIA S.A.S.
3233	900063082	XEL SEGURIDAD INTEGRAL LTDA
3234	900597570	S&R GLOBAL SYSTEM S.A.S.
3235	900230624	CONSWARE S.A.S
3236	830083351	ENCINALES RESTREPO ASESORES & CIA S. EN C.
3237	79888199	YAÑEZ ILLERA AUGUSTO
3238	830036556	CONCESIONARIA PANAMERICANA S.A.
3239	13068709	BENAVIDES JURADO MARIO LEONARDO
3240	830059877	BISMARK INTERNATIIONAL LTD
3241	901606787	SKLATECH S.A.S.
3242	860520748	SERVIBANCA
3243	890110985	CARBONES DEL CARIBE S.A.S.
3244	860032909	CREDIBANCO S.A.
3245	7223341	CALDERON FARIAS OSCAR MAURICIO
3246	900621407	HADESYS SAS
3247	900392168	ROCA CONSULTING S.A.S.
3248	900719123	AG STUDIOS COLOMBIA S.A.S.
3249	900419778	COMEREXCO SAS
3250	800008838	INTEGRA SECURITY SYSTEMS S.A.
3251	900275180	G&G SECTECH S.A.S.
3252	900204309	AZ LOGICA S.A.S.
3253	901110155	LOCATION WORLD COLOMBIA S.A.S.
3254	900029411	SERVIALARM LTDA
3255	901097896	GOLDENSEC COLOMBIA SAS
3256	809008620	M&O SEGURIDAD LTDA
3257	800049823	GENELEC DE COLOMBIA S.A.S.
3258	901331525	ICARUS DESARROLLO SOLAR S.A.S.
3259	900202455	SEGURIDAD VELSEGC LTDA
3260	860002180	SEGUROS COMERCIALES BOLIVAR S.A.
3261	900751891	RENTAR MAQUINARIA S.A.S.
3262	52061629	CASTRO BLANCA LEONOR
3263	900377657	ELECTROTRANSFORMACION S.A.S.
3264	901516834	ANILLOS 7-24 SAS
3265	890207037	AGROPECUARIA ALIAR S.A.
3266	900296929	SEGURIDAD PLATINUM LTDA
3267	890312749	SEGURIDAD ATLAS LTDA
3268	900361602	TRACKING SOLUTIONS T.S.O. S.A.S.
3269	860524143	SELDA LTDA
3270	860507033	VISE LTDA
3271	830063506	TRANSMILENIO S.A.
3272	900219866	MEDICARTE S.A.
3273	900852282	F&M INGENIEROS S.A.S
3274	13921560	ALBARRACIN DAZA ISMAEL
3275	901691467	MEGATRACK GPS SAS
3276	6872769	GARCIA GARCIA DIEGO LEON
3277	900492151	INSAK SAS
3278	800087080	TOWNSEND SYSTEMS DE COLOMBIA Y CIA LTDA
3279	900204720	QUINTANA S.A.S.
3280	900619275	ENGLOTEC SAS
3281	900012579	VECTOR GEOPHYSICAL SAS EN REORGANIZACION
3282	860035827	BANCO COMERCIAL AV VILLAS
3283	901388245	STARLINK  GPS SAS
3284	900768273	TOTALTRACKING S.A.S.
3285	900569193	TICKET FAST S A S
3286	19212478	ALEGRIA JULIO CESAR
3287	900817359	ALIANZA FOLLOW UP S.A.S.
3288	901816788	GPSATELITAL SAS
3289	900335094	INGEPROYECT INGENIERIA & PROYECTOS S.A.S.
3290	900426553	CINTELSAS S.A.S.
3291	13923928	FERNANDEZ JAIMES HERACLITO
3292	813001492	COMEPEZ S.A.
3293	900312405	TM SOLUTIONS S.A.S.
3294	79274794	DESERT POINT SPA - NIT ERRADO
3295	900494295	MADE ENERGY S.A.S.
3296	900433182	GASES INDUSTRIALES DEL NORTE S.A.S.
3297	900784911	FRISSON TECHNOLOGIES SAS
3298	1093749771	HERNANDEZ JORGE ENRIQUE
3299	900482406	ALIADAS CARGO S.A.S.
3300	1007802083	TURRIAGO DE LA ROSA JOSE MARIO
3301	900363561	ELECTR&COM CALI S.A.S.
3302	901481328	SOLUCIONES URBANAS SOSTENIBLES SAS
3303	900192645	INTELT SKJ LTDA
3304	830057706	BRIDGESTONE DE COLOMBIA S A S
3305	900409284	LOCALIZACION Y MONITOREO VIA GPS SATELITAL S.A.S.
3306	900997844	DECOLTEC SAS
3307	1075680817	HERNANDEZ MOLINA JONATHAN DAVID
3308	860043370	LADRILLERA E INVERSIONES SILA S.A.
3309	79835565	RODRIGUEZ GRACIA DIEGO FERNANDO
3310	900371487	SEGUMOVIL DE COLOMBIA S.A.S.
3311	805031206	SOLUCIONES EN TIEMPO REAL LIMITADA
3312	900799861	TECNOSUR LOCALIZACION Y RASTREO S.A.S.
3313	800215227	G4S TECHNOLOGY COLOMBIA S.A.
3314	79686386	CARLOS ANDRÉS GUERRERO G.
3315	98682257	CHANCI JARAMILLO EDWIN
3316	830064697	SECURITY BRIGADIER LTDA
3317	830053932	TELEPLUS S.A.S.
3318	860037707	SBS SEGUROS COLOMBIA S.A.
3319	830075997	COTABA S.A.
3320	900307077	MACROINGENIERIA INTEGRAL S.A.S.
3321	800085526	VIGILANCIA ACOSTA LIMITADA
3322	830129729	SYSTEMS & SOLUTIONS LTDA
3323	900558231	EFICIENCIA ENERGETICA DE COLOMBIA ENECO S.A.S.
3324	901543313	ENERBIT S.A.S. E.S.P.
3325	900420376	MAXIBLIND SEGURIDAD S.A.S.
3326	900036347	KAL TIRE S.A. DE C.V. SUCURSAL COLOMBIA
3327	79374290	SISTEMAS Y SEGURIDAD VIVAS
3328	900047020	DISTRIMETANO DE COLOMBIA LTDA
3329	813002358	PUMA LTDA
3330	805028566	INSTRUMENTACION Y SERVICIOS INDUSTRIALES ISI SAS
3331	830077975	AXEDE S.A.S. - EN REORGANIZACIÓN
3332	900440553	IMASS SOLUCIONES S.A.S.
3333	860513276	ELECTROHIDRAULICA S.A.  REPRESENTACIONES
3334	900594610	ZIGO S.A.S.
3335	807005020	VEOLIA ASEO NORTE DE SANTANDER S.A. ESP
3336	826002546	DISEMCO INGENIEROS ASOCIADOS DE COLOMBIA LTDA
3337	52973261	BERNAL CASTILLO MARIA ELIZABETH
3338	900809558	SOLUCIONES INTEGRALES DE CONTROL S.A.S.
3339	830013360	DEAS LTDA
3340	76.015.699-K	JIGSAW TECHNOLOGIES LIMITADA
3341	5612510	CARVAJAL CALDERON ALFONSO
3342	901783463	ASISTENCIAS Y SERVICIOS AUTOMATIZADOS YA S.A.S
3343	900531898	COLFENIX GPS S.A.S.
3344	901379286	AGRO-BEKAERT COLOMBIA S.A.S.
3345	900356400	SERVICIOS PROFESIONALES WICOM S.A.S.
3346	1193153172	MARIÑO VARGAS MICHAEL
3347	860007660	HELM BANK S.A.
3348	860003563	HITACHI ENERGY COLOMBIA S.A.S.
3349	51613918	TOVAR ROA ELIZABETH
3350	830092675	AXURE TECHNOLOGIES S.A.
3351	900176226	AMBIENTE INTEGRAL CONSULTORES LIMITADA
3352	860005224	BAVARIA S.A.
3353	901753872	GLOBAL TRACKING TECHNOLOGY SAS
3354	901188852	SOLUCIONES TECNOLOGICAS MYC SAS
3355	890980040	UNIVERSIDAD DE ANTIOQUIA
3356	900841909	TRACKINGMOVIL SAS
3357	830052648	CLINICA DE LOS COMPUTADORES LTDA
3358	900427369	FERRETERIA METROFER S.A.S.
3359	890212868	AGROINCE LTDA & CIA S.C.A.
3360	900353189	TECNOINNOVA S.A.S.
3361	800103570	COMEXTER LTDA
3362	900017773	AZ SMART TECHONOLOGY LTDA
3363	900656524	KONTIGO S.A.S.
3364	1098605876	BARON CASTRO CAMILO ANDRES
3365	13928354	PEÑA SANDOVAL JUAN EVANGELISTA
3366	900371937	NEC INGENIERIA Y TELECOMUNICACIONES LTDA
3367	800180808	PETROTIGER SERVICES COLOMBIA LTDA
3368	890903858	INDEGA S.A.
3369	18145255	ERAZO TORRES JENKLIN ABDIAS
3370	900102184	EDNEL SECURITY LTDA
3371	0992745762001	MOTORES Y TRACTORES MOTRAC S.A.
3372	901380140	NVERSIONES TECNOLÓGICAS AMAROK S.A.S
3373	901074891	AVS SOLUTION  S.A.S.
3374	900297485	EMOTIVA LTDA
3375	71383903	DIOSSA ARANGO JAVIER
3376	901625392	SECUTEC - TECNOLOGÍA EN SEGURIDAD SAS
3377	800227103	FLORES EL ALJIBE S.A.S.
3378	900099098	AP INGENIERIA S.A.S.
3379	5814149	BORRERO ALBERTO
3380	900592277	CET COLOMBIA S.A.S.
3381	6742410	PRIETO RAMIREZ ALVARO MIGUEL
3382	901163712	ESG SOLUTIONS GROUP INC. SUCURSAL COLOMBIA
3383	900551317	SIENERGY S.A.S
3384	830019440	INGENIERIA Y MERCADEO LTDA INGEMERC LTDA
3385	41539920	NIÑO DE PRIETO KATIA GLORIA STELLA
3386	830068601	ROYAL TELECOM RT S.A.S.
3387	1079262361	ARRIETA MARTINEZ SERGIO ALFONSO
3388	900465924	VISATEL DE COLOMBIA S.A.S.
3389	901090065	TEAMCO CONSULTING S.A.S
3390	900144159	CERCAR ENERGY S.A.S.
3391	800101613	COLVISEG DEL CARIBE LTDA
3392	813011065	LETINGEL S.A.S.
3393	34550395	TECHNO ALARMAS
3394	900770536	MOLANDES S.A.S.
3395	830087891	INTERCOM SECURITY DE COLOMBIA LIMITADA
3396	860066946	SEGURIDAD SUPERIOR LTDA
3397	830084254	LOGISTICA PASAR S.A.
3398	900048019	DIESEL INSTRUMENTS DE COLOMBIA S.A.S.
3399	900011860	ANGULOS & CIA S.A.S.
3400	900159631	EMDICOR S.A.S.
3401	860075384	ADUANAS OVIC S. en C. SIA
3402	96791820	GEOBLAST S.A.
3403	16363638	ALVAREZ MARULANDA ORLANDO
3404	900498094	HORUS GPS S.A.S.
3405	806001841	ENRED COMUNICACIONES S.A.
3406	827000663	CONTROLANDO SISTEMAS DE SEG. ELECTRONICA LTDA
3407	830002313	FLORES LAS ACACIAS SAS
3408	800256059	CONSTRUIMOS Y SEÑALIZAMOS S.A.
3409	860031068	INSTRUMENTOS & CONTROLES S.A.
3410	800183978	ALMACEN BREMEN SUCESORES DE ERNESTO GOMEZ Y CIA SA
3411	802020642	TRANSFORMADORES DEL CARIBE Y REPRESENTACIONES S.A.
3412	900779170	TECHNOAPES DE COLOMBIA SAS
3413	80085051	SOLANO MENDOZA FRANCISCO
3414	900741746	PETROS INGENIERIA SAS
3415	A28877579	TELDAT SAU
3416	860065656	POLLO OLIMPICO S.A.
3417	900708539	MAJUSA TECNOLOGIA ELECTRONICA SAS
3418	900661439	XL IDEAS S.A.S.
3419	800138597	AUTENTICA SEGURIDAD LIMITADA
3420	901185687	SOLUCIONES ITIC S.A.S.
3421	900118085	TEIKO S.A.S.
3422	901000741	FUSEPONG S.A.S
3423	802006730	INTERGLOBAL SEGURIDAD Y VIGILANCIA LTDA
3424	830117485	TMS TELECOMUNICACIONES MONITOREO SISTEMAS LTDA
3425	432663	RUIZ REGALADO BRIGIDA DE LA CRUZ
3426	900116426	NETCOM WIRELESS S.A.S
3427	51791127	PARRADO CLAUDIA
3428	4243887	GAMBOA NARANJO SEGUNDO JHONNY
3429	800083486	WM WIRELESS & MOBILE LTDA
3430	900507583	SEPA CONSULTORES SAS
3431	901717014	CONTINENTAL FORCE S.A.S. BIC
3433	901487956	SMARTSIS S.A.S.
3434	800153993	COMUNICACION CELULAR S.A. CLARO
3435	813010066	LA MAGDALENA SEGURIDAD LIMITADA
3436	901106717	GLOBAL TECHNOLOGIES S.A.S.
3437	800206842	BAKER HUGHES DE COLOMBIA
3438	900379874	TRANSCONTROL S.A.S.
3439	900264965	LADRILLERA BAJO CAUCA S.A.
3440	900692169	PROSUMINISTROS DE COLOMBIA S.A.S.
3441	891100299	COOTRANSHUILA LTDA
3442	80204767	MUÑOZ PULIDO LUIS EDUARDO
3443	52102398	MOLANO CARDENAS MONICA DEL PILAR
3444	1030528022	REINA ALVAREZ WERNHER ALLEN
3445	900854641	GEO-METRIK INGENIERIA SAS
3446	900795825	SMART QUICK S.A.S.
3447	830014011	CIS LTDA.
3448	013795447	RAMIREZ JHONATTAN
3449	900494526	SUTECH S.A.S.
3450	800178014	SEGURIDAD SEGAL LTDA
3451	820001482	CENTINEL DE SEGURIDAD LTDA
3452	900467174	HOMELAND AND SECURITY LTDA
3453	900681156	INSTRUCONTEC SAS
3454	830000853	TRANSGAS DE OCCIDENTE S.A.
3455	900688636	INTEGRA SOLUCIONES INDUSTRIALES S.A.S.
3456	1232393840	CHAUSTRE ROLON ENDER JAIR
3457	900046403	SECURITY GROUP FIVE LTDA
3458	901487716	SOLUCIONES INTELIGENTES AL TRANSPORTE SOLUGIC SAS
3459	900014002	KENSSEY DESARROLLOS ELECTRONICOS S.A.
3460	ACA040609CUA	ASTRA CORPORATIVO ADUANAL
3461	830036006	MAYEKAWA COLOMBIA S.A.S.
3462	805012299	CODESA S.A.
3463	811015018	ELEINCO S.A.S.
3464	91488435	POVEDA RUEDA ROBINSON JAVIER
3465	51730829	HENAO DE BARRETO LUZ AMANDA
3466	800251087	B.I. LTDA
3467	860002134	ABBOTT LABORATORIES DE COLOMBIA S.A.
3468	901585331	APOYO RASTREO Y ASISTENCIA VEHICULAR 24H SAS
3469	900409332	AGUAS DE MALAMBO S.A. ESP
3470	890105526	PROMIGAS S.A. ESP
3471	98533907	RAMIREZ GIRALDO JUAN CARLOS
3472	900113592	E GLOBAL TECHNOLOGY S.A.S.
3473	820000671	VEOLIA AGUAS DE TUNJA S.A. ESP
3474	804000044	DELTHAC 1 SEGURIDAD LTDA
3475	891200200	CEDENAR S.A. E.S.P.
3476	900817526	BEOTEC INGENIERIA S.A.S.
3477	900153281	SUGOM SEGURIDAD LTDA
3478	5747815	ROA SANCHEZ GUSTAVO
3479	L12000078109	SEGWARE USA LLC
3480	91159276	PINTO LOPEZ GERMAN DARIO
3481	806005140	ELECTRIFICADORA DE LA COSTA S.A. E.S.P.
3482	9873409	RAMIREZ GIRALDO ANDRES
3483	811037075	LACTEOS BETANIA S.A.
3484	830062674	SERVINFORMACION S.A.
3485	900987965	DIGICONTROL GPS SAS
3486	804013578	PROVISERVICIOS S.A. E.S.P.
3487	1096207586	RANGEL MARTINEZ GERSON GABRIEL
3488	800074912	OFIMARCAS S.A.S.
3489	830085880	AINCA SEGURIDAD & PROTECCION LTDA
3490	901708226	GLOBAL TRACKING GPSOLUTIONS SAS S.A.S
3491	1122402937	RODRIGUEZ DAZA ANDRES DAVID
3492	830122566	COLOMBIA TELECOMUNICACIONES S.A. ESP
3493	900689930	FALCON SYSTEM S.A.S.
3494	800130305	FLORES LA MANA S.A.S.
3496	900458808	AITE SOLUTIONS S.A.S.
3497	860503370	LEASING DE OCCIDENTE S.A. C.F.C.
3498	901208185	HIDRASED S.A.S
3499	900495552	JMB VENDING MACHINES S.A.S.
3500	11322630	ANTIA TIQUE EDGAR GERMAN
3501	891303834	AFILIADOS PALMIRA S.A.
3502	830064213	PROYELEC LTDA
3503	890399010	UNIVERSIDAD DEL VALLE
3504	900256126	GLOBAL CIRCUIT S.A.S.
3505	09.446.817/0001-62	GOLDEN SAT LOCACAO E COMERCIO DE RASTREADORES LTDA
3506	830057616	GLOBAL SECURITY BANK S.A.S.
3507	901303520	TELETECH SAS
3508	830026454	BLINDAR SECURITY S.A.S.
3509	900068896	SIMS TECHNOLOGIES S.A.S.
3510	1031178625	VEGA LOPEZ DIVI JULIANA
3511	900480568	AGM SERVICIO EN MOVIMIENTO S.A.S.
3512	860034313	BANCO DAVIVIENDA S.A.
3513	80220427	BARRERA ALBARRACIN VICTOR JULIO
3514	901077952	MOVII S.A.
3515	10078811	RESTREPO CARLOS JULIO
3516	860513971	GRANADINA DE VIGILANCIA LIMITADA
3517	800027765	PARTES Y COMPLEMENTOS PLASTICOS S.A.S.
3518	900951656	ROADWAY GPS SAS
3519	900616103	PROELCO S.A.S.
3520	891101158	COOCENTRAL
3521	830079019	EKIP DE COLOMBIA S.A.S
3522	1014190638	BLANCO RODRIGUEZ HECTOR IVAN
3523	816004795	ENERGITEL S.A.S.
3524	901227707	TRACKGPSCOLOMBIA S.A.S.
3525	900075204	LACSSA S.A.
3526	901203937	SIPROELC SAS
3527	901058206	GLOBAL IMC SAS
3528	814004223	ASEGURAR LIMITADA
3529	800019369	EMPREVI LTDA EMPRESA DE PREVENCION Y VIGILANCIA
3530	900456257	ELECTRO REDES  E INGENIERIA SAS
3531	830076778	DHL EXPRESS COLOMBIA
3532	820005242	LEMUS BENITEZ Y COMPAÑIA LIMITADA
3533	800161062	COOTRANSCO LTDA
3534	8300311826	BISMARK COLOMBIA RACK
3536	860055913	S.F.I. SAS
3537	51649909	PARRADO GARZON NOHORA STELLA
3538	830045306	SECURITEC LTDA
3539	900213999	INNOVATECH LTDA
3540	800125779	ALARMAS Y SERVICIOS DE COLOMBIA ASBC SAS
3541	800134978	INFORMACION Y TECNOLOGIA S.A.
3542	900721089	TURISMO ANDINO ESPECIALES SAS
3543	800146941	VIGINORTE LTDA
3544	6893281	PEÑA AGUILAR WILMAN FERNANDO
3545	860002503	COMPAÑIA DE SEGUROS BOLIVAR S.A.
3546	900766756	CIE. CENTRO DE INVESTIGACIONES ESPECIALES 1 S.A.S.
3547	901359460	ORBITRACK GPS S.A.S.
3548	80819572	SIERRA MELO ALEXANDER
3549	900433032	TERPEL ENERGIA S.A.S.  E.S.P
3550	805002719	CONTROL DE PROCESOS INDUSTRIALES CPI SAS
3551	860524332	VIGILANCIA Y ADMINISTRACION DE INMUEBLES VAI LTDA
3552	901149317	L&S GROUP S.A.S.
3553	900203461	COQUECOL S.A.S. CI
3554	900512379	COLIMUREX S.A.S.
3555	687.713.438.00-08	TECWISE SISTEMAS DE AUTOMAÇÃO LTDA.
3556	830032421	HURON LTDA
3557	860069804	CARBONES DEL CERREJON LIMITED
3558	40219768	VISION DIGITAL SOLUCIONES DE SEGURIDAD
3559	900219540	INGENIO VERDE INGEV S.A.S.
3560	860031935	SOCIEDAD COLOMBIANA DE VIGILANCIA LTDA
3561	900972955	SERVICIOS PRODUCTIVOS SAS
3562	900166798	ESCORT SECURITY SERVICES LTDA
3563	800154428	INDUSTRIAS ECTRICOL S.A.S.
3564	830134971	CONECTAR TV S.A.S.
3565	830004993	CASATORO S.A. BIC
3566	800047630	DESMOTADORA DEL NORTE DEL TOLIMA S.A.
3567	900365050	IT XPRESS S.A.S
3568	830141328	WORLD SECURITY DIGITAL LTDA
3569	830126626	RASTRACK S.A.S.
3570	802011652	ENERGIA Y CONTROLES LIMITADA
3571	1073507620	GARNICA SALAZAR LAURA VIVIANA
3572	901657037	BOMBAS & VARIADORES E INGENIERÍA S.A.S.
3573	900630864	PJM SAFETY TECH S.A.S.
3574	822002322	CENSELC LTDA
3575	802020167	LUDYCOM S.A.
3576	860072134	HOCOL S.A
3577	1094240223	RODRIGUEZ ELKIN DE JESUS
3578	900425223	SEGTRONIC GPS S.A.S.
3579	901552731	STAT S.A.S.
3580	830053998	POSTRATAR LTDA
3581	901651275	INELEP COL S.A.S.
3582	900533889	MOVILTRACK COLOMBIA TRANSPORTES ADMINISTRACION Y
3583	11.008.806/0002-23	SIGHRA TECNOLOGIA EM RASTREAMENTO LTDA
3584	16726404	MEDINA MARIN JAIME
3585	900295058	VISION LOGISTICA INTERNACIONAL S.A.S.
3586	815000649	BUGASEO S.A. ESP
3587	800238372	PROTEGER SEGURIDAD LIMITADA
3588	830101476	STARCOOP LTDA
3589	900551266	CONSORCIO CCC ITUANGO
3590	1090396162	PEREZ SALAZAR MANUEL JOSE
3591	900681856	RENOVATIO ECO SOLUTIONS S.A.S
3592	1019022151	TANGARIFE RODRIGUEZ WILMER FERNANDO
3593	860521658	PERENCO OIL AND GAS COLOMBIA LIMITED
3594	830087829	C.I.A. PROTECTION LTDA
3595	830105832	TELEMONITOREAMOS BOGOTA S.A.
3596	860060112	SERVICIO DE VIGILANCIA TECNICO LTDA SERVIGTEC LTDA
3597	900826841	MEDICINA Y TERAPIAS DOMICILIARIAS S.A.S
3598	80727629	SERNA GUERRERO HEYDER AMIDT
3599	900724658	GESTION ENERGIA CONSULTORES S.A.S.
3600	900362633	COORDINAR SEGURIDAD Y COMPAÑIA LTDA
3601	900243647	ONE SOLUTION POSITION SAS
3602	900533512	TECHNOLOGY INTEGRATION SYSTEMS S.A.S.
3603	900294761	COLOMBIA GPS LIMITADA
3604	830508017	FULLCARGA COLOMBIA S.A.S
3605	900437840	VALORES AINCA LTDA
3606	900862173	PROVISEG ELECTRONICA SAS
3607	901409657	TREINTA TECNOLOGIA SAS
3608	800201735	INDUSTRIAS DEL PACIFICO S.A.S.
3609	900023780	IN.DC   S.A.S.
3610	860016610	INTERCONEXION ELECTRICA S.A E.S.P.
3611	830065974	IGT FOREIGN HOLDINGS CORPORATION SUC COLOMBIA
3612	800214444	TRANSPORTES REINA S.A.
3613	1019018349	RODRIGUEZ GUALDRON ALEJANDRA
3614	800126362	NIETO MORALES COMUNICACIONES SAS NIMOCOM SAS
3615	890943055	SUMINISTROS Y CONTROLES ELECTRONICOS S.A.
3616	901047000	VIOSS SECURITY S A S
3617	800129395	METROPOLITANA DE TRANSPORTE LA CAROLINA S.A.
3618	900350170	KAZUM NATURE CREATION S.A.S.
3619	900934158	REAL POSITION SAS
3620	800071617	CUMANDES S.A.
3621	805026965	CABLING & WIRELESS LTDA
3622	28297267	ABREO BAYONA LIBIA
3623	830105085	FBI SEGURIDAD ELECTRONICA LTDA
3624	333333333	LINEAS CEDIDAS
3625	901073817	HONOR TECNOLOGIA SAS
3626	900435626	SECURITA SISTEMAS Y SEGURIDAD ELECTRONICA S.A.S.
3627	900352275	ART TV PRODUCCIONES SAS
3628	800255754	BT LATAM COLOMBIA S.A.
3629	891304849	IMECOL S.A.S.
3630	890212407	DROGUERIA VIDA
3631	3101224387	VSR DE COSTA RICA S.A.
3633	807001649	GAMEORU LTDA
3634	900341571	P&Q SOLUCIONES ENERGETICAS S.A.S.
3635	830507387	METROLINEA S.A.
3636	860054546	MG CONSULTORES S.A.S.
3637	800250325	VITACOM DE COLOMBIA SAS
3638	900761005	UBICATECH S.A.S.
3639	900697091	SHERLOG COLOMBIA SAS
3640	900511130	TECNOLOGIA SEGURA "SAFETECH" SAS
3641	900260544	TRANSPORTADORA DE VALORES DEL SUR LTDA
3642	901505314	U-TILLID SOLUCIONES Y TECNOLOGIAS INTELIGENTES SA
3643	900887622	TECPI  S.A.S.
3644	901046976	UNIX GPS SAS
3645	1105682092	SANCHEZ REYES JONATHAN DAYESSI
3646	860008820	COMPAÑIA FRUTERA DE SEVILLA LLC
3647	901169597	JEY ELECTRONIC S.A.S.
3648	901224883	FLETX COLOMBIA S.A.S.
3649	901002831	REA SOLAR COLOMBIA S.A.S.
3650	805000427	COOMEVA EPS
3651	800118231	KASCH LTDA
3652	4516464	MONTOYA VELARDE JULIAN DAVID
3653	55555555	PRUEBAS
3654	1191794482001	CLIPP ECUADOR S.A.S.
3655	800132469	FLORES EL TANDIL S.A.S.
3656	890903407	COMPAÑIA SURAMERICANA DE SEGUROS S.A.
3657	901092113	KLARO TECNOLOGIA S.A.S.
3658	1094168098	FLECHAS ARENAS JEAN EDUARD
3659	805009514	SOCIEDAD COLOMBIANA DE JUEGOS Y APUESTAS S.A.
3660	830058181	SUPERVISION ELECTRONICA WHITE EAGLE LTDA
3661	860013488	FEDERACION NACIONAL DE COMERCIANTES FENALCO
3662	860034535	DYNAMIC DE COLOMBIA LTDA. SEGURIDAD PRIVADA
3663	830045348	PROSEGUR SISTEMAS ELECTRONICOS S.A.S.
3664	830133588	AUTOMATIZACION Y COMUNICACIONES INDUSTRIALES SAS
3665	900379588	BS ON THE CLOUD S.A.S.
3666	80422977	SALDARRIAGA ANDRES
3667	900351892	ANDINA ELECTRONICA S.A.S.
3668	860002536	COLCERAMICA S.A.
3669	805017209	REGISTEL SOCIEDAD POR ACCIONES SIMPLIFICADA
3670	800218751	EMPRESA DE VIGILANCIA PRIVADA DELCOR LTDA
3671	1013616114	LAURA MILENA RODRIGUEZ MOSCOSO
3672	830004861	MCT S.A.S.
3673	900271375	GIN GREEN INGENIERIA NACIONAL S.A.S
3674	901135466	STUTTGART S.A.S.
3675	890104906	SERVIES LTDA
3676	800126987	GLOBALTRONICS DE COLOMBIA LTDA
3677	B01990449	MOABITS SOCIEDAD LIMITADA
3678	830106284	JOHANNA RUBIANO C.I. S.A.
3679	830112370	KLOVER INFORMATICA Y TELECOMUNICACIONES LTDA
3680	860013816	INSTITUTO DE SEGUROS SOCIALES A.R.P
3681	830131587	SERVICE SECURITY LTDA
3682	815000896	DICEL S.A. ESP
3683	900463244	ENERSINC SAS
3684	901144940	JM TECHNOLOGY S.A.S.
3685	900408668	TRUST & SECURITY TECHNOLOGY SAS
3686	800061585	FESTO S.A.S.
3687	1792609100001	LEGIO SEGURIDAD LEGSEGU CIA LTDA
3688	1094242491	GOMEZ JULIO CESAR
3689	900588106	SOLUCIONES INTEGRALES EN COMUNICACIONES INALAMBRIC
3690	900865984	INGENIERIA Y MANTENIMIENTOS INGINEER SAS
3691	860007335	BCSC
3692	800223402	INVERSIONES RUGO LTDA
3693	900234149	CARGA CONTROL S.A.S.
3694	900300843	AUTOMATIZACION DE PROCESOS SERVICIOS INTEGRADOS S.
3695	860068182	CREDICORP CAPITAL COLOMBIA S.A.
3696	900210029	ZAGA SECURITY LTDA
3697	800232795	TRANSPORTES LA VERDE S.A.
3698	1026589386	WILLIAM SALCEDO
3699	71374107	NARANJO DE LA CRUZ VLADIMIR
3700	901144523	NOATEC S.A.S.
3701	0992856556001	FLOPANNI S.A.
3702	13177473	SEPULVEDA DURAN JOSE LUIS
3703	860007538	FEDERACION NACIONAL DE CAFETEROS DE COLOMBIA
3704	900378038	INSA INGENIERIA S.A.S.
3705	811000740	ISAGEN S.A. ESP
3706	901307528	OMEGA GROUP SAS
3707	860034921	MEGABANCO S.A.
3708	05019013588637	SMARTSOLAR S.A. DE C.V.
3709	860013951	G4S SECURE SOLUTION COLOMBIA S.A.
3710	900002270	UNION TEMPORAL I Y M
3711	08019018033869	CELSIA HONDURAS S.A
3712	830138480	ROCA GPS S.A.S.
3713	901058440	EVOLUCION TIC S.A.S.
3714	901356347	GRUPO CVM SEGURIDAD SAS
3715	900365660	PROVEER INSTITUCIONAL S.A.S.
3716	830070527	REDEBAN S.A.
3717	901506651	PYMESGO S.A.S.
3718	830108482	INVERSIONES DAMA SALUD S.A.
3719	800126875	FLORES DE BOJACA S.A.S.
3720	830045472	GAS NATURAL CUNDIBOYACENSE S.A. E.S.P
3721	900230023	OOH REDES DIGITALES LTDA
3722	811043871	INTECCON COLOMBIA S.A.S.
3723	900096827	SOCIEDAD COLOMBIANA DE INV. PARA EL DESARROLLO CIE
3724	830023229	SOCIEDAD DISTRIBUIDORA DE ENERGETICOS S A S
3725	860067378	JM SECURITY LTDA
3726	900297074	GLOBAL SYSTEM SOLUTIONS S.A.S
3727	900504440	ISI INGENIERIA Y SERVICIOS INDUSTRIALES S.A.S.
3728	901017988	RED INTEGRADA DE SEGURIDAD S.A.S.
3729	85464538	MENDOZA VALBUENA JAVIER ENRIQUE
3730	39541979	REYES TORRES AMPARO CECILIA
3731	830113831	ALIANSALUD EPS S.A.
3732	830063683	TECNISEG DE COLOMBIA LTDA
3733	830097142	AGENCIA DE SEGURIDAD PROTECCION APROTEC LTDA
3734	88282037	DIAZ ALVAREZ IMAR ALONSO
3735	900345822	ALL COMERCIAL S.A.S.
3736	900135046	NEGOCIOS ASESORIAS Y SUMINISTROS S.A.S.
3737	900619863	STORK TECHNICAL SERVICES HOLDING BV SUC. COLOMBIA
3738	830027574	TIVIT COLOMBIA SAS
3739	824003310	PROTECOM LTDA
3740	811010349	SISTEMAS PUBLICOS S.A. E.S.P.
3741	901553238	SERVICAM SECURITY SAS
3742	830033765	INVERSER LTDA INVERSIONES Y SERVICIOS
3743	800209088	VIPERS LTDA
3744	37746010	PACHECO YOLANDA
3745	830062622	ARCANTEL LTDA
3746	901878286	XONESAT SAS
3747	830114737	GAS INSTRUMENT SAS
3748	COO890002858	COOTRANSCIEN
3749	900639680	SEGURIDAD ORBITAL S.A.S.
3750	10171381	CASTRO MURILLO CARLOS JULIO
3751	900233225	ENERMONT S.A.S. ESP
3752	800066388	A&S S.A..
3753	802020299	COMSATEC S.A.S.
3754	1023017269	BUITRAGO MURCIA ANGIE PAOLA
3755	1128401903	ZUÑIGA DUQUE LAYNOLL YEZID
3756	91528905	GAMBOA ORTEGA JOSE
3757	901209682	DT2 SAS
3758	900611037	CONTECH S.A.S.
3759	77093852	DIAZ LEON JAIME DAVID/PROTECOM COMERCIAL
3760	810004507	SECURITEAM TECHNOLOGIES S.A
3761	901405380	RASTREO Y MONITOREO SATELITAL SEGCONFI GPS
3762	900108210	SPECTRUM GLOBAL CONTROL LTDA
3763	80018289	SANCHEZ GARCIA JAVIER
3764	830081484	GENERAL PROTECTION SERVICE LTDA
3765	800169799	CELAR LIMITADA
3766	0614-220601-102-6	VSR EL SALVADOR S.A.  DE C.V.
3767	805003469	FORTOX SECURITY TECNOLOGIA LIMITADA
3768	900009482	DEINTEKO SAS
3769	1010199157	URBINA CASTRO CINDY MAYERLY
3770	830106007	INVERSIONES BERMAN 2001 S.A.S.
3771	900446704	MEDESCOM S.A.S.
3772	800185039	HONOR SERVICIOS DE SEGURIDAD LTDA
3773	800191973	INPEL S.A.
3774	802025099	MEGATRONIC SOCIEDAD POR ACCIONES SIMPLIFICADAS SAS
3775	901487892	SOLARSINU SAS
3776	800201668	SEGURIDAD ONCOR LTDA
3777	1070943960	BALLEN RODRIGUEZ DUVAN STEVEN
3778	130191557	POINT TELEMATIC TRACKING SYSTEM SRL
3779	899999068	ECOPETROL S.A.
3780	800195429	FLORES DEL CACIQUE S.A.S.
3781	800123857	FLORES JAYVANA S.A.S.
3782	890301649	FOSFATOS DE COLOMBIA S.A.
3783	900193764	PROCORR S.A.S.
3784	900060461	SECURITY COL LTDA
3785	1121818352	IZQUIERDO CUJAR CAMILO ANDRES
3786	805022290	NEWTECH SYSTEMS LTDA
3787	830035246	DELL COLOMBIA INC.
3788	0992419016001	OCEANSECURITY C.LTDA
3789	900702220	UNITRACK SAS
3790	900899077	INENERGY SAS
3791	901289008	CELTRACK GPS SAS
3792	79571462	MEDINA SAENZ JORGE GUILLERMO
3793	900161104	HONEYWELL COLOMBIA S.A.S.
3794	901674927	WESTCOL S.A.S.
3795	900762275	GLOBAL - TEC S.A.S
3796	860048015	JARDINES DE CHIA SAS
3797	811008426	ACUEDUCTOS Y ALCANTARILLADOS SOSTENIBLES S.A. E.S.
3798	830100582	COMPAÑIA DE VIGILANCIA PPH LTDA
3799	900524561	GLOBAL MALL TRADE COLOMBIA S.A.S.
3800	800060313	ROBOTEC COLOMBIA S.A.S.
3801	80417551	FERNANDEZ CHAVEZ HENRY RICARDO
3802	900741892	SEGURIDAD BUFFALO LIMITADA
3803	900640717	INSTALACION DE SISTEMAS SATELITALES SAS
3804	900698728	GRUPO ALMONATO S.A.S.
3805	900428468	ITALCOL ENERGIA S.A. E.S.P. ITALENER S.A. E.S.P.
3806	860030714	FUNDACION SERVICIO JURIDICO POPULAR
3807	830058272	CAM COLOMBIA MULTISERVICIOS S.A.S.
3808	807001532	CONSORCIO ICAMEX-TERMOTECNICA
3809	800193759	INGENIERIA Y REPRESENTACIONES S.A.
3810	901278943	REDTRACK SAS
3811	830101092	DUKE SEGURIDAD LIMITADA
3812	44444444	PRODUCCION Y LABORATORIO BISMARK
3813	800217972	TELMACOM S.A.S.
3814	800233072	METROALARMAS CALI
3815	802021888	PROMISOL S.A.S
3816	1007283385	GENTIL TORRADO ANDRES MAURICIO
3817	800085098	APCYTEL S.A.S.
3818	816004965	ESTATAL DE SEGURIDAD LTDA
3819	800130771	FLORES CANELON S.A.S.
3820	860526236	FLORES LA VALVANERA SAS
3821	830002313-0	FLORES DE LAS ACACIAS SAS
3822	900060991	UNION TEMPORAL TETRAMILENIO
3823	900380368	D & C EQUIPOS S.A.S.
3824	901575062	ENERLINK COLOMBIA S.A.S.
3825	804009247	CDT DE GAS
3826	3028868	MUNEVAR LOPEZ PEDRO JOSE
3827	890310752	SEGURIDAD SHATTER DE COLOMBIA LTDA. BIC.
3828	14993404	AGUADO RIVERA HEBERT
3829	901497104	LOGISTICA Y GPS S.A.S.
3830	1017127712	LONDOÑO CORDOBA CESAR AUGUSTO
3831	830512397	VIGILANCIA Y SEGURIDAD PLUS LIMITADA VISEPLUS LTDA
3832	900449823	SERTELCOL E.U
3833	890110188	INDEPENDENCE DRILLING S.A.
3834	900589209	SMART COIN SOLUTIONS S.A.S.
3835	901319967	COMUNICACIONES MARFE S.A.S
3836	830014146	DIGITAL COMUNICATION SYSTEMS S.A.S
3837	802015658	EDS-SERVICIOS ESPECIALES S.A.S.
3838	901357395	OA AUTOMATIZACION SAS
3839	900189465	PERKONS OPERATIONS UT PERKONS OPS
3840	800158850	PACKING S.A.S.
3841	1098682909	LIZARAZO RICO LUIS EDUARDO
3842	901408493	GPS 7000 SAS
3843	800249860	CELSIA COLOMBIA S.A. E.S.P.
3844	830101446	ANGEL SECURITY SAS
3845	830012843	MOTORIZADOS EXPRESS S A S
3846	900268385	ALPINA CAUCA ZONA FRANCA S.A.S.
3847	830126219	TELMETERGY LTDA
3848	900358272	HZ ENERGY S.A.S. ESP
3849	800128680	REENCAFE S.A.S.
3850	800010582	SEGURIDAD DE VIGILANCIA PRIVADA HORIZONTE LTDA
3851	900857905	ONE TRACKER GPS S.A.S
3852	53133314	ACERO BRAVO DIANA CAROLINA
3853	52854040	MONCADA SALAMANCA DIANA MARITZA
3854	815000764	PALMASEO S.A. ESP
3855	860534244	ATLAS COPCO COLOMBIA LTDA
3856	800188741	MDA SECURITY LTDA-MONITOREO DIGITAL ATLAS LTDA
3857	901515201	MACARENIA CORP
3858	890401617	INTUCARIBE LTDA
3859	900964359	INGENIERIA ELECTRICA ELECTRONICA TELECOMUNICACIONE
3860	900539544	SATGUARD SATELITAL S.A.S.
3861	800234493	SEGURIDAD FENIX DE COLOMBIA LTDA
3862	830090173	SECURITY SHOPS LIMITADA
3863	802011610	PROMOTORES DE LA SALUD DE LA COSTA SOCIEDAD POR AC
3864	899999294	SERVICIO GEOLÓGICO COLOMBIANO
3865	900796527	MARKMOVING S.A.S. BIC
3866	86085335	CAMELO MORENO OSCAR ANDRES
3867	800212879	VIGITRONIC LTDA
3868	901214616	SECOM GPS S.A.S.
3869	832001292	EMPOLLADORA COLOMBIANA S.A.
3870	76590844-2	SERVICIOS INFORMATICOS DE GEORERENCIACION ESPAL LT
3871	890900120	SUMICOL S.A.
3872	900867960	CONTROL INC SAS
3873	860450079	INVERSIONES GUTIERREZ GARCIA Y CIA S EN C
3874	802006191	ATLANTIS SUPLLY E.U.
3875	890117413	TECNIALARMAS LTDA
3876	900252838	CANAL CLIMA LTDA
3877	79990885	CARDONA MOLINA JOHN ALEXANDER
3878	901413483	SMART INTERNAL MOBILITY S.A.S.
3879	901208456	EUROPEAN CAR SERVICE SAS
3880	860052579	SURVISION SAS
3881	900262455	AMBULANCIAS MISION VITAL E.U.
3882	900209479	SUPRACAFE COLOMBIA S.A.
3883	1121926721	CESPEDES HERRERA STIWEN ANDRES
3884	830106244	COMTOR LTDA
3885	901361255	SOLUCIONES ENERGETICAS LA ESPAÑOLA SAS
3886	36751577	MARTINEZ ARTEAGA ANDREA LORENA
3887	900386059	SEL-TECH  DE COLOMBIA SAS
3888	900909505	MASCONTROL S.A.S.
3889	901394188	OPTIMUS FLEET DE COLOMBIA S.A.S.
3890	1075232624	CASTILLO LIZCANO JOHAN CAMILO
3891	900799652	DIVECO S.A.S.
3892	839000088	LAOS SEGURIDAD LTDA
3893	860011268	AMCOVIT LTDA
3894	900758181	HOLDING DELTA SIGMA COLOMBIA S.A.S.
3895	900516689	DODICA S.A.S.
3896	900678627	DAVISAN SECURITY LIMITADA
3897	16729804	ORDOÑEZ MONTENEGRO OSCAR
3898	5492687	SISTEMAS ELECTRONICOS DE SEGURIDAD
3899	830127657	LOGICS CONECTIVA LIMITADA
3900	901338206	MADS INGENIERIA S.A.S.
3901	809000735	SERVICIOS Y SUMINISTROS SAS
3902	816002019	EMPRESA DE ENERGIA DE PEREIRA S.A. E.S.P.
3903	817001892	VATIA S.A. ESP
3904	901280159	GAMA SATELITAL S.A.S.
3905	900357307	LAKSHMI TECHNOLOGY SAS
3906	814006621	TELNEXUS LTDA
3907	900866481	VIOSS COLOMBIA S.A.S.
3908	900182657	CONSORCIO CONSTRUCTORES VIALES DE NARIÑO
3909	84034760	MENDOZA AVILA ARNOLDO
3910	900816899	IDCO S.A.S.
3911	901004278	G4S INFOTEC S.A.S
3912	900511825	TRAZA GPS SAS
3913	900195551	SITAV S.A.S.
3914	800248600	DISTRICALC LTDA
3915	900241390	WINSTALL SECURITY LIMITADA
3916	890903035	TERMOTECNICA COINDUSTRIAL S.A.S.
3917	830067768	LIGHGEN INGENIERIA S.A.
3918	71364430	MARIN MORA JUAN PABLO
3919	860519046	EQUIPOS BANCARIOS DULON LTDA
3920	800027927	DATASCAN DE COLOMBIA LTDA
3921	901621085	INGENIERIA Y CONSULTORIA MC SAS
3922	901079129	IPROTECT S.A.S.
3923	900363279	LAP INTERNATIONAL S.A.
3924	900846226	ENERGIE COLOMBIA S.A.S.
3925	900161593	IKONO TECH S.A. EN REORGANIZACION
3926	901730530	ENCUENTRAME & TRACKGPS COMPANY SAS
3927	900570426	SOLUCIONES DE LOCALIZACION TRACKER S.A.S.
3928	901048516	SONNEN INGENIERIA DE COLOMBIA S.A.S.
3929	811042378	I.A.S. INGENIERIA APLICACIONES S.A.S.
3930	830068204	PROACTIVA DOÑA JUANA ESP S.A.
3931	900843992	SELECTRIK S.A.S.
3932	901135207	SOMELECR SAS
3933	800213173	CUIDAR LIMITADA
3934	890315310	SINCRON DISEÑO ELECTRONICO S.A.
3935	800106962	OMNITEMPUS LIMITADA
3936	1151945287	MONTENEGRO VARGAS DIANA MARICEL
3937	900646600	PREDADOR MOVIL SECURITY LTDA
3938	155658161-2-2017 DV	ECO POWER CENTRAL AMERICA S.A.
3939	830011743	EL ARROZAL Y CIA S C A
3940	800197268	DIAN
3941	5747876	RUIZ MARIN SEGISMUNDO
3942	830074526	ELECTRONIC TRAFIC S.A. SUCURSAL COLOMBIA
3943	800139802	GENESIS DATA S.A.S.
3944	802013776	DISWEB LIMITADA
3945	800022961	RM SECURITY PRODUCTS LTDA
3946	830042990	PAYER ELECTRONICA LTDA
3947	900806600	RELIANZ MINING SOLUTIONS S.A.S.
3948	800010701	LUIS ESTRADA & CIA SUCESORES LTDA
3949	900747958	CEINMER S.A.S.
3950	900569026	SURENERGY SAS ESP
3951	900902683	SKY GROUP DE COLOMBIA SAS
3952	901022402	TECNICAL SECURITY S.A.S.
3953	890904224	C.I. UNION DE BANANEROS DE URABA S.A. - UNIBAN
3954	830055573	GRUPO MILENIUM
3955	901162754	GOLAN TECNOLOGIA SAS
3956	900466209	PORSCHE COLOMBIA SAS
3957	900846272	SECURICOL SERVICES S.A.S.
3958	901035950	NEFOX SAS
3959	805019828	ID CO S.A. IDENTIFICACION COMPANY
3960	860003211	PROTABACO S.A.S.
3961	1127574373	MORA SUAREZ JORGE LUIS
3962	830081483	SECURITY MYC LTDA
3963	805021222	TRANSPORTES ESPECIALES ACAR LTDA
3964	900042577	COOPEGLOBAL
3965	900802610	SEGURIDAD ALEMANA LTDA
3966	860047906	MARPED GROUP S.A.
3967	901340875	TROBAPP DE COLOMBIA S.A.S
3989	72266361	ACENDRA REDONDO NILSON ENRIQUE
3992	900105229	A.B.G.  SERVICIOS & SEGURIDAD E.U.
3998	900840430	24 SATELITAL S.A.S.
4053	901509133	GXNET SAS
4002	71730668	A.I. RUIZCOM
4011	900131823	3 POINTECH S.A.S.
4016	810002209	A Y V INGENIERIA S.A.S.
4017	900495959	360 TECH S.A.S.
4019	860065464	360 GRADOS SEGURIDAD LTDA
4020	900587526	4S INGENIERIA S.A.S.
4023	900363790	3R INDUSTRIAL SUPPLY S.A.S.
4025	901072588	2ROBOTS SAS
4026	76056273	ZONA INDUSTRIAL LIMITADA
4028	830003564	EPS FAMISANAR  LTDA
4030	1000858860	JUAN FELIPE ROZO ROCHA
4031	1049650469	TOMAS OCHOA RAMIREZ
4032	53081475	LAURA ROJAS MACHUCA
4033	701468	PEREZ JIMENEZ ALEJANDRA CAROLINA
4034	800047781	ENECON SOCIEDAD POR ACCIONES SIMPLIFICADA
4035	80040295	CAMILO ANDRES ORTEGA TREJOS
4036	811030670	EMPRESTUR S.A.S
4037	830031632	INFOMEDIA SERVICE S.A.
4038	900048371	IA INDUSTRIAL SAS
4039	900496355	PARQUEADERO Y GRUAS ARIÑO S.A.S
4040	901382723	SOLUCIONES INTEGRALES ENERGÉTICAS, AMBIENTALES Y D
4041	901954211	ORBIX TECHNOLOGY S.A.S.
4042	901966600	ATERA COLOMBIA SAS
4043	804014275	ABSOLUT SECURITY LTDA
4044	900884036	4D TELEMETRY S.A.S.
4045	1054801708	WILTON CESAR LARA VALERO
4046	900053764	GLOBAL PANELA SAS
4047	900784874	IBOX SMART SOLUTIONS COLOMBIA S.A.S.
4048	900923094	RENERGY SAS
4049	901532471	SURTIELECTRONIC S.A.S.
4050	901618017	VOLTIO ENERGIA SAS
4051	901654286	FUNDACION BIONICA VISIONS
4052	901918760	SKUTER2GO S.A.S
4054	901800844	HIDROCLIMAS S.A.S
4055	804007616	GLOBAL SECURITY LIMITADA
4056	860075684	MOTO MART S.A.S
4057	900778654	CUATRO CONCEPTOS S.A.S
4058	901851471	DESERT POINT COLOMBIA SAS
4059	901891216	ANDES POWER S.A.S
4060	901944128	COLABSOFT SAS
4061	901984206	BLUE MOBILITY S.A.S
\.


--
-- Data for Name: contacto_despacho; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contacto_despacho (id_contacto, id_direccion, nombre_contacto, telefono, email, es_principal, email2, email3) FROM stdin;
1	2	Carlos Emliano Martinez	320156489	CarlosEMartinez@gmail.com	f	\N	\N
2	3	Carlos Alcatraz	3212455877	Carlosacatraz@hotmail.com	f	\N	\N
3	4	Juan Correa	320548879	Juanco@Enterprise.com.co	f	\N	\N
4	5	Juan Ramirez	321242234	Contacto@gmail.com	f	\N	\N
5	6	Carlos Restrepo	322144592	CarlosR@Telecomunicacciones.com	f	\N	\N
6	7	Carlos Martinez	3292944221	Contacto@gmail.com	f	\N	\N
7	8	Pablo	320256658	Pablo@contacto.com	f	\N	\N
8	9	Carlos Algerita	3202455658	ComunicacionTelecomunicaciones@gmail.com	f	\N	\N
9	10	Brinks Rodriguez	3202521222	brinnks@gmali.com	f	\N	\N
10	11	dsad	asda	asda	f	\N	\N
11	12	Elkin Recibe Pedidos	3220152214	Elkinrecibe@gmail.com	f	\N	\N
12	13	FERNEY DUCUARA y SUSAN	3214464703	ferney.ducuara@co.g4s.com  susan.pena@co.g4s.com	f	\N	\N
13	14	Nosea@gruposa.po	3200021521	Esto como es la vaina pelaoh	f	\N	\N
16	17	Angie	6017432828	oscaro@bismark.net.co	f	\N	\N
15	16	Bucaro	3303255622	rodriguezzz.jg@gmail.com	f	\N	\N
19	21	Cinemark Juan Carlos	3202122455	Carlos@gmail.com	f	\N	\N
20	22	Cesar Augusto Cifuentes	3227327410	Franco.Munoz@brinks.com.co	f	\N	\N
17	18	Angie Buitrago	6017432828	oscarospitiag@yahoo.es	f	\N	\N
18	23	Sin nombre	\N	\N	f	\N	\N
14	15	Carlos alguides	3202011544	Rodriguezzz@gmail.com	f	\N	\N
21	24	Richard Rios Reyes	320002311542	Richardr@Grupocol.com.co	f	\N	\N
23	25	Julian	322219645	rodriguezzz.jd@gmail.com	f	\N	\N
24	20	Sin nombre	\N	\N	f	\N	\N
25	20	Sin nombre	\N	\N	f	\N	\N
22	20	Sin nombre	\N	\N	f	\N	\N
26	26	Ferney Ducuara	3214464703	ferney.ducuara@co.g4s.com	f	\N	\N
\.


--
-- Data for Name: despacho_orden; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.despacho_orden (id_despacho_orden, id_orden_pedido, id_tipo_despacho, id_direccion, id_contacto, id_transportadora, numero_guia, fecha_despacho, observaciones, valor_servicio_flete, fecha_entrega_cliente, observaciones_proceso) FROM stdin;
47	80	2	25	23	7	G-245242	2026-02-10 10:47:00+00		3500	2026-02-11 10:48:00+00	Por enviar 
45	78	3	20	22	11	G-245242	2026-02-09 10:55:00+00		3500	2026-02-10 10:55:00+00	OK
50	83	2	25	23	7	\N	\N		\N	\N	\N
48	81	3	20	22	11	\N	\N		\N	\N	\N
51	84	2	25	23	7	\N	\N		\N	\N	\N
52	85	3	20	22	11	\N	\N		\N	\N	\N
46	79	3	20	24	\N	\N	\N	\N	\N	\N	\N
49	82	3	20	22	11	G-245284	2026-02-12 15:29:00+00	Todo ok para envio	3500	2026-02-21 15:38:00+00	Todo ok
53	90	3	20	25	\N	\N	\N	\N	\N	\N	\N
54	91	3	20	22	11	\N	\N	Todo ok para envio	\N	\N	\N
55	93	2	26	26	9	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: detalle_orden; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalle_orden (id_orden_detalle, id_orden_pedido, tipo_producto, id_equipo, id_linea_detalle, id_accesorio, id_servicio, cantidad, valor_unitario, plantilla, permanencia) FROM stdin;
43	78	equipo	1203	\N	\N	\N	18	100000	\N	\N
44	80	equipo	1738	\N	\N	\N	12	150000	\N	\N
45	80	equipo	1205	\N	\N	\N	5	80000	\N	\N
47	82	equipo	1203	\N	\N	\N	18	100000	\N	\N
48	83	equipo	1205	\N	\N	\N	5	80000	\N	\N
49	83	equipo	1738	\N	\N	\N	12	150000	\N	\N
46	81	equipo	1203	\N	\N	\N	18	100000	\N	\N
50	84	equipo	1205	\N	\N	\N	5	80000	\N	\N
51	84	equipo	1738	\N	\N	\N	12	150000	\N	\N
52	85	equipo	1203	\N	\N	\N	18	100000	\N	\N
53	79	equipo	1469	\N	\N	\N	12	20000	Se necesita plantilla especial	\N
54	90	equipo	1202	\N	\N	\N	3	800000	Necesita plantilla	\N
55	91	equipo	1203	\N	\N	\N	18	100000	\N	\N
56	93	equipo	1386	\N	\N	\N	635	272213	\N	\N
57	93	equipo	1434	\N	\N	\N	1131	97219	\N	\N
\.


--
-- Data for Name: direccion_despacho; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.direccion_despacho (id_direccion, id_cliente, nombre_direccion, direccion, ciudad, latitud, longitud, activa) FROM stdin;
1	3139	\N	Cra 28a #51-09	Bogota	\N	\N	t
2	3139	\N	Cra 28a #51-09	Bogota	\N	\N	t
3	3139	\N	CRA 115 #72-26	Bogota	\N	\N	t
4	3492	\N	CRA 57 #48-45	Bogota	\N	\N	t
5	3139	\N	CRA 45 #48-48	Bogota	\N	\N	t
6	3492	\N	cra 80 #51-95	Bogota	\N	\N	t
7	3492	\N	Cra 51 #54-65	Bogota	\N	\N	t
8	3139	\N	Por Definir	Bogota	\N	\N	t
9	3492	\N	Cra 23 #45-18	Bogota	\N	\N	t
10	3139	\N	Por definir	Bogota	\N	\N	t
11	3139	\N	No sea sapo	Bogota	\N	\N	t
12	3139	\N	Cra 25 #12-23	\N	\N	\N	t
13	3313	\N	KR 85D No.46A - 65 Engativa Complejo empresarial San Cayetano. Bodega 15	BOGOTÁ, D.C.	\N	\N	t
14	3139	\N	Cra 28a #65-32	Bogota	\N	\N	t
17	3492	\N	Cra. 7 # 84A - 29, Oficina: 301	BOGOTÁ, D.C.	\N	\N	t
20	2113	\N	AK7 84A-29 - Sede Bismark (Recoge en sucursal)	Bogotá	\N	\N	t
16	4023	\N	Cra 1 #33-06q	Bucaramanga	\N	\N	t
21	3139	\N	Cra 7 #88-26	Medellin	\N	\N	t
22	3139	\N	calle 18 # 69-51 Domesa-Barrio Zona in Montevideo	Bogota	\N	\N	t
18	3139	\N	Calle 60 sur # 68B - 39 Torre 2 Apto 1405	80005743	\N	\N	t
23	4044	\N	AK7 84A-29 - Sede Bismark (Recoge en sucursal)	Bogotá	\N	\N	t
15	3139	\N	cra 57 #22-32	Bucaramanga	\N	\N	t
24	3467	\N	Carrera 50 #80-60	Bogota	\N	\N	t
25	3139	\N	cra 28a #51-09	Bogota	\N	\N	t
26	3313	\N	KR 85D No.46A - 65 / Complejo empresarial San Cayetano. Bodega 15 / Engativá	BOGOTÁ, D.C.	\N	\N	t
\.


--
-- Data for Name: equipo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipo (id_equipo, codigo, nombre_equipo) FROM stdin;
1200	010151501	MAXTRACK - MXT 140A
1201	010321002	ENFORA - OEM
1202	010401005	RAVEN GPRS
1203	010401006	SIERRA MODEM RAVEN XE
1204	010401007	SIERRA MODEM RAVEN XT
1205	010401008	RAVEN EDGE
1206	010401012	SIERRA WIRELESS RV50
1207	010401013	GATEWAY RV50X  Pt # 1103052 - SIERRA WIRELESS
1208	010401014	SIERRA WIRELESS LX60, LTE-M/NB-IoT GLOBAL
1209	010401016	SIERRA WIRELESS LX40, LTE - M/NB - IoT
1210	010401017	SIERRA WIRELESS RV50X
1211	010401060	MODEM REDEBAN
1212	010401061	MODEM INSSA
1213	010401062	MODEM RAYCO - MOTOROLA
1214	010401063	MODEM ATH
1215	010401064	MODEM TELDAT
1216	010401065	CATERPILLAR B15Q
1217	0104010651	CATERPILLAR S60
1218	0104010652	CATERPILLAR S48C
1219	01040106520	SMARTHPHONE RUGGED S48C CATERPILLAR
1220	01040106521	CATERPILLAR S48C
1221	0104010653	CATERPILLAR S61
1222	0104010654	CATERPILLAR S31
1223	0104010655	CATERPILLAR S42
1224	01040106550	CATERPILLAR S42
1225	01040106551	CATERPILLAR S52
1226	01040106552	CATERPILLAR S42 H+
1227	0104010656	CATERPILLAR S52 DEMO
1228	0104010657	MOTOROLA DEFY MODEL: XT2083-8 - RUGGED PHONE 4+64GB DEMO
1229	0104010658	MOTOROLA DEFY MODEL: XT2083-8 - RUGGED PHONE 4+64GB
1230	0104010659	BLACKVIEW RUGGED PHONE MODEL: BL5000*
1231	010401066	MODEM  VISE
1232	010401067	MODEM CARVAJAL
1233	010401068	GATEWAY RV55-LTEA-PRO Global  Pt # 1104332 - SIERRA WIRELESS
1234	010401069	GATEWAY RV55-LTEA-PRO WIFI Global Pt # 1104331 SIERRA WIRELE
1235	010401070	MODEM PEESA
1236	010403001	LOCALIZADOR 7x C 3G ext GALILEOSKY
1237	0104030010	LOCALIZADOR V10C LTE Cat-1 10 INPUTS GALILEOSKY
1238	010403002	LOCALIZADOR V7X LTE Cat-m1 GALILEOSKY
1239	010403003	LOCALIZADOR GPS V10 LTE Cat-1 6 INPUTS GALILEOSKY
1240	010403004	LOCALIZADOR 7x 3G GALILEOSKY
1241	010403005	LOCALIZADOR V10 LTE Cat-1 DEMO - GALILEOSKY
1242	010403006	SIMULADOR OBD SAE J1939 - GALILEOSKY
1243	010403007	SIMULADOR OBD FOR CAR ISO 15765-4 - GALILEOSKY
1244	010403008	LOCALIZADOR GPS V10 PLUS 8 INPUTS LTE GALILEOSKY
1245	010403009	LOCALIZADOR 7x C 3G ext DEMO - GALILEOSKY
1246	01042100	SUNTECH ST20
1247	010421000	SUNTECH ST25T
1248	0104210001	SUNTECH ST20M
1249	01042100011	MODULO EXPANSOR GPS ST20U SUNTECH
1250	01042100099	SUNTECH ST3300E
1251	010421003	ENFORA SPIDER SAGL GPRS
1252	010421004	ENFORA OEM GPRS
1253	010421005	LOCALIZADOR ST4310 SUNTECH
1254	010421006	ENFORA SPIDER SAG PLUS
1255	010421007	ENFORA SPIDER SAG PLUS FOTA
1256	010421008	ENFORA SPIDER SAG PLUS FOTA CON KIT
1257	010421009	LOCALIZADOR ST4310R SUNTECH
1258	0104210091	LOCALIZADOR ST4310S SUNTECH
1259	0104210092	LOCALIZADOR ST4310W SUNTECH
1260	010421009221	SUNTECH ST3310U
1261	010421009222	LOCALIZADOR ST3310W SUNTECH
1262	0104210093	SUNTECH ST4310U
1263	0104210094	SUNTECH ST4310M
1264	0104210095	LOCALIZADOR ST4310U DEMO SUNTECH
1265	0104210099	SUNTECH ST4315
1266	01042100991	SUNTECH ST4305
1267	01042101	LOCALIZADOR LW4G-WRP SA - LYNKWORLD
1268	010421010	SUNTECH ST600 MD
1269	0104210100	SUNTECH ST419G
1270	010421011	ENFORA SPIDER MTGU GSM2358
1271	010421012	ENFORA SPIDER MT4000
1272	010421014	LOCALIZADOR LW4G-OA SA OBD - LYNKWORLD
1273	010421015	EQUIPOS CARVAJAL
1274	010421016	LOCALIZADOR LW4G-12GSA - LYNKWORLD
1275	010421017	DESTORNILLADOR BRISTOL AGUJA FILETEADORA - LYNKWORLD
1276	010421018	ENFORA SPIDER MTGU 2438 ACELEROMETER
1277	010421019	ENFORA SPIDER MT 2500
1278	01042102	LOCALIZADOR LW4G-WRA SA - LYNKWORLD
1279	010421020	ENFORA - SPIDER MINI MT SS
1280	010421022	ENFORA MT 3000 (GSM 2374)
1281	010421023	TECHBASE NPE X500
1282	010421024	LOCALIZADOR LW4G-5E SA - LYNKWORLD
1283	010421025	BATERIA 3,7 V 3500 mAh - LYNKWORLD
1284	010421026	--------------------------
1285	010421040	ENFORA - SA 2100
1286	0104210401	ENFORA - MT1200
1287	010421041	SUNTECH ST940
1288	0104210411	SUNTECH ST710R
1289	0104210412	SUNTECH ST940S
1290	010421042	SUNTECH ST340LC
1291	0104210421	SUNTECH ST340
1292	0104210422	LOCALIZADOR ST4340LC SUNTECH
1293	0104210423	SUNTECH ST3340LC
1294	01042104233	SUNTECH ST3340
1295	0104210425	SUNTECH ST4340T
1296	0104210426	SUNTECH ST4340
1297	010421043	SUNTECH ST300R
1298	0104210431	LOCALIZADOR ST300R DEMO - SUNTECH
1299	0104210433	SUNTECH ST4300R
1300	0104210434	LOCALIZADOR ST4300 SUNTECH
1301	0104210435	SUNTECH ST4300T
1302	010421044	ENFORA MT 3060
1303	010421045	ENFORA SAG 3G
1304	010421046	HONEYWELL SAT 401E
1305	010421047	ENFORA MT4100
1306	010421049	SUNTECH ST300H
1307	01042105	LOCALIZADOR LW4G-WRB SA - LYNKWORLD
1308	010421053	MODEM SAT TERMINAL WITH
1309	010421054	SUNTECH ST300P
1310	010421057	SUNTECH ST3940
1311	0104210577	SUNTECH ST3940S
1312	0104210578	SUNTECH ST4940S
1313	0104210579	LOCALIZADOR ST4945 SUNTECH
1314	010421058	LOCALIZADOR ST4500 SUNTECH
1315	0104210580	LOCALIZADOR ST4945S SUNTECH
1316	01042106	PROGRAMADOR NT-LINK 4G
1317	010421066	SUNTECH ST730 SIGFOX
1318	010421067	SUNTECH ST730 SIGFOX - WIFI
1319	010421068	SUNTECH ST730C SIGFOX - GPS
1320	0104210687	SUNTECH ST730G SIGFOX - GPS
1321	010421069	SUNTECH ST730F SIGFOX - GPS - WIFI
1322	01042107	LOCALIZADOR LW4G-4D - LYNKWORLD
1323	010421070	SUNTECH ST330II GPS INTERNO
1324	010421071	LOCALIZADOR ST300A SUNTECH
1325	0104210711	LOCALIZADOR ST3300 SUNTECH
1326	01042107112	LOCALIZADOR ST3300R SUNTECH
1327	010421071122	SUNTECH ST3300RP
1328	010421071123	SUNTECH ST3310R
1329	010421071124	LOCALIZADOR ST3310 SUNTECH
1330	010421072	SUNTECH ST330E GPS EXTERNO
1331	010421075	SUNTECH ST600R
1332	0104210755	LOCALIZADOR ST600R DEMO - SUNTECH
1333	010421076	SUNTECH ST300B
1334	010421077	SUNTECH ST300C
1335	010421078	SUNTECH ST300D
1336	01042108	LOCALIZADOR LW4G-5A - LYNKWORLD
1337	010421080011	MODEM LTE MIFI M022T  H3S
1338	0104210800112	H3S M022T LTE MIFI (DEMO)
1339	010421080012	MODEM LTE MIFI M271T H3S
1340	010421080013	ROUTER NOTION R01 H3SWIFI_9F09 - H3S
1341	010421080014	MODEM LTE MIFI R01 3G/4G H3S
1342	010421080015	MODEM LTE MIFI M281T 4.5G H3S
1343	010421080016	MODEM LTE MIFI M281T 4.5G DEMO H3S
1344	010421080017	ROUTER 4G CPE - R023 - DEMO
1345	010421080018	MODEM PORTATIL R023 3G/4G H3S
1346	010421080019	MODEM WIFI LTE 4G MODEL: MF293N ZTE
1347	010421080020	MODEM WIFI LTE 4G MODEL: MF971L ZTE
1348	010421081	SUNTECH ST300K
1349	010421082	SUNTECH ST300V
1350	010421083	LOCALIZADOR ST310U SUNTECH
1351	0104210831	SUNTECH ST3310RW
1352	01042108312	LOCALIZADOR ST3310P DEMO - SUNTECH
1353	0104210832	LOCALIZADOR ST310UC2 DEMO - SUNTECH
1354	0104210833	PROGRAMADOR ST-LINK/V2 SUNTECH
1355	0104210834	LOCALIZADOR ST310UC2 SUNTECH
1356	01042108341	MYROPE M588FA
1357	01042108342	MYROPE M558FA
1358	01042108343	MYROPE M588FS (VEHICLE GPS TRACKER)
1359	01042108344	CONCOX JM-VL03 GNSS VEHICLE TERMINAL (DEMO)
1360	01042108345	LOCALIZADOR VEHICULAR LCV17 4G+2G DEMO - LOTIM TECHNOLOGY
1361	01042108346	LOCALIZADOR BICYCLE LCE20 LED DEMO - LOTIM TECHNOLOGY
1362	01042108347	CAMARA LCD02 4G ADAS DMS 2CH DVR DEMO - LOTIM TECHNOLOGY
1363	0104210840	PROGRAMADOR EEPROM FLASH BIOS USB - ROBUSTEL
1364	01042109	LOCALIZADOR LW4G-6ESA - LYNKWORLD
1365	0104210910	LOCALIZADOR ST4410G SUNTECH
1366	0104210911	LOCALIZADOR ST4410G SUNTECH
1367	0104210912	LOCALIZADOR ST4410GC SUNTECH
1368	010421093	SUNTECH ST640LC
1369	010421094	SUNTECH ST500
1370	010421095	SUNTECH ST640
1371	010421096	LOCALIZADOR ST410G SUNTECH
1372	010421097	LOCALIZADOR ST410GC SUNTECH
1373	010421098	LOCALIZADOR ST3940B SUNTECH
1374	0104210987	LOCALIZADOR ST730P-4 SIGFOX ID: 2C7E12 DEMO - SUNTECH
1375	0104210988	LOCALIZADOR ST3940M SUNTECH
1376	010421099	SUNTECH ST40000
1377	010421101	LOCALIZDOR ST3500 SUNTECH
1378	010421102	LOCALIZADOR ST449GC DEMO SUNTECH
1379	010421106	LOCALIZADOR ST4950 SUNTECH
1380	010421107	LOCALIZADOR ST4950B SUNTECH
1381	010421108	LOCALIZADOR ST4955 SUNTECH
1382	01042111	LOCALIZADOR LW4G-OA - LYNKWORLD
1383	010421110	LOCALIZADOR ST8310 DEMO SUNTECH
1384	010421111	LOCALIZADOR ST8310 SUNTECH
1385	010421112	LOCALIZADOR ST8300R SUNTECH
1386	010421113	LOCALIZADOR ST8300 SUNTECH
1387	010421114	LOCALIZADOR ST8300E SUNTECH
1388	010421115	LOCALIZADOR ST4505 SUNTECH
1389	010421116	BATERIA LI-ION SPBA-118660 3.7V / 7.8Ah, ST3300/ST4300 SUNTE
1390	010421117	LOCALIZADOR ST4315W DEMO SUNTECH
1391	010421118	LOCALIZADOR ST8310UM DEMO SUNTECH
1392	010421119	LOCALIZADOR ST8310UM SUNTECH
1393	01042112	LOCALIZADOR LW4G-12D - LYNKWORLD
1394	010421120	LOCALIZADOR ST480 SUNTECH
1395	010421121	LOCALIZADOR ST8310W DEMO SUNTECH
1396	010421122	LOCALIZADOR SD 8000 LTE/GNSS TERMINAL DEMO - SUNTECH
1397	010421123	CÁMARA DE MONITOREO ST9730 LTE Cat-4 DEMO - SUNTECH
1398	01042113	LOCALIZADOR LW4G-12G - LYNKWORLD
1399	01042114	LOCALIZADOR LW4G-6E - LYNKWORLD
1400	01042115	LOCALIZADOR LW4G-0B - LYNKWORLD
1401	01042116	ARNES PARA GPS VEHICLE TRACKER (extension cable) - LYNKWORL
1402	01042117	LOCALIZADOR LW4G-SOLAR - LYNKWORLD
1403	01042118	LOCALIZADOR LW4G-MASS-P - LYNKWORLD
1404	01042119	LOCALIZADOR LW4G-5EP LYNKWORLD
1405	01042120	LOCALIZADOR LW910L LYNKWORLD
1406	01042121	LOCALIZADOR LW910L-RELAY LYNKWORLD
1407	010447000	RUPTELA FM-Eco4+ES
1408	010447001	RUPTELA FM-Eco4 Light + 3G
1409	010447002	RUPTELA FM-ECO3
1410	010447003	RUPTELA FM-Plug4+
1411	010447004	RUPTELA FM-Plug4+
1412	010447005	RUPTELA FM-Pro4
1413	010447006	RUPTELA FM-Eco4+
1414	010447007	RUPTELA FM-Eco4ligh+
1415	0104470077	RUPTELA FM-Eco4ligh+ S
1416	010447009	RUPTELA EasyCAN (J1708)
1417	010447010	RUPTELA EcoDrive panel
1418	010447011	RUPTELA CARD RFID 1-WIRE
1419	010447012	RUPTELA EasyCAN (J1939)
1420	010447013	RUPTELA 1-WIRE RFID READER
1421	010447014	RUPTELA FM-Tco4-HCV
1422	0104470144	RUPTELA FM-Tco4-3G
1423	010447015	RUPTELA FM-Tco4-LCV
1424	010447016	RUPTELA ECO4 USB CABLE
1425	010447017	RUPTELA PANIC BUTTON
1426	010447018	RUPTELA RFID RS232
1427	010447019	RUPTELA RFID RS232 CARD
1428	010447021	RUPTELA Temperature sensor
1429	011441001	HONGDIAN - H7921 3G HSUPA
1430	011441002	HONGDIAN - H8922 HSUPA
1431	0404210067	INVERSOR SEISA DE 24V - 300 W MODEL: JM-300W
1432	0404210069	INVERSOR TRUPER 12V - 120 W - MODEL: INCO-100
1433	040421017	TCO3 CON 485
1434	0404210191	SENSOR DE PRESION ELLENEX PTS2-L
1435	0404210192	INDICADOR ELECTRONICO DE PESO
1436	04042101922	SMART SPOT AIR QUALITY (SS04)
1437	04042101923	EXPANSION DE CALIDAD DEL AIRE
1438	04042101924	CONNECTION CABLE FOR AIR QUALITY EXTENSION
1439	04042101925	SOLAR RADIATION PROTECTION SHIELD
1440	04042101926	ANCHORING ELEMENTS FOR SMART SPOT CORE CONTROLLER SYSTEM
1441	04042101927	ANCHORING ELEMENTS FOR AIR QUALITY EXPANSION
1442	04042101928	NOISE SENSOR (MICROPHONE)
1443	04042101929	ADAPTADOR AC (12V/3A)
1444	0404210193	KIT DE MONTAJE PARA TANQUE C/4 APOYOS
1445	04042101930	ROUTER BLUETTOOTH CASSIA S2000
1446	10421022	NOVATEL MT 1200
1447	10421023	NOVATEL SA 2100
1448	1042108349	LOCALIZADOR 4G OBD VL502 CONCOX
1449	120436002	INTERFAZ PEGASUS STANDARD
1450	120436004	INTERFAZ PEGASUS ETHERNET POCKET
1451	120436005	PEGASUS ETHERNET STANDARD
1452	120436007	PEGASUS GPRS ETHERNET FULL
1453	120436008	PEGASUS GPRS POCKET
1454	120436012	SWITCH INDUSTRIAL ETHERNET EDS-208 MOXA
1455	1204360122	FUENTE DE VOLTAJE 10A/24VDC S8VKG24024
1456	120436013	INTERFAZ PEGASUS GPRS FULL
1457	120436017	LOGO 100411779 6ED1052-1MD08-0BA0
1458	120436020	INTERFAZ PEGASUS GPRS POCKET
1459	1404050121	CONVERSOR USB A TTL
1460	1404050123	CONTROLADOR LORA I/O LT-33222-L
1461	1404050125	HMI INTOUCH WONDERWARE
1462	1404050129	IMOD X500 M3-3G-WIFI-LORA
1463	140405013	HUAWEI E5372
1464	1404050130	NPE-X500-M38-3G-WIFI-LORA915MHz
1465	140405014	ALCATEL ONETOUCH PB60
1466	140405015	SERVIDOR HP ML150G6 QC XEON E5504
1467	140405016	SERVER STAND X PROCESADOR
1468	140405018	ROUTER R3000-L3P PN: A008401 ROBUSTEL
1469	140405019	ROUTER R3000-L4L PN: B025712 ROBUSTEL
1470	140405020	NTC - 6200 - 01 - 3G M2M ROUTER
1471	1404050201	NT LINK 3G
1472	14040502011	NT LINK 3G MUESTRA
1473	14040502012	NT-Com 2 3G
1474	140405020122	NT-Com 2 3G DEMO
1475	14040502013	COMUNICADOR WIFI App NETIO
1476	14040502014	NT LINK 4G DEMO NETIO SRL
1477	140405020141	NT LINK 4G
1478	140405020142	NT-Com 2 4G DEMO NETIO SRL
1479	14040502015	RECEPTORA REMOTA LINEA RRL
1480	14040502016	NT-Com 2 4G NETIO SRL
1481	14040502017	NT LINK 4G NETIO SRL
1482	14040502018	CENTRAL SMART ALARM MONITORADA - VETTI - DEMO
1483	140405021	ROBUSTEL R3000-3P WIFI PN: A.003.027
1484	140405022	ROUTER R3000-4L PN: A003078 ROBUSTEL
1485	1404050221	ROUTER R3000-4L PN: B018728 ROBUSTEL
1486	140405023	ROUTER R3000-4L PN: A003075 ROBUSTEL
1487	140405024	ROUTER R3000-L3P PN: B025402 ROBUSTEL
1488	140405025	ROUTER R2110-4L PN: B044705 ROBUSTEL
1489	1404050256	ROUTER R2010-A-4L-A03AU PN: B069705 DEMO ROBUSTEL
1490	1404050257	ROUTER R2010-A-4L-A03AU PN: B069705 ROBUSTEL
1491	1404050258	ROUTER R2010-A-4L DEMO ROBUSTEL
1492	1404050259	ROUTER R5020-5G-A09GL-A PN: B098004 ROBUSTEL
1493	140405026	ROBUSTEL R3000-LG4LA LORA
1494	1404050260	ROUTER R2010-A-4E-A26AU PN: 069724 ROBUSTEL
1495	1404050261	SIMULADOR J1939 OBD II ELM327  FOR TRUCK SHENZHEN
1496	1404050262	SIMULADOR J1939 OBD II ELM327 FOR CAR SHENZHEN
1497	1404050263	ROUTER R5020-5G-A09GL-B PN: B064802 ROBUSTEL
1498	1404050264	ROUTER R5020L-A-5G-A PN: A098002 DEMO ROBUSTEL
1499	1404050265	ROUTER R2010-B-4L-A03AU PN: B069709 DEMO ROBUSTEL
1500	1404050267	ROUTER R5020L-A-5G-A25GL PN: B098004 DEMO ROBUSTEL
1501	1404050268	ROUTER R5020L-C-5G-A25GL PN: B098008 ROBUSTEL
1502	1404050269	ROUTER R5030-A-5G-A030EU PN: B015400001 DEMO - ROBUSTEL
1503	1404050270	ROUTER R5020L-A-5G-A25GL PN: B098004 (A009810002) - ROBUSTEL
1504	1404050271	ROUTER R1510e-4L  PN: B004800720 (A004800727) DEMO - ROBUSTE
1505	1404050272	ROUTER R2010e-4L  PN: B006900731 DEMO - ROBUSTEL
1506	140405030	SERVIDOR POWEREDGE R730XD - DELL
1507	140405039	ROBUSTEL R3000-3P
1508	140405040	ROUTER MODEM NTC-6200-02
1509	140405049	HUAWEI Y320
1510	140505001	INTERFAZ GPRS V.2
1511	150402501	ROUTER R2000-4L WIFI PN: B014740 ROBUSTEL
1512	150402509	ROUTER R2000-D4L1 PN: B015722 ROBUSTEL
1513	150402510	ROBUSTEL R2000-3P
1514	150402514	ROUTER R2000-D4L2 PN: B015724 ROBUSTEL
1515	150402515	ROUTER R2000-4L PN: B014737 ROBUSTEL
1516	1504025155	ROUTER R2000-E4L1 PN: B022719 ROBUSTEL
1517	15040251551	ROBUSTEL R3000-LG4LA
1518	15040251552	CABLE DE PODER ROBUSTEL R3000 - LG4LA
1519	15040251553	ANTENA PLASTIC CELLULAR PARA R3000-LG4 PN: E003100 ROBUSTEL
1520	15040251554	ANTENA PLASTIC LORA PARA R3000-LG4LA PN: E003144 ROBUSTEL
1521	15040251555	CABLE SERIAL M12 8PN R3000 - LG4LA
1522	15040251556	CABLE ETHERNET 4PIN R3000 - LG4LA
1523	15040251557	CARCASA TPH6700-R3000LG PARA R3000-LG4L ROBUSTEL
1524	15040251558	ANTENA STLXX01017 - DEMO STARLINK
1710	5040250660	ROUTER MAIPU MP2806
1525	15040251559	SISTEMA DE RECEPCIÓN DE INTERNET UTA-231 MINI STARLINK
1526	150402517	ROBUSTEL R2000-4L MODULO HUAWEI
1527	150402518	ROBUSTEL R2000 - L3PA
1528	150402519	ROBUSTEL R2000 - L3PB
1529	150402520	ROBUSTEL R2000 - L4LA
1530	1504025200	ROBUSTEL R2000 - L4LA WIFI
1531	150402522	MODULO TRANSCEPTOR HSFP-24-3312S-22F HI OPTEL
1532	150402523	SFP-1GBU10(34)-K04
1533	1504025230	MODULO TRANSCEPTOR SFP-10GSR-S01 EON TECHNOLOGY
1534	1504025231	MODULO TRANSCEPTOR SFP-1GBU20[35]-K06 EON TECHNOLOGY
1535	15040252310	MODULO TRANSCEPTOR SFP-10GLR-M05 EON TECHNOLOGY
1536	15040252311	MODULO TRANSCEPTOR MP-S31121-3CDL20 SFP 1,25G 1310nm MAIPU
1537	15040252312	MODULO TRANSCEPTOR MP-S311X2-NCL10 MAIPU
1538	15040252313	MODULO TRANSCEPTOR SFP-10GLR-M05 EON TECHNOLOGY - DEMO
1539	15040252314	MODULO TRANSCEPTOR SFP-10GLR-M02 EON TECHNOLOGY
1540	15040252315	MODULO TRANSCEPTOR SFP-1GLX-M02 EON TECHNOLOGY
1541	15040252316	MODULO TRANSCEPTOR SFP-1GTX RJ45  EON TECHNOLOGY - DEMO
1542	15040252317	JUNIPER QSFP-100GBASE-LR4
1543	15040252318	Juniper JNPQSFP-4X10GE-LR
1544	15040252319	MODULO TRANSCEPTOR SFP-10GER[B]-S01 - EON TECHNOLOGY
1545	1504025232	MODULO TRANSCEPTOR SFP-1GBD20[53]-K06 EON TECHNOLOGY
1546	15040252320	MODULO TRANSCEPTOR SFP-10GZR-S01 - EON TECHNOLOGY
1547	15040252321	MODULO TRANSCEPTOR SFP-1GBD40[54]-K06 - EON TECHNOLOGY
1548	15040252322	MODULO TRANSCEPTOR SFP-1GBU40[45]-K06 - EON TECHNOLOGY
1549	15040252323	MODULO TRANSCEPTOR XFP-10GLRSR1 - EON TECHNOLOGY
1550	15040252324	MODULO TRANSCEPTOR SFP-10GER[B]-M06 - EON TECHNOLOGY
1551	15040252325	JUNIPER SRXSFP-10GE-LR
1552	15040252326	MODULO TRANSCEPTOR SFP-10GLX-M05 EON TECHNOLOGY
1553	15040252327	MODULO TRANSCEPTOR SFP-10GLR-A EON TECHNOLOGY
1554	15040252328	CISCO SFP-10G-LR-S01
1555	15040252329	JUNIPER-QSFP-100G-ER4L
1556	1504025233	MODULO TRANSCEPTOR SFP-10GBU20[23]-K06 EON TECHNOLOGY
1557	15040252330	MODULO TRANSCEPTOR SFP-1GLX-E24 EON TECHNOLOGY
1558	15040252331	CISCO SFP-10G-LR-S
1559	15040252332	MODULO TRANSCEPTOR SFP-1GLX-E24 EON TECHNOLOGY
1560	15040252333	RAISECOM USFP-GB/SS13D-R
1561	15040252334	RAISECOM USFP-GB/SS15D-R
1562	15040252335	MODULO TRANSCEPTOR SFP-1GSX-E00 DEMO EON TECHNOLOGY
1563	15040252336	MODULO TRANSCEPTOR SFP-1GSX-E11 DEMO EON TECHNOLOGY
1564	1504025234	MODULO TRANSCEPTOR SFP-10GBD20[32]-K06 EON TECHNOLOGY
1565	1504025235	MODULO TRANSCEPTOR SFP-1GTX-S01 EON TECHNOLOGY
1566	1504025236	MODULO TRANSCEPTOR SFP-1GLS-S01 EON TECHNOLOGY
1567	1504025237	MODULO TRANSCEPTOR SFP-1GSX-S01 EON TECHNOLOGY
1568	1504025238	CISCO SFP-10G-SR-S
1569	1504025239	MODULO TRANSCEPTOR SFP-10GLR-S01 EON TECHNOLOGY
1570	1504025240	MODULO TRANSCEPTOR SFP-10GT-S01 EON TECHNOLOGY
1571	1504025244	MODULO TRANSCEPTOR SFP-10GLRi-S01 EON TECHNOLOGY
1572	1504025245	Cisco GLC-SX-MMD
1573	1504025246	Cisco GLC-TE
1574	1504025247	Cisco SFP-10GER-S
1575	1504025248	MODULO TRANSCEPTOR SFP-1GSX-K04 EON TECHNOLOGY
1576	1504025249	Cisco SFP-10GZR-S
1577	1504025250	MODULO TRANSCEPTOR QSFP-40GER4 EON TECHNOLOGY (JUNIPER)
1578	1504025251	MODULO TRANSCEPTOR QSFP-40GER4 EON TECHNOLOGY (ARISTA)
1579	1504025252	MODULO TRANSCEPTOR QSFP-40GER4-M02 ARISTA EON TECHNOLOGY
1580	1504025253	MODULO TRANSCEPTOR QSFP-40GER4-M06 JUNIPER EON TECHNOLOGY
1581	1504025254	SFP-10GLR-S20
1582	1504025255	SFP-10GLR-K01
1583	1504025256	MODULO TRANSCEPTOR SFP-1GLXi-M20 EON TECHNOLOGY (NOKIA)
1584	1504025257	MODULO TRANSCEPTOR SFP-10GSRi-M20 EON TECHNOLOGY (NOKIA)
1585	1504025258	MODULO TRANSCEPTOR SFP-1GLX-M05 EON TECHNOLOGY (HUAWEI)
1586	1504025259	MODULO TRANSCEPTOR SFP-10GLR-M05 EON TECHNOLOGY - DEMO
1587	1504025260	EON TECHNOLOGY - M20 SPF+10GBASE, LR, 1310NM, DFB,10KM,DUA
1588	1504025261	MODULO TRANSCEPTOR SFP-1GSX-S20 EON TECHNOLOGY
1589	1504025262	MODULO TRANSCEPTOR SFP-10GLR-M07 - EON TECHNOLOGY
1590	1504025263	MODULO TRANSCEPTOR SFP-10GLRi-E EON TECHNOLOGY
1591	1504025264	MODULO TRANSCEPTOR SFP-10GLRi-E11 EON TECHNOLOGY
1592	1504025265	MODULO TRANSCEPTOR SFP-1GLXi-E24 EON TECHNOLOGY
1593	1504025266	MODULO TRANSCEPTOR SFP-1GBD10[43]-S23 EON TECHNOLOGY
1594	1504025267	MODULO TRANSCEPTOR SFP-1GBU10[34]-S23 EON TECHNOLOGY
1595	1504025269	MODULO TRANSCEPTOR SFP-10GSR-S13 EON TECHNOLOGY
1596	1504025270	MODULO TRANSCEPTOR SFP-10GLR-S05 EON TECHNOLOGY
1597	1504025271	MODULO TRANSCEPTOR SFP-OC12BD20[53]-S28 - EON TECHNOLOGY
1598	1504025272	MODULO TRANSCEPTOR SFP-OC12BD40[53]-S28 - EON TECHNOLOGY
1599	1504025273	MODULO TRANSCEPTOR SFP-OC12BD80[54]-S28 - EON TECHNOLOGY
1600	1504025274	MODULO TRANSCEPTOR SFP-OC12BU20[35]-S28 - EON TECHNOLOGY
1601	1504025275	MODULO TRANSCEPTOR SFP-OC12BU40[35]-S28 - EON TECHNOLOGY
1602	1504025276	MODULO TRANSCEPTOR SFP-OC12BU80[45]-S28 - EON TECHNOLOGY
1603	1504025277	MODULO TRANSCEPTOR SFP-OC12DW100[21]-S28 - EON TECHNOLOGY
1604	1504025278	MODULO TRANSCEPTOR SFP-OC12IR1-S28 - EON TECHNOLOGY
1605	1504025279	MODULO TRANSCEPTOR SFP-OC12LR1-S28 - EON TECHNOLOGY
1606	1504025280	MODULO TRANSCEPTOR SFP-OC3BD20[53]-S28 - EON TECHNOLOGY
1607	1504025281	MODULO TRANSCEPTOR SFP-OC3BU20[35]-S28 - EON TECHNOLOGY
1608	1504025282	MODULO TRANSCEPTOR SFP-OC48BD20[53]-S28 - EON TECHNOLOGY
1609	1504025283	MODULO TRANSCEPTOR SFP-OC48BD40[53]-S28 - EON TECHNOLOGY
1610	1504025284	MODULO TRANSCEPTOR SFP-OC48BD80[54]-S28 - EON TECHNOLOGY
1611	1504025285	MODULO TRANSCEPTOR SFP-OC48BU20[35]-S28 - EON TECHNOLOGY
1612	1504025286	MODULO TRANSCEPTOR SFP-OC48BU40[35]-S28 - EON TECHNOLOGY
1613	1504025287	MODULO TRANSCEPTOR SFP-OC48BU80[45]-S28 - EON TECHNOLOGY
1614	1504025288	MODULO TRANSCEPTOR SFP-OC48DW80[21]-S28 - EON TECHNOLOGY
1615	1504025289	MODULO TRANSCEPTOR SFP-OC48IR1-S28 - EON TECHNOLOGY
1616	1504025290	MODULO TRANSCEPTOR SFP-10GBD20[32]-S28 - EON TECHNOLOGY
1617	1504025291	MODULO TRANSCEPTOR SFP-10GBD40[32]-S28 - EON TECHNOLOGY
1618	1504025292	MODULO TRANSCEPTOR SFP-10GBD80[54]-S28 - EON TECHNOLOGY
1619	1504025293	MODULO TRANSCEPTOR SFP-10GBU20[23]-S28 - EON TECHNOLOGY
1620	1504025294	MODULO TRANSCEPTOR SFP-10GBU40[23]-S28 - EON TECHNOLOGY
1621	1504025295	MODULO TRANSCEPTOR SFP-10GBU80[45]-S28 - EON TECHNOLOGY
1622	1504025296	MODULO TRANSCEPTOR SFP-10GDW80[23]-S28 - EON TECHNOLOGY
1623	1504025297	MODULO TRANSCEPTOR SFP-10GER[15]-S28 - EON TECHNOLOGY
1624	1504025298	MODULO TRANSCEPTOR SFP-10GLR-S28 - EON TECHNOLOGY
1625	1504025299	MODULO TRANSCEPTOR SFP-10GZR100-S28 - EON TECHNOLOGY
1626	1504025300	MODULO TRANSCEPTOR SFP-10GZR-S28 - EON TECHNOLOGY
1627	1504025301	MODULO TRANSCEPTOR SFP-1GBD20[43]-S28 - EON TECHNOLOGY
1628	1504025302	MODULO TRANSCEPTOR SFP-1GBU20[34]-S28 - EON TECHNOLOGY
1629	1504025303	MODULO TRANSCEPTOR SFP-1GDW80[23]-S28 - EON TECHNOLOGY
1630	1504025304	MODULO TRANSCEPTOR SFP-1GEX[15]-S28 - EON TECHNOLOGY
1631	1504025305	MODULO TRANSCEPTOR SFP-1GLX-S28 - EON TECHNOLOGY
1632	1504025306	MODULO TRANSCEPTOR SFP-OC12DW160[21]-S28 - EON TECHNOLOGY
1633	1504025311	MODULO TRANSCEPTOR SFP28-25GSR-A - EON TECHNOLOGY
1634	1504025312	MODULO TRANSCEPTOR SFP-10GSR-A - EON TECHNOLOGY
1635	1504025313	MODULO TRANSCEPTOR SFP-1GT-A - EON TECHNOLOGY
1636	1504025314	MODULO TRANSCEPTOR SFP-10GT-A - EON TECHNOLOGY
1637	1504025315	MODULO TRANSCEPTOR SFP-10GSR-E01 - EON TECHNOLOGY
1638	1504025316	MODULO TRANSCEPTOR SFP-1GBU20[35]-S23 EON TECHNOLOGY
1639	15040253167	MODULO TRANSCEPTOR SFP-1GBD20[53]-S23 EON TECHNOLOGY
1640	150402560	MODEM TELDAT 4Ge-LA2-DEMO
1641	1504025601	MODEM TELDAT H2 AUTO-1W-1LA-DEMO
1642	150402561	MODEM TELDAT M1
1643	1504025611	MODEM TELDAT M1 (DEMO)
1644	150402562	MODEM iM8 L-LTE1-DEMO - TELDAT
1645	150402563	MODEM TELDAT VB-H+
1646	150402564	MODEM TELDAT V-GE-H+ (RCTVH109G)
1647	1504025644	MODEM TELDAT V-GE-H+ (RCTVH309G)
1648	150402565	MODEM TELDAT MTC+-DEMO
1649	1504025650	TELDAT SWITCH 4XGE CARD DEMO
1650	1504025651	MODEM TELDAT MTC+ DEMO
1651	1504025652	MODEM TELDAT BINTEC W203AC-EXT DEMO
1652	1504025653	MODEM M1-LA4 DEMO - TELDAT
1653	1504025654	MODEM TELDAT 4GE-LA2 DEMO
1654	1504025655	MODEM TELDAT IM8-LTE1 DEMO
1655	1504025656	MODEM IM8-LTE1 TELDAT
1656	1504025657	ROUTER SDWAN EDGE - X LARGE - (SDE-24K) TELDAT
1657	1504025658	FUENTE EXTER 115/240 AC VIN 48 VDC OUT 90W - TELDAT
1658	1504025659	SDWAN Edge X Large SDE-10K PN: SDX66120-10K  TELDAT
1659	1504025660	ROUTER TELDAT M8-SMART 4xGE, 1xWAN - DEMO
1660	1504025662	MODULO TRANSCEPTOR SFP-10G-300I-IN TELDAT
1661	1504025663	MODULO TRANSCEPTOR SFP-1000M-M-IN TELDAT
1662	150402572	MODEM TELDAT V-GE-LA
1663	150402575	MODEM TELDAT M1 LA4
1664	150402576	MODEM RS123W-4G - TELDAT
1665	1504025763	ROUTER SDE3-10000 SDWAN EDGE (DEMO)
1666	1504025764	ROUTER RS1800W-4G LTE1 (DEMO)
1667	1504025765	MODEM TELDAT RS123L-LTE
1668	1504025766	MODEM TELDAT RCRSH123L-4G-DEMO
1669	150402577	MODEM TELDAT M1-GE-LE3
1670	150402578	MODEM TELDAT M1-GE
1671	1504025781	ROUTER TELDAT REGESTA SMART PLC LTE2
1672	1504025782	ROUTER TELDAT REGESTA SMART PRO MR 6ETH-LTE2 (DEMO)
1673	1504025783	ROUTER TELDAT REGESTA SMART PRO MR 6ETH-LTE3 (DEMO)
1674	1504025784	ROUTER TELDAT REGESTA SMART PRO MR 2ETH-LTE2
1675	1504025785	ROUTER ATLAS-840 SINGLE PSU - TELDAT
1676	1504025786	ROUTER M10-SMART-LTE2 - TELDAT
1677	1504025787	ROUTER M2L - TELDAT
1678	1504025788	SDX6120-10K - TELDAT
1679	150402579	ROUTER H2 AUTO+-2WAC-2LTE1 - TELDAT
1680	1504025799	H2 AUTO POWER SUPPLY US
1681	15040257991	MULTIBAND ANTENNA AW 10 DLW
1682	150402584	MODEM TELDAT H2 AUTO + 2WAC 1xLTE7 cat4 2xWiFi / RWRH2HBSZWW
1683	150402585	ROUTER RS420 PN: RCRS420H003 TELDAT
1684	4074224	ROUTER RCTM2H011 M2L TLDPM00F1 TLDT
1685	4074225	ROUTER RCATH840D ATLAS-840TLDPM01G1 TLDT
1686	4074226	MODULO RCATASFP10G-SR MM850NM DOMLC TLDT
1687	4074227	ROUTER RCARHC640 ARES-C640TLDPM00L1 TLDT
1688	4074228	ROUTER SDX6120-24K SDWAN SDE-24K TLDT
1689	4074229	MODULO RCATASF2 GE LC 850NM TX-SX TLDT
1690	4074230	ROUTER SDX6120-22K SDWAN SDE-22K TLDT
1691	4074231	MODULO RCATASFP1G-T 1000BASET LC TLDT
1692	4074232	ROUTER RCIMH101-LTE1 IM8 TLDPM01B1 TLDT
1693	4074234	SWITCH ESW4L3-48XS8CQ 48PSFP+8PQSFP TLDT
1694	4074236	TRANSCEIVER RCATASFESW6 SFP+ 10G-SR TLDT
1695	4074422	TRANSCEIVER RCATASFESW2 100GBASE-SR TLDT
1696	4075252	MODULO TRANSCEPTOR SFP-10GLR-S05 EON TECHNOLOGY
1697	4075608	ROUTER RCTM2H001 M2 1000MBPS IMIX TLDT
1698	50402502	TARJETA MAIPU RM2-3G-GSM (V1) 1700B KIT
1699	504025022	TARJETA MAIPU RM2-3G-GSM (V2) 1700B KIT
1700	50402503	Samsung Gálaxy S4
1701	50402504	Router Maipu MP1800-35W
1702	50402505	Samsung Gálaxy ace 2
1703	50402506	ROUTER MAIPU MP1700E A-AC
1704	504025061	3onedata - MODBUS GATEWAY - PN: GW1114-4DI
1705	504025062	3onedata - IES63000-8GT2GS2HS-P220
1706	504025063	3onedata - NP5200-2T-4DI-DB
1707	504025064	SWITCH S4230-36GTXF-AC MAIPU
1708	504025065	GATEWAY MODBUS GW1101-1DI(3 IN 1) 3ONEDATA
1709	504025066	ROUTER MAIPU MP1700B
1711	5040250661	ROUTER EDGE MP1800X - 40W V2 H023 MAIPU
1712	5040250662	ROUTER INDUSTRIAL 4G STR800-4S MAIPU
1713	5040250663	ROUTER DE ACCESO MP1800X-51 MAIPU
1714	5040250664	ROUTER MP1900X-22-AC-V1-H031 - MAIPU
1715	5040250665	SWITCH S4230-30TXF AC V1 H023 MAIPU
1716	5040250666	ROUTER EDGE MP1800X-50 V1 H040 MAIPU
1717	5040250667	ROUTER DE ACCESO MP2900X-14D-AC D1 H021 MAIPU
1718	5040250668	ROUTER MP1800X- 50 MAIPU
1719	5040250669	ROUTER MP1800X-40 PN: 22100403 - MAIPU
1720	5040250671	ROUTER MP1800X-40 (E3) PN: 22100476 - MAIPU
1721	5040250672	ROUTER MP1800X-40W PN: 22100342 - MAIPU
1722	5040250673	ROUTER MP1900X-22-AC PN: 22100332 - MAIPU
1723	50402507	Router Maipu MP1700B
1724	50402508	ROUTER MAIPU 2806-AC
1725	504025080	ROUTER MAIPU 2692
1726	504025081	GATEWAY IGW 500-200-P MAIPU PN: 24700338
1727	504025082	SOPORTE EXTERIOR PARA POSTE IAP300-826-PTE MAIPU PN: 2470034
1728	504025083	ACCES POINT IAP300-821-PE MAIPU PN: 24700312
1729	504025084	ACCES POINT IAP300-815-PE V3 MAIPU PN: 24700346
1730	504025085	INTERFACE ELECTRICA S3230-54TXP-AC MAIPU PN: 22200492
1731	504025086	TRANSCEPTOR MP-S851X3-NCLM MAIPU PN: 31000149
1732	504025087	INTERFASE ELECTRICA S4330-30TXP MAIPU PN: 22200438
1733	504025088	MODULO DE ALIMENTACION AD500-1D005E MAIPU PN: 704144
1734	504025089	TRANSCEPTOR MP-S85123-3CDLM MAIPU
1735	50402509	HONGDIAN H7710-CGS
1736	504025090	TRANSCEPTOR CON CABLE SFP-STACK-50 MAIPU
1737	50402510	ROBUSTEL M1000 PRO PUMTSB
1738	504025100	ROBUSTEL R1510-4L
1739	5040251001	GATEWAY M1000-XP3PA PN: A005407 ROBUSTEL
1740	50402510010	ROUTER M1201-B-A26AU-4E  ROBUSTEL
1741	50402510011	GATEWAY M1201-A-A26AU-4E PN: B062709 ROBUSTEL
1742	50402510012	ROUTER R1312-4E-B-A41LA PN: B014500006 DEMO ROBUSTEL
1743	5040251002	ROBUSTEL M1200-S3P
1744	5040251003	ROBUSTEL M1000-XP2GA
1745	5040251004	GATEWAY M1200-4L PN: B033701 ROBUSTEL
1746	5040251005	GATEWAY M1200-4M PN:B033706  ROBUSTEL
1747	5040251006	GATEWAY MEG5000-4L PN: B026708 ROBUSTEL
1748	5040251007	ROUTER R1510-4L WIFI PN: B048703 ROBUSTEL
1749	50402510071	ROUTER R1500-4L PN: B041703 ROBUSTEL
1750	5040251008	ROUTER R1511-4L-A03AU-A PN: B061703 ROBUSTEL
1751	5040251009	ROUTER R1510L-4L-A03AU PN: B059703 ROBUSTEL
1752	504025101	ROBUSTEL M1000-P23PB
1753	5040251010	ROUTER R1520-4L PN: B056704 ROBUSTEL
1754	5040251011	ROUTER R1520-4L PN: B056711 ROBUSTEL
1755	5040251012	ROUTER R3000-4L PN: B018728 ROBUSTEL
1756	50402511	MODEM USB SIERRA
1757	50402513	MODEM HONDIANG H3225A HSUPA
1758	50402514	Modem GV200
1759	50402515	MODEM GT-HE910-NAD
1760	50402516	MAIPU-2692
1761	50402519	Enfora Spider GSM 2448
1762	50402520	SIERRA AIRLINK LS300
1763	50402521	Pegasus ETH - Advanced
1764	50402522	INTERFAZ PEGASUS NX
1765	50402523	MODEM ZTE MF190
1766	504025231	MODEM ZTE MF253V
1767	50402524	MAXTRACK MXT 141
1768	50402525	MAXTRACK MXT 120
1769	50402526	MAXTRACK MXT 151A
1770	50402527	MAXTRACK MXT 100
1771	50402528	BOTON WT-110
1772	50402530	HONGDIAN H7921-HSPA+
1773	50402531	Pegasus lowcost
1774	50402532	Pegasus ETH+GPRSFULL
1775	50402533	HONGDIAN H8922 DUAL MODE
1776	504025333	HONGDIAN ROUTER A20S DEMO
1777	504025334	HONGDIAN ROUTER H8951S DEMO
1778	504025335	HONGDIAN ROUTER H8922S DEMO
1779	50402534	ROUTER H8921S-RHZ
1780	50402535	HONGDIAN H7932-RHZ
1781	50402536	Pegasus Dual
1782	50402537	Enfora GSM 2378
1783	50402538	HONGDIAN H8922-HSPA+
1784	50402539	ROUTER CISCO 2806
1785	504025399	ROUTER CISCO 800
1786	5040253990	ROUTER CISCO 1700
1787	5040254610	MDAS VIBRATION UNIT SUNTECH
1788	504025466	CÁMARA DE MONITOREO DE FATIGA MDSM-7 DSM SUNTECH
1789	5040254661	CÁMARA MDAS-9 SUNTECH
1790	5040254662	LOCALIZADOR SD 8000 SUNTECH
1791	504025467	LENTE 45.6X35.5;6,8MM
1792	504025468	CAMARA TERMICA INTELIGENTE SMARTIS
1793	504025469	PC PANEL INDUSTRIAL EM-PPC18S-6200
1794	504025470	TABLET RUGGED MTK 8735A EM-T16
1795	5040254700	TABLET RUGGEAR RG930i DEMO
1796	5040254701	TABLET RUGGEAR RG930i
1797	504025471	DOCKING FOR EM-T16
1798	50402561	ELDES ET082
1799	50402562	ELDES ET082 - TARJETA
1800	50402563	ELDES ELAN3-ALARM
1801	50402577	SIERRA ES450
1802	50402578	SIERRA ES450 GENERIC
1803	50402579	AIRLINK MP70
1804	504025791	AIRLINK GX450
1805	50402582	MP1800-3-8FE
1806	50402592	INTERFAZ PEGASUS NX II 2G
1807	50402593	INTERFAZ PEGASUS NX 3G
1808	504025933	INTERFAZ PEGASUS NX 3G
1809	50402596	NP-02U
1810	50402597	INTERFAZ PEGASUS LIGTH
1811	50402598	KEYFOB USB TRANSMITER
1812	50402603	INTERFAZ PEGASUS NX II 4G
1813	51402506	ROUTER MAIPU MP1800-35E-AC
1814	51402507	MODEM HUAWEI B310
1815	604025101	TELTONIKA TRB245 LTE ROUTER
1816	604025102	LOCALIZADOR FMC003WMNJ01 TELTONIKA
1817	9002150001	MINI INDUSTRIAL ROUTER UR41-L08AU DEMO MILESIGHT
1818	9002150002	INDUSTRIAL CELLULAR ROUTER UR32-L04AU-P-W-485 DEMO MILESIGHT
1819	9002150003	INDUSTRIAL CELLULAR ROUTER UR35-L04AU-G-P-W DEMO MILESIGHT
1820	99002150003	INDUSTRIAL CELLULAR ROUTER UR35-L04AU-G-P-W DEMO MILESIGHT
1821	ALC1030	TELEFONOS ALCATEL 1030A
1822	BI-DIRECCIONAL PASSE	BI-DIRECCIONAL PASSENGER
1823	BIS-17863	ACTIVO MODEM R1510-4L WIFI
1824	BIS-17898-S	SOPORTE 5X8
1825	BIS-17899-S	SOPORTE 5X8
1826	BIS-17900-S	SOPORTE 5X8
1827	BIS-17901-S	SOPORTE 5X8
1828	BIS-17902-S	SOPORTE 5X8
1829	BIS-17903-S	SOPORTE 5X8
1830	BIS-17904-S	SOPORTE 5X8
1831	BIS-17905-S	SOPORTE 5X8
1832	BIS-17906-S	SOPORTE 5X8
1833	BIS-17907-S	SOPORTE 5X8
1834	BIS-17949	ACTIVO MODEM R1510-4L
1835	BIS-18079	ROBUSTEL R1510-4L WIFI
1836	BIS-18556	ROUTER R2010-A-4L-A03AU PN: B0
1837	BIS-18557	ROUTER R2010-A-4L-A03AU PN: B0
1838	BIS-18558	ROUTER R2010-A-4L-A03AU PN: B0
1839	CSC1841	CISCO 1751 SERIE 1700
1840	H3S00004	H3S M281T LTE MIFI
1841	HONEY SAT401E	HONEYWELL SAT 401E
1842	HUAWEIY210	TELEFONOS HUAWEI FY210
1843	HUAWEIY511	TELEFONOS HUAWEI Y511
1844	LW4G-WRP SA	LOCALIZADOR LW4G-WRP SA - LYNKWORLD
1845	M1200 S3P	ROBUSTEL M1200 S3P
1846	MAIPU MO1800X-50	ROUTER MAIPU MP1800X- 50
1847	MP1000 XP3PA	ROBUSTEL M1000 XP3PA
1848	NX20191005	PEGASUS NX 3G
1849	NX20191006	PEGASUS NX 3G
1850	PEGASUS NX 2G	INTERFAZ PEGASUS NX 2G
1851	ROBUSTEL M1000	ROBUSTEL M1000 XP3PA
1852	ROBUSTEL M1200 S3P	ROBUSTEL M1200 S3P
1853	ROBUSTEL MP1000	ROBUSTEL M1000 XP3PA
1854	ROBUSTEL MP1000 X93P	ROBUSTEL M1000 XP3PA
1855	RUPTELA FM-Eco4Ligth	RUPTELA FM-Eco4ligh+
1856	ST 300P	SUNTECH ST300P
1857	ST 3310	SUNTECH ST3310
1858	SUNTECH ST3300R	SUNTECH ST3300R
1859	TEL00001	ROUTER RCRS420H006 / RS420  WWAN(AM), WLAN6 - TELDAT
1860	TEL00002	RCTM2H001 / M2: 2xWAN, AxGE SWITCH TELDAT
1861	TEL00003	ROUTER RCTM10SH007 / M10-Smart WWAN 5G 2xWAN - TELDAT
1862	TEL00004	ROUTER REGESTA SMART PRO MR 6ETH-LTE2 - TELDAT
1863	TEL00005	ROUTER CELER-LTE2 6(AM), WIFI 6, 2 ETH GPS - TELDAT
1864	TEL00006	SWICTH ESW2L3-24GE4XS-P24xGE/4x10G SFP+/PoE+ - TELDAT
1865	TEL00007	ACCESS POINT WAP820-IAX / AP interior Wi-Fi 6 2x2 - TELDAT
1866	TEL00009	DGe - RCTMATDGE  MODEL: TLDPJ00D1 - TELDAT
1867	TEL00010	ROUTER MODEL: 5GE-2 - RC5GH002R 5GE - TELDAT
1868	TEL00011	ROUTER RCARHC640 ARES-C640 TLDPM00L1 - TELDAT
1869	TEL00012	ROUTER RS123W-4G - TELDAT
1870	TEL00013	ROUTER IMBER SMART MODEL: TLDPH00N2 LTE, WIFI - TELDAT
1871	TEL00014	ROUTER ATLAS-840 DOUBLE PSU MODEL: TLDPM01G1 - TELDAT
1872	TEL00015	RCTM2H001UP / BUNDLE M2 HIGH PERFORMANCE, 2GB - TELDAT
1873	TEL00016	ESW1L3-48GE4XS-E / SWITCH 48x, RJ45, 4x, SFP+ - TELDAT
1874	TEL000167	ESW1L3-24GE4XS-E / SWITCH 24x, RJ45, 4x, SFP+, POE - TELDAT
1875	TEL00017	RCSMH001 / M8-SMART / MODEL: TLDPM001 - TELDAT
1876	TEL00018	MODEM RS123 TELDAT
1877	TEL00019	TLDPM02A1 / M1-H+ - TELDAT
1878	TEL00020	ROUTER ATLAS-6X/I6X - ATLAS-I60 - TELDAT
1879	TEL00021	SWITCH ESW3L2P-10GE2MS-P / 10xGE/2x 2,5SFP/POE+ - TELDAT
1880	TEL00022	SWITCH RCTM20H001 - TLDPM00M1/ M20: 2XCOMBO WAN - TELDAT
1881	TEL00023	RWRCEL5NR - TLDPH01P1 / CELER 5G - TELDAT
1882	TEL00027	ADAPTOR IEC-60320_C14 To UNIVERSAL RECEPTABLE - RCVAAAC - TE
1883	TEL00028	CELLULAR ANTENNA - INDOOR MAGNETIC 4G ANTENNA - RCATAA4G005
1884	TEL00029	CELLULAR ANTENNA - OUTDOOR WALL-3 4G ANTENNA - RCATAA4G008
1885	TEL00030	GIGABIOT POE INJECTOR (EU) - APPOE0001 - TELDAT
1886	TEL00031	H2 AUO STARTER KIT EU - LAB TESTING STARTER KIT FOR H2 WITH
1887	TEL00032	H2 Auto PSU 100-240AC US, 12VDC Molex - RWRH2AFAC-US - TELDA
1888	TEL00033	MULTIBAND ANTENNA OUT&INDOOR CEILING 3G/LTE+WLAN2.4 - RWRHAA
1889	TEL00034	ONBOARD WIFI ANTENNA - RWRHAAWE-IM - TELDAT
1890	TEL00035	TLDPM00E1 / M10-Smart  - TELDAT
1891	TEL00036	ROUTER SDX6120-20K-R2 SDWAN SDE-20K TLDT
1892	TELDAT RS	MODEM TELDAT RS123W-4G
1893	TELDATRS	MODEM TELDAT RS123W-4G
1894	TELDAT-RS	MODEM TELDAT RS123W-4G
1895	ZTEPRO	TELEFONOS ZTE BLADE G PRO
\.


--
-- Data for Name: factura; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.factura (id_factura, numero_factura, fecha_factura, id_tipo_pago, id_orden_pedido, moneda_base, trm_aplicada, fecha_trm, tipo_factura, estado_factura) FROM stdin;
3	Recurrente 	2026-02-10 00:00:00+00	\N	80	COP	\N	\N	equipos	\N
4	FE-2222-2212	2026-02-09 00:00:00+00	\N	78	COP	\N	\N	equipos	\N
\.


--
-- Data for Name: historial_factura; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historial_factura (id_historial, id_factura, numero_factura_anterior, numero_factura_nuevo, fecha_factura_anterior, fecha_factura_nueva, usuario_cambio, motivo_cambio, timestamp_cambio) FROM stdin;
\.


--
-- Data for Name: historial_orden; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historial_orden (id_historial, id_orden_pedido, timestamp_accion, actor_user_id, rol_actor, fase_anterior, fase_nueva, estatus_nuevo, accion_clave, observaciones) FROM stdin;
\.


--
-- Data for Name: linea_servicio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.linea_servicio (id_linea_detalle, id_operador, id_plan, id_apn, permanencia, clase_cobro, cantidad_linea) FROM stdin;
14	3	3	3	\N	mensual	\N
17	1	5	2	\N	mensual	\N
20	3	1	3	12	mensual	\N
25	3	1	3	4	mensual	\N
32	3	1	3	5	anual	\N
1	1	4	2	4	mensual	\N
2	1	5	2	3	mensual	\N
5	1	5	2	3	mensual	\N
6	1	4	2	2	mensual	\N
7	1	4	2	2	mensual	\N
33	1	5	2	4	mensual	\N
34	1	4	2	3	mensual	\N
35	1	5	20	1	mensual	\N
37	1	5	12	4	mensual	5
36	1	4	8	2	mensual	3
38	1	4	8	2	mensual	3
39	1	5	7	32	mensual	7
40	1	4	8	\N	mensual	3
41	1	5	7	\N	mensual	7
42	1	5	7	\N	mensual	7
\.


--
-- Data for Name: operador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.operador (id_operador, nombre_operador) FROM stdin;
1	Claro
2	Movistar
3	Moabits
4	Tigo
5	Tele2
6	Wom
\.


--
-- Data for Name: orden_counter_month; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orden_counter_month (yy, mm, last_num) FROM stdin;
25	9	3
\.


--
-- Data for Name: orden_pedido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orden_pedido (id_orden_pedido, consecutivo, fecha_creacion, fecha_modificacion, id_cliente, id_proyecto, id_clase_orden, observaciones_orden, id_tipo_pago, created_by, fase, estatus, consecutivo_code, orden_compra, id_tipo_servicio, id_ingeniero_asignado, updated_by, estado_validacion_pago, medio_pago, condiciones_pago, pago_flete, observaciones_financieras) FROM stdin;
84	72	2026-02-09 19:56:25.657875+00	2026-02-12 20:53:58.82397+00	3139	268	\N	Stock Confirmado	1	2482a25e-f6e2-4c16-8331-8d3d27aeb513	produccion	abierta	2602072	\N	\N	3595bd53-7905-4c86-87a8-f6d6edd5f87c	\N	\N	\N	\N	flete_costo_negocio	\N
80	68	2026-02-09 15:22:24.067953+00	2026-02-09 15:54:27.412366+00	3139	268	\N	Stock Confirmado	1	2482a25e-f6e2-4c16-8331-8d3d27aeb513	logistica	cerrada	2602068	0321456	\N	3595bd53-7905-4c86-87a8-f6d6edd5f87c	\N	\N	\N	\N	flete_costo_negocio	\N
78	66	2026-02-06 19:25:47.307367+00	2026-02-09 15:56:06.269457+00	3139	264	\N		2	2482a25e-f6e2-4c16-8331-8d3d27aeb513	logistica	cerrada	2602066	0213432	\N	3595bd53-7905-4c86-87a8-f6d6edd5f87c	\N	ok	efectivo	\N	pago_contraentrega	
81	69	2026-02-09 16:01:09.729658+00	2026-02-26 17:15:41.677007+00	3139	264	\N	Se confirma el Stock y datos provicionales\n	2	2482a25e-f6e2-4c16-8331-8d3d27aeb513	financiera	abierta	2602069	\N	\N	3595bd53-7905-4c86-87a8-f6d6edd5f87c	\N	\N	\N	\N	pago_contraentrega	\N
90	74	2026-03-02 16:29:31.045358+00	2026-03-02 19:37:28.078489+00	3139	269	\N	Nueva Orden de prueba	2	2482a25e-f6e2-4c16-8331-8d3d27aeb513	comercial	borrador	2603074	032412	\N	f4cb1c69-6a14-4af3-aed8-244d0d73e894	\N	\N	\N	\N	pago_contraentrega	\N
79	67	2026-02-09 13:57:25.160336+00	2026-03-03 14:04:16.131373+00	3139	260	\N	\N	4	2482a25e-f6e2-4c16-8331-8d3d27aeb513	produccion	abierta	2602067	0321456	\N	25edb150-cedd-4718-815b-d7d2b39ae886	2482a25e-f6e2-4c16-8331-8d3d27aeb513	\N	\N	\N	pago_contraentrega	\N
83	71	2026-02-09 16:44:53.121738+00	2026-02-12 19:47:09.946248+00	3139	268	\N	Stock Confirmado	1	2482a25e-f6e2-4c16-8331-8d3d27aeb513	comercial	borrador	2602071	\N	\N	da9cbae5-f3fb-479c-8f75-e9cbecad28b1	\N	\N	\N	\N	flete_costo_negocio	\N
85	73	2026-02-10 17:52:03.513511+00	2026-03-03 17:00:02.03616+00	3139	264	\N	\N	2	2482a25e-f6e2-4c16-8331-8d3d27aeb513	produccion	abierta	2602073	564489	\N	3595bd53-7905-4c86-87a8-f6d6edd5f87c	2482a25e-f6e2-4c16-8331-8d3d27aeb513	\N	\N	\N	pago_contraentrega	\N
82	70	2026-02-09 16:44:15.318719+00	2026-02-12 20:38:31.485859+00	3139	264	\N		2	2482a25e-f6e2-4c16-8331-8d3d27aeb513	logistica	cerrada	2602070	\N	\N	c18a4e8c-5472-4086-aefe-890880eb4138	\N	\N	\N	\N	pago_contraentrega	\N
91	75	2026-03-02 20:47:31.067995+00	2026-03-03 19:47:45.312434+00	3139	264	\N	Continuar y finalizar el proceso de adaptacion	2	2482a25e-f6e2-4c16-8331-8d3d27aeb513	produccion	abierta	2603075	023454	\N	3595bd53-7905-4c86-87a8-f6d6edd5f87c	2482a25e-f6e2-4c16-8331-8d3d27aeb513	\N	\N	\N	pago_contraentrega	\N
93	76	2026-03-04 13:50:07.769668+00	2026-03-04 14:35:50.12121+00	3313	\N	\N	\N	3	f4cb1c69-6a14-4af3-aed8-244d0d73e894	inventarios	abierta	2603076	00071682_068-1	\N	a05ae5f9-0575-41f1-96bb-58d8822e85e0	f4cb1c69-6a14-4af3-aed8-244d0d73e894	\N	\N	\N	flete_costo_negocio	\N
\.


--
-- Data for Name: orden_produccion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orden_produccion (id_orden_produccion, numero_produccion, fecha_produccion, observaciones_produccion, id_orden_pedido, estado_orden_produccion, recibido_en_produccion, fecha_ingreso_produccion, fecha_salida_produccion, recibido_por) FROM stdin;
1	OP-2026-02-21	2026-02-12 20:53:13.363+00	Todo ok, configuracion	84	\N	f	\N	\N	\N
2	OP-2026-01-18	2026-02-26 17:15:35.028+00	Todo Ok Para pasar al area de financiera 	81	\N	f	\N	\N	\N
3	OP-2026-01-18	2026-03-03 14:04:16.122+00		79	\N	f	\N	\N	\N
4	\N	\N	\N	91	\N	t	2026-03-03 16:58:02.666+00	\N	2482a25e-f6e2-4c16-8331-8d3d27aeb513
5	OP-2026-01-18	2026-03-03 16:59:58.462+00	Todo ok, para pasar a financiera	85	\N	t	2026-03-03 16:59:42.1+00	\N	2482a25e-f6e2-4c16-8331-8d3d27aeb513
\.


--
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permission (perm_code, category, description, created_at) FROM stdin;
orden.view_phase	ordenes	Ver órdenes de su fase	2025-09-16 21:53:13.564383+00
orden.view_own	ordenes	Ver órdenes propias	2025-09-16 21:53:13.564383+00
orden.view_all	ordenes	Ver todas las órdenes	2025-09-16 21:53:13.564383+00
orden.create	ordenes	Crear nuevas órdenes	2025-09-16 21:53:13.564383+00
orden.update	ordenes	Actualizar órdenes	2025-09-16 21:53:13.564383+00
orden.move_fase	ordenes	Mover órdenes entre fases	2025-09-16 21:53:13.564383+00
orden.change_estatus	ordenes	Cambiar estatus de órdenes	2025-09-16 21:53:13.564383+00
orden.assign_responsable	ordenes	Asignar responsables	2025-09-16 21:53:13.564383+00
detalle.create	detalles	Crear detalles de orden	2025-09-16 21:53:13.564383+00
detalle.update	detalles	Actualizar detalles	2025-09-16 21:53:13.564383+00
detalle.delete	detalles	Eliminar detalles	2025-09-16 21:53:13.564383+00
catalogo.manage	catalogos	Gestionar catálogos maestros	2025-09-16 21:53:13.564383+00
user.manage	usuarios	Gestionar usuarios	2025-09-16 21:53:13.564383+00
export.data	reportes	Exportar datos y reportes	2025-09-16 21:53:13.564383+00
catalogo.cliente.read	catalogos	Ver catálogo de clientes	2025-09-17 16:45:48.733478+00
catalogo.cliente.manage	catalogos	Gestionar catálogo de clientes	2025-09-17 16:45:48.733478+00
catalogo.proyecto.read	catalogos	Ver catálogo de proyectos	2025-09-17 16:45:48.733478+00
catalogo.proyecto.manage	catalogos	Gestionar catálogo de proyectos	2025-09-17 16:45:48.733478+00
catalogo.claseorden.read	catalogos	Ver catálogo de clases de orden	2025-09-17 16:45:48.733478+00
catalogo.claseorden.manage	catalogos	Gestionar catálogo de clases de orden	2025-09-17 16:45:48.733478+00
catalogo.operador.read	catalogos	Ver catálogo de operadores	2025-09-17 16:45:48.733478+00
catalogo.operador.manage	catalogos	Gestionar catálogo de operadores	2025-09-17 16:45:48.733478+00
catalogo.plan.read	catalogos	Ver catálogo de planes	2025-09-17 16:45:48.733478+00
catalogo.plan.manage	catalogos	Gestionar catálogo de planes	2025-09-17 16:45:48.733478+00
catalogo.apn.read	catalogos	Ver catálogo de APN	2025-09-17 16:45:48.733478+00
catalogo.apn.manage	catalogos	Gestionar catálogo de APN	2025-09-17 16:45:48.733478+00
catalogo.transportadora.read	catalogos	Ver catálogo de transportadoras	2025-09-17 16:45:48.733478+00
catalogo.transportadora.manage	catalogos	Gestionar catálogo de transportadoras	2025-09-17 16:45:48.733478+00
catalogo.metododespacho.read	catalogos	Ver catálogo de métodos de despacho	2025-09-17 16:45:48.733478+00
catalogo.metododespacho.manage	catalogos	Gestionar catálogo de métodos de despacho	2025-09-17 16:45:48.733478+00
catalogo.tipopago.read	catalogos	Ver catálogo de tipos de pago	2025-09-17 16:45:48.733478+00
catalogo.tipopago.manage	catalogos	Gestionar catálogo de tipos de pago	2025-09-17 16:45:48.733478+00
\.


--
-- Data for Name: plan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan (id_plan, id_operador, nombre_plan) FROM stdin;
1	3	3MB
2	3	5MB
3	3	10MB
4	1	1GB
5	1	5MB
\.


--
-- Data for Name: producto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.producto (id_producto, tipo, nombre_producto, created_by, id_equipo, id_linea_detalle, id_accesorio, id_servicio) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (user_id, nombre, role, created_at, username) FROM stdin;
c18a4e8c-5472-4086-aefe-890880eb4138	Valentina Camacho	logistica	2025-09-15 19:44:59.919815+00	valentinac
5ca64907-f955-4e49-a460-63a8ab3be5c9	Andres Prado	admin	2025-09-15 19:30:25.867594+00	andresp
cd9509cd-8578-43d5-9820-4350b7899af6	Silvestre Escandon	comercial	2025-09-24 21:08:28.259595+00	silvestree
e1355e21-844d-42c2-9ed5-6138864bacc8	Alvaro Gonzalez	comercial	2025-09-24 21:09:28.041447+00	alvarog
1d3feb85-5e90-4deb-9584-f24adaa6b1a4	Amparo	facturacion	2025-09-17 17:13:49.884879+00	amparor
a465c5ed-eb22-44ee-86fa-62220abf4258	Ana Maria	facturacion	2025-09-15 03:31:56.144449+00	anav
d158938a-c098-49fe-a021-75b2c3a0d8d1	Jose Luis Sepulveda	comercial	2026-01-21 16:08:16.861221+00	josel
69538db7-3261-4ab6-bac8-8c86f474a498	Juan Pablo Torres	financiera	2026-01-21 20:34:40.828368+00	juanp
04151198-fc47-43eb-af73-ca8a6791ae39	Camila Gonzalez	financiera	2026-01-21 20:35:33.221212+00	camilag
cbe2475f-d844-4a92-b939-3cbc2ed5e7cf	Victor Alfonso	financiera	2026-01-21 20:36:31.109127+00	victora
25edb150-cedd-4718-815b-d7d2b39ae886	Mauricio Navarrete	ingenieria	2026-01-23 15:45:35.994758+00	mauricion
afd610f7-dd81-4add-92c2-7fc357041dbb	Wilson Briceño	ingenieria	2026-01-23 15:46:48.725576+00	wilsonb
3595bd53-7905-4c86-87a8-f6d6edd5f87c	William Salcedo	ingenieria	2026-01-23 15:46:17.484574+00	williams
a05ae5f9-0575-41f1-96bb-58d8822e85e0	Oscar Hernan Pardo	ingenieria	2026-01-23 15:49:56.056672+00	oscarp
047fae34-f85e-4a12-830d-a51d52348049	Gabriel Jerez	ingenieria	2026-01-27 20:46:21.166414+00	gabrielj
e99c9416-cd61-40f8-9873-17ab42a6416d	Rafael Jimenez	comercial	2026-02-04 21:44:10.299024+00	rafaele
f7404c54-34f5-43ff-90f6-5ec6cfb0d7ec	Juan Camilo Peña	comercial	2026-02-04 21:44:49.045773+00	juanc
10a39e02-3007-466a-a3d9-1b21374d2061	Jonathan Hernandez	admin	2026-02-12 19:27:54.332364+00	jonathanh
da9cbae5-f3fb-479c-8f75-e9cbecad28b1	Javier Quevedo Vega	produccion	2026-02-12 19:31:42.442469+00	javierq
2482a25e-f6e2-4c16-8331-8d3d27aeb513	Admin	admin	2025-09-12 15:51:56.1377+00	admin
f4cb1c69-6a14-4af3-aed8-244d0d73e894	Oscar Ospitia	admin	2025-09-15 19:36:14.947994+00	oscaro
949317dc-180a-44aa-bf9e-27c96f16428d	Christian Triana	comercial	2026-03-02 20:42:53.850723+00	cristianb
\.


--
-- Data for Name: proyecto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proyecto (id_proyecto, nombre_proyecto, descripcion_proyecto, id_cliente, nit_cliente) FROM stdin;
4	ANUALIDAD HUGO ALBERTO FERNANDEZ	A169	2126	13923224
5	SOPORTE	P020	2155	800007813
6	PROYECTO GAS NATURAL ALARMAS - SERV	P012	2155	800007813
1481	ANUALIDAD JUN/25 SEGUIMIENTO ACTIVO	A184	2428	901493936
9	PROYECTO  SKADA	P011	2155	800007813
10	PROYECTO GAS NATURAL ALARMAS - ARRI	P016	2155	800007813
11	FLORENCIA	P156	2174	800237731
12	BOGOTA	P152	2174	800237731
13	VILLAVICENCIO	P212	2174	800237731
14	GARZÓN	P155	2174	800237731
15	PITALITO	P153	2174	800237731
16	NEIVA	P154	2174	800237731
17	ANUALIDAD ESTUPIÑAN EDGAR	A100	2189	13926239
18	NETIO	P037	2199	820003419
19	ANUALIDAD CAMACHO ALDANA	A103	2243	1022333478
20	RECLAS. INVENTARIO ACT. FIJO	P990	2247	830031182
21	LÍNEAS PARA REASIGNACION	P10	2247	830031182
22	PROYECTO DE CAPACITACION ANGIE	P201	2247	830031182
23	PROYECTO ATMS´s	P029	2251	800143407
24	PROYECTO POS	P028	2251	800143407
25	PUNTOS EN PRESTAMO .	P030	2251	800143407
26	VSAT	P0221	2251	800143407
27	ROBUSTEL	P034	2251	800143407
28	SDWAN	P091	2251	800143407
29	PROYECTO POS	P032	2251	800143407
30	ATM´S 4G_DOBLE MEDIO	P024	2251	800143407
31	PROYECTO BANCO DE BOGOTA	P045	2251	800143407
32	SOPORTE COMCEL	P040	2251	800143407
33	ATM BANCO POPULAR	P031	2251	800143407
34	PROYECTO AV VILLAS	P047	2251	800143407
35	ATM´S 4G	P022	2251	800143407
36	SEMESTRE PEREZ CARLOS ANDRES	A180	2254	16944068
37		A181	2267	901347595
38	ANUALIDAD NOVIEMBRE TELEMETRIA INTE	A203	2267	901347595
39	ANUALIDAD JUNIO TELEMETRIA INTELIGE	A186	2267	901347595
40	ANUALIDAD MAR/25 TELEMETRIA INTELIG	A182	2267	901347595
41	ANUALIDAD TELEMETRIA INTELIGENTE S.	A121	2267	901347595
42	ANUALIDAD MAR/25 TELEMETRIA	A213	2267	901347595
43	ANUALIDAD SEPTIEMBRE TELEMETRIA INT	A195	2267	901347595
44	ANUALIDAD JULIO TELEMETRIA INTELIGE	A189	2267	901347595
45	ANUALIDAD FEB/25 TELEMETRIA INTELIG	A211	2267	901347595
46	MIGRACIÓN	P502	2289	800014875
47	OFICINA MEDELLIN	P081	2289	800014875
48	ANUALIDAD ARIS MINING  SEGOVIA	A122	2299	900306309
49	ANUALIDAD HYDROCARE S.A.S	A149	2321	900494060
50	ORDEN DE COMPRA 2	P171	2323	800170118
51	GAS NATURAL TELDAT	P099	2328	860068055
52	ANUALIDAD ORTIZ JAIMES ALEXANDER	A126	2338	13720532
53	SECURITY COL	P905	2380	800194984
54	PROYECTO VIGITRONIC	P019	2380	800194984
55	PROYECTO PEGASUS	P900	2380	800194984
56	PROYECTO ALARM LINK	P904	2380	800194984
57	ALARMLINK  - ARRIENDO	P307	2384	809005743
58	ADMON CONTRATO : YOJAIRA PEREZ	P299	2388	800226766
59	CODENSA PROYECTO 2	P009	2410	830037248
60	CODENSA PROYECTO 1	P008	2410	830037248
61	ANUALIDAD DICIEMBRE SEGUIMIENTO ACT	A205	2428	901493936
62	ANUALIDAD RENOVACION DIC SEGUIMIENT	A204	2428	901493936
63	ANUALIDAD NOVIEMBRE SEGUIMIENTO ACT	A200	2428	901493936
64	ANUALIDAD RENOVACION FEB/25 SEGUIMI	A209	2428	901493936
65	ANUALIDAD OCTUBRE SEGUIMIENTO ACTIV	A196	2428	901493936
66	ANUALIDAD RENOVACION NOV SEGUIMIENT	A198	2428	901493936
67	ANUALIDAD SILVER SECURITY LTDA	A133	2430	901434399
68	ANUALIDAD VIGILANCIA Y SEG. 365	A144	2437	900823024
69	TRIMESTRE VIGILANCIA Y SEG. 365	A190	2437	900823024
70	ANUALIDAD INNOVATE SECURITY S.A.S.	A130	2440	900483170
71	ANUALIDAD PEREZ ALFONSO SOTERO	A163	2467	13478531
72	ANUALIDAD DEFENCE COLOMBIA SAS	A102	2486	901143498
73	ANUALIDAD URIZA POVEDA ARIAL	A153	2498	13923241
74	ACUEDUCTO IBAGUE	P088	2502	900737079
75	EMERFUSA	P089	2502	900737079
76	FACATATIVA	P092	2502	900737079
77	ANUALIDAD COTRANS	A167	2512	890200211
78	SECRETARIA DE AMBIENTE / AIRE-RUIDO	P343	2518	899999115
79	SECRETARIA DE SEGURIDAD CONVIVENCI	P99	2518	899999115
80	PROYECTO TOTTO NALSANI	P038	2518	899999115
81	TERPEL	P24	2518	899999115
82	SECRETARIA AMBIENTE	P363	2518	899999115
83	PROYECTO BANCO DE BOGOTA	P027	2518	899999115
84	PROYECTO CARREFOUR	P026	2518	899999115
85	PROYECTO BANCOLOMBIA	P023	2518	899999115
86	UNIDAD DE BUSQUEDA	P317	2518	899999115
87	INVIMA	P25	2518	899999115
88	SECRETARIA DE AMBIENTE / RUIDO	P341	2518	899999115
89	ANUALIDAD ZAMORA LUISA FERNANDA	A141	2534	1016083652
90	ANUALIDAD HERNANDO ROJAS ROJAS	A146	2535	5607823
91	ANUALIDAD MARIO VARGAS QUINTERO	A147	2543	13923845
92	ENDER CHAUSTRE	P250	2545	901402595
93	DINAPOWER	P251	2545	901402595
94	ANUALIDAD GUERRERO MORA IVAN FERNEY	A145	2552	1118552789
95	ANUALIDAD NUTRIMEZCLAS Y ACEITES SA	A143	2556	900733354
96	ANUALIDAD TENSOR S.A.S.	A138	2577	901456609
97	BANREP/CAMARAS	P358	2592	860005216
98	ANUALIDAD CONJUNTO CAMPESTRE	A106	2597	900359527
99	OC 20056123 - FONDECUN CALI	P123	2607	830016046
100	OC 20053955	P103	2607	830016046
101	OC 20054797	P112	2607	830016046
102	OC 20055695	P118	2607	830016046
103	OC 20055696	P117	2607	830016046
104	OC 20054154	P108	2607	830016046
105	OC 20054023	P107	2607	830016046
106	OC 20053951	P106	2607	830016046
8	PROYECTO GAS NATURAL VEHICULAR	P010	2155	810002601
107	OC 20056217	P122	2607	830016046
108	DITRA	P124	2607	830016046
109	OC 20053956	P105	2607	830016046
110	KIOSKOS	P125	2607	830016046
111	DIPTRA	P111	2607	830016046
112	DITRA	P121	2607	830016046
113	OC 20053740	P101	2607	830016046
114	OC 20055689	P119	2607	830016046
115	OC 20054254	P109	2607	830016046
116	OC 20055171	P114	2607	830016046
117	OC 20055198	P115	2607	830016046
118	OC 20055222	P116	2607	830016046
119	OC 20055127 - FONDECUN CALI	P113	2607	830016046
120	OC 20053954	P104	2607	830016046
121	ANUALIDAD OPERADORA DE ENTRETENIMIE	A214	2612	900629844
122	ANUALIDAD  ROMERO TORRES CLAUDIO	A166	2614	5678773
123	INMUEBLES	P061	2641	890300279
124	ANUALIDAD JAVIER MAURICIO PEREZ	A171	2647	1096953892
125	ANUALIDAD VERA JAIMES LUCY	A150	2653	63394173
126	ANUALIDAD ORTIZ BARAJAS SERGIO	A160	2663	13922306
127	INTERVENTOR : FERNANDO TORO	P199	2674	900134459
128	ANUALIDAD SIVYTEC PPA COLOMBIA S.A.	A135	2677	901041718
129	ANUALIDAD NUMAR TECHNOLOGIES	A221	2680	901550593
130	ANUALIDAD JUNIO/25 NUMAR TECHNOLOGI	A223	2680	901550593
131	TLM	P069	2687	860074186
132	ANUALIDAD O.M.C	A112	2697	890939223
133	ANUALIDAD REDFOX INTEGRAL SOLUTION	A128	2699	901366291
134	ANUALIDAD SUAREZ CORREA LUIS AURELI	A164	2701	13486996
135	ANUALIDAD SERVICE-TECH SOLUTIONS S.	A131	2712	901454607
136	ANUALIDAD DICIEMBRE TELEMETRIA INTE	A207	2715	900204109
137	DATOS VERTICALES  REDEBAN	P060	2742	900092385
138	PROYECTO BANCOLOMBIA	P50	2742	900092385
139	CAJACOPI	P52	2742	900092385
140	CONSTRUCTORA BOLIVAR	P344	2742	900092385
141	CORRESPONSALES NO BANCARIOS	P129	2742	900092385
142	PENALIDAD X DESCONEXION ANTICIPADA	P999	2742	900092385
143	OLIMPICA POS	P192	2742	900092385
144	INVERCOMER (MEGATIENDA)	P262	2742	900092385
145	DAVIVIENDA - GPRS	P052	2742	900092385
146	AMT`s  DAVIVIENDA	P050	2742	900092385
147	PROYECTO ALARMAS BANCOLOMBIA	P51	2742	900092385
148	REDEBAN GPRS	P090	2742	900092385
149	OLIMPICA PCs	P190	2742	900092385
150	AMT`s  DAVIVIENDA - GPRS	P051	2742	900092385
151	PROYECTO COLPATRIA	P005	2761	800136835
152	CLIENTE COEXITO	P077	2761	800136835
153	PROYECTO BANCOLOMBIA	P305	2761	800136835
154	PROYECTO COLSUBSIDIO	P310	2761	800136835
155	PROYECTO BANCO W	P314	2761	800136835
156	MARROQUINERIA	P075	2761	800136835
157	CENIT POLIORIENTE	P260	2761	800136835
158	SERVIBANCA	P191	2761	800136835
159	CENIT	P145	2761	800136835
160	COLCHONES SPRING	P280	2761	800136835
161	CIRION CREDIBANCO	P076	2761	800136835
162	PROYECTO FALABELLA	P80	2761	800136835
163	COLOMBINA	P313	2761	800136835
164	JUSTICIA PENAL MILITAR Y POLICIA	P202	2761	800136835
165	REDEBAN - ESTABLECIMIENTOS	P003	2761	800136835
166	PROYECTO BACKUP SEVIBANCA	P311	2761	800136835
167	ENLACES TEMPRANO PRODUCTO	P71	2761	800136835
168	AVESCO	P072	2761	800136835
169	PROYECTO OCENSA	P308	2761	800136835
170	CSJ - CONSEJO SUPERIOR DE LA JUDICA	P132	2761	800136835
171	ECOPETROL	P77	2761	800136835
172	COMFANDI	P073	2761	800136835
173	INTELSAT	P071	2761	800136835
174	BANCO UNION DOBLE MEDIO OPERADOR	P147	2761	800136835
175	ASEGURADORA SOLIDARIA	P75	2761	800136835
176	CREPES & WAFFLES	P074	2761	800136835
177	BANCO UNION	P148	2761	800136835
178	BANCOLOMBIA	P90	2761	800136835
179	PROYECTO CREDIVALORES	P81	2761	800136835
180	SANCHEZ POLO	P93	2761	800136835
181	ENLACES	P95	2761	800136835
182	COOMEVA	P149	2761	800136835
183	MINISTERIO DE TRANSPORTE	P76	2761	800136835
184	CENIT POLIANDINO	P261	2761	800136835
185	CINE COLOMBIA	P078	2761	800136835
186	PROYECTO BBVA	P303	2761	800136835
187	PROYECTO BANCOLOMBIA	P309	2761	800136835
188	ANUALIDAD IMP ING. MONTAJES Y PROY	A175	2767	900441996
189	PROYECTO ENERCA	P70	2773	901790020
190	ANUALIDAD JULIO SIT EXODO S.A.S	A188	2779	901223743
191		A177	2779	901223743
192	ANUALIDAD FEB/25 SIT EXODO	A210	2779	901223743
193	ANUALIDAD SIT EXODO SAS	A139	2779	901223743
194	ANUALIDAD OCTUBRE SIT EXODO S.A.	A197	2779	901223743
195	ANUALIDAD MAR/25 SIT EXODO S.A.S	A212	2779	901223743
196	ANUALIDAD DICIEMBRE SIT EXODO	A206	2779	901223743
197		A179	2779	901223743
198	ANUALIDAD JUNIO SIT EXODO SA	A185	2779	901223743
199	ANUALIDAD MAYO SIT EXODO SA	A178	2779	901223743
200	ANUALIDAD SEPTIEMBRE SIT EXODO S.A.	A194	2779	901223743
201	ANUALIDAD MAY/25 SIT EXODO	A183	2779	901223743
202	ANUALIDAD ABRI/25 SIT EXODO	A216	2779	901223743
203	ANUALIDAD AGOSTO SIT EXODO SA	A191	2779	901223743
204	ANUALIDAD NOVIEMBRE SIT EXODO S.A.	A201	2779	901223743
205	ANUALIDAD JUNIO/25 SIT EXODO	A222	2779	901223743
206	ANUALIDAD PEREZ  ALFONSO MARCOS NOR	A168	2795	79734893
207	ANUALIDAD GOMEZ BASTO LUISA FERNAND	A157	2800	28386466
208	ANUALIDAD HERNANDEZ LOPEZ LUIS ENRI	A159	2801	13346186
209	ANUALIDAD PARRA MONSALVE YAMILE	A161	2807	63398227
210	SECRETARIA DE AMBIENTE	P361	2825	830058677
211	ALARMAS JM	P09	2839	900273137
212	COMPUSAFE LEASING - MODEM R1510	P252	2843	860002964
213	ALM - DIGICOM	P91	2843	860002964
214	PROYECTO BRINKS DE COLOMBIA	P165	2843	860002964
215	BACKUP DE OFICINAS - 3G	P055	2843	860002964
216	DIGICOM	P92	2843	860002964
217	PROYECTO ATMS´s	P130	2843	860002964
218	BACKUP DE OFICINAS - 3G	P053	2843	860002964
219	ANUALIDAD MAR/25 FILPAC SOCIEDAD	A217	2845	901749455
220	ANUALIDAD EXTRACTORA SAN FERNANDO S	A116	2859	900121530
221	EQUIPOS ERMETRONIC	P85	2873	900565109
222	NETIO	P86	2873	900565109
223	ANUALIDAD SUAREZ JAIMES  LUIS FRANC	A165	2876	5747636
224	MANSAROVAR ZAMBITO-CLUB PTO	P203	2887	860400538
225	SEMESTRALIDAD  RAYCO SA	A115	2887	860400538
226	CAFAM PRINCIPAL	P007	2902	860013570
227	CAFAM CALLE 85	P004	2902	860013570
228	CAFAM PASADENA	P006	2902	860013570
229	CODIGO MEDIDA	P501	2919	830017927
230	ANUALIDAD PROCOLDEXT SAS	A127	2947	800105847
231	ANUALIDAD PEÑARANDA R. JOSE ANTONIO	A173	2952	1044924367
232	ANUALIDAD ARCINIEGAS JAMES LUIS FEL	A152	2971	13924092
233	NETIO	P87	2983	830049705
234	PROYECTO PAC´s - MIGRACION	P035	2998	890903938
235	PROYECTO ATMS´s	P025	2998	890903938
236	ANUALIDAD LA FERRERIA S.A.	A134	3000	811002937
237	ANUALIDAD INSITEL S.A.	A132	3039	816001431
238	UTRY MAQUINAS DE RECARGAS Y PC POS	P049	3046	830114921
239	TRIMESTRE	A118	3051	900271845
240	ANUALIDAD -  CIPRES SEGURIDAD	A113	3051	900271845
241	ANUALIDAD RIOS MIGUEL ANGEL	A220	3065	1022338471
242	ANUALIDAD MABEL ADRIANA YATE	A172	3068	52023658
243	LÍNEA PRODUCCION	1010	3074	22222222
244	ANUALIDAD TECNOLOGIA EN SUPRESORES	A174	3078	900354706
245	ANUALIDAD GASEOSAS LUX S.A.S.	A119	3081	860001697
246	LINEA SABANA - SINCELEJO - SUCRE	P135	3086	900713658
247	PROYECTO  -  SEDE CALIMA	P1000	3091	800049458
248	PROYECTO  -  SEDE FLORVAL	P2000	3091	800049458
249	PROYECTO  -  SEDE Q.F.C.	P3000	3091	800049458
250	FLORES CALIMA	P186	3091	800049458
251	OFI CINA BOGOTA	P185	3091	800049458
252	QFC SAS EN LIQUIDACIÓN	P187	3091	800049458
253	UTR&T - MIO CALI	P53	3103	900099310
254	UTRY	P048	3103	900099310
255	NETIO	P751	3107	810003085
256	COLSECURITY	P750	3107	810003085
257	CINCO MESES SOLLIVAN	A193	3111	901073049
258	ANUALIDAD MARIA STELLA QUINTERO ESP	A142	3127	800143133
259	AUTOMATIZACION	P142	3139	860350234
260	AUTOMATIZACION - GENERAL AUTOMATIC	P20	3139	860350234
261	AUTOMATIZACION - SODIMAC	P137	3139	860350234
262	AUTOMATIZACION - FLAMINGO	P133	3139	860350234
263	MULTICLIENTE	P177	3139	860350234
264	AUTOMATIZACION - EXITO	P127	3139	860350234
265	PROYECTO EGLOBALT	P88	3139	860350234
266	AUTOMATIZACION POSTOBON	P139	3139	860350234
267	ESTRATEGIA 2.1 GRUPO 2	P143	3139	860350234
268	AUTOMATIZACION - FALABELLA	P138	3139	860350234
269	ESTRATEGIA 2.1 BSAFE	P140	3139	860350234
270	ELEKTRA	P12	3142	901137485
271	SALDO EQUIP/SERV. ITEMS 1/2 C.267A-	P102	3147	860000596
272	Javier Hoyos Solar	P087	3163	901226517
273	Andrés Pérez Solar	P086	3163	901226517
274	PUNTO HOCOL	P062	3223	900034278
275	PUNTO CANACOL	P058	3223	900034278
276	PUNTO CMSA	P059	3223	900034278
277	DOBLE MEDIO	P315	3244	860032909
278	ENLACE TEMPRANO	P316	3244	860032909
279	ANUALIDAD COMEREXCO	A199	3249	900419778
280	GPRS SECURITY SHOPS	P042	3250	800008838
281	PROYECTO HOLDING SECURITY	P018	3250	800008838
282	GPRS MIG. SECURITY SHOPS	P041	3250	800008838
283	ALARMLINK	P306	3250	800008838
284	ANUALIDAD G .G SECTECH S.A.S.	A117	3251	900275180
285	CENTRAL CALI	P080	3267	890312749
286	CENTRAL BOGOTA	P015	3267	890312749
287	CENTRAL BUCARAMANGA	P033	3267	890312749
288	ANUALIDAD ALBARRACIN DAZA ISMAEL	A155	3274	13921560
289	ANUALIDAD FERNANDEZ JAIMES HERACLIT	A156	3291	13923928
290	PYP-ETB-EQUIPOS PROPIOS            	P383 	3297	900784911
291	ETB CAMARAS CENTROS COMERCIALES	P381	3297	900784911
292	CAMARAS DE SEGURIDAD Y VIGILANCIA  	P380 	3297	900784911
293	CENTROS COMERCIALES	P438	3297	900784911
294	ETB- REDES CUIDADANAS	P382	3297	900784911
295	COLSECURITY - CENTRAL MEDELLIN	P500	3313	800215227
296	G4S - CENTRAL CALI	P600	3313	800215227
297	G4S-CENTRAL BOGOTA-BARRANQUILLA	P800	3313	800215227
298	COLSECURITY - CENTRAL B/QUILLA	P700	3313	800215227
299	ANUALIDAD CARVAJAL CALDERON ALFONSO	A151	3341	5612510
300	ANUALIDAD AGROINCE LTDA	A120	3359	890212868
301	ANUALIDAD PEÑA SANDOVAL JUAN E.	A162	3365	13928354
302	FRONTERA	P61	3382	901163712
303	CHICHIMENE	P65	3382	901163712
304	CASTILLA LA NUEVA	P62	3382	901163712
305	RUBIALES-PUERTO GAITAN	P64	3382	901163712
306	APIAY-VILLAVICENCIO	P63	3382	901163712
307	ANUALIDAD AUTENTICA SEGURIDAD LIMIT	A137	3419	800138597
308	SOPORTE	P11	3434	800153993
309	ANUALIDAD LADRILLERA BAJO CAUCA S.A	A136	3439	900264965
310	PROYECTO INTELPRO	P120	3470	890105526
311	SCADA	P326	3470	890105526
312	EQUIPOS COLSECURITY	P110	3474	804000044
313	ANUALIDAD ROA SANCHEZ GUSTAVO	A158	3478	5747815
314	POLICIA CAT S472H+	094	3492	830122566
315	EMPRESA SOCIAL DEL ESTADO HOSPITAL	P360	3492	830122566
316	POLICIA CAT S42H+	P094	3492	830122566
317	AMARILO 2 (OT26)	P151A	3492	830122566
318	COMERCIALIZADORA DE MATERIAL CIENTI	P334	3492	830122566
319	MIFI BAVARIA	P613	3492	830122566
320	CARROCERIAS MONTEJO	P0151	3492	830122566
321	FERROELECTRICOS JJ SAS	P337	3492	830122566
322	PROTECCION	P78	3492	830122566
323	ARMADA NAL - IND. CONECTADA	P609	3492	830122566
324	ALCALDIA FUNZA	P161	3492	830122566
325	APIROS - IND. CONECTADA	P616	3492	830122566
326	HOCOL	P59	3492	830122566
327	SEGUIMIENTO DE MASCOTAS	P126	3492	830122566
328	LG ELECTRONICS	P66	3492	830122566
329	DAVID SEGURIDAD LTDA	P339	3492	830122566
330	D PRODUCAMPO LTDA	P332	3492	830122566
331	CINEMARK - IND. CONECTADA	P612	3492	830122566
332	PROYECTO BANCO CAJA SOCIAL	P300	3492	830122566
333	POLICIA NACIONAL	P60	3492	830122566
334	PICHINCHA	P89	3492	830122566
335	ESE SORTERESA ADELLE	P327	3492	830122566
336	A T I ASISTENCIA TECNICA INDUSTRIAL	P335	3492	830122566
337	CANCILLERIA - IND. CONECTADA	P605	3492	830122566
338	PROYECTO DAVIVIENDA	P400	3492	830122566
339	DLO -  DISTRIBUIDORA DE LUBRICANTES	P044	3492	830122566
340	PROSEGUR	P408	3492	830122566
341	COLVISEG  - IND. CONECTADA	P617	3492	830122566
342	SHANDONG	P183	3492	830122566
343	BANCO AGRARIO	P82	3492	830122566
344	ACUEDUCTO	P84	3492	830122566
345	GRUPO COMERCIAL TOLIMENSE	P054	3492	830122566
346	ELECTRICARIBE	P136	3492	830122566
347	CREDIBANCO #2	P189	3492	830122566
348	COLEGIO JUNIN - IND CONECTADA	P603	3492	830122566
349	ORLANDO DONADO Y COMPANIA LTDA	P320	3492	830122566
350	CENTRAL DE COOPERACION DE SERVICIOS	P362	3492	830122566
351	AMARILO	P151	3492	830122566
352	VANTI S A	P213	3492	830122566
353	PACIFIC SEA FOOD LTDA	P364	3492	830122566
354	GESTION FORESTAL Y ASESORIAS AMBIEN	P321	3492	830122566
355	PROYECTO BANCO SANTANDER	P150	3492	830122566
356	IND. CONECTADA                     	P184 	3492	830122566
357	WELLBORE INTEGRITY SOLUTIONS - IND.	P604	3492	830122566
358	ECOPETROL	P94	3492	830122566
359	HOSPITAL SAN JOSE DE ORTEGA EMPRESA	P348	3492	830122566
360	LA GRANJA	P188	3492	830122566
361	ENTER	P193	3492	830122566
362	FASTER SERVICES COLOMBIA S.A.S	P318	3492	830122566
363	ARRIENDO ENLACES	P160	3492	830122566
364	REDPLUS INTEGRAL SAS	P340	3492	830122566
365	PROYECTO SIRCI - SITP	P170	3492	830122566
366	TALENTO SOLIDO S A S	P323	3492	830122566
367	DEPOSITO TRUJILLO UNO SAS	P336	3492	830122566
368	AMCOR I. P. - IND. CONECTADA	P608	3492	830122566
369	COLTEG COMUNICACIONES SAS	P319	3492	830122566
370	MUNICIPIO DE SESQUILE	P330	3492	830122566
371	DAVITA S.A.- IND. CONECTADA	P607	3492	830122566
372	GURA GROUP S.A.S	P351	3492	830122566
373	ALEJANDRO ARBOLEDA Y CIA SA	P333	3492	830122566
374	HOSPITAL MARIA INMACULADA	P328	3492	830122566
375	PROYECTO DAVIVIENDA GPRS	P401	3492	830122566
376	REGISTRADURIA	P58	3492	830122566
377	COQUECOL	P98	3492	830122566
378	BANCO CAJA SOCIAL WIFI OFICINAS	P162	3492	830122566
379	PROYECTO BCSC GPRS	P301	3492	830122566
380	PROYECTO SCHLUMBERGER	P205	3492	830122566
381	ELECSA CON S.A.S.	P338	3492	830122566
382	CIFIN	P342	3492	830122566
383	COMPAÑIA COLOMBIANA DE TELECOMUNICA	P349	3492	830122566
384	CARBONES	P210	3492	830122566
385	ITAU	P67	3492	830122566
386	PROYECTO CREDIBANCO GPRS	P180	3492	830122566
387	GOBERNACION DE ANTIOQUIA	P194	3492	830122566
388	DIAGNOSTICO Y DISTRIBUCION GENERAL	P331	3492	830122566
389	INDUSTRIAS ALIMENTICIAS FERNANDEZ B	P356	3492	830122566
390	HUMAX .- IND. CONECTADA	P610	3492	830122566
391	VEOLIA	P128	3492	830122566
392	DISTRIBUIDRA SERRANO MEDRANO SAS	P353	3492	830122566
393	PROYECTO BCSC GPRS SOLO SERVICIO	P302	3492	830122566
394	LIMITADA VIMACH	P324	3492	830122566
395	CORPORACION NAN KING S.A.S	P347	3492	830122566
396	KMA CONSTR. - IND. CONECTADA	P615	3492	830122566
397	DIAGNOSTICO Y DISTRIBUCION GENERAL	P322	3492	830122566
398	BBVA	P409	3492	830122566
399	OLIMPICA	P79	3492	830122566
400	PROYECTO THOMAS GREGG	P146	3492	830122566
401	REDSERAUTO SAS	P352	3492	830122566
402	FISCALIA GENERAL DE LA NACION	P131	3492	830122566
403	EMPRESA DE ACUEDUCTO Y ALCANTARILLA	P329	3492	830122566
404	ACUEDUCTO DE BOGOTÁ	P100	3492	830122566
405	EMPRESA DE SERVICIOS PUBLICOS DE LE	P345	3492	830122566
406	ATENCION MEDICO INMEDIATA DOMICILIA	P046	3492	830122566
407	CUERPO DE BOMBEROS VOLUNTARIOS DE T	P355	3492	830122566
408	CARLIXPLAST LTDA	P043	3492	830122566
409	BIOMAX	P097	3492	830122566
410	APOLO 3	P13	3492	830122566
411	EQUIPOS ARCO Y CIA LTDA	P354	3492	830122566
412	PROTECCION ASEG. -  IND CONECTADA	P602	3492	830122566
413	INNOVATIVE KITCHEN S.A.S	P350	3492	830122566
414	ALCALDIA DE S. ANDRES Y PROVIDENCIA	P606	3492	830122566
415	HOTELES DE LA ANTIGUA SAS	P141	3492	830122566
416	AVICOLA SAN MARINO	P181	3492	830122566
417	SERVICIOS FUNERARIOS COOPERATIVOS D	P346	3492	830122566
418	KRONES ANDINA - IND. CONECTADA	P601	3492	830122566
419	AVIATUR	P55	3492	830122566
420	MIGRACION	P056	3512	860034313
421	ANUALIDAD BARRERA ALBARRACIN VICTOR	A154	3513	80220427
422	ANUALIDAD SIPROELC SAS	A101	3526	901203937
423	Propietario: Sotero Perez Alfonso	9000	3533	800161062
424	ANUALIDAD SERVIGTEC	A109	3596	860060112
425	NETIO	P144	3596	860060112
426	ANUALIDAD COORDINAR SEGURIDAD	A108	3600	900362633
427	APUESTAS	P014	3611	830065974
428	DATOS VERTICALES  REDEBAN	P066	3628	800255754
429	SEDE MG CONSULTORES	P04	3636	860054546
430	SEDE LA VALVANERA	P08	3636	860054546
431	SEDE JARDINES EL ROSAL	P05	3636	860054546
432	ANUALIDAD DYNAMIC DE COL.	A176	3662	860034535
433	ALERTA MAXIMA LTDA	P021	3675	890104906
434	PROYECTO ALARMAS JM	P017	3675	890104906
435	MIGRACION CDPD A CDMA	P057	3691	860007335
436	P. COMITE CALDAS - PALESTINA	P406	3703	860007538
437	PROY COMITE DE CALDAS	P403	3703	860007538
438	P. COMITE CALDAS - SAN JOSE	P405	3703	860007538
439	PROY COMITE DEL QUINDIO	P402	3703	860007538
440	P. COMITE CALDAS - ANSERMA	P407	3703	860007538
441	P. COMITE CALDAS - RIOSUCI	P404	3703	860007538
442	GENERACION	P159	3705	811000740
443	CODIGO MEDIDA	P157	3705	811000740
444	HIDROMETRIA	P158	3705	811000740
445	GENERACION	159	3705	811000740
446	DATAFONOS GPRS	P200	3716	830070527
447	SIM IPP	P067	3716	830070527
448	SIM LEGACY	P065	3716	830070527
449	REDEBAN - COMUNICACIONES	P001	3716	830070527
450	REDES DE POS	P068	3716	830070527
451	REDEBAN - MERCADEO	P002	3716	830070527
452	CONECTIVIDAD	P325	3747	830114737
453	PROYECTO ALARM LINK	P902	3772	800185039
454	PROYECTO PEGASUS	P901	3772	800185039
455	NETIO	P036	3798	830100582
456	ANUALIDAD SEGURIDAD BUFFALO	A110	3802	900741892
457	RED GANA	P098	3811	830101092
458	ENLACE TEMPRANO PLCs	P68	3815	802021888
459	AZSMART	P997	3829	901497104
460	INTERNET	P998	3829	901497104
461	ANUALIDAD LONDONO CESAR	A105	3830	1017127712
462	ANUALIDAD - LONDOÑO CESAR A.	A215	3830	1017127712
463	ANUALIDAD OA AUTOMATIZACION SAS	A123	3838	901357395
464	RENOVACION ANUALIDAD	R002	3850	800010582
465	RENOVACION ANUALIDAD	R001	3850	800010582
466	ANUALIDAD SEG.DE VIG HORIZONTE	A107	3850	800010582
467	ANUALIDAD ONE TRACKER GPS S.A.S	A124	3851	900857905
468	ANUALIDAD MACARENIA CORP	A140	3857	901515201
469	PROYECTO GPRS MIGRACION	P304	3862	830090173
470	BACKUP OFICINAS	P359	3863	802011610
471	ANUALIDAD CESPEDES STIWEN	A114	3883	1121926721
472	ANUALIDAD COMTOR LTDA	A111	3884	830106244
473	ANUALIDAD ORDOÐEZ MONTENEGRO OSCAR	A125	3897	16729804
474	ANUALIDAD ENCUENTRAME	A104	3926	901730530
475	ANUALIDAD I.A.S. INGENIERIA APLICAC	A129	3929	811042378
476	CASA LUDICA LA PAZ NORMALIZACION DE	P211	3931	900843992
477	COLEGIO DISTRITAL JOSE EUSEBIO - TG	P196	3931	900843992
478	I.E.D FORMACION INTEGRAL -TGBT	P195	3931	900843992
479	I.E.D  DE LAS NIEVES -  TGBT	P197	3931	900843992
480	COLEGIO DISTRITAL SANTO DOMINGO DE	P209	3931	900843992
481	BOMBEROS TECNOGLASS NORMALIZACION D	P198	3931	900843992
482	BOMBEROS EL EDEN NORMALIZACION DE M	P206	3931	900843992
483	I.E.D INMACULADA CONCEPCION - TGBT	P208	3931	900843992
484	IED SIMON BOLIVAR SEDE 2 - TGBT	P207	3931	900843992
485	ANUALIDAD SEGISMUNDO RUIZ MARIN	A170	3941	5747876
7	PROYECTO GAS NATURAL VEHICULAR - AR	P013	2155	810002601
1482	ANUALIDAD JUL/25 SEGUMIENTO ACTIVO	A187	2428	901493936
1483	ANUALIDAD AGO/25 SEGUIMIENTO ACTIVO	A192	2428	901493936
1484	ANUALIDAD VEHICULOS	A218	2264	901249413
1485	ANUALIDAD MOTOCICLETAS	A219	2264	901249413
1486	ANUALIDAD JULIO/25 NUMAR TECHNOLOGI	A224	2680	901550593
1487	ANUALIDAD JULIO/25 SIT EXODO SA	A225	2779	901223743
1488	ANUALIDAD AGOS/25 NUMAR TECHNOLOGIE	A226	2680	901550593
1489	ANUALIDAD LAURA MOSCOSO	A227	3671	1013616114
1490	ANUALIDAD SEP/25 SIT EXODO	A228	2779	901223743
1491	ANUALIDAD EMPRESTUR S.A.S.	A229	4036	811030670
1492	TRIMESTRE - AGO-OCT/25	A501	2264	901249413
1493	SEMESTRE - AGO-DICT/25	A502	2264	901249413
1494	SEMESTRALIDAD  RAYCO SA	A77	2887	860400538
1495	CENTRO FERRETERO MAFER S.A.S.	P063	3492	830122566
1496	REDES DE POS-OLIMPICA	P070	3716	830070527
1497	SVE	P163	3156	830005066
1498	ACUEDUCTO	P164	3156	830005066
1499	GENERADORES SOLARES - GDO	P166	3815	802021888
1500	PANTALLAS TRANSMILENIO	P167	3721	900230023
1501	MEDIDORES CAQUETA	P168	2773	901790020
1502	TU BOLETA	P169	3285	900569193
1503	GENERADORES SOLARES - CEO	P172	3815	802021888
1504	FERIA DEL AUTOMOVIL CORFERIAS	P174	2825	830058677
1505	AMBIENTES CERAMICOS LTDA	P365	3492	830122566
1506	PROFUTURO, BIENESTAR Y PROGRESO SAS	P366	3492	830122566
1507	DISTRIBUCIONES SYE S A S	P367	3492	830122566
1508	INGENIO CARMELITA	P368	3492	830122566
1509	PROYMELEC INGENIERIA SAS	P369	3492	830122566
1510	REINDUSTRIAS S.A.	P370	3492	830122566
1511	IDIGER	P371	2518	899999115
1512	CESAR ALEJANDRO MARTINEZ TORRES	P372	3492	830122566
1513	PRAXEDIS DE ARTUNDUAGA S A	P373	3492	830122566
1514	CRISLOZA S.A.S.	P374	3492	830122566
1515	CEMENTOS ARGOS	P375	2139	830141109
1516	COMERCIAL DE GRANOS INTERNACIONAL S	P376	3492	830122566
1517	SECRETARIA DE LA MUJER	P377	2518	899999115
1518	Banco Caja Social 5G	P378	3492	830122566
1519	CAMARAS	P379	2592	860005216
1520	DISTRIBUIDORA DE PRODUCTOS ALIMENTI	P384	3492	830122566
1521	AUTOMATIZACION - CINEMARK	P96	3139	860350234
1522	AUTOMATIZACION - CENCOSUD	P97	3139	860350234
\.


--
-- Data for Name: rbac_event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rbac_event (id, actor, role, perm_code, allowed_before, allowed_after, created_at) FROM stdin;
\.


--
-- Data for Name: remision; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.remision (id_remision, numero_remision, fecha_remision, id_orden_pedido, numero_remision_2, numero_remision_3, numero_remision_4, numero_remision_5, estado_remision) FROM stdin;
2	465465	2026-02-09 15:48:13.579+00	80	\N	\N	\N	\N	\N
3	465465	2026-02-09 15:56:05.98+00	78	\N	\N	\N	\N	\N
4	465465	2026-02-12 20:29:57.93+00	82	\N	\N	\N	\N	\N
\.


--
-- Data for Name: responsable_orden; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.responsable_orden (id_orden_pedido, user_id, role) FROM stdin;
78	3595bd53-7905-4c86-87a8-f6d6edd5f87c	ingenieria
79	e99c9416-cd61-40f8-9873-17ab42a6416d	comercial
80	f7404c54-34f5-43ff-90f6-5ec6cfb0d7ec	comercial
80	3595bd53-7905-4c86-87a8-f6d6edd5f87c	ingenieria
81	e99c9416-cd61-40f8-9873-17ab42a6416d	comercial
82	3595bd53-7905-4c86-87a8-f6d6edd5f87c	ingenieria
82	e99c9416-cd61-40f8-9873-17ab42a6416d	comercial
83	f7404c54-34f5-43ff-90f6-5ec6cfb0d7ec	comercial
83	3595bd53-7905-4c86-87a8-f6d6edd5f87c	ingenieria
84	f7404c54-34f5-43ff-90f6-5ec6cfb0d7ec	comercial
85	e99c9416-cd61-40f8-9873-17ab42a6416d	comercial
81	3595bd53-7905-4c86-87a8-f6d6edd5f87c	ingenieria
84	3595bd53-7905-4c86-87a8-f6d6edd5f87c	ingenieria
85	3595bd53-7905-4c86-87a8-f6d6edd5f87c	ingenieria
79	25edb150-cedd-4718-815b-d7d2b39ae886	ingenieria
90	f7404c54-34f5-43ff-90f6-5ec6cfb0d7ec	comercial
90	f4cb1c69-6a14-4af3-aed8-244d0d73e894	ingenieria
91	e99c9416-cd61-40f8-9873-17ab42a6416d	comercial
91	da9cbae5-f3fb-479c-8f75-e9cbecad28b1	produccion
85	da9cbae5-f3fb-479c-8f75-e9cbecad28b1	produccion
91	3595bd53-7905-4c86-87a8-f6d6edd5f87c	ingenieria
93	e1355e21-844d-42c2-9ed5-6138864bacc8	comercial
93	a05ae5f9-0575-41f1-96bb-58d8822e85e0	ingenieria
78	e99c9416-cd61-40f8-9873-17ab42a6416d	comercial
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role, perm_code, allowed, updated_at) FROM stdin;
admin	orden.view_phase	t	2025-09-16 21:53:13.564383+00
admin	orden.view_own	t	2025-09-16 21:53:13.564383+00
admin	orden.view_all	t	2025-09-16 21:53:13.564383+00
admin	orden.create	t	2025-09-16 21:53:13.564383+00
admin	orden.update	t	2025-09-16 21:53:13.564383+00
admin	orden.move_fase	t	2025-09-16 21:53:13.564383+00
admin	orden.change_estatus	t	2025-09-16 21:53:13.564383+00
admin	orden.assign_responsable	t	2025-09-16 21:53:13.564383+00
admin	detalle.create	t	2025-09-16 21:53:13.564383+00
admin	detalle.update	t	2025-09-16 21:53:13.564383+00
admin	detalle.delete	t	2025-09-16 21:53:13.564383+00
admin	user.manage	t	2025-09-16 21:53:13.564383+00
admin	export.data	t	2025-09-16 21:53:13.564383+00
comercial	orden.view_own	t	2025-09-16 21:53:13.564383+00
comercial	orden.create	t	2025-09-16 21:53:13.564383+00
comercial	orden.update	t	2025-09-16 21:53:13.564383+00
comercial	orden.move_fase	t	2025-09-16 21:53:13.564383+00
comercial	orden.change_estatus	t	2025-09-16 21:53:13.564383+00
comercial	detalle.create	t	2025-09-16 21:53:13.564383+00
comercial	detalle.update	t	2025-09-16 21:53:13.564383+00
comercial	detalle.delete	t	2025-09-16 21:53:13.564383+00
inventarios	orden.view_phase	t	2025-09-16 21:53:13.564383+00
inventarios	orden.view_own	t	2025-09-16 21:53:13.564383+00
inventarios	orden.update	t	2025-09-16 21:53:13.564383+00
inventarios	orden.move_fase	t	2025-09-16 21:53:13.564383+00
inventarios	orden.change_estatus	t	2025-09-16 21:53:13.564383+00
produccion	orden.view_phase	t	2025-09-16 21:53:13.564383+00
produccion	orden.view_own	t	2025-09-16 21:53:13.564383+00
produccion	orden.update	t	2025-09-16 21:53:13.564383+00
produccion	orden.move_fase	t	2025-09-16 21:53:13.564383+00
produccion	orden.change_estatus	t	2025-09-16 21:53:13.564383+00
logistica	orden.view_phase	t	2025-09-16 21:53:13.564383+00
logistica	orden.view_own	t	2025-09-16 21:53:13.564383+00
logistica	orden.update	t	2025-09-16 21:53:13.564383+00
logistica	orden.move_fase	t	2025-09-16 21:53:13.564383+00
logistica	orden.change_estatus	t	2025-09-16 21:53:13.564383+00
logistica	export.data	t	2025-09-16 21:53:13.564383+00
facturacion	orden.view_phase	t	2025-09-16 21:53:13.564383+00
facturacion	orden.view_own	t	2025-09-16 21:53:13.564383+00
facturacion	orden.update	t	2025-09-16 21:53:13.564383+00
facturacion	orden.move_fase	t	2025-09-16 21:53:13.564383+00
facturacion	orden.change_estatus	t	2025-09-16 21:53:13.564383+00
facturacion	export.data	t	2025-09-16 21:53:13.564383+00
financiera	orden.view_phase	t	2025-09-16 21:53:13.564383+00
financiera	orden.view_own	t	2025-09-16 21:53:13.564383+00
financiera	orden.update	t	2025-09-16 21:53:13.564383+00
financiera	orden.move_fase	t	2025-09-16 21:53:13.564383+00
financiera	orden.change_estatus	t	2025-09-16 21:53:13.564383+00
financiera	export.data	t	2025-09-16 21:53:13.564383+00
admin	catalogo.manage	t	2025-09-16 21:53:13.564383+00
admin	catalogo.cliente.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.cliente.manage	t	2025-09-17 16:45:48.733478+00
admin	catalogo.proyecto.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.proyecto.manage	t	2025-09-17 16:45:48.733478+00
admin	catalogo.claseorden.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.claseorden.manage	t	2025-09-17 16:45:48.733478+00
admin	catalogo.operador.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.operador.manage	t	2025-09-17 16:45:48.733478+00
admin	catalogo.plan.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.plan.manage	t	2025-09-17 16:45:48.733478+00
admin	catalogo.apn.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.apn.manage	t	2025-09-17 16:45:48.733478+00
admin	catalogo.transportadora.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.transportadora.manage	t	2025-09-17 16:45:48.733478+00
admin	catalogo.metododespacho.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.metododespacho.manage	t	2025-09-17 16:45:48.733478+00
admin	catalogo.tipopago.read	t	2025-09-17 16:45:48.733478+00
admin	catalogo.tipopago.manage	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.cliente.read	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.cliente.manage	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.proyecto.read	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.proyecto.manage	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.claseorden.read	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.claseorden.manage	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.operador.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.operador.manage	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.plan.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.plan.manage	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.apn.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.apn.manage	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.transportadora.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.transportadora.manage	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.metododespacho.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.metododespacho.manage	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.tipopago.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.tipopago.manage	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.operador.read	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.plan.read	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.apn.read	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.transportadora.read	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.metododespacho.read	t	2025-09-17 16:45:48.733478+00
comercial	catalogo.tipopago.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.cliente.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.proyecto.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.claseorden.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.transportadora.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.metododespacho.read	t	2025-09-17 16:45:48.733478+00
inventarios	catalogo.tipopago.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.cliente.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.proyecto.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.claseorden.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.operador.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.plan.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.apn.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.transportadora.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.metododespacho.read	t	2025-09-17 16:45:48.733478+00
produccion	catalogo.tipopago.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.cliente.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.proyecto.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.claseorden.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.operador.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.plan.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.apn.read	t	2025-09-17 16:45:48.733478+00
logistica	catalogo.tipopago.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.cliente.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.proyecto.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.claseorden.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.operador.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.plan.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.apn.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.transportadora.read	t	2025-09-17 16:45:48.733478+00
facturacion	catalogo.metododespacho.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.cliente.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.proyecto.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.claseorden.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.operador.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.plan.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.apn.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.transportadora.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.metododespacho.read	t	2025-09-17 16:45:48.733478+00
financiera	catalogo.tipopago.read	t	2025-09-17 16:45:48.733478+00
\.


--
-- Data for Name: servicio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.servicio (id_servicio, nombre_servicio, codigo_servicio, ticon) FROM stdin;
\.


--
-- Data for Name: tipo_despacho; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipo_despacho (id_tipo_despacho, nombre_tipo, requiere_direccion, requiere_transportadora) FROM stdin;
3	Recoge en Bismark	f	f
2	Envio	t	t
1	Contraentrega	t	t
\.


--
-- Data for Name: tipo_pago; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipo_pago (id_tipo_pago, forma_pago, aprobado_cartera, plazo) FROM stdin;
1	Contado	t	0 días
5	N/A	f	\N
7	Backup	f	\N
8	Garantía	t	\N
9	Legalización	t	\N
10	Préstamo	t	\N
11	Reposición	t	\N
6	Credito	t	90 dias
4	Credito	t	60 dias
3	Credito	t	30 dias
2	Credito	t	15 dias
\.


--
-- Data for Name: tipo_servicio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipo_servicio (id_tipo_servicio, nombre_tipo_servicio) FROM stdin;
1	Alarmas
2	Sistema de Rastreo Vehicular
3	Conectividad
4	Tranceptores
6	Reposiciones
5	Telemetria
\.


--
-- Data for Name: transportadora; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transportadora (id_transportadora, nombre_transportadora, fecha_transportadora, observaciones_envio) FROM stdin;
1	DHL EXPRESS	\N	\N
2	MENSAJEROS URBANOS	\N	\N
3	UBER	\N	\N
4	SERVIENTREGA	\N	\N
5	FEDEX	\N	\N
7	SERVIMEJIA	\N	\N
6	TNT	\N	\N
8	DIDI	\N	\N
9	Envia	\N	\N
10	No Aplica	\N	\N
11	INTERRAPIDISIMO	\N	\N
\.


--
-- Name: accesorio_id_accesorio_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accesorio_id_accesorio_seq', 1, false);


--
-- Name: apn_id_apn_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.apn_id_apn_seq', 49, true);


--
-- Name: claseorden_id_clase_orden_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.claseorden_id_clase_orden_seq', 6, true);


--
-- Name: cliente_id_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cliente_id_cliente_seq', 4061, true);


--
-- Name: contacto_despacho_id_contacto_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contacto_despacho_id_contacto_seq', 26, true);


--
-- Name: despacho_orden_id_despacho_orden_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.despacho_orden_id_despacho_orden_seq', 55, true);


--
-- Name: detalle_orden_id_orden_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalle_orden_id_orden_detalle_seq', 57, true);


--
-- Name: direccion_despacho_id_direccion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.direccion_despacho_id_direccion_seq', 26, true);


--
-- Name: equipo_id_equipo_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipo_id_equipo_seq', 1895, true);


--
-- Name: factura_id_factura_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.factura_id_factura_seq', 5, true);


--
-- Name: historial_factura_id_historial_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historial_factura_id_historial_seq', 1, false);


--
-- Name: historial_orden_id_historial_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historial_orden_id_historial_seq', 11, true);


--
-- Name: id_servicicio_id_servicio_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.id_servicicio_id_servicio_seq', 1, false);


--
-- Name: lineaservicio_id_linea_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lineaservicio_id_linea_detalle_seq', 43, false);


--
-- Name: operador_id_operador_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.operador_id_operador_seq', 6, true);


--
-- Name: ordenpedido_consecutivo_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordenpedido_consecutivo_seq', 76, true);


--
-- Name: ordenpedido_id_orden_pedido_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordenpedido_id_orden_pedido_seq', 93, true);


--
-- Name: ordenproduccion_id_orden_produccion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordenproduccion_id_orden_produccion_seq', 5, true);


--
-- Name: plan_id_plan_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plan_id_plan_seq', 5, true);


--
-- Name: producto_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.producto_id_producto_seq', 102, true);


--
-- Name: proyecto_id_proyecto_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proyecto_id_proyecto_seq', 1522, true);


--
-- Name: remision_id_remision_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.remision_id_remision_seq', 4, true);


--
-- Name: tipo_despacho_id_tipo_despacho_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipo_despacho_id_tipo_despacho_seq', 3, true);


--
-- Name: tipopago_id_tipo_pago_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipopago_id_tipo_pago_seq', 11, true);


--
-- Name: tiposervicio_id_tipo_servicio_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tiposervicio_id_tipo_servicio_seq', 6, true);


--
-- Name: transportadora_id_transportadora_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transportadora_id_transportadora_seq', 11, true);


--
-- Name: accesorio accesorio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accesorio
    ADD CONSTRAINT accesorio_pkey PRIMARY KEY (id_accesorio);


--
-- Name: apn apn_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apn
    ADD CONSTRAINT apn_pkey PRIMARY KEY (id_apn);


--
-- Name: clase_orden claseorden_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clase_orden
    ADD CONSTRAINT claseorden_pkey PRIMARY KEY (id_clase_orden);


--
-- Name: clase_orden claseorden_tipo_orden_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clase_orden
    ADD CONSTRAINT claseorden_tipo_orden_key UNIQUE (tipo_orden);


--
-- Name: cliente cliente_nit_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_nit_key UNIQUE (nit);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id_cliente);


--
-- Name: contacto_despacho contacto_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacto_despacho
    ADD CONSTRAINT contacto_despacho_pkey PRIMARY KEY (id_contacto);


--
-- Name: despacho_orden despacho_orden_id_orden_pedido_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_orden
    ADD CONSTRAINT despacho_orden_id_orden_pedido_key UNIQUE (id_orden_pedido);


--
-- Name: despacho_orden despacho_orden_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_orden
    ADD CONSTRAINT despacho_orden_pkey PRIMARY KEY (id_despacho_orden);


--
-- Name: detalle_orden detalle_orden_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden
    ADD CONSTRAINT detalle_orden_pkey PRIMARY KEY (id_orden_detalle);


--
-- Name: direccion_despacho direccion_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direccion_despacho
    ADD CONSTRAINT direccion_despacho_pkey PRIMARY KEY (id_direccion);


--
-- Name: equipo equipo_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_key UNIQUE (codigo);


--
-- Name: equipo equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_pkey PRIMARY KEY (id_equipo);


--
-- Name: factura factura_orden_tipo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_orden_tipo_unique UNIQUE (id_orden_pedido, tipo_factura);


--
-- Name: factura factura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_pkey PRIMARY KEY (id_factura);


--
-- Name: historial_factura historial_factura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_factura
    ADD CONSTRAINT historial_factura_pkey PRIMARY KEY (id_historial);


--
-- Name: historial_orden historial_orden_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_orden
    ADD CONSTRAINT historial_orden_pkey PRIMARY KEY (id_historial);


--
-- Name: servicio id_servicicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT id_servicicio_pkey PRIMARY KEY (id_servicio);


--
-- Name: linea_servicio lineaservicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.linea_servicio
    ADD CONSTRAINT lineaservicio_pkey PRIMARY KEY (id_linea_detalle);


--
-- Name: operador operador_nombre_operador_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operador
    ADD CONSTRAINT operador_nombre_operador_key UNIQUE (nombre_operador);


--
-- Name: operador operador_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operador
    ADD CONSTRAINT operador_pkey PRIMARY KEY (id_operador);


--
-- Name: orden_counter_month orden_counter_month_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_counter_month
    ADD CONSTRAINT orden_counter_month_pkey PRIMARY KEY (yy, mm);


--
-- Name: orden_pedido ordenpedido_consecutivo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT ordenpedido_consecutivo_key UNIQUE (consecutivo);


--
-- Name: orden_pedido ordenpedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT ordenpedido_pkey PRIMARY KEY (id_orden_pedido);


--
-- Name: orden_produccion ordenproduccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_produccion
    ADD CONSTRAINT ordenproduccion_pkey PRIMARY KEY (id_orden_produccion);


--
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (perm_code);


--
-- Name: plan plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan
    ADD CONSTRAINT plan_pkey PRIMARY KEY (id_plan);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id_producto);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: proyecto proyecto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyecto
    ADD CONSTRAINT proyecto_pkey PRIMARY KEY (id_proyecto);


--
-- Name: rbac_event rbac_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_event
    ADD CONSTRAINT rbac_event_pkey PRIMARY KEY (id);


--
-- Name: remision remision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remision
    ADD CONSTRAINT remision_pkey PRIMARY KEY (id_remision);


--
-- Name: responsable_orden responsableorden_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsable_orden
    ADD CONSTRAINT responsableorden_pkey PRIMARY KEY (id_orden_pedido, user_id, role);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role, perm_code);


--
-- Name: tipo_despacho tipo_despacho_nombre_tipo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_despacho
    ADD CONSTRAINT tipo_despacho_nombre_tipo_key UNIQUE (nombre_tipo);


--
-- Name: tipo_despacho tipo_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_despacho
    ADD CONSTRAINT tipo_despacho_pkey PRIMARY KEY (id_tipo_despacho);


--
-- Name: tipo_pago tipopago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_pago
    ADD CONSTRAINT tipopago_pkey PRIMARY KEY (id_tipo_pago);


--
-- Name: tipo_servicio tiposervicio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_servicio
    ADD CONSTRAINT tiposervicio_pkey PRIMARY KEY (id_tipo_servicio);


--
-- Name: transportadora transportadora_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transportadora
    ADD CONSTRAINT transportadora_pkey PRIMARY KEY (id_transportadora);


--
-- Name: idx_cliente_nit_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliente_nit_trgm ON public.cliente USING gin (nit public.gin_trgm_ops);


--
-- Name: idx_cliente_nombre_asc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliente_nombre_asc ON public.cliente USING btree (nombre_cliente);


--
-- Name: idx_cliente_nombre_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliente_nombre_trgm ON public.cliente USING gin (nombre_cliente public.gin_trgm_ops);


--
-- Name: idx_detalle_orden_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detalle_orden_orden ON public.detalle_orden USING btree (id_orden_pedido);


--
-- Name: idx_equipo_codigo_asc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_equipo_codigo_asc ON public.equipo USING btree (codigo);


--
-- Name: idx_equipo_codigo_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_equipo_codigo_trgm ON public.equipo USING gin (codigo public.gin_trgm_ops);


--
-- Name: idx_equipo_nombre_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_equipo_nombre_trgm ON public.equipo USING gin (nombre_equipo public.gin_trgm_ops);


--
-- Name: idx_factura_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_factura_orden ON public.factura USING btree (id_orden_pedido);


--
-- Name: idx_historial_factura_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historial_factura_id ON public.historial_factura USING btree (id_factura);


--
-- Name: idx_historial_orden_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historial_orden_orden ON public.historial_orden USING btree (id_orden_pedido);


--
-- Name: idx_orden_pedido_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orden_pedido_cliente ON public.orden_pedido USING btree (id_cliente);


--
-- Name: idx_orden_pedido_fase_estatus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orden_pedido_fase_estatus ON public.orden_pedido USING btree (fase, estatus);


--
-- Name: idx_ordenpedido_estatus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordenpedido_estatus ON public.orden_pedido USING btree (estatus);


--
-- Name: idx_ordenpedido_fase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ordenpedido_fase ON public.orden_pedido USING btree (fase);


--
-- Name: idx_responsable_orden_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responsable_orden_user ON public.responsable_orden USING btree (user_id);


--
-- Name: uq_ordenpedido_consecutivo_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_ordenpedido_consecutivo_code ON public.orden_pedido USING btree (consecutivo_code);


--
-- Name: orden_pedido ordenpedido_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ordenpedido_touch BEFORE UPDATE ON public.orden_pedido FOR EACH ROW EXECUTE FUNCTION public.touch_fecha_modificacion();


--
-- Name: orden_pedido trg_fecha_salida_produccion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fecha_salida_produccion AFTER UPDATE ON public.orden_pedido FOR EACH ROW EXECUTE FUNCTION public.set_fecha_salida_produccion();


--
-- Name: orden_pedido trg_ordenpedido_before_ins; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ordenpedido_before_ins BEFORE INSERT ON public.orden_pedido FOR EACH ROW EXECUTE FUNCTION public.ordenpedido_before_insert_set_monthly();


--
-- Name: orden_pedido trg_set_consecutivo_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_consecutivo_code BEFORE INSERT OR UPDATE OF consecutivo, fecha_creacion ON public.orden_pedido FOR EACH ROW EXECUTE FUNCTION public.set_consecutivo_code();


--
-- Name: apn apn_id_operador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apn
    ADD CONSTRAINT apn_id_operador_fkey FOREIGN KEY (id_operador) REFERENCES public.operador(id_operador);


--
-- Name: contacto_despacho contacto_despacho_id_direccion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacto_despacho
    ADD CONSTRAINT contacto_despacho_id_direccion_fkey FOREIGN KEY (id_direccion) REFERENCES public.direccion_despacho(id_direccion);


--
-- Name: despacho_orden despacho_orden_id_contacto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_orden
    ADD CONSTRAINT despacho_orden_id_contacto_fkey FOREIGN KEY (id_contacto) REFERENCES public.contacto_despacho(id_contacto);


--
-- Name: despacho_orden despacho_orden_id_direccion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_orden
    ADD CONSTRAINT despacho_orden_id_direccion_fkey FOREIGN KEY (id_direccion) REFERENCES public.direccion_despacho(id_direccion);


--
-- Name: despacho_orden despacho_orden_id_orden_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_orden
    ADD CONSTRAINT despacho_orden_id_orden_pedido_fkey FOREIGN KEY (id_orden_pedido) REFERENCES public.orden_pedido(id_orden_pedido);


--
-- Name: despacho_orden despacho_orden_id_tipo_despacho_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_orden
    ADD CONSTRAINT despacho_orden_id_tipo_despacho_fkey FOREIGN KEY (id_tipo_despacho) REFERENCES public.tipo_despacho(id_tipo_despacho);


--
-- Name: despacho_orden despacho_orden_id_transportadora_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despacho_orden
    ADD CONSTRAINT despacho_orden_id_transportadora_fkey FOREIGN KEY (id_transportadora) REFERENCES public.transportadora(id_transportadora);


--
-- Name: detalle_orden detalle_orden_id_accesorio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden
    ADD CONSTRAINT detalle_orden_id_accesorio_fkey FOREIGN KEY (id_accesorio) REFERENCES public.accesorio(id_accesorio);


--
-- Name: detalle_orden detalle_orden_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden
    ADD CONSTRAINT detalle_orden_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo);


--
-- Name: detalle_orden detalle_orden_id_linea_detalle_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden
    ADD CONSTRAINT detalle_orden_id_linea_detalle_fkey FOREIGN KEY (id_linea_detalle) REFERENCES public.linea_servicio(id_linea_detalle);


--
-- Name: detalle_orden detalle_orden_id_orden_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden
    ADD CONSTRAINT detalle_orden_id_orden_pedido_fkey FOREIGN KEY (id_orden_pedido) REFERENCES public.orden_pedido(id_orden_pedido);


--
-- Name: detalle_orden detalle_orden_id_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_orden
    ADD CONSTRAINT detalle_orden_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES public.servicio(id_servicio);


--
-- Name: direccion_despacho direccion_despacho_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.direccion_despacho
    ADD CONSTRAINT direccion_despacho_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente);


--
-- Name: factura factura_id_orden_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_id_orden_pedido_fkey FOREIGN KEY (id_orden_pedido) REFERENCES public.orden_pedido(id_orden_pedido) ON DELETE CASCADE;


--
-- Name: factura factura_id_tipo_pago_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_id_tipo_pago_fkey FOREIGN KEY (id_tipo_pago) REFERENCES public.tipo_pago(id_tipo_pago);


--
-- Name: historial_factura historial_factura_id_factura_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_factura
    ADD CONSTRAINT historial_factura_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES public.factura(id_factura);


--
-- Name: historial_factura historial_factura_usuario_cambio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_factura
    ADD CONSTRAINT historial_factura_usuario_cambio_fkey FOREIGN KEY (usuario_cambio) REFERENCES auth.users(id);


--
-- Name: historial_orden historial_orden_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_orden
    ADD CONSTRAINT historial_orden_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);


--
-- Name: historial_orden historial_orden_id_orden_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_orden
    ADD CONSTRAINT historial_orden_id_orden_pedido_fkey FOREIGN KEY (id_orden_pedido) REFERENCES public.orden_pedido(id_orden_pedido);


--
-- Name: linea_servicio lineaservicio_id_apn_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.linea_servicio
    ADD CONSTRAINT lineaservicio_id_apn_fkey FOREIGN KEY (id_apn) REFERENCES public.apn(id_apn);


--
-- Name: linea_servicio lineaservicio_id_operador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.linea_servicio
    ADD CONSTRAINT lineaservicio_id_operador_fkey FOREIGN KEY (id_operador) REFERENCES public.operador(id_operador);


--
-- Name: linea_servicio lineaservicio_id_plan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.linea_servicio
    ADD CONSTRAINT lineaservicio_id_plan_fkey FOREIGN KEY (id_plan) REFERENCES public.plan(id_plan);


--
-- Name: orden_pedido orden_pedido_id_ingeniero_asignado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT orden_pedido_id_ingeniero_asignado_fkey FOREIGN KEY (id_ingeniero_asignado) REFERENCES public.profiles(user_id);


--
-- Name: orden_pedido orden_pedido_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT orden_pedido_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: orden_produccion orden_produccion_recibido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_produccion
    ADD CONSTRAINT orden_produccion_recibido_por_fkey FOREIGN KEY (recibido_por) REFERENCES auth.users(id);


--
-- Name: orden_pedido ordenpedido_id_clase_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT ordenpedido_id_clase_orden_fkey FOREIGN KEY (id_clase_orden) REFERENCES public.clase_orden(id_clase_orden);


--
-- Name: orden_pedido ordenpedido_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT ordenpedido_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente);


--
-- Name: orden_pedido ordenpedido_id_proyecto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT ordenpedido_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES public.proyecto(id_proyecto);


--
-- Name: orden_pedido ordenpedido_id_tipo_pago_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT ordenpedido_id_tipo_pago_fkey FOREIGN KEY (id_tipo_pago) REFERENCES public.tipo_pago(id_tipo_pago);


--
-- Name: orden_pedido ordenpedido_id_tipo_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pedido
    ADD CONSTRAINT ordenpedido_id_tipo_servicio_fkey FOREIGN KEY (id_tipo_servicio) REFERENCES public.tipo_servicio(id_tipo_servicio);


--
-- Name: orden_produccion ordenproduccion_id_orden_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_produccion
    ADD CONSTRAINT ordenproduccion_id_orden_pedido_fkey FOREIGN KEY (id_orden_pedido) REFERENCES public.orden_pedido(id_orden_pedido) ON DELETE CASCADE;


--
-- Name: plan plan_id_operador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan
    ADD CONSTRAINT plan_id_operador_fkey FOREIGN KEY (id_operador) REFERENCES public.operador(id_operador);


--
-- Name: producto producto_id_accesorio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_accesorio_fkey FOREIGN KEY (id_accesorio) REFERENCES public.accesorio(id_accesorio);


--
-- Name: producto producto_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo);


--
-- Name: producto producto_id_linea_detalle_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_linea_detalle_fkey FOREIGN KEY (id_linea_detalle) REFERENCES public.linea_servicio(id_linea_detalle);


--
-- Name: producto producto_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.equipo(id_equipo);


--
-- Name: producto producto_id_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES public.servicio(id_servicio);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: proyecto proyecto_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyecto
    ADD CONSTRAINT proyecto_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente);


--
-- Name: rbac_event rbac_event_actor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rbac_event
    ADD CONSTRAINT rbac_event_actor_fkey FOREIGN KEY (actor) REFERENCES auth.users(id);


--
-- Name: remision remision_id_orden_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remision
    ADD CONSTRAINT remision_id_orden_pedido_fkey FOREIGN KEY (id_orden_pedido) REFERENCES public.orden_pedido(id_orden_pedido) ON DELETE CASCADE;


--
-- Name: responsable_orden responsableorden_id_orden_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsable_orden
    ADD CONSTRAINT responsableorden_id_orden_pedido_fkey FOREIGN KEY (id_orden_pedido) REFERENCES public.orden_pedido(id_orden_pedido) ON DELETE CASCADE;


--
-- Name: responsable_orden responsableorden_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsable_orden
    ADD CONSTRAINT responsableorden_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_perm_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_perm_code_fkey FOREIGN KEY (perm_code) REFERENCES public.permission(perm_code) ON DELETE CASCADE;


--
-- Name: apn Apn: manage with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apn: manage with permission" ON public.apn USING ((public.is_admin() OR public.has_permission('catalogo.apn.manage'::text))) WITH CHECK ((public.is_admin() OR public.has_permission('catalogo.apn.manage'::text)));


--
-- Name: apn Apn: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apn: read all authenticated" ON public.apn FOR SELECT TO authenticated USING (true);


--
-- Name: clase_orden ClaseOrden: manage with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ClaseOrden: manage with permission" ON public.clase_orden USING ((public.is_admin() OR public.has_permission('catalogo.claseorden.manage'::text))) WITH CHECK ((public.is_admin() OR public.has_permission('catalogo.claseorden.manage'::text)));


--
-- Name: clase_orden ClaseOrden: read with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ClaseOrden: read with permission" ON public.clase_orden FOR SELECT USING ((public.is_admin() OR public.has_permission('catalogo.claseorden.read'::text) OR public.has_permission('catalogo.claseorden.manage'::text)));


--
-- Name: clase_orden Clase_Orden: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clase_Orden: read all authenticated" ON public.clase_orden FOR SELECT TO authenticated USING (true);


--
-- Name: cliente Cliente: manage with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cliente: manage with permission" ON public.cliente USING ((public.is_admin() OR public.has_permission('catalogo.cliente.manage'::text))) WITH CHECK ((public.is_admin() OR public.has_permission('catalogo.cliente.manage'::text)));


--
-- Name: cliente Cliente: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cliente: read all authenticated" ON public.cliente FOR SELECT TO authenticated USING (true);


--
-- Name: detalle_orden Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.detalle_orden FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: despacho_orden Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.despacho_orden FOR SELECT TO authenticated USING (true);


--
-- Name: detalle_orden Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.detalle_orden FOR SELECT TO authenticated USING (true);


--
-- Name: equipo Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.equipo FOR SELECT USING (true);


--
-- Name: linea_servicio Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.linea_servicio FOR SELECT TO authenticated USING (true);


--
-- Name: remision Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.remision FOR SELECT TO authenticated USING (true);


--
-- Name: tipo_servicio Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.tipo_servicio FOR SELECT USING (true);


--
-- Name: factura Factura: select si OP visible; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Factura: select si OP visible" ON public.factura FOR SELECT TO authenticated USING (true);


--
-- Name: factura Factura: write facturacion/admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Factura: write facturacion/admin" ON public.factura TO authenticated USING ((public.has_role('facturacion'::public.app_role) OR public.is_admin())) WITH CHECK ((public.has_role('facturacion'::public.app_role) OR public.is_admin()));


--
-- Name: orden_pedido OP: insert comercial/admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "OP: insert comercial/admin" ON public.orden_pedido FOR INSERT TO authenticated WITH CHECK ((public.is_admin() OR public.has_role('comercial'::public.app_role)));


--
-- Name: orden_pedido OP: select by role/fase/owner/admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "OP: select by role/fase/owner/admin" ON public.orden_pedido FOR SELECT TO authenticated USING ((public.is_admin() OR (created_by = auth.uid()) OR public.has_role('comercial'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.responsable_orden ro
  WHERE ((ro.id_orden_pedido = orden_pedido.id_orden_pedido) AND (ro.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND ((p.role)::text = (orden_pedido.fase)::text) AND (p.role <> ALL (ARRAY['produccion'::public.app_role, 'ingenieria'::public.app_role])))))));


--
-- Name: orden_pedido OP: update by fase; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "OP: update by fase" ON public.orden_pedido FOR UPDATE TO authenticated USING ((public.is_admin() OR ((estatus <> ALL (ARRAY['cerrada'::public.estatus_orden_enum, 'anulada'::public.estatus_orden_enum])) AND ((public.has_role('comercial'::public.app_role) AND (fase = 'comercial'::public.fase_orden_enum) AND (created_by = auth.uid())) OR (public.has_role('inventarios'::public.app_role) AND (fase = 'inventarios'::public.fase_orden_enum)) OR (public.has_role('produccion'::public.app_role) AND (fase = 'produccion'::public.fase_orden_enum)) OR (public.has_role('logistica'::public.app_role) AND (fase = 'logistica'::public.fase_orden_enum)) OR (public.has_role('facturacion'::public.app_role) AND (fase = 'facturacion'::public.fase_orden_enum)) OR (public.has_role('financiera'::public.app_role) AND (fase = 'financiera'::public.fase_orden_enum)))))) WITH CHECK (true);


--
-- Name: orden_produccion OProd: select si OP visible; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "OProd: select si OP visible" ON public.orden_produccion FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.orden_pedido op
  WHERE ((op.id_orden_pedido = orden_produccion.id_orden_pedido) AND (public.is_admin() OR (op.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.responsable_orden ro
          WHERE ((ro.id_orden_pedido = op.id_orden_pedido) AND (ro.user_id = auth.uid())))))))));


--
-- Name: orden_produccion OProd: write produccion/admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "OProd: write produccion/admin" ON public.orden_produccion TO authenticated USING ((public.has_role('produccion'::public.app_role) OR public.is_admin())) WITH CHECK ((public.has_role('produccion'::public.app_role) OR public.is_admin()));


--
-- Name: operador Operador: manage with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Operador: manage with permission" ON public.operador USING ((public.is_admin() OR public.has_permission('catalogo.operador.manage'::text))) WITH CHECK ((public.is_admin() OR public.has_permission('catalogo.operador.manage'::text)));


--
-- Name: operador Operador: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Operador: read all authenticated" ON public.operador FOR SELECT TO authenticated USING (true);


--
-- Name: permission Permission: admin write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permission: admin write" ON public.permission USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: permission Permission: read all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permission: read all" ON public.permission FOR SELECT USING (true);


--
-- Name: plan Plan: manage with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Plan: manage with permission" ON public.plan USING ((public.is_admin() OR public.has_permission('catalogo.plan.manage'::text))) WITH CHECK ((public.is_admin() OR public.has_permission('catalogo.plan.manage'::text)));


--
-- Name: plan Plan: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Plan: read all authenticated" ON public.plan FOR SELECT TO authenticated USING (true);


--
-- Name: producto Producto: insert comercial or admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Producto: insert comercial or admin" ON public.producto FOR INSERT TO authenticated WITH CHECK ((public.is_admin() OR public.has_role('comercial'::public.app_role)));


--
-- Name: producto Producto: select owner or admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Producto: select owner or admin" ON public.producto FOR SELECT TO authenticated USING ((public.is_admin() OR (created_by = auth.uid())));


--
-- Name: producto Producto: update owner or admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Producto: update owner or admin" ON public.producto FOR UPDATE TO authenticated USING ((public.is_admin() OR (created_by = auth.uid()))) WITH CHECK ((public.is_admin() OR (created_by = auth.uid())));


--
-- Name: proyecto Proyecto: manage with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Proyecto: manage with permission" ON public.proyecto USING ((public.is_admin() OR public.has_permission('catalogo.proyecto.manage'::text))) WITH CHECK ((public.is_admin() OR public.has_permission('catalogo.proyecto.manage'::text)));


--
-- Name: proyecto Proyecto: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Proyecto: read all authenticated" ON public.proyecto FOR SELECT TO authenticated USING (true);


--
-- Name: rbac_event RbacEvent: admin read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "RbacEvent: admin read" ON public.rbac_event FOR SELECT USING (public.is_admin());


--
-- Name: rbac_event RbacEvent: admin write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "RbacEvent: admin write" ON public.rbac_event FOR INSERT WITH CHECK (public.is_admin());


--
-- Name: remision Remision: select si OP visible; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Remision: select si OP visible" ON public.remision FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.orden_pedido op
  WHERE ((op.id_orden_pedido = remision.id_orden_pedido) AND (public.is_admin() OR (op.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.responsable_orden ro
          WHERE ((ro.id_orden_pedido = op.id_orden_pedido) AND (ro.user_id = auth.uid())))))))));


--
-- Name: remision Remision: write logistica/admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Remision: write logistica/admin" ON public.remision TO authenticated USING ((public.has_role('logistica'::public.app_role) OR public.is_admin())) WITH CHECK ((public.has_role('logistica'::public.app_role) OR public.is_admin()));


--
-- Name: role_permissions RolePermissions: admin write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "RolePermissions: admin write" ON public.role_permissions USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: role_permissions RolePermissions: read all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "RolePermissions: read all" ON public.role_permissions FOR SELECT USING (true);


--
-- Name: tipo_pago TipoPago: manage with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "TipoPago: manage with permission" ON public.tipo_pago USING ((public.is_admin() OR public.has_permission('catalogo.tipopago.manage'::text))) WITH CHECK ((public.is_admin() OR public.has_permission('catalogo.tipopago.manage'::text)));


--
-- Name: tipo_pago TipoPago: read with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "TipoPago: read with permission" ON public.tipo_pago FOR SELECT USING ((public.is_admin() OR public.has_permission('catalogo.tipopago.read'::text) OR public.has_permission('catalogo.tipopago.manage'::text)));


--
-- Name: tipo_pago Tipo_Pago: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tipo_Pago: read all authenticated" ON public.tipo_pago FOR SELECT TO authenticated USING (true);


--
-- Name: transportadora Transportadora: manage with permission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Transportadora: manage with permission" ON public.transportadora USING ((public.is_admin() OR public.has_permission('catalogo.transportadora.manage'::text))) WITH CHECK ((public.is_admin() OR public.has_permission('catalogo.transportadora.manage'::text)));


--
-- Name: transportadora Transportadora: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Transportadora: read all authenticated" ON public.transportadora FOR SELECT TO authenticated USING (true);


--
-- Name: historial_factura Usuarios autenticados pueden insertar historial; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios autenticados pueden insertar historial" ON public.historial_factura FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: historial_factura Usuarios autenticados pueden ver historial; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios autenticados pueden ver historial" ON public.historial_factura FOR SELECT TO authenticated USING (true);


--
-- Name: accesorio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accesorio ENABLE ROW LEVEL SECURITY;

--
-- Name: apn; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apn ENABLE ROW LEVEL SECURITY;

--
-- Name: clase_orden; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clase_orden ENABLE ROW LEVEL SECURITY;

--
-- Name: cliente; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;

--
-- Name: detalle_orden; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.detalle_orden ENABLE ROW LEVEL SECURITY;

--
-- Name: detalle_orden detalle_orden_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY detalle_orden_delete_policy ON public.detalle_orden FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.app_role, 'comercial'::public.app_role]))))) AND (EXISTS ( SELECT 1
   FROM public.orden_pedido
  WHERE ((orden_pedido.id_orden_pedido = detalle_orden.id_orden_pedido) AND (orden_pedido.estatus = 'abierta'::public.estatus_orden_enum))))));


--
-- Name: detalle_orden detalle_orden_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY detalle_orden_update_policy ON public.detalle_orden FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.app_role, 'comercial'::public.app_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.app_role, 'comercial'::public.app_role]))))));


--
-- Name: equipo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.equipo ENABLE ROW LEVEL SECURITY;

--
-- Name: factura; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.factura ENABLE ROW LEVEL SECURITY;

--
-- Name: historial_factura; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historial_factura ENABLE ROW LEVEL SECURITY;

--
-- Name: historial_orden; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historial_orden ENABLE ROW LEVEL SECURITY;

--
-- Name: historial_orden historial_orden: insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "historial_orden: insert" ON public.historial_orden FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.role = 'admin'::public.app_role)))));


--
-- Name: historial_orden historial_orden: select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "historial_orden: select" ON public.historial_orden FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.role = 'admin'::public.app_role)))) OR (EXISTS ( SELECT 1
   FROM public.orden_pedido op
  WHERE ((op.id_orden_pedido = historial_orden.id_orden_pedido) AND ((op.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.responsable_orden ro
          WHERE ((ro.id_orden_pedido = op.id_orden_pedido) AND (ro.user_id = auth.uid()))))))))));


--
-- Name: linea_servicio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.linea_servicio ENABLE ROW LEVEL SECURITY;

--
-- Name: linea_servicio lineaservicio_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lineaservicio_delete_policy ON public.linea_servicio FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::public.app_role)))));


--
-- Name: linea_servicio lineaservicio_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lineaservicio_insert_policy ON public.linea_servicio FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['comercial'::public.app_role, 'admin'::public.app_role, 'ingenieria'::public.app_role, 'inventarios'::public.app_role]))))));


--
-- Name: linea_servicio lineaservicio_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lineaservicio_select_policy ON public.linea_servicio FOR SELECT TO authenticated USING (true);


--
-- Name: linea_servicio lineaservicio_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lineaservicio_update_policy ON public.linea_servicio FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['comercial'::public.app_role, 'admin'::public.app_role, 'ingenieria'::public.app_role, 'inventarios'::public.app_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['comercial'::public.app_role, 'admin'::public.app_role, 'ingenieria'::public.app_role, 'inventarios'::public.app_role]))))));


--
-- Name: operador; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.operador ENABLE ROW LEVEL SECURITY;

--
-- Name: orden_pedido; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orden_pedido ENABLE ROW LEVEL SECURITY;

--
-- Name: orden_produccion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orden_produccion ENABLE ROW LEVEL SECURITY;

--
-- Name: permission; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permission ENABLE ROW LEVEL SECURITY;

--
-- Name: plan; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plan ENABLE ROW LEVEL SECURITY;

--
-- Name: producto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.producto ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles: insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "profiles: insert" ON public.profiles FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles profiles: select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "profiles: select" ON public.profiles FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: profiles profiles: update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "profiles: update" ON public.profiles FOR UPDATE USING (((user_id = auth.uid()) OR public.is_admin()));


--
-- Name: proyecto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proyecto ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_event; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rbac_event ENABLE ROW LEVEL SECURITY;

--
-- Name: remision; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.remision ENABLE ROW LEVEL SECURITY;

--
-- Name: responsable_orden; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.responsable_orden ENABLE ROW LEVEL SECURITY;

--
-- Name: responsable_orden responsable_orden: delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "responsable_orden: delete" ON public.responsable_orden FOR DELETE USING (public.is_admin());


--
-- Name: responsable_orden responsable_orden: insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "responsable_orden: insert" ON public.responsable_orden FOR INSERT WITH CHECK ((public.is_admin() OR (user_id = auth.uid())));


--
-- Name: responsable_orden responsable_orden: select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "responsable_orden: select" ON public.responsable_orden FOR SELECT USING (((user_id = auth.uid()) OR public.is_admin()));


--
-- Name: responsable_orden responsable_orden: update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "responsable_orden: update" ON public.responsable_orden FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.role = 'admin'::public.app_role)))));


--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: servicio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.servicio ENABLE ROW LEVEL SECURITY;

--
-- Name: tipo_despacho tipo_despacho: read all authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "tipo_despacho: read all authenticated" ON public.tipo_despacho FOR SELECT TO authenticated USING (true);


--
-- Name: tipo_pago; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tipo_pago ENABLE ROW LEVEL SECURITY;

--
-- Name: tipo_servicio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tipo_servicio ENABLE ROW LEVEL SECURITY;

--
-- Name: tipo_servicio tipo_servicio: admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "tipo_servicio: admin" ON public.tipo_servicio USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.role = 'admin'::public.app_role)))));


--
-- Name: tipo_servicio tipo_servicio: select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "tipo_servicio: select" ON public.tipo_servicio FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: transportadora; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transportadora ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict olOVVHZmP4G5Ltuf1pnVzKRHQCkgP2Ktk6p4QjscSnaDI4arXcE0W1MLctOIdOc

