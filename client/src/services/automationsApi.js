import { apiClient } from "./apiClient";

export const automationsApi = {
  getEmbedToken: () => apiClient.get("/automations/embed-token"),
  listFlows: () => apiClient.get("/automations/flows"),
  reportFlowEvent: (payload) => apiClient.post("/automations/flows", payload),
};
