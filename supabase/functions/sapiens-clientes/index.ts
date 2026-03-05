// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json(405, { error: "Method Not Allowed" });

  const SAPIENS_HOST = Deno.env.get("SAPIENS_DB_HOST");
  const SAPIENS_PORT = parseInt(Deno.env.get("SAPIENS_DB_PORT") ?? "1433");
  const SAPIENS_USER = Deno.env.get("SAPIENS_DB_USER");
  const SAPIENS_PASSWORD = Deno.env.get("SAPIENS_DB_PASSWORD");
  const SAPIENS_DB = Deno.env.get("SAPIENS_DB_NAME");

  if (!SAPIENS_HOST || !SAPIENS_USER || !SAPIENS_PASSWORD || !SAPIENS_DB) {
    return json(500, { error: "Sapiens DB credentials not configured" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const mssql = await import("npm:mssql@10");

    const pool = await mssql.connect({
      server: SAPIENS_HOST,
      port: SAPIENS_PORT,
      user: SAPIENS_USER,
      password: SAPIENS_PASSWORD,
      database: SAPIENS_DB,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      connectionTimeout: 15000,
      requestTimeout: 30000,
    });

    const result = await pool.request().query(`
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
    `);

    await pool.close();

    const clientes = result.recordset as { nit: string; nombre_cliente: string }[];

    if (clientes.length === 0) {
      return json(200, { message: "No se encontraron clientes en Sapiens", upserted: 0 });
    }

    const { error: upsertError } = await supabase
      .from("cliente")
      .upsert(clientes, { onConflict: "nit" });

    if (upsertError) {
      return json(500, { error: `Supabase upsert error: ${upsertError.message}` });
    }

    return json(200, {
      message: "Clientes sincronizados correctamente",
      upserted: clientes.length,
    });
  } catch (e: any) {
    return json(502, { error: `Error: ${e?.message ?? e}` });
  }
});
