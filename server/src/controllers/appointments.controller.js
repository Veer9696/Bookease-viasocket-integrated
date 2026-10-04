const appointmentService = require("../services/appointment.service");
const doctorService = require("../services/doctor.service");

async function create(req, res) {
  const appointment = await appointmentService.createAppointment(req.user, req.body);
  res.status(201).json(appointment);
}

async function listMine(req, res) {
  if (req.user.role === "DOCTOR") {
    const doctor = await doctorService.getDoctorProfileForUser(req.user.id);
    return res.json(await appointmentService.listForDoctor(doctor.id));
  }
  res.json(await appointmentService.listForPatient(req.user.id));
}

async function getById(req, res) {
  const appointment = await appointmentService.getOwnedAppointment(req.params.id, req.user);
  res.json(appointment);
}

async function updateStatus(req, res) {
  const appointment = await appointmentService.updateStatus(req.params.id, req.user, req.body);
  res.json(appointment);
}

module.exports = { create, listMine, getById, updateStatus };
