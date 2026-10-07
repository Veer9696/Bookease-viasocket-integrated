class ApiClientError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, formData, headers = {} } = {}) {
  const isMutating = method !== "GET";

  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: {
      // FormData sets its own multipart Content-Type (with boundary).
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(isMutating ? { "X-Requested-With": "fetch" } : {}),
      ...headers,
    },
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    let message = (isJson && data?.error) || "Something went wrong";
    if (isJson && data?.details && typeof data.details === "object") {
      const fieldErrors = Object.values(data.details).flat().filter(Boolean);
      if (fieldErrors.length > 0) {
        message = fieldErrors.join(". ");
      }
    }
    throw new ApiClientError(message, res.status, isJson ? data?.details : undefined);
  }

  return data;
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", formData }),
};

export { ApiClientError };
