const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["PATIENT", "DOCTOR"]),
  specialty: z.string().optional(),
}).refine((data) => data.role !== "DOCTOR" || !!data.specialty, {
  message: "specialty is required when registering as a doctor",
  path: ["specialty"],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

module.exports = { registerSchema, loginSchema };
