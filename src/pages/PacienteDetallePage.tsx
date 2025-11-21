import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { type Patient } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Save, User, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

export default function PacienteDetallePage() {
  const { id } = useParams(); // Obtenemos el DNI de la URL
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para el formulario de Historia Clínica
  const [historia, setHistoria] = useState({
    gestas: 0, partos: 0, abortos: 0, cesareas: 0, hijos_vivos: 0,
    alergias: '', antecedentes_personales: '', antecedentes_familiares: '',
    fum: '', fpp: ''
  });

  // Cargar datos
  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "pacientes", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<Patient, "id">; 
          setPatient({ id: docSnap.id, ...data });
          
          // Cargar datos existentes al formulario
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
        } else {
          toast.error("Paciente no encontrada");
          navigate('/pacientes');
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar paciente");
      }
      setIsLoading(false);
    };
    fetchPatient();
  }, [id, navigate]);

  // Guardar Historia Clínica
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
      toast.success("Historia clínica actualizada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar historia clínica");
    }
    setIsSaving(false);
  };

  const calculateAge = (fecha: any) => {
    if (!fecha) return "-";
    const birthDate = new Date(fecha.seconds * 1000 + fecha.nanoseconds / 1000000);
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
      
      {/* Header con botón volver */}
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
        
        {/* COLUMNA IZQUIERDA: Datos de Contacto (Solo lectura rápida) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-500">Teléfono</p>
                <p>{patient.telefono}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Email</p>
                <p>{patient.email || '-'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Dirección</p>
                <p>{patient.direccion}</p>
              </div>
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

        {/* COLUMNA DERECHA: Historia Clínica (Editable) */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="border-t-4 border-t-pink-500">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-pink-600" /> Historia Clínica Obstétrica
                  </CardTitle>
                  <CardDescription>Antecedentes y datos del embarazo actual</CardDescription>
                </div>
                <Button onClick={handleSaveHistoria} disabled={isSaving} className="bg-pink-600 hover:bg-pink-700">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Guardar Cambios</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Fórmula Obstétrica */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Fórmula Obstétrica</h3>
                <div className="grid grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label>Gestas (G)</Label>
                    <Input type="number" value={historia.gestas} onChange={e => setHistoria({...historia, gestas: parseInt(e.target.value)||0})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Partos (P)</Label>
                    <Input type="number" value={historia.partos} onChange={e => setHistoria({...historia, partos: parseInt(e.target.value)||0})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Abortos (A)</Label>
                    <Input type="number" value={historia.abortos} onChange={e => setHistoria({...historia, abortos: parseInt(e.target.value)||0})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Cesáreas (C)</Label>
                    <Input type="number" value={historia.cesareas} onChange={e => setHistoria({...historia, cesareas: parseInt(e.target.value)||0})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Hijos Vivos</Label>
                    <Input type="number" value={historia.hijos_vivos} onChange={e => setHistoria({...historia, hijos_vivos: parseInt(e.target.value)||0})} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Antecedentes Médicos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Antecedentes Médicos</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <Label className="text-red-600">Alergias (Importante)</Label>
                    <Input 
                      value={historia.alergias} 
                      onChange={e => setHistoria({...historia, alergias: e.target.value})} 
                      placeholder="Ninguna conocida / Penicilina, etc."
                      className="border-red-100 focus:border-red-300 bg-red-50/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Enfermedades Crónicas / Cirugías Previas</Label>
                    <Textarea 
                      value={historia.antecedentes_personales} 
                      onChange={e => setHistoria({...historia, antecedentes_personales: e.target.value})}
                      placeholder="Diabetes, Hipertensión, Asma, Cirugías..." 
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Antecedentes Familiares Relevantes</Label>
                    <Textarea 
                      value={historia.antecedentes_familiares} 
                      onChange={e => setHistoria({...historia, antecedentes_familiares: e.target.value})}
                      placeholder="Madre diabética, Padre hipertenso..." 
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Datos del Embarazo Actual */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Embarazo Actual</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Fecha Última Regla (FUM)</Label>
                    <Input type="date" value={historia.fum} onChange={e => setHistoria({...historia, fum: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Fecha Probable Parto (FPP)</Label>
                    <Input type="date" value={historia.fpp} onChange={e => setHistoria({...historia, fpp: e.target.value})} />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}