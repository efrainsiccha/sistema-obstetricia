import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast, Toaster } from "sonner";
import { User, Lock, Phone, Mail, CreditCard, MapPin, Clock, ArrowLeft } from "lucide-react";
import { Badge } from "../components/ui/badge";

// Firebase
import { getAuth, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";

export default function PerfilPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para formularios
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setNewPhone(data.telefono || "");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error cargando perfil");
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, [user]);

  // Actualizar Teléfono
  const handleUpdatePhone = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "usuarios", user.uid), {
        telefono: newPhone
      });
      toast.success("Teléfono actualizado");
    } catch (error) {
      toast.error("Error al actualizar teléfono");
    }
  };

  // Cambiar Contraseña
  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      await updatePassword(user, newPassword);
      toast.success("Contraseña actualizada exitosamente");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Por seguridad, debes volver a iniciar sesión para cambiar la contraseña.");
      } else {
        toast.error("Error al cambiar contraseña.");
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center">Cargando perfil...</div>;
  if (!userData) return <div className="p-8 text-center">No se encontró el usuario.</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="gap-2 mb-2">
          <ArrowLeft className="h-4 w-4" /> Volver al Inicio
        </Button>
        <h1 className="text-2xl font-bold text-primary">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta de Identidad */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto bg-pink-100 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-2">
              <User className="h-10 w-10 text-pink-600" />
            </div>
            <CardTitle className="text-lg">{userData.nombre}</CardTitle>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="secondary">{userData.rol}</Badge>
              <Badge variant={userData.estado === "ACTIVO" ? "default" : "destructive"}>
                {userData.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" /> {userData.email}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard className="h-4 w-4" /> {userData.dni || "Sin DNI"}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" /> {userData.sucursal || "Sin Sucursal"}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" /> Jornada: {userData.jornada || "No definida"}
            </div>
            {userData.colegiatura && (
              <div className="bg-gray-100 p-2 rounded text-center font-mono text-xs mt-2">
                Colegiatura: {userData.colegiatura}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formularios de Edición */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Datos de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" /> Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="phone">Teléfono Celular</Label>
                <div className="flex gap-2">
                  <Input 
                    id="phone" 
                    value={newPhone} 
                    onChange={(e) => setNewPhone(e.target.value)} 
                  />
                  <Button onClick={handleUpdatePhone} variant="outline">Actualizar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <Lock className="h-5 w-5" /> Seguridad
              </CardTitle>
              <CardDescription>Cambiar contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="pass">Nueva Contraseña</Label>
                <Input 
                  id="pass" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="confirm">Confirmar Contraseña</Label>
                <Input 
                  id="confirm" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
              </div>
              <Button 
                onClick={handleChangePassword} 
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!newPassword || !confirmPassword}
              >
                Cambiar Contraseña
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}