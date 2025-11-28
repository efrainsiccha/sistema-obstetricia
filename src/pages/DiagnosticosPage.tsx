import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ArrowLeft, Activity, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { db } from '../lib/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { type Consulta } from '../types';

export function DiagnosticosPage() {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState<Consulta[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Traemos todas las consultas para extraer los diagnósticos
    const q = query(collection(db, "consultas"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Consulta));
      // Filtramos solo las que tienen diagnóstico escrito
      setRegistros(list.filter(c => c.diagnostico && c.diagnostico.length > 0));
    });
  }, []);

  const filtrados = registros.filter(r => 
    r.diagnostico.toLowerCase().includes(search.toLowerCase()) || 
    r.paciente_nombre_completo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <Button variant="outline" size="sm" onClick={() => navigate('/home')} className="gap-2 mb-2"><ArrowLeft className="h-4 w-4"/> Volver</Button>
        <h1 className="text-primary text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6"/> Historial de Diagnósticos</h1>
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
              {filtrados.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date((r.fecha as any).seconds * 1000).toLocaleDateString()}</TableCell>
                  <TableCell>{r.paciente_nombre_completo}</TableCell>
                  <TableCell className="font-medium text-blue-700">{r.diagnostico}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-md truncate">{r.indicaciones}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}