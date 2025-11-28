import { useState} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { toast } from 'sonner';
import { Loader2, Edit} from 'lucide-react';
import { Separator } from './ui/separator';

// Firebase
import { db } from '../lib/firebaseConfig';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { type Consulta } from '../types';

interface Props {
  consulta: Consulta;
  trigger?: React.ReactNode; 
}

// Esquema (Igual al de registro)
const consultaSchema = z.object({
  fecha: z.string().min(1, "Fecha requerida"),
  hora: z.string().min(1, "Hora requerida"),
  tipo: z.enum(["PRENATAL", "POSTPARTO", "PLANIFICACION", "OTRO"]),
  estado_consulta: z.enum(["PROGRAMADA", "ATENDIDA", "CANCELADA"]), 
  motivo: z.string().min(3, "Motivo requerido"),
  presion_arterial: z.string().optional(),
  peso: z.string().optional(), 
  talla: z.string().optional(), 
  edad_gestacional: z.string().optional(), 
  diagnostico: z.string().optional(), 
  indicaciones: z.string().optional(),
});

type ConsultaFormData = z.infer<typeof consultaSchema>;

export function EditarConsultaDialog({ consulta, trigger }: Props) {
  const [open, setOpen] = useState(false);

  // Convertir timestamp a string para inputs date/time
  const getInitialDate = () => {
    if (!consulta.fecha) return "";
    const date = (consulta.fecha as any).toDate ? (consulta.fecha as any).toDate() : new Date(consulta.fecha as any);
    return date.toISOString().split('T')[0];
  };
  
  const getInitialTime = () => {
    if (!consulta.fecha) return "";
    const date = (consulta.fecha as any).toDate ? (consulta.fecha as any).toDate() : new Date(consulta.fecha as any);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const form = useForm<ConsultaFormData>({
    resolver: zodResolver(consultaSchema),
    defaultValues: {
      fecha: getInitialDate(),
      hora: getInitialTime(),
      tipo: consulta.tipo,
      estado_consulta: consulta.estado_consulta || "ATENDIDA",
      motivo: consulta.motivo || "",
      presion_arterial: consulta.presion_arterial || "",
      peso: consulta.peso ? String(consulta.peso) : "",
      talla: consulta.talla ? String(consulta.talla) : "",
      edad_gestacional: consulta.edad_gestacional || "",
      diagnostico: consulta.diagnostico || "",
      indicaciones: consulta.indicaciones || "",
    },
  });

  const onSubmit = async (data: ConsultaFormData) => {
    try {
      const fechaHora = new Date(`${data.fecha}T${data.hora}`);
      
      const consultaRef = doc(db, "consultas", consulta.id);

      await updateDoc(consultaRef, {
        fecha: Timestamp.fromDate(fechaHora),
        tipo: data.tipo,
        estado_consulta: data.estado_consulta,
        motivo: data.motivo,
        presion_arterial: data.presion_arterial || '',
        peso: data.peso ? parseFloat(data.peso) : 0,
        talla: data.talla ? parseFloat(data.talla) : 0,
        edad_gestacional: data.edad_gestacional || '',
        diagnostico: data.diagnostico || '',
        indicaciones: data.indicaciones || '',
      });

      toast.success("Consulta actualizada exitosamente");
      setOpen(false);

    } catch (error) {
      console.error("Error actualizando consulta: ", error);
      toast.error("Error al actualizar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-700 flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Consulta / Atención
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            
            {/* Paciente (Solo lectura) */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
               <p className="text-sm font-medium text-blue-900">Paciente: {consulta.paciente_nombre_completo}</p>
               <p className="text-xs text-blue-700">DNI: {consulta.paciente_dni}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estado_consulta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600 font-bold">Estado *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="ATENDIDA">Atención Realizada</SelectItem>
                        <SelectItem value="PROGRAMADA">Cita Programada</SelectItem>
                        <SelectItem value="CANCELADA">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="PRENATAL">Control Prenatal</SelectItem>
                        <SelectItem value="POSTPARTO">Control Postparto</SelectItem>
                        <SelectItem value="PLANIFICACION">Planificación Familiar</SelectItem>
                        <SelectItem value="OTRO">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="fecha" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="hora" render={({ field }) => (<FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
            </div>
            
            <FormField control={form.control} name="motivo" render={({ field }) => (<FormItem><FormLabel>Motivo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Datos Clínicos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="presion_arterial" render={({ field }) => (<FormItem><FormLabel>P. Arterial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="peso" render={({ field }) => (<FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="talla" render={({ field }) => (<FormItem><FormLabel>Talla (cm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                {form.watch('tipo') === 'PRENATAL' && (<FormField control={form.control} name="edad_gestacional" render={({ field }) => (<FormItem><FormLabel>Edad Gest.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />)}
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                 <FormField control={form.control} name="diagnostico" render={({ field }) => (<FormItem><FormLabel>Diagnóstico</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                 <FormField control={form.control} name="indicaciones" render={({ field }) => (<FormItem><FormLabel>Indicaciones</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}