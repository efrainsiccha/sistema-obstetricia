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
import { Loader2, Baby, Search } from "lucide-react";
import { toast } from "sonner";

// Importamos el buscador inteligente
import { PatientSearch } from "./PatientSearch";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Esquema de validación
const partoSchema = z.object({
  // Campos del paciente (Denormalizados para el reporte)
  pacienteId: z.string().min(1, "Debe seleccionar una paciente"), // ID del documento
  paciente_nombres: z.string().min(1, "Requerido"),
  paciente_apellidos: z.string().min(1, "Requerido"),
  paciente_dni: z.string().min(1, "Requerido"),

  // Datos del Parto
  fecha_parto: z.string().min(1, "Fecha requerida"),
  hora_parto: z.string().min(1, "Hora requerida"),
  tipo_parto: z.enum(["VAGINAL", "CESAREA", "OTRO"]),
  lugar: z.string().min(3, "Lugar requerido"),
  
  // Recién Nacido
  apgar1: z.string().min(1, "Requerido"), // Lo manejamos como string en input, convertimos al guardar
  apgar5: z.string().min(1, "Requerido"),
  sexo_recien_nacido: z.enum(["M", "F"]),
  peso_recien_nacido: z.string().min(1, "Requerido"),
  talla_recien_nacido: z.string().min(1, "Requerido"),
  
  observaciones: z.string().optional(),
});

type PartoFormData = z.infer<typeof partoSchema>;

interface Props {
  children?: React.ReactNode;
}

export function RegistrarPartoDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [pacientes, setPacientes] = useState<{ id: string; nombre: string; dni: string; rawData: any }[]>([]);
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(false);
  const auth = getAuth();

  const form = useForm<PartoFormData>({
    resolver: zodResolver(partoSchema),
    defaultValues: {
      pacienteId: "",
      paciente_nombres: "",
      paciente_apellidos: "",
      paciente_dni: "",
      fecha_parto: new Date().toISOString().split("T")[0],
      hora_parto: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      tipo_parto: "VAGINAL",
      lugar: "Centro Obstétrico Vida",
      apgar1: "",
      apgar5: "",
      sexo_recien_nacido: "M",
      peso_recien_nacido: "",
      talla_recien_nacido: "",
      observaciones: "",
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
            dni: data.doc_identidad,
            rawData: data // Guardamos la data cruda para autocompletar
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

  const onSubmit = async (data: PartoFormData) => {
    if (!auth.currentUser) {
      toast.error("Sesión no válida");
      return;
    }

    try {
      const fechaHora = new Date(`${data.fecha_parto}T${data.hora_parto}`);

      await addDoc(collection(db, "partos"), {
        // Datos Paciente
        id_paciente: data.pacienteId, // Referencia
        paciente_nombres: data.paciente_nombres,
        paciente_apellidos: data.paciente_apellidos,
        paciente_dni: data.paciente_dni,
        
        // Datos Parto
        fecha_parto: Timestamp.fromDate(fechaHora),
        tipo_parto: data.tipo_parto,
        lugar: data.lugar,
        
        // Datos RN (Convertimos a números)
        apgar1: parseInt(data.apgar1) || 0,
        apgar5: parseInt(data.apgar5) || 0,
        peso_recien_nacido: parseFloat(data.peso_recien_nacido) || 0,
        talla_recien_nacido: parseFloat(data.talla_recien_nacido) || 0,
        sexo_recien_nacido: data.sexo_recien_nacido,
        
        observaciones: data.observaciones || "",
        usuarioId: auth.currentUser.uid,
        creado_en: Timestamp.now()
      });

      toast.success("Parto registrado exitosamente");
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error al guardar parto:", error);
      toast.error("Error al registrar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-md">
            <Baby className="mr-2 h-4 w-4" /> Registrar Parto
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pink-700">
            <Baby className="h-5 w-5" />
            Registrar Nuevo Nacimiento
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {/* SECCIÓN 1: BÚSQUEDA Y DATOS MADRE */}
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
              <h4 className="text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                <Search className="h-4 w-4" /> Buscar Madre
              </h4>
              
              <FormField
                control={form.control}
                name="pacienteId"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormControl>
                      {isLoadingPacientes ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border p-2 rounded-md bg-white">
                          <Loader2 className="h-4 w-4 animate-spin" /> Cargando lista...
                        </div>
                      ) : (
                        <PatientSearch
                          pacientes={pacientes}
                          value={field.value}
                          onChange={(newValue) => {
                            field.onChange(newValue);
                            // AUTOCOMPLETADO MÁGICO ✨
                            const p = pacientes.find(x => x.id === newValue);
                            if (p) {
                              form.setValue("paciente_nombres", p.rawData.nombres);
                              form.setValue("paciente_apellidos", p.rawData.apellidos);
                              form.setValue("paciente_dni", p.rawData.doc_identidad);
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
                  name="paciente_nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nombres</FormLabel>
                      <FormControl><Input {...field} readOnly className="bg-gray-100" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paciente_apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Apellidos</FormLabel>
                      <FormControl><Input {...field} readOnly className="bg-gray-100" /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DEL PARTO */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Detalles del Parto</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha_parto"
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
                  name="hora_parto"
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
                  name="tipo_parto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Parto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="VAGINAL">Vaginal</SelectItem>
                          <SelectItem value="CESAREA">Cesárea</SelectItem>
                          <SelectItem value="OTRO">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lugar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar / Sala</FormLabel>
                      <FormControl><Input placeholder="Ej: Sala de Partos 1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SECCIÓN 3: RECIÉN NACIDO */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Información del Recién Nacido</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="apgar1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>APGAR 1'</FormLabel>
                      <FormControl><Input type="number" placeholder="0-10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apgar5"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>APGAR 5'</FormLabel>
                      <FormControl><Input type="number" placeholder="0-10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sexo_recien_nacido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="peso_recien_nacido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (gramos)</FormLabel>
                      <FormControl><Input type="number" placeholder="Ej: 3200" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="talla_recien_nacido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talla (cm)</FormLabel>
                      <FormControl><Input type="number" placeholder="Ej: 50" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones / Complicaciones</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Notas adicionales..." {...field} /></FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Registrar Parto"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}