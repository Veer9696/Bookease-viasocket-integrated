const doctorService = require("../services/doctor.service");

async function list(req, res) {
  const doctors = await doctorService.listDoctors({ specialty: req.query.specialty });
  res.json(doctors);
}

async function getById(req, res) {
  const doctor = await doctorService.getDoctorById(req.params.id);
  res.json(doctor);
}

async function getSlots(req, res) {
  const date = new Date(req.query.date);
  const slots = await doctorService.getAvailableSlots(req.params.id, date);
  res.json(slots);
}

async function getMyProfile(req, res) {
  const doctor = await doctorService.getDoctorProfileForUser(req.user.id);
  res.json(doctor);
}

async function setAvailability(req, res) {
  const doctor = await doctorService.getDoctorProfileForUser(req.user.id);
  await doctorService.setAvailability(doctor.id, req.body.slots);
  res.status(204).end();
}

async function addTimeOff(req, res) {
  const doctor = await doctorService.getDoctorProfileForUser(req.user.id);
  const timeOff = await doctorService.addTimeOff(doctor.id, req.body);
  res.status(201).json(timeOff);
}

module.exports = { list, getById, getSlots, getMyProfile, setAvailability, addTimeOff };
