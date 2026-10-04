import { apiClient } from "./apiClient";

export const labApi = {
  listTests: () => apiClient.get("/lab-bookings/tests"),
  list: () => apiClient.get("/lab-bookings"),
  getById: (id) => apiClient.get(`/lab-bookings/${id}`),
  create: (payload) => apiClient.post("/lab-bookings", payload),
  updateStatus: (id, payload) => apiClient.patch(`/lab-bookings/${id}/status`, payload),
};
