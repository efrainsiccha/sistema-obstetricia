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
import { Loader2, Plus, FileText, User } from "lucide-react";
import { toast } from "sonner";

// Importamos el buscador inteligente
import { PatientSearch } from "./PatientSearch";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Esquema de validación
const derivacionSchema = z.object({
  pacienteId: z.string().min(1, "Debes seleccionar un paciente"),
  especialidad: z.string().min(2, "Especialidad requerida"),
  prioridad: z.enum(["ALTA", "MEDIA", "BAJA"]),
  motivo: z.string().min(5, "Detalle el motivo de referencia"),
  observaciones: z.string().optional(),
  
  // Campos ocultos para denormalización
  pacienteNombre: z.string(),
  pacienteDni: z.string()
});

type DerivacionFormData = z.infer<typeof derivacionSchema>;

interface Props {
  children?: React.ReactNode;
}

export function RegistrarDerivacionDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [pacientes, setPacientes] = useState<{ id: string; nombre: string; dni: string }[]>([]);
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(false);
  const auth = getAuth();

  const form = useForm<DerivacionFormData>({
    resolver: zodResolver(derivacionSchema),
    defaultValues: {
      pacienteId: "",
      especialidad: "",
      prioridad: "MEDIA",
      motivo: "",
      observaciones: "",
      pacienteNombre: "",
      pacienteDni: ""
    },
  });

  // Cargar lista de pacientes al abrir
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

  const onSubmit = async (data: DerivacionFormData) => {
    if (!auth.currentUser) {
      toast.error("Sesión no válida");
      return;
    }

    try {
      await addDoc(collection(db, "derivaciones"), {
        id_paciente: data.pacienteId,
        paciente_nombre: data.pacienteNombre,
        paciente_dni: data.pacienteDni,
        especialidad: data.especialidad,
        prioridad: data.prioridad,
        motivo: data.motivo,
        observaciones: data.observaciones || "",
        estado: "PENDIENTE",
        fecha: Timestamp.now(),
        usuarioId: auth.currentUser.uid,
        creado_en: Timestamp.now()
      });

      toast.success("Derivación registrada correctamente");
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al registrar derivación");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Nueva Derivación
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pink-700">
            <FileText className="h-5 w-5" />
            Nueva Referencia / Derivación
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {/* Buscador de Paciente */}
            <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                <FormField
                control={form.control}
                name="pacienteId"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2 text-pink-800">
                        <User className="h-3 w-3" /> Paciente a Derivar
                    </FormLabel>
                    <FormControl>
                        {isLoadingPacientes ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border p-2 rounded-md bg-white">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="especialidad"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Especialidad Destino</FormLabel>
                    <FormControl><Input placeholder="Ej: Cardiología" {...field} /></FormControl>
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
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-white">
                        <SelectItem value="BAJA">Baja (Rutina)</SelectItem>
                        <SelectItem value="MEDIA">Media</SelectItem>
                        <SelectItem value="ALTA">Alta (Urgencia)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de la Referencia</FormLabel>
                  <FormControl><Textarea placeholder="Describa el cuadro clínico o razón..." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones Adicionales</FormLabel>
                  <FormControl><Input placeholder="Opcional..." {...field} /></FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Derivación"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}