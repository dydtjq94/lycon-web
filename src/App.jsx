import React from "react";
import { Routes, Route } from "react-router-dom";
import ProfileListPage from "./pages/ProfileListPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import "./index.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProfileListPage />} />
      <Route path="/dashboard/:profileId" element={<DashboardPage />} />
    </Routes>
  );
}
