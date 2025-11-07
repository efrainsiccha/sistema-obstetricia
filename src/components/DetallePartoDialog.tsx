// src/components/DetallePartoDialog.tsx

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar, MapPin, User, Baby, Activity, Weight, Ruler } from 'lucide-react';
import { type Parto } from '../types'; // Importamos el tipo real

interface DetallePartoDialogProps {
  parto: Parto; // Usamos el tipo real
  isOpen: boolean;
  onClose: () => void;
}

// Helper para convertir Timestamps
const toDate = (timestamp: { seconds: number; nanoseconds: number } | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
};

export function DetallePartoDialog({ parto, isOpen, onClose }: DetallePartoDialogProps) {
  
  const formatDate = (dateTimestamp: { seconds: number; nanoseconds: number } | Date) => {
    const date = toDate(dateTimestamp); // Usamos el helper
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoBadgeVariant = (tipo: string) => {
    // ... (sin cambios)
    switch (tipo) {
      case 'VAGINAL':
        return 'default';
      case 'CESAREA':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getApgarStatus = (score: number) => {
    // ... (sin cambios)
    if (score >= 7) return { label: 'Normal', color: 'text-green-600' };
    if (score >= 4) return { label: 'Moderado', color: 'text-orange-600' };
    return { label: 'Bajo', color: 'text-red-600' };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Detalles del Parto</DialogTitle>
          <DialogDescription>
            Información completa del parto registrado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información de la Paciente (con campos corregidos) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-primary">Información de la Paciente</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <p className="text-muted-foreground">Nombre Completo</p>
                <p>{parto.paciente_nombres} {parto.paciente_apellidos}</p>
              </div>
              <div>
                <p className="text-muted-foreground">DNI</p>
                <p>{parto.paciente_dni}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información del Parto (con campos corregidos) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-primary">Información del Parto</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-muted-foreground mb-1">Fecha y Hora</p>
                  <p className="capitalize">{formatDate(parto.fecha_parto)}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-muted-foreground mb-1">Tipo de Parto</p>
                  <Badge variant={getTipoBadgeVariant(parto.tipo_parto)} className="mt-1">
                    {parto.tipo_parto}
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Lugar del Parto</p>
                </div>
                <p>{parto.lugar}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información del Recién Nacido (sin cambios) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Baby className="h-5 w-5 text-primary" />
              <h3 className="text-primary">Información del Recién Nacido</h3>
            </div>
            <div className="space-y-4">
              {/* APGAR Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground">APGAR 1 minuto</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`${getApgarStatus(parto.apgar1).color}`}>
                      {parto.apgar1}/10
                    </span>
                    <Badge variant="outline" className={getApgarStatus(parto.apgar1).color}>
                      {getApgarStatus(parto.apgar1).label}
                    </Badge>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground">APGAR 5 minutos</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`${getApgarStatus(parto.apgar5).color}`}>
                      {parto.apgar5}/10
                    </span>
                    <Badge variant="outline" className={getApgarStatus(parto.apgar5).color}>
                      {getApgarStatus(parto.apgar5).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Medidas del Recién Nacido */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Peso</p>
                  </div>
                  <p>{parto.peso_recien_nacido} gramos</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Talla</p>
                  </div>
                  <p>{parto.talla_recien_nacido} cm</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Baby className="h-4 w-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Sexo</p>
                  </div>
                  <p>{parto.sexo_recien_nacido === 'M' ? 'Masculino' : 'Femenino'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {parto.observaciones && (
            <>
              <Separator />
              <div>
                <h3 className="text-primary mb-3">Observaciones</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{parto.observaciones}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}