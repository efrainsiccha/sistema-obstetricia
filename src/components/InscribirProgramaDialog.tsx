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
import { Loader2, ClipboardList } from 'lucide-react';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 
import { type Programa, type Patient } from '../types';

interface Props {
  children: React.ReactNode;
  patient: Patient; // Necesitamos los datos del paciente para guardar la referencia
}

const inscripcionSchema = z.object({
  id_programa: z.string().min(1, "Seleccione un programa"),
  fecha_inicio: z.string().min(1, "Fecha requerida"),
  etapa: z.string().optional(),
  observaciones: z.string().optional(),
});

type InscripcionFormData = z.infer<typeof inscripcionSchema>;

export function InscribirProgramaDialog({ children, patient }: Props) {
  const [open, setOpen] = useState(false);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [isLoadingProgramas, setIsLoadingProgramas] = useState(false);
  const auth = getAuth(); 

  const form = useForm<InscripcionFormData>({
    resolver: zodResolver(inscripcionSchema),
    defaultValues: {
      id_programa: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      etapa: '',
      observaciones: '',
    },
  });

  // Cargar programas ACTIVOS
  useEffect(() => {
    const fetchProgramas = async () => {
      setIsLoadingProgramas(true);
      try {
        const q = query(collection(db, "programas"), where("estado", "==", "ACTIVO"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Programa));
        setProgramas(list);
      } catch (error) {
        console.error("Error cargando programas:", error);
        toast.error("Error al cargar lista de programas");
      }
      setIsLoadingProgramas(false);
    };
    if (open) fetchProgramas();
  }, [open]);

  const onSubmit = async (data: InscripcionFormData) => {
    if (!auth.currentUser) {
      toast.error("Sesión no válida.");
      return;
    }

    try {
      const programaSelect = programas.find(p => p.id === data.id_programa);
      
      await addDoc(collection(db, "inscripciones"), {
        id_paciente: patient.id, // DNI
        paciente_dni: patient.doc_identidad,
        paciente_nombre: `${patient.nombres} ${patient.apellidos}`,
        id_programa: data.id_programa,
        nombre_programa: programaSelect?.nombre || "Desconocido",
        fecha_inicio: Timestamp.fromDate(new Date(data.fecha_inicio)),
        etapa: data.etapa || "",
        estado: "ACTIVO",
        observaciones: data.observaciones || "",
        usuarioId: auth.currentUser.uid,
        creado_en: Timestamp.now()
      });

      toast.success(`Inscrita en ${programaSelect?.nombre}`);
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error inscribiendo:", error);
      toast.error("Error al realizar la inscripción.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-purple-700 flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Inscribir en Programa
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <FormField
              control={form.control}
              name="id_programa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programa *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProgramas}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingProgramas ? "Cargando..." : "Seleccione programa"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {programas.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="etapa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa / Trimestre</FormLabel>
                  <FormControl><Input placeholder="Ej: 1er Trimestre" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan de Seguimiento / Notas</FormLabel>
                  <FormControl><Textarea placeholder="Detalles del seguimiento..." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Inscribir"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}