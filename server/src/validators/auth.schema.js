const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
  // Required: appointment confirmations go out by WhatsApp/SMS as well as email.
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
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

// Name and email come from the verified Google profile, not the request body.
const googleSignupSchema = registerSchema.innerType().pick({ phone: true, role: true, specialty: true })
  .refine((data) => data.role !== "DOCTOR" || !!data.specialty, {
    message: "specialty is required when registering as a doctor",
    path: ["specialty"],
  });

module.exports = { registerSchema, loginSchema, googleSignupSchema };
