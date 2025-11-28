import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ArrowLeft, Activity, Search, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

// Firebase
import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { type Consulta } from '../types';

export function DiagnosticosPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [registros, setRegistros] = useState<Consulta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let unsubscribe: () => void;

    const setupListener = async () => {
      setIsLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const esAdmin = userDoc.data()?.rol === "ADMIN";

        // Filtramos CONSULTAS porque de ahí sacamos los diagnósticos
        let q;
        if (esAdmin) {
          q = collection(db, "consultas");
        } else {
          q = query(collection(db, "consultas"), where("usuarioId", "==", user.uid));
        }

        unsubscribe = onSnapshot(q, (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Consulta));
          
          // Ordenamos por fecha
          list.sort((a, b) => {
             const dateA = a.fecha ? new Date((a.fecha as any).seconds * 1000) : new Date();
             const dateB = b.fecha ? new Date((b.fecha as any).seconds * 1000) : new Date();
             return dateB.getTime() - dateA.getTime();
          });

          // Filtramos solo las que tienen diagnóstico escrito
          setRegistros(list.filter(c => c.diagnostico && c.diagnostico.length > 0));
          setIsLoading(false);
        }, (error) => {
          console.error(error);
          toast.error("Error al cargar diagnósticos");
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

  const filtrados = registros.filter(r => 
    r.diagnostico.toLowerCase().includes(search.toLowerCase()) || 
    r.paciente_nombre_completo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <Button variant="outline" size="sm" onClick={() => navigate('/home')} className="gap-2 mb-2">
          <ArrowLeft className="h-4 w-4"/> Volver
        </Button>
        <h1 className="text-primary text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6"/> Historial de Diagnósticos
        </h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4"/>
            <Input placeholder="Buscar diagnóstico o paciente..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Registros Clínicos (CIE-10)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Paciente</TableHead><TableHead>Diagnóstico</TableHead><TableHead>Indicaciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-600"/></TableCell></TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay diagnósticos registrados.</TableCell></TableRow>
              ) : (
                filtrados.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.fecha ? new Date((r.fecha as any).seconds * 1000).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.paciente_nombre_completo}</div>
                      <div className="text-xs text-gray-500">{r.paciente_dni}</div>
                    </TableCell>
                    <TableCell className="font-medium text-blue-700">{r.diagnostico}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-md truncate">{r.indicaciones}</TableCell>
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