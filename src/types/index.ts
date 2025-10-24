export interface Programa {
  id_programa: number;
  nombre: string;
  descripcion: string;
  estado: "ACTIVO" | "INACTIVO";
}