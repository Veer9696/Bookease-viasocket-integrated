const viaSocketService = require("../services/viaSocket.service");

async function getEmbedToken(req, res) {
  // unique_identifier must stay stable forever for this user/clinic, per the
  // viaSocket embed skill — using the user id (not email, which can change).
  const token = viaSocketService.createEmbedToken(req.user.id);
  res.type("text/plain").send(token);
}

async function handleFlowEvent(req, res) {
  await viaSocketService.upsertFlowFromEvent(req.body);
  res.status(200).send("Flow updated");
}

async function listFlows(req, res) {
  res.json(await viaSocketService.listFlows());
}

module.exports = { getEmbedToken, handleFlowEvent, listFlows };
