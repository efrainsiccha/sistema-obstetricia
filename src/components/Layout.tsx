import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { app, db } from "../lib/firebaseConfig";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Baby, 
  Bell, 
  Settings, 
  LogOut, 
  Shield, 
  Activity 
} from "lucide-react";

// Definimos el tipo para nuestros datos de usuario
type UserData = {
  nombre?: string;
  rol: "ADMIN" | "OBSTETRA";
  sucursal?: string;
  email: string;
};

export default function Layout() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para verificar la sesión y obtener datos del usuario
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
        // No hay usuario, a la calle
        navigate("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Función de Logout
  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      toast.error("Error al cerrar sesión.");
    }
  };

  // Pantalla de carga mientras verificamos todo
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <Activity className="w-10 h-10 text-primary animate-spin" />
        <p className="ml-4 text-lg text-foreground">Cargando...</p>
      </div>
    );
  }

  // Si ya cargó y no hay datos, no mostramos nada
  if (!userData || !authUser) {
    return null; 
  }

  // Si todo está bien, mostramos el Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* 1. EL HEADER / BANNER (Ahora vive aquí) */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y Nombre */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-pink-400 rounded-xl p-2.5 shadow-lg">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-primary">Sistema de Obstetricia</h1>
                <p className="text-muted-foreground text-sm">{userData.sucursal || "Sucursal no asignada"}</p>
              </div>
            </div>
            
            {/* Info de Usuario y Botones */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-foreground">{userData.nombre || authUser.email}</p>
                <Badge variant="secondary" className="text-xs">
                  {userData.rol}
                </Badge>
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>

              {/* Botón de Admin (Condicional) */}
              {userData.rol === "ADMIN" && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/admin')}
                  title="Panel de Administración"
                >
                  <Shield className="w-5 h-5 text-primary" />
                </Button>
              )}

              {/* Botón de Logout */}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
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