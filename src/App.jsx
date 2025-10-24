import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ProfileListPage from "./pages/ProfileListPage";
import ProfileCreatePage from "./pages/ProfileCreatePage";
import DashboardPage from "./pages/DashboardPage";
import VersionDisplay from "./components/common/VersionDisplay";
import "./App.css";

/**
 * 메인 App 컴포넌트
 * Lycon Retire - 은퇴 재무 상담 서비스
 *
 * 라우팅 구조:
 * / - 서비스 소개 랜딩 페이지
 * /consult - 프로필 목록 (상담 목록)
 * /consult/create - 새 프로필 생성
 * /consult/dashboard/:id - 프로필별 대시보드
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 랜딩 페이지 - 서비스 소개 */}
          <Route path="/" element={<LandingPage />} />

          {/* 프로필 목록 페이지 */}
          <Route path="/consult" element={<ProfileListPage />} />

          {/* 새 프로필 생성 페이지 */}
          <Route path="/consult/create" element={<ProfileCreatePage />} />

          {/* 프로필별 대시보드 페이지 */}
          <Route
            path="/consult/dashboard/:profileId"
            element={<DashboardPage />}
          />
        </Routes>

        {/* 버전 표시 (개발자용) */}
        <VersionDisplay />
      </div>
    </Router>
  );
}

export default App;
