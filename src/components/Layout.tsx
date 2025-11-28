// src/components/Layout.tsx

import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot} from "firebase/firestore";
import { app, db } from "../lib/firebaseConfig";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Baby, 
  Bell, 
  Settings, 
  LogOut, 
  Shield, 
  Activity,
  CalendarClock,
  CheckCircle2
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area"; // Asegúrate de tener este componente o usa un div con overflow

// Definimos el tipo para nuestros datos de usuario
type UserData = {
  nombre?: string;
  rol: "ADMIN" | "OBSTETRA";
  sucursal?: string;
  email: string;
};

// Tipo simple para la notificación
type NotificacionCita = {
  id: string;
  paciente: string;
  fecha: Date;
  hora: string; // string original de la BD
  motivo: string;
};

export default function Layout() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para notificaciones
  const [citasPendientes, setCitasPendientes] = useState<NotificacionCita[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // 1. Autenticación y Datos de Usuario
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data() as UserData);
        } else {
          toast.error("Error al cargar datos del usuario.");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Lógica de Notificaciones (Citas Programadas)
  useEffect(() => {
    if (!authUser) return;

    // Buscamos consultas PROGRAMADAS asignadas a este usuario (o todas si es admin, aunque mejor solo las suyas para avisos personales)
    // Nota: Para simplificar, aquí mostramos las del usuario logueado.
    const q = query(
      collection(db, "consultas"),
      where("usuarioId", "==", authUser.uid),
      where("estado_consulta", "==", "PROGRAMADA")
      // Podríamos ordenar por fecha aquí si tienes el índice compuesto created
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalizamos a inicio del día

      const citas: NotificacionCita[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Convertir fecha
        const fechaDate = data.fecha && (data.fecha as any).seconds 
          ? new Date((data.fecha as any).seconds * 1000) 
          : new Date();
        
        // Solo mostramos citas de HOY en adelante (no las vencidas de hace un mes)
        if (fechaDate >= now) {
          citas.push({
            id: doc.id,
            paciente: data.paciente_nombre_completo,
            fecha: fechaDate,
            hora: new Date(fechaDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            motivo: data.motivo
          });
        }
      });

      // Ordenamos manualmente por fecha más próxima
      citas.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

      setCitasPendientes(citas);
      setHasUnread(citas.length > 0);
    });

    return () => unsubscribe();
  }, [authUser]);


  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      toast.error("Error al cerrar sesión.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <Activity className="w-10 h-10 text-primary animate-spin" />
        <p className="ml-4 text-lg text-foreground">Cargando...</p>
      </div>
    );
  }

  if (!userData || !authUser) return null; 

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-pink-400 rounded-xl p-2.5 shadow-lg">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-primary font-bold text-lg leading-tight">Sistema de Obstetricia</h1>
                <p className="text-muted-foreground text-xs font-medium">{userData.sucursal || "Sucursal no asignada"}</p>
              </div>
            </div>
            
            {/* Menu Derecha */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{userData.nombre || authUser.email}</p>
                <Badge variant="secondary" className="text-[10px] h-5 px-2">
                  {userData.rol}
                </Badge>
              </div>

              {/* --- NOTIFICACIONES (CAMPANA) --- */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {hasUnread && (
                      <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mr-4" align="end">
                  <div className="p-4 border-b bg-pink-50/50">
                    <h4 className="font-semibold text-pink-900 flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" /> Próximas Citas
                    </h4>
                    <p className="text-xs text-muted-foreground">Tus atenciones pendientes</p>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {citasPendientes.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400 opacity-50" />
                        ¡Todo al día! <br/> No tienes citas programadas próximas.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {citasPendientes.map((cita) => (
                          <div 
                            key={cita.id} 
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => navigate('/consultas')} // Al hacer clic, vamos a la agenda
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm text-gray-900">{cita.paciente}</span>
                              <span className="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                {cita.fecha.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-1 line-clamp-1">{cita.motivo}</p>
                            <div className="text-xs font-medium text-pink-600 flex items-center gap-1">
                              <ClockIcon /> {cita.hora}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              {/* --- CONFIGURACIÓN (ENGRANAJE) --- */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/perfil')} // Irá a la página de perfil (pendiente crear)
                title="Mi Perfil y Configuración"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>

              {/* Botón Admin (Solo si es admin) */}
              {userData.rol === "ADMIN" && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/admin')}
                  title="Panel de Administración"
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Shield className="w-5 h-5" />
                </Button>
              )}

              <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar Sesión">
                <LogOut className="w-5 h-5 text-red-500 hover:text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

// Icono simple auxiliar
function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}