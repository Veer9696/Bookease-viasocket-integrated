import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDoctor } from "../hooks/useDoctors";
import { useCreateAppointment } from "../hooks/useAppointments";
import { ApiClientError } from "../services/apiClient";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";
import FormField, { inputClass } from "../components/common/FormField";

export default function BookingWizardPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = params.get("doctorId");
  const slot = params.get("slot");

  const { data: doctor, isLoading } = useDoctor(doctorId);
  const createAppointment = useCreateAppointment();
  const [type, setType] = useState("in-person");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  if (!doctorId || !slot) return <ErrorBanner message="Missing doctor or time slot. Please start again from the doctor's page." />;
  if (isLoading) return <Spinner />;

  async function handleConfirm() {
    try {
      const appointment = await createAppointment.mutateAsync({ doctorId, scheduledAt: slot, type, notes });
      setConfirmed(appointment);
    } catch (err) {
      // surfaced via createAppointment.error below
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Appointment requested</h1>
        <p className="mt-2 text-gray-500">
          {doctor?.user?.name} will confirm your appointment on {new Date(slot).toLocaleString()}.
        </p>
        <Button className="mt-6" onClick={() => navigate("/dashboard")}>Go to my dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Confirm your appointment</h1>
      <div className="mt-4 rounded-card border border-gray-100 bg-white p-4 text-sm">
        <p><span className="text-gray-500">Doctor:</span> {doctor?.user?.name} ({doctor?.specialty})</p>
        <p><span className="text-gray-500">When:</span> {new Date(slot).toLocaleString()}</p>
        <p><span className="text-gray-500">Fee:</span> ${doctor?.fee}</p>
      </div>

      <div className="mt-4 space-y-4">
        <FormField label="Appointment type">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="in-person">In-person</option>
            <option value="telehealth">Telehealth (video)</option>
          </select>
        </FormField>
        <FormField label="Notes for the doctor (optional)">
          <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>

        <ErrorBanner message={createAppointment.error instanceof ApiClientError ? createAppointment.error.message : createAppointment.error?.message} />

        <Button className="w-full" loading={createAppointment.isPending} onClick={handleConfirm}>
          Confirm appointment
        </Button>
      </div>
    </div>
  );
}
