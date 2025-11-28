import jsPDF from "jspdf";
import { type Patient, type Consulta } from "../types";

export const generateRecetaPDF = (consulta: Consulta, paciente: Patient) => {
  const doc = new jsPDF();
  
  // --- CONFIGURACIÓN ESTÉTICA ---
  const primaryColor = "#be185d"; // Un tono rosado/médico (Pink-700)
  const secondaryColor = "#4b5563"; // Gris oscuro

  // 1. ENCABEZADO (Logo y Clínica)
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 25, "F"); // Barra superior de color
  
  doc.setTextColor("#ffffff");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Centro Obstétrico Vida", 105, 12, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Av. Principal 123 - Tel: (51) 976908412", 105, 19, { align: "center" });

  // 2. TÍTULO DEL DOCUMENTO
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RECETA MÉDICA", 105, 40, { align: "center" });
  doc.setLineWidth(0.5);
  doc.setDrawColor(primaryColor);
  doc.line(80, 42, 130, 42); // Línea subrayado

  // 3. DATOS DEL PACIENTE (Caja gris)
  doc.setFillColor("#f3f4f6");
  doc.roundedRect(15, 50, 180, 25, 3, 3, "F");
  
  doc.setTextColor(secondaryColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PACIENTE:", 20, 60);
  doc.text("DNI:", 120, 60);
  doc.text("EDAD:", 160, 60);
  doc.text("FECHA:", 20, 70);

  doc.setFont("helvetica", "normal");
  doc.text(`${paciente.nombres} ${paciente.apellidos}`, 45, 60);
  doc.text(paciente.doc_identidad, 130, 60);
  
  let edad = paciente.edad ? paciente.edad.toString() : "";
  if (!edad && paciente.fecha_nacimiento) {
     const nac = new Date((paciente.fecha_nacimiento as any).seconds * 1000);
     edad = (new Date().getFullYear() - nac.getFullYear()).toString();
  }
  doc.text(`${edad} años`, 175, 60);

  // Fecha de la consulta
  const fechaConsulta = new Date((consulta.fecha as any).seconds * 1000).toLocaleDateString();
  doc.text(fechaConsulta, 45, 70);

  // 4. CUERPO DE LA RECETA
  let yPos = 95;

  // Diagnóstico
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("DIAGNÓSTICO:", 20, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#000000");
  // splitTextToSize ajusta el texto largo para que no se salga de la hoja
  const dxLines = doc.splitTextToSize(consulta.diagnostico.toUpperCase(), 170);
  doc.text(dxLines, 20, yPos + 7);
  yPos += 15 + (dxLines.length * 5);

  // Indicaciones / Tratamiento (RP)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("INDICACIONES / TRATAMIENTO (Rp):", 20, yPos);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#000000");
  const indicacionesLines = doc.splitTextToSize(consulta.indicaciones || "Sin indicaciones específicas.", 170);
  doc.text(indicacionesLines, 20, yPos + 7);

  // 5. PIE DE PÁGINA (Firma)
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  
  // Línea para firma
  doc.setLineWidth(0.5);
  doc.setDrawColor("#000000");
  doc.line(70, 250, 140, 250);
  
  doc.text("FIRMA Y SELLO DEL OBSTETRA", 105, 255, { align: "center" });
  doc.setFontSize(8);
  doc.text("Válido solo por 30 días", 105, 265, { align: "center" });

  // 6. GUARDAR
  doc.save(`Receta_${paciente.doc_identidad}_${fechaConsulta.replace(/\//g, "-")}.pdf`);
};