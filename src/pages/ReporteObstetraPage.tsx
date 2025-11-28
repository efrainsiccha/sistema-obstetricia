import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { 
  ArrowLeft, 
  Baby, 
  Stethoscope, 
  FileBarChart, 
  Loader2, 
  Calendar 
} from "lucide-react";
import { toast } from "sonner";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, query, where, getDocs} from "firebase/firestore";
import { type Parto, type Consulta } from "../types";

// Tipo para el selector de usuarios
interface Professional {
  id: string;
  nombre: string;
  rol: string;
}

export default function ReporteObstetraPage() {
  const navigate = useNavigate();
  
  // Estados
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProId, setSelectedProId] = useState<string>("");
  const [selectedProName, setSelectedProName] = useState<string>("");
  
  const [partos, setPartos] = useState<Parto[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  
  const [isLoadingPros, setIsLoadingPros] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 1. Cargar lista de profesionales (Usuarios)
  useEffect(() => {
    const fetchPros = async () => {
      try {
        const q = query(collection(db, "usuarios")); // Traemos todos, o podrías filtrar por rol
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre || "Sin Nombre",
          rol: doc.data().rol || "USUARIO"
        }));
        setProfessionals(list);
      } catch (error) {
        console.error("Error cargando profesionales:", error);
        toast.error("Error al cargar la lista de personal.");
      }
      setIsLoadingPros(false);
    };
    fetchPros();
  }, []);

  // 2. Cargar datos cuando se selecciona un profesional
  useEffect(() => {
    if (!selectedProId) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Obtener nombre del profesional seleccionado
        const pro = professionals.find(p => p.id === selectedProId);
        if (pro) setSelectedProName(pro.nombre);

        // A. Cargar Partos de este usuario
        // Nota: Asegúrate de tener el índice compuesto si Firebase lo pide (usuarioId + fecha_parto)
        // Si da error de índice, quita el 'orderBy' temporalmente o crea el índice en el link de la consola.
        const qPartos = query(
          collection(db, "partos"), 
          where("usuarioId", "==", selectedProId)
        );
        const snapPartos = await getDocs(qPartos);
        const listPartos = snapPartos.docs.map(d => ({ id: d.id, ...d.data() } as Parto));
        // Ordenamos en cliente para evitar bloqueo de índice al inicio
        listPartos.sort((a, b) => {
            const dateA = a.fecha_parto ? new Date((a.fecha_parto as any).seconds * 1000) : new Date();
            const dateB = b.fecha_parto ? new Date((b.fecha_parto as any).seconds * 1000) : new Date();
            return dateB.getTime() - dateA.getTime();
        });
        setPartos(listPartos);

        // B. Cargar Consultas de este usuario
        const qConsultas = query(
          collection(db, "consultas"), 
          where("usuarioId", "==", selectedProId)
        );
        const snapConsultas = await getDocs(qConsultas);
        const listConsultas = snapConsultas.docs.map(d => ({ id: d.id, ...d.data() } as Consulta));
        // Ordenamos en cliente
        listConsultas.sort((a, b) => {
            const dateA = a.fecha ? new Date((a.fecha as any).seconds * 1000) : new Date();
            const dateB = b.fecha ? new Date((b.fecha as any).seconds * 1000) : new Date();
            return dateB.getTime() - dateA.getTime();
        });
        setConsultas(listConsultas);

      } catch (error) {
        console.error("Error cargando reporte:", error);
        toast.error("Error al generar el reporte.");
      }
      setIsLoadingData(false);
    };

    fetchData();
  }, [selectedProId, professionals]);

  // Helpers de formato
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/home')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver al Inicio
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-xl">
            <FileBarChart className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes por Profesional</h1>
            <p className="text-muted-foreground">Auditoría y seguimiento de productividad</p>
          </div>
        </div>
      </div>

      {/* Selector de Profesional */}
      <Card className="mb-8 border-purple-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="max-w-md">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Seleccionar Profesional
            </label>
            <Select onValueChange={setSelectedProId} disabled={isLoadingPros}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPros ? "Cargando lista..." : "Buscar obstetra o médico..."} />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((pro) => (
                  <SelectItem key={pro.id} value={pro.id}>
                    {pro.nombre} <span className="text-muted-foreground text-xs ml-2">({pro.rol})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Reporte */}
      {selectedProId && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {isLoadingData ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {/* Resumen de Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">Profesional</p>
                    <h3 className="text-xl font-bold text-gray-900 truncate" title={selectedProName}>
                      {selectedProName}
                    </h3>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-pink-500 shadow-sm">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Partos Atendidos</p>
                      <h3 className="text-3xl font-bold text-pink-600">{partos.length}</h3>
                    </div>
                    <Baby className="h-8 w-8 text-pink-200" />
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Consultas Realizadas</p>
                      <h3 className="text-3xl font-bold text-blue-600">{consultas.length}</h3>
                    </div>
                    <Stethoscope className="h-8 w-8 text-blue-200" />
                  </CardContent>
                </Card>
              </div>

              {/* Tablas de Detalle */}
              <Tabs defaultValue="partos" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                  <TabsTrigger value="partos">Partos ({partos.length})</TabsTrigger>
                  <TabsTrigger value="consultas">Consultas ({consultas.length})</TabsTrigger>
                </TabsList>

                {/* Tabla de Partos */}
                <TabsContent value="partos">
                  <Card>
                    <CardHeader>
                      <CardTitle>Registro de Partos</CardTitle>
                      <CardDescription>Partos atendidos por {selectedProName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>RN Sexo/Peso</TableHead>
                            <TableHead>Lugar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partos.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Sin registros encontrados.
                              </TableCell>
                            </TableRow>
                          ) : (
                            partos.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground"/>
                                  {formatDate(p.fecha_parto)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{p.paciente_nombres} {p.paciente_apellidos}</span>
                                    <span className="text-xs text-muted-foreground">{p.paciente_dni}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={p.tipo_parto === "CESAREA" ? "secondary" : "default"}>
                                    {p.tipo_parto}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {p.sexo_recien_nacido} / {p.peso_recien_nacido}g
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {p.lugar}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tabla de Consultas */}
                <TabsContent value="consultas">
                  <Card>
                    <CardHeader>
                      <CardTitle>Registro de Consultas</CardTitle>
                      <CardDescription>Atenciones realizadas por {selectedProName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Motivo/Diagnóstico</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {consultas.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                Sin registros encontrados.
                              </TableCell>
                            </TableRow>
                          ) : (
                            consultas.map((c) => (
                              <TableRow key={c.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground"/>
                                  {formatDate(c.fecha)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{c.paciente_nombre_completo}</span>
                                    <span className="text-xs text-muted-foreground">{c.paciente_dni}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{c.tipo}</Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  <span className="font-medium block truncate">{c.motivo}</span>
                                  <span className="text-xs text-muted-foreground truncate">{c.diagnostico}</span>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      )}
    </div>
  );
}