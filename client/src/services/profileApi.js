import { apiClient } from "./apiClient";

export const profileApi = {
  getProfile: () => apiClient.get("/profile/me"),
  updateProfile: (payload) => apiClient.patch("/profile/me", payload),
  getAddresses: () => apiClient.get("/profile/addresses"),
  createAddress: (payload) => apiClient.post("/profile/addresses", payload),
  updateAddress: (id, payload) => apiClient.patch(`/profile/addresses/${id}`, payload),
  deleteAddress: (id) => apiClient.delete(`/profile/addresses/${id}`),
  setDefaultAddress: (id) => apiClient.patch(`/profile/addresses/${id}/default`),
};
