const profileService = require("../services/profile.service");

async function getProfile(req, res) {
  const profile = await profileService.getPatientProfile(req.user.id);
  res.json({ user: profile });
}

async function updateProfile(req, res) {
  const updated = await profileService.updatePatientProfile(req.user.id, req.body);
  res.json({ user: updated });
}

async function listAddresses(req, res) {
  const addresses = await profileService.listAddresses(req.user.id);
  res.json(addresses);
}

async function createAddress(req, res) {
  const address = await profileService.createAddress(req.user.id, req.body);
  res.status(201).json(address);
}

async function updateAddress(req, res) {
  const address = await profileService.updateAddress(req.user.id, req.params.id, req.body);
  res.json(address);
}

async function deleteAddress(req, res) {
  await profileService.deleteAddress(req.user.id, req.params.id);
  res.status(204).end();
}

async function setDefaultAddress(req, res) {
  const address = await profileService.setDefaultAddress(req.user.id, req.params.id);
  res.json(address);
}

module.exports = {
  getProfile,
  updateProfile,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
