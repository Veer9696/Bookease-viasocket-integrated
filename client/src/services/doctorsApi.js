import { apiClient } from "./apiClient";

export const doctorsApi = {
  list: (specialty) => apiClient.get(`/doctors${specialty ? `?specialty=${encodeURIComponent(specialty)}` : ""}`),
  getById: (id) => apiClient.get(`/doctors/${id}`),
  getSlots: (id, date) => apiClient.get(`/doctors/${id}/slots?date=${date.toISOString()}`),
  getMyProfile: () => apiClient.get("/doctors/me/profile"),
  setAvailability: (slots) => apiClient.put("/doctors/me/availability", { slots }),
  addTimeOff: (payload) => apiClient.post("/doctors/me/time-off", payload),
};
