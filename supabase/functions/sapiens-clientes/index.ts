// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { v4 as uuid } from "https://deno.land/std@0.224.0/uuid/mod.ts";
const WEBHOOK_URL = Deno.env.get("N8N_CLIENTES_SAPIENS");
const WEBHOOK_KEY = Deno.env.get("N8N_WEBHOOK_KEY");
// Basic CORS headers for browser calls via supabase.functions.invoke
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, Idempotency-Key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders,
    }
  });
}
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json(405, {
    error: "Method Not Allowed"
  });
  // (Opcional) lee flags como { force: true } si quieres
  let body = {};
  try {
    body = await req.json();
  } catch  {}
  // Idempotencia para evitar dobles clics
  const idem = req.headers.get("Idempotency-Key") ?? crypto.randomUUID();
  try {
    if (!WEBHOOK_URL) {
      return json(500, { error: "WEBHOOK_URL not configured" });
    }
    
    // Dispara el Webhook de n8n protegido por x-api-key
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "api-sapiens": WEBHOOK_KEY || "",
        "Idempotency-Key": idem
      },
    });
    // Propaga la respuesta tal cual
    const text = await res.text();
    try {
      return json(res.status, JSON.parse(text));
    } catch  {
      return new Response(text, {
        status: res.status
      });
    }
  } catch (e) {
    return json(502, {
      error: `Proxy error: ${e}`
    });
  }
});
