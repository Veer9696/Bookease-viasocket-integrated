import { useState } from "react";
import EmptyState from "../common/EmptyState";
import StatusBadge from "./StatusBadge";
import { downloadPrescriptionPdf } from "../../utils/prescriptionPdf";

export default function MedicalRecordsList({ appointments = [], labBookings = [] }) {
  const [subTab, setSubTab] = useState("all"); // "all" | "prescriptions" | "labs"

  const appointmentRecords = appointments.filter(
    (a) => a.prescriptionNotes || a.diagnosisNotes || a.reportUrls?.length > 0
  );

  const completedLabs = labBookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CONFIRMED" || b.reportUrls?.length > 0
  );

  const totalRecords = appointmentRecords.length + completedLabs.length;

  if (totalRecords === 0) {
    return (
      <EmptyState
        title="No medical records found"
        description="Prescriptions, doctor diagnosis notes, and lab test reports will appear here after your visits."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Sub-pills */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            subTab === "all"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Records ({totalRecords})
        </button>
        <button
          onClick={() => setSubTab("prescriptions")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            subTab === "prescriptions"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Prescriptions ({appointmentRecords.length})
        </button>
        <button
          onClick={() => setSubTab("labs")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            subTab === "labs"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Lab Reports ({completedLabs.length})
        </button>
      </div>

      <div className="space-y-4">
        {/* Doctor Prescriptions & Visit Records */}
        {(subTab === "all" || subTab === "prescriptions") &&
          appointmentRecords.map((a) => (
            <article
              key={`apt-${a.id}`}
              className="rounded-card border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-primary">
                      Doctor Consultation
                    </span>
                    <p className="font-semibold text-gray-900">{a.doctor?.user?.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {a.doctor?.specialty} · {new Date(a.scheduledAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
                <button
                  onClick={() => downloadPrescriptionPdf(a, a.diagnosisNotes, a.prescriptionNotes)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-light/40 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary-light transition"
                >
                  📥 Download Prescription PDF
                </button>
              </header>

              {/* Diagnosis Notes */}
              {a.diagnosisNotes && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Diagnosis & Observations</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-sm text-gray-800">
                    {a.diagnosisNotes}
                  </p>
                </div>
              )}

              {/* Prescription Notes */}
              {a.prescriptionNotes && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Rx: Prescribed Medicines & Advice</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm font-mono text-gray-800">
                    {a.prescriptionNotes}
                  </p>
                </div>
              )}

              {/* Attached Reports / Scans */}
              {a.reportUrls?.length > 0 && (
                <div className="mt-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Attached Documents & Scans</p>
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {a.reportUrls.map((url, i) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-primary hover:text-primary transition shadow-2xs"
                        >
                          📎 Document {i + 1} ({url.split(".").pop().toUpperCase()})
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}

        {/* Lab Test Reports */}
        {(subTab === "all" || subTab === "labs") &&
          completedLabs.map((b) => (
            <article
              key={`lab-${b.id}`}
              className="rounded-card border border-emerald-100 bg-emerald-50/20 p-5 shadow-sm"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-emerald-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Lab Diagnostic Report
                    </span>
                    <p className="font-semibold text-gray-900">
                      {b.items?.map((i) => i.labTest?.name).join(", ") || "Diagnostic Test"}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Collection Date: {new Date(b.scheduledAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    {b.address ? ` · ${b.address}` : ""}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </header>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                <span>
                  Bill Total: <strong>${b.totalAmount || b.items?.reduce((s, i) => s + (i.priceAtBooking || 0), 0) || 0}</strong> ({b.paymentStatus === "PAID_ONLINE" ? "Paid Online" : "Pay on Collection"})
                </span>
                <span className="text-emerald-700 font-medium">
                  {b.status === "COMPLETED" ? "✅ Results verified by laboratory" : "⏳ Sample collected / in testing"}
                </span>
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
