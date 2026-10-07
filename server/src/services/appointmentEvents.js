const { prisma } = require("../config/prismaClient");
const { NotFoundError } = require("../utils/apiError");
const { appointmentEmails } = require("./emailTemplates");

const DEFAULT_DURATION_MINS = 30;

const STATUS_LABELS = {
  PENDING: "Booked (awaiting confirmation)",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  REJECTED: "Declined",
  COMPLETED: "Completed",
};

// Dates render in the server's local timezone — set TZ (e.g. Asia/Kolkata)
// in production so emails and slots use clinic time, not UTC.
const formatDate = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const formatTime = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function clinicLocationUrl(doctor) {
  if (doctor.locationUrl) return doctor.locationUrl;
  if (!doctor.clinic) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.clinic)}`;
}

// Pure: builds the automation payload from already-loaded data. Field set is
// deliberately explicit (never a spread of a DB record). The reason for visit
// is included because appointment emails require it; prescriptions and
// reports never are.
function buildAppointmentPayload(event, { appointment, patient, doctor, durationMins }, extra = {}) {
  const start = new Date(appointment.scheduledAt);
  const end = new Date(start.getTime() + durationMins * 60 * 1000);
  const dateStr = formatDate(start);
  const timeStr = formatTime(start);
  const endTimeStr = formatTime(end);
  const timeSlotStr = `${timeStr} – ${endTimeStr}`;
  const statusLabel = STATUS_LABELS[appointment.status] || appointment.status;

  const data = {
    event,
    ...extra,
    appointment: {
      id: appointment.id,
      scheduledAt: start.toISOString(),
      date: dateStr,
      time: timeStr,
      endTime: endTimeStr,
      timeSlot: timeSlotStr,
      durationMins,
      type: appointment.type,
      status: appointment.status,
      statusLabel,
      reason: appointment.notes || null,
      cancelledBy: appointment.cancelledBy || null,
      cancellationReason: appointment.cancellationReason || null,
    },
    patient: {
      name: patient.name,
      email: patient.email,
      phone: patient.phone || null,
    },
    doctor: {
      name: doctor.name,
      specialty: doctor.specialty,
      email: doctor.email || null,
      phone: doctor.phone || null,
      clinic: doctor.clinic || null,
      locationUrl: clinicLocationUrl(doctor),
    },
  };

  const emails = appointmentEmails(event, data);

  // Simple template content for email / SMS / WhatsApp mapping
  const subjectStr = `Appointment with ${doctor.name} - ${dateStr} at ${timeStr}`;
  const simpleTemplate = [
    `Dear ${patient.name},`,
    ``,
    `Your appointment has been scheduled with ${doctor.name}.`,
    ``,
    `Doctor: ${doctor.name} (${doctor.specialty || "General Medicine"})`,
    `Date: ${dateStr}`,
    `Time: ${timeStr} (${timeSlotStr})`,
    `Type: ${appointment.type === "telehealth" ? "Telehealth (Video Call)" : "In-Person"}`,
    `Status: ${statusLabel}`,
    doctor.clinic ? `Clinic: ${doctor.clinic}` : null,
    appointment.notes ? `Reason: ${appointment.notes}` : null,
    ``,
    `Thank you for using BookEase!`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const simpleHtml =
    emails?.patient?.html ||
    `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;line-height:1.5">
      <h3 style="color:#1a56db">BookEase Appointment</h3>
      <p>Dear <strong>${patient.name}</strong>,</p>
      <p>Your appointment has been scheduled with <strong>${doctor.name}</strong> (${doctor.specialty || "General"}).</p>
      <ul>
        <li><strong>Date:</strong> ${dateStr}</li>
        <li><strong>Time:</strong> ${timeStr} (${timeSlotStr})</li>
        <li><strong>Type:</strong> ${appointment.type}</li>
        <li><strong>Status:</strong> ${statusLabel}</li>
        ${doctor.clinic ? `<li><strong>Clinic:</strong> ${doctor.clinic}</li>` : ""}
      </ul>
      <p>Thank you for choosing BookEase.</p>
    </div>`;

  return {
    // Flat top-level fields for easy one-click mapping in viaSocket / Gmail
    patient_name: patient.name,
    patient_email: patient.email,
    patient_phone: patient.phone || "",
    doctor_name: doctor.name,
    doctor_specialty: doctor.specialty || "",
    doctor_clinic: doctor.clinic || "",
    doctor_email: doctor.email || "",
    doctor_phone: doctor.phone || "",
    appointment_date: dateStr,
    appointment_time: timeStr,
    appointment_time_slot: timeSlotStr,
    appointment_type: appointment.type,
    appointment_status: statusLabel,
    appointment_notes: appointment.notes || "",

    // Simple aliases
    name: patient.name,
    email: patient.email,
    phone: patient.phone || "",
    doctor: doctor.name,
    specialty: doctor.specialty || "",
    clinic: doctor.clinic || "",
    date: dateStr,
    time: timeStr,

    // Pre-composed simple templates
    subject: subjectStr,
    email_subject: subjectStr,
    template: simpleTemplate,
    email_body: simpleTemplate,
    email_html: simpleHtml,
    message: simpleTemplate,

    // Structured data
    ...data,
    emails,
  };
}

function slotDuration(availability, scheduledAt) {
  const minutes = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const block = availability.find(
    (b) => b.dayOfWeek === scheduledAt.getDay() && minutes >= toMinutes(b.startTime) && minutes < toMinutes(b.endTime)
  );
  return block?.slotDurationMins ?? DEFAULT_DURATION_MINS;
}

// Loads everything a payload needs in one place, so every caller (booking,
// status change, reminder) sends the same complete shape.
async function buildAppointmentEvent(event, appointmentId, extra) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { name: true, email: true, phone: true } },
      doctor: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          availability: true,
        },
      },
    },
  });
  if (!appointment) throw new NotFoundError("Appointment not found");

  const { doctor } = appointment;
  return buildAppointmentPayload(
    event,
    {
      appointment,
      patient: appointment.patient,
      doctor: { ...doctor, name: doctor.user.name, email: doctor.user.email, phone: doctor.user.phone },
      durationMins: slotDuration(doctor.availability, appointment.scheduledAt),
    },
    extra
  );
}

// Realistic sample for the flow builder, produced by the same code path as
// real events so mapped fields always exist at run time.
function sampleAppointmentPayload(event) {
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 3);
  scheduledAt.setHours(16, 0, 0, 0);

  const status = {
    "appointment.created": "PENDING",
    "appointment.cancelled": "CANCELLED",
    "appointment.rejected": "REJECTED",
    "appointment.completed": "COMPLETED",
  }[event] || "CONFIRMED";

  return buildAppointmentPayload(
    event,
    {
      appointment: {
        id: "apt_sample123",
        scheduledAt,
        type: "in-person",
        status,
        notes: "Recurring headaches for two weeks, worse in the mornings.",
        cancelledBy: status === "CANCELLED" ? "PATIENT" : null,
        cancellationReason: status === "CANCELLED" ? "Schedule conflict" : null,
      },
      patient: { name: "John Doe", email: "john.doe@example.com", phone: "+91 98765 43210" },
      doctor: {
        name: "Dr. James Wilson",
        specialty: "Neurology",
        email: "james.wilson@example.com",
        phone: "+91 98765 00000",
        clinic: "Neuro Health",
        locationUrl: null,
      },
      durationMins: 30,
    },
    event === "appointment.reminder" ? { window: "24 hours" } : {}
  );
}

module.exports = { buildAppointmentEvent, buildAppointmentPayload, sampleAppointmentPayload, STATUS_LABELS };
