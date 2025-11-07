import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "./ui/dialog";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// Firebase
import { db } from "../lib/firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";

interface Props {
  patientId: string;
  patientName: string;
}

export function DeletePatientButton({ patientId, patientName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // 1. Apunta al documento del paciente por su ID
      const patientDocRef = doc(db, "pacientes", patientId);
      
      // 2. Borra el documento
      await deleteDoc(patientDocRef);

      toast.success(`Paciente ${patientName} eliminada exitosamente.`);
      setIsOpen(false);
    } catch (error) {
      console.error("Error al eliminar paciente: ", error);
      toast.error("Error al eliminar paciente. Inténtelo de nuevo.");
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            ¿Confirmar Eliminación?
          </DialogTitle>
          <DialogDescription className="pt-4">
            ¿Estás segura de que deseas eliminar permanentemente a la paciente
            <strong className="text-gray-900"> {patientName}</strong>?
            <br />
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sí, eliminar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}