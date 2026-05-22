import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import MetricBar from "../components/MetricBar";
import StatusBadge from "../components/StatusBadge";

export default function DashboardPage() {
    const { t, devices, alerts, loading, deviceMetrics } = useApp();

  const online = devices.filter(d => d.status === "online").length;
  const offline = devices.length - online;
  const activeAlerts = alerts.filter(a => !a.is_resolved && a.severity === "HIGH").length;

  const getLatestMetric = (d) => {
    const live = deviceMetrics[d.id];
    if (live && live.length > 0) {
      return live[live.length - 1];
    }
    if (d.metrics && d.metrics.length > 0) {
      return d.metrics[d.metrics.length - 1];
    }
    return null;
  };

  if (loading && devices.length === 0) {
    return <div style={{ color: "var(--text3)", padding: 40, textAlign: "center" }}>{t("loading")}</div>;
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">{t("totalDevices")}</div>
          <div className="stat-value blue">{devices.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">{t("online")}</div>
          <div className="stat-value green">{online}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">{t("offline")}</div>
          <div className="stat-value red">{offline}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">{t("activeAlerts")}</div>
          <div className="stat-value yellow">{activeAlerts}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t("deviceList")}</span>
            <Link to="/devices" className="btn btn-ghost btn-sm">{t("devices")} →</Link>
          </div>
          {devices.length === 0 ? (
            <div className="empty-state"><p>{t("noData")}</p></div>
          ) : (
            devices.map(d => {
              const lm = getLatestMetric(d);
              return (
                <div className="device-row" key={d.id}>
                  <div className="device-info">
                    <Link to={`/devices/${d.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="device-name">{d.name}</div>
                      <div className="device-ip">{d.ip_address}</div>
                    </Link>
                  </div>
                  <div className="device-metrics">
                    {lm && (
                      <span style={{ fontSize: 11, color: lm.cpu_usage > 85 ? "var(--red)" : "var(--text2)" }}>
                        CPU {parseFloat(lm.cpu_usage).toFixed(0)}%
                      </span>
                    )}
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">{t("quickMetrics")}</span>
            </div>
            {devices.map(d => {
              const lm = getLatestMetric(d);
              return (
                <div key={d.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, fontWeight: 600 }}>{d.name}</div>
                  <MetricBar cpu={lm?.cpu_usage} ram={lm?.ram_usage} disk={lm?.disk_usage} />
                </div>
              );
            })}
            {devices.length === 0 && <div style={{ fontSize: 12, color: "var(--text3)" }}>{t("noData")}</div>}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">{t("alertsTitle")}</span>
              <Link to="/alerts" className="btn btn-ghost btn-sm">→</Link>
            </div>
            {alerts.slice(0, 5).length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text3)" }}>{t("noAlerts")}</div>
            ) : (
              alerts.slice(0, 5).map(a => (
                <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{a.device_name || `Device #${a.device_id}`}</span>
                    <span className={`severity ${a.severity}`}>{a.severity}</span>
                  </div>
                  <div style={{ color: "var(--text3)" }}>{a.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
