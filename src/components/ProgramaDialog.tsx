// src/components/ProgramaDialog.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea'; // Usamos Textarea para descripción
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import type { Programa } from '../types';
import { Loader2 } from 'lucide-react';

// --- Esquema de Validación ---
const programaSchema = z.object({
  nombre: z.string().min(5, "El nombre es muy corto (mínimo 5 caracteres)"),
  descripcion: z.string().optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

type ProgramaFormData = z.infer<typeof programaSchema>;

// --- Props ---
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programa: Omit<Programa, "id"> | Programa | null; // Omit<...> para 'onSave'
  onSave: (data: Omit<Programa, "id">) => void;
}

export function ProgramaDialog({ open, onOpenChange, programa, onSave }: Props) {
  
  const form = useForm<ProgramaFormData>({
    resolver: zodResolver(programaSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      estado: "ACTIVO",
    },
  });

  // Cargar datos del programa cuando se abre para editar
  useEffect(() => {
    if (programa && open) {
      form.reset({
        nombre: programa.nombre,
        descripcion: programa.descripcion || "",
        estado: programa.estado,
      });
    } else if (!programa && open) {
      // Limpiar para 'Nuevo Programa'
      form.reset({
        nombre: "",
        descripcion: "",
        estado: "ACTIVO",
      });
    }
  }, [programa, open, form]);

  // Handler para el envío
  const handleSubmit = (data: ProgramaFormData) => {
    // onSave es la función que viene de ProgramasPage (handleAdd o handleEdit)
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>
            {programa ? "Editar Programa" : "Crear Nuevo Programa"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            {/* Campo Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Programa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Control Prenatal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descripción del programa..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Estado */}
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
            
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}