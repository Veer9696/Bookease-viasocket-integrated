import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../services/notificationsApi";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);
const POLL_INTERVAL_MS = 30_000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabVisible, setTabVisible] = useState(document.visibilityState === "visible");

  useEffect(() => {
    function onVisibilityChange() {
      const visible = document.visibilityState === "visible";
      setTabVisible(visible);
      if (visible) queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [queryClient]);

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    enabled: !!user,
    refetchInterval: tabVisible ? POLL_INTERVAL_MS : false,
  });

  const notifications = query.data || [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isLoading: query.isLoading, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
