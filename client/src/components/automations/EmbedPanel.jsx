import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useViaSocketEmbed } from "./useViaSocketEmbed";
import { TRIGGER_EVENTS } from "./automationCatalog";
import { automationsApi } from "../../services/automationsApi";
import Spinner from "../common/Spinner";
import ErrorBanner from "../common/ErrorBanner";
import { inputClass } from "../common/FormField";

// session: { mode: "app", app, event } | { mode: "browse", event } | { mode: "edit", flowId, title }
export default function EmbedPanel({ session, isAdmin, onClose, onFlow }) {
  const { ready, error, mount } = useViaSocketEmbed();
  const [event, setEvent] = useState(session.event || "appointment.created");
  const isEdit = session.mode === "edit";

  // The sample comes from the server's real payload builder, so every field
  // the user maps in the builder exists when the event actually fires.
  const sample = useQuery({
    queryKey: ["automation-sample", event],
    queryFn: () => automationsApi.samplePayload(event),
    staleTime: Infinity,
  });
  const samplePayload = sample.data;
  const boxRef = useRef(null);
  const onFlowRef = useRef(onFlow);
  onFlowRef.current = onFlow;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!ready || !boxRef.current || !samplePayload) return undefined;

    const open = isEdit
      ? {
          flowId: session.flowId,
          dummy_payload: samplePayload,
        }
      : {
          dummy_payload: samplePayload,
          // Echoed back as flow.metadata so BookEase knows which event runs
          // this flow and which popular app it was created from.
          meta: JSON.stringify({ event, app: session.app?.key || null }),
          ...(session.mode === "app" ? { serviceId: session.app.serviceId } : {}),
        };

    const embed = mount(boxRef.current, { open, onFlow: (flow) => onFlowRef.current?.(flow) });
    return () => embed?.destroy?.();
  }, [ready, event, session, mount, isEdit, samplePayload]);

  const events = TRIGGER_EVENTS.filter((e) => isAdmin || !e.adminOnly);
  const heading =
    session.mode === "app" ? `Set up ${session.app.name}` : session.mode === "edit" ? `Edit: ${session.title || "automation"}` : "Browse all apps";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-2 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="flex h-full max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-card bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <div className="flex items-center gap-3">
            {session.app && <img src={session.app.icon} alt="" className="h-8 w-8 rounded-lg object-contain" />}
            <h2 className="text-lg font-semibold text-gray-900">{heading}</h2>
          </div>
          <div className="flex items-center gap-3">
            {session.mode !== "edit" && (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span className="whitespace-nowrap">Starts when</span>
                <select className={`${inputClass} py-1.5`} value={event} onChange={(e) => setEvent(e.target.value)}>
                  {events.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </label>
            )}
            <button onClick={onClose} aria-label="Close" className="rounded-full px-2 text-2xl leading-none text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
        </header>

        <div className="relative flex-1">
          {(!ready || !samplePayload) && !error && !sample.error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner label="Loading automation builder..." />
            </div>
          )}
          {(error || sample.error) && (
            <div className="p-6">
              <ErrorBanner message={error || sample.error.message} />
            </div>
          )}
          <div ref={boxRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
