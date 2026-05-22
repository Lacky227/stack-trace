import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

function UserModal({ onSave, onClose, t }) {
  const [form, setForm] = useState({ username: "", password: "", role: "USER" });
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
        <div className="modal-title">{t("createUser")}</div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">{t("username")}</label>
            <input className="form-input" value={form.username} onChange={set("username")} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t("password")}</label>
            <input className="form-input" type="password" value={form.password} onChange={set("password")} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t("role")}</label>
            <select className="form-select" value={form.role} onChange={set("role")}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "..." : t("addUser")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { t, users, addUser, deleteUser, fetchUsers, currentUser, loading } = useApp();
  const [modal, setModal] = useState(false);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSave = async (form) => {
    try {
      await addUser(form);
      toast.success(t("userCreated"));
      setModal(false);
    } catch (e) {
      toast.error(e.message || t("error"));
    }
  };

  const handleDelete = async (u) => {
    if (u.username === currentUser?.username) return toast.error("Cannot delete yourself");
    if (!window.confirm(t("confirmDeleteUser"))) return;
    try {
      await deleteUser(u.id);
      toast.success(t("userDeleted"));
    } catch (e) {
      toast.error(e.message || t("error"));
    }
  };

  const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ {t("createUser")}</button>
      </div>
      <div className="card">
        {loading && users.length === 0 ? (
          <div className="empty-state"><p>{t("loading")}</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("username")}</th>
                  <th>{t("role")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{u.id}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--purple))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.username}</span>
                        {u.username === currentUser?.username && (
                          <span style={{ fontSize: 10, color: "var(--text3)", background: "var(--border)", padding: "1px 6px", borderRadius: 4 }}>you</span>
                        )}
                      </div>
                    </td>
                    <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                    <td>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(u)} title={t("delete")}>
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4}><div className="empty-state"><p>{t("noData")}</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && <UserModal onSave={handleSave} onClose={() => setModal(false)} t={t} />}
    </div>
  );
}
