import { useState, useEffect, useRef } from "react";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { db, storage } from "../lib/firebaseConfig";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2, UploadCloud, FileText, Image as ImageIcon, Trash2, Eye} from "lucide-react";
import { toast } from "sonner";

interface Props {
  patientId: string;
}

interface PatientFile {
  id: string;
  nombre: string;
  url: string;
  tipo: string; // 'image/jpeg', 'application/pdf', etc.
  path: string; // Ruta en Storage para poder borrarlo
  fecha: any;
}

export function PatientFilesTab({ patientId }: Props) {
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar Archivos en Tiempo Real
  useEffect(() => {
    const q = query(
      collection(db, "archivos_pacientes"),
      where("patientId", "==", patientId),
      orderBy("fecha", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PatientFile));
      setFiles(lista);
    });

    return () => unsubscribe();
  }, [patientId]);

  // 2. Manejar Subida de Archivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (Ej: Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande (Máx 5MB)");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // A. Crear referencia en Storage: pacientes/ID_PACIENTE/timestamp_nombre
      const storagePath = `pacientes/${patientId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);

      // B. Subir con monitoreo de progreso
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(prog));
        },
        (error) => {
          console.error(error);
          toast.error("Error al subir archivo");
          setIsUploading(false);
        },
        async () => {
          // C. Subida completada: Obtener URL y guardar en Firestore
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, "archivos_pacientes"), {
            patientId: patientId,
            nombre: file.name,
            url: downloadURL,
            tipo: file.type,
            path: storagePath,
            fecha: Timestamp.now()
          });

          toast.success("Archivo subido correctamente");
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      );

    } catch (error) {
      console.error(error);
      setIsUploading(false);
      toast.error("Error inesperado al subir");
    }
  };

  // 3. Borrar Archivo
  const handleDelete = async (file: PatientFile) => {
    if (!confirm("¿Estás segura de eliminar este archivo?")) return;

    try {
      // A. Borrar de Storage
      const storageRef = ref(storage, file.path);
      await deleteObject(storageRef);

      // B. Borrar referencia de Firestore
      await deleteDoc(doc(db, "archivos_pacientes", file.id));
      
      toast.success("Archivo eliminado");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el archivo");
    }
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <Card className="mt-6 border-t-4 border-t-blue-500 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <UploadCloud className="h-5 w-5" /> Expediente Multimedia
            </CardTitle>
            <CardDescription>Ecografías, análisis de laboratorio y documentos escaneados.</CardDescription>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
              accept="image/*,.pdf" // Acepta imágenes y PDFs
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Subir Archivo
            </Button>
          </div>
        </div>
        
        {/* Barra de Progreso */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            <p className="text-xs text-right text-muted-foreground mt-1">Subiendo... {progress}%</p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-muted-foreground">No hay archivos en el expediente.</p>
            <p className="text-xs text-gray-400">Sube ecografías o resultados de laboratorio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.id} className="group relative border rounded-xl overflow-hidden hover:shadow-lg transition-all bg-white">
                {/* Vista Previa */}
                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  {isImage(file.tipo) ? (
                    <img src={file.url} alt={file.nombre} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <FileText className="h-12 w-12 mb-2" />
                      <span className="text-xs uppercase font-bold">Documento PDF</span>
                    </div>
                  )}
                  
                  {/* Overlay de acciones */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="icon" className="rounded-full" onClick={() => window.open(file.url, '_blank')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="rounded-full" onClick={() => handleDelete(file)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Footer del archivo */}
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-sm truncate w-full pr-2" title={file.nombre}>
                      {file.nombre}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {new Date(file.fecha.seconds * 1000).toLocaleDateString()}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground uppercase">{file.tipo.split('/')[1]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}