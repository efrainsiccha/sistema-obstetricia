import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Users, Calendar, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Firebase
import { db } from "../lib/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { type Programa, type Inscripcion } from "../types";

export default function ProgramaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [inscritas, setInscritas] = useState<Inscripcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        // 1. Obtener info del Programa
        const progDoc = await getDoc(doc(db, "programas", id));
        if (progDoc.exists()) {
          setPrograma({ id: progDoc.id, ...progDoc.data() } as Programa);
        } else {
          toast.error("Programa no encontrado");
          navigate("/programas");
          return;
        }

        // 2. Obtener Pacientes Inscritas
        const q = query(collection(db, "inscripciones"), where("id_programa", "==", id));
        const snapshot = await getDocs(q);
        const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Inscripcion));
        
        setInscritas(lista);

      } catch (error) {
        console.error(error);
        toast.error("Error al cargar datos");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-pink-600"/></div>;
  if (!programa) return null;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" size="sm" onClick={() => navigate('/programas')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a Programas
        </Button>
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-xl">
            <ClipboardList className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{programa.nombre}</h1>
            <p className="text-muted-foreground">{programa.descripcion}</p>
          </div>
          <Badge className={programa.estado === "ACTIVO" ? "bg-green-500" : "bg-gray-500"}>
            {programa.estado}
          </Badge>
        </div>
      </div>

      {/* Lista de Inscritas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pacientes Inscritas</CardTitle>
              <CardDescription>Listado de gestantes en seguimiento activo</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3">
              Total: {inscritas.length}
            </Badge>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay pacientes inscritas en este programa.
                  </TableCell>
                </TableRow>
              ) : (
                inscritas.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      {ins.paciente_nombre}
                    </TableCell>
                    <TableCell>{ins.paciente_dni}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {new Date((ins.fecha_inicio as any).seconds * 1000).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{ins.etapa || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={ins.estado === "ACTIVO" ? "default" : "secondary"}>
                        {ins.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(`/pacientes/${ins.paciente_dni}`)}
                      >
                        Ver Perfil
                      </Button>
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