// 1. TIPO PROGRAMA
export interface Programa {
  id: string; 
  nombre: string;
  descripcion: string | undefined; 
  estado: "ACTIVO" | "INACTIVO";
}

// 2. TIPO PACIENTE
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
  
  // Historia Clínica
  antecedentes_gestas?: number;
  antecedentes_partos?: number;
  antecedentes_abortos?: number;
  antecedentes_cesareas?: number;
  antecedentes_hijos_vivos?: number;
  antecedentes_personales?: string; 
  antecedentes_familiares?: string; 
  alergias?: string;
  medicacion_actual?: string;
  fum?: string; 
  fpp?: string; 

  usuarioId?: string;
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
  usuarioId?: string;
}

// 4. TIPO CONSULTA
export interface Consulta {
  id: string;
  id_paciente: string;
  paciente_nombre_completo: string;
  paciente_dni: string;
  fecha: { seconds: number; nanoseconds: number } | Date;
  tipo: "PRENATAL" | "POSTPARTO" | "PLANIFICACION" | "OTRO";
  estado_consulta: "PROGRAMADA" | "ATENDIDA" | "CANCELADA"; 
  motivo: string;
  presion_arterial?: string;
  peso?: number;
  talla?: number;
  edad_gestacional?: string;
  diagnostico: string;
  indicaciones: string;
  creado_en?: any;
  usuarioId?: string;
}

// 5. TIPO DERIVACIÓN
export interface Derivacion {
  id: string;
  id_paciente: string;
  paciente_nombre: string;
  paciente_dni: string;
  especialidad: string;
  motivo: string;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  fecha: { seconds: number; nanoseconds: number } | Date;
  estado: "PENDIENTE" | "COMPLETADA" | "ANULADA";
  
  observaciones?: string;
  usuarioId?: string;
}

// 6. TIPO DIAGNÓSTICO
export interface Diagnostico {
  id: string;
  id_paciente: string;
  paciente_nombre: string;
  paciente_dni: string;
  cie10: string; 
  descripcion: string;
  fecha: { seconds: number; nanoseconds: number } | Date;
  tipo: "PRESUNTIVO" | "DEFINITIVO";
  usuarioId?: string;
}
// 7. TIPO INSCRIPCIÓN A PROGRAMA
export interface Inscripcion {
  id: string;
  id_paciente: string;
  paciente_dni: string;
  paciente_nombre: string;
  id_programa: string;
  nombre_programa: string; // Denormalizado para no hacer doble consulta
  fecha_inicio: { seconds: number; nanoseconds: number } | Date;
  etapa?: string; // Ej: "1er Trimestre", "Fase Inicial"
  estado: "ACTIVO" | "INACTIVO" | "COMPLETADO";
  observaciones?: string;
  usuarioId?: string;
}