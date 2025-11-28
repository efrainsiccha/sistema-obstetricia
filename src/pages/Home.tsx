import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Users, 
  Calendar, 
  Activity, 
  UserPlus, 
  Baby, 
  Stethoscope,
  AlertCircle,
  ArrowRight,
  Loader2,
  ClipboardList,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { ConsultasChart } from "../components/ConsultasChart";
import { useNavigate } from "react-router-dom";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function Home() {
  const navigate = useNavigate();
  const auth = getAuth();
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
  
  // Estado para los datos del gráfico
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const setupListeners = async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Averiguar rol para filtrar datos globales o personales en el dashboard
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const esAdmin = userDoc.data()?.rol === "ADMIN";

        // 1. Pacientes Activos (Global o Personal según rol)
        let qPacientes;
        if (esAdmin) {
            qPacientes = query(collection(db, "pacientes"), where("estado", "==", "ACTIVO"));
        } else {
            qPacientes = query(collection(db, "pacientes"), where("usuarioId", "==", user.uid), where("estado", "==", "ACTIVO"));
        }
        unsubs.push(onSnapshot(qPacientes, (snap) => {
          setStats(prev => ({ ...prev, pacientesActivos: snap.size }));
        }));

        // 2. Consultas (Hoy, Pendientes y Gráfico)
        let qConsultas;
        if (esAdmin) {
          qConsultas = collection(db, "consultas");
        } else {
          qConsultas = query(collection(db, "consultas"), where("usuarioId", "==", user.uid));
        }

        unsubs.push(onSnapshot(qConsultas, (snap) => {
          const now = new Date();
          const todayStr = now.toDateString(); 
          let hoyCount = 0;
          let pendientesCount = 0;

          // Preparar datos para el gráfico (Últimos 7 días)
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - 6 + i); 
            return {
              dateObj: d,
              name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
              fullDate: d.toDateString(),
              Prenatal: 0, Postparto: 0, Planificacion: 0, Otro: 0
            };
          });

          snap.forEach(doc => {
            const data = doc.data();
            const fechaTimestamp = data.fecha as Timestamp;
            const fecha = fechaTimestamp.toDate();
            const tipo = data.tipo || "OTRO";

            if (fecha.toDateString() === todayStr) hoyCount++;
            if (fecha > now) pendientesCount++;

            // Llenar gráfico
            const dayData = last7Days.find(d => d.fullDate === fecha.toDateString());
            if (dayData) {
              if (tipo === "PRENATAL") dayData.Prenatal++;
              else if (tipo === "POSTPARTO") dayData.Postparto++;
              else if (tipo === "PLANIFICACION") dayData.Planificacion++;
              else dayData.Otro++;
            }
          });

          setStats(prev => ({ ...prev, consultasHoy: hoyCount, consultasPendientes: pendientesCount }));
          setChartData(last7Days);
        }));

        // 3. Derivaciones (Dejamos global las urgentes para que todos estén atentos)
        const qDerivaciones = query(collection(db, "derivaciones"), where("prioridad", "==", "ALTA"));
        unsubs.push(onSnapshot(qDerivaciones, (snap) => {
          setStats(prev => ({ ...prev, derivacionesUrgentes: snap.size }));
          setIsLoading(false); 
        }));

      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    setupListeners();

    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  // Efecto para generar Alertas
  useEffect(() => {
    const newAlerts: { id: number; type: "ALTA" | "MEDIA"; message: string }[] = [];
    
    if (stats.derivacionesUrgentes > 0) {
      newAlerts.push({
        id: 1,
        type: "ALTA",
        message: `Hay ${stats.derivacionesUrgentes} derivaciones marcadas como urgentes.`
      });
    }

    if (stats.consultasHoy > 0) {
      newAlerts.push({
        id: 2,
        type: "MEDIA",
        message: `Tienes ${stats.consultasHoy} consultas programadas para el día de hoy.`
      });
    } else {
      newAlerts.push({
        id: 3,
        type: "MEDIA",
        message: "No hay consultas programadas para hoy."
      });
    }

    setAlerts(newAlerts);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-pink-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-pink-600" />
          <p className="mt-4 text-lg font-medium text-pink-800">Cargando sistema...</p>
        </div>
      </div>
    );
  }

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
          trend="Registrados"
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
          urgent={stats.derivacionesUrgentes > 0}
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
              {/* Pasamos los datos reales al componente del gráfico */}
              <ConsultasChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
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

      {/* --- SECCIÓN: Módulos del Sistema --- */}
      <div>
        <h2 className="text-foreground mb-6 font-medium text-lg">Módulos del Sistema</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gestión de Pacientes */}
          <Card className="hover:shadow-xl transition-all border-border/50 group cursor-pointer" onClick={() => navigate('/pacientes')}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-pink-600" />
                </div>
                <div className="flex-1">
                  <CardTitle>Pacientes</CardTitle>
                  <Badge variant="secondary" className="mt-1">{stats.pacientesActivos} activos</Badge>
                </div>
              </div>
              <CardDescription>Gestión completa del registro de pacientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Todos los Pacientes
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>

          {/* Consultas */}
          <Card className="hover:shadow-xl transition-all border-border/50 group cursor-pointer" onClick={() => navigate('/consultas')}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-rose-600" />
                </div>
                <div className="flex-1">
                  <CardTitle>Consultas</CardTitle>
                  <Badge variant="secondary" className="mt-1">{stats.consultasHoy} hoy</Badge>
                </div>
              </div>
              <CardDescription>Prenatal, postparto y atención de partos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Agenda
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>

          {/* Partos */}
          <Card className="hover:shadow-xl transition-all border-border/50 group cursor-pointer" onClick={() => navigate('/partos')}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gradient-to-br from-pink-100 to-fuchsia-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Baby className="w-7 h-7 text-pink-600" />
                </div>
                <div className="flex-1">
                  <CardTitle>Partos</CardTitle>
                  <Badge variant="secondary" className="mt-1">Registro</Badge>
                </div>
              </div>
              <CardDescription>Registro y seguimiento de nacimientos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Historial
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>

          {/* Programas */}
          <Card className="hover:shadow-xl transition-all border-border/50 group cursor-pointer" onClick={() => navigate('/programas')}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-7 h-7 text-purple-600" />
                </div>
                <div className="flex-1">
                  <CardTitle>Programas</CardTitle>
                  <Badge variant="secondary" className="mt-1">Gestión</Badge>
                </div>
              </div>
              <CardDescription>Inscripciones y planes de seguimiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                <span className="flex items-center">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Ver Programas
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>

          {/* Derivaciones */}
          <Card className="hover:shadow-xl transition-all border-border/50 group cursor-pointer" onClick={() => navigate('/derivaciones')}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gradient-to-br from-orange-100 to-pink-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-7 h-7 text-orange-600" />
                </div>
                <div className="flex-1">
                  <CardTitle>Derivaciones</CardTitle>
                  <Badge variant="destructive" className="mt-1">{stats.derivacionesUrgentes} urgentes</Badge>
                </div>
              </div>
              <CardDescription>Envío a especialistas externos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Derivaciones
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>

          {/* Diagnósticos */}
          <Card className="hover:shadow-xl transition-all border-border/50 group cursor-pointer" onClick={() => navigate('/diagnosticos')}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gradient-to-br from-indigo-100 to-pink-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Activity className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <CardTitle>Diagnósticos</CardTitle>
                  <Badge variant="secondary" className="mt-1">CIE-10</Badge>
                </div>
              </div>
              <CardDescription>Registro clínico y clasificación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                <span className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Buscar Diagnósticos
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>

          {/* --- NUEVO: REPORTE DE GESTANTES --- */}
          <Card className="hover:shadow-xl transition-all border-border/50 group cursor-pointer" onClick={() => navigate('/reportes/gestantes')}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gradient-to-br from-teal-100 to-emerald-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-7 h-7 text-teal-600" />
                </div>
                <div className="flex-1">
                  <CardTitle>Reporte Gestantes</CardTitle>
                  <Badge variant="outline" className="mt-1 border-teal-200 text-teal-700 bg-teal-50">Riesgo / EG</Badge>
                </div>
              </div>
              <CardDescription>Monitoreo de edad gestacional y riesgos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                <span className="flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Ver Reporte
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}