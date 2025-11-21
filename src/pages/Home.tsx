// src/pages/Home.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  UserPlus, 
  Baby, 
  Stethoscope,
  AlertCircle,
  ArrowRight,
  Loader2
} from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { ConsultasChart } from "../components/ConsultasChart";
import { useNavigate } from "react-router-dom";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Estados para los contadores reales
  const [stats, setStats] = useState({
    pacientesActivos: 0,
    consultasHoy: 0,
    consultasPendientes: 0,
    derivacionesUrgentes: 0
  });

  // Estado para las alertas dinámicas
  const [alerts, setAlerts] = useState<{ id: number; type: "ALTA" | "MEDIA"; message: string }[]>([]);

  useEffect(() => {
    setIsLoading(true);

    // 1. Escuchar Pacientes Activos
    const qPacientes = query(collection(db, "pacientes"), where("estado", "==", "ACTIVO"));
    const unsubPacientes = onSnapshot(qPacientes, (snap) => {
      setStats(prev => ({ ...prev, pacientesActivos: snap.size }));
    });

    // 2. Escuchar Consultas (Hoy y Pendientes)
    // Traemos todas las consultas para filtrar fechas en el cliente (más fácil que índices complejos por ahora)
    const unsubConsultas = onSnapshot(collection(db, "consultas"), (snap) => {
      const now = new Date();
      const todayStr = now.toDateString(); // "Fri Nov 21 2025"

      let hoyCount = 0;
      let pendientesCount = 0;

      snap.forEach(doc => {
        const data = doc.data();
        // Convertir Timestamp a Date
        const fechaTimestamp = data.fecha as Timestamp;
        const fecha = fechaTimestamp.toDate();

        // Consultas de HOY
        if (fecha.toDateString() === todayStr) {
          hoyCount++;
        }

        // Consultas FUTURAS (Pendientes)
        // Si la fecha es mayor a "ahora"
        if (fecha > now) {
          pendientesCount++;
        }
      });

      setStats(prev => ({ 
        ...prev, 
        consultasHoy: hoyCount, 
        consultasPendientes: pendientesCount 
      }));
    });

    // 3. Escuchar Derivaciones Urgentes (Prioridad ALTA)
    // (Aunque aún no creamos el módulo, esto dejará listo el contador en 0)
    const qDerivaciones = query(collection(db, "derivaciones"), where("prioridad", "==", "ALTA"));
    const unsubDerivaciones = onSnapshot(qDerivaciones, (snap) => {
      setStats(prev => ({ ...prev, derivacionesUrgentes: snap.size }));
    });

    // Finalizar carga inicial (simbólico, ya que son listeners vivos)
    setIsLoading(false);

    // Limpiar listeners al salir
    return () => {
      unsubPacientes();
      unsubConsultas();
      unsubDerivaciones();
    };
  }, []);

  // Efecto para generar Alertas basadas en los datos
  useEffect(() => {
    const newAlerts: { id: number; type: "ALTA" | "MEDIA"; message: string }[] = [];
    
    // Alerta 1: Derivaciones Urgentes
    if (stats.derivacionesUrgentes > 0) {
      newAlerts.push({
        id: 1,
        type: "ALTA",
        message: `Hay ${stats.derivacionesUrgentes} derivaciones marcadas como urgentes.`
      });
    }

    // Alerta 2: Consultas para hoy
    if (stats.consultasHoy > 0) {
      newAlerts.push({
        id: 2,
        type: "MEDIA",
        message: `Tienes ${stats.consultasHoy} consultas programadas para el día de hoy.`
      });
    } else {
      newAlerts.push({
        id: 3,
        type: "MEDIA", // Usamos MEDIA o un color neutro
        message: "No hay consultas programadas para hoy."
      });
    }

    setAlerts(newAlerts);
  }, [stats]);

  return (
    <> 
      {/* Sección de Alertas Dinámicas */}
      <div className="mb-6 space-y-2">
        {alerts.map(alert => (
          <div 
            key={alert.id}
            className={`flex items-center gap-3 p-4 rounded-xl border ${
              alert.type === "ALTA" 
                ? "bg-red-50 border-red-200" 
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <AlertCircle className={`w-5 h-5 ${
              alert.type === "ALTA" ? "text-red-600" : "text-yellow-600"
            }`} />
            <p className="flex-1 text-sm font-medium text-gray-700">{alert.message}</p>
            <Badge variant={alert.type === "ALTA" ? "destructive" : "secondary"}>
              {alert.type}
            </Badge>
          </div>
        ))}
      </div>

      {/* Estadísticas Reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Pacientes Activos"
          value={stats.pacientesActivos}
          icon={<Users className="w-5 h-5" />}
          trend="Registrados" // Texto estático o podrías calcular crecimiento
        />
        <StatsCard
          title="Consultas Hoy"
          value={stats.consultasHoy}
          icon={<Calendar className="w-5 h-5" />}
          subtitle="Atenciones del día"
        />
        <StatsCard
          title="Consultas Pendientes"
          value={stats.consultasPendientes}
          icon={<Activity className="w-5 h-5" />}
          trend="Futuras"
        />
        <StatsCard
          title="Derivaciones Urgentes"
          value={stats.derivacionesUrgentes}
          icon={<AlertCircle className="w-5 h-5" />}
          urgent={stats.derivacionesUrgentes > 0} // Solo se pone rojo si hay > 0
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle>Consultas de la Semana</CardTitle>
              <CardDescription>Distribución por tipo de consulta</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Nota: ConsultasChart sigue usando datos mock internamente. 
                  Para hacerlo real tendríamos que editar ese componente también. */}
              <ConsultasChart />
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas (Navegación) */}
        <div className="space-y-4">
          <h3 className="text-foreground font-medium">Acciones Rápidas</h3>
          
          <Button className="w-full justify-start h-auto py-4 bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-400/90 shadow-lg transition-all hover:scale-[1.02]" onClick={() => navigate('/pacientes')}>
            <UserPlus className="w-5 h-5 mr-3 text-white" />
            <div className="text-left flex-1 text-white">
              <div className="font-semibold">Registrar Paciente</div>
              <div className="text-xs opacity-90">Nuevo ingreso al sistema</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white" />
          </Button>

          <Button className="w-full justify-start h-auto py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-500/90 hover:to-pink-500/90 shadow-lg transition-all hover:scale-[1.02]" onClick={() => navigate('/consultas')}>
            <Calendar className="w-5 h-5 mr-3 text-white" />
            <div className="text-left flex-1 text-white">
              <div className="font-semibold">Nueva Consulta</div>
              <div className="text-xs opacity-90">Programar atención</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white" />
          </Button>

          <Button className="w-full justify-start h-auto py-4 bg-gradient-to-r from-pink-600 to-pink-400 hover:from-pink-600/90 hover:to-pink-400/90 shadow-lg transition-all hover:scale-[1.02]" onClick={() => navigate('/partos')}>
            <Baby className="w-5 h-5 mr-3 text-white" />
            <div className="text-left flex-1 text-white">
              <div className="font-semibold">Registrar Parto</div>
              <div className="text-xs opacity-90">Nuevo nacimiento</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white" />
          </Button>

          <Button className="w-full justify-start h-auto py-4 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-400/90 hover:to-pink-400/90 shadow-lg transition-all hover:scale-[1.02]" onClick={() => navigate('/derivaciones')}>
            <Stethoscope className="w-5 h-5 mr-3 text-white" />
            <div className="text-left flex-1 text-white">
              <div className="font-semibold">Nueva Derivación</div>
              <div className="text-xs opacity-90">Envío a especialista</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </>
  );
}