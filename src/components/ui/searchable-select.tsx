/**
 * SearchableSelect
 *
 * Selector reutilizable con búsqueda fuzzy basado en Popover + Command (cmdk).
 * Reemplaza los <Select> estáticos para catálogos con muchos registros.
 *
 * Características:
 * - Búsqueda fuzzy con ordenamiento por relevancia (cmdk nativo)
 * - Scroll fluido con virtualización nativa de CommandList
 * - Keyboard navigation (ArrowUp/Down, Enter, Escape)
 * - Loading state externo (para React Query)
 * - Opción prepend (ej: "No aplica")
 */

import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  prependOption?: { value: string; label: string };
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  isLoading = false,
  emptyMessage = "No se encontraron resultados",
  className,
  prependOption,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Encontrar label del valor seleccionado
  const selectedLabel = (() => {
    if (!value) return null;
    if (prependOption && value === prependOption.value) return prependOption.label;
    const found = options.find((o) => o.value === value);
    if (!found) return null;
    return found.sublabel ? `${found.label} — ${found.sublabel}` : found.label;
  })();

  // Focus en input cuando se abre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate flex-1 text-left">
            {selectedLabel || placeholder}
          </span>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {prependOption && (
                    <CommandItem
                      value={prependOption.label}
                      onSelect={() => handleSelect(prependOption.value)}
                      className="text-muted-foreground italic"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === prependOption.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {prependOption.label}
                    </CommandItem>
                  )}
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.sublabel ? `${option.label} ${option.sublabel}` : option.label}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate">{option.label}</span>
                        {option.sublabel && (
                          <span className="text-xs text-muted-foreground truncate">
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
