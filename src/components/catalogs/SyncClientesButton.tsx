// src/components/SyncClientesButton.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = { label?: string; className?: string; onDone?: () => void };

export default function SyncClientesButton({ label = "Actualizar clientes", className, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const click = async () => {
    setLoading(true);
    setMsg(null);
    try {
        const idem = crypto.randomUUID();
        const { data, error } = await supabase.functions.invoke("sapiens-clientes", {
            headers: {
                "Idempotency-Key": idem,
            },
        });

        if (error) {
            throw new Error(error.message || "Error al invocar la función de Supabase.");
        }

        // --- Lógica para manejar la respuesta del backend (JSON o texto) ---
        const finalize = () => {
            setLoading(false);
            // Da un pequeño margen para que la UI/DB se estabilice, luego refresca
            if (onDone) {
                onDone();
            } else if (typeof window !== "undefined") {
                setTimeout(() => window.location.reload(), 1200);
            }
        };

        if (data && typeof data === "object") {
            // Usamos 'any' para evitar errores si la estructura no es exacta
            const syncData = data as any;
            const status: string | undefined = syncData?.status || syncData?.estado || syncData?.result;
            const details: any = syncData?.details || syncData?.detalles || {};
            const message: string | undefined = syncData?.message || syncData?.mensaje || syncData?.detail;

            if (status === "Sincronización Exitosa" || status === "success" || status === "ok") {
                const totalInserts = details?.inserts?.total_count ?? details?.inserted ?? details?.creados ?? 0;
                const totalUpdates = details?.updates?.total_count ?? details?.updated ?? details?.actualizados ?? 0;
                let syncMessage = `Sincronización completa. Se ${totalInserts} clientes nuevos.`;
                if (totalUpdates > 0) {
                    syncMessage = `Sincronización completa. Se ${totalInserts} clientes nuevos y se ${totalUpdates} clientes existentes.`;
                }
                setMsg(syncMessage);
                finalize();
            } else if (status === "no_changes" || status === "sin_cambios") {
                setMsg("Los datos ya están sincronizados. No hay cambios.");
                finalize();
            } else if (status === "processing" || status === "queued" || status === "started") {
                setMsg("Sincronización en curso... Esperando a que finalice el flujo.");
                // Fallback: intenta refrescar al cabo de unos segundos
                setTimeout(finalize, 4000);
            } else {
                // Estado desconocido pero no es error explícito.
                // No mostramos mensaje confuso; dejamos el spinner activo y hacemos un fallback refresh.
                setTimeout(finalize, 6000);
            }
        } else if (typeof data === "string") {
            // El backend pudo responder texto plano (por ejemplo, n8n con 200 "ok")
            const text = data.trim();
            // Evitamos mostrar mensajes genéricos; mantenemos el estado de carga
            // Si recibimos texto plano, podemos intentar finalizar suavemente.
            setTimeout(finalize, 3000);
        } else {
            // Forma inesperada: no mostramos mensaje de error para evitar confusión
            // Mantenemos el spinner y aplicamos un fallback para evitar quedarse colgado.
            setTimeout(finalize, 6000);
        }

    } catch (e: any) {
        setMsg(`Error: ${e.message ?? e}`);
        setLoading(false);
    } finally {
        // No desactivar loading aquí: lo haremos en finalize() o en el bloque catch
    }
};
  return (
    <div className={className}>
      <button
        onClick={click}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 bg-slate-900 text-white text-sm disabled:opacity-50 shadow-md hover:shadow-lg transition"
        title="Sincronizar clientes desde Sapiens (n8n)"
      >
        <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M4 4v4h.01L8 8a6 6 0 1 1-1.356 3.778l1.932-.518A4 4 0 1 0 10 6H8l.01-4H4z" />
        </svg>
        {loading ? "Sincronizando..." : label}
      </button>
      {msg && <p className="mt-1 text-xs text-slate-600">{msg}</p>}
    </div>
  );
}
