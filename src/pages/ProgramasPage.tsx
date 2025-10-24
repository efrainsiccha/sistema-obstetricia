import { useState } from "react";
import { ProgramasList } from "../components/ProgramasList";
import { Heart, ArrowLeft } from "lucide-react";
import { Toaster } from "../components/ui/sonner";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import type { Programa } from "../types";



export default function ProgramasPage() {
  const navigate = useNavigate();
  
  // Datos mock para demostración
  const [programas, setProgramas] = useState<Programa[]>([
    {
      id_programa: 1,
      nombre: "Control Prenatal",
      descripcion: "Seguimiento completo durante el embarazo con consultas mensuales y exámenes de rutina",
      estado: "ACTIVO"
    },
    {
      id_programa: 2,
      nombre: "Psicoprofilaxis Obstétrica",
      descripcion: "Preparación física y psicológica para el parto, técnicas de respiración y relajación",
      estado: "ACTIVO"
    },
    {
      id_programa: 3,
      nombre: "Control Postparto",
      descripcion: "Seguimiento de la madre después del parto, evaluación de recuperación y lactancia",
      estado: "ACTIVO"
    },
    {
      id_programa: 4,
      nombre: "Planificación Familiar",
      descripcion: "Asesoría y métodos anticonceptivos para planificación familiar responsable",
      estado: "ACTIVO"
    },
    {
      id_programa: 5,
      nombre: "Estimulación Prenatal",
      descripcion: "Programa de estimulación temprana del bebé durante el embarazo",
      estado: "INACTIVO"
    }
  ]);

  const handleAddPrograma = (programa: Omit<Programa, "id_programa">) => {
    const newPrograma: Programa = {
      ...programa,
      id_programa: Math.max(...programas.map(p => p.id_programa), 0) + 1
    };
    setProgramas([...programas, newPrograma]);
  };

  const handleEditPrograma = (id: number, updatedPrograma: Omit<Programa, "id_programa">) => {
    setProgramas(programas.map(p => 
      p.id_programa === id ? { ...updatedPrograma, id_programa: id } : p
    ));
  };

  const handleToggleEstado = (id: number) => {
    setProgramas(programas.map(p => 
      p.id_programa === id 
        ? { ...p, estado: p.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO" } 
        : p
    ));
  };

  const handleDeletePrograma = (id: number) => {
    setProgramas(programas.filter(p => p.id_programa !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgramasList
          programas={programas}
          onAddPrograma={handleAddPrograma}
          onEditPrograma={handleEditPrograma}
          onToggleEstado={handleToggleEstado}
          onDeletePrograma={handleDeletePrograma}
        />
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-muted-foreground border-t border-border bg-white/50">
        <p>© 2025 Centro de Obstetricia - Todos los derechos reservados</p>
      </footer>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
