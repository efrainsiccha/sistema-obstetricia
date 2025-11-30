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

// Esquema de validación completo
const consultaSchema = z.object({
  pacienteId: z.string().min(1, "Debes seleccionar un paciente"),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora: z.string().min(1, "La hora es requerida"),
  tipo: z.enum(["PRENATAL", "POSTPARTO", "PLANIFICACION", "OTRO"]),
  motivo: z.string().min(3, "El motivo es requerido"),
  
  // Signos Vitales y Datos Obstétricos
  presion_arterial: z.string().optional(),
  peso: z.string().optional(), 
  talla: z.string().optional(), 
  edad_gestacional: z.string().optional(), 
  
  diagnostico: z.string().min(3, "El diagnóstico es requerido"),
  indicaciones: z.string().optional(),
  estado_consulta: z.enum(["PROGRAMADA", "ATENDIDA"]),

  // Campos ocultos
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
      fecha: new Date().toISOString().split("T")[0],
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      tipo: "PRENATAL",
      motivo: "",
      presion_arterial: "",
      peso: "",
      talla: "",
      edad_gestacional: "",
      diagnostico: "",
      indicaciones: "",
      estado_consulta: "PROGRAMADA",
      pacienteNombre: "",
      pacienteDni: ""
    },
  });

  // Cargar lista de pacientes
  useEffect(() => {
    const fetchPacientes = async () => {
      if (!open) return;
      setIsLoadingPacientes(true);
      try {
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
        
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setPacientes(lista);
      } catch (error) {
        console.error("Error cargando pacientes:", error);
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
      const fechaHora = new Date(`${data.fecha}T${data.hora}`);

      await addDoc(collection(db, "consultas"), {
        id_paciente: data.pacienteId,
        paciente_nombre_completo: data.pacienteNombre,
        paciente_dni: data.pacienteDni,
        fecha: Timestamp.fromDate(fechaHora),
        tipo: data.tipo,
        motivo: data.motivo,
        
        // Datos clínicos numéricos o string
        presion_arterial: data.presion_arterial || null,
        peso: data.peso ? parseFloat(data.peso) : null,
        talla: data.talla ? parseFloat(data.talla) : null,
        edad_gestacional: data.edad_gestacional || null,

        diagnostico: data.diagnostico,
        indicaciones: data.indicaciones,
        estado_consulta: data.estado_consulta,
        usuarioId: auth.currentUser.uid,
        creado_en: Timestamp.now()
      });

      toast.success("Consulta registrada correctamente");
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al registrar");
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
      
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pink-700">
            <Stethoscope className="h-5 w-5" />
            Nueva Consulta / Programación
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {/* 1. BUSCADOR */}
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

            {/* 2. FECHA Y HORA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <FormField
                control={form.control}
                name="estado_consulta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="PROGRAMADA">📅 Programada</SelectItem>
                        <SelectItem value="ATENDIDA">✅ Atendida</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* 3. TIPO Y MOTIVO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Consulta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="PRENATAL">Control Prenatal</SelectItem>
                        <SelectItem value="POSTPARTO">Control Postparto</SelectItem>
                        <SelectItem value="PLANIFICACION">Planificación Familiar</SelectItem>
                        <SelectItem value="OTRO">Otro / Consulta General</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo Principal</FormLabel>
                    <FormControl><Input placeholder="Dolor, Control, etc." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 4. DATOS CLÍNICOS (CAJA GRIS) */}
            <div className="bg-pink-50/50 p-4 rounded-lg border border-pink-100 space-y-4">
                <h4 className="text-sm font-semibold text-pink-800 mb-2">Datos Clínicos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                        control={form.control}
                        name="presion_arterial"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">P. Arterial</FormLabel>
                            <FormControl><Input placeholder="120/80" {...field} /></FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="peso"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Peso (kg)</FormLabel>
                            <FormControl><Input type="number" step="0.1" placeholder="0.0" {...field} /></FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="talla"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Talla (cm)</FormLabel>
                            <FormControl><Input type="number" placeholder="160" {...field} /></FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="edad_gestacional"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Edad Gest. (sem)</FormLabel>
                            <FormControl><Input placeholder="Ej: 24.5" {...field} /></FormControl>
                        </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* 5. DIAGNÓSTICO E INDICACIONES */}
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
                  <FormControl><Textarea placeholder="Medicamentos, receta..." rows={3} {...field} /></FormControl>
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