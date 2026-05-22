# StackTrace — Infrastructure Monitoring Platform

React frontend that connects to a real FastAPI backend.

## Quick Start

### Requirements
- Node.js 16+ (https://nodejs.org)
- Backend running at `http://stack-trance-backend:8080`

### Installation & Run

```bash
npm install
npm start
```

Opens at **http://localhost:3000**

### Login credentials (as defined in your backend)
| Username | Password | Role  |
|----------|----------|-------|
| admin    | 123456   | ADMIN |
| viewer   | 123456   | USER  |

---

## What's connected to the backend

| Feature | Endpoint |
|---------|----------|
| Login | `POST /auth/login` |
| List devices | `GET /devices` |
| Device details + metrics + alerts | `GET /devices/{id}` |
| Add device | `POST /devices` (ADMIN) |
| Edit device | `PUT /devices/{id}` (ADMIN) |
| Delete device | `DELETE /devices/{id}` (ADMIN) |
| List alerts | `GET /alerts` |
| List users | `GET /users` (ADMIN) |
| Create user | `POST /users` (ADMIN) |
| Agent simulation | `POST /metrics` — auto every 5s per device |

## Agent Simulation
The frontend automatically POSTs random CPU/RAM/Disk metrics to `/metrics` every 5 seconds for every device. The backend handles auto-alerts when CPU > 90%.

## Language
Toggle EN ↔ UA with the button in the sidebar or on the login screen.

## Project structure
```
src/
  utils/api.js            ← all fetch calls to backend
  context/AppContext.js   ← global state + polling + simulation
  i18n/translations.js    ← EN/UK strings
  components/             ← Layout, MetricBar, StatusBadge
  pages/                  ← Login, Dashboard, Devices, DeviceDetails, Alerts, Users
```
