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

  // Lógica de Notificaciones
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
        try {
          const userDocRef = doc(db, "usuarios", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
          } else {
            // Si el usuario existe en Auth pero no en Firestore (raro, pero posible)
            console.error("Usuario sin documento en Firestore");
          }
        } catch (e) {
          console.error("Error leyendo usuario", e);
        }
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Cargar Citas Programadas (Notificaciones en Tiempo Real)
  useEffect(() => {
    if (!authUser) return;

    // Busca citas programadas ASIGNADAS a este usuario (o creadas por él, según tu lógica de negocio)
    // Nota: Asegúrate que tus reglas de Firestore permitan esta query.
    const q = query(
      collection(db, "consultas"),
      where("usuarioId", "==", authUser.uid),
      where("estado_consulta", "==", "PROGRAMADA")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      // Ajustamos 'now' al inicio del día para mostrar todas las citas de HOY en adelante
      now.setHours(0, 0, 0, 0);

      const citas: NotificacionCita[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Manejo seguro de fechas (Timestamp de Firestore a Date JS)
        let fechaDate = new Date();
        if (data.fecha && typeof data.fecha.toDate === 'function') {
           fechaDate = data.fecha.toDate();
        } else if (data.fecha && data.fecha.seconds) {
           fechaDate = new Date(data.fecha.seconds * 1000);
        }

        // Filtramos: Solo mostramos citas de HOY o FUTURAS
        if (fechaDate >= now) {
          citas.push({
            id: doc.id,
            paciente: data.paciente_nombre_completo || "Paciente sin nombre",
            fecha: fechaDate,
            hora: fechaDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            motivo: data.motivo || "Control Prenatal"
          });
        }
      });

      // Ordenar: Más cercanas primero
      citas.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
      
      setCitasPendientes(citas);
      // Si hay citas, mostramos el punto rojo
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
        <Activity className="w-10 h-10 text-pink-600 animate-spin" />
      </div>
    );
  }

  // Si no hay datos de usuario cargados, no renderizamos nada (o un error)
  if (!userData || !authUser) return null; 

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 font-sans">
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            
            {/* Logo e Info Sucursal */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/home')}>
              <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl p-2.5 shadow-lg group-hover:shadow-pink-200 transition-all duration-300">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-gray-800 font-bold text-lg leading-tight tracking-tight">Sistema Obstétrico</h1>
                <div className="flex items-center gap-1 text-xs font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full w-fit mt-0.5">
                   <Activity className="w-3 h-3" />
                   {userData.sucursal || "Central"}
                </div>
              </div>
            </div>
            
            {/* Menu Derecha */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Info Usuario (Solo Desktop) */}
              <div className="text-right hidden md:block mr-2">
                <p className="text-sm font-semibold text-gray-700">{userData.nombre || authUser.email}</p>
                <Badge variant="outline" className="text-[10px] h-5 px-2 border-pink-200 text-pink-700 bg-pink-50">
                  {userData.rol}
                </Badge>
              </div>

              {/* --- NOTIFICACIONES --- */}
              <div className="relative" ref={notificationRef}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`relative hover:bg-pink-50 transition-colors ${showNotifications ? 'bg-pink-50 text-pink-600' : 'text-gray-500'}`}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                  {hasUnread && (
                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                  )}
                </Button>

                {/* Dropdown Notificaciones */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-pink-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-pink-50 bg-pink-50/30 flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                        <CalendarClock className="h-4 w-4 text-pink-500" /> Próximas Citas
                      </h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-pink-100 rounded-full" onClick={() => setShowNotifications(false)}>
                        <X className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200">
                      {citasPendientes.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                             <CheckCircle2 className="h-6 w-6 text-green-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900">¡Todo al día!</p>
                          <p className="text-xs text-gray-500 mt-1">No tienes citas pendientes para hoy.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {citasPendientes.map((cita) => (
                            <div 
                              key={cita.id} 
                              className="p-3.5 hover:bg-pink-50/50 cursor-pointer transition-all group"
                              onClick={() => {
                                navigate('/consultas');
                                setShowNotifications(false);
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm text-gray-800 truncate w-2/3 group-hover:text-pink-700 transition-colors">
                                  {cita.paciente}
                                </span>
                                <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                  {cita.fecha.toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'})}
                                </span>
                              </div>
                              <div className="flex justify-between items-end mt-2">
                                <p className="text-xs text-gray-500 line-clamp-1 w-3/4 bg-gray-50 px-1.5 py-0.5 rounded">
                                  {cita.motivo}
                                </p>
                                <div className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  {cita.hora}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {citasPendientes.length > 0 && (
                        <div className="p-2 bg-gray-50 text-center border-t border-gray-100">
                            <Button variant="link" className="text-xs text-pink-600 h-auto p-0" onClick={() => navigate('/consultas')}>
                                Ver calendario completo
                            </Button>
                        </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botón Perfil */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/perfil')} 
                title="Mi Perfil"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </Button>

              {/* Botón Admin (Solo si es Admin) */}
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

              {/* Botón Salir */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                title="Cerrar Sesión"
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
        <Outlet />
      </main>
    </div>
  );
}