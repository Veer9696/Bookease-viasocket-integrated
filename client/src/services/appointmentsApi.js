import { apiClient } from "./apiClient";

export const appointmentsApi = {
  list: () => apiClient.get("/appointments"),
  getById: (id) => apiClient.get(`/appointments/${id}`),
  create: (payload) => apiClient.post("/appointments", payload),
  updateStatus: (id, payload) => apiClient.patch(`/appointments/${id}/status`, payload),
  reschedule: (id, payload) => apiClient.patch(`/appointments/${id}/reschedule`, payload),
  saveMedicalRecord: (id, formData) => apiClient.upload(`/appointments/${id}/medical-record`, formData),
};
