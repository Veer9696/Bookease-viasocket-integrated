import { useCallback, useEffect, useRef, useState } from "react";
import { automationsApi } from "../../services/automationsApi";

const SCRIPT_SRC = "https://embed.viasocket.com/prod-embedcomponent.js";

const BASE_CONFIG = {
  pageheading: "Automation",
  pagesubheading: "Connect BookEase to the apps your clinic already uses",
  // Our own page lists the user's automations, so the embed always opens on
  // the catalog (or the app/flow we pass) rather than its own list.
  showEnabled: false,
  themeJson: { "--primary-color": "#1a56db" },
};

let scriptPromise;
function loadScriptOnce() {
  if (window.viaSocket) return Promise.resolve();
  scriptPromise ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = resolve;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the automation builder. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

// Loads the embed script and a fresh per-user embed token (signed on our
// server — the secret never reaches the browser), then exposes mount().
export function useViaSocketEmbed() {
  const [state, setState] = useState({ ready: false, error: null });
  const tokenRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadScriptOnce(), automationsApi.getEmbedToken()])
      .then(([, token]) => {
        if (cancelled) return;
        tokenRef.current = token;
        setState({ ready: true, error: null });
      })
      .catch((err) => !cancelled && setState({ ready: false, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  // Every mount reports flow events back to BookEase, then calls onFlow so the
  // page can refresh its own list. Returns the embed so the caller can destroy it.
  // Stable identity: callers mount inside an effect, and a new function per
  // render would tear down and remount the embed on every parent re-render.
  const mount = useCallback((parent, { config, open, onFlow } = {}) => {
    if (!tokenRef.current || !window.viaSocket) return null;

    const embed = window.viaSocket.mount({
      embedToken: tokenRef.current,
      parent,
      config: { ...BASE_CONFIG, ...config },
      open,
    });

    embed.on("flow", async (flow) => {
      if (!flow?.id) return;
      try {
        await automationsApi.reportFlowEvent({
          action: flow.action,
          id: flow.id,
          title: flow.title,
          description: flow.description,
          webhookurl: flow.webhookurl,
          payload: flow.payload,
          metadata: flow.metadata,
          serviceIcons: flow.serviceIcons,
        });
      } finally {
        onFlow?.(flow);
      }
    });

    return embed;
  }, []);

  return { ...state, mount };
}
