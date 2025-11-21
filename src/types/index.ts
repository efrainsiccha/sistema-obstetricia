export interface Programa {
  id: string; 
  nombre: string;
  descripcion: string | undefined; 
  estado: "ACTIVO" | "INACTIVO";
}

// TIPO PACIENTE (Actualizado con Historia Clínica)
export interface Patient {
  id: string; // DNI
  doc_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: { seconds: number; nanoseconds: number } | Date;
  edad?: number; 
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
  
  antecedentes_personales?: string; // Enfermedades crónicas, cirugías
  antecedentes_familiares?: string; // Diabetes en familia, etc.
  alergias?: string;
  medicacion_actual?: string;
  
  // Datos del embarazo actual (si aplica)
  fum?: string; // Fecha Última Regla (string YYYY-MM-DD para facilitar inputs)
  fpp?: string; // Fecha Probable Parto
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
  registrado_por?: string;
  creado_en?: any;
}