import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Firebase
import { app, db } from "../lib/firebaseConfig";
import { collection, onSnapshot, type QueryDocumentSnapshot, type DocumentData, getDocs, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Componentes de UI
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
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
import { ArrowLeft, UserPlus, Users, Baby, ClipboardList, MapPin, Phone, CreditCard, Clock, Mail, Loader2 } from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Importamos el nuevo componente de edición
import { EditarUsuarioDialog } from "../components/EditarUsuarioDialog";
// Importamos el NUEVO componente de Turnos
import { TurnosHoy } from "../components/TurnosHoy";

// --- Definición de Tipos ---

const userSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  rol: z.enum(["ADMIN", "OBSTETRA"]), 
  estado: z.enum(["ACTIVO", "INACTIVO"]),
  sucursal: z.string().min(1, "La sucursal es requerida"),
  dni: z.string().min(8, "DNI inválido").max(12),
  colegiatura: z.string().min(3, "Colegiatura requerida"),
  telefono: z.string().min(6, "Teléfono requerido"),
  jornada: z.enum(["MAÑANA", "TARDE", "NOCHE", "GUARDIA"]),
});

type UserFormData = z.infer<typeof userSchema>;

type FirestoreUser = {
  id: string;
  nombre?: string;
  email: string;
  rol: "ADMIN" | "OBSTETRA";
  estado: "ACTIVO" | "INACTIVO";
  sucursal?: string;
  dni?: string;
  colegiatura?: string;
  telefono?: string;
  jornada?: string;
};

interface SucursalItem {
  id: string;
  nombre: string;
}

// --- Conexión a la Cloud Function ---
const functions = getFunctions(app);
const crearUsuarioCallable = httpsCallable(functions, 'crearUsuario');

export default function AdminPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<FirestoreUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [listaSucursales, setListaSucursales] = useState<SucursalItem[]>([]);

  // Estados para el dashboard
  const [pacientesCount, setPacientesCount] = useState(0);
  const [partosCount, setPartosCount] = useState(0);
  const [programasActivosCount, setProgramasActivosCount] = useState(0);
  const [sucursalesCount, setSucursalesCount] = useState(0);
  const [pacientesActivosCount, setPacientesActivosCount] = useState(0);
  const [pacientesInactivosCount, setPacientesInactivosCount] = useState(0);
  const [partosVaginalesCount, setPartosVaginalesCount] = useState(0);
  const [partosCesareaCount, setPartosCesareaCount] = useState(0);
  const [partosOtroCount, setPartosOtroCount] = useState(0);
  const [programasInactivosCount, setProgramasInactivosCount] = useState(0);
  const [partosUltimos7DiasData, setPartosUltimos7DiasData] = useState<{ dia: string; total: number }[]>([]);
  const [pacientesPorSucursal, setPacientesPorSucursal] = useState<{ nombre: string; count: number }[]>([]);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      rol: "OBSTETRA",
      estado: "ACTIVO",
      jornada: "MAÑANA",
      nombre: "",
      email: "",
      password: "",
      sucursal: "",
      dni: "",
      colegiatura: "",
      telefono: ""
    },
  });

  // --- Lógica de Datos ---

  // 1. Cargar la lista de sucursales
  useEffect(() => {
    const fetchSucursalesList = async () => {
      try {
        const q = query(collection(db, "sucursales"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre as string
        }));
        setListaSucursales(list);
      } catch (error) {
        console.error("Error cargando sucursales:", error);
      }
    };
    fetchSucursalesList();
  }, []);

  // 2. LEER usuarios
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
      toast.error("Error al cargar usuarios.");
      console.error(error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Dashboard Hooks
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "pacientes"), (querySnapshot) => {
      const total = querySnapshot.size;
      let activos = 0; let inactivos = 0;
      const sucMap = new Map<string, number>();
      querySnapshot.forEach((doc) => {
        const data = doc.data() as { estado?: string; sucursal_nombre?: string };
        if (data.estado === "ACTIVO") activos += 1; else inactivos += 1;
        const nombre = data.sucursal_nombre || "Sin sucursal";
        sucMap.set(nombre, (sucMap.get(nombre) || 0) + 1);
      });
      setPacientesCount(total);
      setPacientesActivosCount(activos);
      setPacientesInactivosCount(inactivos);
      const arr = Array.from(sucMap.entries()).map(([nombre, count]) => ({ nombre, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      setPacientesPorSucursal(arr);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "partos"), (querySnapshot) => {
      const total = querySnapshot.size;
      let vag = 0; let ces = 0; let otro = 0;
      const byDay = new Map<string, number>();
      const now = new Date();
      querySnapshot.forEach((doc) => {
        const data = doc.data() as { tipo_parto?: string; fecha_parto?: any };
        if (data.tipo_parto === "VAGINAL") vag += 1; else if (data.tipo_parto === "CESAREA") ces += 1; else otro += 1;
        const ts = data.fecha_parto;
        let d: Date;
        if (ts && typeof ts === "object" && ts.seconds !== undefined) { d = new Date(ts.seconds * 1000 + ts.nanoseconds / 1000000); } else { d = ts ? new Date(ts) : new Date(); }
        const key = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
        byDay.set(key, (byDay.get(key) || 0) + 1);
      });
      setPartosCount(total);
      setPartosVaginalesCount(vag);
      setPartosCesareaCount(ces);
      setPartosOtroCount(otro);
      const days: { dia: string; total: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
        days.push({ dia: key, total: byDay.get(key) || 0 });
      }
      setPartosUltimos7DiasData(days);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "programas"), (querySnapshot) => {
      let activos = 0; let inactivos = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data() as { estado?: string };
        if (data.estado === "ACTIVO") activos += 1; else if (data.estado === "INACTIVO") inactivos += 1;
      });
      setProgramasActivosCount(activos);
      setProgramasInactivosCount(inactivos);
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
      // Llamamos a la Cloud Function
      const result = await crearUsuarioCallable(data);
      const resultData = result.data as { status: string, message: string };
      
      toast.success(resultData.message || "Usuario creado con éxito.");
      form.reset(); 
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al crear usuario.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
        <Button variant="outline" onClick={() => navigate("/home")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        <StatsCard title="Usuarios" value={usuarios.length} icon={<Users className="w-5 h-5" />} subtitle={`Admins ${usuarios.filter(u => u.rol === "ADMIN").length}, Obstetras ${usuarios.filter(u => u.rol === "OBSTETRA").length}`} />
        <StatsCard title="Pacientes" value={pacientesCount} icon={<Users className="w-5 h-5" />} />
        <StatsCard title="Partos" value={partosCount} icon={<Baby className="w-5 h-5" />} />
      </div>

      {/* --- NUEVO SECCIÓN: TURNOS DE HOY --- */}
      <TurnosHoy usuarios={usuarios} />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        <StatsCard title="Programas Activos" value={programasActivosCount} icon={<ClipboardList className="w-5 h-5" />} />
        <StatsCard title="Sucursales" value={sucursalesCount} icon={<MapPin className="w-5 h-5" />} />
        <StatsCard title="Programas Inactivos" value={programasInactivosCount} icon={<ClipboardList className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Pacientes Activos" value={pacientesActivosCount} icon={<Users className="w-5 h-5" />} trend={`${pacientesActivosCount}/${pacientesCount}`} />
        <StatsCard title="Pacientes Inactivos" value={pacientesInactivosCount} icon={<Users className="w-5 h-5" />} trend={`${pacientesInactivosCount}/${pacientesCount}`} />
        <StatsCard title="Top Sucursal" value={pacientesPorSucursal[0]?.count || 0} icon={<MapPin className="w-5 h-5" />} subtitle={pacientesPorSucursal[0]?.nombre || "Sin datos"} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>Partos últimos 7 días</CardTitle>
            <CardDescription>Distribución diaria</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={partosUltimos7DiasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#d4588f" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>Partos por tipo</CardTitle>
            <CardDescription>Vaginal, Cesárea y Otros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span>Vaginal</span><span>{partosVaginalesCount}</span></div>
              <div className="flex items-center justify-between"><span>Cesárea</span><span>{partosCesareaCount}</span></div>
              <div className="flex items-center justify-between"><span>Otro</span><span>{partosOtroCount}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle>Pacientes por sucursal</CardTitle>
          <CardDescription>Top 5</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sucursal</TableHead>
                <TableHead>Total Pacientes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientesPorSucursal.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center">Sin datos</TableCell></TableRow>
              ) : (
                pacientesPorSucursal.map((s) => (
                  <TableRow key={s.nombre}>
                    <TableCell>{s.nombre}</TableCell>
                    <TableCell>{s.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: Formulario */}
        <div className="xl:col-span-1">
          <Card className="shadow-lg border-border/50 sticky top-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-primary" />
                <CardTitle>Registrar Profesional</CardTitle>
              </div>
              <CardDescription>
                Alta de personal médico y administrativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="dni"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DNI</FormLabel>
                          <FormControl><Input placeholder="DNI" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="colegiatura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Colegiatura</FormLabel>
                          <FormControl><Input placeholder="CMP/COP" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl><Input placeholder="Dr. Juan Pérez" {...field} /></FormControl>
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
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="rol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="OBSTETRA">Obstetra</SelectItem>
                              <SelectItem value="ADMIN">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="jornada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jornada</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="MAÑANA">Mañana</SelectItem>
                              <SelectItem value="TARDE">Tarde</SelectItem>
                              <SelectItem value="NOCHE">Noche</SelectItem>
                              <SelectItem value="GUARDIA">Guardia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="sucursal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sucursal Asignada</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una sucursal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {listaSucursales.map(suc => (
                              <SelectItem key={suc.id} value={suc.nombre}>{suc.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Inicial</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVO">Activo</SelectItem>
                            <SelectItem value="INACTIVO">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full mt-4" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creando..." : "Crear Usuario"}
                  </Button>

                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 2: Tabla */}
        <div className="xl:col-span-2">
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <CardTitle>Personal Registrado</CardTitle>
              </div>
              <CardDescription>
                Directorio del personal médico y administrativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Credenciales</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : usuarios.length === 0 ? (
                     <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">No hay usuarios.</TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.nombre}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {user.rol}
                              </Badge>
                              {user.jornada && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {user.jornada}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {user.dni && (
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" /> {user.dni}
                              </div>
                            )}
                            {user.colegiatura && (
                              <div className="font-mono text-xs bg-gray-100 px-1 rounded w-fit">
                                CMP: {user.colegiatura}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-primary" /> {user.email}
                            </div>
                            {user.telefono && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" /> {user.telefono}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-primary" />
                            {user.sucursal || "Sin asignar"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.estado === "ACTIVO" ? "default" : "outline"}>
                            {user.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <EditarUsuarioDialog user={user} sucursales={listaSucursales} />
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