import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2 } from "lucide-react";
import type { Derivacion } from "../types";

// Esquema de validación
const derivacionSchema = z.object({
  especialidad: z.string().min(2, "La especialidad es requerida"),
  motivo: z.string().min(5, "El motivo debe ser detallado"),
  prioridad: z.enum(["ALTA", "MEDIA", "BAJA"]),
  observaciones: z.string().optional(),
});

export type DerivacionFormData = z.infer<typeof derivacionSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  derivacion: Derivacion | null;
  onSave: (id: string, data: DerivacionFormData) => Promise<void>;
}

export function EditarDerivacionDialog({ open, onOpenChange, derivacion, onSave }: Props) {
  const form = useForm<DerivacionFormData>({
    resolver: zodResolver(derivacionSchema),
    defaultValues: {
      especialidad: "",
      motivo: "",
      prioridad: "MEDIA",
      observaciones: "",
    },
  });

  // Cargar datos cuando se abre el modal con una derivación seleccionada
  useEffect(() => {
    if (derivacion) {
      form.reset({
        especialidad: derivacion.especialidad,
        motivo: derivacion.motivo,
        prioridad: derivacion.prioridad as "ALTA" | "MEDIA" | "BAJA",
        observaciones: derivacion.observaciones || "",
      });
    }
  }, [derivacion, form]);

  const onSubmit = async (data: DerivacionFormData) => {
    if (!derivacion) return;
    await onSave(derivacion.id, data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Editar Derivación</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la referencia médica.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="especialidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidad destino</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Cardiología, Nutrición..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prioridad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BAJA">Baja</SelectItem>
                      <SelectItem value="MEDIA">Media</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de referencia</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describa el cuadro clínico..." 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-pink-600 hover:bg-pink-700">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}