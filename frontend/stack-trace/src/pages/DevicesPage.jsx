import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const DEVICE_TYPES = ["Server", "Workstation", "Router", "Database", "Other"];

function DeviceModal({ device, onSave, onClose, t }) {
  const [form, setForm] = useState({
    name:       device?.name       || "",
    ip_address: device?.ip_address || "",
    type:       device?.type       || "Server",
    location:   device?.location   || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{device ? t("editDevice") : t("addNewDevice")}</div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">{t("deviceName")}</label>
            <input className="form-input" value={form.name} onChange={set("name")} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t("ipAddress")}</label>
            <input className="form-input" value={form.ip_address} onChange={set("ip_address")} placeholder="192.168.0.1" />
          </div>
          <div className="form-group">
            <label className="form-label">{t("type")}</label>
            <select className="form-select" value={form.type} onChange={set("type")}>
              {DEVICE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t("location")}</label>
            <input className="form-input" value={form.location} onChange={set("location")} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "..." : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const { t, devices, addDevice, updateDevice, deleteDevice, fetchDevices, isAdmin, loading } = useApp();
  const [modal, setModal] = useState(null); 

  const [searchInput, setSearchInput] = useState("");  
  const [filters, setFilters] = useState({ search: "", status: "", device_type: "" });

  const debounceRef = useRef(null);
  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: val }));
    }, 350);
  };

  const handleStatusChange = (e) => setFilters(prev => ({ ...prev, status: e.target.value }));
  const handleTypeChange   = (e) => setFilters(prev => ({ ...prev, device_type: e.target.value }));

  const hasActiveFilters = filters.search || filters.status || filters.device_type;

  const clearFilters = () => {
    setSearchInput("");
    clearTimeout(debounceRef.current);
    setFilters({ search: "", status: "", device_type: "" });
  };

  const doFetch = useCallback(() => {
    const params = {};
    if (filters.search)      params.search      = filters.search;
    if (filters.status)      params.status      = filters.status;
    if (filters.device_type) params.device_type = filters.device_type;
    fetchDevices(params);
  }, [filters, fetchDevices]);

  useEffect(() => { doFetch(); }, [doFetch]);

  const handleSave = async (form) => {
    try {
      if (modal === "add") {
        await addDevice(form);
        toast.success(t("deviceAdded"));
      } else {
        await updateDevice(modal.id, form);
        toast.success(t("deviceUpdated"));
      }
      setModal(null);
      doFetch(); 
    } catch (e) {
      toast.error(e.message || t("error"));
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await deleteDevice(d.id);
      toast.success(t("deviceDeleted"));
    } catch (e) {
      toast.error(e.message || t("error"));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160, maxWidth: 320 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none", display: "flex" }}>
            <SearchIcon />
          </span>
          <input
            className="form-input"
            style={{ paddingLeft: 32, paddingRight: searchInput ? 30 : 12 }}
            placeholder={`${t("deviceName")} / IP…`}
            value={searchInput}
            onChange={handleSearchInput}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); clearTimeout(debounceRef.current); setFilters(p => ({ ...p, search: "" })); }}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer", display: "flex", padding: 2 }}
            >
              <XIcon />
            </button>
          )}
        </div>

        <select className="form-select" style={{ width: "auto", flex: "0 0 auto" }} value={filters.status} onChange={handleStatusChange}>
          <option value="">{t("status")}: All</option>
          <option value="online">{t("online")}</option>
          <option value="offline">{t("offline")}</option>
        </select>

        <select className="form-select" style={{ width: "auto", flex: "0 0 auto" }} value={filters.device_type} onChange={handleTypeChange}>
          <option value="">{t("type")}: All</option>
          {DEVICE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>

        {hasActiveFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <XIcon /> Clear
          </button>
        )}

        <div style={{ flex: 1 }} />

        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal("add")}>
            + {t("addDevice")}
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {filters.search && <span style={{ fontSize: 11, padding: "3px 8px", background: "rgba(59,130,246,0.12)", color: "var(--accent2)", borderRadius: 20, border: "1px solid rgba(59,130,246,0.25)" }}>search: "{filters.search}"</span>}
          {filters.status && <span style={{ fontSize: 11, padding: "3px 8px", background: filters.status === "online" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: filters.status === "online" ? "var(--green)" : "var(--red)", borderRadius: 20, border: `1px solid ${filters.status === "online" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>status: {filters.status}</span>}
          {filters.device_type && <span style={{ fontSize: 11, padding: "3px 8px", background: "rgba(139,92,246,0.12)", color: "#a78bfa", borderRadius: 20, border: "1px solid rgba(139,92,246,0.25)" }}>type: {filters.device_type}</span>}
        </div>
      )}

      <div className="card">
        {loading && devices.length === 0 ? (
          <div className="empty-state"><p>{t("loading")}</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t("deviceName")}</th>
                  <th>{t("ipAddress")}</th>
                  <th>{t("type")}</th>
                  <th>{t("location")}</th>
                  <th>{t("status")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id}>
                    <td>
                      <Link to={`/devices/${d.id}`} style={{ color: "var(--accent2)", textDecoration: "none", fontWeight: 600 }}>
                        {d.name}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{d.ip_address}</td>
                    <td style={{ color: "var(--text2)", textTransform: "capitalize" }}>{d.type}</td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{d.location || "—"}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {isAdmin && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(d)} title={t("edit")}><EditIcon /></button>}
                        {isAdmin && <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(d)} title={t("delete")}><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {devices.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <p>{hasActiveFilters ? "No devices match the current filters" : t("noData")}</p>
                        {hasActiveFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ marginTop: 10 }}>Clear filters</button>}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
          </div>
          {modal && (
        <DeviceModal 
          device={modal === "add" ? null : modal} 
          onSave={handleSave} 
          onClose={() => setModal(null)} 
          t={t} 
        />
      )}
    </div>
  );
}