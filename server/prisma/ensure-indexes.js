// Indexes Prisma's schema can't declare. Idempotent: runs on every deploy
// (see render.yaml) and from seed.js.
const { PrismaClient } = require("@prisma/client");

// A slot is taken only while its appointment is PENDING or CONFIRMED, so a
// cancelled/rejected slot can be booked again. MongoDB supports this as a
// partial unique index, which also stops two patients grabbing the same slot
// at the same moment.
async function ensureIndexes(prisma) {
  const indexes = await prisma
    .$runCommandRaw({ listIndexes: "Appointment" })
    .then((r) => r.cursor.firstBatch)
    .catch(() => []);

  // Older schemas created a plain (non-partial) unique index on these fields.
  for (const legacy of ["Appointment_doctorId_scheduledAt_key", "doctor_slot_unique"]) {
    if (indexes.some((i) => i.name === legacy)) {
      await prisma.$runCommandRaw({ dropIndexes: "Appointment", index: legacy });
      console.log(`Dropped legacy index ${legacy}.`);
    }
  }

  await prisma.$runCommandRaw({
    createIndexes: "Appointment",
    indexes: [
      {
        key: { doctorId: 1, scheduledAt: 1 },
        name: "appointment_doctor_slot_active_idx",
        unique: true,
        partialFilterExpression: { status: { $in: ["PENDING", "CONFIRMED"] } },
      },
    ],
  });
  console.log("Ensured double-booking index on Appointment.");

  // Most users have no googleId, so uniqueness may only apply where it's set.
  await prisma.$runCommandRaw({
    createIndexes: "User",
    indexes: [
      {
        key: { googleId: 1 },
        name: "user_google_id_unique",
        unique: true,
        partialFilterExpression: { googleId: { $type: "string" } },
      },
    ],
  });
  console.log("Ensured Google account index on User.");
}

module.exports = { ensureIndexes };

if (require.main === module) {
  const prisma = new PrismaClient();
  ensureIndexes(prisma)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
