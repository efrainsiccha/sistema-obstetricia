import { useState, useEffect, useRef } from "react";
import { Search, X, Check } from "lucide-react";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { cn } from "../lib/utils"; // Asegúrate de tener utils, si no, quita cn y usa strings

interface PatientSearchProps {
  pacientes: { id: string; nombre: string; dni: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function PatientSearch({ pacientes, value, onChange }: PatientSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Sincronizar texto cuando se selecciona un valor desde fuera o al cargar
  useEffect(() => {
    if (value) {
      const p = pacientes.find(p => p.id === value);
      if (p) {
        // Solo actualizamos el texto si no estamos escribiendo activamente para no interrumpir
        if (!isOpen) setSearchTerm(`${p.dni} - ${p.nombre}`);
      }
    } else {
        if (!isOpen) setSearchTerm("");
    }
  }, [value, pacientes, isOpen]);

  // 2. Cerrar al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Si cerramos y no hay valor válido seleccionado, revertimos el texto o lo limpiamos
        // (Opcional: puedes ajustar esto según prefieras UX)
        if (value) {
            const p = pacientes.find(p => p.id === value);
            if(p) setSearchTerm(`${p.dni} - ${p.nombre}`);
        } else {
            setSearchTerm("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, pacientes]);

  // 3. Filtrar la lista localmente
  const filtered = pacientes.filter(p => {
    const search = searchTerm.toLowerCase();
    return p.nombre.toLowerCase().includes(search) || p.dni.includes(search);
  });

  const handleSelect = (id: string, texto: string) => {
    onChange(id);
    setSearchTerm(texto);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
    setIsOpen(true); // Mantenemos abierto para buscar de nuevo
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          placeholder="Escribe nombre o DNI..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (e.target.value === "") onChange(""); // Limpiar selección si borra texto
          }}
          onFocus={() => setIsOpen(true)}
          className="pr-10 border-pink-200 focus-visible:ring-pink-500"
        />
        
        {/* Icono de Lupa o X para limpiar */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {searchTerm ? (
                <button type="button" onClick={handleClear} className="hover:text-pink-600">
                    <X className="h-4 w-4" />
                </button>
            ) : (
                <Search className="h-4 w-4 pointer-events-none" />
            )}
        </div>
      </div>

      {/* Lista Desplegable Manual */}
      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto border-pink-200 shadow-xl bg-white animate-in fade-in zoom-in-95 duration-100">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-center text-muted-foreground">
              No se encontraron pacientes.
            </div>
          ) : (
            <ul className="p-1">
              {filtered.map((p) => {
                const isSelected = value === p.id;
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                      isSelected ? "bg-pink-100 text-pink-900" : "hover:bg-pink-50 text-gray-700"
                    )}
                    onMouseDown={() => handleSelect(p.id, `${p.dni} - ${p.nombre}`)} // onMouseDown ocurre antes que onBlur del input
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{p.nombre}</span>
                      <span className="text-xs opacity-70">DNI: {p.dni}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-pink-600" />}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}