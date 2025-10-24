import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  UserPlus, 
  ClipboardList, 
  Baby, 
  Stethoscope,
  Bell,
  Settings,
  LogOut,
  AlertCircle,
  ArrowRight,
  MapPin
} from "lucide-react";
import { StatsCard } from "../components/StatsCard";
import { ConsultasChart } from "../components/ConsultasChart";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  // Datos mock del usuario actual
  const currentUser = {
    name: "Dr. María González",
    role: "OBSTETRA",
    sucursal: "Sucursal Centro"
  };

  // Estadísticas mock
  const stats = {
    pacientesActivos: 124,
    consultasHoy: 8,
    consultasPendientes: 15,
    derivacionesPendientes: 3
  };

  // Alertas mock
  const alerts = [
    { id: 1, type: "ALTA", message: "Derivación urgente - Paciente Ana Torres" },
    { id: 2, type: "MEDIA", message: "3 consultas prenatales programadas hoy" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-pink-400 rounded-xl p-2.5 shadow-lg">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-primary">Sistema de Obstetricia</h1>
                <p className="text-muted-foreground text-sm">{currentUser.sucursal}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-foreground">{currentUser.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {currentUser.role}
                </Badge>
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/login')}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Alertas */}
        {alerts.length > 0 && (
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
                <p className="flex-1">{alert.message}</p>
                <Badge variant={alert.type === "ALTA" ? "destructive" : "secondary"}>
                  {alert.type}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pacientes Activos"
            value={stats.pacientesActivos}
            icon={<Users className="w-5 h-5" />}
            trend="+12%"
            trendUp={true}
          />
          <StatsCard
            title="Consultas Hoy"
            value={stats.consultasHoy}
            icon={<Calendar className="w-5 h-5" />}
            subtitle="15 programadas"
          />
          <StatsCard
            title="Consultas Pendientes"
            value={stats.consultasPendientes}
            icon={<Activity className="w-5 h-5" />}
            trend="Próximas 7 días"
          />
          <StatsCard
            title="Derivaciones Urgentes"
            value={stats.derivacionesPendientes}
            icon={<AlertCircle className="w-5 h-5" />}
            urgent={true}
          />
        </div>

        {/* Layout Principal: Gráfico + Accesos Rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Consultas */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle>Consultas de la Semana</CardTitle>
                <CardDescription>Distribución por tipo de consulta</CardDescription>
              </CardHeader>
              <CardContent>
                <ConsultasChart />
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <div className="space-y-4">
            <h3 className="text-foreground">Acciones Rápidas</h3>
            
            <Button className="w-full justify-start h-auto py-4 bg-gradient-to-r from-primary to-pink-400 hover:from-primary/90 hover:to-pink-400/90 shadow-lg">
              <UserPlus className="w-5 h-5 mr-3" />
              <div className="text-left flex-1">
                <div>Registrar Paciente</div>
                <div className="text-xs opacity-90">Nuevo ingreso al sistema</div>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button className="w-full justify-start h-auto py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-500/90 hover:to-pink-500/90 shadow-lg">
              <Calendar className="w-5 h-5 mr-3" />
              <div className="text-left flex-1">
                <div>Nueva Consulta</div>
                <div className="text-xs opacity-90">Programar atención</div>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button className="w-full justify-start h-auto py-4 bg-gradient-to-r from-pink-600 to-pink-400 hover:from-pink-600/90 hover:to-pink-400/90 shadow-lg">
              <Baby className="w-5 h-5 mr-3" />
              <div className="text-left flex-1">
                <div>Registrar Parto</div>
                <div className="text-xs opacity-90">Nuevo nacimiento</div>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button className="w-full justify-start h-auto py-4 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-400/90 hover:to-pink-400/90 shadow-lg">
              <Stethoscope className="w-5 h-5 mr-3" />
              <div className="text-left flex-1">
                <div>Nueva Derivación</div>
                <div className="text-xs opacity-90">Envío a especialista</div>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Módulos del Sistema - Simplificado */}
        <div>
          <h2 className="text-foreground mb-6">Módulos del Sistema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gestión de Pacientes */}
            <Card className="hover:shadow-xl transition-all border-border/50 group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Pacientes</CardTitle>
                    <Badge variant="secondary" className="mt-1">124 activos</Badge>
                  </div>
                </div>
                <CardDescription>Gestión completa del registro de pacientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate('/pacientes')}>
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Todos los Pacientes
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>

            {/* Consultas */}
            <Card className="hover:shadow-xl transition-all border-border/50 group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Calendar className="w-7 h-7 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Consultas</CardTitle>
                    <Badge variant="secondary" className="mt-1">8 hoy</Badge>
                  </div>
                </div>
                <CardDescription>Prenatal, postparto y atención de partos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate('/consultas')}>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Agenda
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>

            {/* Partos */}
            <Card className="hover:shadow-xl transition-all border-border/50 group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-gradient-to-br from-pink-100 to-fuchsia-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Baby className="w-7 h-7 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Partos</CardTitle>
                    <Badge variant="secondary" className="mt-1">45 este mes</Badge>
                  </div>
                </div>
                <CardDescription>Registro y seguimiento de nacimientos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate('/partos')}>
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Historial
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>

            {/* Programas */}
            <Card className="hover:shadow-xl transition-all border-border/50 group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <ClipboardList className="w-7 h-7 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Programas</CardTitle>
                    <Badge variant="secondary" className="mt-1">6 programas</Badge>
                  </div>
                </div>
                <CardDescription>Inscripciones y planes de seguimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate('/programas')}>
                  <span className="flex items-center">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Ver Programas
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>

            {/* Derivaciones */}
            <Card className="hover:shadow-xl transition-all border-border/50 group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-gradient-to-br from-orange-100 to-pink-100 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-7 h-7 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Derivaciones</CardTitle>
                    <Badge variant="destructive" className="mt-1">3 urgentes</Badge>
                  </div>
                </div>
                <CardDescription>Envío a especialistas externos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate('/derivaciones')}>
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Derivaciones
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>

            {/* Diagnósticos */}
            <Card className="hover:shadow-xl transition-all border-border/50 group">
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
                <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate('/diagnosticos')}>
                  <span className="flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Buscar Diagnósticos
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Módulo de Administración (solo para ADMIN) */}
        {currentUser.role === "ADMIN" && (
          <div className="mt-8">
            <h2 className="text-foreground mb-6">Administración del Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-xl transition-all border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-gradient-to-br from-gray-100 to-pink-100 p-4 rounded-2xl">
                      <Users className="w-7 h-7 text-gray-600" />
                    </div>
                    <CardTitle>Usuarios</CardTitle>
                  </div>
                  <CardDescription>Gestión de personal del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Administrar
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-gradient-to-br from-gray-100 to-pink-100 p-4 rounded-2xl">
                      <MapPin className="w-7 h-7 text-gray-600" />
                    </div>
                    <CardTitle>Sucursales</CardTitle>
                  </div>
                  <CardDescription>Gestión de establecimientos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Ver Sucursales
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-gradient-to-br from-gray-100 to-pink-100 p-4 rounded-2xl">
                      <Stethoscope className="w-7 h-7 text-gray-600" />
                    </div>
                    <CardTitle>Especialistas</CardTitle>
                  </div>
                  <CardDescription>Directorio de especialistas externos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary">
                    <span className="flex items-center">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Ver Directorio
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
