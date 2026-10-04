import { useQuery } from "@tanstack/react-query";
import { doctorsApi } from "../services/doctorsApi";
import { useAppointments, useUpdateAppointmentStatus } from "../hooks/useAppointments";
import AppointmentCard from "../components/appointments/AppointmentCard";
import AvailabilityEditor from "../components/doctors/AvailabilityEditor";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/Toast";

export default function DoctorDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-doctor-profile"],
    queryFn: doctorsApi.getMyProfile,
  });
  const { data: appointments, isLoading } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();
  const { showToast } = useToast();

  async function handleAction(id, status) {
    try {
      await updateStatus.mutateAsync({ id, status });
      showToast(`Appointment ${status.toLowerCase()}`, "success");
    } catch (err) {
      showToast(err.message || "Could not update appointment", "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Doctor dashboard</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Appointments</h2>
        <div className="mt-3 space-y-3">
          {isLoading && <Spinner />}
          {!isLoading && appointments?.length === 0 && (
            <EmptyState title="No appointments yet" description="They'll show up here as patients book you." />
          )}
          {appointments?.map((a) => (
            <AppointmentCard key={a.id} appointment={a} viewerRole="DOCTOR" onAction={handleAction} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        {profileLoading && <Spinner />}
        {profile && <AvailabilityEditor doctor={profile} />}
      </section>
    </div>
  );
}
