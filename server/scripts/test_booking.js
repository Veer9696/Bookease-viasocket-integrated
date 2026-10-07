const { prisma } = require('../src/config/prismaClient');
const { signAuthToken } = require('../src/utils/jwt');
const doctorService = require('../src/services/doctor.service');

async function test() {
  const patient = await prisma.user.findFirst({ where: { email: 'virendra@viasocket.com' } });
  const doctor = await prisma.doctorProfile.findFirst({
    where: { specialty: 'bone' },
    include: { user: true }
  });

  console.log('Patient:', patient?.name, patient?.id);
  console.log('Doctor:', doctor?.user?.name, doctor?.id);

  if (!patient || !doctor) {
    console.error('Missing patient or doctor');
    return;
  }

  // Get available slots for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const slots = await doctorService.getAvailableSlots(doctor.id, tomorrow);
  console.log('Available slots count:', slots.length);
  if (slots.length === 0) {
    console.log('No slots available for tomorrow');
    return;
  }

  const slot = slots[0];
  console.log('Selected slot:', slot.toISOString());

  const token = signAuthToken(patient);

  const res = await fetch('http://localhost:5173/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'fetch',
      'Cookie': `bookease_token=${token}`
    },
    body: JSON.stringify({
      doctorId: doctor.id,
      scheduledAt: slot.toISOString(),
      type: 'telehealth',
      notes: 'Test booking notes'
    })
  });

  const data = await res.json();
  console.log('Booking response status:', res.status);
  console.log('Booking response data:', JSON.stringify(data, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
