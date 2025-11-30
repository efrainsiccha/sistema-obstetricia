import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Loader2, Plus, Stethoscope } from "lucide-react";
import { toast } from "sonner";

// Importamos el buscador inteligente
import { PatientSearch } from "./PatientSearch";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Esquema de validación
const consultaSchema = z.object({
  pacienteId: z.string().min(1, "Debes seleccionar un paciente"),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora: z.string().min(1, "La hora es requerida"),
  tipo: z.enum(["PRENATAL", "POSTPARTO", "PLANIFICACION", "OTRO"]),
  motivo: z.string().min(3, "El motivo es requerido"),
  presion_arterial: z.string().optional(),
  peso: z.string().optional(), // Lo manejamos como string para permitir decimales o vacíos
  diagnostico: z.string().min(3, "El diagnóstico es requerido"),
  indicaciones: z.string().optional(),
  // Campos ocultos para denormalización
  pacienteNombre: z.string(),
  pacienteDni: z.string()
});

type ConsultaFormData = z.infer<typeof consultaSchema>;

interface Props {
  children?: React.ReactNode;
}

export function RegistrarConsultaDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [pacientes, setPacientes] = useState<{ id: string; nombre: string; dni: string }[]>([]);
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(false);
  const auth = getAuth();

  const form = useForm<ConsultaFormData>({
    resolver: zodResolver(consultaSchema),
    defaultValues: {
      pacienteId: "",
      fecha: new Date().toISOString().split("T")[0], // Fecha de hoy
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      tipo: "PRENATAL",
      motivo: "",
      presion_arterial: "",
      peso: "",
      diagnostico: "",
      indicaciones: "",
      pacienteNombre: "",
      pacienteDni: ""
    },
  });

  // Cargar lista de pacientes al abrir el modal
  useEffect(() => {
    const fetchPacientes = async () => {
      if (!open) return;
      setIsLoadingPacientes(true);
      try {
        // Solo cargamos pacientes activos
        const q = query(collection(db, "pacientes"), where("estado", "==", "ACTIVO"));
        const snapshot = await getDocs(q);
        
        const lista = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            nombre: `${data.nombres} ${data.apellidos}`,
            dni: data.doc_identidad
          };
        });
        
        // Ordenar alfabéticamente para que se vea ordenado en el buscador
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        setPacientes(lista);
      } catch (error) {
        console.error("Error cargando pacientes:", error);
        toast.error("Error al cargar la lista de pacientes");
      }
      setIsLoadingPacientes(false);
    };

    fetchPacientes();
  }, [open]);

  const onSubmit = async (data: ConsultaFormData) => {
    if (!auth.currentUser) {
      toast.error("Sesión no válida");
      return;
    }

    try {
      // Combinar fecha y hora en un objeto Date
      const fechaHora = new Date(`${data.fecha}T${data.hora}`);

      await addDoc(collection(db, "consultas"), {
        id_paciente: data.pacienteId,
        paciente_nombre_completo: data.pacienteNombre,
        paciente_dni: data.pacienteDni,
        fecha: Timestamp.fromDate(fechaHora),
        tipo: data.tipo,
        motivo: data.motivo,
        presion_arterial: data.presion_arterial,
        peso: data.peso ? parseFloat(data.peso) : null,
        diagnostico: data.diagnostico,
        indicaciones: data.indicaciones,
        estado_consulta: "PROGRAMADA", // Por defecto
        usuarioId: auth.currentUser.uid,
        creado_en: Timestamp.now()
      });

      toast.success("Consulta registrada correctamente");
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error al guardar consulta:", error);
      toast.error("Error al registrar la consulta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Nueva Consulta
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pink-700">
            <Stethoscope className="h-5 w-5" />
            Nueva Consulta / Programación
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {/* BUSCADOR DE PACIENTES */}
            <FormField
              control={form.control}
              name="pacienteId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Buscar Paciente *</FormLabel>
                  <FormControl>
                    {isLoadingPacientes ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground border p-2 rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando directorio...
                      </div>
                    ) : (
                      <PatientSearch
                        pacientes={pacientes}
                        value={field.value}
                        onChange={(newValue) => {
                          field.onChange(newValue);
                          // Al seleccionar, llenamos los campos ocultos automáticamente
                          const p = pacientes.find(x => x.id === newValue);
                          if (p) {
                            form.setValue("pacienteNombre", p.nombre);
                            form.setValue("pacienteDni", p.dni);
                          }
                        }}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
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
                    <FormLabel>Hora</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Consulta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="PRENATAL">Control Prenatal</SelectItem>
                        <SelectItem value="POSTPARTO">Control Postparto</SelectItem>
                        <SelectItem value="PLANIFICACION">Planificación Familiar</SelectItem>
                        <SelectItem value="OTRO">Otro / Consulta General</SelectItem>
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
                    <FormLabel>Motivo Principal</FormLabel>
                    <FormControl><Input placeholder="Ej: Dolor abdominal, Control..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border">
              <FormField
                control={form.control}
                name="presion_arterial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>P. Arterial (mmHg)</FormLabel>
                    <FormControl><Input placeholder="120/80" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="peso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Actual (kg)</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder="0.0" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="diagnostico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico Presuntivo</FormLabel>
                  <FormControl><Textarea placeholder="Describa el diagnóstico..." rows={2} {...field} /></FormControl>
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
                  <FormControl><Textarea placeholder="Medicamentos, reposo, exámenes..." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Consulta"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}