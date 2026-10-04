import { apiClient } from "./apiClient";

export const notificationsApi = {
  list: (unreadOnly = false) => apiClient.get(`/notifications${unreadOnly ? "?unreadOnly=true" : ""}`),
  markRead: (id) => apiClient.post(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post("/notifications/read-all"),
};
