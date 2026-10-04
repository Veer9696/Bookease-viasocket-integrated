import { useState } from "react";
import { useViaSocketEmbed } from "../components/automations/useViaSocketEmbed";
import PopularAutomationCard from "../components/automations/PopularAutomationCard";
import Spinner from "../components/common/Spinner";

// Sample payloads shown to the user while building a flow, matching the
// real event names the backend fires (see viaSocket.service.js callers).
const SAMPLE_PAYLOADS = {
  "appointment.created": {
    event: "appointment.created",
    appointment: { id: "apt_123", scheduledAt: "2026-10-10T16:00:00Z", type: "in-person", status: "PENDING" },
    patient: { name: "John Doe", email: "john@example.com" },
    doctor: { name: "Dr. James Wilson", specialty: "Neurology" },
  },
  "appointment.confirmed": {
    event: "appointment.confirmed",
    appointment: { id: "apt_123", scheduledAt: "2026-10-10T16:00:00Z", status: "CONFIRMED" },
    patient: { name: "John Doe", email: "john@example.com" },
    doctor: { name: "Dr. James Wilson" },
  },
  "lab.booked": {
    event: "lab.booked",
    booking: { id: "lab_123", scheduledAt: "2026-10-05T09:00:00Z", status: "PENDING" },
    patient: { name: "John Doe", email: "john@example.com" },
    tests: [{ name: "Lipid Profile", price: 35 }],
  },
};

// NOTE: these service ids are placeholders for targeting a specific app in
// the embed's "first app" picker — confirm the real ids in the viaSocket
// dashboard/catalog before relying on them to pre-select an app.
const POPULAR = [
  { key: "google-calendar", icon: "📅", title: "Google Calendar", description: "Add new appointments to my calendar", event: "appointment.created" },
  { key: "gmail", icon: "📧", title: "Gmail", description: "Send appointment confirmation emails", event: "appointment.created" },
  { key: "google-sheets", icon: "📊", title: "Google Sheets", description: "Save completed appointments for reporting", event: "appointment.confirmed" },
  { key: "slack", icon: "💬", title: "Slack", description: "Notify clinic staff about new bookings (optional)", event: "appointment.created" },
];

export default function AutomationsPage() {
  const { ready, mount } = useViaSocketEmbed();
  const [activeEvent, setActiveEvent] = useState("appointment.created");
  const [browsing, setBrowsing] = useState(false);

  function openFor(eventName, serviceId) {
    setActiveEvent(eventName);
    setBrowsing(true);
    setTimeout(() => {
      mount("#viasocket-embed", {
        config: serviceId ? { filteredServices: [serviceId] } : undefined,
        open: { dummy_payload: SAMPLE_PAYLOADS[eventName], meta: eventName, ...(serviceId ? { serviceId } : {}) },
      });
    }, 0);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
      <p className="mt-1 text-gray-500">
        Connect BookEase to the apps your clinic already uses — no code required.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">Popular automations</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {POPULAR.map((p) => (
          <PopularAutomationCard
            key={p.key}
            icon={p.icon}
            title={p.title}
            description={p.description}
            onClick={() => openFor(p.event, p.key)}
          />
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={() => openFor(activeEvent)}
          className="text-sm font-medium text-primary hover:underline"
        >
          Browse all apps →
        </button>
      </div>

      {browsing && (
        <div className="mt-6">
          {!ready && <Spinner label="Loading automation platform..." />}
          <div id="viasocket-embed" className="h-[700px] w-full rounded-card border border-gray-200 bg-white shadow-sm" />
        </div>
      )}
    </div>
  );
}
