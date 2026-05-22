import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DevicesPage from "./pages/DevicesPage";
import DeviceDetailsPage from "./pages/DevicesDetailsPage";
import AlertsPage from "./pages/AlertsPage";
import UsersPage from "./pages/UsersPage";
import "./index.css";

function ProtectedRoute({ children, adminOnly }) {
  const { token, isAdmin } = useApp();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { token } = useApp();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/devices" element={<ProtectedRoute><Layout><DevicesPage /></Layout></ProtectedRoute>} />
      <Route path="/devices/:id" element={<ProtectedRoute><Layout><DeviceDetailsPage /></Layout></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Layout><AlertsPage /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><Layout><UsersPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "#141926", color: "#e2e8f0", border: "1px solid #252d3d", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 },
            success: { iconTheme: { primary: "#10b981", secondary: "#141926" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#141926" } },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
}