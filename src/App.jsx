import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Start from "./pages/Start.jsx";
import Survey from "./pages/Survey.jsx";
import Loading from "./pages/Loading.jsx";
import Result from "./pages/Result.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/survey" element={<Survey />} />
      <Route path="/loading" element={<Loading />} />
      <Route path="/result" element={<Result />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
