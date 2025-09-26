import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

export interface EquipoOption {
  id_equipo: number;
  codigo: string | null;
  nombre_equipo: string | null;
}

interface EquipoSelectorProps {
  value: EquipoOption | null;
  onChange: (val: EquipoOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function EquipoSelector({ value, onChange, placeholder = "Buscar equipo por código o nombre...", disabled }: EquipoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [items, setItems] = useState<EquipoOption[]>([]);

  // The input shows the selected equipo name (or code) via query state.

  // keep input query in sync when a value is selected/changed from outside
  useEffect(() => {
    if (value) {
      const name = value.nombre_equipo ?? "";
      const code = value.codigo ?? "";
      const lbl = name || code;
      setQuery(lbl || "");
    } else {
      setQuery("");
    }
  }, [value]);

  // Close on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!open) return;
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    let active = true;
    const fetchItems = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const term = query.trim();
        // producto table is empty in this env; use only equipo fields (codigo, nombre_equipo)
        let qb = supabase
          .from("equipo")
          .select(`id_equipo, codigo, nombre_equipo`, { count: "exact" })
          .order("codigo", { ascending: true, nullsFirst: false });

        if (term) {
          // Server-side search on codigo or nombre_equipo
          qb = qb.or(`codigo.ilike.%${term}%,nombre_equipo.ilike.%${term}%`);
        }

        const { data, error } = await qb;
        if (error) throw error;
        if (!active) return;

        const mapped: EquipoOption[] = (data ?? []).map((row: any) => ({
          id_equipo: row.id_equipo,
          codigo: row.codigo ?? null,
          nombre_equipo: row.nombre_equipo ?? null,
        }));
        setItems(mapped);
      } catch (e: any) {
        console.error("Error fetching equipos:", e);
        setErrorMsg(e?.message ?? "Error desconocido al cargar equipos");
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    const t = setTimeout(fetchItems, 250); // debounce
    return () => { active = false; clearTimeout(t); };
  }, [query, open]);

  return (
    <div className="w-full" ref={containerRef}>
      <div className="relative w-full">
        <Input
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
            <Command>
              <CommandList className="max-h-64 overflow-auto">
                {loading && (
                  <div className="p-3 text-sm text-muted-foreground">Buscando...</div>
                )}
                {errorMsg && !loading && (
                  <div className="p-3 text-sm text-red-600">{errorMsg}</div>
                )}
                <CommandEmpty>No se encontraron equipos</CommandEmpty>
                <CommandGroup heading="Equipos">
                  {items.slice(0, 10).map((opt) => (
                    <CommandItem
                      key={opt.id_equipo}
                      value={`${opt.codigo ?? ""} ${opt.nombre_equipo ?? ""}`}
                      onSelect={() => {
                        onChange(opt);
                        // reflect the chosen name (fallback to code) in the input
                        const name = opt.nombre_equipo ?? "";
                        const code = opt.codigo ?? "";
                        const lbl = name || code;
                        setQuery(lbl);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{opt.nombre_equipo ?? opt.codigo ?? "(sin nombre)"}</span>
                        {opt.codigo && (
                          <span className="text-xs text-muted-foreground">{opt.codigo}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                  {!loading && !errorMsg && items.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">No hay equipos para mostrar.</div>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
}
