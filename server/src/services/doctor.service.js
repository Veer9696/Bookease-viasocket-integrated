const { prisma } = require("../config/prismaClient");
const { NotFoundError, BadRequestError } = require("../utils/apiError");

const MAX_LEAVE_DAYS = 90;
const MINUTE = 60 * 1000;

function parseTime(date, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// "2026-10-12" -> local-time Date at noon. Parsing as local (not UTC) keeps
// the blocked day from shifting to the previous/next day in other timezones.
function parseLocalDate(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

async function listDoctors({ specialty, minFee, maxFee, gender, availableToday } = {}) {
  const where = {};

  if (specialty && specialty.trim()) {
    where.specialty = { contains: specialty.trim(), mode: "insensitive" };
  }

  if (gender && gender.trim()) {
    where.gender = { equals: gender.trim(), mode: "insensitive" };
  }

  const feeFilter = {};
  if (minFee !== undefined && minFee !== "") {
    feeFilter.gte = Number(minFee);
  }
  if (maxFee !== undefined && maxFee !== "") {
    feeFilter.lte = Number(maxFee);
  }
  if (Object.keys(feeFilter).length > 0) {
    where.fee = feeFilter;
  }

  const doctors = await prisma.doctorProfile.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { rating: "desc" },
  });

  if (availableToday === true || availableToday === "true" || availableToday === "1") {
    const today = new Date();
    const availableDocs = [];
    for (const doc of doctors) {
      const slots = await getAvailableSlots(doc.id, today);
      if (slots.length > 0) {
        availableDocs.push({ ...doc, availableSlotsToday: slots.length });
      }
    }
    return availableDocs;
  }

  return doctors;
}

async function getDoctorById(doctorId) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    include: { user: { select: { name: true, email: true, phone: true } }, availability: true },
  });
  if (!doctor) throw new NotFoundError("Doctor not found");
  return doctor;
}

async function getDoctorProfileForUser(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      availability: true,
      timeOff: { where: { date: { gte: today } }, orderBy: { date: "asc" } },
    },
  });
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

async function updateSettings(
  doctorId,
  {
    bufferMins,
    locationUrl,
    phone,
    name,
    licenseNumber,
    qualifications,
    bio,
    fee,
    clinic,
    clinicAddress,
    gender,
  }
) {
  const profileData = {};
  if (bufferMins !== undefined) profileData.bufferMins = Number(bufferMins);
  if (locationUrl !== undefined) profileData.locationUrl = locationUrl || null;
  if (licenseNumber !== undefined) profileData.licenseNumber = licenseNumber || null;
  if (qualifications !== undefined) profileData.qualifications = qualifications || null;
  if (bio !== undefined) profileData.bio = bio || null;
  if (fee !== undefined) profileData.fee = Number(fee);
  if (clinic !== undefined) profileData.clinic = clinic || null;
  if (clinicAddress !== undefined) profileData.clinicAddress = clinicAddress || null;
  if (gender !== undefined) profileData.gender = gender || null;

  const userData = {};
  if (phone !== undefined) userData.phone = phone || null;
  if (name !== undefined && name.trim()) userData.name = name.trim();

  return prisma.doctorProfile.update({
    where: { id: doctorId },
    data: {
      ...profileData,
      ...(Object.keys(userData).length > 0 ? { user: { update: userData } } : {}),
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      availability: true,
    },
  });
}

// Blocks whole days (one TimeOff row per day) without touching the weekly
// availability template, so the regular schedule resumes after the leave.
async function addLeave(doctorId, { startDate, endDate, reason }) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate || startDate);
  if (end < start) throw new BadRequestError("End date must be on or after start date");

  const days = Math.round((end - start) / (24 * 60 * MINUTE)) + 1;
  if (days > MAX_LEAVE_DAYS) throw new BadRequestError(`Leave can be at most ${MAX_LEAVE_DAYS} days at a time`);

  const existing = await prisma.timeOff.findMany({
    where: { doctorId, date: { gte: start, lte: end }, startTime: null },
    select: { date: true },
  });
  const alreadyBlocked = new Set(existing.map((t) => t.date.toDateString()));

  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (!alreadyBlocked.has(date.toDateString())) data.push({ doctorId, date, reason });
  }

  if (data.length) await prisma.timeOff.createMany({ data });
  return { blockedDays: data.length };
}

async function removeLeave(doctorId, timeOffId) {
  const { count } = await prisma.timeOff.deleteMany({ where: { id: timeOffId, doctorId } });
  if (!count) throw new NotFoundError("Blocked date not found");
}

// Computes open slots for a given date from the weekly availability template,
// minus already-booked appointments (padded by the doctor's buffer), any
// time-off overlapping that day, and slots already in the past.
// Deliberately not materialized into a table — demo-scale traffic doesn't
// justify the write complexity/drift risk of a persisted slots model.
async function getAvailableSlots(doctorId, date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [doctor, availability, timeOff, appointments] = await Promise.all([
    prisma.doctorProfile.findUnique({ where: { id: doctorId }, select: { bufferMins: true } }),
    prisma.availability.findMany({ where: { doctorId, dayOfWeek: date.getDay() } }),
    prisma.timeOff.findMany({ where: { doctorId, date: { gte: dayStart, lte: dayEnd } } }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { scheduledAt: true },
    }),
  ]);
  if (!doctor) throw new NotFoundError("Doctor not found");

  if (timeOff.some((t) => !t.startTime && !t.endTime)) return []; // full day off

  const buffer = doctor.bufferMins * MINUTE;
  const now = Date.now();
  const slots = [];

  for (const block of availability) {
    const duration = block.slotDurationMins * MINUTE;
    const end = parseTime(date, block.endTime).getTime();
    let cursor = parseTime(date, block.startTime).getTime();

    while (cursor + duration <= end) {
      const overlapsBooking = appointments.some(({ scheduledAt }) => {
        const booked = scheduledAt.getTime();
        // Visits need `buffer` minutes of gap on either side.
        return cursor < booked + duration + buffer && cursor + duration + buffer > booked;
      });

      const overlapsTimeOff = timeOff.some((t) => {
        if (!t.startTime || !t.endTime) return false;
        const tStart = parseTime(date, t.startTime).getTime();
        const tEnd = parseTime(date, t.endTime).getTime();
        return cursor < tEnd && cursor + duration > tStart;
      });

      if (cursor > now && !overlapsBooking && !overlapsTimeOff) slots.push(new Date(cursor));
      cursor += duration + buffer;
    }
  }

  return slots.sort((a, b) => a - b);
}

module.exports = {
  listDoctors,
  getDoctorById,
  getDoctorProfileForUser,
  setAvailability,
  updateSettings,
  addLeave,
  removeLeave,
  getAvailableSlots,
};
