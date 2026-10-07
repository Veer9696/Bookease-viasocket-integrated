import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "../../services/appointmentsApi";
import Modal from "../common/Modal";
import Button from "../common/Button";
import ErrorBanner from "../common/ErrorBanner";
import FormField, { inputClass } from "../common/FormField";
import { useToast } from "../common/Toast";
import {
  downloadPrescriptionPdf,
  generatePrescriptionPdfFile,
} from "../../utils/prescriptionPdf";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function MedicalRecordModal({ appointment, onClose }) {
  const [diagnosis, setDiagnosis] = useState(appointment.diagnosisNotes || "");
  const [prescription, setPrescription] = useState(appointment.prescriptionNotes || "");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const save = useMutation({
    mutationFn: (formData) => appointmentsApi.saveMedicalRecord(appointment.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      showToast("Medical record and prescription saved successfully", "success");
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  function handlePreviewPdf() {
    if (!diagnosis.trim() && !prescription.trim()) {
      setError("Enter diagnosis or prescription notes to preview PDF.");
      return;
    }
    setError(null);
    try {
      downloadPrescriptionPdf(appointment, diagnosis, prescription);
      showToast("Prescription PDF downloaded", "info");
    } catch (err) {
      setError("Failed to generate PDF: " + err.message);
    }
  }

  function handleGenerateAndAttachPdf() {
    if (!diagnosis.trim() && !prescription.trim()) {
      setError("Enter diagnosis or prescription notes first.");
      return;
    }
    setError(null);
    setIsGeneratingPdf(true);
    try {
      const generatedFile = generatePrescriptionPdfFile(appointment, diagnosis, prescription);
      setFile(generatedFile);
      showToast("Generated prescription PDF attached!", "success");
    } catch (err) {
      setError("Failed to generate prescription PDF: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!diagnosis.trim() && !prescription.trim() && !file) {
      return setError("Add diagnosis notes, prescription notes, or attach a report.");
    }

    if (file && file.size > MAX_FILE_BYTES) {
      return setError("Attached file is too large (max 10 MB).");
    }

    const formData = new FormData();
    if (diagnosis.trim()) formData.append("diagnosisNotes", diagnosis);
    if (prescription.trim()) formData.append("prescriptionNotes", prescription);
    if (file) formData.append("report", file);

    save.mutate(formData);
  }

  return (
    <Modal title={`Digital Prescription & Medical Record — ${appointment.patient?.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner message={error} />

        {/* Diagnosis Notes */}
        <FormField label="Diagnosis & Clinical Observations">
          <textarea
            rows={3}
            className={inputClass}
            placeholder="Clinical diagnosis, symptoms evaluated, vital signs..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </FormField>

        {/* Prescription Notes */}
        <FormField label="Rx: Medicines, Dosages & Regimen">
          <textarea
            rows={5}
            className={inputClass}
            placeholder={`1. Amoxicillin 500mg — 1 tablet TID after meals x 5 days\n2. Paracetamol 650mg — SOS for fever\nInstructions: Drink plenty of water and follow up in 7 days.`}
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
          />
        </FormField>

        {/* PDF Builder Quick Actions */}
        <div className="rounded-lg border border-primary/20 bg-primary-light/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              Digital Prescription PDF Generator
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Generate an official signed BookEase prescription PDF from your notes above.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePreviewPdf}
            >
              📄 Preview & Download PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isGeneratingPdf}
              onClick={handleGenerateAndAttachPdf}
            >
              📎 Generate & Attach as PDF Report
            </Button>
          </div>
        </div>

        {/* Attached Report / Upload */}
        <FormField label="Attached Report / Lab Result (PDF, PNG or JPG, max 10 MB)">
          <div className="space-y-2">
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-primary-light file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
            />
            {file && (
              <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 border border-emerald-200">
                <span>Selected file: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</span>
                <button
                  type="button"
                  className="text-red-600 font-semibold hover:underline"
                  onClick={() => setFile(null)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </FormField>

        {appointment.reportUrls?.length > 0 && (
          <p className="text-xs text-gray-500">
            {appointment.reportUrls.length} file(s) already attached to this visit. New attachments will be appended.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            Save Record & Prescription
          </Button>
        </div>
      </form>
    </Modal>
  );
}
