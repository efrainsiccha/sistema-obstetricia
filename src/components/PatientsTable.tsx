import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Search, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { useState } from 'react';

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

interface Props {
  patients: Patient[];
}

export function PatientsTable({ patients }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.nombres.toLowerCase().includes(searchLower) ||
      patient.apellidos.toLowerCase().includes(searchLower) ||
      patient.doc_identidad.includes(searchTerm)
    );
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const maskDocument = (doc: string) => {
    if (doc.length <= 4) return doc;
    return doc.slice(0, 2) + '***' + doc.slice(-2);
  };

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <Input
          placeholder="Buscar por nombre, apellido o documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 bg-white border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-pink-50">
            <TableRow>
              <TableHead className="text-pink-900">Documento</TableHead>
              <TableHead className="text-pink-900">Nombre Completo</TableHead>
              <TableHead className="text-pink-900">Edad</TableHead>
              <TableHead className="text-pink-900">Teléfono</TableHead>
              <TableHead className="text-pink-900">Sucursal</TableHead>
              <TableHead className="text-pink-900">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  No se encontraron pacientes
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id_paciente} className="hover:bg-pink-50/50">
                  <TableCell className="text-gray-600">
                    {maskDocument(patient.doc_identidad)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-gray-900">{patient.nombres} {patient.apellidos}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(patient.fecha_nacimiento)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {calculateAge(patient.fecha_nacimiento)} años
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {patient.telefono ? (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-pink-500" />
                        {patient.telefono}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-pink-500" />
                      {patient.sucursal}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={patient.estado === 'ACTIVO' ? 'default' : 'secondary'}
                      className={patient.estado === 'ACTIVO' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {patient.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Contador de resultados */}
      {filteredPatients.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          Mostrando {filteredPatients.length} de {patients.length} pacientes
        </p>
      )}
    </div>
  );
}
