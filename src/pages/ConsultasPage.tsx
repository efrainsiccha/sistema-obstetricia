import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, ArrowLeft, Loader2, FileText, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"; 

import { RegistrarConsultaDialog } from '../components/RegistrarConsultaDialog';
import { ConsultaDetalleDialog } from '../components/ConsultaDetalleDialog';
import { EditarConsultaDialog } from '../components/EditarConsultaDialog';

import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { type Consulta } from '../types';

const toDate = (timestamp: { seconds: number; nanoseconds: number } | Date): Date => {
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
};

export function ConsultasPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: () => void;
    const setupListener = async () => {
      setIsLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const esAdmin = userDoc.data()?.rol === "ADMIN";

        let q;
        if (esAdmin) {
          q = collection(db, "consultas");
        } else {
          q = query(collection(db, "consultas"), where("usuarioId", "==", user.uid));
        }
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const list = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Consulta));
          
          list.sort((a, b) => {
            const dateA = toDate(a.fecha).getTime();
            const dateB = toDate(b.fecha).getTime();
            return dateB - dateA; 
          });
          
          setConsultas(list);
          setIsLoading(false);
        }, (error) => {
          console.error(error);
          toast.error("Error al cargar consultas");
          setIsLoading(false);
        });

      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };
    setupListener();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const filteredConsultas = consultas.filter(c => 
    c.paciente_nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.paciente_dni.includes(searchTerm)
  );

  // Separamos las listas
  const agenda = filteredConsultas.filter(c => c.estado_consulta === "PROGRAMADA");
  const historial = filteredConsultas.filter(c => c.estado_consulta !== "PROGRAMADA"); 

  const formatDate = (dateTimestamp: any) => {
    const date = toDate(dateTimestamp);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleVerDetalle = (consulta: Consulta) => {
    setSelectedConsulta(consulta);
    setIsDetalleOpen(true);
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
        <p className="text-muted-foreground">Agenda de citas y registro de atenciones.</p>
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
              <Button><Plus className="h-4 w-4 mr-2" /> Nueva Cita / Atención</Button>
            </RegistrarConsultaDialog>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="agenda" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="agenda" className="flex gap-2"><Clock className="h-4 w-4"/> Agenda / Programadas ({agenda.length})</TabsTrigger>
          {/* CORREGIDO: Ahora usa la variable 'historial' (con L al final) */}
          <TabsTrigger value="historia" className="flex gap-2"><CheckCircle className="h-4 w-4"/> Historial de Atenciones ({historial.length})</TabsTrigger>
        </TabsList>

        {/* TAB: AGENDA */}
        <TabsContent value="agenda">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Programada</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-primary"/></TableCell></TableRow>
                  ) : agenda.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay citas programadas.</TableCell></TableRow>
                  ) : (
                    agenda.map((consulta) => (
                      <TableRow key={consulta.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 text-blue-600">
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
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {consulta.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{consulta.motivo}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EditarConsultaDialog 
                              consulta={consulta} 
                              trigger={
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1"/> Atender
                                </Button>
                              }
                            />
                            <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(consulta)}>
                              <FileText className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="historia">
           <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Realizada</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-primary"/></TableCell></TableRow>
                  ) : historial.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay atenciones registradas.</TableCell></TableRow>
                  ) : (
                    historial.map((consulta) => (
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
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {consulta.diagnostico || consulta.motivo}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <EditarConsultaDialog consulta={consulta} />
                            <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(consulta)}>
                              <FileText className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>

      {selectedConsulta && (
        <ConsultaDetalleDialog 
          consulta={selectedConsulta}
          open={isDetalleOpen}
          onOpenChange={setIsDetalleOpen}
        />
      )}
    </div>
  );
}