const labBookingService = require("../services/labBooking.service");

async function listTests(req, res) {
  res.json(await labBookingService.listTests());
}

async function create(req, res) {
  const booking = await labBookingService.createBooking(req.user, req.body);
  res.status(201).json(booking);
}

async function listMine(req, res) {
  res.json(await labBookingService.listForPatient(req.user.id));
}

async function getById(req, res) {
  res.json(await labBookingService.getOwnedBooking(req.params.id, req.user.id));
}

async function updateStatus(req, res) {
  const booking = await labBookingService.updateStatus(req.params.id, req.user.id, req.body.status);
  res.json(booking);
}

module.exports = { listTests, create, listMine, getById, updateStatus };
