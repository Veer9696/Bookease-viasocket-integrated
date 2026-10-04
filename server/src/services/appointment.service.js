const { prisma } = require("../config/prismaClient");
const { NotFoundError, ForbiddenError, ConflictError } = require("../utils/apiError");
const notificationService = require("./notification.service");
const viaSocketService = require("./viaSocket.service");

async function createAppointment(patient, { doctorId, scheduledAt, type, notes }) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    include: { user: { select: { name: true } } },
  });
  if (!doctor) throw new NotFoundError("Doctor not found");

  let appointment;
  try {
    appointment = await prisma.appointment.create({
      data: { patientId: patient.id, doctorId, scheduledAt, type, notes, status: "PENDING" },
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

  // Whitelisted fields only — never spread the full patient/doctor record
  // into a third-party automation payload.
  await viaSocketService.sendEvent("appointment.created", {
    event: "appointment.created",
    appointment: {
      id: appointment.id,
      scheduledAt: appointment.scheduledAt,
      type: appointment.type,
      status: appointment.status,
    },
    patient: { name: patient.name, email: patient.email },
    doctor: { name: doctor.user.name, specialty: doctor.specialty },
  });

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
      doctor: { include: { user: { select: { id: true, name: true } } } },
      patient: { select: { id: true, name: true, email: true } },
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

  await viaSocketService.sendEvent(`appointment.${status.toLowerCase()}`, {
    event: `appointment.${status.toLowerCase()}`,
    appointment: { id: appointment.id, scheduledAt: appointment.scheduledAt, status },
    patient: { name: appointment.patient.name, email: appointment.patient.email },
    doctor: { name: appointment.doctor.user.name },
  });

  return updated;
}

module.exports = { createAppointment, listForPatient, listForDoctor, getOwnedAppointment, updateStatus };
