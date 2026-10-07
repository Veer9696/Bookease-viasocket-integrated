import { useState } from "react";
import { useAppointments, useUpdateAppointmentStatus } from "../hooks/useAppointments";
import { useLabBookings } from "../hooks/useLabTests";
import AppointmentCard from "../components/appointments/AppointmentCard";
import RescheduleModal from "../components/appointments/RescheduleModal";
import MedicalRecordsList from "../components/appointments/MedicalRecordsList";
import DoctorSearchFilters from "../components/doctors/DoctorSearchFilters";
import PatientProfileEditor from "../components/profile/PatientProfileEditor";
import StatusBadge from "../components/appointments/StatusBadge";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/Toast";

const TABS = [
  "Upcoming",
  "Past",
  "Find Doctors",
  "Lab Tests",
  "Medical Records",
  "Profile & Addresses",
];

const CLOSED_STATUSES = ["CANCELLED", "REJECTED", "COMPLETED"];

export default function PatientDashboardPage() {
  const [tab, setTab] = useState("Upcoming");
  const [rescheduleFor, setRescheduleFor] = useState(null);

  const { data: appointments, isLoading } = useAppointments();
  const { data: labBookings, isLoading: labLoading } = useLabBookings();
  const updateStatus = useUpdateAppointmentStatus();
  const { showToast } = useToast();

  const now = new Date();
  const isUpcoming = (a) => new Date(a.scheduledAt) >= now && !CLOSED_STATUSES.includes(a.status);
  const upcoming = appointments?.filter(isUpcoming) || [];
  const past = appointments?.filter((a) => !isUpcoming(a)) || [];

  async function handleCancel(id, status) {
    try {
      await updateStatus.mutateAsync({ id, status, cancellationReason: "Cancelled by patient" });
      showToast("Appointment cancelled", "success");
    } catch (err) {
      showToast(err.message || "Could not update appointment", "error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>

      {/* Tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {/* Tab 1: Upcoming Appointments */}
        {tab === "Upcoming" && (
          <div className="space-y-3">
            {isLoading && <Spinner />}
            {!isLoading && upcoming.length === 0 && (
              <EmptyState
                title="No upcoming appointments"
                description="Browse available doctors to book your next consultation."
                action={
                  <button
                    onClick={() => setTab("Find Doctors")}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-dark"
                  >
                    Find a Doctor
                  </button>
                }
              />
            )}
            {upcoming.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                viewerRole="PATIENT"
                onAction={handleCancel}
                onReschedule={setRescheduleFor}
              />
            ))}
          </div>
        )}

        {/* Tab 2: Past Appointments */}
        {tab === "Past" && (
          <div className="space-y-3">
            {isLoading && <Spinner />}
            {!isLoading && past.length === 0 && (
              <EmptyState title="No past appointments" description="Completed or cancelled visits will appear here." />
            )}
            {past.map((a) => (
              <AppointmentCard key={a.id} appointment={a} viewerRole="PATIENT" />
            ))}
          </div>
        )}

        {/* Tab 3: Find & Filter Doctors */}
        {tab === "Find Doctors" && (
          <DoctorSearchFilters showTitle={false} />
        )}

        {/* Tab 4: Lab Tests */}
        {tab === "Lab Tests" && (
          <div className="space-y-3">
            {labLoading && <Spinner />}
            {!labLoading && labBookings?.length === 0 && (
              <EmptyState
                title="No lab bookings yet"
                description="Book home sample collections from our extensive diagnostic catalog."
              />
            )}
            {labBookings?.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {b.items.map((i) => i.labTest.name).join(", ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    📅 {new Date(b.scheduledAt).toLocaleString()}
                  </p>
                  {b.address && (
                    <p className="text-xs text-gray-600 mt-1">
                      📍 <strong>Pickup:</strong> {b.address}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="font-bold text-gray-900">Total: ${b.totalAmount || b.items.reduce((s, i) => s + (i.priceAtBooking || 0), 0)}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">
                      {b.paymentStatus === "PAID_ONLINE" ? "💳 Paid Online" : "💵 Pay on Collection"}
                    </span>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Medical Records */}
        {tab === "Medical Records" && (
          <div>
            {isLoading && <Spinner />}
            {!isLoading && (
              <MedicalRecordsList
                appointments={appointments || []}
                labBookings={labBookings || []}
              />
            )}
          </div>
        )}

        {/* Tab 6: Profile & Addresses */}
        {tab === "Profile & Addresses" && (
          <PatientProfileEditor />
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleFor && (
        <RescheduleModal
          appointment={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
        />
      )}
    </div>
  );
}
