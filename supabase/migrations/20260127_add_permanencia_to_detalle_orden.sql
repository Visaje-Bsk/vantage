-- Migración: Agregar campo permanencia a detalle_orden
-- Este campo es requerido cuando la clase de orden es "Renta"
-- para indicar los meses de permanencia del equipo

-- 1. Agregar columna permanencia a detalle_orden
ALTER TABLE detalle_orden
ADD COLUMN IF NOT EXISTS permanencia VARCHAR(50) DEFAULT NULL;

-- 2. Agregar comentario explicativo
COMMENT ON COLUMN detalle_orden.permanencia IS 'Meses de permanencia del equipo. Requerido cuando clase_orden es Renta.';

-- 3. Actualizar la función RPC upsert_comercial_tab para manejar permanencia en equipos
-- NOTA: Esta actualización modifica la sección de UPSERT EQUIPOS para incluir el campo permanencia
CREATE OR REPLACE FUNCTION upsert_comercial_tab(
  p_orden_id INT,
  p_orden_data JSONB,
  p_despacho_data JSONB,
  p_responsable_user_id UUID,
  p_responsable_role TEXT,
  p_equipos JSONB,
  p_servicios JSONB,
  p_deleted_equipos INT[],
  p_deleted_servicios INT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Documentación actualizada
COMMENT ON FUNCTION upsert_comercial_tab IS '
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
