import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDoctor } from "../hooks/useDoctors";
import { useCreateAppointment } from "../hooks/useAppointments";
import { useAuth } from "../context/AuthContext";
import { ApiClientError } from "../services/apiClient";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";
import FormField, { inputClass } from "../components/common/FormField";

export default function BookingWizardPage() {
  const { user, logout } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = params.get("doctorId");
  const slot = params.get("slot");

  const { data: doctor, isLoading } = useDoctor(doctorId);
  const createAppointment = useCreateAppointment();
  const [type, setType] = useState("in-person");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAY_AT_CLINIC");
  const [confirmed, setConfirmed] = useState(null);

  if (!doctorId || !slot) return <ErrorBanner message="Missing doctor or time slot. Please start again from the doctor's page." />;
  if (isLoading) return <Spinner />;

  const isDoctorUser = user?.role === "DOCTOR";
  const authError =
    createAppointment.error instanceof ApiClientError &&
    (createAppointment.error.status === 401 || createAppointment.error.message?.toLowerCase().includes("not signed in"));

  async function handleConfirm() {
    try {
      const appointment = await createAppointment.mutateAsync({
        doctorId,
        scheduledAt: slot,
        type,
        notes,
        paymentStatus,
        paymentMethod: paymentStatus === "PAID_ONLINE" ? "Card / Digital" : "Cash / In-person",
      });
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
        <p className="mt-2 text-gray-600">
          {doctor?.user?.name} will confirm your appointment on {new Date(slot).toLocaleString()}.
        </p>
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left text-xs text-gray-600 space-y-1">
          <p><strong>Payment Status:</strong> {paymentStatus === "PAID_ONLINE" ? "💳 Paid Online (Confirmed)" : "💵 Pay at Clinic upon arrival"}</p>
          <p><strong>Fee:</strong> ${doctor?.fee}</p>
        </div>
        <Button className="mt-6 w-full" onClick={() => navigate("/dashboard")}>Go to my dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Confirm your appointment</h1>
      <div className="mt-4 rounded-card border border-gray-100 bg-white p-4 text-sm space-y-1.5 shadow-xs">
        <p><span className="text-gray-500">Doctor:</span> <strong>{doctor?.user?.name}</strong> ({doctor?.specialty})</p>
        <p><span className="text-gray-500">When:</span> {new Date(slot).toLocaleString()}</p>
        <p><span className="text-gray-500">Clinic:</span> {doctor?.clinic || "Main Clinic"}</p>
        <p><span className="text-gray-500">Consultation Fee:</span> <strong className="text-primary">${doctor?.fee}</strong></p>
      </div>

      {isDoctorUser && (
        <div className="mt-4 rounded-card border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="text-sm font-semibold">Signed in as a Doctor</p>
          <p className="mt-1 text-xs text-amber-700">
            You are currently signed in with a Doctor account ({user.name}). Only Patient accounts can book appointments.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await logout();
                navigate(`/login?from=${encodeURIComponent(window.location.pathname + window.location.search)}`);
              }}
            >
              Log in as Patient
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/doctor/dashboard")}>
              Doctor Dashboard
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <FormField label="Appointment type">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)} disabled={isDoctorUser}>
            <option value="in-person">In-person visit</option>
            <option value="telehealth">Telehealth (video consultation)</option>
          </select>
        </FormField>

        {/* Payment Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Payment Option
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`flex flex-col gap-1 rounded-xl border p-3 cursor-pointer transition ${
                paymentStatus === "PAY_AT_CLINIC"
                  ? "border-primary bg-primary-light/30 shadow-xs"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentOption"
                  value="PAY_AT_CLINIC"
                  checked={paymentStatus === "PAY_AT_CLINIC"}
                  onChange={() => setPaymentStatus("PAY_AT_CLINIC")}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-gray-900">💵 Pay at Clinic</span>
              </div>
              <span className="text-[11px] text-gray-500 pl-5">Pay cash or card when you visit</span>
            </label>

            <label
              className={`flex flex-col gap-1 rounded-xl border p-3 cursor-pointer transition ${
                paymentStatus === "PAID_ONLINE"
                  ? "border-primary bg-primary-light/30 shadow-xs"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentOption"
                  value="PAID_ONLINE"
                  checked={paymentStatus === "PAID_ONLINE"}
                  onChange={() => setPaymentStatus("PAID_ONLINE")}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-gray-900">💳 Paid Online</span>
              </div>
              <span className="text-[11px] text-gray-500 pl-5">Instant digital payment (Demo)</span>
            </label>
          </div>
        </div>

        <FormField label="Notes for the doctor (optional)">
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Symptoms, medication history, reason for appointment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isDoctorUser}
          />
        </FormField>

        {authError ? (
          <div className="rounded-card border border-red-200 bg-red-50 p-4 text-red-900">
            <p className="text-sm font-medium">Your session has expired or you are not signed in.</p>
            <Button
              className="mt-2"
              size="sm"
              onClick={() => navigate(`/login?from=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
            >
              Sign in to Book
            </Button>
          </div>
        ) : (
          <ErrorBanner message={createAppointment.error instanceof ApiClientError ? createAppointment.error.message : createAppointment.error?.message} />
        )}

        <Button
          className="w-full"
          loading={createAppointment.isPending}
          disabled={isDoctorUser}
          onClick={handleConfirm}
        >
          Confirm appointment (${doctor?.fee})
        </Button>
      </div>
    </div>
  );
}
