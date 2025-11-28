import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { toast } from 'sonner';
import { Ambulance } from 'lucide-react';

import { db } from '../lib/firebaseConfig';
import { collection, addDoc, Timestamp, getDocs, query } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { type Patient } from '../types';

interface Props { children: React.ReactNode; }

const derivacionSchema = z.object({
  id_paciente: z.string().min(1, "Seleccione paciente"),
  especialidad: z.string().min(2, "Especialidad requerida"),
  motivo: z.string().min(5, "Motivo detallado requerido"),
  prioridad: z.enum(["ALTA", "MEDIA", "BAJA"]),
  observaciones: z.string().optional(),
});

type DerivacionFormData = z.infer<typeof derivacionSchema>;

export function RegistrarDerivacionDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const auth = getAuth();

  const form = useForm<DerivacionFormData>({
    resolver: zodResolver(derivacionSchema),
    defaultValues: { prioridad: "MEDIA", especialidad: "", motivo: "", observaciones: "" },
  });

  useEffect(() => {
    if (open) {
      getDocs(query(collection(db, "pacientes"))).then(snap => {
        setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
      });
    }
  }, [open]);

  const onSubmit = async (data: DerivacionFormData) => {
    if (!auth.currentUser) return;
    try {
      const paciente = pacientes.find(p => p.id === data.id_paciente);
      await addDoc(collection(db, "derivaciones"), {
        ...data,
        paciente_nombre: paciente ? `${paciente.nombres} ${paciente.apellidos}` : '?',
        paciente_dni: paciente?.doc_identidad || '',
        fecha: Timestamp.now(),
        estado: "PENDIENTE",
        usuarioId: auth.currentUser.uid
      });
      toast.success("Derivación registrada");
      setOpen(false);
      form.reset();
    } catch (e) { toast.error("Error al guardar"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader><DialogTitle className="flex gap-2 text-orange-600"><Ambulance className="h-5 w-5"/> Nueva Derivación</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="id_paciente" render={({ field }) => (
              <FormItem><FormLabel>Paciente</FormLabel>
                <Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Buscar..." /></SelectTrigger></FormControl>
                  <SelectContent className="bg-white">{pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombres} {p.apellidos}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="especialidad" render={({ field }) => (
              <FormItem><FormLabel>Especialidad Destino</FormLabel><FormControl><Input placeholder="Ej: Cardiología" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="prioridad" render={({ field }) => (
              <FormItem><FormLabel>Prioridad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent className="bg-white"><SelectItem value="ALTA">Alta (Urgente)</SelectItem><SelectItem value="MEDIA">Media</SelectItem><SelectItem value="BAJA">Baja</SelectItem></SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="motivo" render={({ field }) => (
              <FormItem><FormLabel>Motivo de Referencia</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}