const { prisma } = require("../config/prismaClient");
const { NotFoundError, ForbiddenError, ConflictError, BadRequestError } = require("../utils/apiError");
const notificationService = require("./notification.service");
const viaSocketService = require("./viaSocket.service");
const doctorService = require("./doctor.service");
const { buildAppointmentEvent } = require("./appointmentEvents");

// What API responses expose about the doctor — contact details stay out of
// responses and only go into the (whitelisted) automation payload.
const DOCTOR_PUBLIC_FIELDS = {
  include: { user: { select: { id: true, name: true } } },
};

async function createAppointment(patient, { doctorId, scheduledAt, type, notes, paymentStatus, paymentMethod }) {
  const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId }, ...DOCTOR_PUBLIC_FIELDS });
  if (!doctor) throw new NotFoundError("Doctor not found");

  // Re-derive open slots server-side so leave days, buffers and past times
  // are enforced even if a client skips the slot picker.
  const openSlots = await doctorService.getAvailableSlots(doctorId, scheduledAt);
  if (!openSlots.some((slot) => slot.getTime() === scheduledAt.getTime())) {
    throw new ConflictError("That time is no longer available. Please pick another slot.");
  }

  let appointment;
  try {
    appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        scheduledAt,
        type,
        notes,
        status: "PENDING",
        feeAtBooking: doctor.fee,
        paymentStatus: paymentStatus || "PAY_AT_CLINIC",
        paymentMethod: paymentMethod || null,
      },
    });
  } catch (err) {
    if (err.code === "P2002") throw new ConflictError("That slot was just taken. Please pick another.");
    throw err;
  }

  await notificationService.createNotification({
    userId: doctor.userId,
    category: "APPOINTMENT",
    type: "appointment.created",
    title: "New appointment request",
    body: `${patient.name} requested an appointment on ${scheduledAt.toLocaleString()}.`,
    relatedEntityType: "Appointment",
    relatedEntityId: appointment.id,
  });

  await notificationService.createNotification({
    userId: patient.id,
    category: "APPOINTMENT",
    type: "appointment.created",
    title: "Appointment requested",
    body: `Your appointment with ${doctor.user.name} on ${scheduledAt.toLocaleString()} is pending confirmation.`,
    relatedEntityType: "Appointment",
    relatedEntityId: appointment.id,
  });

  await viaSocketService.sendEvent(
    "appointment.created",
    await buildAppointmentEvent("appointment.created", appointment.id),
    { ownerUserIds: [doctor.userId, patient.id] }
  );

  return appointment;
}

async function listForPatient(patientId) {
  return prisma.appointment.findMany({
    where: { patientId },
    include: { doctor: { include: { user: { select: { name: true } } } } },
    orderBy: { scheduledAt: "desc" },
  });
}

async function listForDoctor(doctorId) {
  return prisma.appointment.findMany({
    where: { doctorId },
    include: { patient: { select: { name: true, email: true, phone: true } } },
    orderBy: { scheduledAt: "desc" },
  });
}

async function getOwnedAppointment(appointmentId, user) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: DOCTOR_PUBLIC_FIELDS,
      patient: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!appointment) throw new NotFoundError("Appointment not found");

  const isOwningPatient = user.role === "PATIENT" && appointment.patientId === user.id;
  const isOwningDoctor = user.role === "DOCTOR" && appointment.doctor.user.id === user.id;
  if (!isOwningPatient && !isOwningDoctor) throw new ForbiddenError("Not your appointment");

  return appointment;
}

async function updateStatus(appointmentId, user, { status, cancellationReason }) {
  const appointment = await getOwnedAppointment(appointmentId, user);

  const data = { status };
  if (status === "CANCELLED") {
    data.cancelledBy = user.role === "DOCTOR" ? "DOCTOR" : "PATIENT";
    data.cancellationReason = cancellationReason;
  }

  const updated = await prisma.appointment.update({ where: { id: appointmentId }, data });

  const notifyUserId = user.role === "DOCTOR" ? appointment.patientId : appointment.doctor.user.id;
  await notificationService.createNotification({
    userId: notifyUserId,
    category: "APPOINTMENT",
    type: `appointment.${status.toLowerCase()}`,
    title: `Appointment ${status.toLowerCase()}`,
    body: `Your appointment on ${appointment.scheduledAt.toLocaleString()} is now ${status.toLowerCase()}.`,
    relatedEntityType: "Appointment",
    relatedEntityId: appointment.id,
  });

  const eventName = `appointment.${status.toLowerCase()}`;
  await viaSocketService.sendEvent(
    eventName,
    await buildAppointmentEvent(eventName, updated.id),
    { ownerUserIds: [appointment.doctor.user.id, appointment.patientId] }
  );

  return updated;
}

async function rescheduleAppointment(appointmentId, user, { newScheduledAt, notes }) {
  const appointment = await getOwnedAppointment(appointmentId, user);
  if (["CANCELLED", "REJECTED", "COMPLETED"].includes(appointment.status)) {
    throw new BadRequestError(`Cannot reschedule a ${appointment.status.toLowerCase()} appointment`);
  }

  // Enforce 2-hour minimum advance notice rule
  const now = Date.now();
  const appointmentTime = new Date(appointment.scheduledAt).getTime();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  if (appointmentTime - now < TWO_HOURS_MS) {
    throw new BadRequestError("Appointments can only be rescheduled at least 2 hours in advance.");
  }

  const targetDate = new Date(newScheduledAt);
  if (Number.isNaN(targetDate.getTime()) || targetDate.getTime() <= now) {
    throw new BadRequestError("Please select a valid future date and time.");
  }

  // Check doctor availability for the new time slot
  const openSlots = await doctorService.getAvailableSlots(appointment.doctorId, targetDate);
  if (!openSlots.some((slot) => slot.getTime() === targetDate.getTime())) {
    throw new ConflictError("That time slot is not available. Please choose another slot.");
  }

  let updated;
  try {
    updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledAt: targetDate,
        originalScheduledAt: appointment.originalScheduledAt || appointment.scheduledAt,
        rescheduledCount: { increment: 1 },
        ...(notes !== undefined ? { notes } : {}),
      },
    });
  } catch (err) {
    if (err.code === "P2002") throw new ConflictError("That slot was just taken. Please pick another.");
    throw err;
  }

  const doctorUserId = appointment.doctor.user.id;
  const patientUserId = appointment.patientId;

  await notificationService.createNotification({
    userId: doctorUserId,
    category: "APPOINTMENT",
    type: "appointment.rescheduled",
    title: "Appointment rescheduled",
    body: `${appointment.patient.name} rescheduled their appointment to ${targetDate.toLocaleString()}.`,
    relatedEntityType: "Appointment",
    relatedEntityId: appointment.id,
  });

  await notificationService.createNotification({
    userId: patientUserId,
    category: "APPOINTMENT",
    type: "appointment.rescheduled",
    title: "Appointment rescheduled",
    body: `Your appointment with ${appointment.doctor.user.name} was rescheduled to ${targetDate.toLocaleString()}.`,
    relatedEntityType: "Appointment",
    relatedEntityId: appointment.id,
  });

  await viaSocketService.sendEvent(
    "appointment.rescheduled",
    await buildAppointmentEvent("appointment.rescheduled", updated.id),
    { ownerUserIds: [doctorUserId, patientUserId] }
  );

  return updated;
}

// Prescriptions and reports stay inside BookEase — deliberately no viaSocket
// event here, so medical content never reaches a third-party automation.
async function saveMedicalRecord(appointmentId, user, { diagnosisNotes, prescriptionNotes, reportUrl }) {
  const appointment = await getOwnedAppointment(appointmentId, user);
  if (user.role !== "DOCTOR") throw new ForbiddenError("Only the treating doctor can add records");
  if (appointment.status !== "COMPLETED") {
    throw new BadRequestError("Records can only be added to completed appointments");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...(diagnosisNotes !== undefined ? { diagnosisNotes } : {}),
      ...(prescriptionNotes !== undefined ? { prescriptionNotes } : {}),
      ...(reportUrl ? { reportUrls: { push: reportUrl } } : {}),
    },
  });

  await notificationService.createNotification({
    userId: appointment.patientId,
    category: "APPOINTMENT",
    type: "appointment.record_added",
    title: "New medical record",
    body: `${appointment.doctor.user.name} added a prescription or report to your visit. See Medical Records.`,
    relatedEntityType: "Appointment",
    relatedEntityId: appointment.id,
  });

  return updated;
}

module.exports = {
  createAppointment,
  rescheduleAppointment,
  listForPatient,
  listForDoctor,
  getOwnedAppointment,
  updateStatus,
  saveMedicalRecord,
};
