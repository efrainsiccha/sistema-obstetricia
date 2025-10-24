import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
import { Badge } from './ui/badge';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  FileText,
  Calendar,
  User,
  Stethoscope,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface Paciente {
  id_paciente: number;
  doc_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
}

interface Consulta {
  id_consulta: number;
  fecha_hora: string;
  tipo: 'PRENATAL' | 'POSTPARTO' | 'PARTO';
  motivo: string;
}

interface Diagnostico {
  id_diagnostico: number;
  id_paciente: number;
  id_consulta: number | null;
  cie10: string;
  descripcion: string;
  fecha: string;
  paciente?: Paciente;
  consulta?: Consulta;
}

// Datos mock
const pacientesMock: Paciente[] = [
  {
    id_paciente: 1,
    doc_identidad: '12345678',
    nombres: 'María Elena',
    apellidos: 'García López',
    fecha_nacimiento: '1990-05-15',
  },
  {
    id_paciente: 2,
    doc_identidad: '23456789',
    nombres: 'Ana Patricia',
    apellidos: 'Rodríguez Silva',
    fecha_nacimiento: '1988-08-22',
  },
  {
    id_paciente: 3,
    doc_identidad: '34567890',
    nombres: 'Carmen Rosa',
    apellidos: 'Martínez Torres',
    fecha_nacimiento: '1992-03-10',
  },
  {
    id_paciente: 4,
    doc_identidad: '45678901',
    nombres: 'Lucía Fernanda',
    apellidos: 'Sánchez Díaz',
    fecha_nacimiento: '1995-11-30',
  },
];

const consultasMock: Consulta[] = [
  {
    id_consulta: 1,
    fecha_hora: '2025-10-15T10:00:00',
    tipo: 'PRENATAL',
    motivo: 'Control prenatal - Semana 28',
  },
  {
    id_consulta: 2,
    fecha_hora: '2025-10-14T14:30:00',
    tipo: 'PRENATAL',
    motivo: 'Control prenatal - Semana 32',
  },
  {
    id_consulta: 3,
    fecha_hora: '2025-10-13T09:15:00',
    tipo: 'POSTPARTO',
    motivo: 'Control postparto - 7 días',
  },
  {
    id_consulta: 4,
    fecha_hora: '2025-10-12T11:00:00',
    tipo: 'PRENATAL',
    motivo: 'Control prenatal - Semana 36',
  },
];

const diagnosticosMock: Diagnostico[] = [
  {
    id_diagnostico: 1,
    id_paciente: 1,
    id_consulta: 1,
    cie10: 'O24.4',
    descripcion: 'Diabetes mellitus gestacional. Control metabólico adecuado con dieta.',
    fecha: '2025-10-15',
  },
  {
    id_diagnostico: 2,
    id_paciente: 2,
    id_consulta: 2,
    cie10: 'O13',
    descripcion: 'Hipertensión gestacional sin proteinuria significativa. Monitoreo estrecho.',
    fecha: '2025-10-14',
  },
  {
    id_diagnostico: 3,
    id_paciente: 3,
    id_consulta: 3,
    cie10: 'O86.4',
    descripcion: 'Pirexia de origen desconocido consecutiva al parto. Tratamiento antibiótico.',
    fecha: '2025-10-13',
  },
  {
    id_diagnostico: 4,
    id_paciente: 4,
    id_consulta: 4,
    cie10: 'O99.0',
    descripcion: 'Anemia que complica el embarazo. Suplementación con hierro y ácido fólico.',
    fecha: '2025-10-12',
  },
  {
    id_diagnostico: 5,
    id_paciente: 1,
    id_consulta: null,
    cie10: 'O26.8',
    descripcion: 'Otras afecciones especificadas relacionadas con el embarazo.',
    fecha: '2025-10-10',
  },
];

export default function Diagnosticos() {
  const navigate = useNavigate();
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>(
    diagnosticosMock.map(d => ({
      ...d,
      paciente: pacientesMock.find(p => p.id_paciente === d.id_paciente),
      consulta: consultasMock.find(c => c.id_consulta === d.id_consulta) || undefined,
    }))
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaciente, setFilterPaciente] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingDiagnostico, setEditingDiagnostico] = useState<Diagnostico | null>(null);
  const [viewingDiagnostico, setViewingDiagnostico] = useState<Diagnostico | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    id_paciente: '',
    id_consulta: 'none',
    cie10: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const resetForm = () => {
    setFormData({
      id_paciente: '',
      id_consulta: 'none',
      cie10: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setEditingDiagnostico(null);
  };

  const handleOpenDialog = (diagnostico?: Diagnostico) => {
    if (diagnostico) {
      setEditingDiagnostico(diagnostico);
      setFormData({
        id_paciente: diagnostico.id_paciente.toString(),
        id_consulta: diagnostico.id_consulta?.toString() || 'none',
        cie10: diagnostico.cie10,
        descripcion: diagnostico.descripcion,
        fecha: diagnostico.fecha,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(resetForm, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_paciente || !formData.cie10) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    if (editingDiagnostico) {
      // Editar diagnóstico existente
      setDiagnosticos(prev =>
        prev.map(d =>
          d.id_diagnostico === editingDiagnostico.id_diagnostico
            ? {
                ...d,
                id_paciente: parseInt(formData.id_paciente),
                id_consulta: formData.id_consulta !== 'none' ? parseInt(formData.id_consulta) : null,
                cie10: formData.cie10,
                descripcion: formData.descripcion,
                fecha: formData.fecha,
                paciente: pacientesMock.find(p => p.id_paciente === parseInt(formData.id_paciente)),
                consulta: formData.id_consulta !== 'none'
                  ? consultasMock.find(c => c.id_consulta === parseInt(formData.id_consulta))
                  : undefined,
              }
            : d
        )
      );
      toast.success('Diagnóstico actualizado correctamente');
    } else {
      // Crear nuevo diagnóstico
      const newDiagnostico: Diagnostico = {
        id_diagnostico: Math.max(...diagnosticos.map(d => d.id_diagnostico)) + 1,
        id_paciente: parseInt(formData.id_paciente),
        id_consulta: formData.id_consulta !== 'none' ? parseInt(formData.id_consulta) : null,
        cie10: formData.cie10,
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        paciente: pacientesMock.find(p => p.id_paciente === parseInt(formData.id_paciente)),
        consulta: formData.id_consulta !== 'none'
          ? consultasMock.find(c => c.id_consulta === parseInt(formData.id_consulta))
          : undefined,
      };
      setDiagnosticos(prev => [newDiagnostico, ...prev]);
      toast.success('Diagnóstico registrado correctamente');
    }

    handleCloseDialog();
  };

  const handleView = (diagnostico: Diagnostico) => {
    setViewingDiagnostico(diagnostico);
    setIsViewDialogOpen(true);
  };

  // Filtrado
  const filteredDiagnosticos = diagnosticos.filter(d => {
    const matchesSearch = 
      d.cie10.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.paciente?.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.paciente?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.paciente?.doc_identidad.includes(searchTerm);
    
    const matchesPaciente = filterPaciente === 'todos' || 
      d.id_paciente.toString() === filterPaciente;

    return matchesSearch && matchesPaciente;
  });

  const getTipoBadge = (tipo?: 'PRENATAL' | 'POSTPARTO' | 'PARTO') => {
    if (!tipo) return null;
    
    const variants: Record<string, { variant: any; text: string }> = {
      PRENATAL: { variant: 'default', text: 'Prenatal' },
      POSTPARTO: { variant: 'secondary', text: 'Postparto' },
      PARTO: { variant: 'destructive', text: 'Parto' },
    };

    const config = variants[tipo];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-pink-100 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-pink-600" />
          </div>
          <div>
            <h1>Diagnósticos</h1>
            <p className="text-gray-600">
              Gestión de diagnósticos clínicos y códigos CIE-10
            </p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              <Input
                placeholder="Buscar por paciente, CIE-10 o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-[200px]">
              <Select value={filterPaciente} onValueChange={setFilterPaciente}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por paciente" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="todos">Todos los pacientes</SelectItem>
                  {pacientesMock.map(p => (
                    <SelectItem key={p.id_paciente} value={p.id_paciente.toString()}>
                      {p.nombres} {p.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="shrink-0">
              <Button onClick={() => handleOpenDialog()} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Diagnóstico
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Diagnósticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{diagnosticos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {diagnosticos.filter(d => d.fecha.startsWith('2025-10')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Pacientes Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {new Set(diagnosticos.map(d => d.id_paciente)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>CIE-10</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Consulta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiagnosticos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No se encontraron diagnósticos
                  </TableCell>
                </TableRow>
              ) : (
                filteredDiagnosticos.map((diagnostico) => (
                  <TableRow key={diagnostico.id_diagnostico}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(diagnostico.fecha).toLocaleDateString('es-ES')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div>
                            {diagnostico.paciente?.nombres} {diagnostico.paciente?.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {diagnostico.paciente?.doc_identidad}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {diagnostico.cie10}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{diagnostico.descripcion}</div>
                    </TableCell>
                    <TableCell>
                      {diagnostico.consulta ? (
                        <div className="flex flex-col gap-1">
                          {getTipoBadge(diagnostico.consulta.tipo)}
                          <span className="text-xs text-gray-500">
                            {new Date(diagnostico.consulta.fecha_hora).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin consulta</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(diagnostico)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(diagnostico)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDiagnostico ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}
            </DialogTitle>
            <DialogDescription>
              Complete la información del diagnóstico. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="paciente">Paciente *</Label>
                <Select
                  value={formData.id_paciente}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_paciente: value })
                  }
                >
                  <SelectTrigger id="paciente">
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {pacientesMock.map(p => (
                      <SelectItem key={p.id_paciente} value={p.id_paciente.toString()}>
                        {p.nombres} {p.apellidos} - DNI: {p.doc_identidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="consulta">Consulta Relacionada (Opcional)</Label>
                <Select
                  value={formData.id_consulta}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_consulta: value })
                  }
                >
                  <SelectTrigger id="consulta">
                    <SelectValue placeholder="Seleccionar consulta" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="none">Sin consulta</SelectItem>
                    {consultasMock.map(c => (
                      <SelectItem key={c.id_consulta} value={c.id_consulta.toString()}>
                        {c.tipo} - {new Date(c.fecha_hora).toLocaleDateString('es-ES')} - {c.motivo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cie10">Código CIE-10 *</Label>
                  <Input
                    id="cie10"
                    placeholder="Ej: O24.4"
                    value={formData.cie10}
                    onChange={(e) =>
                      setFormData({ ...formData, cie10: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción Clínica</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripción detallada del diagnóstico..."
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                {editingDiagnostico ? 'Actualizar' : 'Registrar'} Diagnóstico
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Diagnóstico</DialogTitle>
            <DialogDescription>
              Información completa del diagnóstico registrado
            </DialogDescription>
          </DialogHeader>
          {viewingDiagnostico && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Fecha</Label>
                  <div className="mt-1">
                    {new Date(viewingDiagnostico.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Código CIE-10</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono">
                      {viewingDiagnostico.cie10}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Paciente</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <div>
                        {viewingDiagnostico.paciente?.nombres}{' '}
                        {viewingDiagnostico.paciente?.apellidos}
                      </div>
                      <div className="text-sm text-gray-500">
                        DNI: {viewingDiagnostico.paciente?.doc_identidad}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {viewingDiagnostico.consulta && (
                <div>
                  <Label className="text-gray-600">Consulta Relacionada</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Stethoscope className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTipoBadge(viewingDiagnostico.consulta.tipo)}
                          <span className="text-sm text-gray-500">
                            {new Date(viewingDiagnostico.consulta.fecha_hora).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="text-sm">{viewingDiagnostico.consulta.motivo}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-gray-600">Descripción Clínica</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {viewingDiagnostico.descripcion || 'Sin descripción detallada'}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (viewingDiagnostico) {
                  handleOpenDialog(viewingDiagnostico);
                }
              }}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
