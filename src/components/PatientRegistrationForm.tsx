import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UserPlus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface PatientFormData {
  doc_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  telefono: string;
  direccion: string;
  id_sucursal: string;
}

interface Props {
  onAddPatient: (patient: PatientFormData) => void;
}

export function PatientRegistrationForm({ onAddPatient }: Props) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>({
    doc_identidad: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    telefono: '',
    direccion: '',
    id_sucursal: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de campos requeridos
    if (!formData.doc_identidad || !formData.nombres || !formData.apellidos || 
        !formData.fecha_nacimiento || !formData.id_sucursal) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    onAddPatient(formData);
    toast.success('Paciente registrado exitosamente');
    
    // Limpiar formulario
    setFormData({
      doc_identidad: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      telefono: '',
      direccion: '',
      id_sucursal: ''
    });
    setOpen(false);
  };

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-600 hover:bg-pink-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Registrar Nueva Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-pink-700 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Registro de Nueva Paciente
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Documento de Identidad */}
            <div className="space-y-2">
              <Label htmlFor="doc_identidad" className="text-slate-700">
                Documento de Identidad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="doc_identidad"
                value={formData.doc_identidad}
                onChange={(e) => handleChange('doc_identidad', e.target.value)}
                placeholder="Ej: 12345678"
                required
                className="border-pink-200 focus:border-pink-400"
              />
            </div>

            {/* Sucursal */}
            <div className="space-y-2">
              <Label htmlFor="sucursal" className="text-slate-700">
                Sucursal <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.id_sucursal} onValueChange={(value) => handleChange('id_sucursal', value)}>
                <SelectTrigger className="border-pink-200 focus:border-pink-400">
                  <SelectValue placeholder="Seleccione una sucursal" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="1">Centro Materno - Lima Centro</SelectItem>
                  <SelectItem value="2">Clínica Esperanza - San Isidro</SelectItem>
                  <SelectItem value="3">Centro Vida - Miraflores</SelectItem>
                  <SelectItem value="4">Maternal Care - Surco</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nombres */}
            <div className="space-y-2">
              <Label htmlFor="nombres" className="text-slate-700">
                Nombres <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombres"
                value={formData.nombres}
                onChange={(e) => handleChange('nombres', e.target.value)}
                placeholder="Nombres de la paciente"
                required
                className="border-pink-200 focus:border-pink-400"
              />
            </div>

            {/* Apellidos */}
            <div className="space-y-2">
              <Label htmlFor="apellidos" className="text-slate-700">
                Apellidos <span className="text-red-500">*</span>
              </Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                placeholder="Apellidos de la paciente"
                required
                className="border-pink-200 focus:border-pink-400"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento" className="text-slate-700">
                Fecha de Nacimiento <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                  required
                  className="border-pink-200 focus:border-pink-400"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400 pointer-events-none" />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-slate-700">
                Teléfono
              </Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="Ej: 987654321"
                className="border-pink-200 focus:border-pink-400"
              />
            </div>

            {/* Dirección */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion" className="text-slate-700">
                Dirección
              </Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Dirección completa"
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
              Registrar Paciente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
