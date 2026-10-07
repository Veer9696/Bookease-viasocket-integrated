import { POPULAR_APPS, eventLabel } from "./automationCatalog";
import EmptyState from "../common/EmptyState";

const STATUS_STYLES = {
  ACTIVE: { label: "Active", className: "bg-success/10 text-success" },
  PAUSED: { label: "Paused", className: "bg-gray-200 text-gray-600" },
  DRAFT: { label: "Draft", className: "bg-warning/10 text-warning" },
};

function iconsFor(flow) {
  if (flow.serviceIcons?.length) return flow.serviceIcons.slice(0, 3);
  const app = POPULAR_APPS.find((a) => a.key === flow.appKey);
  return app ? [app.icon] : [];
}

export default function AutomationList({ flows, onEdit }) {
  if (flows.length === 0) {
    return (
      <EmptyState
        title="No automations yet"
        description="Pick a popular automation below, or browse all apps to build your own."
      />
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-card border border-gray-100 bg-white shadow-sm">
      {flows.map((flow) => {
        const status = STATUS_STYLES[flow.status] || STATUS_STYLES.DRAFT;
        const appName = POPULAR_APPS.find((a) => a.key === flow.appKey)?.name;
        return (
          <li key={flow.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex shrink-0 -space-x-2">
                {iconsFor(flow).map((src) => (
                  <img key={src} src={src} alt="" className="h-9 w-9 rounded-lg border-2 border-white bg-white object-contain" />
                ))}
                {iconsFor(flow).length === 0 && <div className="h-9 w-9 rounded-lg bg-primary-light" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{flow.title || appName || "Untitled automation"}</p>
                <p className="text-sm text-gray-500">When: {eventLabel(flow.eventName)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
              <button onClick={() => onEdit(flow)} className="text-sm font-medium text-primary hover:underline">
                {flow.status === "DRAFT" ? "Finish setup" : "Edit"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
