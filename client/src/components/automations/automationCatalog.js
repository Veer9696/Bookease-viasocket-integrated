// service_id values come from viaSocket's catalog search
// (GET https://flow.sokt.io/func/scri12BSufQM?key=<app name>) — never invent them.
export const POPULAR_APPS = [
  {
    key: "whatsapp",
    serviceId: "rowfgty2478l",
    name: "WhatsApp",
    icon: "https://stuff.thingsofbrand.com/viasocket.com/images/imge_whatsapp.svg",
    description: "Message patients when a booking is confirmed",
    event: "appointment.confirmed",
  },
  {
    key: "sms",
    serviceId: "rowew4263ej8",
    name: "SMS (Twilio)",
    icon: "https://stuff.thingsofbrand.com/twilio.com/images/img6d4d5ca53c_twilio.jpg",
    description: "Text patients their visit time and clinic location",
    event: "appointment.confirmed",
  },
  {
    key: "google-calendar",
    serviceId: "rowkhibv5efp",
    name: "Google Calendar",
    icon: "https://stuff.thingsofbrand.com/google.com/images/img7_Google-Calendar.png",
    description: "Add confirmed appointments to my calendar",
    event: "appointment.confirmed",
  },
  {
    key: "gmail",
    serviceId: "rowo0bqrhj5g",
    name: "Gmail",
    icon: "https://stuff.thingsofbrand.com/gmail.com/images/imge_idrA5FDGTH_1763454052978.svg",
    description: "Email patients when they book",
    event: "appointment.created",
  },
  {
    key: "google-sheets",
    serviceId: "rowqm5xi2",
    name: "Google Sheets",
    icon: "https://stuff.thingsofbrand.com/google.com/images/img4_googlesheet.png",
    description: "Log completed appointments for reporting",
    event: "appointment.completed",
  },
  {
    key: "slack",
    serviceId: "rowbu58rc",
    name: "Slack",
    icon: "https://stuff.thingsofbrand.com/slack.com/images/img668216333e_slack.jpg",
    description: "Notify clinic staff about new bookings (optional)",
    event: "appointment.created",
  },
];

// Lab bookings aren't tied to a doctor, so lab events only reach admin-owned
// automations — they're offered to admins only.
export const TRIGGER_EVENTS = [
  { value: "appointment.created", label: "Appointment booked" },
  { value: "appointment.confirmed", label: "Appointment confirmed" },
  { value: "appointment.cancelled", label: "Appointment cancelled" },
  { value: "appointment.rejected", label: "Appointment declined by doctor" },
  { value: "appointment.completed", label: "Appointment completed" },
  { value: "appointment.reminder", label: "Appointment reminder (24h / 1h before)" },
  { value: "lab.booked", label: "Lab test booked", adminOnly: true },
  { value: "lab.cancelled", label: "Lab test cancelled", adminOnly: true },
];

export function eventLabel(value) {
  return TRIGGER_EVENTS.find((e) => e.value === value)?.label || value || "Unknown trigger";
}
