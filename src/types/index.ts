// src/types/index.ts

export interface Programa {
  id: string; 
  nombre: string;
  descripcion: string | undefined; 
  estado: "ACTIVO" | "INACTIVO";
}

export interface Patient {
  id: string; // Será el DNI
  doc_identidad: string; // Lo mantenemos también como campo para facilitar búsquedas
  nombres: string;
  apellidos: string;
  fecha_nacimiento: { seconds: number; nanoseconds: number } | Date;
  edad?: number; // Calculada (opcional guardar, pero útil)
  sexo: "F" | "M"; // Nuevo
  grupo_sanguineo?: string; // Nuevo (A+, O-, etc)
  telefono: string;
  email?: string; // Nuevo
  direccion: string;
  contacto_emergencia?: string; // Nuevo
  sucursal_nombre: string;
  id_sucursal: string;
  estado: string;
}

export interface Parto {
  id: string;
  paciente_nombres: string;
  paciente_apellidos: string;
  paciente_dni: string;
  fecha_parto: { seconds: number; nanoseconds: number } | Date;
  tipo_parto: "VAGINAL" | "CESAREA" | "OTRO";
  lugar: string;
  apgar1: number;
  apgar5: number;
  peso_recien_nacido: number; 
  talla_recien_nacido: number; 
  sexo_recien_nacido: "M" | "F";
  observaciones?: string; 
}