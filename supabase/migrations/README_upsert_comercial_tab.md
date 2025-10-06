# Migración: Función RPC `upsert_comercial_tab`

## Descripción
Esta migración crea una función PostgreSQL que maneja todas las operaciones de guardado del `ComercialTab` de forma **atómica** (transaccional). Si alguna operación falla, todas las operaciones previas se revierten automáticamente (rollback).

## ¿Qué problema resuelve?
Antes de esta migración, el componente `ComercialTab.tsx` realizaba múltiples operaciones de base de datos de forma secuencial:
1. Upsert de `despacho_orden`
2. Update de `ordenpedido`
3. Insert en `responsable_orden`
4. Upsert de equipos en `detalle_orden`
5. Upsert de servicios en `lineaservicio` y `detalle_orden`
6. Delete de equipos y servicios eliminados

Si cualquiera de estas operaciones fallaba a mitad de camino, las operaciones previas ya estaban guardadas, dejando los datos en un estado inconsistente.

## Solución
La función RPC `upsert_comercial_tab` ejecuta todas estas operaciones dentro de una **transacción PostgreSQL implícita**, garantizando:
- ✅ **Atomicidad**: O se guardan todos los cambios o ninguno
- ✅ **Consistencia**: Los datos siempre quedan en un estado válido
- ✅ **Reducción de latencia**: Una sola llamada al servidor en lugar de múltiples
- ✅ **Rollback automático**: Si algo falla, se deshacen todos los cambios

## Cómo ejecutar la migración en Supabase

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **"New query"**
4. Copia y pega el contenido completo del archivo `upsert_comercial_tab.sql`
5. Haz clic en **"Run"** o presiona `Ctrl + Enter`
6. Verifica que aparezca el mensaje: ✅ **"Success. No rows returned"**

### Opción 2: Desde Supabase CLI (si lo tienes instalado)

```bash
# Navega al directorio del proyecto
cd c:\Users\julianr\Desktop\ordenes-pedido

# Aplica la migración
supabase db push
```

## Verificación

Después de ejecutar la migración, verifica que la función se creó correctamente:

```sql
-- Ejecuta este query en SQL Editor
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'upsert_comercial_tab';
```

Deberías ver un resultado como:

| routine_name | routine_type |
|--------------|--------------|
| upsert_comercial_tab | FUNCTION |

## Parámetros de la función

La función recibe los siguientes parámetros:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `p_orden_id` | INT | ID de la orden a actualizar |
| `p_orden_data` | JSONB | Datos de la orden (id_cliente, id_proyecto, observaciones_orden, orden_compra) |
| `p_despacho_data` | JSONB | Datos de despacho (incluye has_values para saber si hay datos) |
| `p_responsable_user_id` | UUID | UUID del usuario responsable |
| `p_responsable_role` | TEXT | Rol del responsable (debe ser tipo `app_role`) |
| `p_equipos` | JSONB | Array de equipos [{id_orden_detalle?, id_equipo, cantidad, valor_unitario, plantilla}] |
| `p_servicios` | JSONB | Array de servicios [{id_orden_detalle?, id_linea_detalle?, id_operador, id_plan, id_apn, clase_cobro, permanencia, valor_mensual}] |
| `p_deleted_equipos` | INT[] | Array de IDs de detalle_orden a eliminar (equipos) |
| `p_deleted_servicios` | INT[] | Array de IDs de detalle_orden a eliminar (servicios) |

## Retorno

La función retorna un objeto JSONB con la siguiente estructura:

```json
{
  "success": true,
  "despacho_id": 123,
  "message": "Datos guardados correctamente"
}
```

## Manejo de errores

Si ocurre algún error durante la ejecución, la función:
1. Hace **rollback automático** de todos los cambios
2. Lanza una excepción con el mensaje de error
3. El cliente recibe el error y puede mostrarlo al usuario

## Cambios en el código TypeScript

El archivo `ComercialTab.tsx` ahora usa esta función RPC en lugar de múltiples llamadas:

```typescript
// Antes: Múltiples operaciones separadas
await supabase.from("despacho_orden").update(...);
await supabase.from("ordenpedido").update(...);
await supabase.from("responsable_orden").insert(...);
// ... más operaciones

// Ahora: Una sola llamada atómica
const { data: result, error: rpcError } = await supabase.rpc("upsert_comercial_tab", {
  p_orden_id: order.id_orden_pedido,
  p_orden_data: ordenData,
  p_despacho_data: despachoData,
  // ... más parámetros
});
```

## Notas importantes

- ⚠️ **SECURITY DEFINER**: La función se ejecuta con permisos del creador, no del usuario que la llama. Asegúrate de que las políticas RLS estén configuradas correctamente.
- 🔒 **Transaccionalidad**: No necesitas preocuparte por transacciones explícitas, PostgreSQL las maneja automáticamente en funciones PL/pgSQL.
- 📊 **Performance**: Una sola llamada RPC es más eficiente que múltiples llamadas HTTP al API de Supabase.

## Rollback (en caso de problemas)

Si necesitas revertir esta migración:

```sql
DROP FUNCTION IF EXISTS upsert_comercial_tab(INT, JSONB, JSONB, UUID, TEXT, JSONB, JSONB, INT[], INT[]);
```

⚠️ **Importante**: Si haces rollback de la función, el componente `ComercialTab.tsx` dejará de funcionar y necesitarás revertir también los cambios en el código TypeScript.
