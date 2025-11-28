import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  BarChart3, 
  Award, 
  Stethoscope, 
  Baby,
  Printer
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Loader2 } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

// Tipos para los gráficos
interface ProductividadData {
  nombre: string;
  consultas: number;
  partos: number;
  total: number;
}

const COLORS = ['#be185d', '#db2777', '#f472b6', '#fbcfe8', '#8884d8', '#82ca9d'];

export default function ReportePersonalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataProductividad, setDataProductividad] = useState<ProductividadData[]>([]);
  const [topPerformer, setTopPerformer] = useState<{nombre: string, total: number} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener Usuarios (Solo Obstetras)
        const usersSnap = await getDocs(query(collection(db, "usuarios"), where("rol", "==", "OBSTETRA")));
        const userMap = new Map<string, string>(); // ID -> Nombre
        
        usersSnap.forEach(doc => {
          const data = doc.data();
          userMap.set(doc.id, data.nombre || "Sin Nombre");
        });

        // 2. Obtener Consultas
        const consultasSnap = await getDocs(collection(db, "consultas"));
        
        // 3. Obtener Partos
        const partosSnap = await getDocs(collection(db, "partos"));

        // 4. Procesar Datos
        const conteo = new Map<string, {consultas: number, partos: number}>();

        // Inicializar contadores
        for (const id of userMap.keys()) {
          conteo.set(id, { consultas: 0, partos: 0 });
        }

        // Contar Consultas
        consultasSnap.forEach(doc => {
          const uid = doc.data().usuarioId;
          if (conteo.has(uid)) {
            const current = conteo.get(uid)!;
            conteo.set(uid, { ...current, consultas: current.consultas + 1 });
          }
        });

        // Contar Partos
        partosSnap.forEach(doc => {
          const uid = doc.data().usuarioId;
          if (conteo.has(uid)) {
            const current = conteo.get(uid)!;
            conteo.set(uid, { ...current, partos: current.partos + 1 });
          }
        });

        // 5. Formatear para Recharts
        const formattedData: ProductividadData[] = [];
        let maxTotal = -1;
        let bestDoc = "";

        conteo.forEach((val, key) => {
          const nombreCompleto = userMap.get(key) || "Desconocido";
          const total = val.consultas + val.partos;
          
          if (total > maxTotal) {
            maxTotal = total;
            bestDoc = nombreCompleto;
          }

          // --- CORRECCIÓN AQUÍ: LOGICA DE NOMBRE ---
          // Quitamos prefijos como "Dra.", "Obsta.", "Lic." para el gráfico
          // Y tomamos las primeras 2 palabras útiles (Nombre + Apellido)
          const partes = nombreCompleto.split(" ");
          // Filtramos palabras que tengan punto "." (títulos) o sean muy cortas al inicio
          const partesUtiles = partes.filter(p => !p.includes("."));
          
          // Tomamos máximo 2 palabras (Ej: "Gaby Palacios")
          const nombreGrafico = partesUtiles.slice(0, 2).join(" ") || nombreCompleto;

          // Solo mostramos si tienen al menos 1 actividad
          if (total > 0) {
             formattedData.push({
                nombre: nombreGrafico, 
                consultas: val.consultas,
                partos: val.partos,
                total: total
             });
          }
        });

        // Ordenar por productividad descendente
        formattedData.sort((a, b) => b.total - a.total);

        setDataProductividad(formattedData);
        setTopPerformer({ nombre: bestDoc, total: maxTotal });

      } catch (error) {
        console.error("Error calculando reporte:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-pink-600"/></div>;
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" className="pl-0 hover:bg-transparent text-gray-500" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Admin
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mt-2">
            <BarChart3 className="h-8 w-8 text-pink-600" />
            Reporte de Productividad
          </h1>
          <p className="text-muted-foreground">Métricas de desempeño del personal médico.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Reporte
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" /> Empleado del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Aquí usamos el nombre completo original para dar crédito */}
            <div className="text-2xl font-bold text-gray-800 line-clamp-1" title={topPerformer?.nombre}>
                {topPerformer?.nombre || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">{topPerformer?.total} atenciones totales</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Baby className="h-4 w-4 text-pink-600" /> Mayor N° Partos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
               const topPartos = [...dataProductividad].sort((a,b) => b.partos - a.partos)[0];
               return (
                 <>
                   <div className="text-2xl font-bold text-gray-800 line-clamp-1">{topPartos?.nombre || "-"}</div>
                   <p className="text-xs text-muted-foreground">{topPartos?.partos || 0} nacimientos atendidos</p>
                 </>
               )
            })()}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-600" /> Mayor N° Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
             {(() => {
               const topConsultas = [...dataProductividad].sort((a,b) => b.consultas - a.consultas)[0];
               return (
                 <>
                   <div className="text-2xl font-bold text-gray-800 line-clamp-1">{topConsultas?.nombre || "-"}</div>
                   <p className="text-xs text-muted-foreground">{topConsultas?.consultas || 0} pacientes atendidas</p>
                 </>
               )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal: Barras Apiladas */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Carga de Trabajo por Obstetra</CardTitle>
          <CardDescription>Comparativa de Consultas vs. Partos atendidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataProductividad}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Bar dataKey="consultas" name="Consultas" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={40} />
                <Bar dataKey="partos" name="Partos" stackId="a" fill="#db2777" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Secundario: Distribución Total */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
            <CardHeader><CardTitle>Distribución de Partos</CardTitle><CardDescription>¿Quién está atendiendo más nacimientos?</CardDescription></CardHeader>
            <CardContent>
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={dataProductividad.filter(d => d.partos > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="partos"
                          nameKey="nombre"
                       >
                          {/* Usamos guión bajo para ignorar variable no usada */}
                          {dataProductividad.map((_, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader><CardTitle>Resumen Textual</CardTitle><CardDescription>Detalle numérico</CardDescription></CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {dataProductividad.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                           <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                              {idx + 1}
                           </div>
                           <span className="font-medium text-gray-800">{item.nombre}</span>
                        </div>
                        <div className="text-right text-sm">
                           <span className="block font-bold text-gray-900">{item.total} actividades</span>
                           <span className="text-xs text-muted-foreground">{item.partos} partos, {item.consultas} consultas</span>
                        </div>
                     </div>
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>

    </div>
  );
}