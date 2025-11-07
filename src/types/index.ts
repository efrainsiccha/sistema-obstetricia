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