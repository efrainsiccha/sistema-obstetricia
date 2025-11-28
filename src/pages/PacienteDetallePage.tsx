import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { type Patient, type Consulta, type Parto, type Inscripcion } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Save, User, FileText, AlertTriangle, Loader2, Baby, ClipboardList, Plus } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

import { InscribirProgramaDialog } from '../components/InscribirProgramaDialog';

export default function PacienteDetallePage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [partos, setPartos] = useState<Parto[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [historia, setHistoria] = useState({
    gestas: 0, partos: 0, abortos: 0, cesareas: 0, hijos_vivos: 0,
    alergias: '', antecedentes_personales: '', antecedentes_familiares: '',
    fum: '', fpp: ''
  });

  const toDate = (timestamp: any) => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  };

  const formatDate = (date: any) => {
    return toDate(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        // 1. Cargar Paciente
        const docRef = doc(db, "pacientes", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<Patient, "id">;
          setPatient({ id: docSnap.id, ...data });
          
          setHistoria({
            gestas: data.antecedentes_gestas || 0,
            partos: data.antecedentes_partos || 0,
            abortos: data.antecedentes_abortos || 0,
            cesareas: data.antecedentes_cesareas || 0,
            hijos_vivos: data.antecedentes_hijos_vivos || 0,
            alergias: data.alergias || '',
            antecedentes_personales: data.antecedentes_personales || '',
            antecedentes_familiares: data.antecedentes_familiares || '',
            fum: data.fum || '',
            fpp: data.fpp || ''
          });

          // 2. Cargar Historial de Consultas
          const qConsultas = query(collection(db, "consultas"), where("id_paciente", "==", id), orderBy("fecha", "desc"));
          const snapConsultas = await getDocs(qConsultas);
          setConsultas(snapConsultas.docs.map(d => ({ id: d.id, ...d.data() } as Consulta)));

          // 3. Cargar Historial de Partos
          const qPartos = query(collection(db, "partos"), where("paciente_dni", "==", id), orderBy("fecha_parto", "desc"));
          const snapPartos = await getDocs(qPartos);
          setPartos(snapPartos.docs.map(d => ({ id: d.id, ...d.data() } as Parto)));

          // 4. Cargar Inscripciones a Programas
          const qInscripciones = query(collection(db, "inscripciones"), where("id_paciente", "==", id));
          const snapInscripciones = await getDocs(qInscripciones);
          setInscripciones(snapInscripciones.docs.map(d => ({ id: d.id, ...d.data() } as Inscripcion)));

        } else {
          toast.error("Paciente no encontrada");
          navigate('/pacientes');
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar datos");
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  const handleSaveHistoria = async () => {
    if (!patient) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "pacientes", patient.id);
      await updateDoc(docRef, {
        antecedentes_gestas: historia.gestas,
        antecedentes_partos: historia.partos,
        antecedentes_abortos: historia.abortos,
        antecedentes_cesareas: historia.cesareas,
        antecedentes_hijos_vivos: historia.hijos_vivos,
        alergias: historia.alergias,
        antecedentes_personales: historia.antecedentes_personales,
        antecedentes_familiares: historia.antecedentes_familiares,
        fum: historia.fum,
        fpp: historia.fpp
      });
      toast.success("Historia clínica actualizada");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
    }
    setIsSaving(false);
  };

  const calculateAge = (fecha: any) => {
    if (!fecha) return "-";
    const birthDate = toDate(fecha);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-pink-600"/></div>;
  }

  if (!patient) return null;

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen bg-gradient-to-br from-pink-50 to-white">
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/pacientes')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a Pacientes
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-pink-100">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.nombres} {patient.apellidos}</h1>
              <div className="flex gap-3 text-sm text-gray-500 mt-1">
                <span>DNI: {patient.doc_identidad}</span>
                <span>•</span>
                <span>{calculateAge(patient.fecha_nacimiento)} años</span>
                <span>•</span>
                <span>{patient.grupo_sanguineo || 'GS: No reg.'}</span>
              </div>
            </div>
          </div>
          <Badge className={patient.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-gray-500'}>
            {patient.estado}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="font-medium text-gray-500">Teléfono</p><p>{patient.telefono}</p></div>
              <div><p className="font-medium text-gray-500">Email</p><p>{patient.email || '-'}</p></div>
              <div><p className="font-medium text-gray-500">Dirección</p><p>{patient.direccion}</p></div>
              <Separator />
              <div>
                <p className="font-medium text-gray-500 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-500" /> Contacto Emergencia
                </p>
                <p>{patient.contacto_emergencia || '-'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader><CardTitle className="text-lg">Sucursal</CardTitle></CardHeader>
             <CardContent><p className="text-sm">{patient.sucursal_nombre}</p></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          <Tabs defaultValue="historia" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="historia">Historia Clínica</TabsTrigger>
              <TabsTrigger value="programas">Programas</TabsTrigger>
              <TabsTrigger value="atenciones">Atenciones</TabsTrigger>
            </TabsList>

            <TabsContent value="historia">
              <Card className="border-t-4 border-t-pink-500 mt-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-pink-600" /> Antecedentes Obstétricos</CardTitle><CardDescription>Datos clínicos y embarazo actual</CardDescription></div>
                    <Button onClick={handleSaveHistoria} disabled={isSaving} className="bg-pink-600 hover:bg-pink-700">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Guardar Cambios</>}</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Fórmula Obstétrica</h3>
                    <div className="grid grid-cols-5 gap-3">
                      <div className="space-y-1"><Label>Gestas (G)</Label><Input type="number" value={historia.gestas} onChange={e => setHistoria({...historia, gestas: parseInt(e.target.value)||0})} /></div>
                      <div className="space-y-1"><Label>Partos (P)</Label><Input type="number" value={historia.partos} onChange={e => setHistoria({...historia, partos: parseInt(e.target.value)||0})} /></div>
                      <div className="space-y-1"><Label>Abortos (A)</Label><Input type="number" value={historia.abortos} onChange={e => setHistoria({...historia, abortos: parseInt(e.target.value)||0})} /></div>
                      <div className="space-y-1"><Label>Cesáreas (C)</Label><Input type="number" value={historia.cesareas} onChange={e => setHistoria({...historia, cesareas: parseInt(e.target.value)||0})} /></div>
                      <div className="space-y-1"><Label>Hijos Vivos</Label><Input type="number" value={historia.hijos_vivos} onChange={e => setHistoria({...historia, hijos_vivos: parseInt(e.target.value)||0})} /></div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Antecedentes Médicos</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1"><Label className="text-red-600">Alergias (Importante)</Label><Input value={historia.alergias} onChange={e => setHistoria({...historia, alergias: e.target.value})} className="border-red-100 focus:border-red-300 bg-red-50/30"/></div>
                      <div className="space-y-1"><Label>Enfermedades / Cirugías</Label><Textarea value={historia.antecedentes_personales} onChange={e => setHistoria({...historia, antecedentes_personales: e.target.value})} rows={2}/></div>
                      <div className="space-y-1"><Label>Antecedentes Familiares</Label><Textarea value={historia.antecedentes_familiares} onChange={e => setHistoria({...historia, antecedentes_familiares: e.target.value})} rows={2}/></div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Embarazo Actual</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1"><Label>Fecha Última Regla (FUM)</Label><Input type="date" value={historia.fum} onChange={e => setHistoria({...historia, fum: e.target.value})} /></div>
                      <div className="space-y-1"><Label>Fecha Probable Parto (FPP)</Label><Input type="date" value={historia.fpp} onChange={e => setHistoria({...historia, fpp: e.target.value})} /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NUEVA PESTAÑA: PROGRAMAS */}
            <TabsContent value="programas">
              <Card className="mt-4 border-t-4 border-t-purple-500">
                <CardHeader>
                   <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-purple-600" /> Programas Activos
                        </CardTitle>
                        <CardDescription>Programas de salud en los que está inscrita la paciente</CardDescription>
                      </div>
                      <InscribirProgramaDialog patient={patient}>
                         <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="h-4 w-4 mr-2" /> Inscribir
                         </Button>
                      </InscribirProgramaDialog>
                   </div>
                </CardHeader>
                <CardContent>
                   {inscripciones.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">La paciente no está inscrita en ningún programa.</p>
                   ) : (
                      <div className="space-y-4">
                        {inscripciones.map(ins => (
                           <div key={ins.id} className="flex flex-col p-4 border rounded-lg bg-purple-50/50">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h4 className="font-semibold text-purple-900">{ins.nombre_programa}</h4>
                                    <p className="text-xs text-muted-foreground">Inscripción: {formatDate(ins.fecha_inicio)}</p>
                                 </div>
                                 <Badge>{ins.estado}</Badge>
                              </div>
                              {ins.etapa && <p className="text-sm mt-2"><span className="font-medium">Etapa:</span> {ins.etapa}</p>}
                              {ins.observaciones && <p className="text-sm mt-1 text-gray-600">{ins.observaciones}</p>}
                           </div>
                        ))}
                      </div>
                   )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="atenciones">
               <Card className="mt-4">
                <CardHeader><CardTitle className="text-base">Historial de Consultas</CardTitle></CardHeader>
                <CardContent>
                  {consultas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay consultas registradas para esta paciente.</p>
                  ) : (
                    <div className="space-y-4">
                      {consultas.map(c => (
                        <div key={c.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{c.tipo}</Badge>
                              <span className="text-sm font-medium text-gray-900">{formatDate(c.fecha)}</span>
                            </div>
                            <p className="text-sm mt-1 font-medium">{c.motivo}</p>
                            <p className="text-xs text-gray-500 mt-1">Dx: {c.diagnostico}</p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <p>PA: {c.presion_arterial || '-'}</p>
                            <p>Peso: {c.peso || '-'} kg</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader><CardTitle className="text-base">Historial de Partos</CardTitle></CardHeader>
                <CardContent>
                   {partos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay partos registrados.</p>
                  ) : (
                    <div className="space-y-4">
                      {partos.map(p => (
                        <div key={p.id} className="flex items-start gap-3 bg-pink-50 p-3 rounded-lg">
                          <div className="bg-white p-2 rounded-full"><Baby className="h-5 w-5 text-pink-500"/></div>
                          <div>
                            <p className="font-medium text-sm">Parto {p.tipo_parto} - {formatDate(p.fecha_parto)}</p>
                            <p className="text-xs text-gray-600">RN: {p.sexo_recien_nacido === 'M' ? 'Masculino' : 'Femenino'} | {p.peso_recien_nacido}g</p>
                            <p className="text-xs text-gray-500 mt-1">{p.lugar}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                   )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

        </div>
      </div>
    </div>
  );
}