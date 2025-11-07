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
import { type Patient } from '../pages/PacientesPage'; // Importamos la interfaz

// --- Tipos y Esquemas ---

// Esquema de validación (el mismo que el de registro)
const patientSchema = z.object({
  doc_identidad: z.string().min(8, "Debe tener al menos 8 dígitos").max(15, "No debe exceder 15 dígitos"),
  nombres: z.string().min(3, "El nombre es requerido"),
  apellidos: z.string().min(3, "El apellido es requerido"),
  fecha_nacimiento: z.string().refine((date) => new Date(date) < new Date(), {
    message: "La fecha de nacimiento no puede ser futura",
  }),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  id_sucursal: z.string().min(1, "Debe seleccionar una sucursal"),
  estado: z.enum(["ACTIVO", "INACTIVO"]), // ¡Añadido! Para poder editar el estado
});

type PatientFormData = z.infer<typeof patientSchema>;

// Tipo para Sucursales
interface Sucursal {
  id: string;
  nombre: string;
}

// Props que recibe el componente
interface Props {
  patient: Patient;
}

// --- Helpers de Fecha ---

// Convierte un Timestamp de Firestore (o Date) a un objeto Date
const toDate = (timestamp: { seconds: number; nanoseconds: number } | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
};

// Convierte una fecha a string "YYYY-MM-DD" para el <input type="date">
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// --- Componente ---

export function EditPatientDialog({ patient }: Props) {
  const [open, setOpen] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // 1. Convertimos la fecha de Firestore a string YYYY-MM-DD para el formulario
  const defaultDate = patient.fecha_nacimiento 
    ? formatDateForInput(toDate(patient.fecha_nacimiento))
    : '';

  // 2. Inicializamos el formulario con los datos del paciente
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      doc_identidad: patient.doc_identidad || '',
      nombres: patient.nombres || '',
      apellidos: patient.apellidos || '',
      fecha_nacimiento: defaultDate,
      telefono: patient.telefono || '',
      direccion: patient.direccion || '',
      id_sucursal: patient.id_sucursal || '',
      estado: patient.estado as "ACTIVO" | "INACTIVO" || "ACTIVO",
    },
  });

  // 3. Cargar sucursales (igual que en el formulario de registro)
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
    // Solo cargar sucursales si el diálogo está abierto
    if (open) {
      fetchSucursales();
    }
  }, [open]);

  // 4. Función de envío (onSubmit) para ACTUALIZAR
  const onSubmit = async (data: PatientFormData) => {
    try {
      const sucursalSeleccionada = sucursales.find(s => s.id === data.id_sucursal);
      
      // Apuntamos al documento existente usando el ID del paciente
      const patientDocRef = doc(db, "pacientes", patient.id);

      // Usamos 'updateDoc' en lugar de 'addDoc'
      await updateDoc(patientDocRef, {
        doc_identidad: data.doc_identidad,
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: new Date(data.fecha_nacimiento), // Convertir de nuevo a Date
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        id_sucursal: data.id_sucursal,
        sucursal_nombre: sucursalSeleccionada?.nombre || 'Desconocida',
        estado: data.estado,
        // No actualizamos 'creado_en', pero podríamos añadir 'actualizado_en'
        actualizado_en: Timestamp.now(),
      });

      toast.success('Paciente actualizada exitosamente');
      setOpen(false);

    } catch (error) {
      console.error("Error al actualizar paciente: ", error);
      toast.error('Error al actualizar paciente. Inténtelo de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* El botón de "Editar" es el Trigger */}
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <FileEdit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-pink-700 flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Editar Datos de Paciente
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          {/* El formulario es idéntico al de registro, pero con valores por defecto */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <FormField
                control={form.control}
                name="doc_identidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento de Identidad <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 12345678" {...field} className="border-pink-200 focus:border-pink-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_sucursal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-pink-200 focus:border-pink-400">
                          <SelectValue placeholder="Seleccione una sucursal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {sucursales.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                        ))}
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
                    <FormLabel>Nombres <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nombres de la paciente" {...field} className="border-pink-200 focus:border-pink-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Apellidos de la paciente" {...field} className="border-pink-200 focus:border-pink-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="date" {...field} className="border-pink-200 focus:border-pink-400" />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400 pointer-events-none" />
                      </div>
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="Ej: 987654321" {...field} className="border-pink-200 focus:border-pink-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa" {...field} className="border-pink-200 focus:border-pink-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ¡NUEVO CAMPO! Para cambiar el estado */}
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-pink-200 focus:border-pink-400">
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="ACTIVO">Activo</SelectItem>
                        <SelectItem value="INACTIVO">Inactivo</SelectItem>
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