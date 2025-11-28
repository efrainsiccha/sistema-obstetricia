import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  ClipboardList, 
  Loader2, 
  MoreHorizontal, 
  CheckCircle, 
  Ban, 
  RefreshCw 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

// Firebase
import { db } from "../lib/firebaseConfig";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { type Programa, type Inscripcion } from "../types";

export default function ProgramaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [inscritas, setInscritas] = useState<Inscripcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Cargar Datos (Tiempo Real)
  useEffect(() => {
    if (!id) return;

    const fetchPrograma = async () => {
      try {
        const progDoc = await getDoc(doc(db, "programas", id));
        if (progDoc.exists()) {
          setPrograma({ id: progDoc.id, ...progDoc.data() } as Programa);
        } else {
          toast.error("Programa no encontrado");
          navigate("/programas");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchPrograma();

    // Listener en tiempo real para las inscripciones
    const qInscripciones = query(collection(db, "inscripciones"), where("id_programa", "==", id));

    const unsubscribe = onSnapshot(qInscripciones, (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Inscripcion));
      setInscritas(lista);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  // 2. Función para Cambiar Estado
  const handleCambiarEstado = async (inscripcionId: string, nuevoEstado: "ACTIVO" | "INACTIVO" | "COMPLETADO") => {
    try {
      const ref = doc(db, "inscripciones", inscripcionId);
      await updateDoc(ref, {
        estado: nuevoEstado
      });
      toast.success(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado");
    }
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "ACTIVO": return "bg-green-100 text-green-800 hover:bg-green-200";
      case "COMPLETADO": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "INACTIVO": return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatFecha = (fecha: any) => {
    if (!fecha) return "-";
    if (fecha.seconds) return new Date(fecha.seconds * 1000).toLocaleDateString();
    return new Date(fecha).toLocaleDateString();
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-pink-600"/></div>;
  if (!programa) return null;

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/programas')} className="mb-4 gap-2 hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Volver a Programas
        </Button>
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-xl shadow-sm">
            <ClipboardList className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{programa.nombre}</h1>
            <p className="text-muted-foreground">{programa.descripcion}</p>
          </div>
          <Badge className={`ml-auto ${programa.estado === "ACTIVO" ? "bg-green-500" : "bg-gray-500"}`}>
            {programa.estado}
          </Badge>
        </div>
      </div>

      {/* Lista de Inscritas */}
      <Card className="shadow-md border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pacientes Inscritas</CardTitle>
              <CardDescription>Gestión del seguimiento de pacientes en este programa</CardDescription>
            </div>
            <div className="flex gap-2">
               <Badge variant="secondary" className="text-sm px-3 py-1">
                 Total: {inscritas.length}
               </Badge>
               <Badge variant="outline" className="text-sm px-3 py-1 bg-green-50 text-green-700 border-green-200">
                 Activas: {inscritas.filter(i => i.estado === "ACTIVO").length}
               </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Fecha Inscripción</TableHead>
                <TableHead>Etapa Actual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inscritas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 opacity-20" />
                      <p>No hay pacientes inscritas en este programa actualmente.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                inscritas.map((ins) => (
                  <TableRow key={ins.id} className={ins.estado === "INACTIVO" ? "opacity-60 bg-gray-50/50" : ""}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <div className="bg-pink-100 p-1.5 rounded-full">
                         <Users className="h-3 w-3 text-pink-600" />
                      </div>
                      {ins.paciente_nombre}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{ins.paciente_dni}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatFecha(ins.fecha_inicio)}
                      </div>
                    </TableCell>
                    <TableCell>
                        {ins.etapa ? (
                            <Badge variant="outline" className="font-normal text-xs">{ins.etapa}</Badge>
                        ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                        )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getBadgeColor(ins.estado)} border-0`}>
                        {ins.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => navigate(`/pacientes/${ins.paciente_dni}`)}>
                            <ClipboardList className="mr-2 h-4 w-4" /> Ver Expediente
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />

                          {/* Opciones de cambio de estado */}
                          {ins.estado !== "COMPLETADO" && (
                              <DropdownMenuItem 
                                onClick={() => handleCambiarEstado(ins.id, "COMPLETADO")}
                                className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" /> Marcar Completado
                              </DropdownMenuItem>
                          )}

                          {ins.estado === "ACTIVO" && (
                              <DropdownMenuItem 
                                onClick={() => handleCambiarEstado(ins.id, "INACTIVO")}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                              >
                                <Ban className="mr-2 h-4 w-4" /> Dar de Baja
                              </DropdownMenuItem>
                          )}

                          {ins.estado === "INACTIVO" && (
                              <DropdownMenuItem 
                                onClick={() => handleCambiarEstado(ins.id, "ACTIVO")}
                                className="text-green-600 focus:text-green-700 focus:bg-green-50"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" /> Reactivar
                              </DropdownMenuItem>
                          )}

                        </DropdownMenuContent>
                      </DropdownMenu>

                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}