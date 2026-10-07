const bcrypt = require("bcryptjs");
const { prisma } = require("../config/prismaClient");
const { BadRequestError, UnauthorizedError } = require("../utils/apiError");

async function register({ email, password, name, phone, role, specialty }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new BadRequestError("An account with that email already exists");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phone,
      role,
      ...(role === "DOCTOR"
        ? { doctorProfile: { create: { specialty, fee: 0 } } }
        : {}),
    },
    include: { doctorProfile: true },
  });

  return sanitizeUser(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email }, include: { doctorProfile: true } });
  if (!user) throw new UnauthorizedError("Invalid email or password");
  if (!user.passwordHash) throw new UnauthorizedError("This account uses Google sign-in. Continue with Google instead.");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  return sanitizeUser(user);
}

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = { register, login, sanitizeUser };
