import { apiClient } from "./apiClient";

export const analyticsApi = {
  summary: (range) => apiClient.get(`/analytics/summary?range=${range}`),
};
