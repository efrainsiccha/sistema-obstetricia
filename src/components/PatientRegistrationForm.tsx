import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UserPlus, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, getDocs, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; 

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

const patientSchema = z.object({
  doc_identidad: z.string().min(8, "DNI debe tener 8 dígitos").max(15, "No debe exceder 15 dígitos"),
  nombres: z.string().min(2, "El nombre es requerido"),
  apellidos: z.string().min(2, "El apellido es requerido"),
  fecha_nacimiento: z.string().refine((date) => new Date(date) < new Date(), {
    message: "Fecha inválida",
  }),
  sexo: z.enum(["F", "M"]), 
  grupo_sanguineo: z.string().optional(),
  telefono: z.string().min(6, "Teléfono requerido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
  contacto_emergencia: z.string().optional(),
  id_sucursal: z.string().min(1, "Debe seleccionar una sucursal"),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface Sucursal {
  id: string;
  nombre: string;
}

export function PatientRegistrationForm() {
  const [open, setOpen] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const auth = getAuth(); // Obtenemos la instancia de autenticación

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      doc_identidad: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      sexo: 'F',
      grupo_sanguineo: '',
      telefono: '',
      email: '',
      direccion: '',
      contacto_emergencia: '',
      id_sucursal: '',
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
    // Verificamos que haya un usuario logueado (seguridad extra)
    if (!auth.currentUser) {
      toast.error("No hay sesión activa. Recarga la página.");
      return;
    }

    try {
      const pacienteRef = doc(db, "pacientes", data.doc_identidad);
      
      const docSnap = await getDoc(pacienteRef);
      if (docSnap.exists()) {
        toast.error(`Ya existe una paciente registrada con el DNI ${data.doc_identidad}`);
        return;
      }

      const sucursalSeleccionada = sucursales.find(s => s.id === data.id_sucursal);
      
      await setDoc(pacienteRef, {
        doc_identidad: data.doc_identidad,
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
        estado: 'ACTIVO',
        creado_en: Timestamp.now(),
        // ¡AQUÍ ESTÁ LA CLAVE! Guardamos el ID de quien registra
        usuarioId: auth.currentUser.uid 
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-pink-700 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Registro Rápido de Paciente
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* ... (El resto del formulario es idéntico, no cambia nada visualmente) ... */}
            {/* ... (Mantén todo el JSX que ya tenías dentro del return) ... */}
             <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <FormField
                  control={form.control}
                  name="doc_identidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI (Será el ID) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 12345678" {...field} className="border-pink-200 focus:border-pink-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres *</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-pink-200 focus:border-pink-400" />
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
                      <FormLabel>Apellidos *</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-pink-200 focus:border-pink-400" />
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
                      <FormLabel>Fecha de Nacimiento *</FormLabel>
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
                  name="sexo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-pink-200 focus:border-pink-400">
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                  name="grupo_sanguineo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo Sanguíneo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-pink-200 focus:border-pink-400">
                            <SelectValue placeholder="Opcional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Contacto y Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono Móvil *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 987654321" {...field} className="border-pink-200 focus:border-pink-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="paciente@email.com" {...field} className="border-pink-200 focus:border-pink-400" />
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
                      <FormLabel>Dirección Domiciliaria</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección completa" {...field} className="border-pink-200 focus:border-pink-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contacto_emergencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacto de Emergencia</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre y Teléfono de familiar" {...field} className="border-pink-200 focus:border-pink-400" />
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
                      <FormLabel>Sucursal de Registro *</FormLabel>
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
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Paciente"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}