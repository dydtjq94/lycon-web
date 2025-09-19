import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Start from "./pages/Start.jsx";
import Survey from "./pages/Survey.jsx";
import Loading from "./pages/Loading.jsx";
import Result from "./pages/Result.jsx";
import Calculator from "./pages/Calculator.jsx";
// 그룹별 설문 페이지들
import BasicInfo from "./pages/survey/BasicInfo.jsx";
import IncomePension from "./pages/survey/IncomePension.jsx";
import Expenses from "./pages/survey/Expenses.jsx";
import Assets from "./pages/survey/Assets.jsx";
import Debt from "./pages/survey/Debt.jsx";
import { SurveyProvider } from "./context/SurveyContext.jsx";

export default function App() {
  return (
    <SurveyProvider>
      <Routes>
        <Route path="/" element={<Start />} />
        {/* 기존 단일 설문 페이지 (호환성을 위해 유지) */}
        <Route path="/survey" element={<Survey />} />
        {/* 새로운 그룹별 설문 페이지들 */}
        <Route path="/survey/basic" element={<BasicInfo />} />
        <Route path="/survey/income" element={<IncomePension />} />
        <Route path="/survey/expenses" element={<Expenses />} />
        <Route path="/survey/assets" element={<Assets />} />
        <Route path="/survey/debt" element={<Debt />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/result" element={<Result />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SurveyProvider>
  );
}
