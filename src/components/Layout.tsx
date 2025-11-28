import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
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
  CheckCircle2,
  X
} from "lucide-react";

// Tipos
type UserData = {
  nombre?: string;
  rol: "ADMIN" | "OBSTETRA";
  sucursal?: string;
  email: string;
};

type NotificacionCita = {
  id: string;
  paciente: string;
  fecha: Date;
  hora: string;
  motivo: string;
};

export default function Layout() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lógica de Notificaciones Manual
  const [showNotifications, setShowNotifications] = useState(false);
  const [citasPendientes, setCitasPendientes] = useState<NotificacionCita[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Cerrar notificaciones al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Autenticación
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
          toast.error("Error al cargar datos.");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Cargar Citas Programadas (Notificaciones)
  useEffect(() => {
    if (!authUser) return;

    // Busca citas programadas de este usuario
    const q = query(
      collection(db, "consultas"),
      where("usuarioId", "==", authUser.uid),
      where("estado_consulta", "==", "PROGRAMADA")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const citas: NotificacionCita[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const fechaDate = data.fecha && (data.fecha as any).seconds 
          ? new Date((data.fecha as any).seconds * 1000) 
          : new Date();
        
        // Solo mostrar futuras o de hoy
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

      // Ordenar por fecha
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
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <Activity className="w-10 h-10 text-primary animate-spin" />
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
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
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
                <Badge variant="secondary" className="text-[10px] h-5 px-2">{userData.rol}</Badge>
              </div>

              {/* --- NOTIFICACIONES (MANUAL) --- */}
              <div className="relative" ref={notificationRef}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className={`w-5 h-5 ${showNotifications ? 'text-pink-600' : 'text-gray-600'}`} />
                  {hasUnread && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                  )}
                </Button>

                {/* El Desplegable */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-pink-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b bg-pink-50/50 flex justify-between items-center">
                      <h4 className="font-semibold text-pink-900 flex items-center gap-2 text-sm">
                        <CalendarClock className="h-4 w-4" /> Próximas Citas
                      </h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowNotifications(false)}>
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto">
                      {citasPendientes.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400 opacity-50" />
                          <p>¡Todo al día!</p>
                          <p className="text-xs opacity-70">No tienes citas pendientes.</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {citasPendientes.map((cita) => (
                            <div 
                              key={cita.id} 
                              className="p-3 hover:bg-pink-50/30 cursor-pointer transition-colors"
                              onClick={() => {
                                navigate('/consultas');
                                setShowNotifications(false);
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-gray-900 truncate w-2/3" title={cita.paciente}>
                                  {cita.paciente}
                                </span>
                                <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                  {cita.fecha.toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'})}
                                </span>
                              </div>
                              <div className="flex justify-between items-end">
                                <p className="text-xs text-gray-500 line-clamp-1 w-3/4">{cita.motivo}</p>
                                <div className="text-xs font-bold text-pink-600 bg-pink-50 px-1.5 rounded">
                                  {cita.hora}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Configuración (Perfil) */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/perfil')} 
                title="Mi Perfil"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>

              {/* Panel Admin */}
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