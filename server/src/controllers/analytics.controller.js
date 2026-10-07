const analyticsService = require("../services/analytics.service");
const doctorService = require("../services/doctor.service");

async function summary(req, res) {
  const doctor = await doctorService.getDoctorProfileForUser(req.user.id);
  res.json(await analyticsService.getDoctorSummary(doctor, req.query.range));
}

module.exports = { summary };
