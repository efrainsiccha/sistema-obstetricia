import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

interface PatientSearchProps {
  pacientes: { id: string; nombre: string; dni: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function PatientSearch({ pacientes, value, onChange }: PatientSearchProps) {
  const [open, setOpen] = useState(false);

  const selectedPatient = pacientes.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white border-pink-200 text-left font-normal hover:bg-pink-50 hover:text-pink-900"
        >
          {selectedPatient
            ? `${selectedPatient.dni} - ${selectedPatient.nombre}`
            : "Seleccionar paciente..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
        <Command>
          <CommandInput placeholder="Escribe DNI o Nombre..." />
          <CommandList>
            <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
            <CommandGroup>
              {pacientes.map((paciente) => (
                <CommandItem
                  key={paciente.id}
                  value={`${paciente.dni} ${paciente.nombre}`} 
                  onSelect={() => {
                    onChange(paciente.id);
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
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}