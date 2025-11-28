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
import { Loader2, Stethoscope } from 'lucide-react';
import { Separator } from './ui/separator';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, addDoc, Timestamp, getDocs, query } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { type Patient } from '../types';

interface RegistrarConsultaDialogProps {
  children: React.ReactNode;
}

const consultaSchema = z.object({
  id_paciente: z.string().min(1, "Debe seleccionar una paciente"),
  fecha: z.string().min(1, "Fecha requerida"),
  hora: z.string().min(1, "Hora requerida"),
  tipo: z.enum(["PRENATAL", "POSTPARTO", "PLANIFICACION", "OTRO"]),
  motivo: z.string().min(3, "Motivo requerido"),
  presion_arterial: z.string().optional(),
  peso: z.string().min(1, "Peso requerido"),
  talla: z.string().min(1, "Talla requerida"),
  edad_gestacional: z.string().optional(), 
  diagnostico: z.string().min(3, "Diagnóstico requerido"),
  indicaciones: z.string().optional(),
});

type ConsultaFormData = z.infer<typeof consultaSchema>;

export function RegistrarConsultaDialog({ children }: RegistrarConsultaDialogProps) {
  const [open, setOpen] = useState(false);
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const auth = getAuth(); // <-- Obtenemos usuario actual

  const form = useForm<ConsultaFormData>({
    resolver: zodResolver(consultaSchema),
    defaultValues: {
      id_paciente: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      tipo: 'PRENATAL',
      motivo: '',
      presion_arterial: '',
      peso: '',
      talla: '',
      edad_gestacional: '',
      diagnostico: '',
      indicaciones: '',
    },
  });

  // Cargar lista de pacientes
  useEffect(() => {
    const fetchPacientes = async () => {
      setIsLoadingLists(true);
      try {
        const q = query(collection(db, "pacientes"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
        setPacientes(list);
      } catch (error) {
        console.error("Error cargando pacientes:", error);
      }
      setIsLoadingLists(false);
    };
    if (open) fetchPacientes();
  }, [open]);

  const onSubmit = async (data: ConsultaFormData) => {
    if (!auth.currentUser) {
      toast.error("Sesión no válida.");
      return;
    }

    try {
      const fechaHora = new Date(`${data.fecha}T${data.hora}`);
      const pacienteSelect = pacientes.find(p => p.id === data.id_paciente);

      await addDoc(collection(db, "consultas"), {
        id_paciente: data.id_paciente,
        paciente_nombre_completo: pacienteSelect ? `${pacienteSelect.nombres} ${pacienteSelect.apellidos}` : 'Desconocida',
        paciente_dni: pacienteSelect?.doc_identidad || '',
        fecha: Timestamp.fromDate(fechaHora),
        tipo: data.tipo,
        motivo: data.motivo,
        presion_arterial: data.presion_arterial || '',
        peso: parseFloat(data.peso),
        talla: parseFloat(data.talla),
        edad_gestacional: data.edad_gestacional || '',
        diagnostico: data.diagnostico,
        indicaciones: data.indicaciones || '',
        creado_en: Timestamp.now(),
        // Guardamos la propiedad
        usuarioId: auth.currentUser.uid 
      });

      toast.success("Consulta registrada exitosamente");
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error registrando consulta: ", error);
      toast.error("Error al registrar la consulta.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-pink-700 flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Nueva Consulta Obstétrica
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            
            {/* 1. Selección de Paciente */}
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
              <h3 className="text-sm font-medium text-pink-800 mb-3 uppercase tracking-wider">Paciente</h3>
              <FormField
                control={form.control}
                name="id_paciente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buscar Paciente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingLists}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={isLoadingLists ? "Cargando..." : "Seleccione paciente..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {pacientes.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.doc_identidad} - {p.nombres} {p.apellidos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. Datos de la Consulta */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Datos de Atención</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora *</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Consulta *</FormLabel>
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
              </div>
              
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo de Consulta *</FormLabel>
                      <FormControl><Input placeholder="Ej: Dolor abdominal, control de rutina..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 3. Signos Vitales y Antropometría */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Signos Vitales</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="presion_arterial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>P. Arterial (mmHg)</FormLabel>
                      <FormControl><Input placeholder="120/80" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg) *</FormLabel>
                      <FormControl><Input type="number" step="0.1" placeholder="0.0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="talla"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talla (cm) *</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('tipo') === 'PRENATAL' && (
                  <FormField
                    control={form.control}
                    name="edad_gestacional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edad Gest. (sem)</FormLabel>
                        <FormControl><Input placeholder="Ej: 32" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <Separator />

            {/* 4. Diagnóstico e Indicaciones */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="diagnostico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico *</FormLabel>
                    <FormControl><Textarea placeholder="Descripción del diagnóstico..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="indicaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indicaciones / Tratamiento</FormLabel>
                    <FormControl><Textarea placeholder="Receta médica, exámenes solicitados..." rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Consulta"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}