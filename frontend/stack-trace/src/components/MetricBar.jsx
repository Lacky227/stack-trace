import React from "react";
import { useApp } from "../context/AppContext";

export default function MetricBar({ cpu, ram, disk }) {
  const { t } = useApp();
  const bars = [
    { key: "cpu", label: t("cpu"), value: cpu, cls: "cpu" },
    { key: "ram", label: t("ram"), value: ram, cls: "ram" },
    { key: "disk", label: t("disk"), value: disk, cls: "disk" },
  ];
  return (
    <div className="metric-bar-wrap">
      {bars.map(b => (
        <div className="metric-bar-row" key={b.key}>
          <span className="metric-bar-label">{b.label}</span>
          <div className="metric-bar-track">
            <div
              className={`metric-bar-fill ${b.cls}${b.value > 85 ? " danger" : ""}`}
              style={{ width: `${Math.min(b.value || 0, 100)}%` }}
            />
          </div>
          <span className="metric-bar-val">{b.value != null ? `${b.value.toFixed(0)}%` : "—"}</span>
        </div>
      ))}
    </div>
  );
}