import { useState } from "react";
import { useAppointments, useUpdateAppointmentStatus } from "../hooks/useAppointments";
import { useLabBookings } from "../hooks/useLabTests";
import AppointmentCard from "../components/appointments/AppointmentCard";
import StatusBadge from "../components/appointments/StatusBadge";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/Toast";

const TABS = ["Upcoming", "Past", "Lab Tests"];

export default function PatientDashboardPage() {
  const [tab, setTab] = useState("Upcoming");
  const { data: appointments, isLoading } = useAppointments();
  const { data: labBookings, isLoading: labLoading } = useLabBookings();
  const updateStatus = useUpdateAppointmentStatus();
  const { showToast } = useToast();

  const now = new Date();
  const upcoming = appointments?.filter((a) => new Date(a.scheduledAt) >= now && a.status !== "CANCELLED" && a.status !== "REJECTED") || [];
  const past = appointments?.filter((a) => new Date(a.scheduledAt) < now || a.status === "CANCELLED" || a.status === "REJECTED") || [];

  async function handleCancel(id, status) {
    try {
      await updateStatus.mutateAsync({ id, status, cancellationReason: "Cancelled by patient" });
      showToast("Appointment cancelled", "success");
    } catch (err) {
      showToast(err.message || "Could not update appointment", "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">My dashboard</h1>

      <div className="mt-4 flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {tab !== "Lab Tests" && isLoading && <Spinner />}

        {tab === "Upcoming" && !isLoading && upcoming.length === 0 && (
          <EmptyState title="No upcoming appointments" description="Book a doctor to see it here." />
        )}
        {tab === "Upcoming" && upcoming.map((a) => (
          <AppointmentCard key={a.id} appointment={a} viewerRole="PATIENT" onAction={handleCancel} />
        ))}

        {tab === "Past" && !isLoading && past.length === 0 && (
          <EmptyState title="No past appointments" />
        )}
        {tab === "Past" && past.map((a) => (
          <AppointmentCard key={a.id} appointment={a} viewerRole="PATIENT" />
        ))}

        {tab === "Lab Tests" && labLoading && <Spinner />}
        {tab === "Lab Tests" && !labLoading && labBookings?.length === 0 && (
          <EmptyState title="No lab bookings yet" description="Book a test to track its status here." />
        )}
        {tab === "Lab Tests" && labBookings?.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-card border border-gray-100 bg-white p-4 shadow-sm">
            <div>
              <p className="font-semibold text-gray-900">{b.items.map((i) => i.labTest.name).join(", ")}</p>
              <p className="text-sm text-gray-500">{new Date(b.scheduledAt).toLocaleString()}</p>
            </div>
            <StatusBadge status={b.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
