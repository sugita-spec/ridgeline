import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { AdminDashboard } from "./AdminDashboard.jsx";
import "./styles.css";

const isAdmin = window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdmin ? <AdminDashboard /> : <App />}
  </React.StrictMode>,
);
