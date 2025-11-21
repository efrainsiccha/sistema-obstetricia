import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, User, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { RegistrarConsultaDialog } from '../components/RegistrarConsultaDialog';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { type Consulta } from '../types';

// Helper fecha
const toDate = (timestamp: { seconds: number; nanoseconds: number } | Date): Date => {
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
};

export function ConsultasPage() {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar Consultas
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "consultas"), orderBy("fecha", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Consulta));
      setConsultas(list);
      setIsLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Error al cargar consultas");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtro
  const filteredConsultas = consultas.filter(c => 
    c.paciente_nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.paciente_dni.includes(searchTerm)
  );

  const formatDate = (dateTimestamp: any) => {
    const date = toDate(dateTimestamp);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/home')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Button>
        </div>
        <h1 className="text-primary mb-2">Gestión de Consultas</h1>
        <p className="text-muted-foreground">Historial de atenciones médicas y controles.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar por paciente o DNI..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <RegistrarConsultaDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Nueva Consulta
              </Button>
            </RegistrarConsultaDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo / Diagnóstico</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-primary"/></TableCell></TableRow>
              ) : filteredConsultas.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay consultas registradas.</TableCell></TableRow>
              ) : (
                filteredConsultas.map((consulta) => (
                  <TableRow key={consulta.id}>
                    <TableCell className="font-medium text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(consulta.fecha)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{consulta.paciente_nombre_completo}</span>
                        <span className="text-xs text-muted-foreground">DNI: {consulta.paciente_dni}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={consulta.tipo === 'PRENATAL' ? 'default' : 'secondary'}>
                        {consulta.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="font-medium truncate">{consulta.motivo}</div>
                      <div className="text-xs text-muted-foreground truncate">{consulta.diagnostico}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}