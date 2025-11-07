// Tipo para Pacientes 
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

export interface Programa {
  id: string;
  nombre: string;
  descripcion: string;
  estado: "ACTIVO" | "INACTIVO";
}