const fs = require("fs");
const path = require("path");
const appointmentService = require("../services/appointment.service");
const doctorService = require("../services/doctor.service");
const { UPLOAD_DIR } = require("../middleware/upload");
const { BadRequestError, NotFoundError } = require("../utils/apiError");

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

async function reschedule(req, res) {
  const appointment = await appointmentService.rescheduleAppointment(req.params.id, req.user, req.body);
  res.json(appointment);
}

async function saveMedicalRecord(req, res) {
  const { prescriptionNotes, diagnosisNotes } = req.body;
  if (!prescriptionNotes && !diagnosisNotes && !req.file) {
    throw new BadRequestError("Add prescription notes, diagnosis notes, or attach a report");
  }

  const reportUrl = req.file ? `/api/appointments/${req.params.id}/reports/${req.file.filename}` : undefined;

  try {
    const appointment = await appointmentService.saveMedicalRecord(req.params.id, req.user, {
      diagnosisNotes,
      prescriptionNotes,
      reportUrl,
    });
    res.json(appointment);
  } catch (err) {
    // Don't leave an orphaned medical file on disk if the save was rejected.
    if (req.file) fs.unlink(req.file.path, () => {});
    throw err;
  }
}

async function downloadReport(req, res) {
  const appointment = await appointmentService.getOwnedAppointment(req.params.id, req.user);
  const filename = path.basename(req.params.filename);
  const expectedUrl = `/api/appointments/${appointment.id}/reports/${filename}`;

  if (!appointment.reportUrls.includes(expectedUrl)) throw new NotFoundError("Report not found");

  res.sendFile(path.join(UPLOAD_DIR, filename));
}

module.exports = {
  create,
  listMine,
  getById,
  updateStatus,
  reschedule,
  saveMedicalRecord,
  downloadReport,
};
