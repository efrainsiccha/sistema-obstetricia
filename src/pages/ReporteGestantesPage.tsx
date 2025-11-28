import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Baby, 
  AlertTriangle, 
  Search, 
  Filter,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Loader2 } from "lucide-react";

// Firebase
import { db } from "../lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Patient } from "../types";

// --- Tipos Auxiliares para el Reporte ---
interface GestanteReporte extends Patient {
  semanasGestacion: number;
  trimestre: 1 | 2 | 3;
  factoresRiesgo: string[];
  nivelRiesgo: "ALTO" | "BAJO";
}

export default function ReporteGestantesPage() {
  const navigate = useNavigate();
  const [gestantes, setGestantes] = useState<GestanteReporte[]>([]);
  const [filteredList, setFilteredList] = useState<GestanteReporte[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState("");
  const [filterTrimestre, setFilterTrimestre] = useState("TODOS");
  const [filterRiesgo, setFilterRiesgo] = useState("TODOS");

  // 1. Cargar y Procesar Datos
  useEffect(() => {
    const fetchGestantes = async () => {
      try {
        // Traemos solo pacientes mujeres y activas
        const q = query(
          collection(db, "pacientes"), 
          where("sexo", "==", "F"),
          where("estado", "==", "ACTIVO")
        );
        
        const snapshot = await getDocs(q);
        const hoy = new Date();

        const processedData: GestanteReporte[] = [];

        snapshot.forEach(doc => {
          const data = doc.data() as Patient;
          
          // Solo procesamos si tiene FUM (indica embarazo activo)
          if (data.fum) {
            // A. Calcular Edad Gestacional (Semanas)
            const fumDate = new Date(data.fum + "T00:00:00"); 
            const diffTime = Math.abs(hoy.getTime() - fumDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            const semanas = Math.floor(diffDays / 7);

            // B. Calcular Trimestre
            let trim: 1 | 2 | 3 = 1;
            if (semanas > 13 && semanas <= 26) trim = 2;
            if (semanas > 26) trim = 3;

            // C. Algoritmo de Riesgo (Básico)
            const riesgos: string[] = [];
            
            // C1. Edad Materna
            let edad = 0;
            if (data.fecha_nacimiento) {
               // Manejo seguro de Timestamp o Date
               const fechaNac = (data.fecha_nacimiento as any).seconds 
                 ? new Date((data.fecha_nacimiento as any).seconds * 1000)
                 : new Date(data.fecha_nacimiento as any);
               
               edad = hoy.getFullYear() - fechaNac.getFullYear();
            }
            if (edad > 0 && edad < 18) riesgos.push("Adolescente");
            if (edad > 35) riesgos.push("Edad Avanzada");

            // C2. Antecedentes Obstétricos
            if ((data.antecedentes_cesareas || 0) > 0) riesgos.push("Cesárea Previa");
            if ((data.antecedentes_abortos || 0) > 0) riesgos.push("Abortos Previos");

            // Construir objeto (CORREGIDO EL ORDEN DEL SPREAD)
            processedData.push({
              ...data,        // 1. Primero esparcimos los datos originales
              id: doc.id,     // 2. Luego aseguramos que el ID sea el del documento
              semanasGestacion: semanas,
              trimestre: trim,
              factoresRiesgo: riesgos,
              nivelRiesgo: riesgos.length > 0 ? "ALTO" : "BAJO"
            });
          }
        });

        // Ordenar por semanas de gestación (Mayor a menor)
        processedData.sort((a, b) => b.semanasGestacion - a.semanasGestacion);

        setGestantes(processedData);
        setFilteredList(processedData);

      } catch (error) {
        console.error("Error calculando reporte:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGestantes();
  }, []);

  // 2. Filtrado Dinámico
  useEffect(() => {
    let result = gestantes;

    // Filtro texto
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(g => 
        g.nombres.toLowerCase().includes(lower) || 
        g.apellidos.toLowerCase().includes(lower) ||
        g.doc_identidad.includes(search)
      );
    }

    // Filtro Trimestre
    if (filterTrimestre !== "TODOS") {
      result = result.filter(g => g.trimestre.toString() === filterTrimestre);
    }

    // Filtro Riesgo
    if (filterRiesgo !== "TODOS") {
      result = result.filter(g => g.nivelRiesgo === filterRiesgo);
    }

    setFilteredList(result);
  }, [search, filterTrimestre, filterRiesgo, gestantes]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      </div>
    );
  }

  // Cálculos para las tarjetas
  const totalGestantes = gestantes.length;
  const altoRiesgo = gestantes.filter(g => g.nivelRiesgo === "ALTO").length;
  const tercerTrimestre = gestantes.filter(g => g.trimestre === 3).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-pink-600" onClick={() => navigate('/home')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Baby className="h-8 w-8 text-pink-600" />
            Reporte de Gestantes
          </h1>
          <p className="text-muted-foreground">
            Monitorización por edad gestacional y factores de riesgo calculados.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar / Imprimir
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-pink-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Padrón</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-700">{totalGestantes}</div>
            <p className="text-xs text-muted-foreground">Gestantes activas con FUM</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alto Riesgo Detectado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{altoRiesgo}</div>
            <p className="text-xs text-muted-foreground">Por edad o antecedentes</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">3er Trimestre (27+ sem)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{tercerTrimestre}</div>
            <p className="text-xs text-muted-foreground">Próximas al parto</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o DNI..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterTrimestre} onValueChange={setFilterTrimestre}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground"/>
                    <SelectValue placeholder="Trimestre" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los trimestres</SelectItem>
                <SelectItem value="1">1er Trimestre (1-13 sem)</SelectItem>
                <SelectItem value="2">2do Trimestre (14-26 sem)</SelectItem>
                <SelectItem value="3">3er Trimestre (27+ sem)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRiesgo} onValueChange={setFilterRiesgo}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground"/>
                    <SelectValue placeholder="Nivel de Riesgo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los niveles</SelectItem>
                <SelectItem value="ALTO">Alto Riesgo</SelectItem>
                <SelectItem value="BAJO">Bajo Riesgo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Resultados */}
      <Card className="shadow-lg border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[300px]">Gestante</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>FUM / FPP</TableHead>
                <TableHead className="text-center">Semanas (EG)</TableHead>
                <TableHead className="text-center">Trimestre</TableHead>
                <TableHead>Factores de Riesgo</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No se encontraron registros con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{g.nombres} {g.apellidos}</span>
                        <span className="text-xs text-muted-foreground">DNI: {g.doc_identidad}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        {g.edad || (g.fecha_nacimiento ? new Date().getFullYear() - new Date((g.fecha_nacimiento as any).seconds * 1000).getFullYear() : "-")} años
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col text-xs">
                            <span className="text-muted-foreground">FUM: {g.fum || "-"}</span>
                            <span className="font-medium text-pink-600">
                                FPP: {g.fpp || "-"}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-lg font-bold text-gray-800">{g.semanasGestacion}</span>
                            <span className="text-xs text-muted-foreground">sem</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-gray-100">
                            {g.trimestre}º Trim
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {g.factoresRiesgo.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {g.factoresRiesgo.map(r => (
                                    <Badge key={r} variant="destructive" className="text-[10px] bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
                                        {r}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                Sin riesgo aparente
                            </Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-pink-600 hover:bg-pink-50"
                            onClick={() => navigate(`/pacientes/${g.doc_identidad}`)}
                        >
                            Ver Historia
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}