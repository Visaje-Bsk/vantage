import { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  nit: string;
}

interface ClienteSearchSelectProps {
  clientes: Cliente[];
  value: string;
  onValueChange: (value: string) => void;
}

export function ClienteSearchSelect({ clientes, value, onValueChange }: ClienteSearchSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCliente = clientes.find(cliente => cliente.id_cliente.toString() === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCliente ? (
            `${selectedCliente.nombre_cliente} - ${selectedCliente.nit}`
          ) : (
            "Seleccionar cliente..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            <CommandEmpty>No se encontró cliente.</CommandEmpty>
            <CommandGroup>
              {clientes.map((cliente) => (
                <CommandItem
                  key={cliente.id_cliente}
                  value={`${cliente.nombre_cliente} ${cliente.nit}`}
                  onSelect={() => {
                    onValueChange(cliente.id_cliente.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cliente.id_cliente.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {cliente.nombre_cliente} - {cliente.nit}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}