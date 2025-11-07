import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, User, FileText, Filter, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useNavigate } from 'react-router-dom';
import { RegistrarPartoDialog } from '../components/RegistrarPartoDialog';
import { DetallePartoDialog } from '../components/DetallePartoDialog';
import { toast } from 'sonner';

// Firebase y Tipos
import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { type Parto } from '../types'; // Importamos el tipo desde 'types'

// Helper para convertir Timestamps
const toDate = (timestamp: { seconds: number; nanoseconds: number } | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
};

export function PartosPage() {
  const navigate = useNavigate();
  const [partos, setPartos] = useState<Parto[]>([]); // Estado para datos reales
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [selectedParto, setSelectedParto] = useState<Parto | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  // LEER (R) - Cargar partos de Firestore
  useEffect(() => {
    setIsLoading(true);
    // Ordenamos por fecha de parto, el más reciente primero
    const q = query(collection(db, "partos"), orderBy("fecha_parto", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const partosList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Parto));
      setPartos(partosList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al cargar partos: ", error);
      toast.error("Error al cargar los registros de partos.");
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpiar el listener
  }, []);

  // Filtrar partos
  const partosFiltrados = partos.filter(parto => {
    const matchSearch = 
      parto.paciente_nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parto.paciente_apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parto.paciente_dni.includes(searchTerm);
    
    const matchTipo = filterTipo === 'TODOS' || parto.tipo_parto === filterTipo;
    
    return matchSearch && matchTipo;
  });

  const handleVerDetalle = (parto: Parto) => {
    setSelectedParto(parto);
    setIsDetalleOpen(true);
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

  const formatDate = (dateTimestamp: { seconds: number; nanoseconds: number } | Date) => {
    const date = toDate(dateTimestamp); // Usamos el helper
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estadísticas (ahora con datos reales)
  const totalPartos = partos.length;
  const partosVaginales = partos.filter(p => p.tipo_parto === 'VAGINAL').length;
  const partosCesarea = partos.filter(p => p.tipo_parto === 'CESAREA').length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
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

      {/* Estadísticas (ahora usan datos reales) */}
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
              <RegistrarPartoDialog>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Parto
                </Button>
              </RegistrarPartoDialog>
            </div>
          </div>
        </CardContent>
      </Card>

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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 text-pink-500 animate-spin" />
                      Cargando registros...
                    </TableCell>
                  </TableRow>
                ) : partosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron partos con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  partosFiltrados.map((parto) => (
                    <TableRow key={parto.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {/* Usamos los campos denormalizados */}
                          <span>{parto.paciente_nombres} {parto.paciente_apellidos}</span>
                        </div>
                      </TableCell>
                      <TableCell>{parto.paciente_dni}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {/* Formateamos el Timestamp */}
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