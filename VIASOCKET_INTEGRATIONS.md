# BookEase viaSocket Integrations — Prioritized Roadmap

This is the full write-up referenced in the migration plan: for each app, what it does, why it's
useful here, the trigger/action shape, an example workflow, and who it's for. Ranked by priority.
**#1 (Google Calendar + Gmail + Slack fan-out on `appointment.created`) is implemented as the first
demonstration automation in Phase 4** — see `client/src/pages/AutomationsPage.jsx` and
`server/src/services/appointment.service.js`. The rest are scoped for later phases or backlog.

## High Priority — implement first (core patient/doctor workflow)

### 1. Google Calendar
- **What**: Creates a calendar event from a webhook trigger.
- **Why**: Doctors and patients already live in their calendars; a booking that doesn't show up
  there gets missed or double-booked.
- **Trigger**: `appointment.created` / `appointment.confirmed`.
- **Action**: Create event with doctor name, patient name, date/time, appointment type, and notes.
- **Example**: Patient books a 4pm Tuesday slot → event appears on the doctor's (and optionally the
  patient's) Google Calendar automatically.
- **Audience**: Doctors and patients.

### 2. Gmail
- **What**: Sends transactional email.
- **Why**: The only reliable channel every patient has; needed for confirmations, reminders,
  cancellations, and doctor alerts without building an email service ourselves.
- **Trigger**: `appointment.created`, `appointment.confirmed`, `appointment.cancelled`,
  `appointment.reminder`, `lab.booked`.
- **Action**: Send a templated email to the relevant party.
- **Example**: Appointment confirmed → patient gets "Your appointment with Dr. Smith is confirmed
  for Oct 10, 4:00 PM."
- **Audience**: Patients, doctors.

### 3. WhatsApp Business
- **What**: Sends WhatsApp messages via a WhatsApp-capable provider available in viaSocket.
- **Why**: Significantly higher open/read rates than email for appointment reminders in many
  patient populations; many patients check WhatsApp before email.
- **Trigger**: `appointment.created`, `appointment.reminder`.
- **Action**: Send a short confirmation/reminder message with date, time, and doctor name.
- **Example**: 24h before an appointment, patient gets a WhatsApp message instead of (or alongside)
  an email reminder.
- **Audience**: Patients.

### 4. SMS (e.g. Twilio)
- **What**: Sends a text message.
- **Why**: Fallback channel for patients without a smartphone or WhatsApp — the lowest common
  denominator for appointment reminders.
- **Trigger**: Same as WhatsApp.
- **Action**: Send a short SMS with the essentials (date, time, doctor, cancel link).
- **Example**: Patient without WhatsApp still gets a 1-hour reminder by text.
- **Audience**: Patients.

## Medium Priority — add next

### 5. Slack
- **What**: Posts a message to a clinic's Slack channel.
- **Why**: Front-desk/clinic staff need visibility into new bookings and cancellations without
  checking the app constantly — but this must stay opt-in per clinic, never forced on patients.
- **Trigger**: `appointment.created`, `appointment.cancelled`.
- **Action**: Post a message to a configured channel with patient, doctor, and time.
- **Example**: New booking comes in → `#front-desk` gets "New appointment: John Doe with Dr. Smith,
  Oct 10 4:00 PM."
- **Audience**: Clinic staff/admins.

### 6. Google Sheets
- **What**: Appends a row to a spreadsheet.
- **Why**: Many clinics still do lightweight reporting/reconciliation in spreadsheets; this avoids
  building a reporting dashboard just to get that data out.
- **Trigger**: `appointment.completed`.
- **Action**: Append a row (appointment id, patient, doctor, type, date, time, status).
- **Example**: End of day, a clinic admin opens a Sheet with every completed appointment logged
  automatically.
- **Audience**: Admins.

### 7. Zoom / Google Meet
- **What**: Creates a video meeting link.
- **Why**: Telehealth appointments need a join link; generating it automatically avoids a doctor
  manually creating and sharing one per booking.
- **Trigger**: `appointment.created` where `type = telehealth`.
- **Action**: Create a meeting, attach the join link to the confirmation email/Calendar event.
- **Example**: Patient books a telehealth slot → confirmation email includes a Zoom link that's
  also on the Calendar event.
- **Audience**: Doctors and patients.

### 8. Microsoft Outlook/Calendar
- **What**: Same as Google Calendar, for Microsoft 365 users.
- **Why**: Not every clinic/doctor is on Google Workspace; parity matters for adoption.
- **Trigger**: Same as Google Calendar.
- **Action**: Create an Outlook calendar event.
- **Audience**: Doctors.

## Optional/Advanced — clinics, hospitals, administrators

### 9. Patient intake forms (Typeform / Jotform / Google Forms)
- **What**: Sends a form link and captures responses.
- **Why**: Pre-visit questionnaires save consultation time and get basic history before the
  appointment, without building a custom form builder into BookEase.
- **Trigger**: `appointment.created`.
- **Action**: Email/text a form link; store the response reference against the appointment.
- **Example**: Booking a new-patient appointment triggers an intake form link the patient fills out
  before arriving.
- **Audience**: Patients (fills it out), visible to doctors.

### 10. CRM (HubSpot / Pipedrive)
- **What**: Syncs contacts and tasks.
- **Why**: Clinics doing active patient outreach (follow-ups, re-engagement, no-show recovery) want
  this data in a CRM they already use, not locked inside BookEase.
- **Trigger**: New patient registration, `appointment.no_show` (future enhancement).
- **Action**: Create/update a CRM contact; create a follow-up task for no-shows.
- **Example**: A patient no-shows → a "call to reschedule" task appears in the clinic's CRM.
- **Audience**: Clinic admins.

## Design principle carried through all of these

Every payload sent to a third-party app is built from an explicit whitelist of fields in the
relevant service (`appointment.service.js`, `labBooking.service.js`, `reminder.service.js`) — never
a spread of the full patient/appointment record. This is what makes "don't send unnecessary medical
information to third-party apps" an enforced default rather than a guideline.
