import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, t, lang, toggleLang } = useApp();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(username, password);
      toast.success("Welcome!");
    } catch (err) {
      setError(err.message || t("loginError"));
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-grid" />
      <div className="login-card">
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <button className="lang-btn" onClick={toggleLang}>{lang === "en" ? "UA" : "EN"}</button>
        </div>
        <div className="login-logo">
          <div className="logo-mark">Stack<span>Trace</span></div>
          <div className="logo-sub">{t("monitoringPlatform")}</div>
        </div>
        <div className="login-title">{t("welcomeBack")}</div>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t("username")}</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="form-group">
            <label className="form-label">{t("password")}</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 8, justifyContent: "center", padding: "11px" }} disabled={loading}>
            {loading ? "..." : t("signIn")}
          </button>
        </form>
        <div style={{ marginTop: 20, padding: "12px", background: "rgba(59,130,246,0.06)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.15)", fontSize: 11, color: "var(--text3)", lineHeight: 1.7 }}>
          <div>admin / 123456 → ADMIN</div>
          <div>viewer / 123456 → USER</div>
        </div>
      </div>
    </div>
  );
}
