import { jsPDF } from "jspdf";

/**
 * Builds a professional medical prescription PDF document
 */
export function createPrescriptionDoc(appointment, diagnosisNotes, prescriptionNotes) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Header background
  doc.setFillColor(243, 247, 254);
  doc.rect(0, 0, pageWidth, 110, "F");

  // Clinic / Platform Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(26, 86, 219); // Primary blue
  const clinicName = appointment.doctor?.clinic || "BookEase Healthcare Center";
  doc.text(clinicName, margin, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const clinicAddr = appointment.doctor?.clinicAddress || "Digital Consultation & Clinical Care Platform";
  doc.text(clinicAddr, margin, 55);

  // Doctor Details (Right-aligned in header)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const drName = appointment.doctor?.user?.name || "Dr. Medical Practitioner";
  doc.text(drName, pageWidth - margin, 40, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const specialty = `${appointment.doctor?.specialty || "Specialist"}${appointment.doctor?.qualifications ? ` (${appointment.doctor.qualifications})` : ""}`;
  doc.text(specialty, pageWidth - margin, 55, { align: "right" });

  if (appointment.doctor?.licenseNumber) {
    doc.text(`Reg / License: ${appointment.doctor.licenseNumber}`, pageWidth - margin, 68, { align: "right" });
  }

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1.5);
  doc.line(margin, 110, pageWidth - margin, 110);

  // Patient & Visit Details Box
  let y = 130;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 55, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 55, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  const patientName = appointment.patient?.name || "Patient";
  const visitDate = new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.text(`Patient: ${patientName}`, margin + 14, y + 22);
  doc.text(`Date & Time: ${visitDate}`, pageWidth - margin - 14, y + 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Type: ${appointment.type || "In-person consultation"}`, margin + 14, y + 40);
  doc.text(`Appointment ID: ${appointment.id || "N/A"}`, pageWidth - margin - 14, y + 40, { align: "right" });

  y += 80;

  // Diagnosis Section
  const diag = diagnosisNotes || appointment.diagnosisNotes;
  if (diag && diag.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 86, 219);
    doc.text("DIAGNOSIS & CLINICAL OBSERVATIONS", margin, y);
    y += 6;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    const splitDiag = doc.splitTextToSize(diag.trim(), contentWidth);
    doc.text(splitDiag, margin, y);
    y += splitDiag.length * 14 + 24;
  }

  // Prescription Rx Section
  const rx = prescriptionNotes || appointment.prescriptionNotes;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(26, 86, 219);
  doc.text("Rx", margin, y);

  doc.setFontSize(11);
  doc.text("PRESCRIPTION & MEDICATION ADVICE", margin + 28, y - 2);
  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const rxContent = rx && rx.trim() ? rx.trim() : "No specific prescription medications entered.";
  const splitRx = doc.splitTextToSize(rxContent, contentWidth);
  doc.text(splitRx, margin, y);
  y += splitRx.length * 15 + 40;

  // Doctor Signature & Stamp Area (Bottom)
  const footerY = Math.max(y, pageHeight - 120);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(pageWidth - margin - 180, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(drName, pageWidth - margin - 90, footerY + 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Authorized Medical Practitioner Signature", pageWidth - margin - 90, footerY + 28, {
    align: "center",
  });

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Generated securely via BookEase Smart Clinic Portal · Valid digital prescription",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  return doc;
}

export function downloadPrescriptionPdf(appointment, diagnosisNotes, prescriptionNotes) {
  const doc = createPrescriptionDoc(appointment, diagnosisNotes, prescriptionNotes);
  const dateStr = new Date(appointment.scheduledAt).toISOString().slice(0, 10);
  doc.save(`Prescription-${appointment.patient?.name || "Patient"}-${dateStr}.pdf`);
}

export function generatePrescriptionPdfFile(appointment, diagnosisNotes, prescriptionNotes) {
  const doc = createPrescriptionDoc(appointment, diagnosisNotes, prescriptionNotes);
  const blob = doc.output("blob");
  const dateStr = new Date(appointment.scheduledAt).toISOString().slice(0, 10);
  return new File([blob], `Prescription-${dateStr}.pdf`, { type: "application/pdf" });
}
