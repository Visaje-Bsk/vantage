/**
 * ClienteSelector
 *
 * Componente optimizado para búsqueda y selección de clientes.
 * Realiza búsqueda en la base de datos con debounce para mejor rendimiento.
 *
 * Características:
 * - Búsqueda en BD con ILIKE (nombre_cliente y nit)
 * - Debounce de 300ms para evitar queries excesivas
 * - Navegación con teclado (flechas, Enter, Escape)
 * - Scroll con mouse habilitado
 * - Indicador de resultados totales
 * - Posicionamiento inteligente con Popover
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

// Configuración
const SEARCH_DEBOUNCE_MS = 300;
const MAX_VISIBLE_RESULTS = 20;
const INITIAL_LOAD_LIMIT = 50;

export interface ClienteOption {
  id_cliente: number;
  nombre_cliente: string;
  nit: string;
}

interface ClienteSelectorProps {
  value: ClienteOption | null;
  onChange: (cliente: ClienteOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ClienteSelector({
  value,
  onChange,
  placeholder = "Buscar cliente...",
  disabled = false,
}: ClienteSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar clientes cuando se abre o cambia la búsqueda
  useEffect(() => {
    if (!open) return;

    let active = true;
    const fetchClientes = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const term = query.trim();

        // Siempre incluir el cliente seleccionado en los resultados
        const includeSelectedId = value?.id_cliente;

        let qb = supabase
          .from("cliente")
          .select("id_cliente, nombre_cliente, nit", { count: "exact" })
          .order("nombre_cliente", { ascending: true })
          .limit(INITIAL_LOAD_LIMIT);

        if (term) {
          // Escapar caracteres especiales para ILIKE
          const escapedTerm = term
            .replace(/\\/g, "\\\\")
            .replace(/%/g, "\\%")
            .replace(/_/g, "\\_");

          // Buscar en nombre_cliente y nit
          let orCondition = `nombre_cliente.ilike.%${escapedTerm}%,nit.ilike.%${escapedTerm}%`;

          // Siempre incluir el cliente seleccionado si existe
          if (includeSelectedId) {
            orCondition += `,id_cliente.eq.${includeSelectedId}`;
          }

          qb = qb.or(orCondition);
        }

        const { data, error, count } = await qb;

        if (error) {
          console.error("Error en búsqueda de clientes:", error);
          throw error;
        }

        if (!active) return;

        const mapped: ClienteOption[] = (data ?? []).map((row) => ({
          id_cliente: row.id_cliente,
          nombre_cliente: row.nombre_cliente ?? "",
          nit: row.nit ?? "",
        }));

        setItems(mapped);
        setTotalCount(count ?? 0);
        setSelectedIndex(0);
      } catch (e) {
        console.error("Error fetching clientes:", e);
        setErrorMsg(e instanceof Error ? e.message : "Error al cargar clientes");
        setItems([]);
        setTotalCount(0);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchClientes, SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, open, value?.id_cliente]);

  // Seleccionar un cliente
  const handleSelect = useCallback(
    (cliente: ClienteOption) => {
      onChange(cliente);
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
          setSelectedIndex((prev) =>
            prev < visibleItems.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
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
    const selectedEl = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, open]);

  // Limpiar selección
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setQuery("");
    },
    [onChange]
  );

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
          aria-label="Seleccionar cliente"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {value ? (
              <span className="flex items-center gap-2">
                <span className="font-medium">{value.nombre_cliente}</span>
                <span className="text-muted-foreground">- {value.nit}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {value && !disabled && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false} onKeyDown={handleKeyDown}>
          <CommandInput
            ref={inputRef}
            placeholder="Buscar por nombre o NIT..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList
            ref={listRef}
            className="max-h-[300px] overflow-y-auto"
          >
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Buscando...
                </span>
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
                  <p>No se encontraron clientes para "{query}"</p>
                  <p className="text-xs text-muted-foreground">
                    Intenta con otro término de búsqueda
                  </p>
                </div>
              </CommandEmpty>
            )}

            {/* Mensaje inicial */}
            {!loading && !errorMsg && items.length === 0 && !query && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Escribe para buscar clientes por nombre o NIT
              </div>
            )}

            {/* Lista de resultados */}
            {!loading && visibleItems.length > 0 && (
              <CommandGroup>
                {visibleItems.map((item, index) => (
                  <CommandItem
                    key={item.id_cliente}
                    value={String(item.id_cliente)}
                    data-index={index}
                    onSelect={() => handleSelect(item)}
                    className={cn(
                      "cursor-pointer",
                      index === selectedIndex && "bg-accent"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0",
                        value?.id_cliente === item.id_cliente
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">
                        {item.nombre_cliente}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        NIT: {item.nit}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Indicador de más resultados */}
            {!loading && hasMoreResults && (
              <div className="p-2 text-center text-xs text-muted-foreground border-t">
                Mostrando {visibleItems.length} de {totalCount} resultados.
                Refina tu búsqueda para ver más.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ClienteSelector;
