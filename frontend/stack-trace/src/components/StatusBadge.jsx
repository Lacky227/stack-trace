import React from "react";
import { useApp } from "../context/AppContext";

export default function StatusBadge({ status }) {
  const { t } = useApp();
  return (
    <span className={`status-badge ${status}`}>
      <span className="dot" />
      {status === "online" ? t("online") : t("offline")}
    </span>
  );
}