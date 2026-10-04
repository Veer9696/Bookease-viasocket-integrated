const notificationService = require("../services/notification.service");

async function list(req, res) {
  const unreadOnly = req.query.unreadOnly === "true";
  res.json(await notificationService.listForUser(req.user.id, { unreadOnly }));
}

async function markRead(req, res) {
  await notificationService.markRead(req.user.id, req.params.id);
  res.status(204).end();
}

async function markAllRead(req, res) {
  await notificationService.markAllRead(req.user.id);
  res.status(204).end();
}

module.exports = { list, markRead, markAllRead };
