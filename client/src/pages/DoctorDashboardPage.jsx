import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { doctorsApi } from "../services/doctorsApi";
import { useAppointments, useUpdateAppointmentStatus } from "../hooks/useAppointments";
import AppointmentCard from "../components/appointments/AppointmentCard";
import MedicalRecordModal from "../components/appointments/MedicalRecordModal";
import AvailabilityEditor from "../components/doctors/AvailabilityEditor";
import ScheduleSettings from "../components/doctors/ScheduleSettings";
import DoctorProfileEditor from "../components/profile/DoctorProfileEditor";
import AnalyticsSummary from "../components/doctors/AnalyticsSummary";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/Toast";

const TABS = ["Appointments", "Professional Profile", "Schedule & Hours"];

export default function DoctorDashboardPage() {
  const [activeTab, setActiveTab] = useState("Appointments");
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-doctor-profile"],
    queryFn: doctorsApi.getMyProfile,
  });
  const { data: appointments, isLoading } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  const { showToast } = useToast();
  const [recordFor, setRecordFor] = useState(null);

  async function handleAction(id, status) {
    try {
      await updateStatus.mutateAsync({ id, status });
      showToast(`Appointment ${status.toLowerCase()}`, "success");
    } catch (err) {
      showToast(err.message || "Could not update appointment", "error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        {profile?.licenseNumber && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary border border-blue-200">
            License: {profile.licenseNumber}
          </span>
        )}
      </div>

      <AnalyticsSummary />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`shrink-0 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === t
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1: Appointments */}
      {activeTab === "Appointments" && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Patient Appointments</h2>
          <div className="mt-3 space-y-3">
            {isLoading && <Spinner />}
            {!isLoading && appointments?.length === 0 && (
              <EmptyState title="No appointments yet" description="They'll show up here as patients book you." />
            )}
            {appointments?.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                viewerRole="DOCTOR"
                onAction={handleAction}
                onRecord={setRecordFor}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tab 2: Professional Profile */}
      {activeTab === "Professional Profile" && (
        <section>
          {profileLoading && <Spinner />}
          {profile && <DoctorProfileEditor doctor={profile} />}
        </section>
      )}

      {/* Tab 3: Schedule & Hours */}
      {activeTab === "Schedule & Hours" && (
        <section className="space-y-6">
          {profileLoading && <Spinner />}
          {profile && (
            <>
              <AvailabilityEditor doctor={profile} />
              <ScheduleSettings key={profile.id} doctor={profile} />
            </>
          )}
        </section>
      )}

      {recordFor && (
        <MedicalRecordModal
          appointment={recordFor}
          onClose={() => setRecordFor(null)}
        />
      )}
    </div>
  );
}
