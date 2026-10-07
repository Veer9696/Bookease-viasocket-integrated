import StatusBadge from "./StatusBadge";
import Button from "../common/Button";

export default function AppointmentCard({
  appointment,
  viewerRole,
  onAction,
  onRecord,
  onReschedule,
}) {
  const counterpart = viewerRole === "DOCTOR" ? appointment.patient : appointment.doctor?.user;
  const canAct = appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const hasRecord = !!appointment.prescriptionNotes || !!appointment.diagnosisNotes || appointment.reportUrls?.length > 0;

  const now = Date.now();
  const appointmentTime = new Date(appointment.scheduledAt).getTime();
  const hoursUntil = (appointmentTime - now) / (60 * 60 * 1000);
  const canReschedule = canAct && hoursUntil >= 2;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between transition hover:shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">{counterpart?.name}</p>
          {appointment.rescheduledCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Rescheduled
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {new Date(appointment.scheduledAt).toLocaleString()} · {appointment.type}
        </p>

        {appointment.doctor?.specialty && viewerRole === "PATIENT" && (
          <p className="text-xs text-primary font-medium">{appointment.doctor.specialty}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          {/* Payment Status Badge */}
          <span
            className={`rounded-md px-2 py-0.5 font-medium ${
              appointment.paymentStatus === "PAID_ONLINE"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            {appointment.paymentStatus === "PAID_ONLINE" ? "💳 Paid Online" : "💵 Pay at Clinic"}
          </span>

          {appointment.feeAtBooking !== undefined && appointment.feeAtBooking !== null && (
            <span className="text-gray-500 font-semibold">${appointment.feeAtBooking}</span>
          )}
        </div>

        {appointment.notes && (
          <p className="mt-1 text-xs text-gray-500 italic">"{appointment.notes}"</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={appointment.status} />

        {canAct && (
          <div className="flex flex-wrap gap-2">
            {viewerRole === "PATIENT" && onReschedule && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onReschedule(appointment)}
                title={canReschedule ? "Reschedule appointment" : "Rescheduling closed within 2 hours of appointment"}
              >
                Reschedule
              </Button>
            )}

            {viewerRole === "PATIENT" && onAction && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onAction(appointment.id, "CANCELLED")}
              >
                Cancel
              </Button>
            )}

            {viewerRole === "DOCTOR" && appointment.status === "PENDING" && onAction && (
              <>
                <Button size="sm" variant="secondary" onClick={() => onAction(appointment.id, "CONFIRMED")}>
                  Accept
                </Button>
                <Button size="sm" variant="danger" onClick={() => onAction(appointment.id, "REJECTED")}>
                  Reject
                </Button>
              </>
            )}

            {viewerRole === "DOCTOR" && appointment.status === "CONFIRMED" && onAction && (
              <Button size="sm" variant="secondary" onClick={() => onAction(appointment.id, "COMPLETED")}>
                Mark completed
              </Button>
            )}
          </div>
        )}

        {viewerRole === "DOCTOR" && appointment.status === "COMPLETED" && onRecord && (
          <Button size="sm" variant="secondary" onClick={() => onRecord(appointment)}>
            {hasRecord ? "Edit prescription / Add report" : "Write prescription / Attach report"}
          </Button>
        )}
      </div>
    </div>
  );
}
