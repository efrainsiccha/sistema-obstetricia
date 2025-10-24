import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import { ConsultasPage } from "./pages/ConsultasPage";
import PacientesPage from "./pages/PacientesPage";
import { PartosPage } from "./pages/PartosPage";
import ProgramasPage from "./pages/ProgramasPage";
import DerivacionesPage from "./pages/DerivacionesPage";
import DiagnosticosPage from "./pages/DiagnosticosPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/consultas" element={<ConsultasPage />} />
        <Route path="/pacientes" element={<PacientesPage />} />
        <Route path="/partos" element={<PartosPage />} />
        <Route path="/programas" element={<ProgramasPage />} />
        <Route path="/derivaciones" element={<DerivacionesPage />} />
        <Route path="/diagnosticos" element={<DiagnosticosPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
