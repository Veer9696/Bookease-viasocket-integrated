// Ready-to-send email content for appointment automations, so a Gmail/Outlook
// step in viaSocket only has to map `to`, `subject` and `html` — no template
// work in the flow builder. Every user-supplied value is HTML-escaped.

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const when = (d) => `${d.appointment.date}, ${d.appointment.timeSlot}`;

// Per event: who is told what. `intro` is the first paragraph of the email.
const COPY = {
  "appointment.created": {
    patient: {
      subject: (d) => `Appointment request received – ${d.doctor.name}, ${d.appointment.date}`,
      intro: (d) =>
        `Thanks for booking with ${d.doctor.name}. Your request for ${when(d)} is waiting for the doctor's confirmation — we'll email you as soon as it's confirmed.`,
    },
    doctor: {
      subject: (d) => `New appointment request: ${d.patient.name} – ${d.appointment.date} ${d.appointment.time}`,
      intro: (d) => `${d.patient.name} has requested an appointment for ${when(d)}. Please accept or decline it from your BookEase dashboard.`,
    },
  },
  "appointment.confirmed": {
    patient: {
      subject: (d) => `Confirmed: your appointment with ${d.doctor.name} on ${d.appointment.date}`,
      intro: (d) => `Good news — ${d.doctor.name} has confirmed your appointment for ${when(d)}.`,
    },
    doctor: {
      subject: (d) => `Appointment confirmed: ${d.patient.name} – ${d.appointment.date} ${d.appointment.time}`,
      intro: (d) => `You confirmed ${d.patient.name}'s appointment for ${when(d)}.`,
    },
  },
  "appointment.cancelled": {
    patient: {
      subject: (d) => `Cancelled: your appointment with ${d.doctor.name} on ${d.appointment.date}`,
      intro: (d) => `Your appointment with ${d.doctor.name} for ${when(d)} has been cancelled${d.appointment.cancelledBy === "DOCTOR" ? " by the doctor" : ""}. You can book a new slot anytime on BookEase.`,
    },
    doctor: {
      subject: (d) => `Appointment cancelled: ${d.patient.name} – ${d.appointment.date} ${d.appointment.time}`,
      intro: (d) => `The appointment with ${d.patient.name} for ${when(d)} has been cancelled${d.appointment.cancelledBy === "PATIENT" ? " by the patient" : ""}. The slot is open again.`,
    },
  },
  "appointment.rejected": {
    patient: {
      subject: (d) => `Update on your appointment request with ${d.doctor.name}`,
      intro: (d) => `Unfortunately ${d.doctor.name} couldn't accept your appointment request for ${when(d)}. Please pick another time on BookEase.`,
    },
    doctor: {
      subject: (d) => `You declined: ${d.patient.name} – ${d.appointment.date} ${d.appointment.time}`,
      intro: (d) => `You declined ${d.patient.name}'s appointment request for ${when(d)}. The patient has been notified.`,
    },
  },
  "appointment.rescheduled": {
    patient: {
      subject: (d) => `Rescheduled: your appointment with ${d.doctor.name} on ${d.appointment.date}`,
      intro: (d) => `Your appointment with ${d.doctor.name} has been rescheduled to ${when(d)}.`,
    },
    doctor: {
      subject: (d) => `Appointment rescheduled: ${d.patient.name} – ${d.appointment.date} ${d.appointment.time}`,
      intro: (d) => `${d.patient.name} has rescheduled their appointment to ${when(d)}.`,
    },
  },
  "appointment.completed": {
    patient: {
      subject: (d) => `Thanks for visiting ${d.doctor.name}`,
      intro: (d) => `Your visit with ${d.doctor.name} on ${when(d)} is complete. Any prescriptions or reports will appear under Medical Records in your BookEase dashboard.`,
    },
    doctor: {
      subject: (d) => `Visit completed: ${d.patient.name} – ${d.appointment.date}`,
      intro: (d) => `Your visit with ${d.patient.name} on ${when(d)} is marked as completed.`,
    },
  },
  "appointment.reminder": {
    patient: {
      subject: (d) => `Reminder: appointment with ${d.doctor.name} ${d.window === "1 hour" ? "in 1 hour" : "tomorrow"}`,
      intro: (d) => `This is a reminder that you have an appointment with ${d.doctor.name} in about ${d.window || "24 hours"} — ${when(d)}.`,
    },
    doctor: {
      subject: (d) => `Upcoming: ${d.patient.name} at ${d.appointment.time}, ${d.appointment.date}`,
      intro: (d) => `Reminder: you see ${d.patient.name} in about ${d.window || "24 hours"} — ${when(d)}.`,
    },
  },
};

function detailRows(d) {
  const a = d.appointment;
  return [
    ["Patient details", null],
    ["Name", d.patient.name],
    ["Email", d.patient.email],
    ["Phone", d.patient.phone || "Not provided"],
    ["Doctor details", null],
    ["Name", d.doctor.name],
    ["Specialty", d.doctor.specialty],
    ["Email", d.doctor.email || "Not provided"],
    ["Phone", d.doctor.phone || "Not provided"],
    ...(d.doctor.clinic ? [["Clinic", d.doctor.clinic]] : []),
    ["Appointment details", null],
    ["Date", a.date],
    ["Time slot", a.timeSlot],
    ["Visit type", a.type === "telehealth" ? "Telehealth (video)" : "In-person"],
    ["Status", a.statusLabel],
    ["Reason for visit", a.reason || "Not provided"],
    ...(a.status === "CANCELLED" && a.cancellationReason ? [["Cancellation reason", a.cancellationReason]] : []),
  ];
}

function renderText(intro, d) {
  const lines = [intro, ""];
  for (const [label, value] of detailRows(d)) {
    lines.push(value === null ? `\n${label.toUpperCase()}` : `${label}: ${value}`);
  }
  if (d.doctor.locationUrl && d.appointment.type !== "telehealth") lines.push("", `Clinic location: ${d.doctor.locationUrl}`);
  lines.push("", "— BookEase");
  return lines.join("\n");
}

function renderHtml(intro, d) {
  const rows = detailRows(d)
    .map(([label, value]) =>
      value === null
        ? `<tr><td colspan="2" style="padding:16px 0 6px;font-weight:600;color:#1a56db;border-bottom:1px solid #e5e7eb">${escapeHtml(label)}</td></tr>`
        : `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#111827">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const location =
    d.doctor.locationUrl && d.appointment.type !== "telehealth"
      ? `<p style="margin:20px 0 0"><a href="${escapeHtml(d.doctor.locationUrl)}" style="color:#1a56db">View clinic location</a></p>`
      : "";

  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
<h2 style="color:#1a56db;margin:0 0 12px">BookEase</h2>
<p style="margin:0 0 8px;line-height:1.5">${escapeHtml(intro)}</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
${location}
<p style="margin:24px 0 0;color:#9ca3af;font-size:12px">You're receiving this because of an appointment booked on BookEase.</p>
</div>`;
}

function appointmentEmails(event, data) {
  const copy = COPY[event];
  if (!copy) return null;

  const build = (recipient, to) => {
    const intro = copy[recipient].intro(data);
    return {
      to: to || null,
      subject: copy[recipient].subject(data),
      text: renderText(intro, data),
      html: renderHtml(intro, data),
    };
  };

  return {
    patient: build("patient", data.patient.email),
    doctor: build("doctor", data.doctor.email),
  };
}

module.exports = { appointmentEmails, escapeHtml };
