import { useState } from 'react';
import { PatientRegistrationForm } from '../components/PatientRegistrationForm';
import { PatientsTable } from '../components/PatientsTable';
import { Heart, Users, Activity, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Toaster } from '../components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

interface Patient {
  id_paciente: number;
  doc_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  telefono: string;
  direccion: string;
  sucursal: string;
  estado: string;
}

// Datos de ejemplo (mock data)
const initialPatients: Patient[] = [
  {
    id_paciente: 1,
    doc_identidad: '45678912',
    nombres: 'María Elena',
    apellidos: 'García Rodríguez',
    fecha_nacimiento: '1992-05-15',
    telefono: '987654321',
    direccion: 'Av. Las Flores 234, San Isidro',
    sucursal: 'Centro Materno - Lima Centro',
    estado: 'ACTIVO'
  },
  {
    id_paciente: 2,
    doc_identidad: '42356789',
    nombres: 'Ana Sofía',
    apellidos: 'Pérez López',
    fecha_nacimiento: '1988-11-23',
    telefono: '965432178',
    direccion: 'Jr. Los Olivos 567, Miraflores',
    sucursal: 'Centro Vida - Miraflores',
    estado: 'ACTIVO'
  },
  {
    id_paciente: 3,
    doc_identidad: '48765432',
    nombres: 'Carmen Rosa',
    apellidos: 'Díaz Fernández',
    fecha_nacimiento: '1995-03-08',
    telefono: '998877665',
    direccion: 'Calle Las Palmeras 890, Surco',
    sucursal: 'Maternal Care - Surco',
    estado: 'ACTIVO'
  },
  {
    id_paciente: 4,
    doc_identidad: '41234567',
    nombres: 'Lucía Fernanda',
    apellidos: 'Torres Mendoza',
    fecha_nacimiento: '1990-07-19',
    telefono: '945678123',
    direccion: 'Av. Javier Prado 456, San Isidro',
    sucursal: 'Clínica Esperanza - San Isidro',
    estado: 'ACTIVO'
  },
  {
    id_paciente: 5,
    doc_identidad: '46789123',
    nombres: 'Isabella',
    apellidos: 'Ramírez Castro',
    fecha_nacimiento: '1993-09-12',
    telefono: '',
    direccion: 'Jr. Las Camelias 123, San Isidro',
    sucursal: 'Centro Materno - Lima Centro',
    estado: 'ACTIVO'
  }
];

function PacientesPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>(initialPatients);

  const handleAddPatient = (newPatientData: any) => {
    const sucursalNames: { [key: string]: string } = {
      '1': 'Centro Materno - Lima Centro',
      '2': 'Clínica Esperanza - San Isidro',
      '3': 'Centro Vida - Miraflores',
      '4': 'Maternal Care - Surco'
    };

    const newPatient: Patient = {
      id_paciente: patients.length + 1,
      doc_identidad: newPatientData.doc_identidad,
      nombres: newPatientData.nombres,
      apellidos: newPatientData.apellidos,
      fecha_nacimiento: newPatientData.fecha_nacimiento,
      telefono: newPatientData.telefono,
      direccion: newPatientData.direccion,
      sucursal: sucursalNames[newPatientData.id_sucursal],
      estado: 'ACTIVO'
    };

    setPatients([newPatient, ...patients]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/home')}
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
            <PatientRegistrationForm onAddPatient={handleAddPatient} />
          </div>
        </div>
      </header>

      {/* Main Content */}
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
                  <p className="text-green-700 mt-1">
                    {patients.filter(p => p.estado === 'ACTIVO').length}
                  </p>
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
                  <p className="text-blue-700 mt-1">4</p>
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
            <PatientsTable patients={patients} />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
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
