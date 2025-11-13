import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Firebase
import { app, db } from "../lib/firebaseConfig";
import { collection, onSnapshot, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Componentes de UI
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
// ¡¡NUEVOS IMPORTS PARA EL FORMULARIO!!
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, UserPlus, Users, Baby, ClipboardList, MapPin } from "lucide-react";
import { StatsCard } from "../components/StatsCard";

// --- Definición de Tipos ---

const userSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["ADMIN", "OBSTETRA"]), 
  estado: z.enum(["ACTIVO", "INACTIVO"]),
  sucursal: z.string().min(1, "La sucursal es requerida"),
});

type UserFormData = z.infer<typeof userSchema>;

type FirestoreUser = {
  id: string;
  nombre?: string;
  email: string;
  rol: "ADMIN" | "OBSTETRA";
  estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO";
  sucursal?: string;
};

// --- Conexión a la Cloud Function ---
const functions = getFunctions(app);
const crearUsuarioCallable = httpsCallable(functions, 'crearUsuario');


export default function AdminPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<FirestoreUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pacientesCount, setPacientesCount] = useState(0);
  const [partosCount, setPartosCount] = useState(0);
  const [programasActivosCount, setProgramasActivosCount] = useState(0);
  const [sucursalesCount, setSucursalesCount] = useState(0);

  // 1. Inicializamos el formulario con 'useForm'
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      rol: "OBSTETRA",
      estado: "ACTIVO",
      nombre: "",
      email: "",
      password: "",
      sucursal: ""
    },
  });

  // --- Lógica de Datos ---

  // LEER usuarios (con 'onSnapshot' para tiempo real)
  useEffect(() => {
    setIsLoading(true);
    const usersCollectionRef = collection(db, "usuarios");

    const unsubscribe = onSnapshot(usersCollectionRef, (querySnapshot) => {
      const usersList = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      } as FirestoreUser));
      setUsuarios(usersList);
      setIsLoading(false);
    }, (error) => {
      toast.error("Error al cargar la lista de usuarios.");
      console.error("Error fetching users: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "pacientes"), (querySnapshot) => {
      setPacientesCount(querySnapshot.size);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "partos"), (querySnapshot) => {
      setPartosCount(querySnapshot.size);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "programas"), (querySnapshot) => {
      const activos = querySnapshot.docs.reduce((acc, doc) => {
        const data = doc.data() as { estado?: string };
        return acc + (data.estado === "ACTIVO" ? 1 : 0);
      }, 0);
      setProgramasActivosCount(activos);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sucursales"), (querySnapshot) => {
      setSucursalesCount(querySnapshot.size);
    });
    return () => unsubscribe();
  }, []);

  // CREAR usuario (onSubmit) - REAL
  const onSubmit = async (data: UserFormData) => {
    toast("Creando usuario...", { icon: "⏳" });
    try {
      const result = await crearUsuarioCallable(data);
      const resultData = result.data as { status: string, message: string };
      toast.success(resultData.message || "Usuario creado con éxito.");
      form.reset(); // Resetea el formulario

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error desconocido al crear usuario.");
    }
  };

  // --- Renderizado (JSX) ---

  return (
    <div className="space-y-8">
      
      {/* 1. Título y Botón de Volver */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Panel de Administración
        </h1>
        <Button variant="outline" onClick={() => navigate("/home")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Usuarios"
          value={usuarios.length}
          icon={<Users className="w-5 h-5" />}
          subtitle={`Admins ${usuarios.filter(u => u.rol === "ADMIN").length}, Obstetras ${usuarios.filter(u => u.rol === "OBSTETRA").length}`}
        />
        <StatsCard
          title="Pacientes"
          value={pacientesCount}
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title="Partos"
          value={partosCount}
          icon={<Baby className="w-5 h-5" />}
        />
        <StatsCard
          title="Programas Activos"
          value={programasActivosCount}
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatsCard
          title="Sucursales"
          value={sucursalesCount}
          icon={<MapPin className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Columna del Formulario (AHORA CORREGIDA) */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-primary" />
                <CardTitle>Crear Nuevo Usuario</CardTitle>
              </div>
              <CardDescription>
                Añadir un nuevo administrador u obstetra al sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Usamos el componente <Form> de shadcn */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Campo Nombre */}
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Dr. Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage /> {/* <-- Muestra el error de Zod */}
                      </FormItem>
                    )}
                  />

                  {/* Campo Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="juan.perez@correo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo Contraseña */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña Temporal</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo Rol */}
                  <FormField
                    control={form.control}
                    name="rol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol del Usuario</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un rol..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="OBSTETRA">Obstetra</SelectItem>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo Estado */}
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Inicial</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un estado..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVO">Activo</SelectItem>
                            <SelectItem value="INACTIVO">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo Sucursal */}
                  <FormField
                    control={form.control}
                    name="sucursal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sucursal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Sucursal Centro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creando..." : "Crear Usuario"}
                  </Button>

                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* 3. Columna de la Tabla (Sin cambios) */}
        <div className="lg:col-span-2">
          {/* ... (Tu tabla de usuarios va aquí, no necesita cambios) ... */}
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <CardTitle>Usuarios del Sistema</CardTitle>
              </div>
              <CardDescription>
                Lista de todo el personal registrado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Cargando usuarios...</TableCell>
                    </TableRow>
                  ) : usuarios.length === 0 ? (
                     <TableRow>
                      <TableCell colSpan={4} className="text-center">No hay usuarios registrados.</TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nombre || "Sin nombre"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.rol === "ADMIN" ? "destructive" : "secondary"}>
                            {user.rol}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.estado === "ACTIVO" ? "default" : "outline"}>
                            {user.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}