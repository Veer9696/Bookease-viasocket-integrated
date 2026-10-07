import { apiClient } from "./apiClient";

export const doctorsApi = {
  list: (params) => {
    if (typeof params === "string") {
      return apiClient.get(`/doctors${params ? `?specialty=${encodeURIComponent(params)}` : ""}`);
    }
    const query = new URLSearchParams();
    if (params?.specialty) query.set("specialty", params.specialty);
    if (params?.minFee !== undefined && params?.minFee !== "") query.set("minFee", params.minFee);
    if (params?.maxFee !== undefined && params?.maxFee !== "") query.set("maxFee", params.maxFee);
    if (params?.gender) query.set("gender", params.gender);
    if (params?.availableToday) query.set("availableToday", "true");
    const qs = query.toString();
    return apiClient.get(`/doctors${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => apiClient.get(`/doctors/${id}`),
  getSlots: (id, date) => apiClient.get(`/doctors/${id}/slots?date=${date.toISOString()}`),
  getMyProfile: () => apiClient.get("/doctors/me/profile"),
  setAvailability: (slots) => apiClient.put("/doctors/me/availability", { slots }),
  updateSettings: (payload) => apiClient.patch("/doctors/me/settings", payload),
  updateProfile: (payload) => apiClient.patch("/doctors/me/profile", payload),
  addLeave: (payload) => apiClient.post("/doctors/me/leave", payload),
  removeLeave: (id) => apiClient.delete(`/doctors/me/leave/${id}`),
};
