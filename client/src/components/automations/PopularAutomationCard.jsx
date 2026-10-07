import { eventLabel } from "./automationCatalog";

export default function PopularAutomationCard({ app, status, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start gap-2 rounded-card border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-primary hover:shadow-md"
    >
      {status === "ACTIVE" && (
        <span className="absolute right-4 top-4 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">✓ Active</span>
      )}
      {status === "DRAFT" && (
        <span className="absolute right-4 top-4 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">Draft</span>
      )}
      <img src={app.icon} alt="" className="h-10 w-10 rounded-lg object-contain" />
      <h3 className="font-semibold text-gray-900">{app.name}</h3>
      <p className="text-sm text-gray-500">{app.description}</p>
      <p className="mt-auto text-xs text-gray-400">When: {eventLabel(app.event)}</p>
    </button>
  );
}
