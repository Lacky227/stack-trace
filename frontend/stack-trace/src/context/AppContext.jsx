import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { translations } from "../i18n/translations";
import {
  apiLogin,
  apiGetUsers, apiAddUser, apiDeleteUser,
  apiGetDevices, apiGetDevice, apiAddDevice, apiUpdateDevice, apiDeleteDevice,
  apiGetAlerts,
} from "../utils/api";

const AppContext = createContext(null);

const WS_URL = "ws://localhost:8080/ws";
// Max metric history points kept per device in memory
const MAX_METRICS = 60;

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

export function AppProvider({ children }) {
  const [lang, setLang]               = useState(localStorage.getItem("st_lang") || "en");
  const [token, setToken]             = useState(localStorage.getItem("st_token") || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("st_user")); } catch { return null; }
  });

  const [devices, setDevices]   = useState([]);
  const [alerts,  setAlerts]    = useState([]);
  const [users,   setUsers]     = useState([]);
  // deviceMetrics: { [device_id]: metric[] } — live chart data fed by WS
  const [deviceMetrics, setDeviceMetrics] = useState({});
  const [wsStatus, setWsStatus] = useState("disconnected"); // connected | disconnected | error
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const wsRef = useRef(null);

  const t = (key) => translations[lang][key] || key;
  const toggleLang = () => {
    const next = lang === "en" ? "uk" : "en";
    setLang(next);
    localStorage.setItem("st_lang", next);
  };

  // ── Auth ────────────────────────────────────────────────────────────────────
  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    const { access_token } = data;
    const payload = parseJwt(access_token);
    const role = payload?.role || (payload?.sub === "admin" ? "ADMIN" : "USER");
    const user = { username: payload?.sub || payload?.username || username, role };
    setToken(access_token);
    setCurrentUser(user);
    localStorage.setItem("st_token", access_token);
    localStorage.setItem("st_user", JSON.stringify(user));
    return data;
  };

  const logout = () => {
    // Close WS before clearing state
    wsRef.current?.close();
    wsRef.current = null;
    setToken(null); setCurrentUser(null);
    setDevices([]); setAlerts([]); setUsers([]); setDeviceMetrics({});
    setWsStatus("disconnected");
    localStorage.removeItem("st_token");
    localStorage.removeItem("st_user");
  };

  const isAdmin = currentUser?.role === "ADMIN";

  // ── HTTP fetchers (initial load only) ───────────────────────────────────────
  const fetchDevices = useCallback(async (params = {}) => {
    try { const d = await apiGetDevices(params); setDevices(d); return d; }
    catch (e) { setError(e.message); return []; }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try { const d = await apiGetAlerts(); setAlerts(d); return d; }
    catch (e) { setError(e.message); return []; }
  }, []);

  const fetchUsers = useCallback(async () => {
    try { const d = await apiGetUsers(); setUsers(d); return d; }
    catch (e) { setError(e.message); return []; }
  }, []);

  // ── Initial HTTP load when token is present ──────────────────────────────────
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchDevices(), fetchAlerts()]).finally(() => setLoading(false));
  }, [token]); // eslint-disable-line

  // ── WebSocket: connect once after login, reconnect on drop ──────────────────
  useEffect(() => {
    if (!token) return;

    let ws;
    let reconnectTimer;
    let alive = true; // guard to stop reconnect after logout

    const connect = () => {
      if (!alive) return;
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        setWsStatus("connecting");

        ws.onopen = () => {
          if (!alive) { ws.close(); return; }
          setWsStatus("connected");
        };

        ws.onmessage = (evt) => {
          let msg;
          try { msg = JSON.parse(evt.data); } catch { return; }

          if (msg.event === "NEW_METRIC") {
            const { device_id, cpu_usage, ram_usage, disk_usage, timestamp } = msg.data;

            // 1. Append metric point to chart buffer
            setDeviceMetrics(prev => {
              const existing = prev[device_id] || [];
              const updated = [...existing, { cpu_usage, ram_usage, disk_usage, timestamp }];
              return { ...prev, [device_id]: updated.slice(-MAX_METRICS) };
            });

            // 2. Mark device as online + update last_seen
            setDevices(prev => prev.map(d =>
              d.id === device_id
                ? { ...d, status: "online", last_seen: timestamp }
                : d
            ));
          }

          if (msg.event === "NEW_ALERT") {
            // Prepend to alerts list, deduplicate by id
            setAlerts(prev => {
              if (prev.some(a => a.id === msg.data.id)) return prev;
              return [msg.data, ...prev];
            });
          }
        };

        ws.onerror = () => setWsStatus("error");

        ws.onclose = () => {
          setWsStatus("disconnected");
          if (alive) {
            // Auto-reconnect after 3 s
            reconnectTimer = setTimeout(connect, 3000);
          }
        };
      } catch {
        setWsStatus("error");
        if (alive) reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      alive = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [token]);

  // ── Devices CRUD ─────────────────────────────────────────────────────────────
  const getDevices  = useCallback(() => devices, [devices]);

  const getDevice   = useCallback(async (id) => {
    try { return await apiGetDevice(id); }
    catch (e) { setError(e.message); return null; }
  }, []);

  const addDevice = async (data) => {
    const d = await apiAddDevice(data);
    await fetchDevices();
    return d;
  };

  const updateDevice = async (id, data) => {
    const d = await apiUpdateDevice(id, data);
    await fetchDevices();
    return d;
  };

  const deleteDevice = async (id) => {
    await apiDeleteDevice(id);
    setDevices(prev => prev.filter(d => d.id !== parseInt(id)));
    setDeviceMetrics(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  // ── Alerts ───────────────────────────────────────────────────────────────────
  const getAlerts = useCallback(() => alerts, [alerts]);

  // ── Users CRUD ───────────────────────────────────────────────────────────────
  const getUsers   = useCallback(() => users, [users]);
  const addUser    = async (data) => { const u = await apiAddUser(data); await fetchUsers(); return u; };
  const deleteUser = async (id) => {
    await apiDeleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== parseInt(id)));
  };

  return (
    <AppContext.Provider value={{
      lang, t, toggleLang,
      token, currentUser, isAdmin, login, logout,
      loading, error,
      wsStatus,
      devices, deviceMetrics,
      getDevices, getDevice, addDevice, updateDevice, deleteDevice, fetchDevices,
      alerts, getAlerts, fetchAlerts,
      users, getUsers, addUser, deleteUser, fetchUsers,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);