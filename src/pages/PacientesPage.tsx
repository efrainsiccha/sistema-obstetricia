import { useState, useEffect } from 'react';
import { PatientRegistrationForm } from '../components/PatientRegistrationForm';
import { PatientsTable } from '../components/PatientsTable';
import { Heart, Users, Activity, Home as HomeIcon } from 'lucide-react'; 
import { Card, CardContent } from '../components/ui/card';
import { Toaster, toast } from 'sonner'; 
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { type Patient } from '../types'; 

function PacientesPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sucursalesCount, setSucursalesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para leer pacientes (Con filtro por Rol)
  useEffect(() => {
    let unsubscribe: () => void;

    const setupListener = async () => {
      setIsLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        // 1. Averiguar el rol del usuario actual
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const userData = userDoc.data();
        const esAdmin = userData?.rol === "ADMIN";

        // 2. Definir la consulta
        let q;
        if (esAdmin) {
          // Si es Admin, ve TODO
          q = collection(db, "pacientes");
        } else {
          // Si es Obstetra, ve SOLO lo suyo
          q = query(collection(db, "pacientes"), where("usuarioId", "==", user.uid));
        }
        
        // 3. Escuchar cambios
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const patientsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Patient));
          setPatients(patientsList);
          setIsLoading(false);
        }, (error) => {
          console.error("Error al cargar pacientes: ", error);
          toast.error("Error al cargar pacientes.");
          setIsLoading(false);
        });

      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Contar sucursales (esto es general, no necesita filtro)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sucursales"), (snap) => {
      setSucursalesCount(snap.size);
    });
    return () => unsubscribe();
  }, []);

  const activePatientsCount = patients.filter(p => p.estado === 'ACTIVO').length;

  return (
    <>
      <Toaster position="top-right" />
      
      {/* Header de la página */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="h-10 w-10 rounded-lg hover:bg-pink-100"
          >
            <HomeIcon className="h-6 w-6 text-pink-700" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-xl shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-pink-900">Gestión de Pacientes</h1>
              <p className="text-sm text-gray-600">Registro y Administración de Pacientes</p>
            </div>
          </div>
        </div>
        <PatientRegistrationForm />
      </div>

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
    </>
  );
}

export default PacientesPage;