import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  Plus, 
  Pencil, 
  Ban, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { toast, Toaster } from "sonner";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import type { Derivacion } from "../types";

// Importamos el Diálogo de Edición
import { EditarDerivacionDialog, type DerivacionFormData } from "../components/EditarDerivacionDialog";

export function DerivacionesPage() {
  const navigate = useNavigate();
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);
  const [filteredDerivaciones, setFilteredDerivaciones] = useState<Derivacion[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Estados para Edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDerivacion, setEditingDerivacion] = useState<Derivacion | null>(null);

  // Estados para Anulación
  const [anularDialogOpen, setAnularDialogOpen] = useState(false);
  const [idToAnular, setIdToAnular] = useState<string | null>(null);

  // 1. LEER (Read)
  useEffect(() => {
    const q = query(collection(db, "derivaciones"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Derivacion));
      setDerivaciones(data);
      setFilteredDerivaciones(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtro de búsqueda
  useEffect(() => {
    const lower = search.toLowerCase();
    const filtered = derivaciones.filter(
      (d) =>
        d.paciente_nombre.toLowerCase().includes(lower) ||
        d.paciente_dni.includes(search) ||
        d.especialidad.toLowerCase().includes(lower)
    );
    setFilteredDerivaciones(filtered);
  }, [search, derivaciones]);

  // 2. EDITAR (Update)
  const handleEditClick = (derivacion: Derivacion) => {
    if (derivacion.estado === "ANULADA") {
        toast.error("No se puede editar una derivación anulada.");
        return;
    }
    setEditingDerivacion(derivacion);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, data: DerivacionFormData) => {
    try {
      const docRef = doc(db, "derivaciones", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      toast.success("Derivación actualizada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar la derivación");
    }
  };

  // 3. ANULAR (Soft Delete / Change Status)
  const handleAnularClick = (id: string, estadoActual: string) => {
    if (estadoActual === "ANULADA") return;
    setIdToAnular(id);
    setAnularDialogOpen(true);
  };

  const confirmAnular = async () => {
    if (!idToAnular) return;
    try {
      const docRef = doc(db, "derivaciones", idToAnular);
      await updateDoc(docRef, {
        estado: "ANULADA"
      });
      toast.success("Derivación anulada.");
    } catch (error) {
      console.error(error);
      toast.error("Error al anular la derivación");
    } finally {
      setAnularDialogOpen(false);
      setIdToAnular(null);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "ALTA": return "bg-red-100 text-red-800 border-red-200";
      case "MEDIA": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "COMPLETADA":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Completada</Badge>;
      case "ANULADA":
        return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600"><Ban className="w-3 h-3 mr-1"/> Anulada</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-300"><AlertCircle className="w-3 h-3 mr-1"/> Pendiente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-pink-600" onClick={() => navigate('/home')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-pink-600" />
            Derivaciones y Referencias
          </h1>
          <p className="text-muted-foreground">Gestiona las transferencias de pacientes a otras especialidades.</p>
        </div>
        
        {/* Este botón puede abrir un modal de creación o llevar a otra página */}
        <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => toast.info("Usa el botón 'Registrar Derivación' desde el perfil del paciente")}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Derivación
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Historial de Derivaciones</CardTitle>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, DNI o especialidad..."
                className="pl-8 max-w-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDerivaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron derivaciones.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDerivaciones.map((item) => (
                  <TableRow key={item.id} className={item.estado === "ANULADA" ? "opacity-60 bg-gray-50" : ""}>
                    <TableCell className="font-mono text-xs">
                       {item.fecha && (item.fecha as any).seconds 
                        ? new Date((item.fecha as any).seconds * 1000).toLocaleDateString()
                        : "N/A"
                       }
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.paciente_nombre}</span>
                        <span className="text-xs text-muted-foreground">DNI: {item.paciente_dni}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">{item.especialidad}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(item.prioridad)}>
                        {item.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.motivo}>
                      {item.motivo}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.estado)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          disabled={item.estado === "ANULADA"}
                          onClick={() => handleEditClick(item)}
                          className="h-8 w-8 hover:bg-blue-50 text-blue-600 disabled:opacity-30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Anular"
                          disabled={item.estado === "ANULADA"}
                          onClick={() => handleAnularClick(item.id, item.estado)}
                          className="h-8 w-8 hover:bg-red-50 text-red-600 disabled:opacity-30"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Componente Dialog Editar */}
      <EditarDerivacionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        derivacion={editingDerivacion}
        onSave={handleSaveEdit}
      />

      {/* Alerta de Confirmación para Anular */}
      <AlertDialog open={anularDialogOpen} onOpenChange={setAnularDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de anular esta derivación?</AlertDialogTitle>
            <AlertDialogDescription>
              La derivación pasará a estado "ANULADA". Quedará en el historial pero no será válida para atención.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAnular} className="bg-red-600 hover:bg-red-700">
              Sí, Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
}