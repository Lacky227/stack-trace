const BASE = "http://localhost:8080";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("st_token");
}

async function request(method, path, body, isPublic = false) {
  const headers = { "Content-Type": "application/json" };
  if (!isPublic) {
    const tok = getToken();
    if (tok) headers["Authorization"] = `Bearer ${tok}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail || err.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

const get  = (path)        => request("GET",    path);
const post = (path, body, pub) => request("POST", path, body, pub);
const put  = (path, body)  => request("PUT",    path, body);
const del  = (path)        => request("DELETE", path);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const apiLogin = (username, password) =>
  post("/auth/login", { username, password }, true);

// ─── Users ────────────────────────────────────────────────────────────────────
export const apiGetUsers  = ()           => get("/users");
export const apiAddUser   = (data)       => post("/users", data);
// NOTE: backend spec has no DELETE /users, so we skip it or handle 404 gracefully
export const apiDeleteUser = (id)        => del(`/users/${id}`);

// ─── Devices ──────────────────────────────────────────────────────────────────
export const apiGetDevices = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.search)      qs.set("search",      params.search);
  if (params.status)      qs.set("status",       params.status);
  if (params.device_type) qs.set("device_type",  params.device_type);
  const query = qs.toString();
  return get(`/devices${query ? `?${query}` : ""}`);
};
export const apiGetDevice     = (id)       => get(`/devices/${id}`);
export const apiAddDevice     = (data)     => post("/devices", data);
export const apiUpdateDevice  = (id, data) => put(`/devices/${id}`, data);
export const apiDeleteDevice  = (id)       => del(`/devices/${id}`);

// ─── Metrics ──────────────────────────────────────────────────────────────────
export const apiGetMetrics  = (deviceId) => get(`/devices/${deviceId}/metrics`);
export const apiPostMetric  = (data)     => post("/metrics", data, true); // public

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const apiGetAlerts = () => get("/alerts");
