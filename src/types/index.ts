// src/types/index.ts

// 1. TIPO PROGRAMA
export interface Programa {
  id: string; 
  nombre: string;
  descripcion: string | undefined; 
  estado: "ACTIVO" | "INACTIVO";
}

// 2. TIPO PACIENTE (Con Historia Clínica + usuarioId)
export interface Patient {
  id: string; // DNI
  doc_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: { seconds: number; nanoseconds: number } | Date;
  edad?: number; 
  
  // Datos Personales
  sexo: "F" | "M"; 
  grupo_sanguineo?: string; 
  telefono: string;
  email?: string; 
  direccion: string;
  contacto_emergencia?: string; 
  sucursal_nombre: string;
  id_sucursal: string;
  estado: string;

  // --- Historia Clínica (Nuevos Campos) ---
  antecedentes_gestas?: number; // G
  antecedentes_partos?: number; // P
  antecedentes_abortos?: number; // A
  antecedentes_cesareas?: number; // C
  antecedentes_hijos_vivos?: number; // HV
  
  antecedentes_personales?: string; 
  antecedentes_familiares?: string; 
  alergias?: string;
  medicacion_actual?: string;
  
  // Embarazo actual
  fum?: string; 
  fpp?: string; 

  // --- Permisos ---
  usuarioId?: string; // ID del obstetra que lo registró
}

// 3. TIPO PARTO (Con usuarioId)
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
  
  // Permisos
  usuarioId?: string;
}

// 4. TIPO CONSULTA (Con usuarioId)
export interface Consulta {
  id: string;
  id_paciente: string;
  paciente_nombre_completo: string;
  paciente_dni: string;
  fecha: { seconds: number; nanoseconds: number } | Date;
  tipo: "PRENATAL" | "POSTPARTO" | "PLANIFICACION" | "OTRO";
  motivo: string;
  presion_arterial?: string;
  peso?: number;
  talla?: number;
  edad_gestacional?: string;
  diagnostico: string;
  indicaciones: string;
  creado_en?: any;
  
  // Permisos
  usuarioId?: string;
}