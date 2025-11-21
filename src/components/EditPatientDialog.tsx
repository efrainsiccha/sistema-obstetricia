import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { FileEdit, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Firebase
import { db } from '../lib/firebaseConfig';
import { doc, updateDoc, getDocs, collection, Timestamp } from 'firebase/firestore';

// Componentes de Formulario
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

// --- CORRECCIÓN 1: Importamos el tipo desde '../types' ---
import { type Patient } from '../types'; 

// --- Tipos y Esquemas (Actualizados con los nuevos campos) ---

const patientSchema = z.object({
  // El DNI no se suele editar porque es el ID, pero lo validamos igual
  doc_identidad: z.string().min(8).max(15),
  nombres: z.string().min(2, "El nombre es requerido"),
  apellidos: z.string().min(2, "El apellido es requerido"),
  fecha_nacimiento: z.string().refine((date) => new Date(date) < new Date(), {
    message: "Fecha inválida",
  }),
  // Nuevos campos
  sexo: z.enum(["F", "M"]),
  grupo_sanguineo: z.string().optional(),
  telefono: z.string().min(6, "Teléfono requerido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
  contacto_emergencia: z.string().optional(),
  
  id_sucursal: z.string().min(1, "Debe seleccionar una sucursal"),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface Sucursal {
  id: string;
  nombre: string;
}

interface Props {
  patient: Patient;
}

// Helpers de Fecha
const toDate = (timestamp: { seconds: number; nanoseconds: number } | Date): Date => {
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
};

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// --- Componente ---

export function EditPatientDialog({ patient }: Props) {
  const [open, setOpen] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Convertimos fecha
  const defaultDate = patient.fecha_nacimiento 
    ? formatDateForInput(toDate(patient.fecha_nacimiento))
    : '';

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      doc_identidad: patient.doc_identidad || '',
      nombres: patient.nombres || '',
      apellidos: patient.apellidos || '',
      fecha_nacimiento: defaultDate,
      sexo: patient.sexo || 'F', // Valor por defecto si no existe
      grupo_sanguineo: patient.grupo_sanguineo || '',
      telefono: patient.telefono || '',
      email: patient.email || '',
      direccion: patient.direccion || '',
      contacto_emergencia: patient.contacto_emergencia || '',
      id_sucursal: patient.id_sucursal || '',
      estado: patient.estado as "ACTIVO" | "INACTIVO" || "ACTIVO",
    },
  });

  useEffect(() => {
    const fetchSucursales = async () => {
      const sucursalesCollection = collection(db, 'sucursales');
      const querySnapshot = await getDocs(sucursalesCollection);
      const sucursalesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre,
      }));
      setSucursales(sucursalesList);
    };
    if (open) fetchSucursales();
  }, [open]);

  const onSubmit = async (data: PatientFormData) => {
    try {
      const sucursalSeleccionada = sucursales.find(s => s.id === data.id_sucursal);
      const patientDocRef = doc(db, "pacientes", patient.id); // patient.id es el DNI

      await updateDoc(patientDocRef, {
        // No actualizamos doc_identidad porque es el ID del documento
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: new Date(data.fecha_nacimiento),
        sexo: data.sexo,
        grupo_sanguineo: data.grupo_sanguineo || '',
        telefono: data.telefono,
        email: data.email || '',
        direccion: data.direccion || '',
        contacto_emergencia: data.contacto_emergencia || '',
        id_sucursal: data.id_sucursal,
        sucursal_nombre: sucursalSeleccionada?.nombre || 'Desconocida',
        estado: data.estado,
        actualizado_en: Timestamp.now(),
      });

      toast.success('Paciente actualizada exitosamente');
      setOpen(false);

    } catch (error) {
      console.error("Error al actualizar: ", error);
      toast.error('Error al actualizar. Inténtelo de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <FileEdit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-pink-700 flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Editar Datos de Paciente
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* DNI Deshabilitado (es el ID) */}
              <FormField
                control={form.control}
                name="doc_identidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI (No editable)</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-gray-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="date" {...field} />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sexo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="M">Masculino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_sucursal"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Sucursal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione sucursal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {sucursales.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}