import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Plus, 
  Search,
  Eye, 
  AlertCircle,
  Calendar,
  User,
  FileText,
  ArrowLeft
} from 'lucide-react';

// Tipos basados en la base de datos
interface Derivacion {
  id_derivacion: number;
  paciente: {
    nombres: string;
    apellidos: string;
    doc_identidad: string;
  };
  especialista: {
    nombres: string;
    especialidad: string;
    contacto: string;
  };
  usuario_deriva: {
    username: string;
  };
  motivo: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  fecha: string;
  estado: 'PENDIENTE' | 'ATENDIDA' | 'CERRADA' | 'CANCELADA';
  observaciones?: string;
}

interface Especialista {
  id_especialista: number;
  nombres: string;
  especialidad: string;
  contacto: string;
}

// Mock data
const mockEspecialistas: Especialista[] = [
  { id_especialista: 1, nombres: 'Dr. Carlos Mendoza', especialidad: 'Cardiología', contacto: '987654321' },
  { id_especialista: 2, nombres: 'Dra. María Torres', especialidad: 'Endocrinología', contacto: '987654322' },
  { id_especialista: 3, nombres: 'Dr. Luis Fernández', especialidad: 'Neurología', contacto: '987654323' },
  { id_especialista: 4, nombres: 'Dra. Ana Gutiérrez', especialidad: 'Nutrición', contacto: '987654324' },
  { id_especialista: 5, nombres: 'Dr. Roberto Silva', especialidad: 'Psicología', contacto: '987654325' },
];

const mockDerivaciones: Derivacion[] = [
  {
    id_derivacion: 1,
    paciente: { nombres: 'María Elena', apellidos: 'García López', doc_identidad: '12345678' },
    especialista: mockEspecialistas[0],
    usuario_deriva: { username: 'obstetra1' },
    motivo: 'Hipertensión gestacional - Requiere evaluación cardiológica',
    prioridad: 'ALTA',
    fecha: '2025-10-15T10:30:00',
    estado: 'PENDIENTE',
  },
  {
    id_derivacion: 2,
    paciente: { nombres: 'Carmen Rosa', apellidos: 'Díaz Medina', doc_identidad: '23456789' },
    especialista: mockEspecialistas[1],
    usuario_deriva: { username: 'obstetra2' },
    motivo: 'Diabetes gestacional - Control endocrinológico',
    prioridad: 'ALTA',
    fecha: '2025-10-14T14:00:00',
    estado: 'ATENDIDA',
  },
  {
    id_derivacion: 3,
    paciente: { nombres: 'Sofía', apellidos: 'Ramírez Cruz', doc_identidad: '34567890' },
    especialista: mockEspecialistas[3],
    usuario_deriva: { username: 'obstetra1' },
    motivo: 'Bajo peso durante embarazo - Asesoría nutricional',
    prioridad: 'MEDIA',
    fecha: '2025-10-13T09:15:00',
    estado: 'ATENDIDA',
  },
  {
    id_derivacion: 4,
    paciente: { nombres: 'Patricia', apellidos: 'Morales Vega', doc_identidad: '45678901' },
    especialista: mockEspecialistas[4],
    usuario_deriva: { username: 'obstetra2' },
    motivo: 'Ansiedad y estrés gestacional - Apoyo psicológico',
    prioridad: 'MEDIA',
    fecha: '2025-10-12T16:45:00',
    estado: 'PENDIENTE',
  },
  {
    id_derivacion: 5,
    paciente: { nombres: 'Lucía', apellidos: 'Vargas Soto', doc_identidad: '56789012' },
    especialista: mockEspecialistas[2],
    usuario_deriva: { username: 'obstetra1' },
    motivo: 'Migrañas frecuentes - Evaluación neurológica',
    prioridad: 'BAJA',
    fecha: '2025-10-10T11:00:00',
    estado: 'CERRADA',
  },
];

const mockPacientes = [
  { id_paciente: 1, nombres: 'María Elena', apellidos: 'García López', doc_identidad: '12345678' },
  { id_paciente: 2, nombres: 'Carmen Rosa', apellidos: 'Díaz Medina', doc_identidad: '23456789' },
  { id_paciente: 3, nombres: 'Sofía', apellidos: 'Ramírez Cruz', doc_identidad: '34567890' },
  { id_paciente: 4, nombres: 'Patricia', apellidos: 'Morales Vega', doc_identidad: '45678901' },
  { id_paciente: 5, nombres: 'Lucía', apellidos: 'Vargas Soto', doc_identidad: '56789012' },
];

export function Derivaciones() {
  const navigate = useNavigate();
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>(mockDerivaciones);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('TODOS');
  const [selectedDerivacion, setSelectedDerivacion] = useState<Derivacion | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Formulario nueva derivación
  const [formData, setFormData] = useState({
    id_paciente: '',
    id_especialista: '',
    motivo: '',
    prioridad: 'MEDIA' as 'ALTA' | 'MEDIA' | 'BAJA',
  });

  // Filtrar derivaciones
  const filteredDerivaciones = derivaciones.filter(derivacion => {
    const matchesSearch = 
      derivacion.paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      derivacion.paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      derivacion.especialista.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      derivacion.especialista.especialidad.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'TODOS' || derivacion.estado === filterEstado;
    const matchesPrioridad = filterPrioridad === 'TODOS' || derivacion.prioridad === filterPrioridad;

    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  // Crear nueva derivación
  const handleCreateDerivacion = () => {
    const paciente = mockPacientes.find(p => p.id_paciente === parseInt(formData.id_paciente));
    const especialista = mockEspecialistas.find(e => e.id_especialista === parseInt(formData.id_especialista));

    if (!paciente || !especialista) return;

    const nuevaDerivacion: Derivacion = {
      id_derivacion: derivaciones.length + 1,
      paciente,
      especialista,
      usuario_deriva: { username: 'obstetra1' },
      motivo: formData.motivo,
      prioridad: formData.prioridad,
      fecha: new Date().toISOString(),
      estado: 'PENDIENTE',
    };

    setDerivaciones([nuevaDerivacion, ...derivaciones]);
    setIsNewDialogOpen(false);
    setFormData({
      id_paciente: '',
      id_especialista: '',
      motivo: '',
      prioridad: 'MEDIA',
    });
  };

  // Actualizar estado de derivación
  const handleUpdateEstado = (id: number, nuevoEstado: 'PENDIENTE' | 'ATENDIDA' | 'CERRADA' | 'CANCELADA') => {
    setDerivaciones(derivaciones.map(d => 
      d.id_derivacion === id ? { ...d, estado: nuevoEstado } : d
    ));
  };

  // Helpers para badges
  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'bg-red-500 hover:bg-red-600';
      case 'MEDIA': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'BAJA': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-blue-500 hover:bg-blue-600';
      case 'ATENDIDA': return 'bg-green-500 hover:bg-green-600';
      case 'CERRADA': return 'bg-gray-500 hover:bg-gray-600';
      case 'CANCELADA': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="outline"
              onClick={() => navigate('/home')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Inicio
            </Button>
            <h1 className="text-gray-900">Gestión de Derivaciones</h1>
          </div>
          <p className="text-gray-600">
            Administra las derivaciones de pacientes a especialistas externos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total</p>
                <p className="text-gray-900">{derivaciones.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Pendientes</p>
                <p className="text-gray-900">
                  {derivaciones.filter(d => d.estado === 'PENDIENTE').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Alta Prioridad</p>
                <p className="text-gray-900">
                  {derivaciones.filter(d => d.prioridad === 'ALTA').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Atendidas</p>
                <p className="text-gray-900">
                  {derivaciones.filter(d => d.estado === 'ATENDIDA').length}
                </p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por paciente o especialista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 border-gray-200 h-10 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full border-gray-200 bg-white h-10">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="ATENDIDA">Atendida</SelectItem>
                  <SelectItem value="CERRADA">Cerrada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
                <SelectTrigger className="w-full border-gray-200 bg-white h-10">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="TODOS">Todas las prioridades</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Derivación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Derivación</DialogTitle>
                  <DialogDescription>
                    Crea una derivación a un especialista externo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="paciente">Paciente</Label>
                    <Select 
                      value={formData.id_paciente} 
                      onValueChange={(value) => setFormData({...formData, id_paciente: value})}
                    >
                      <SelectTrigger id="paciente">
                        <SelectValue placeholder="Seleccionar paciente" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg">
                        {mockPacientes.map(p => (
                          <SelectItem key={p.id_paciente} value={p.id_paciente.toString()}>
                            {p.nombres} {p.apellidos} - DNI: {p.doc_identidad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialista">Especialista</Label>
                    <Select 
                      value={formData.id_especialista} 
                      onValueChange={(value) => setFormData({...formData, id_especialista: value})}
                    >
                      <SelectTrigger id="especialista">
                        <SelectValue placeholder="Seleccionar especialista" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg">
                        {mockEspecialistas.map(e => (
                          <SelectItem key={e.id_especialista} value={e.id_especialista.toString()}>
                            {e.nombres} - {e.especialidad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prioridad">Prioridad</Label>
                    <Select 
                      value={formData.prioridad} 
                      onValueChange={(value: any) => setFormData({...formData, prioridad: value})}
                    >
                      <SelectTrigger id="prioridad">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg">
                        <SelectItem value="ALTA">Alta</SelectItem>
                        <SelectItem value="MEDIA">Media</SelectItem>
                        <SelectItem value="BAJA">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo de Derivación</Label>
                    <Textarea
                      id="motivo"
                      placeholder="Describe el motivo de la derivación..."
                      value={formData.motivo}
                      onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateDerivacion}>
                    Crear Derivación
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Tabla de derivaciones */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Especialista</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDerivaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                    No se encontraron derivaciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredDerivaciones.map((derivacion) => (
                  <TableRow key={derivacion.id_derivacion}>
                    <TableCell>#{derivacion.id_derivacion}</TableCell>
                    <TableCell>
                      <div>
                        <div>{derivacion.paciente.nombres} {derivacion.paciente.apellidos}</div>
                        <div className="text-gray-500">DNI: {derivacion.paciente.doc_identidad}</div>
                      </div>
                    </TableCell>
                    <TableCell>{derivacion.especialista.nombres}</TableCell>
                    <TableCell>{derivacion.especialista.especialidad}</TableCell>
                    <TableCell className="max-w-xs truncate">{derivacion.motivo}</TableCell>
                    <TableCell>
                      <Badge className={getPrioridadColor(derivacion.prioridad)}>
                        {derivacion.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={derivacion.estado}
                        onValueChange={(value: any) => handleUpdateEstado(derivacion.id_derivacion, value)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={getEstadoColor(derivacion.estado)}>
                            {derivacion.estado}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                          <SelectItem value="ATENDIDA">Atendida</SelectItem>
                          <SelectItem value="CERRADA">Cerrada</SelectItem>
                          <SelectItem value="CANCELADA">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatFecha(derivacion.fecha)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDerivacion(derivacion);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Dialog de detalles */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de Derivación #{selectedDerivacion?.id_derivacion}</DialogTitle>
            </DialogHeader>
            {selectedDerivacion && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Paciente</Label>
                    <p className="text-gray-900">
                      {selectedDerivacion.paciente.nombres} {selectedDerivacion.paciente.apellidos}
                    </p>
                    <p className="text-gray-600">DNI: {selectedDerivacion.paciente.doc_identidad}</p>
                  </div>
                  <div>
                    <Label>Especialista</Label>
                    <p className="text-gray-900">{selectedDerivacion.especialista.nombres}</p>
                    <p className="text-gray-600">{selectedDerivacion.especialista.especialidad}</p>
                    <p className="text-gray-600">Tel: {selectedDerivacion.especialista.contacto}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridad</Label>
                    <div className="mt-1">
                      <Badge className={getPrioridadColor(selectedDerivacion.prioridad)}>
                        {selectedDerivacion.prioridad}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <div className="mt-1">
                      <Badge className={getEstadoColor(selectedDerivacion.estado)}>
                        {selectedDerivacion.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Fecha de Derivación</Label>
                  <p className="text-gray-900">{formatFecha(selectedDerivacion.fecha)}</p>
                </div>
                <div>
                  <Label>Derivado por</Label>
                  <p className="text-gray-900">{selectedDerivacion.usuario_deriva.username}</p>
                </div>
                <div>
                  <Label>Motivo</Label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedDerivacion.motivo}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
