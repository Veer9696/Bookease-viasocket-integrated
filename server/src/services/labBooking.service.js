const { prisma } = require("../config/prismaClient");
const { NotFoundError, ForbiddenError, BadRequestError } = require("../utils/apiError");
const notificationService = require("./notification.service");
const viaSocketService = require("./viaSocket.service");

async function listTests() {
  return prisma.labTest.findMany({ orderBy: { name: "asc" } });
}

async function createBooking(patient, { scheduledAt, notes, items }) {
  const testIds = items.map((i) => i.labTestId);
  const tests = await prisma.labTest.findMany({ where: { id: { in: testIds } } });
  if (tests.length !== testIds.length) throw new BadRequestError("One or more tests were not found");

  const booking = await prisma.labBooking.create({
    data: {
      patientId: patient.id,
      scheduledAt,
      notes,
      items: {
        create: tests.map((t) => ({ labTestId: t.id, priceAtBooking: t.price })),
      },
    },
    include: { items: { include: { labTest: true } } },
  });

  // Lab notifications are scoped to the patient only — doctors never
  // receive these unless a future workflow explicitly needs it.
  await notificationService.createNotification({
    userId: patient.id,
    category: "LAB",
    type: "lab.booked",
    title: "Lab test booked",
    body: `Your lab booking for ${scheduledAt.toLocaleString()} is pending confirmation.`,
    relatedEntityType: "LabBooking",
    relatedEntityId: booking.id,
  });

  await viaSocketService.sendEvent("lab.booked", {
    event: "lab.booked",
    booking: { id: booking.id, scheduledAt: booking.scheduledAt, status: booking.status },
    patient: { name: patient.name, email: patient.email },
    tests: tests.map((t) => ({ name: t.name, price: t.price })),
  });

  return booking;
}

async function listForPatient(patientId) {
  return prisma.labBooking.findMany({
    where: { patientId },
    include: { items: { include: { labTest: true } } },
    orderBy: { scheduledAt: "desc" },
  });
}

async function getOwnedBooking(bookingId, patientId) {
  const booking = await prisma.labBooking.findUnique({
    where: { id: bookingId },
    include: { items: { include: { labTest: true } } },
  });
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.patientId !== patientId) throw new ForbiddenError("Not your booking");
  return booking;
}

async function updateStatus(bookingId, patientId, status) {
  await getOwnedBooking(bookingId, patientId);
  const updated = await prisma.labBooking.update({ where: { id: bookingId }, data: { status } });

  await notificationService.createNotification({
    userId: patientId,
    category: "LAB",
    type: `lab.${status.toLowerCase()}`,
    title: `Lab booking ${status.toLowerCase()}`,
    body: `Your lab booking is now ${status.toLowerCase()}.`,
    relatedEntityType: "LabBooking",
    relatedEntityId: bookingId,
  });

  return updated;
}

module.exports = { listTests, createBooking, listForPatient, getOwnedBooking, updateStatus };
