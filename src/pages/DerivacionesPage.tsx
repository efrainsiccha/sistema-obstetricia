import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ArrowLeft, Ambulance } from 'lucide-react';
import { RegistrarDerivacionDialog } from '../components/RegistrarDerivacionDialog';
import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot, query} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { type Derivacion } from '../types';

export function DerivacionesPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "derivaciones"));
    return onSnapshot(q, (snap) => {
      setDerivaciones(snap.docs.map(d => ({ id: d.id, ...d.data() } as Derivacion)));
    });
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate('/home')} className="gap-2 mb-2"><ArrowLeft className="h-4 w-4"/> Volver</Button>
          <h1 className="text-primary text-2xl font-bold">Derivaciones</h1>
        </div>
        <RegistrarDerivacionDialog><Button className="bg-orange-600 hover:bg-orange-700"><Ambulance className="mr-2 h-4 w-4"/> Nueva Derivación</Button></RegistrarDerivacionDialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Listado de Referencias</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Paciente</TableHead><TableHead>Especialidad</TableHead><TableHead>Prioridad</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>
              {derivaciones.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{new Date((d.fecha as any).seconds * 1000).toLocaleDateString()}</TableCell>
                  <TableCell>{d.paciente_nombre}<br/><span className="text-xs text-gray-500">{d.paciente_dni}</span></TableCell>
                  <TableCell>{d.especialidad}</TableCell>
                  <TableCell><Badge variant={d.prioridad === "ALTA" ? "destructive" : "outline"}>{d.prioridad}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{d.estado}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}