import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, addDoc, Timestamp, getDocs, query } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // <-- Importamos Auth
import { type Patient } from '../types';

interface RegistrarPartoDialogProps {
  children: React.ReactNode;
}

interface Sucursal {
  id: string;
  nombre: string;
}

const partoSchema = z.object({
  paciente_nombres: z.string().min(3, "Nombres requeridos"),
  paciente_apellidos: z.string().min(3, "Apellidos requeridos"),
  paciente_dni: z.string().min(8, "DNI debe tener 8 dígitos").max(8, "DNI debe tener 8 dígitos"),
  fecha_parto: z.string().min(1, "Fecha requerida"),
  hora_parto: z.string().min(1, "Hora requerida"),
  tipo_parto: z.enum(["VAGINAL", "CESAREA", "OTRO"]),
  lugar: z.string().min(3, "Lugar requerido"),
  apgar1: z.string().min(1, "Requerido"),
  apgar5: z.string().min(1, "Requerido"),
  peso_recien_nacido: z.string().min(3, "Peso requerido (g)"),
  talla_recien_nacido: z.string().min(2, "Talla requerida (cm)"),
  sexo_recien_nacido: z.enum(["M", "F"]), 
  observaciones: z.string().optional(),
});

type PartoFormData = z.infer<typeof partoSchema>;

export function RegistrarPartoDialog({ children }: RegistrarPartoDialogProps) {
  const [open, setOpen] = useState(false);
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const auth = getAuth(); // <-- Usuario actual

  const form = useForm<PartoFormData>({
    resolver: zodResolver(partoSchema),
    defaultValues: {
      paciente_nombres: '',
      paciente_apellidos: '',
      paciente_dni: '',
      fecha_parto: '',
      hora_parto: '',
      tipo_parto: 'VAGINAL',
      lugar: '',
      apgar1: '',
      apgar5: '',
      peso_recien_nacido: '',
      talla_recien_nacido: '',
      sexo_recien_nacido: undefined,
      observaciones: ''
    },
  });

  useEffect(() => {
    const fetchLists = async () => {
      setIsLoadingLists(true);
      try {
        const pacQuery = query(collection(db, "pacientes"));
        const pacSnapshot = await getDocs(pacQuery);
        const pacList = pacSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
        setPacientes(pacList);
        
        const sucQuery = query(collection(db, "sucursales"));
        const sucSnapshot = await getDocs(sucQuery);
        const sucList = sucSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre } as Sucursal));
        setSucursales(sucList);
      } catch (error) {
        console.error("Error cargando listas: ", error);
      }
      setIsLoadingLists(false);
    };

    if (open) {
      fetchLists();
    }
  }, [open]);

  const handleSelectPaciente = (pacienteId: string) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (paciente) {
      form.setValue('paciente_nombres', paciente.nombres);
      form.setValue('paciente_apellidos', paciente.apellidos);
      form.setValue('paciente_dni', paciente.doc_identidad);
      toast.info(`Datos de ${paciente.nombres} cargados.`);
    }
  };

  const handleSelectSucursal = (sucursalId: string) => {
    const sucursal = sucursales.find(s => s.id === sucursalId);
    if (sucursal) {
      form.setValue('lugar', sucursal.nombre + ' - ');
    }
  };

  const onSubmit = async (data: PartoFormData) => {
    if (!auth.currentUser) {
      toast.error("Sesión no válida.");
      return;
    }

    try {
      const fechaHoraParto = new Date(`${data.fecha_parto}T${data.hora_parto}`);
      
      await addDoc(collection(db, "partos"), {
        paciente_nombres: data.paciente_nombres,
        paciente_apellidos: data.paciente_apellidos,
        paciente_dni: data.paciente_dni,
        fecha_parto: Timestamp.fromDate(fechaHoraParto),
        tipo_parto: data.tipo_parto,
        lugar: data.lugar,
        apgar1: parseInt(data.apgar1, 10),
        apgar5: parseInt(data.apgar5, 10),
        peso_recien_nacido: parseInt(data.peso_recien_nacido, 10),
        talla_recien_nacido: parseInt(data.talla_recien_nacido, 10),
        sexo_recien_nacido: data.sexo_recien_nacido,
        observaciones: data.observaciones || '',
        creado_en: Timestamp.now(),
        // Guardamos la propiedad
        usuarioId: auth.currentUser.uid 
      });

      toast.success("Parto registrado exitosamente");
      setOpen(false);
      form.reset();

    } catch (error) {
      console.error("Error registrando parto: ", error);
      toast.error("Error al registrar el parto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Parto</DialogTitle>
          <DialogDescription>
            Complete la información del parto y del recién nacido
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            
            {/* Atajos */}
            <div>
              <h3 className="mb-4 text-primary">Atajos de Registro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select onValueChange={handleSelectPaciente} disabled={isLoadingLists}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingLists ? "Cargando..." : "Buscar Paciente..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {pacientes.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombres} {p.apellidos} ({p.doc_identidad})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select onValueChange={handleSelectSucursal} disabled={isLoadingLists}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingLists ? "Cargando..." : "Precargar Lugar..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                     {sucursales.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />

            {/* Información de la Paciente */}
            <div>
              <h3 className="mb-4 text-primary">Información de la Paciente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paciente_nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paciente_apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paciente_dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información del Parto */}
            <div>
              <h3 className="mb-4 text-primary">Información del Parto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha_parto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del Parto *</FormLabel>
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
                      <FormLabel>Hora del Parto *</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo_parto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Parto *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="VAGINAL">Vaginal</SelectItem>
                          <SelectItem value="CESAREA">Cesárea</SelectItem>
                          <SelectItem value="OTRO">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lugar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar del Parto *</FormLabel>
                      <FormControl><Input placeholder="Ej: Hospital Central - Sala 2" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información del Recién Nacido */}
            <div>
              <h3 className="mb-4 text-primary">Información del Recién Nacido</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="apgar1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>APGAR 1' * (0-10)</FormLabel>
                      <FormControl><Input type="number" min="0" max="10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apgar5"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>APGAR 5' * (0-10)</FormLabel>
                      <FormControl><Input type="number" min="0" max="10" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sexo_recien_nacido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar sexo" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-white">
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="peso_recien_nacido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (gramos) *</FormLabel>
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
                      <FormLabel>Talla (cm) *</FormLabel>
                      <FormControl><Input type="number" placeholder="Ej: 50" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales del parto, complicaciones, etc."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Registrar Parto"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}