const { prisma } = require("../config/prismaClient");
const notificationService = require("./notification.service");
const viaSocketService = require("./viaSocket.service");
const { logger } = require("../utils/logger");

async function sendDueReminders() {
  await sendWindowReminders({
    windowHoursFrom: 23,
    windowHoursTo: 24,
    field: "remindedAt24h",
    label: "24 hours",
  });
  await sendWindowReminders({
    windowHoursFrom: 0,
    windowHoursTo: 1,
    field: "remindedAt1h",
    label: "1 hour",
  });
}

async function sendWindowReminders({ windowHoursFrom, windowHoursTo, field, label }) {
  const now = new Date();
  const from = new Date(now.getTime() + windowHoursFrom * 60 * 60 * 1000);
  const to = new Date(now.getTime() + windowHoursTo * 60 * 60 * 1000);

  const due = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      scheduledAt: { gte: from, lte: to },
      [field]: null,
    },
    include: { patient: true, doctor: { include: { user: true } } },
  });

  for (const appointment of due) {
    await notificationService.createNotification({
      userId: appointment.patientId,
      category: "REMINDER",
      type: "appointment.reminder",
      title: "Upcoming appointment",
      body: `Reminder: you have an appointment with ${appointment.doctor.user.name} in about ${label}.`,
      relatedEntityType: "Appointment",
      relatedEntityId: appointment.id,
    });

    await viaSocketService.sendEvent("appointment.reminder", {
      event: "appointment.reminder",
      appointment: { id: appointment.id, scheduledAt: appointment.scheduledAt },
      patient: { name: appointment.patient.name, email: appointment.patient.email },
      doctor: { name: appointment.doctor.user.name },
      window: label,
    });

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { [field]: new Date() },
    });
  }

  if (due.length) logger.info(`Sent ${due.length} ${label} reminder(s).`);
}

module.exports = { sendDueReminders };
