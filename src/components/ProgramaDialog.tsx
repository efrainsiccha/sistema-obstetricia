import { useState, useEffect } from "react";
import type { Programa } from "../types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ProgramaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programa: Programa | null;
  onSave: (programa: Omit<Programa, "id_programa">) => void;
}

export function ProgramaDialog({ open, onOpenChange, programa, onSave }: ProgramaDialogProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<"ACTIVO" | "INACTIVO">("ACTIVO");
  const [errors, setErrors] = useState<{ nombre?: string; descripcion?: string }>({});

  useEffect(() => {
    if (programa) {
      setNombre(programa.nombre);
      setDescripcion(programa.descripcion);
      setEstado(programa.estado);
    } else {
      setNombre("");
      setDescripcion("");
      setEstado("ACTIVO");
    }
    setErrors({});
  }, [programa, open]);

  const validateForm = () => {
    const newErrors: { nombre?: string; descripcion?: string } = {};
    
    if (!nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (nombre.length > 100) {
      newErrors.nombre = "El nombre no puede exceder 100 caracteres";
    }

    if (descripcion.length > 300) {
      newErrors.descripcion = "La descripción no puede exceder 300 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      estado
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {programa ? "Editar Programa" : "Nuevo Programa"}
            </DialogTitle>
            <DialogDescription>
              {programa 
                ? "Modifica la información del programa de atención" 
                : "Registra un nuevo programa de atención para el centro"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Nombre del programa */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre del Programa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Control Prenatal, Psicoprofilaxis..."
                maxLength={100}
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && (
                <p className="text-red-500">{errors.nombre}</p>
              )}
              <p className="text-muted-foreground">
                {nombre.length}/100 caracteres
              </p>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe brevemente el programa y sus beneficios..."
                rows={4}
                maxLength={300}
                className={errors.descripcion ? "border-red-500" : ""}
              />
              {errors.descripcion && (
                <p className="text-red-500">{errors.descripcion}</p>
              )}
              <p className="text-muted-foreground">
                {descripcion.length}/300 caracteres
              </p>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">
                Estado <span className="text-red-500">*</span>
              </Label>
              <Select value={estado} onValueChange={(value: "ACTIVO" | "INACTIVO") => setEstado(value)}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value="ACTIVO">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-green-500"></div>
                      <span>Activo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="INACTIVO">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-gray-400"></div>
                      <span>Inactivo</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground">
                Solo los programas activos estarán disponibles para inscripción
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {programa ? "Guardar Cambios" : "Crear Programa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
