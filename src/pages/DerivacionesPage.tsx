import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ArrowLeft, Ambulance, AlertTriangle, Loader2 } from 'lucide-react';
import { RegistrarDerivacionDialog } from '../components/RegistrarDerivacionDialog';
import { toast } from 'sonner';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { type Derivacion } from '../types';

export function DerivacionesPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const setupListener = async () => {
      setIsLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        // 1. Verificar Rol
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const esAdmin = userDoc.data()?.rol === "ADMIN";

        // 2. Definir Query
        let q;
        if (esAdmin) {
          // Admin ve todas las derivaciones
          q = collection(db, "derivaciones");
        } else {
          // Obstetra ve solo las suyas
          q = query(collection(db, "derivaciones"), where("usuarioId", "==", user.uid));
        }

        // 3. Escuchar cambios
        unsubscribe = onSnapshot(q, (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Derivacion));
          
          // Ordenar por fecha (más reciente primero)
          list.sort((a, b) => {
            const dateA = a.fecha ? new Date((a.fecha as any).seconds * 1000) : new Date();
            const dateB = b.fecha ? new Date((b.fecha as any).seconds * 1000) : new Date();
            return dateB.getTime() - dateA.getTime();
          });

          setDerivaciones(list);
          setIsLoading(false);
        }, (error) => {
          console.error(error);
          toast.error("Error al cargar derivaciones");
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate('/home')} className="gap-2 mb-2">
            <ArrowLeft className="h-4 w-4"/> Volver
          </Button>
          <h1 className="text-primary text-2xl font-bold flex items-center gap-2">
            <Ambulance className="h-6 w-6"/> Derivaciones
          </h1>
        </div>
        <RegistrarDerivacionDialog>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <AlertTriangle className="mr-2 h-4 w-4"/> Nueva Derivación
          </Button>
        </RegistrarDerivacionDialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Listado de Referencias</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-600"/></TableCell></TableRow>
              ) : derivaciones.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay derivaciones registradas.</TableCell></TableRow>
              ) : (
                derivaciones.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.fecha ? new Date((d.fecha as any).seconds * 1000).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{d.paciente_nombre}</div>
                      <div className="text-xs text-gray-500">{d.paciente_dni}</div>
                    </TableCell>
                    <TableCell>{d.especialidad}</TableCell>
                    <TableCell>
                      <Badge variant={d.prioridad === "ALTA" ? "destructive" : "outline"}>
                        {d.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{d.estado}</Badge>
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