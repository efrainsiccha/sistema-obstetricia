import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Edit, Save, X, Heart, Activity, Thermometer, Weight, Ruler } from "lucide-react";
import type { Consulta } from "../pages/ConsultasPage";

interface ConsultaDetalleDialogProps {
  consulta: Consulta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultaDetalleDialog({ consulta, open, onOpenChange }: ConsultaDetalleDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [signosVitales, setSignosVitales] = useState({
    presion_arterial: consulta.signos_vitales?.presion_arterial || "",
    frecuencia_cardiaca: consulta.signos_vitales?.frecuencia_cardiaca || "",
    temperatura: consulta.signos_vitales?.temperatura || "",
    peso: consulta.signos_vitales?.peso || "",
    altura_uterina: consulta.signos_vitales?.altura_uterina || ""
  });
  const [notas, setNotas] = useState(consulta.notas || "");

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "PROGRAMADA":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "ATENDIDA":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "CANCELADA":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "";
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "PRENATAL":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "POSTPARTO":
        return "bg-pink-100 text-pink-800 hover:bg-pink-100";
      case "PARTO":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      default:
        return "";
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSave = () => {
    // Aquí se guardarían los cambios en Supabase
    console.log("Guardando cambios:", { signosVitales, notas });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Restaurar valores originales
    setSignosVitales({
      presion_arterial: consulta.signos_vitales?.presion_arterial || "",
      frecuencia_cardiaca: consulta.signos_vitales?.frecuencia_cardiaca || "",
      temperatura: consulta.signos_vitales?.temperatura || "",
      peso: consulta.signos_vitales?.peso || "",
      altura_uterina: consulta.signos_vitales?.altura_uterina || ""
    });
    setNotas(consulta.notas || "");
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Detalle de Consulta #{consulta.id_consulta}</DialogTitle>
              <DialogDescription>
                {formatFecha(consulta.fecha_hora)}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getTipoBadgeColor(consulta.tipo)}>
                {consulta.tipo}
              </Badge>
              <Badge className={getEstadoBadgeColor(consulta.estado)}>
                {consulta.estado}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="signos">Signos Vitales</TabsTrigger>
            <TabsTrigger value="notas">Notas Clínicas</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Nombre Completo</Label>
                    <p className="text-gray-900 mt-1">
                      {consulta.paciente.nombres} {consulta.paciente.apellidos}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Documento de Identidad</Label>
                    <p className="text-gray-900 mt-1">{consulta.paciente.doc_identidad}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Obstetra</Label>
                    <p className="text-gray-900 mt-1">{consulta.obstetra.username}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Tipo de Consulta</Label>
                    <p className="text-gray-900 mt-1">{consulta.tipo}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600">Motivo</Label>
                    <p className="text-gray-900 mt-1">{consulta.motivo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Signos Vitales</CardTitle>
                {!isEditing && consulta.estado === "PROGRAMADA" && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="presion">Presión Arterial (mmHg)</Label>
                        <Input
                          id="presion"
                          placeholder="120/80"
                          value={signosVitales.presion_arterial}
                          onChange={(e) => setSignosVitales({...signosVitales, presion_arterial: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frecuencia">Frecuencia Cardíaca (lpm)</Label>
                        <Input
                          id="frecuencia"
                          type="number"
                          placeholder="75"
                          value={signosVitales.frecuencia_cardiaca}
                          onChange={(e) => setSignosVitales({...signosVitales, frecuencia_cardiaca: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="temperatura">Temperatura (°C)</Label>
                        <Input
                          id="temperatura"
                          type="number"
                          step="0.1"
                          placeholder="36.5"
                          value={signosVitales.temperatura}
                          onChange={(e) => setSignosVitales({...signosVitales, temperatura: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="peso">Peso (kg)</Label>
                        <Input
                          id="peso"
                          type="number"
                          step="0.1"
                          placeholder="65"
                          value={signosVitales.peso}
                          onChange={(e) => setSignosVitales({...signosVitales, peso: e.target.value})}
                        />
                      </div>
                      {consulta.tipo === "PRENATAL" && (
                        <div className="space-y-2">
                          <Label htmlFor="altura">Altura Uterina (cm)</Label>
                          <Input
                            id="altura"
                            type="number"
                            placeholder="20"
                            value={signosVitales.altura_uterina}
                            onChange={(e) => setSignosVitales({...signosVitales, altura_uterina: e.target.value})}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {consulta.signos_vitales?.presion_arterial && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Activity className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Presión Arterial</p>
                          <p className="text-gray-900">{consulta.signos_vitales.presion_arterial} mmHg</p>
                        </div>
                      </div>
                    )}
                    {consulta.signos_vitales?.frecuencia_cardiaca && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Heart className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Frecuencia Cardíaca</p>
                          <p className="text-gray-900">{consulta.signos_vitales.frecuencia_cardiaca} lpm</p>
                        </div>
                      </div>
                    )}
                    {consulta.signos_vitales?.temperatura && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Thermometer className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Temperatura</p>
                          <p className="text-gray-900">{consulta.signos_vitales.temperatura}°C</p>
                        </div>
                      </div>
                    )}
                    {consulta.signos_vitales?.peso && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Weight className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Peso</p>
                          <p className="text-gray-900">{consulta.signos_vitales.peso} kg</p>
                        </div>
                      </div>
                    )}
                    {consulta.signos_vitales?.altura_uterina && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Ruler className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Altura Uterina</p>
                          <p className="text-gray-900">{consulta.signos_vitales.altura_uterina} cm</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!isEditing && !consulta.signos_vitales && (
                  <p className="text-gray-500 text-center py-8">
                    No se han registrado signos vitales para esta consulta
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notas" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notas Clínicas</CardTitle>
                {!isEditing && consulta.estado === "PROGRAMADA" && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Ingrese las notas clínicas de la consulta..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      rows={8}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {consulta.notas ? (
                      <p className="text-gray-900 whitespace-pre-wrap">{consulta.notas}</p>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No se han registrado notas clínicas para esta consulta
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
