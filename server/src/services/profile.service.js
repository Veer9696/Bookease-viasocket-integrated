const { prisma } = require("../config/prismaClient");
const { NotFoundError, BadRequestError } = require("../utils/apiError");

async function getPatientProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { savedAddresses: { orderBy: { createdAt: "desc" } } },
  });
  if (!user) throw new NotFoundError("User not found");
  const { passwordHash, ...safe } = user;
  return safe;
}

async function updatePatientProfile(userId, data) {
  const { name, phone, dob, gender, bloodGroup, emergencyContact } = data;

  let dobDate = undefined;
  if (dob !== undefined) {
    if (dob && dob.trim() !== "") {
      const [y, m, d] = dob.split("-").map(Number);
      dobDate = new Date(Date.UTC(y, m - 1, d));
    } else {
      dobDate = null;
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(dob !== undefined ? { dob: dobDate } : {}),
      ...(gender !== undefined ? { gender: gender || null } : {}),
      ...(bloodGroup !== undefined ? { bloodGroup: bloodGroup || null } : {}),
      ...(emergencyContact !== undefined ? { emergencyContact: emergencyContact || null } : {}),
    },
    include: { savedAddresses: { orderBy: { createdAt: "desc" } } },
  });

  const { passwordHash, ...safe } = updated;
  return safe;
}

async function listAddresses(userId) {
  return prisma.savedAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

async function createAddress(userId, data) {
  const { label, street, city, state, pincode, isDefault } = data;

  const count = await prisma.savedAddress.count({ where: { userId } });
  // If first address, automatically make it default
  const shouldBeDefault = isDefault || count === 0;

  if (shouldBeDefault) {
    await prisma.savedAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.savedAddress.create({
    data: {
      userId,
      label,
      street,
      city,
      state: state || null,
      pincode,
      isDefault: shouldBeDefault,
    },
  });
}

async function updateAddress(userId, addressId, data) {
  const existing = await prisma.savedAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw new NotFoundError("Address not found");

  if (data.isDefault) {
    await prisma.savedAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.savedAddress.update({
    where: { id: addressId },
    data: {
      ...(data.label ? { label: data.label } : {}),
      ...(data.street ? { street: data.street } : {}),
      ...(data.city ? { city: data.city } : {}),
      ...(data.state !== undefined ? { state: data.state || null } : {}),
      ...(data.pincode ? { pincode: data.pincode } : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
    },
  });
}

async function deleteAddress(userId, addressId) {
  const existing = await prisma.savedAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw new NotFoundError("Address not found");

  await prisma.savedAddress.delete({ where: { id: addressId } });

  // If deleted address was default, make the most recent remaining address default
  if (existing.isDefault) {
    const remaining = await prisma.savedAddress.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (remaining) {
      await prisma.savedAddress.update({
        where: { id: remaining.id },
        data: { isDefault: true },
      });
    }
  }

  return { success: true };
}

async function setDefaultAddress(userId, addressId) {
  const existing = await prisma.savedAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw new NotFoundError("Address not found");

  await prisma.savedAddress.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  return prisma.savedAddress.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
}

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
