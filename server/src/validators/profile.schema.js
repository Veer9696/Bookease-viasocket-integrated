const { z } = require("zod");

const updatePatientProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  phone: z.union([z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"), z.literal("")]).optional(),
  dob: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"), z.literal("")]).optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say", ""]).optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""]).optional(),
  emergencyContact: z.string().trim().max(100).optional(),
});

const savedAddressSchema = z.object({
  label: z.string().trim().min(1, "Label is required (e.g. Home, Office)"),
  street: z.string().trim().min(3, "Street address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().optional(),
  pincode: z.string().trim().min(3, "Valid postal code / pincode is required"),
  isDefault: z.boolean().optional(),
});

module.exports = { updatePatientProfileSchema, savedAddressSchema };
