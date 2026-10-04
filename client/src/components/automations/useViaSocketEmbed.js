import { useEffect, useRef, useState } from "react";
import { automationsApi } from "../../services/automationsApi";

const SCRIPT_SRC = "https://embed.viasocket.com/prod-embedcomponent.js";

function loadScriptOnce() {
  if (window.viaSocket) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", resolve));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Loads the viaSocket embed script, fetches a fresh embed token for the
// signed-in doctor/admin, and exposes a `mount(parentSelector, options)`
// helper that also persists any flow the user builds/updates via the
// `/api/automations/flows` endpoint (replacing the old flows.json writer).
export function useViaSocketEmbed() {
  const [ready, setReady] = useState(false);
  const tokenRef = useRef(null);
  const currentEmbedRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadScriptOnce();
      const token = await automationsApi.getEmbedToken();
      if (!cancelled) {
        tokenRef.current = token;
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function mount(parentSelector, { config, open } = {}) {
    if (!ready || !window.viaSocket) return null;

    document.querySelector(parentSelector).innerHTML = "";
    const embed = window.viaSocket.mount({
      embedToken: tokenRef.current,
      parent: parentSelector,
      config: {
        pageheading: "BookEase Automation",
        pagesubheading: "Connect other apps to BookEase seamlessly",
        showTemplates: true,
        serviceId: "webhook",
        serviceType: "trigger",
        themeJson: { "--primary-color": "#1a56db" },
        ...config,
      },
      open,
    });

    embed.on("flow", async (flow) => {
      if (!flow?.id) return;
      await automationsApi.reportFlowEvent({
        action: flow.action,
        id: flow.id,
        title: flow.title,
        webhookurl: flow.webhookurl,
        payload: flow.payload,
        eventName: flow.metadata,
      });
    });

    currentEmbedRef.current = embed;
    return embed;
  }

  return { ready, mount };
}
