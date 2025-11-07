// src/pages/ProgramasPage.tsx

import { useState, useEffect } from "react";
import { ProgramasList } from "../components/ProgramasList";
import { Heart, ArrowLeft, Loader2 } from "lucide-react"; // Importar Loader2
import { Toaster, toast } from "sonner"; // Importar toast
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import type { Programa } from "../types"; // Importamos el tipo real

// Firebase
import { db } from "../lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from "firebase/firestore";

export default function ProgramasPage() {
  const navigate = useNavigate();
  
  // Estado de carga y datos reales
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // LEER (R) - Cargar programas de Firestore en tiempo real
  useEffect(() => {
    setIsLoading(true);
    const programasCollection = collection(db, "programas");
    
    const unsubscribe = onSnapshot(programasCollection, (querySnapshot) => {
      const programasList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Programa));
      setProgramas(programasList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al cargar programas: ", error);
      toast.error("Error al cargar programas.");
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpiar el listener
  }, []);

  // CREAR (C) - Función para añadir un programa
  const handleAddPrograma = async (programa: Omit<Programa, "id">) => {
    try {
      await addDoc(collection(db, "programas"), {
        ...programa,
        creado_en: Timestamp.now()
      });
      // El 'onSnapshot' se encargará de actualizar la UI
    } catch (error) {
      console.error(error);
      toast.error("Error al crear el programa.");
    }
  };

  // ACTUALIZAR (U) - Función para editar un programa
  const handleEditPrograma = async (id: string, updatedPrograma: Omit<Programa, "id">) => {
    try {
      const programDocRef = doc(db, "programas", id);
      await updateDoc(programDocRef, {
        ...updatedPrograma,
        actualizado_en: Timestamp.now()
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el programa.");
    }
  };

  // ACTUALIZAR (U) - Función para cambiar el estado (Activo/Inactivo)
  const handleToggleEstado = async (id: string, currentState: "ACTIVO" | "INACTIVO") => {
    try {
      const programDocRef = doc(db, "programas", id);
      const newState = currentState === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      await updateDoc(programDocRef, {
        estado: newState,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el estado.");
    }
  };

  // ELIMINAR (D) - Función para borrar un programa
  const handleDeletePrograma = async (id: string) => {
    try {
      const programDocRef = doc(db, "programas", id);
      await deleteDoc(programDocRef);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el programa.");
    }
  };

  // Si está cargando, muestra un spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      {/* Header (sin cambios) */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/home')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Inicio
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Heart className="size-8 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-primary">Sistema de Gestión Obstétrica</h1>
              <p className="text-muted-foreground">Administración de Programas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content (ahora pasa los handlers reales) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgramasList
          programas={programas}
          onAddPrograma={handleAddPrograma}
          onEditPrograma={handleEditPrograma}
          onToggleEstado={handleToggleEstado}
          onDeletePrograma={handleDeletePrograma}
        />
      </main>

      {/* Footer (sin cambios) */}
      <footer className="mt-12 py-6 text-center text-muted-foreground border-t border-border bg-white/50">
        <p>© 2025 Centro de Obstetricia - Todos los derechos reservados</p>
      </footer>

      <Toaster />
    </div>
  );
}