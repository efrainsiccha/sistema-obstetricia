// src/components/ConsultaDetalleDialog.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Calendar, User, Stethoscope, Activity, Scale, Ruler } from "lucide-react";
// CORREGIDO: Importamos el tipo desde la carpeta correcta
import { type Consulta } from "../types";

interface Props {
  consulta: Consulta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toDate = (timestamp: { seconds: number; nanoseconds: number } | Date): Date => {
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
};

export function ConsultaDetalleDialog({ consulta, open, onOpenChange }: Props) {
  
  const fecha = toDate(consulta.fecha);
  const fechaStr = fecha.toLocaleDateString('es-ES', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Consulta</DialogTitle>
          <DialogDescription>ID: {consulta.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Cabecera: Paciente y Fecha */}
          <div className="flex items-start justify-between bg-muted/30 p-4 rounded-lg">
            <div className="flex gap-3">
              <div className="bg-pink-100 p-2 rounded-full">
                <User className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="font-medium text-lg">{consulta.paciente_nombre_completo}</p>
                <p className="text-sm text-muted-foreground">DNI: {consulta.paciente_dni}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="capitalize">{fechaStr}</span>
              </div>
              <p className="text-sm font-mono mt-1">{horaStr}</p>
            </div>
          </div>

          <Separator />

          {/* Motivo y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Tipo de Consulta</h4>
              <Badge variant={consulta.tipo === 'PRENATAL' ? 'default' : 'secondary'}>
                {consulta.tipo}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Motivo</h4>
              <p className="font-medium">{consulta.motivo}</p>
            </div>
          </div>

          {/* Signos Vitales */}
          <div className="bg-pink-50/50 p-4 rounded-lg border border-pink-100">
            <h4 className="text-sm font-bold text-pink-800 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Signos Vitales y Antropometría
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {consulta.presion_arterial && (
                <div>
                  <p className="text-xs text-muted-foreground">P. Arterial</p>
                  <p className="font-mono font-medium">{consulta.presion_arterial}</p>
                </div>
              )}
              {consulta.peso && (
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="font-medium flex items-center gap-1">
                    <Scale className="h-3 w-3 text-muted-foreground" /> {consulta.peso} kg
                  </p>
                </div>
              )}
              {consulta.talla && (
                <div>
                  <p className="text-xs text-muted-foreground">Talla</p>
                  <p className="font-medium flex items-center gap-1">
                    <Ruler className="h-3 w-3 text-muted-foreground" /> {consulta.talla} cm
                  </p>
                </div>
              )}
              {consulta.edad_gestacional && (
                <div>
                  <p className="text-xs text-muted-foreground">Edad Gest.</p>
                  <p className="font-medium">{consulta.edad_gestacional} sem</p>
                </div>
              )}
            </div>
          </div>

          {/* Diagnóstico */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Stethoscope className="h-5 w-5" />
              <h3 className="font-semibold">Diagnóstico</h3>
            </div>
            <div className="bg-muted/30 p-3 rounded-md border">
              <p className="text-sm leading-relaxed">{consulta.diagnostico}</p>
            </div>
          </div>

          {/* Indicaciones */}
          {consulta.indicaciones && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Indicaciones / Tratamiento</h4>
              <div className="bg-muted/30 p-3 rounded-md border whitespace-pre-wrap text-sm">
                {consulta.indicaciones}
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}