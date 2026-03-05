# Supabase Self-Hosted — Estado y contexto

## Servidor Ubuntu

- IP: `10.10.1.81`
- Usuario: `bsk-gns3`
- Studio accesible en: `http://10.10.1.81:4352`
- Docker compose working dir: `/home/bsk-gns3/supabase/docker`
- Repo de la app React: `/home/bsk-gns3/vantage`

## Estructura de carpetas en el servidor

```
~/supabase/docker/          → docker-compose + .env de Supabase
~/supabase/docker/volumes/  → volúmenes persistentes
~/supabase/docker/volumes/functions/  → edge functions (montado en contenedor)
~/vantage/                  → repo de la app React (ordenes-pedido)
~/vantage/supabase/functions/<nombre>/index.ts  → código de cada función
```

## Credenciales self-hosted

- `ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcyNjU0Mjc0LCJleHAiOjE5MzAzMzQyNzR9.A3OSEsVye1TNBbaOQfZL2W2aZyYszNYGFIB_jCyAfso`
- `SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzI2NTQyNzQsImV4cCI6MTkzMDMzNDI3NH0.kPR4oo3Tb7fvCrrTeHUf5EMiKKWmlL4deeBL8D5McTg`
- `JWT_SECRET`: `AHz1l6ZViDKT8hQXnxQj40uTBj1vgYwlhDilrE9v`
- `POSTGRES_PASSWORD`: `4d86f45754c7bc1b48464aa0e4dd1157`
- `KONG_HTTP_PORT`: `4352`

## Schema migrado

- 31 tablas, 15 funciones, 13 enums migrados desde `ldkjcvuahfyxgnbyitqm` cloud
- Comando usado: `docker exec -i supabase-db psql -U postgres -d postgres < ~/schema_export.sql`

## Edge Functions — Estado RESUELTO

### Contenedor
- Nombre del contenedor Docker: `supabase-edge-functions`
- Nombre del servicio en docker-compose: `functions`
- Volumen montado: `/home/bsk-gns3/supabase/docker/volumes/functions` → `/home/deno/functions`

### Enrutamiento
El `main/index.ts` ya tiene el router correcto — lee el primer segmento de la URL (`/functions/v1/<nombre>`)
y crea un `EdgeRuntime.userWorkers` apuntando a `/home/deno/functions/<nombre>`.
**No hay que modificar el main** — solo copiar la función al subdirectorio correcto.

### Flujo para desplegar una nueva edge function

```bash
# 1. Escribir el código en el repo local (en tu máquina Windows)
#    supabase/functions/<nombre>/index.ts

# 2. En el servidor Ubuntu: crear el directorio y copiar el archivo
mkdir -p ~/supabase/docker/volumes/functions/<nombre>
cp ~/vantage/supabase/functions/<nombre>/index.ts \
   ~/supabase/docker/volumes/functions/<nombre>/index.ts

# 3. Reiniciar el contenedor de functions
docker restart supabase-edge-functions

# 4. Probar
curl -s -X POST http://10.10.1.81:4352/functions/v1/<nombre> \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Variables de entorno para las funciones

Las variables deben declararse en DOS lugares:

1. **`~/supabase/docker/.env`** — valores reales
   ```
   SAPIENS_DB_HOST=10.10.12.5
   SAPIENS_DB_PORT=1433
   SAPIENS_DB_USER=SapiensReports
   SAPIENS_DB_PASSWORD=B1sm$$rkR3p0rts   ← el $ se escapa como $$ en archivos .env de Docker Compose
   SAPIENS_DB_NAME=Bismark_sql
   ```

2. **`~/supabase/docker/docker-compose.yml`** — sección `environment` del servicio `functions`
   ```yaml
   SAPIENS_DB_HOST: ${SAPIENS_DB_HOST}
   SAPIENS_DB_PORT: ${SAPIENS_DB_PORT}
   SAPIENS_DB_USER: ${SAPIENS_DB_USER}
   SAPIENS_DB_PASSWORD: ${SAPIENS_DB_PASSWORD}
   SAPIENS_DB_NAME: ${SAPIENS_DB_NAME}
   ```
   Después de modificar el docker-compose, recrear el contenedor:
   ```bash
   cd ~/supabase/docker && docker compose up -d --no-deps functions
   ```

### Import de npm:mssql en Deno

El import dinámico de `npm:mssql@10` no expone `connect` directamente en el objeto raíz.
Siempre usar:
```ts
const mssql = await import("npm:mssql@10");
const sql = mssql.default ?? mssql;
const pool = await sql.connect({ ... });
```

### Función sapiens-clientes — OPERATIVA

- Conecta a SQL Server `10.10.12.5:1433` → BD `Bismark_sql`
- Consulta clientes activos de tabla `cogenits`
- Hace upsert en tabla `cliente` de Supabase (conflicto por columna `nit`)
- Resultado verificado: 1887 clientes sincronizados correctamente

## Sapiens SQL Server

- Host: `10.10.12.5:1433`
- BD: `Bismark_sql`
- Usuario: `SapiensReports` (solo lectura)
- Variables definidas en `~/supabase/docker/.env` + declaradas en `docker-compose.yml` bajo `functions`

### Consulta de clientes
```sql
SELECT
  LTRIM(RTRIM(ncodigo)) as nit,
  LTRIM(RTRIM(nnombre)) as nombre_cliente
FROM cogenits
WHERE CLI = 1
  AND ncodigo IS NOT NULL
  AND LTRIM(RTRIM(ncodigo)) != ''
  AND nnombre IS NOT NULL
  AND LTRIM(RTRIM(nnombre)) != ''
ORDER BY ncodigo
```

## Supabase CLI en el servidor

- Instalada en `/usr/local/bin/supabase` versión 2.40.7
- No se puede usar `supabase functions deploy` porque requiere token formato `sbp_...` (solo cloud)
- Deploy debe hacerse copiando archivos al volumen directamente

## Comandos útiles en el servidor

```bash
# Ver estado de contenedores
cd ~/supabase/docker && docker compose ps

# Reiniciar functions
docker restart supabase-edge-functions

# Ver logs de functions
docker logs supabase-edge-functions --tail 50

# Listar servicios del docker-compose
cd ~/supabase/docker && docker compose ps --services

# Verificar usuario en auth
docker exec -i supabase-db psql -U postgres -d postgres -c \
  "SELECT email, confirmed_at FROM auth.users;"

# Confirmar usuario manualmente
docker exec -i supabase-db psql -U postgres -d postgres -c \
  "UPDATE auth.users SET confirmed_at = NOW(), email_confirmed_at = NOW() WHERE email = 'email@aqui.com';"

# Limpiar todos los datos (mantiene estructura)
docker exec -i supabase-db psql -U postgres -d postgres -c "
DO \$\$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END;
\$\$;
DELETE FROM auth.users;"
```
