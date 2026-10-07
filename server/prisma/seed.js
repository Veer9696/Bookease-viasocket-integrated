const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { ensureIndexes } = require("./ensure-indexes");

const prisma = new PrismaClient();

const DOCTORS = [
  { name: "Dr. Sarah Smith", email: "sarah.smith@bookease.demo", specialty: "Cardiology", experience: "15 years", qualifications: "MD, FACC", clinic: "HeartCare Center", rating: 4.9, fee: 100, image: "https://i.pravatar.cc/150?img=1" },
  { name: "Dr. James Wilson", email: "james.wilson@bookease.demo", specialty: "Neurology", experience: "12 years", qualifications: "MD, PhD", clinic: "Neuro Health", rating: 4.8, fee: 120, image: "https://i.pravatar.cc/150?img=11" },
  { name: "Dr. Emily Chen", email: "emily.chen@bookease.demo", specialty: "Dermatology", experience: "8 years", qualifications: "MD, FAAD", clinic: "Skin Wellness Clinic", rating: 4.7, fee: 80, image: "https://i.pravatar.cc/150?img=5" },
  { name: "Dr. Michael Brown", email: "michael.brown@bookease.demo", specialty: "Orthopedics", experience: "20 years", qualifications: "MD, FAAOS", clinic: "Ortho Institute", rating: 4.9, fee: 150, image: "https://i.pravatar.cc/150?img=8" },
  { name: "Dr. Aisha Khan", email: "aisha.khan@bookease.demo", specialty: "Gynecology", experience: "10 years", qualifications: "MD, FACOG", clinic: "Women Health Center", rating: 4.6, fee: 90, image: "https://i.pravatar.cc/150?img=9" },
  { name: "Dr. Robert Davis", email: "robert.davis@bookease.demo", specialty: "Pediatrics", experience: "14 years", qualifications: "MD, FAAP", clinic: "Kids Care", rating: 4.8, fee: 95, image: "https://i.pravatar.cc/150?img=12" },
];

const LAB_TESTS = [
  { name: "Complete Blood Count (CBC)", description: "Blood - no fasting required - results in 6 hrs", price: 20 },
  { name: "Lipid Profile", description: "Cardiology - fasting 10-12 hrs required - results in 12 hrs", price: 35 },
  { name: "HbA1c", description: "Diabetes - no fasting required - results in 6 hrs", price: 18 },
  { name: "Thyroid Profile (T3, T4, TSH)", description: "Thyroid - no fasting required - results in 12 hrs", price: 40 },
  { name: "Liver Function Test (LFT)", description: "Blood - no fasting required - results in 12 hrs", price: 30 },
  { name: "Urine Routine", description: "Urine - no fasting required - results in 6 hrs", price: 10 },
];

const DEFAULT_AVAILABILITY = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
  slotDurationMins: 30,
}));

const DEMO_PASSWORD = "Demo12345!";

async function seedDoctors() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const doc of DOCTORS) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        passwordHash,
        name: doc.name,
        role: "DOCTOR",
        doctorProfile: {
          create: {
            specialty: doc.specialty,
            experience: doc.experience,
            qualifications: doc.qualifications,
            clinic: doc.clinic,
            rating: doc.rating,
            fee: doc.fee,
            image: doc.image,
            availability: { create: DEFAULT_AVAILABILITY },
          },
        },
      },
    });
    console.log(`Seeded doctor ${doc.name} (login: ${doc.email} / ${DEMO_PASSWORD})`);
  }
}

async function seedLabTests() {
  for (const test of LAB_TESTS) {
    const existing = await prisma.labTest.findFirst({ where: { name: test.name } });
    if (!existing) await prisma.labTest.create({ data: test });
  }
  console.log(`Seeded ${LAB_TESTS.length} lab tests.`);
}

// One-time migration of the old flows.json file store into the
// ViaSocketFlow table, so registered automations survive the rewrite.
async function migrateFlowsJson() {
  const flowsPath = path.join(__dirname, "..", "..", "flows.json");
  if (!fs.existsSync(flowsPath)) return;

  const flows = JSON.parse(fs.readFileSync(flowsPath, "utf8"));
  const entries = Object.values(flows);

  for (const flow of entries) {
    await prisma.viaSocketFlow.upsert({
      where: { id: flow.id },
      update: {},
      create: {
        id: flow.id,
        title: flow.title || null,
        webhookUrl: flow.webhookurl,
        payload: flow.payload || null,
        eventName: flow.eventName || null,
        status: flow.status === "paused" ? "PAUSED" : "ACTIVE",
      },
    });
  }
  console.log(`Migrated ${entries.length} flow(s) from flows.json.`);
}

async function main() {
  await ensureIndexes(prisma);
  await seedDoctors();
  await seedLabTests();
  await migrateFlowsJson();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
