import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface RegistrarPartoDialogProps {
  children: React.ReactNode;
  onRegistrar: (parto: any) => void;
}

export function RegistrarPartoDialog({ children, onRegistrar }: RegistrarPartoDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    paciente_nombres: '',
    paciente_apellidos: '',
    paciente_dni: '',
    fecha_parto: '',
    hora_parto: '',
    tipo_parto: 'VAGINAL',
    lugar: '',
    apgar1: '',
    apgar5: '',
    peso_recien_nacido: '',
    talla_recien_nacido: '',
    sexo_recien_nacido: '',
    observaciones: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nuevoParto = {
      paciente: {
        nombres: formData.paciente_nombres,
        apellidos: formData.paciente_apellidos,
        doc_identidad: formData.paciente_dni
      },
      fecha_parto: `${formData.fecha_parto}T${formData.hora_parto}:00`,
      tipo_parto: formData.tipo_parto,
      lugar: formData.lugar,
      apgar1: parseInt(formData.apgar1),
      apgar5: parseInt(formData.apgar5),
      peso_recien_nacido: parseInt(formData.peso_recien_nacido),
      talla_recien_nacido: parseInt(formData.talla_recien_nacido),
      sexo_recien_nacido: formData.sexo_recien_nacido,
      observaciones: formData.observaciones
    };

    onRegistrar(nuevoParto);
    setOpen(false);
    
    // Reset form
    setFormData({
      paciente_nombres: '',
      paciente_apellidos: '',
      paciente_dni: '',
      fecha_parto: '',
      hora_parto: '',
      tipo_parto: 'VAGINAL',
      lugar: '',
      apgar1: '',
      apgar5: '',
      peso_recien_nacido: '',
      talla_recien_nacido: '',
      sexo_recien_nacido: '',
      observaciones: ''
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Parto</DialogTitle>
          <DialogDescription>
            Complete la información del parto y del recién nacido
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Información de la Paciente */}
            <div>
              <h3 className="mb-4 text-primary">Información de la Paciente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente_nombres">Nombres *</Label>
                  <Input
                    id="paciente_nombres"
                    value={formData.paciente_nombres}
                    onChange={(e) => handleChange('paciente_nombres', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paciente_apellidos">Apellidos *</Label>
                  <Input
                    id="paciente_apellidos"
                    value={formData.paciente_apellidos}
                    onChange={(e) => handleChange('paciente_apellidos', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paciente_dni">DNI *</Label>
                  <Input
                    id="paciente_dni"
                    value={formData.paciente_dni}
                    onChange={(e) => handleChange('paciente_dni', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información del Parto */}
            <div>
              <h3 className="mb-4 text-primary">Información del Parto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_parto">Fecha del Parto *</Label>
                  <Input
                    id="fecha_parto"
                    type="date"
                    value={formData.fecha_parto}
                    onChange={(e) => handleChange('fecha_parto', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_parto">Hora del Parto *</Label>
                  <Input
                    id="hora_parto"
                    type="time"
                    value={formData.hora_parto}
                    onChange={(e) => handleChange('hora_parto', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_parto">Tipo de Parto *</Label>
                  <Select
                    value={formData.tipo_parto}
                    onValueChange={(value) => handleChange('tipo_parto', value)}
                  >
                    <SelectTrigger id="tipo_parto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="VAGINAL">Vaginal</SelectItem>
                      <SelectItem value="CESAREA">Cesárea</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lugar">Lugar del Parto *</Label>
                  <Input
                    id="lugar"
                    placeholder="Ej: Hospital Central - Sala 2"
                    value={formData.lugar}
                    onChange={(e) => handleChange('lugar', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información del Recién Nacido */}
            <div>
              <h3 className="mb-4 text-primary">Información del Recién Nacido</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apgar1">APGAR 1 minuto * (0-10)</Label>
                  <Input
                    id="apgar1"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.apgar1}
                    onChange={(e) => handleChange('apgar1', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apgar5">APGAR 5 minutos * (0-10)</Label>
                  <Input
                    id="apgar5"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.apgar5}
                    onChange={(e) => handleChange('apgar5', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peso_recien_nacido">Peso (gramos) *</Label>
                  <Input
                    id="peso_recien_nacido"
                    type="number"
                    placeholder="Ej: 3200"
                    value={formData.peso_recien_nacido}
                    onChange={(e) => handleChange('peso_recien_nacido', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="talla_recien_nacido">Talla (cm) *</Label>
                  <Input
                    id="talla_recien_nacido"
                    type="number"
                    placeholder="Ej: 50"
                    value={formData.talla_recien_nacido}
                    onChange={(e) => handleChange('talla_recien_nacido', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo_recien_nacido">Sexo *</Label>
                  <Select
                    value={formData.sexo_recien_nacido}
                    onValueChange={(value) => handleChange('sexo_recien_nacido', value)}
                  >
                    <SelectTrigger id="sexo_recien_nacido">
                      <SelectValue placeholder="Seleccionar sexo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Detalles adicionales del parto, complicaciones, etc."
                rows={4}
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Parto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
