import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { format } from "date-fns";

function fmt(ts) { try { return format(new Date(ts), "dd.MM HH:mm:ss"); } catch { return "—"; } }

export default function AlertsPage() {
  const { t, alerts } = useApp();

  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sorted = [...alerts].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {["HIGH", "MEDIUM", "LOW"].map((sev, i) => {
          const count = alerts.filter(a => a.severity === sev).length;
          const colors = ["red", "yellow", "blue"];
          return (
            <div className={`stat-card ${colors[i]}`} key={sev}>
              <div className="stat-label">{sev}</div>
              <div className={`stat-value ${colors[i]}`}>{count}</div>
            </div>
          );
        })}
        <div className="stat-card green">
          <div className="stat-label">Resolved</div>
          <div className="stat-value green">{alerts.filter(a => a.is_resolved).length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">{t("alertsTitle")}</span>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{alerts.length} total</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t("severity")}</th>
                <th>{t("device")}</th>
                <th>{t("message")}</th>
                <th>Resolved</th>
                <th>{t("timestamp")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => (
                <tr key={a.id}>
                  <td><span className={`severity ${a.severity}`}>{a.severity}</span></td>
                  <td>
                    {a.device_id ? (
                      <Link to={`/devices/${a.device_id}`} style={{ color: "var(--accent2)", textDecoration: "none", fontWeight: 600 }}>
                        {a.device_name || `Device #${a.device_id}`}
                      </Link>
                    ) : (
                      <span style={{ color: "var(--text3)" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text2)" }}>{a.message}</td>
                  <td>
                    {a.is_resolved
                      ? <span style={{ color: "var(--green)", fontSize: 12 }}>✓ yes</span>
                      : <span style={{ color: "var(--text3)", fontSize: 12 }}>no</span>}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap" }}>{fmt(a.created_at)}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr><td colSpan={5}><div className="empty-state"><p>{t("noAlerts")}</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
