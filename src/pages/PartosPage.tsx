import { useState } from 'react';
import { Plus, Search, Calendar, User, FileText, Filter, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { RegistrarPartoDialog } from '../components/RegistrarPartoDialog';
import { DetallePartoDialog } from '../components/DetallePartoDialog';

// Datos de ejemplo
const partosEjemplo = [
  {
    id_parto: 1,
    id_paciente: 1,
    paciente: { nombres: 'María', apellidos: 'García López', doc_identidad: '12345678' },
    fecha_parto: '2025-01-15T10:30:00',
    tipo_parto: 'VAGINAL',
    lugar: 'Hospital Central - Sala de Partos 2',
    apgar1: 8,
    apgar5: 9,
    observaciones: 'Parto sin complicaciones. Madre e hijo en buen estado.',
    peso_recien_nacido: 3200,
    talla_recien_nacido: 50,
    sexo_recien_nacido: 'F'
  },
  {
    id_parto: 2,
    id_paciente: 2,
    paciente: { nombres: 'Ana', apellidos: 'Martínez Silva', doc_identidad: '87654321' },
    fecha_parto: '2025-01-20T14:15:00',
    tipo_parto: 'CESAREA',
    lugar: 'Clínica Santa María - Quirófano 1',
    apgar1: 7,
    apgar5: 9,
    observaciones: 'Cesárea programada por presentación podálica. Procedimiento exitoso.',
    peso_recien_nacido: 3450,
    talla_recien_nacido: 52,
    sexo_recien_nacido: 'M'
  },
  {
    id_parto: 3,
    id_paciente: 3,
    paciente: { nombres: 'Carmen', apellidos: 'Rodríguez Torres', doc_identidad: '45678912' },
    fecha_parto: '2025-02-03T08:45:00',
    tipo_parto: 'VAGINAL',
    lugar: 'Hospital Central - Sala de Partos 1',
    apgar1: 9,
    apgar5: 10,
    observaciones: 'Parto natural exitoso. Recién nacido con excelente adaptación.',
    peso_recien_nacido: 3100,
    talla_recien_nacido: 49,
    sexo_recien_nacido: 'F'
  },
  {
    id_parto: 4,
    id_paciente: 4,
    paciente: { nombres: 'Lucía', apellidos: 'Fernández Ruiz', doc_identidad: '78912345' },
    fecha_parto: '2025-02-10T16:20:00',
    tipo_parto: 'CESAREA',
    lugar: 'Hospital Central - Quirófano 2',
    apgar1: 6,
    apgar5: 8,
    observaciones: 'Cesárea de emergencia por sufrimiento fetal. Madre y bebé estables.',
    peso_recien_nacido: 2950,
    talla_recien_nacido: 48,
    sexo_recien_nacido: 'M'
  },
  {
    id_parto: 5,
    id_paciente: 5,
    paciente: { nombres: 'Isabel', apellidos: 'López Morales', doc_identidad: '32165498' },
    fecha_parto: '2025-02-14T11:00:00',
    tipo_parto: 'VAGINAL',
    lugar: 'Clínica Materno Infantil',
    apgar1: 8,
    apgar5: 9,
    observaciones: 'Parto normal. Alumbramiento completo sin retención placentaria.',
    peso_recien_nacido: 3350,
    talla_recien_nacido: 51,
    sexo_recien_nacido: 'F'
  }
];

export function PartosPage() {
  const navigate = useNavigate();
  const [partos, setPartos] = useState(partosEjemplo);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [selectedParto, setSelectedParto] = useState<any>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  // Filtrar partos
  const partosFiltrados = partos.filter(parto => {
    const matchSearch = 
      parto.paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parto.paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parto.paciente.doc_identidad.includes(searchTerm);
    
    const matchTipo = filterTipo === 'TODOS' || parto.tipo_parto === filterTipo;
    
    return matchSearch && matchTipo;
  });

  const handleVerDetalle = (parto: any) => {
    setSelectedParto(parto);
    setIsDetalleOpen(true);
  };

  const handleRegistrarParto = (nuevoParto: any) => {
    const partoConId = {
      ...nuevoParto,
      id_parto: partos.length + 1,
      id_paciente: Math.floor(Math.random() * 1000)
    };
    setPartos([partoConId, ...partos]);
    toast.success('Parto registrado exitosamente');
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'VAGINAL':
        return 'default';
      case 'CESAREA':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estadísticas
  const totalPartos = partos.length;
  const partosVaginales = partos.filter(p => p.tipo_parto === 'VAGINAL').length;
  const partosCesarea = partos.filter(p => p.tipo_parto === 'CESAREA').length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
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
        <h1 className="text-primary mb-2">Gestión de Partos</h1>
        <p className="text-muted-foreground">
          Registro y seguimiento de partos atendidos en el centro de obstetricia
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Partos</CardDescription>
            <CardTitle className="text-primary">{totalPartos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Partos Vaginales</CardDescription>
            <CardTitle className="text-green-600">{partosVaginales}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cesáreas</CardDescription>
            <CardTitle className="text-blue-600">{partosCesarea}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              <Input
                placeholder="Buscar por nombre o DNI de paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-[200px]">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="TODOS">Todos los tipos</SelectItem>
                  <SelectItem value="VAGINAL">Vaginal</SelectItem>
                  <SelectItem value="CESAREA">Cesárea</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="shrink-0">
              <RegistrarPartoDialog onRegistrar={handleRegistrarParto}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Parto
                </Button>
              </RegistrarPartoDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de partos */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Partos</CardTitle>
          <CardDescription>
            {partosFiltrados.length} {partosFiltrados.length === 1 ? 'parto encontrado' : 'partos encontrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead className="text-center">APGAR 1'</TableHead>
                  <TableHead className="text-center">APGAR 5'</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron partos con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  partosFiltrados.map((parto) => (
                    <TableRow key={parto.id_parto} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{parto.paciente.nombres} {parto.paciente.apellidos}</span>
                        </div>
                      </TableCell>
                      <TableCell>{parto.paciente.doc_identidad}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(parto.fecha_parto)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTipoBadgeVariant(parto.tipo_parto)}>
                          {parto.tipo_parto}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {parto.lugar}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={parto.apgar1 >= 7 ? 'text-green-600' : 'text-orange-600'}>
                          {parto.apgar1}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={parto.apgar5 >= 7 ? 'text-green-600' : 'text-orange-600'}>
                          {parto.apgar5}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerDetalle(parto)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de detalles */}
      {selectedParto && (
        <DetallePartoDialog
          parto={selectedParto}
          isOpen={isDetalleOpen}
          onClose={() => setIsDetalleOpen(false)}
        />
      )}
    </div>
  );
}
