import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import type { Programa } from "../types";
import { ProgramaDialog, type ProgramaFormData } from "./ProgramaDialog"; 
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Plus, Pencil, Power, Trash2, ListChecks, Users } from "lucide-react"; 
import { toast } from "sonner";

interface ProgramasListProps {
  programas: Programa[];
  onAddPrograma: (programa: ProgramaFormData) => Promise<void>;
  onEditPrograma: (id: string, programa: ProgramaFormData) => Promise<void>;
  onToggleEstado: (id: string, currentState: "ACTIVO" | "INACTIVO") => Promise<void>;
  onDeletePrograma: (id: string) => Promise<void>;
}

export function ProgramasList({
  programas,
  onAddPrograma,
  onEditPrograma,
  onToggleEstado,
  onDeletePrograma
}: ProgramasListProps) {
  const navigate = useNavigate(); // <--- Inicializamos el hook
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState<Programa | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programaToDelete, setProgramaToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingPrograma(null);
    setDialogOpen(true);
  };

  const handleEdit = (programa: Programa) => {
    setEditingPrograma(programa);
    setDialogOpen(true);
  };

  const handleSave = async (programa: ProgramaFormData) => {
    try {
      if (editingPrograma) {
        await onEditPrograma(editingPrograma.id, programa);
        toast.success("Programa actualizado exitosamente");
      } else {
        await onAddPrograma(programa);
        toast.success("Programa registrado exitosamente");
      }
      setDialogOpen(false);
      setEditingPrograma(null);
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const handleToggle = async (id: string, currentEstado: "ACTIVO" | "INACTIVO") => {
    await onToggleEstado(id, currentEstado);
    toast.success(
      currentEstado === "ACTIVO" 
        ? "Programa desactivado" 
        : "Programa activado"
    );
  };

  const confirmDelete = (id: string) => {
    setProgramaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (programaToDelete !== null) {
      await onDeletePrograma(programaToDelete);
      toast.success("Programa eliminado exitosamente");
    }
    setDeleteDialogOpen(false);
    setProgramaToDelete(null);
  };

  const activeCount = programas.filter(p => p.estado === "ACTIVO").length;
  const inactiveCount = programas.filter(p => p.estado === "INACTIVO").length;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Programas de Atención</h2>
          <p className="text-muted-foreground">
            Gestiona los programas que ofrece el centro de obstetricia
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg text-white">
          <Plus className="mr-2 size-4" />
          Nuevo Programa
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/80 backdrop-blur border-pink-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-pink-600 font-medium text-lg">Total de Programas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-pink-700">{programas.length}</span>
              <span className="text-muted-foreground text-sm">programas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-green-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-600 font-medium text-lg">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-700">{activeCount}</span>
              <span className="text-muted-foreground text-sm">en servicio</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-600 font-medium text-lg">Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-700">{inactiveCount}</span>
              <span className="text-muted-foreground text-sm">suspendidos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de programas */}
      {programas.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur border-dashed border-2">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-pink-50 rounded-full p-4">
                <ListChecks className="size-10 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">No hay programas registrados</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Comienza agregando el primer programa de atención para inscribir pacientes.
                </p>
              </div>
              <Button onClick={handleAdd} variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50">
                <Plus className="mr-2 size-4" />
                Agregar Programa
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {programas.map((programa) => (
            <Card 
              key={programa.id}
              className={`bg-white/90 backdrop-blur transition-all hover:shadow-lg border-l-4 ${
                programa.estado === "ACTIVO" ? "border-l-green-500" : "border-l-gray-300 opacity-90"
              }`}
            >
              <CardHeader className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle className="text-xl font-bold text-gray-800">
                        {programa.nombre}
                      </CardTitle>
                      <Badge 
                        variant="outline"
                        className={
                          programa.estado === "ACTIVO" 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }
                      >
                        {programa.estado}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">
                      {programa.descripcion || "Sin descripción disponible."}
                    </CardDescription>
                  </div>
                  
                  {/* --- BOTONES DE ACCIÓN --- */}
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    
                    {/* Botón NUEVO: Ver Inscritas */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/programas/${programa.id}`)}
                      title="Ver pacientes inscritas"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                    >
                      <Users className="size-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(programa)}
                      title="Editar información"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggle(programa.id, programa.estado)}
                      title={programa.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                      className={
                        programa.estado === "ACTIVO"
                          ? "border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                          : "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                      }
                    >
                      <Power className="size-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => confirmDelete(programa.id)}
                      title="Eliminar permanentemente"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <ProgramaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        programa={editingPrograma}
        onSave={handleSave} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este programa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el programa <strong>permanentemente</strong>. 
              Asegúrate de que no haya pacientes inscritas activas antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}