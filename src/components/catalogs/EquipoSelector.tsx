/**
 * EquipoSelector
 *
 * Selector de equipos con búsqueda server-side y autocompletado.
 *
 * OPTIMIZADO v2:
 * - Cache de resultados iniciales para evitar llamadas repetidas
 * - Usa React Query para cache compartido entre instancias
 * - Navegación con teclado (ArrowUp/Down, Enter, Escape)
 * - Indicador de "más resultados disponibles"
 * - Loading spinner visible durante búsqueda
 * - Atributos ARIA para accesibilidad
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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

const MAX_VISIBLE_RESULTS = 15;
const SEARCH_DEBOUNCE_MS = 300;
const INITIAL_CACHE_SIZE = 50;

// Función para buscar equipos - usada por React Query
const fetchEquipos = async (searchTerm: string, selectedId?: number): Promise<{ items: EquipoOption[]; total: number }> => {
  const term = searchTerm.trim();

  let qb = supabase
    .from("equipo")
    .select("id_equipo, codigo, nombre_equipo", { count: "exact" })
    .order("codigo", { ascending: true, nullsFirst: false })
    .limit(INITIAL_CACHE_SIZE);

  if (term) {
    // Mejorar escaping para caracteres especiales
    const escapedTerm = term
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
      .replace(/,/g, "\\,")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\./g, "\\.");

    // Construir condición OR que siempre incluya el equipo seleccionado si existe
    let orCondition = `codigo.ilike.%${escapedTerm}%,nombre_equipo.ilike.%${escapedTerm}%`;
    if (selectedId) {
      orCondition += `,id_equipo.eq.${selectedId}`;
    }

    qb = qb.or(orCondition);
  }

  const { data, error, count } = await qb;
  if (error) throw error;

  const items: EquipoOption[] = (data ?? []).map((row) => ({
    id_equipo: row.id_equipo,
    codigo: row.codigo ?? null,
    nombre_equipo: row.nombre_equipo ?? null,
  }));

  return { items, total: count ?? 0 };
};

export default function EquipoSelector({
  value,
  onChange,
  placeholder = "Buscar equipo...",
  disabled,
}: EquipoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Display label para el botón trigger
  const displayLabel = useMemo(() => {
    if (!value) return null;
    return value.nombre_equipo || value.codigo || "(sin nombre)";
  }, [value]);

  // Debounce del query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // React Query para cache de equipos iniciales (sin búsqueda)
  const initialEquiposQuery = useQuery({
    queryKey: ["equipos", "initial"],
    queryFn: () => fetchEquipos(""),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: open, // Solo cargar cuando se abre
  });

  // React Query para búsqueda con debounce
  const searchQuery = useQuery({
    queryKey: ["equipos", "search", debouncedQuery, value?.id_equipo],
    queryFn: () => fetchEquipos(debouncedQuery, value?.id_equipo),
    staleTime: 30 * 1000, // 30 segundos para búsquedas
    enabled: open && debouncedQuery.length > 0,
  });

  // Determinar qué datos mostrar
  const { items, totalCount, loading, errorMsg } = useMemo(() => {
    // Si hay búsqueda activa, usar resultados de búsqueda
    if (debouncedQuery.length > 0) {
      return {
        items: searchQuery.data?.items ?? [],
        totalCount: searchQuery.data?.total ?? 0,
        loading: searchQuery.isLoading || searchQuery.isFetching,
        errorMsg: searchQuery.error ? (searchQuery.error as Error).message : null,
      };
    }
    // Sin búsqueda, usar cache inicial
    return {
      items: initialEquiposQuery.data?.items ?? [],
      totalCount: initialEquiposQuery.data?.total ?? 0,
      loading: initialEquiposQuery.isLoading,
      errorMsg: initialEquiposQuery.error ? (initialEquiposQuery.error as Error).message : null,
    };
  }, [debouncedQuery, searchQuery, initialEquiposQuery]);

  // Reset selectedIndex cuando cambian los items
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Seleccionar un equipo
  const handleSelect = useCallback(
    (equipo: EquipoOption) => {
      onChange(equipo);
      setQuery("");
      setOpen(false);
    },
    [onChange]
  );

  // Navegación con teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;

      const visibleItems = items.slice(0, MAX_VISIBLE_RESULTS);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, visibleItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (visibleItems[selectedIndex]) {
            handleSelect(visibleItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [open, items, selectedIndex, handleSelect]
  );

  // Scroll al item seleccionado
  useEffect(() => {
    if (!open || !listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, open]);

  // Limpiar selección
  const handleClear = useCallback(() => {
    onChange(null);
    setQuery("");
  }, [onChange]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const visibleItems = items.slice(0, MAX_VISIBLE_RESULTS);
  const hasMoreResults = totalCount > MAX_VISIBLE_RESULTS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Seleccionar equipo"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate flex-1 text-left">
            {displayLabel || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          {/* Input de búsqueda */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Buscar por código o nombre..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />}
          </div>

          <CommandList ref={listRef} className="max-h-80 overflow-auto">
            {/* Estado de carga */}
            {loading && items.length === 0 && (
              <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando equipos...
              </div>
            )}

            {/* Error */}
            {errorMsg && !loading && (
              <div className="p-4 text-sm text-red-600">{errorMsg}</div>
            )}

            {/* Sin resultados */}
            {!loading && !errorMsg && items.length === 0 && query && (
              <CommandEmpty className="py-6 text-center text-sm">
                <div className="space-y-2">
                  <p>No se encontraron equipos para "{query}"</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Sugerencias:</p>
                    <ul className="list-disc list-inside">
                      <li>Intenta con términos más cortos</li>
                      <li>Verifica la ortografía</li>
                      <li>Busca por código o nombre parcial</li>
                      <li>Si tienes un equipo seleccionado, intenta limpiar la búsqueda</li>
                    </ul>
                  </div>
                </div>
              </CommandEmpty>
            )}

            {/* Mensaje cuando no hay búsqueda */}
            {!loading && !errorMsg && items.length === 0 && !query && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>Escribe para buscar equipos</p>
                  <p className="text-xs">Puedes buscar por código o nombre del equipo</p>
                </div>
              </div>
            )}

            {/* Lista de resultados */}
            {visibleItems.length > 0 && (
              <CommandGroup>
                {visibleItems.map((item, index) => (
                  <CommandItem
                    key={item.id_equipo}
                    value={String(item.id_equipo)}
                    data-index={index}
                    onSelect={() => handleSelect(item)}
                    className={cn(
                      "cursor-pointer",
                      index === selectedIndex && "bg-accent"
                    )}
                    aria-selected={index === selectedIndex}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value?.id_equipo === item.id_equipo ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">
                        {item.nombre_equipo || item.codigo || "(sin nombre)"}
                      </span>
                      {item.codigo && item.nombre_equipo && (
                        <span className="text-xs text-muted-foreground truncate">
                          {item.codigo}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Indicador de más resultados */}
            {hasMoreResults && !loading && (
              <div className="p-2 text-center text-xs text-muted-foreground border-t bg-muted/30">
                Mostrando {MAX_VISIBLE_RESULTS} de {totalCount} resultados.
                <br />
                Refina tu búsqueda para ver más.
              </div>
            )}

            {/* Mensaje cuando no hay búsqueda */}
            {!loading && !errorMsg && items.length === 0 && !query && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Escribe para buscar equipos
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
