const { z } = require("zod");

const createAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  scheduledAt: z.coerce.date(),
  type: z.enum(["in-person", "telehealth"]).default("in-person"),
  notes: z.string().max(2000).optional(),
});

const updateAppointmentStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "REJECTED", "COMPLETED"]),
  cancellationReason: z.string().max(500).optional(),
});

const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMins: z.number().int().min(5).max(240).default(30),
});

module.exports = { createAppointmentSchema, updateAppointmentStatusSchema, availabilitySchema };
