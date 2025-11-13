import { useState, useMemo } from "react";
import { Plus, Search, Calendar, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ConsultaDialog } from "../components/ConsultaDialog";
import { ConsultaDetalleDialog } from "../components/ConsultaDetalleDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export interface Consulta {
  id_consulta: number;
  id_paciente: number;
  paciente: {
    nombres: string;
    apellidos: string;
    doc_identidad: string;
  };
  id_usuario: number;
  obstetra: {
    username: string;
  };
  fecha_hora: string;
  tipo: "PRENATAL" | "POSTPARTO" | "PARTO";
  motivo: string;
  signos_vitales?: {
    presion_arterial?: string;
    frecuencia_cardiaca?: number;
    temperatura?: number;
    peso?: number;
    altura_uterina?: number;
  };
  notas?: string;
  estado: "PROGRAMADA" | "ATENDIDA" | "CANCELADA";
}

// Datos de ejemplo
const consultasMock: Consulta[] = [
  {
    id_consulta: 1,
    id_paciente: 1,
    paciente: {
      nombres: "María Elena",
      apellidos: "Rodríguez García",
      doc_identidad: "72345678"
    },
    id_usuario: 2,
    obstetra: {
      username: "Dra. Carmen López"
    },
    fecha_hora: "2025-10-20T09:00:00",
    tipo: "PRENATAL",
    motivo: "Control prenatal - Segundo trimestre",
    signos_vitales: {
      presion_arterial: "110/70",
      frecuencia_cardiaca: 78,
      temperatura: 36.5,
      peso: 68,
      altura_uterina: 18
    },
    estado: "PROGRAMADA"
  },
  {
    id_consulta: 2,
    id_paciente: 2,
    paciente: {
      nombres: "Ana Patricia",
      apellidos: "Flores Medina",
      doc_identidad: "71234567"
    },
    id_usuario: 2,
    obstetra: {
      username: "Dra. Carmen López"
    },
    fecha_hora: "2025-10-18T14:30:00",
    tipo: "PRENATAL",
    motivo: "Control de rutina - Tercer trimestre",
    signos_vitales: {
      presion_arterial: "120/80",
      frecuencia_cardiaca: 82,
      temperatura: 36.8,
      peso: 75,
      altura_uterina: 32
    },
    notas: "Paciente presenta evolución favorable. Feto en presentación cefálica. Se solicitan análisis de laboratorio.",
    estado: "ATENDIDA"
  },
  {
    id_consulta: 3,
    id_paciente: 3,
    paciente: {
      nombres: "Lucía",
      apellidos: "Vargas Pérez",
      doc_identidad: "70123456"
    },
    id_usuario: 3,
    obstetra: {
      username: "Dr. Roberto Sánchez"
    },
    fecha_hora: "2025-10-17T10:00:00",
    tipo: "POSTPARTO",
    motivo: "Control postparto - 7 días",
    signos_vitales: {
      presion_arterial: "115/75",
      frecuencia_cardiaca: 75,
      temperatura: 36.6,
      peso: 62
    },
    notas: "Evolución postparto normal. Lactancia establecida. Se brinda consejería sobre cuidados del recién nacido.",
    estado: "ATENDIDA"
  },
  {
    id_consulta: 4,
    id_paciente: 4,
    paciente: {
      nombres: "Isabel",
      apellidos: "Torres Ramírez",
      doc_identidad: "73456789"
    },
    id_usuario: 2,
    obstetra: {
      username: "Dra. Carmen López"
    },
    fecha_hora: "2025-10-22T11:00:00",
    tipo: "PRENATAL",
    motivo: "Primera consulta prenatal",
    estado: "PROGRAMADA"
  },
  {
    id_consulta: 5,
    id_paciente: 5,
    paciente: {
      nombres: "Rosa María",
      apellidos: "Castillo Díaz",
      doc_identidad: "69876543"
    },
    id_usuario: 3,
    obstetra: {
      username: "Dr. Roberto Sánchez"
    },
    fecha_hora: "2025-10-15T08:30:00",
    tipo: "PARTO",
    motivo: "Atención de parto",
    signos_vitales: {
      presion_arterial: "125/85",
      frecuencia_cardiaca: 90,
      temperatura: 37.0
    },
    notas: "Parto vaginal sin complicaciones. Recién nacido sano. APGAR 9/10.",
    estado: "ATENDIDA"
  },
  {
    id_consulta: 6,
    id_paciente: 1,
    paciente: {
      nombres: "María Elena",
      apellidos: "Rodríguez García",
      doc_identidad: "72345678"
    },
    id_usuario: 2,
    obstetra: {
      username: "Dra. Carmen López"
    },
    fecha_hora: "2025-10-10T16:00:00",
    tipo: "PRENATAL",
    motivo: "Control prenatal de rutina",
    estado: "CANCELADA"
  }
];

export function ConsultasPage() {
  const navigate = useNavigate();
  const [consultas] = useState<Consulta[]>(consultasMock);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("TODOS");
  const [estadoFilter, setEstadoFilter] = useState<string>("TODOS");
  const [obstetraFilter, setObstetraFilter] = useState<string>("TODOS");
  const [pacienteFilter, setPacienteFilter] = useState<string>("TODOS");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  // Filtrar consultas
  const uniqueObstetras = useMemo(() => {
    const setNames = new Set<string>();
    consultas.forEach(c => setNames.add(c.obstetra.username));
    return Array.from(setNames).sort();
  }, [consultas]);

  const uniquePacientes = useMemo(() => {
    const map = new Map<string, string>();
    consultas.forEach(c => {
      const label = `${c.paciente.nombres} ${c.paciente.apellidos} - ${c.paciente.doc_identidad}`;
      map.set(c.paciente.doc_identidad, label);
    });
    return Array.from(map.entries()).map(([dni, label]) => ({ dni, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [consultas]);

  const consultasFiltradas = useMemo(() => {
    return consultas.filter(consulta => {
      const matchSearch = searchTerm === "" || 
        consulta.paciente.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulta.paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulta.paciente.doc_identidad.includes(searchTerm);
      
      const matchTipo = tipoFilter === "TODOS" || consulta.tipo === tipoFilter;
      const matchEstado = estadoFilter === "TODOS" || consulta.estado === estadoFilter;
      const matchObstetra = obstetraFilter === "TODOS" || consulta.obstetra.username === obstetraFilter;
      const matchPaciente = pacienteFilter === "TODOS" || consulta.paciente.doc_identidad === pacienteFilter;

      return matchSearch && matchTipo && matchEstado && matchObstetra && matchPaciente;
    });
  }, [consultas, searchTerm, tipoFilter, estadoFilter, obstetraFilter, pacienteFilter]);

  // Agrupar por estado
  const consultasProgramadas = consultasFiltradas.filter(c => c.estado === "PROGRAMADA");
  const consultasAtendidas = consultasFiltradas.filter(c => c.estado === "ATENDIDA");

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
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVerDetalle = (consulta: Consulta) => {
    setSelectedConsulta(consulta);
    setIsDetalleOpen(true);
  };

  const renderConsultaRow = (consulta: Consulta) => (
    <TableRow 
      key={consulta.id_consulta}
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => handleVerDetalle(consulta)}
    >
      <TableCell>
        <div>
          <div>{consulta.paciente.nombres} {consulta.paciente.apellidos}</div>
          <div className="text-gray-500 text-sm">DNI: {consulta.paciente.doc_identidad}</div>
        </div>
      </TableCell>
      <TableCell>{formatFecha(consulta.fecha_hora)}</TableCell>
      <TableCell>
        <Badge className={getTipoBadgeColor(consulta.tipo)}>
          {consulta.tipo}
        </Badge>
      </TableCell>
      <TableCell>{consulta.motivo}</TableCell>
      <TableCell>{consulta.obstetra.username}</TableCell>
      <TableCell>
        <Badge className={getEstadoBadgeColor(consulta.estado)}>
          {consulta.estado}
        </Badge>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - More compact */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/home')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Consultas</h1>
                <p className="text-sm text-gray-600">
                  Administra las consultas prenatales, postparto y de parto
                </p>
              </div>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gray-900 hover:bg-gray-800">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Consulta
            </Button>
          </div>

          {/* Stats Cards - More compact and horizontal */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Total Consultas</p>
                    <p className="text-2xl font-bold text-gray-900">{consultas.length}</p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Programadas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {consultas.filter(c => c.estado === "PROGRAMADA").length}
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Atendidas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {consultas.filter(c => c.estado === "ATENDIDA").length}
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Prenatales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {consultas.filter(c => c.tipo === "PRENATAL").length}
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm border-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <Input
                placeholder="Buscar por nombre o DNI del paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 border-gray-200 h-10 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-48 border-gray-200 bg-white h-10">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              <SelectItem value="PRENATAL">Prenatal</SelectItem>
              <SelectItem value="POSTPARTO">Postparto</SelectItem>
              <SelectItem value="PARTO">Parto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-48 border-gray-200 bg-white h-10">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="PROGRAMADA">Programada</SelectItem>
              <SelectItem value="ATENDIDA">Atendida</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={obstetraFilter} onValueChange={setObstetraFilter}>
            <SelectTrigger className="w-56 border-gray-200 bg-white h-10">
              <SelectValue placeholder="Todos los obstetras" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="TODOS">Todos los obstetras</SelectItem>
              {uniqueObstetras.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pacienteFilter} onValueChange={setPacienteFilter}>
            <SelectTrigger className="w-64 border-gray-200 bg-white h-10">
              <SelectValue placeholder="Todos los pacientes" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="TODOS">Todos los pacientes</SelectItem>
              {uniquePacientes.map(p => (
                <SelectItem key={p.dni} value={p.dni}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="todas" className="space-y-3">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="todas" className="text-sm">
              Todas ({consultasFiltradas.length})
            </TabsTrigger>
            <TabsTrigger value="programadas" className="text-sm">
              Programadas ({consultasProgramadas.length})
            </TabsTrigger>
            <TabsTrigger value="atendidas" className="text-sm">
              Atendidas ({consultasAtendidas.length})
            </TabsTrigger>
            <TabsTrigger value="historial" className="text-sm">
              Historial Clínico ({consultasAtendidas.length})
            </TabsTrigger>
            <TabsTrigger value="controles" className="text-sm">
              Controles ({consultasFiltradas.filter(c => c.tipo === "PRENATAL").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="mt-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="bg-white rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Paciente</TableHead>
                        <TableHead className="font-semibold text-gray-700">Fecha y Hora</TableHead>
                        <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                        <TableHead className="font-semibold text-gray-700">Motivo</TableHead>
                        <TableHead className="font-semibold text-gray-700">Obstetra</TableHead>
                        <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultasFiltradas.length > 0 ? (
                        consultasFiltradas.map(renderConsultaRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No se encontraron consultas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programadas" className="mt-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="bg-white rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Paciente</TableHead>
                        <TableHead className="font-semibold text-gray-700">Fecha y Hora</TableHead>
                        <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                        <TableHead className="font-semibold text-gray-700">Motivo</TableHead>
                        <TableHead className="font-semibold text-gray-700">Obstetra</TableHead>
                        <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultasProgramadas.length > 0 ? (
                        consultasProgramadas.map(renderConsultaRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No hay consultas programadas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atendidas" className="mt-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="bg-white rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Paciente</TableHead>
                        <TableHead className="font-semibold text-gray-700">Fecha y Hora</TableHead>
                        <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                        <TableHead className="font-semibold text-gray-700">Motivo</TableHead>
                        <TableHead className="font-semibold text-gray-700">Obstetra</TableHead>
                        <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultasAtendidas.length > 0 ? (
                        consultasAtendidas.map(renderConsultaRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No hay consultas atendidas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <TabsContent value="historial" className="mt-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="bg-white rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">Paciente</TableHead>
                      <TableHead className="font-semibold text-gray-700">Fecha y Hora</TableHead>
                      <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                      <TableHead className="font-semibold text-gray-700">Motivo</TableHead>
                      <TableHead className="font-semibold text-gray-700">Obstetra</TableHead>
                      <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultasAtendidas.length > 0 ? (
                      consultasAtendidas.map(renderConsultaRow)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No hay historial clínico
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controles" className="mt-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="bg-white rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">Paciente</TableHead>
                      <TableHead className="font-semibold text-gray-700">Fecha y Hora</TableHead>
                      <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                      <TableHead className="font-semibold text-gray-700">Motivo</TableHead>
                      <TableHead className="font-semibold text-gray-700">Obstetra</TableHead>
                      <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultasFiltradas.filter(c => c.tipo === "PRENATAL").length > 0 ? (
                      consultasFiltradas.filter(c => c.tipo === "PRENATAL").map(renderConsultaRow)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No hay controles prenatales
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>

      {/* Dialogs */}
      <ConsultaDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
      
      {selectedConsulta && (
        <ConsultaDetalleDialog
          consulta={selectedConsulta}
          open={isDetalleOpen}
          onOpenChange={setIsDetalleOpen}
        />
      )}
    </div>
  );
}
