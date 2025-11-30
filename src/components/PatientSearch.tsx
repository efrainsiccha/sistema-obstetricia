import { useState } from "react";
import { Check, ChevronsUpDown} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList, // Importante para scroll
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

interface PatientSearchProps {
  pacientes: { id: string; nombre: string; dni: string }[];
  value: string; // El ID del paciente seleccionado
  onChange: (value: string) => void;
}

export function PatientSearch({ pacientes, value, onChange }: PatientSearchProps) {
  const [open, setOpen] = useState(false);

  // Encontramos el paciente seleccionado para mostrar su nombre en el botón
  const selectedPatient = pacientes.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left"
        >
          {selectedPatient
            ? `${selectedPatient.dni} - ${selectedPatient.nombre}`
            : "Buscar paciente por nombre o DNI..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command 
            filter={(value, search) => {
                // Personalizamos el filtro para que busque por DNI o Nombre
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                return 0;
            }}
        >
          <CommandInput placeholder="Escribe nombre o DNI..." />
          <CommandList>
            <CommandEmpty>No se encontró el paciente.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto"> 
              {pacientes.map((paciente) => {
                // Creamos un string único para la búsqueda interna del componente
                const searchString = `${paciente.dni} - ${paciente.nombre}`;
                
                return (
                  <CommandItem
                    key={paciente.id}
                    value={searchString} // Esto es lo que usa el filtro interno
                    onSelect={() => {
                      onChange(paciente.id); // Devolvemos el ID real al formulario
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === paciente.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                        <span className="font-medium">{paciente.nombre}</span>
                        <span className="text-xs text-muted-foreground">DNI: {paciente.dni}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}