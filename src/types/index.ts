export interface Programa {
  id: string; 
  nombre: string;
  descripcion: string | undefined; 
  estado: "ACTIVO" | "INACTIVO";
}

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
  peso_recien_nacido: number; // en gramos
  talla_recien_nacido: number; // en cm
  sexo_recien_nacido: "M" | "F";
  observaciones?: string; // Opcional
}