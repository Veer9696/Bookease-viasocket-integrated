import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { automationsApi } from "../services/automationsApi";
import { useAuth } from "../context/AuthContext";
import { POPULAR_APPS } from "../components/automations/automationCatalog";
import AutomationList from "../components/automations/AutomationList";
import PopularAutomationCard from "../components/automations/PopularAutomationCard";
import EmbedPanel from "../components/automations/EmbedPanel";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";
import { useToast } from "../components/common/Toast";

const FLOW_MESSAGES = {
  published: "Automation is live",
  updated: "Automation updated",
  paused: "Automation paused",
  deleted: "Automation deleted",
};

export default function AutomationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [session, setSession] = useState(null);

  const { data: flows = [], isLoading, error } = useQuery({
    queryKey: ["automation-flows"],
    queryFn: automationsApi.listFlows,
  });

  const handleFlow = useCallback(
    (flow) => {
      queryClient.invalidateQueries({ queryKey: ["automation-flows"] });
      if (FLOW_MESSAGES[flow.action]) showToast(FLOW_MESSAGES[flow.action], "success");
    },
    [queryClient, showToast]
  );

  const closePanel = useCallback(() => {
    setSession(null);
    queryClient.invalidateQueries({ queryKey: ["automation-flows"] });
  }, [queryClient]);

  // An app's badge reflects its best state: active beats draft.
  function statusForApp(appKey) {
    const appFlows = flows.filter((f) => f.appKey === appKey);
    if (appFlows.some((f) => f.status === "ACTIVE")) return "ACTIVE";
    if (appFlows.some((f) => f.status === "DRAFT")) return "DRAFT";
    return null;
  }

  const handleCardClick = (app) => {
    const existing = flows.find(
      (f) => f.appKey === app.key && (f.status === "ACTIVE" || f.status === "DRAFT")
    );
    if (existing) {
      setSession({
        mode: "edit",
        flowId: existing.id,
        title: existing.title || app.name,
        app,
        event: existing.eventName || app.event,
      });
    } else {
      setSession({ mode: "app", app, event: app.event });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="mt-1 text-gray-500">Connect BookEase to the apps your clinic already uses — no code required.</p>
        </div>
        <Button onClick={() => setSession({ mode: "browse", event: "appointment.created" })}>+ Browse all apps</Button>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Your automations</h2>
        <p className="mt-1 text-sm text-gray-500">These run automatically on your own appointments.</p>
        <div className="mt-3">
          {isLoading && <Spinner label="Loading your automations..." />}
          <ErrorBanner message={error?.message} />
          {!isLoading && !error && (
            <AutomationList
              flows={flows}
              onEdit={(flow) => {
                const matchedApp = POPULAR_APPS.find((a) => a.key === flow.appKey);
                setSession({
                  mode: "edit",
                  flowId: flow.id,
                  title: flow.title,
                  app: matchedApp,
                  event: flow.eventName,
                });
              }}
            />
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Popular automations</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_APPS.map((app) => (
            <PopularAutomationCard
              key={app.key}
              app={app}
              status={statusForApp(app.key)}
              onClick={() => handleCardClick(app)}
            />
          ))}
        </div>
        <button
          onClick={() => setSession({ mode: "browse", event: "appointment.created" })}
          className="mt-5 text-sm font-medium text-primary hover:underline"
        >
          Don't see your app? Browse all 2,300+ apps →
        </button>
      </section>

      {session && (
        <EmbedPanel session={session} isAdmin={user?.role === "ADMIN"} onClose={closePanel} onFlow={handleFlow} />
      )}
    </div>
  );
}
