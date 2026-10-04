const { prisma } = require("../config/prismaClient");
const { NotFoundError } = require("../utils/apiError");

async function listDoctors({ specialty } = {}) {
  return prisma.doctorProfile.findMany({
    where: specialty ? { specialty: { equals: specialty, mode: "insensitive" } } : undefined,
    include: { user: { select: { name: true } } },
    orderBy: { rating: "desc" },
  });
}

async function getDoctorById(doctorId) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    include: { user: { select: { name: true } }, availability: true, timeOff: true },
  });
  if (!doctor) throw new NotFoundError("Doctor not found");
  return doctor;
}

async function getDoctorProfileForUser(userId) {
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) throw new NotFoundError("Doctor profile not found");
  return doctor;
}

async function setAvailability(doctorId, slots) {
  return prisma.$transaction([
    prisma.availability.deleteMany({ where: { doctorId } }),
    prisma.availability.createMany({
      data: slots.map((slot) => ({ ...slot, doctorId })),
    }),
  ]);
}

async function addTimeOff(doctorId, { date, startTime, endTime, reason }) {
  return prisma.timeOff.create({ data: { doctorId, date, startTime, endTime, reason } });
}

// Computes open slots for a given date from the weekly availability template,
// minus already-booked appointments and any time-off overlapping that day.
// Deliberately not materialized into a table — demo-scale traffic doesn't
// justify the write complexity/drift risk of a persisted slots model.
async function getAvailableSlots(doctorId, date) {
  const dayOfWeek = date.getDay();
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [availability, timeOff, appointments] = await Promise.all([
    prisma.availability.findMany({ where: { doctorId, dayOfWeek } }),
    prisma.timeOff.findMany({ where: { doctorId, date: { gte: dayStart, lte: dayEnd } } }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ]);

  if (timeOff.some((t) => !t.startTime && !t.endTime)) return []; // full day off

  const bookedTimes = new Set(appointments.map((a) => a.scheduledAt.getTime()));

  const slots = [];
  for (const block of availability) {
    const [startH, startM] = block.startTime.split(":").map(Number);
    const [endH, endM] = block.endTime.split(":").map(Number);
    let cursor = new Date(date);
    cursor.setHours(startH, startM, 0, 0);
    const end = new Date(date);
    end.setHours(endH, endM, 0, 0);

    while (cursor < end) {
      const isTakenByTimeOff = timeOff.some((t) => {
        if (!t.startTime || !t.endTime) return false;
        const [tStartH, tStartM] = t.startTime.split(":").map(Number);
        const [tEndH, tEndM] = t.endTime.split(":").map(Number);
        const tStart = new Date(date).setHours(tStartH, tStartM, 0, 0);
        const tEnd = new Date(date).setHours(tEndH, tEndM, 0, 0);
        return cursor.getTime() >= tStart && cursor.getTime() < tEnd;
      });

      if (!bookedTimes.has(cursor.getTime()) && !isTakenByTimeOff) {
        slots.push(new Date(cursor));
      }
      cursor = new Date(cursor.getTime() + block.slotDurationMins * 60 * 1000);
    }
  }

  return slots;
}

module.exports = {
  listDoctors,
  getDoctorById,
  getDoctorProfileForUser,
  setAvailability,
  addTimeOff,
  getAvailableSlots,
};
