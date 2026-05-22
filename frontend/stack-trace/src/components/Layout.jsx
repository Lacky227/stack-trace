import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  devices: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  alerts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

function PageTitle() {
  const { t } = useApp();
  const location = useLocation();
  const map = { "/": t("dashboard"), "/devices": t("devices"), "/alerts": t("alertsTitle"), "/users": t("usersTitle") };
  const path = location.pathname;
  if (path.startsWith("/devices/")) return t("details");
  return map[path] || "";
}

export default function Layout({ children }) {
  const { t, currentUser, isAdmin, logout, lang, toggleLang, alerts } = useApp();
  const unresolvedAlerts = alerts.filter(a => a.severity === "HIGH").length;

  const handleLogout = () => { logout(); toast("Logged out"); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">Stack<span>Trace</span></div>
          <div className="logo-sub">Monitoring</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive}) => `nav-item${isActive ? " active" : ""}`}>
            <span className="nav-icon">{icons.dashboard}</span>{t("dashboard")}
          </NavLink>
          <NavLink to="/devices" className={({isActive}) => `nav-item${isActive ? " active" : ""}`}>
            <span className="nav-icon">{icons.devices}</span>{t("devices")}
          </NavLink>
          <NavLink to="/alerts" className={({isActive}) => `nav-item${isActive ? " active" : ""}`}>
            <span className="nav-icon">{icons.alerts}</span>{t("alerts")}
            {unresolvedAlerts > 0 && (
              <span style={{ marginLeft: "auto", background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, minWidth: 18, textAlign: "center" }}>
                {unresolvedAlerts > 99 ? "99+" : unresolvedAlerts}
              </span>
            )}
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={({isActive}) => `nav-item${isActive ? " active" : ""}`}>
              <span className="nav-icon">{icons.users}</span>{t("users")}
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip" style={{ marginBottom: 10, padding: "6px 4px" }}>
            <div className="avatar">{currentUser?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)" }}>{currentUser?.username}</div>
              <span className={`role-tag ${currentUser?.role}`}>{currentUser?.role}</span>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: "var(--red)", marginBottom: 6 }}>
            <span className="nav-icon">{icons.logout}</span>{t("logout")}
          </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="page-title"><PageTitle /></span>
            <span className="sim-badge">
              <span className="sim-dot" />
              {t("simulation")}
            </span>
          </div>
          <div className="top-bar-right">
            <button className="lang-btn" onClick={toggleLang}>{lang === "en" ? "UA" : "EN"}</button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}