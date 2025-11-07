// src/types/index.ts

// TIPO DE PROGRAMA (CORREGIDO)
export interface Programa {
  id: string; // ID de Firestore (string)
  nombre: string;
  descripcion: string | undefined; // <-- ESTA LÍNEA ES LA SOLUCIÓN
  estado: "ACTIVO" | "INACTIVO";
}

// TIPO DE PACIENTE (Para que esté todo en un solo lugar)
export interface Patient {
  id: string; 
  doc_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: { seconds: number; nanoseconds: number } | Date;
  telefono: string;
  direccion: string;
  sucursal_nombre: string;
  id_sucursal: string;
  estado: string;
}
// TIPO PARA PARTOS
export interface Parto {
  id: string; // ID del documento de Firestore
  paciente_nombres: string;
  paciente_apellidos: string;
  paciente_dni: string;
  fecha_parto: { seconds: number; nanoseconds: number } | Date; // Timestamp de Firestore
  tipo_parto: "VAGINAL" | "CESAREA" | "OTRO";
  lugar: string;
  apgar1: number;
  apgar5: number;
  peso_recien_nacido: number; // en gramos
  talla_recien_nacido: number; // en cm
  sexo_recien_nacido: "M" | "F";
  observaciones?: string; // Opcional
}