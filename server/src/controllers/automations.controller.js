const viaSocketService = require("../services/viaSocket.service");
const { sampleAppointmentPayload } = require("../services/appointmentEvents");
const { sampleLabPayload } = require("../services/labBooking.service");

async function getEmbedToken(req, res) {
  // unique_identifier must stay stable forever for this user, per the
  // viaSocket embed skill — using the user id (not email, which can change).
  const token = viaSocketService.createEmbedToken(req.user.id);
  res.type("text/plain").send(token);
}

async function handleFlowEvent(req, res) {
  await viaSocketService.upsertFlowFromEvent(req.user, req.body);
  res.status(204).end();
}

async function listFlows(req, res) {
  res.json(await viaSocketService.listFlowsForUser(req.user.id));
}

async function samplePayload(req, res) {
  const { event } = req.query;
  res.json(event.startsWith("lab.") ? sampleLabPayload(event) : sampleAppointmentPayload(event));
}

module.exports = { getEmbedToken, handleFlowEvent, listFlows, samplePayload };
