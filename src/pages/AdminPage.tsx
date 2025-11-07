// src/pages/AdminPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Firebase
import { app, db } from "../lib/firebaseConfig"; // <-- Importamos 'app'
import { collection, getDocs, onSnapshot, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions"; // <-- ¡NUEVO!

// Componentes de UI
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, UserPlus, Users } from "lucide-react";

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
const functions = getFunctions(app); // <-- ¡NUEVO! Inicializa la conexión
const crearUsuarioCallable = httpsCallable(functions, 'crearUsuario'); // <-- ¡NUEVO! Apunta a nuestra función


export default function AdminPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<FirestoreUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserFormData>({
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

  // LEER usuarios (Mejorado con 'onSnapshot' para tiempo real)
  useEffect(() => {
    setIsLoading(true);
    const usersCollectionRef = collection(db, "usuarios");

    // 'onSnapshot' escucha cambios en vivo. Si creas un usuario, la tabla se actualiza sola.
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

    // Se limpia el "listener" al salir de la página
    return () => unsubscribe();
  }, []);

  // CREAR usuario (onSubmit) - ¡¡¡AHORA ES REAL!!!
  const onSubmit = async (data: UserFormData) => {
    toast("Creando usuario...", { icon: "⏳" });
    try {
      // 1. Llama a la Cloud Function 'crearUsuario' y le pasa los datos
      const result = await crearUsuarioCallable(data);

      // 2. La función fue exitosa
      const resultData = result.data as { status: string, message: string };
      toast.success(resultData.message || "Usuario creado con éxito.");
      reset(); // Resetea el formulario

    } catch (error: any) {
      // 3. La función falló (ej: email ya existe, no eres admin, etc.)
      console.error(error);
      toast.error(error.message || "Error desconocido al crear usuario.");
    }
  };

  // --- Renderizado (JSX) ---
  // (Sin cambios, solo el 'onSubmit' es diferente)

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Columna del Formulario */}
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div>
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input id="nombre" placeholder="Ej: Dr. Juan Pérez" {...register("nombre")} />
                  {errors.nombre && <p className="text-red-600 text-sm mt-1">{errors.nombre.message}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" placeholder="juan.perez@correo.com" {...register("email")} />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Contraseña Temporal</Label>
                  <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...register("password")} />
                  {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <Label htmlFor="rol">Rol del Usuario</Label>
                  <Select
                    onValueChange={(value) => register("rol").onChange({ target: { value } })}
                    defaultValue="OBSTETRA"
                  >
                    <SelectTrigger id="rol" {...register("rol")}>
                      <SelectValue placeholder="Seleccione un rol..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OBSTETRA">Obstetra</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.rol && <p className="text-red-600 text-sm mt-1">{errors.rol.message}</p>}
                </div>

                <div>
                  <Label htmlFor="estado">Estado Inicial</Label>
                  <Select
                    onValueChange={(value) => register("estado").onChange({ target: { value } })}
                    defaultValue="ACTIVO"
                  >
                    <SelectTrigger id="estado" {...register("estado")}>
                      <SelectValue placeholder="Seleccione un estado..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.estado && <p className="text-red-600 text-sm mt-1">{errors.estado.message}</p>}
                </div>

                <div>
                  <Label htmlFor="sucursal">Sucursal</Label>
                  <Input id="sucursal" placeholder="Ej: Sucursal Centro" {...register("sucursal")} />
                  {errors.sucursal && <p className="text-red-600 text-sm mt-1">{errors.sucursal.message}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear Usuario"}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* 3. Columna de la Tabla */}
        <div className="lg:col-span-2">
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