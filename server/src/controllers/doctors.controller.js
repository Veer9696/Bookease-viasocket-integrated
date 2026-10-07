const doctorService = require("../services/doctor.service");
const { BadRequestError } = require("../utils/apiError");

async function list(req, res) {
  const { specialty, minFee, maxFee, gender, availableToday } = req.query;
  const doctors = await doctorService.listDoctors({ specialty, minFee, maxFee, gender, availableToday });
  res.json(doctors);
}

async function getById(req, res) {
  const doctor = await doctorService.getDoctorById(req.params.id);
  res.json(doctor);
}

async function getSlots(req, res) {
  const date = new Date(req.query.date);
  if (Number.isNaN(date.getTime())) throw new BadRequestError("A valid date is required");
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

async function updateSettings(req, res) {
  const doctor = await doctorService.getDoctorProfileForUser(req.user.id);
  res.json(await doctorService.updateSettings(doctor.id, req.body));
}

async function addLeave(req, res) {
  const doctor = await doctorService.getDoctorProfileForUser(req.user.id);
  res.status(201).json(await doctorService.addLeave(doctor.id, req.body));
}

async function removeLeave(req, res) {
  const doctor = await doctorService.getDoctorProfileForUser(req.user.id);
  await doctorService.removeLeave(doctor.id, req.params.timeOffId);
  res.status(204).end();
}

module.exports = { list, getById, getSlots, getMyProfile, setAvailability, updateSettings, addLeave, removeLeave };
