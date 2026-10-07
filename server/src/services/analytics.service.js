const { prisma } = require("../config/prismaClient");

function rangeBounds(range) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "month") {
    start.setDate(1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start, end };
  }

  // Week starts on Monday.
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function localDayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Revenue counts only COMPLETED visits, at the fee snapshotted when the
// appointment was booked (falling back to the current fee for older rows).
async function getDoctorSummary(doctor, range) {
  const { start, end } = rangeBounds(range);

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id, scheduledAt: { gte: start, lt: end } },
    select: { status: true, scheduledAt: true, feeAtBooking: true },
  });

  const counts = { total: appointments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0 };
  let revenue = 0;
  const perDay = new Map();

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    perDay.set(localDayKey(d), 0);
  }

  for (const a of appointments) {
    counts[a.status.toLowerCase()] += 1;
    if (a.status === "COMPLETED") revenue += a.feeAtBooking ?? doctor.fee;
    const key = localDayKey(a.scheduledAt);
    perDay.set(key, (perDay.get(key) || 0) + 1);
  }

  return {
    range,
    from: start.toISOString(),
    to: end.toISOString(),
    counts,
    revenue,
    daily: [...perDay].map(([date, count]) => ({ date, count })),
  };
}

module.exports = { getDoctorSummary };
