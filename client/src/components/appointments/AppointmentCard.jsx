import StatusBadge from "./StatusBadge";
import Button from "../common/Button";

export default function AppointmentCard({ appointment, viewerRole, onAction }) {
  const counterpart = viewerRole === "DOCTOR" ? appointment.patient : appointment.doctor?.user;
  const canAct = appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  return (
    <div className="flex flex-col gap-3 rounded-card border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-gray-900">{counterpart?.name}</p>
        <p className="text-sm text-gray-500">
          {new Date(appointment.scheduledAt).toLocaleString()} · {appointment.type}
        </p>
        {appointment.notes && <p className="mt-1 text-sm text-gray-500">"{appointment.notes}"</p>}
      </div>

      <div className="flex items-center gap-2">
        <StatusBadge status={appointment.status} />
        {canAct && onAction && (
          <div className="flex gap-2">
            {viewerRole === "DOCTOR" && appointment.status === "PENDING" && (
              <>
                <Button variant="secondary" onClick={() => onAction(appointment.id, "CONFIRMED")}>Accept</Button>
                <Button variant="danger" onClick={() => onAction(appointment.id, "REJECTED")}>Reject</Button>
              </>
            )}
            {viewerRole === "DOCTOR" && appointment.status === "CONFIRMED" && (
              <Button variant="secondary" onClick={() => onAction(appointment.id, "COMPLETED")}>Mark completed</Button>
            )}
            {viewerRole === "PATIENT" && (
              <Button variant="danger" onClick={() => onAction(appointment.id, "CANCELLED")}>Cancel</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
