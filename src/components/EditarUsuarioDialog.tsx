import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel} from "./ui/form";
import { toast } from "sonner";
import { Edit, Loader2 } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../lib/firebaseConfig";

// Esquema (Password opcional al editar)
const editUserSchema = z.object({
  nombre: z.string().min(3),
  email: z.string().email(), // Solo lectura
  password: z.string().optional(), // Opcional
  rol: z.enum(["ADMIN", "OBSTETRA"]), 
  estado: z.enum(["ACTIVO", "INACTIVO"]),
  sucursal: z.string().min(1),
  dni: z.string().min(8).max(12),
  colegiatura: z.string().min(3),
  telefono: z.string().min(6),
  jornada: z.enum(["MAÑANA", "TARDE", "NOCHE", "GUARDIA"]),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface Props {
  user: any; // El objeto usuario de la tabla
  sucursales: {id:string, nombre:string}[];
}

export function EditarUsuarioDialog({ user, sucursales }: Props) {
  const [open, setOpen] = useState(false);
  const functions = getFunctions(app);
  const actualizarUsuario = httpsCallable(functions, 'actualizarUsuario');

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      nombre: user.nombre || "",
      email: user.email || "",
      password: "", // Vacío por defecto
      rol: user.rol || "OBSTETRA",
      estado: user.estado || "ACTIVO",
      sucursal: user.sucursal || "",
      dni: user.dni || "",
      colegiatura: user.colegiatura || "",
      telefono: user.telefono || "",
      jornada: user.jornada || "MAÑANA",
    },
  });

  const onSubmit = async (data: EditUserFormData) => {
    toast.loading("Actualizando usuario...");
    try {
      await actualizarUsuario({
        uid: user.id,
        ...data
      });
      toast.dismiss();
      toast.success("Usuario actualizado correctamente");
      setOpen(false);
    } catch (error) {
      toast.dismiss();
      toast.error("Error al actualizar.");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Edit className="h-4 w-4 text-blue-600" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Editar Profesional</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campos (Simplificados para brevedad, son los mismos que Registro) */}
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="dni" render={({field}) => <FormItem><FormLabel>DNI</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>}/>
               <FormField control={form.control} name="colegiatura" render={({field}) => <FormItem><FormLabel>Colegiatura</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>}/>
            </div>
            <FormField control={form.control} name="nombre" render={({field}) => <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>}/>
            <FormField control={form.control} name="email" render={({field}) => <FormItem><FormLabel>Email (Solo lectura)</FormLabel><FormControl><Input {...field} disabled className="bg-gray-100"/></FormControl></FormItem>}/>
            <FormField control={form.control} name="password" render={({field}) => <FormItem><FormLabel>Nueva Contraseña (Opcional)</FormLabel><FormControl><Input {...field} type="password" placeholder="Dejar vacío para no cambiar"/></FormControl></FormItem>}/>
            
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="rol" render={({field}) => <FormItem><FormLabel>Rol</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent className="bg-white"><SelectItem value="OBSTETRA">Obstetra</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent></Select></FormItem>}/>
               <FormField control={form.control} name="estado" render={({field}) => <FormItem><FormLabel>Estado (Acceso)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent className="bg-white"><SelectItem value="ACTIVO">Activo</SelectItem><SelectItem value="INACTIVO">Inactivo (Bloqueado)</SelectItem></SelectContent></Select></FormItem>}/>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="jornada" render={({field}) => <FormItem><FormLabel>Jornada</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent className="bg-white"><SelectItem value="MAÑANA">Mañana</SelectItem><SelectItem value="TARDE">Tarde</SelectItem><SelectItem value="NOCHE">Noche</SelectItem><SelectItem value="GUARDIA">Guardia</SelectItem></SelectContent></Select></FormItem>}/>
                <FormField control={form.control} name="sucursal" render={({field}) => <FormItem><FormLabel>Sucursal</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent className="bg-white">{sucursales.map(s => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}</SelectContent></Select></FormItem>}/>
            </div>
            <FormField control={form.control} name="telefono" render={({field}) => <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>}/>

            <DialogFooter>
               <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Loader2 className="animate-spin"/> : "Guardar Cambios"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
