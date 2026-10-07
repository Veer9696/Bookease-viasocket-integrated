import { useState } from "react";
import { useDoctorSlots } from "../../hooks/useDoctors";
import { useRescheduleAppointment } from "../../hooks/useAppointments";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Spinner from "../common/Spinner";
import ErrorBanner from "../common/ErrorBanner";
import FormField, { inputClass } from "../common/FormField";
import { useToast } from "../common/Toast";

function nextNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function RescheduleModal({ appointment, onClose }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    return d;
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [error, setError] = useState(null);

  const { data: slots, isLoading: slotsLoading } = useDoctorSlots(
    appointment.doctorId,
    selectedDate
  );

  const reschedule = useRescheduleAppointment();
  const { showToast } = useToast();

  const now = Date.now();
  const appointmentTime = new Date(appointment.scheduledAt).getTime();
  const hoursUntilAppointment = (appointmentTime - now) / (60 * 60 * 1000);
  const isEligible = hoursUntilAppointment >= 2;

  async function handleConfirm(e) {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Please select an available time slot.");
      return;
    }
    setError(null);

    try {
      await reschedule.mutateAsync({
        id: appointment.id,
        newScheduledAt: new Date(selectedSlot).toISOString(),
        notes,
      });
      showToast("Appointment successfully rescheduled!", "success");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to reschedule appointment.");
    }
  }

  return (
    <Modal title={`Reschedule Appointment — ${appointment.doctor?.user?.name || "Doctor"}`} onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={error} />

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-xs text-gray-700 space-y-1">
          <p>
            <span className="text-gray-500">Currently Scheduled:</span>{" "}
            <strong>{new Date(appointment.scheduledAt).toLocaleString()}</strong>
          </p>
          <p>
            <span className="text-gray-500">Notice Policy:</span> Rescheduling is permitted up to 2 hours before the appointment.
          </p>
        </div>

        {!isEligible ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <strong>Rescheduling Unavailable</strong>
            <p className="mt-1">
              Appointments can only be rescheduled at least 2 hours in advance. This appointment is in less than 2 hours. If you cannot attend, please cancel or contact the clinic directly.
            </p>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            {/* Pick Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Select New Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {nextNDays(14).map((d) => {
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  return (
                    <button
                      key={d.toDateString()}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d);
                        setSelectedSlot(null);
                      }}
                      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? "border-primary bg-primary text-white shadow-xs"
                          : "border-gray-200 text-gray-700 hover:border-primary"
                      }`}
                    >
                      {d.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available Time Slots */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Available Times on {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </label>
              {slotsLoading && <Spinner />}
              {!slotsLoading && (!slots || slots.length === 0) && (
                <p className="py-2 text-xs text-gray-500 italic">
                  No open slots on this date. Please choose another date.
                </p>
              )}
              {!slotsLoading && slots && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 max-h-48 overflow-y-auto p-1">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-primary hover:bg-primary-light/20"
                        }`}
                      >
                        {new Date(slot).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note / reason */}
            <FormField label="Reason or note for rescheduling (optional)">
              <input
                type="text"
                placeholder="e.g. Schedule conflict, feeling unwell"
                className={inputClass}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedSlot}
                loading={reschedule.isPending}
              >
                Confirm Reschedule
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
