// src/types/index.ts

// 1. TIPO PROGRAMA
export interface Programa {
  id: string; 
  nombre: string;
  descripcion: string | undefined; 
  estado: "ACTIVO" | "INACTIVO";
}

// 2. TIPO PACIENTE (Actualizado con los nuevos campos)
export interface Patient {
  id: string; // Será el DNI
  doc_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: { seconds: number; nanoseconds: number } | Date;
  edad?: number; 
  // Campos nuevos obligatorios/opcionales según tu formulario
  sexo: "F" | "M"; 
  grupo_sanguineo?: string; 
  telefono: string;
  email?: string; 
  direccion: string;
  contacto_emergencia?: string; 
  sucursal_nombre: string;
  id_sucursal: string;
  estado: string;
}

// 3. TIPO PARTO
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
//4 TIPO PARA CONSULTAS
export interface Consulta {
  id: string;
  id_paciente: string;
  paciente_nombre_completo: string; // Denormalizado para la tabla
  paciente_dni: string;
  fecha: { seconds: number; nanoseconds: number } | Date;
  tipo: "PRENATAL" | "POSTPARTO" | "PLANIFICACION" | "OTRO";
  motivo: string;
  presion_arterial?: string;
  peso?: number; // kg
  talla?: number; // cm
  edad_gestacional?: string; // semanas
  diagnostico: string;
  indicaciones: string;
  registrado_por: string; // ID del usuario que registró
}