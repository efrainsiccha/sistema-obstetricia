import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import AdminPage from "./pages/AdminPage"; 
import PacientesPage from "./pages/PacientesPage";
import ProgramasPage from "./pages/ProgramasPage";
import PacienteDetallePage from "./pages/PacienteDetallePage";
import ReporteObstetraPage from "./pages/ReporteObstetraPage";
import PerfilPage from "./pages/PerfilPage"; 
import { ConsultasPage } from "./pages/ConsultasPage";
import { PartosPage } from "./pages/PartosPage";
import { DerivacionesPage } from "./pages/DerivacionesPage";
import { DiagnosticosPage } from "./pages/DiagnosticosPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/reportes/obstetra" element={<ReporteObstetraPage />} />
          
          <Route path="/perfil" element={<PerfilPage />} />

          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/pacientes/:id" element={<PacienteDetallePage />} />
          
          <Route path="/consultas" element={<ConsultasPage />} />
          <Route path="/partos" element={<PartosPage />} />
          <Route path="/programas" element={<ProgramasPage />} />
          <Route path="/derivaciones" element={<DerivacionesPage />} />
          <Route path="/diagnosticos" element={<DiagnosticosPage />} />
        </Route>
      </Routes>
    </Router>
  );
}