const { prisma } = require("../config/prismaClient");
const { NotFoundError, ForbiddenError, BadRequestError } = require("../utils/apiError");
const notificationService = require("./notification.service");
const viaSocketService = require("./viaSocket.service");

// Whitelisted payload for third-party automations (WhatsApp/SMS/Gmail):
// contact details + logistics only, no clinical data.
function buildLabEvent(event, booking, patient) {
  const when = new Date(booking.scheduledAt);
  return {
    event,
    booking: {
      id: booking.id,
      scheduledAt: when.toISOString(),
      date: when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
      time: when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      status: booking.status,
    },
    patient: { name: patient.name, email: patient.email, phone: patient.phone || null },
    tests: booking.items.map((i) => ({ name: i.labTest.name, price: i.priceAtBooking })),
  };
}

async function listTests() {
  return prisma.labTest.findMany({ orderBy: { name: "asc" } });
}

async function createBooking(patient, { scheduledAt, notes, items, addressId, address, paymentStatus }) {
  const testIds = items.map((i) => i.labTestId);
  const tests = await prisma.labTest.findMany({ where: { id: { in: testIds } } });
  if (tests.length !== testIds.length) throw new BadRequestError("One or more tests were not found");

  let addressSnapshot = address || null;
  if (addressId && !addressSnapshot) {
    const saved = await prisma.savedAddress.findUnique({ where: { id: addressId } });
    if (saved) {
      addressSnapshot = `${saved.label} — ${saved.street}, ${saved.city}${saved.state ? `, ${saved.state}` : ""} - ${saved.pincode}`;
    }
  }

  const testsTotal = tests.reduce((sum, t) => sum + t.price, 0);
  // Optional home collection fee: $10 (or free if total tests >= $50)
  const collectionFee = testsTotal >= 50 ? 0 : 10;
  const totalAmount = testsTotal + collectionFee;

  const booking = await prisma.labBooking.create({
    data: {
      patientId: patient.id,
      scheduledAt,
      notes,
      addressId: addressId || null,
      address: addressSnapshot,
      paymentStatus: paymentStatus || "PAY_ON_COLLECTION",
      totalAmount,
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
    body: `Your lab booking for ${scheduledAt.toLocaleString()} is confirmed. Total: $${totalAmount}.`,
    relatedEntityType: "LabBooking",
    relatedEntityId: booking.id,
  });

  await viaSocketService.sendEvent("lab.booked", buildLabEvent("lab.booked", booking, patient));

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

async function updateStatus(bookingId, patient, status) {
  await getOwnedBooking(bookingId, patient.id);
  const updated = await prisma.labBooking.update({
    where: { id: bookingId },
    data: { status },
    include: { items: { include: { labTest: true } } },
  });

  await notificationService.createNotification({
    userId: patient.id,
    category: "LAB",
    type: `lab.${status.toLowerCase()}`,
    title: `Lab booking ${status.toLowerCase()}`,
    body: `Your lab booking is now ${status.toLowerCase()}.`,
    relatedEntityType: "LabBooking",
    relatedEntityId: bookingId,
  });

  const eventName = `lab.${status.toLowerCase()}`;
  await viaSocketService.sendEvent(eventName, buildLabEvent(eventName, updated, patient));

  return updated;
}

function sampleLabPayload(event) {
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 2);
  scheduledAt.setHours(9, 0, 0, 0);
  return buildLabEvent(
    event,
    {
      id: "lab_sample123",
      scheduledAt,
      status: event === "lab.cancelled" ? "CANCELLED" : "PENDING",
      items: [{ labTest: { name: "Lipid Profile" }, priceAtBooking: 35 }],
    },
    { name: "John Doe", email: "john.doe@example.com", phone: "+91 98765 43210" }
  );
}

module.exports = { listTests, createBooking, listForPatient, getOwnedBooking, updateStatus, sampleLabPayload };
