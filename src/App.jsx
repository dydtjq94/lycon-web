import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProfileListPage from "./pages/ProfileListPage";
import ProfileCreatePage from "./pages/ProfileCreatePage";
import DashboardPage from "./pages/DashboardPage";
import VersionDisplay from "./components/VersionDisplay";
import "./App.css";

/**
 * 메인 App 컴포넌트
 * Lycon Planning - 재무 상담사용 내담자 관리 시스템
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 프로필 목록 페이지 */}
          <Route path="/" element={<ProfileListPage />} />

          {/* 새 프로필 생성 페이지 */}
          <Route path="/create" element={<ProfileCreatePage />} />

          {/* 프로필별 대시보드 페이지 */}
          <Route path="/dashboard/:profileId" element={<DashboardPage />} />
        </Routes>
        
        {/* 버전 표시 (개발자용) */}
        <VersionDisplay />
      </div>
    </Router>
  );
}

export default App;
