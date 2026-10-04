const { z } = require("zod");

const createLabBookingSchema = z.object({
  scheduledAt: z.coerce.date(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({ labTestId: z.string().min(1) })).min(1, "Select at least one test"),
});

const updateLabBookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

module.exports = { createLabBookingSchema, updateLabBookingStatusSchema };
