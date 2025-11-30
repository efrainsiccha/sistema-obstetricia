import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Loader2, Users, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

interface Props {
  consultaId: string;
  fechaCita: any; // Timestamp o Date
  currentMedicoId?: string;
  onReasignacionExitosa?: () => void;
}

export function ReasignarConsultaDialog({ consultaId, fechaCita, currentMedicoId, onReasignacionExitosa }: Props) {
  const [open, setOpen] = useState(false);
  const [obstetras, setObstetras] = useState<{id: string, nombre: string, jornada: string}[]>([]);
  const [selectedMedico, setSelectedMedico] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Formatear fecha para mostrar en el título
  const fechaStr = fechaCita?.seconds 
    ? new Date(fechaCita.seconds * 1000).toLocaleString() 
    : new Date(fechaCita).toLocaleString();

  useEffect(() => {
    if (open) {
      const fetchObstetras = async () => {
        setIsLoading(true);
        try {
          // Traemos solo obstetras activos
          const q = query(
            collection(db, "usuarios"), 
            where("rol", "==", "OBSTETRA"),
            where("estado", "==", "ACTIVO")
          );
          const snapshot = await getDocs(q);
          const lista = snapshot.docs.map(d => ({
            id: d.id,
            nombre: d.data().nombre,
            jornada: d.data().jornada || "Sin turno"
          }));
          setObstetras(lista);
        } catch (error) {
          console.error(error);
          toast.error("Error al cargar personal");
        }
        setIsLoading(false);
      };
      fetchObstetras();
    }
  }, [open]);

  const handleReasignar = async () => {
    if (!selectedMedico) return;
    setIsSaving(true);
    try {
      const ref = doc(db, "consultas", consultaId);
      await updateDoc(ref, {
        usuarioId: selectedMedico // Aquí ocurre la magia: cambiamos el dueño
      });
      
      toast.success("Consulta reasignada correctamente");
      setOpen(false);
      if (onReasignacionExitosa) onReasignacionExitosa();
    } catch (error) {
      console.error(error);
      toast.error("Error al reasignar");
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" title="Reasignar a otro médico">
          <ArrowRightLeft className="w-4 h-4 mr-1" /> Reasignar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Users className="w-5 h-5" /> Reasignar Consulta
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm border">
            <p className="font-semibold text-gray-700">Datos de la Cita:</p>
            <p className="text-gray-600">{fechaStr}</p>
          </div>

          <div className="space-y-2">
            <Label>Seleccionar Nuevo Obstetra</Label>
            <Select onValueChange={setSelectedMedico} value={selectedMedico}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Cargando..." : "Seleccione profesional"} />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {obstetras.map((obs) => (
                  <SelectItem 
                    key={obs.id} 
                    value={obs.id}
                    disabled={obs.id === currentMedicoId} // No reasignar al mismo
                  >
                    {obs.nombre} ({obs.jornada})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Verifique que el turno (Jornada) coincida con la hora de la cita.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleReasignar} 
            disabled={isSaving || !selectedMedico}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}