import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { useApp } from "../context/AppContext";
import StatusBadge from "../components/StatusBadge";
import MetricBar from "../components/MetricBar";
import { format } from "date-fns";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
  plugins: {
    legend: { labels: { color: "#8899b4", font: { family: "'JetBrains Mono', monospace", size: 11 } } },
    tooltip: { backgroundColor: "#141926", borderColor: "#252d3d", borderWidth: 1, titleColor: "#e2e8f0", bodyColor: "#8899b4" },
  },
  scales: {
    x: { ticks: { color: "#4a5568", font: { size: 10, family: "'JetBrains Mono', monospace" }, maxTicksLimit: 8 }, grid: { color: "rgba(30,37,51,0.8)" } },
    y: { min: 0, max: 100, ticks: { color: "#4a5568", font: { size: 10, family: "'JetBrains Mono', monospace" }, callback: (v) => `${v}%` }, grid: { color: "rgba(30,37,51,0.8)" } },
  },
};

function fmt(ts) { try { return format(new Date(ts), "HH:mm:ss"); } catch { return "—"; } }
function fmtFull(ts) { try { return format(new Date(ts), "dd.MM HH:mm:ss"); } catch { return "—"; } }

export default function DeviceDetailsPage() {
  const { id } = useParams();
  const { t, getDevice } = useApp();
  const [device, setDevice] = useState(null);
  const [loadingDevice, setLoadingDevice] = useState(true);

  const load = async () => {
    const d = await getDevice(id);
    setDevice(d);
    setLoadingDevice(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [id]);

  if (loadingDevice) return <div style={{ color: "var(--text3)", padding: 40 }}>{t("loading")}</div>;
  if (!device) return <div style={{ color: "var(--red)", padding: 40 }}>{t("error")}: device not found</div>;

  const metrics = device.metrics || [];
  const last30 = metrics.slice(-30);
  const labels = last30.map(m => fmt(m.timestamp));
  const latest = last30[last30.length - 1];
  const deviceAlerts = (device.alerts || []).slice(0, 15);

  const chartData = {
    labels,
    datasets: [
      {
        label: t("cpuUsage"),
        data: last30.map(m => parseFloat(m.cpu_usage)),
        borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
      },
      {
        label: t("ramUsage"),
        data: last30.map(m => parseFloat(m.ram_usage)),
        borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.08)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
      },
    ],
  };

  return (
    <div>
      <div className="breadcrumb" style={{ marginBottom: 20 }}>
        <Link to="/devices">{t("devices")}</Link>
        <span style={{ color: "var(--text3)" }}>›</span>
        <span>{device.name}</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{device.name}</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <StatusBadge status={device.status} />
              <span style={{ fontSize: 12, color: "var(--text3)" }}>{device.ip_address}</span>
              <span style={{ fontSize: 12, color: "var(--text3)", textTransform: "capitalize" }}>{device.type}</span>
              {device.location && <span style={{ fontSize: 12, color: "var(--text3)" }}>📍 {device.location}</span>}
              {device.last_seen && (
                <span style={{ fontSize: 11, color: "var(--text3)" }}>{t("lastSeen")}: {fmtFull(device.last_seen)}</span>
              )}
            </div>
          </div>
          {latest && <MetricBar cpu={latest.cpu_usage} ram={latest.ram_usage} disk={latest.disk_usage} />}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">{t("cpuUsage")} / {t("ramUsage")}</span>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>{metrics.length} pts</span>
        </div>
        <div className="chart-container">
          {last30.length > 1 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="empty-state"><p>{t("noMetrics")}</p></div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t("metricsHistory")}</span>
          </div>
          <div className="table-wrapper" style={{ maxHeight: 300, overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("timestamp")}</th>
                  <th>{t("cpu")}</th>
                  <th>{t("ram")}</th>
                  <th>{t("disk")}</th>
                </tr>
              </thead>
              <tbody>
                {[...last30].reverse().map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 11, color: "var(--text3)" }}>{fmt(m.timestamp)}</td>
                    <td style={{ color: m.cpu_usage > 85 ? "var(--red)" : "var(--text2)" }}>{parseFloat(m.cpu_usage).toFixed(1)}%</td>
                    <td style={{ color: "var(--text2)" }}>{parseFloat(m.ram_usage).toFixed(1)}%</td>
                    <td style={{ color: "var(--text2)" }}>{parseFloat(m.disk_usage).toFixed(1)}%</td>
                  </tr>
                ))}
                {last30.length === 0 && (
                  <tr><td colSpan={4}><div className="empty-state"><p>{t("noMetrics")}</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">{t("alertsTitle")}</span>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>{deviceAlerts.length}</span>
          </div>
          {deviceAlerts.length === 0 ? (
            <div className="empty-state"><p>{t("noAlerts")}</p></div>
          ) : (
            deviceAlerts.map(a => (
              <div key={a.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span className={`severity ${a.severity}`}>{a.severity}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{fmtFull(a.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{a.message}</div>
                {a.is_resolved && <div style={{ fontSize: 11, color: "var(--green)", marginTop: 2 }}>✓ resolved</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
