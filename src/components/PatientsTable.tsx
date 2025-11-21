// src/components/PatientsTable.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Importante para navegar
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button'; // Importamos Button
// Iconos
import { Search, Phone, MapPin, Calendar, Loader2, Mail, User, FileText } from 'lucide-react';

import { type Patient } from '../types'; 
import { DeletePatientButton } from './DeletePatientButton';
import { EditPatientDialog } from './EditPatientDialog'; 

interface Props {
  patients: Patient[];
  isLoading: boolean;
}

export function PatientsTable({ patients, isLoading }: Props) {
  const navigate = useNavigate(); // Hook para navegar
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.nombres.toLowerCase().includes(searchLower) ||
      patient.apellidos.toLowerCase().includes(searchLower) ||
      patient.doc_identidad.includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchLower))
    );
  });

  // Funciones auxiliares de fecha
  const toDate = (timestamp: { seconds: number; nanoseconds: number } | Date): Date => {
    if (timestamp instanceof Date) return timestamp;
    if (!timestamp) return new Date(); 
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  };

  const calculateAge = (dateOfBirth: { seconds: number; nanoseconds: number } | Date) => {
    const birthDate = toDate(dateOfBirth);
    if (!birthDate) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateTimestamp: { seconds: number; nanoseconds: number } | Date) => {
    const date = toDate(dateTimestamp);
    if (!date) return "Fecha inválida";
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const maskDocument = (doc: string) => {
    if (!doc || doc.length <= 4) return doc || 'N/A';
    return doc.slice(0, 2) + '***' + doc.slice(-2);
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <Input
          placeholder="Buscar por nombre, dni o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 bg-white border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
        />
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-pink-50">
            <TableRow>
              <TableHead className="text-pink-900 w-[100px]">Doc.</TableHead>
              <TableHead className="text-pink-900">Paciente</TableHead>
              <TableHead className="text-pink-900">Edad / Nac.</TableHead>
              <TableHead className="text-pink-900">Contacto</TableHead>
              <TableHead className="text-pink-900 hidden md:table-cell">Sucursal</TableHead>
              <TableHead className="text-pink-900">Estado</TableHead>
              <TableHead className="text-pink-900 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 text-pink-500 animate-spin" />
                  Cargando pacientes...
                </TableCell>
              </TableRow>
            ) : filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  No se encontraron pacientes.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-pink-50/50">
                  
                  {/* Columna 1: Documento */}
                  <TableCell className="font-mono text-gray-600 text-sm">
                    {maskDocument(patient.doc_identidad)}
                  </TableCell>
                  
                  {/* Columna 2: Paciente */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{patient.nombres} {patient.apellidos}</span>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1" title={patient.sexo === 'F' ? 'Femenino' : 'Masculino'}>
                          <User className="h-3 w-3 text-pink-400" /> 
                          {patient.sexo}
                        </span>
                        {patient.grupo_sanguineo && (
                          <span className="bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded-full font-medium text-[10px]">
                            {patient.grupo_sanguineo}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Columna 3: Edad y Nacimiento */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">{calculateAge(patient.fecha_nacimiento)} años</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(patient.fecha_nacimiento)}
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* Columna 4: Contacto */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {patient.telefono && (
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Phone className="h-3 w-3 text-pink-500" /> {patient.telefono}
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 truncate max-w-[150px]" title={patient.email}>
                          <Mail className="h-3 w-3 text-pink-400" /> {patient.email}
                        </div>
                      )}
                      {patient.contacto_emergencia && (
                         <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[150px]" title={`Emergencia: ${patient.contacto_emergencia}`}>
                           CE: {patient.contacto_emergencia}
                         </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Columna 5: Sucursal */}
                  <TableCell className="hidden md:table-cell text-gray-600 text-sm">
                    <div className="flex items-center gap-1 truncate max-w-[120px]" title={patient.sucursal_nombre}>
                      <MapPin className="h-3 w-3 text-pink-500 flex-shrink-0" />
                      {patient.sucursal_nombre}
                    </div>
                  </TableCell>

                  {/* Columna 6: Estado */}
                  <TableCell>
                    <Badge 
                      variant={patient.estado === 'ACTIVO' ? 'default' : 'secondary'}
                      className={`text-[10px] px-2 ${patient.estado === 'ACTIVO' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                      {patient.estado}
                    </Badge>
                  </TableCell>
                  
                  {/* Columna 7: Acciones */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* 1. Botón Ver Historia Clínica (NUEVO) */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Ver Historia Clínica"
                        onClick={() => navigate(`/pacientes/${patient.id}`)} // Usamos el ID (DNI)
                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>

                      {/* 2. Botón Editar */}
                      <EditPatientDialog patient={patient} />
                      
                      {/* 3. Botón Eliminar */}
                      <DeletePatientButton 
                        patientId={patient.id} 
                        patientName={`${patient.nombres} ${patient.apellidos}`} 
                      />
                    </div>
                  </TableCell>
                  
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Contador */}
      {!isLoading && filteredPatients.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Mostrando {filteredPatients.length} de {patients.length} pacientes
        </p>
      )}
    </div>
  );
}