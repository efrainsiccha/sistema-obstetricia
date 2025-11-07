// src/pages/PacientesPage.tsx

import { useState, useEffect } from 'react';
import { PatientRegistrationForm } from '../components/PatientRegistrationForm';
import { PatientsTable } from '../components/PatientsTable';
import { Heart, Users, Activity, ArrowLeft } from 'lucide-react'; 
import { Card, CardContent } from '../components/ui/card';
import { Toaster, toast } from 'sonner';
import { useNavigate } from 'react-router-dom'; 
import { Button } from '../components/ui/button';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot} from 'firebase/firestore';

// Interfaz para el paciente de Firestore
export interface Patient {
  id: string; 
  doc_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: { seconds: number; nanoseconds: number } | Date;
  telefono: string;
  direccion: string;
  sucursal_nombre: string;
  id_sucursal: string;
  estado: string;
}

function PacientesPage() {
  const navigate = useNavigate(); 
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sucursalesCount, setSucursalesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para leer pacientes en tiempo real
  useEffect(() => {
    setIsLoading(true);
    const patientsCollection = collection(db, "pacientes");
    
    const unsubscribe = onSnapshot(patientsCollection, (querySnapshot) => {
      const patientsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      setPatients(patientsList);
      setIsLoading(false);
    }, (error: any) => { 
      console.error("Error al cargar pacientes: ", error);
      toast.error("Error al cargar pacientes.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Efecto para contar sucursales
  useEffect(() => {
    const sucursalesCollection = collection(db, "sucursales");
    const unsubscribe = onSnapshot(sucursalesCollection, (querySnapshot) => {
      setSucursalesCount(querySnapshot.size);
    }, (error: any) => {
      console.error("Error al contar sucursales: ", error);
    });
    
    return () => unsubscribe();
  }, []);

  const activePatientsCount = patients.filter(p => p.estado === 'ACTIVO').length;

  return (
    // CORREGIDO: Volvemos a la estructura original con su propio <div> y <header>
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header (el que tú tenías) */}
      <header className="bg-white shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              
              {/* ¡¡AQUÍ ESTÁ TU BOTÓN!! */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/home')} // Te lleva a /home
                className="h-10 w-10 rounded-lg hover:bg-pink-100"
              >
                <ArrowLeft className="h-6 w-6 text-pink-700" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-xl shadow-lg">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-pink-900">Gestión de Pacientes</h1>
                  <p className="text-sm text-gray-600">Registro y Administración de Pacientes</p>
                </div>
              </div>
            </div>
            {/* El formulario ya no recibe 'onAddPatient' */}
            <PatientRegistrationForm /> 
          </div>
        </div>
      </header>

      {/* Main Content (con los datos reales) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-pink-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pacientes</p>
                  <p className="text-pink-700 mt-1">{patients.length}</p>
                </div>
                <div className="bg-pink-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pacientes Activas</p>
                  <p className="text-green-700 mt-1">{activePatientsCount}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sucursales</p>
                  <p className="text-blue-700 mt-1">{sucursalesCount}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Heart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patients Table */}
        <Card className="border-pink-200 bg-white shadow-md">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-pink-900 mb-1">Lista de Pacientes Registradas</h2>
              <p className="text-sm text-gray-600">
                Gestión completa de pacientes del centro obstétrico
              </p>
            </div>
            <PatientsTable patients={patients} isLoading={isLoading} />
          </CardContent>
        </Card>
      </main>

      {/* Footer (como lo tenías) */}
      <footer className="bg-white border-t border-pink-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Sistema de Gestión Obstétrica © 2025 - Cuidado y atención personalizada
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PacientesPage;