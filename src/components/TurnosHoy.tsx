import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Sun, Sunset, Moon, Shield, Clock } from "lucide-react";

// Reutilizamos el tipo que ya definiste en AdminPage o types
type FirestoreUser = {
  id: string;
  nombre?: string;
  rol: "ADMIN" | "OBSTETRA";
  estado: "ACTIVO" | "INACTIVO";
  sucursal?: string;
  jornada?: string; // MAÑANA, TARDE, NOCHE, GUARDIA
  fotoUrl?: string; // Opcional si tienes fotos
};

interface Props {
  usuarios: FirestoreUser[];
}

export function TurnosHoy({ usuarios }: Props) {
  // 1. Filtramos solo Obstetras Activos
  const obstetras = usuarios.filter(u => u.rol === "OBSTETRA" && u.estado === "ACTIVO");

  // 2. Agrupamos por Jornada
  const manana = obstetras.filter(u => u.jornada === "MAÑANA");
  const tarde = obstetras.filter(u => u.jornada === "TARDE");
  const noche = obstetras.filter(u => u.jornada === "NOCHE");
  const guardia = obstetras.filter(u => u.jornada === "GUARDIA");

  // 3. Determinar turno actual (Lógica simple basada en hora)
  const currentHour = new Date().getHours();
  let currentTurno = "";
  
  if (currentHour >= 7 && currentHour < 13) currentTurno = "MAÑANA";
  else if (currentHour >= 13 && currentHour < 19) currentTurno = "TARDE";
  else currentTurno = "NOCHE"; 
  // Guardia suele ser solapado, así que lo mostramos siempre relevante

  // Componente interno para cada tarjeta de turno
  const TurnoCard = ({ title, icon, color, list, turnoKey }: any) => {
    const isActive = currentTurno === turnoKey;

    return (
      <Card className={`border-l-4 ${isActive ? 'ring-2 ring-pink-400 shadow-lg scale-[1.02] transition-transform' : ''} ${color}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold uppercase text-gray-700 flex items-center gap-2">
              {icon} {title}
            </CardTitle>
            {isActive && (
              <Badge variant="default" className="bg-pink-600 animate-pulse text-[10px]">
                EN CURSO
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin personal asignado</p>
          ) : (
            <div className="space-y-3">
              {list.map((u: FirestoreUser) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.nombre}`} />
                    <AvatarFallback>{u.nombre?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-none">{u.nombre}</span>
                    <span className="text-[10px] text-muted-foreground">{u.sucursal || "General"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-pink-600" />
        <h3 className="text-lg font-semibold text-gray-800">Personal de Turno Hoy</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TurnoCard 
          title="Mañana (7am - 1pm)" 
          icon={<Sun className="w-4 h-4 text-orange-500" />} 
          color="border-l-orange-400 bg-orange-50/30" 
          list={manana}
          turnoKey="MAÑANA"
        />
        <TurnoCard 
          title="Tarde (1pm - 7pm)" 
          icon={<Sunset className="w-4 h-4 text-amber-600" />} 
          color="border-l-amber-500 bg-amber-50/30" 
          list={tarde}
          turnoKey="TARDE"
        />
        <TurnoCard 
          title="Noche (7pm - 7am)" 
          icon={<Moon className="w-4 h-4 text-indigo-600" />} 
          color="border-l-indigo-500 bg-indigo-50/30" 
          list={noche}
          turnoKey="NOCHE"
        />
        <TurnoCard 
          title="Guardia (24h)" 
          icon={<Shield className="w-4 h-4 text-red-600" />} 
          color="border-l-red-500 bg-red-50/30" 
          list={guardia}
          turnoKey="GUARDIA"
        />
      </div>
    </div>
  );
}