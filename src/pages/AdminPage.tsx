// src/pages/AdminPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import { db } from "../lib/firebaseConfig";
import { collection, getDocs, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, UserPlus, Users } from "lucide-react";

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

  // 1. LEER usuarios de Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersCollectionRef = collection(db, "usuarios");
        const querySnapshot = await getDocs(usersCollectionRef);
        
        const usersList = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        } as FirestoreUser));
        
        setUsuarios(usersList);
      } catch (error) {
        toast.error("Error al cargar la lista de usuarios.");
        console.error("Error fetching users: ", error);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, []);

  // 2. CREAR usuario (onSubmit)
  // ¡¡¡IMPORTANTE!!! Esta función sigue siendo una SIMULACIÓN.
  // Nuestro PRÓXIMO PASO es hacerla real con Cloud Functions.
  const onSubmit = async (data: UserFormData) => {
    console.log("Datos del nuevo usuario:", data);
    toast("Conectando con el backend...", { icon: "⏳" });

    // ¡¡¡PRÓXIMO PASO!!!
    // Aquí es donde llamaremos a nuestra Cloud Function de Firebase
    
    // Por ahora, solo simulamos un éxito y reseteamos el form
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Usuario ${data.nombre} creado (simulación)`);
    reset(); // Resetea el formulario a los 'defaultValues'
    
    // (En el futuro, aquí también recargaremos la lista de usuarios)
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
                    defaultValue="OBSTETRA" // <-- CORREGIDO
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
                    defaultValue="ACTIVO" // <-- CORREGIDO
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
                  {/* TODO: Cambiar esto por un <Select> cuando tengamos la colección de sucursales */}
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