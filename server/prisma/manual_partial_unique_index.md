# Partial unique index for double-booking prevention (MongoDB)

`schema.prisma`'s `@@unique([doctorId, scheduledAt])` on `Appointment` is a baseline guard, but it's
**too strict on its own**: it would permanently block a slot even after the appointment booked into
it is cancelled, since Prisma's schema syntax can't express a conditional ("partial") unique index.

MongoDB supports partial indexes natively via `partialFilterExpression`, so apply this once, by hand,
after your first `npx prisma db push`:

1. Connect to your Atlas cluster (Atlas UI "Browse Collections" → shell, `mongosh "<connection string>"`,
   or MongoDB Compass's shell tab).
2. Drop the plain unique index Prisma created and replace it with a partial one scoped to active
   appointments only (a cancelled/rejected slot can be rebooked):

```js
db.Appointment.dropIndex("doctorId_1_scheduledAt_1");

db.Appointment.createIndex(
  { doctorId: 1, scheduledAt: 1 },
  {
    unique: true,
    name: "appointment_doctor_slot_active_idx",
    partialFilterExpression: { status: { $in: ["PENDING", "CONFIRMED"] } },
  }
);
```

3. Verify with `db.Appointment.getIndexes()` — you should see `appointment_doctor_slot_active_idx`
   and no plain `doctorId_1_scheduledAt_1` index left over.

The application code already expects this: `appointment.service.js` catches Prisma's `P2002`
unique-violation error and returns a clean 409, and the index above is what actually prevents the
race — the service-layer check is just there for a fast, friendly error message.

Re-run step 2 any time you `prisma db push` against a fresh database, since `db push` will recreate
the plain index from the schema if the collection doesn't have one yet.
