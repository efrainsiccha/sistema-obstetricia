import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConsultaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultaDialog({ open, onOpenChange }: ConsultaDialogProps) {
  const [fecha, setFecha] = useState<Date>();
  const [hora, setHora] = useState("09:00");
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [selectedObstetra, setSelectedObstetra] = useState("");
  const [tipo, setTipo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [estado, setEstado] = useState("PROGRAMADA");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se enviaría la data a Supabase
    console.log("Nueva consulta:", {
      fecha,
      hora,
      selectedPaciente,
      selectedObstetra,
      tipo,
      motivo,
      estado
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle>Nueva Consulta</DialogTitle>
          <DialogDescription>
            Registra una nueva consulta en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Paciente */}
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente *</Label>
              <Select value={selectedPaciente} onValueChange={setSelectedPaciente}>
                <SelectTrigger id="paciente">
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="1">María Elena Rodríguez García - DNI: 72345678</SelectItem>
                  <SelectItem value="2">Ana Patricia Flores Medina - DNI: 71234567</SelectItem>
                  <SelectItem value="3">Lucía Vargas Pérez - DNI: 70123456</SelectItem>
                  <SelectItem value="4">Isabel Torres Ramírez - DNI: 73456789</SelectItem>
                  <SelectItem value="5">Rosa María Castillo Díaz - DNI: 69876543</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Consulta */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Consulta *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="PRENATAL">Prenatal</SelectItem>
                  <SelectItem value="POSTPARTO">Postparto</SelectItem>
                  <SelectItem value="PARTO">Parto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={setFecha}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>

            {/* Obstetra */}
            <div className="space-y-2">
              <Label htmlFor="obstetra">Obstetra Asignado *</Label>
              <Select value={selectedObstetra} onValueChange={setSelectedObstetra}>
                <SelectTrigger id="obstetra">
                  <SelectValue placeholder="Seleccionar obstetra" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="2">Dra. Carmen López</SelectItem>
                  <SelectItem value="3">Dr. Roberto Sánchez</SelectItem>
                  <SelectItem value="4">Dra. Patricia Mendoza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la Consulta *</Label>
              <Textarea
                id="motivo"
                placeholder="Describe el motivo de la consulta..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="PROGRAMADA">Programada</SelectItem>
                  <SelectItem value="ATENDIDA">Atendida</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Consulta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
