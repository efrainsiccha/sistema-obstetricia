import { useState } from "react";
import type { Programa } from "../types";
import { ProgramaDialog } from "./ProgramaDialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Plus, Pencil, Power, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";

interface ProgramasListProps {
  programas: Programa[];
  onAddPrograma: (programa: Omit<Programa, "id_programa">) => void;
  onEditPrograma: (id: number, programa: Omit<Programa, "id_programa">) => void;
  onToggleEstado: (id: number) => void;
  onDeletePrograma: (id: number) => void;
}

export function ProgramasList({
  programas,
  onAddPrograma,
  onEditPrograma,
  onToggleEstado,
  onDeletePrograma
}: ProgramasListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState<Programa | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programaToDelete, setProgramaToDelete] = useState<number | null>(null);

  const handleAdd = () => {
    setEditingPrograma(null);
    setDialogOpen(true);
  };

  const handleEdit = (programa: Programa) => {
    setEditingPrograma(programa);
    setDialogOpen(true);
  };

  const handleSave = (programa: Omit<Programa, "id_programa">) => {
    if (editingPrograma) {
      onEditPrograma(editingPrograma.id_programa, programa);
      toast.success("Programa actualizado exitosamente");
    } else {
      onAddPrograma(programa);
      toast.success("Programa registrado exitosamente");
    }
    setDialogOpen(false);
    setEditingPrograma(null);
  };

  const handleToggle = (id: number, currentEstado: string) => {
    onToggleEstado(id);
    toast.success(
      currentEstado === "ACTIVO" 
        ? "Programa desactivado" 
        : "Programa activado"
    );
  };

  const confirmDelete = (id: number) => {
    setProgramaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (programaToDelete !== null) {
      onDeletePrograma(programaToDelete);
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
          <h2 className="text-foreground">Programas de Atención</h2>
          <p className="text-muted-foreground">
            Gestiona los programas que ofrece el centro de obstetricia
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg">
          <Plus className="mr-2 size-4" />
          Nuevo Programa
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/80 backdrop-blur border-pink-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-pink-600">Total de Programas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-pink-600">{programas.length}</span>
              <span className="text-muted-foreground">programas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-600">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-green-600">{activeCount}</span>
              <span className="text-muted-foreground">en servicio</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-600">Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-600">{inactiveCount}</span>
              <span className="text-muted-foreground">suspendidos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de programas */}
      {programas.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="bg-muted rounded-full p-4">
                <ListChecks className="size-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-foreground">No hay programas registrados</h3>
                <p className="text-muted-foreground">
                  Comienza agregando el primer programa de atención
                </p>
              </div>
              <Button onClick={handleAdd} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
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
              key={programa.id_programa} 
              className={`bg-white/80 backdrop-blur transition-all hover:shadow-md ${
                programa.estado === "INACTIVO" ? "opacity-75" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-foreground">
                        {programa.nombre}
                      </CardTitle>
                      <Badge 
                        variant={programa.estado === "ACTIVO" ? "default" : "secondary"}
                        className={
                          programa.estado === "ACTIVO" 
                            ? "bg-green-100 text-green-800 border-green-300" 
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }
                      >
                        {programa.estado}
                      </Badge>
                    </div>
                    <CardDescription>
                      {programa.descripcion || "Sin descripción"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(programa)}
                      className="hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Pencil className="size-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggle(programa.id_programa, programa.estado)}
                      className={
                        programa.estado === "ACTIVO"
                          ? "hover:bg-orange-50 hover:border-orange-300"
                          : "hover:bg-green-50 hover:border-green-300"
                      }
                    >
                      <Power 
                        className={`size-4 ${
                          programa.estado === "ACTIVO" 
                            ? "text-orange-600" 
                            : "text-green-600"
                        }`} 
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => confirmDelete(programa.id_programa)}
                      className="hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo para crear/editar */}
      <ProgramaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        programa={editingPrograma}
        onSave={handleSave}
      />

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el programa de forma permanente. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
