import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UserPlus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

// Componentes de Formulario
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

// --- Tipos y Esquemas ---

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
});

type PatientFormData = z.infer<typeof patientSchema>;

interface Sucursal {
  id: string;
  nombre: string;
}

// --- Componente ---

export function PatientRegistrationForm() {
  const [open, setOpen] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      doc_identidad: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      telefono: '',
      direccion: '',
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
    fetchSucursales();
  }, []);

  const onSubmit = async (data: PatientFormData) => {
    try {
      const sucursalSeleccionada = sucursales.find(s => s.id === data.id_sucursal);
      
      await addDoc(collection(db, "pacientes"), {
        doc_identidad: data.doc_identidad,
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: new Date(data.fecha_nacimiento), 
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        id_sucursal: data.id_sucursal,
        sucursal_nombre: sucursalSeleccionada?.nombre || 'Desconocida',
        estado: 'ACTIVO',
        creado_en: Timestamp.now(),
      });

      toast.success('Paciente registrada exitosamente');
      form.reset();
      setOpen(false);

    } catch (error) {
      console.error("Error al registrar paciente: ", error);
      toast.error('Error al registrar paciente. Inténtelo de nuevo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-600 hover:bg-pink-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Registrar Nueva Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-pink-700 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Registro de Nueva Paciente
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa" {...field} className="border-pink-200 focus:border-pink-400" />
                    </FormControl>
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
                {form.formState.isSubmitting ? "Registrando..." : "Registrar Paciente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}