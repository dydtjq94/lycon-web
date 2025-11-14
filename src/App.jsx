import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfileListPage from "./pages/ProfileListPage";
import ProfileCreatePage from "./pages/ProfileCreatePage";
import DashboardPage from "./pages/DashboardPage";
import PreConsultPage from "./pages/PreConsultPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import VersionDisplay from "./components/common/VersionDisplay";
import "./App.css";

/**
 * 메인 App 컴포넌트
 * Lycon Retire - 은퇴 재무 상담 서비스
 *
 * 라우팅 구조:
 * / - 서비스 소개 랜딩 페이지
 * /login - 관리자 로그인 페이지
 * /signup - 회원가입/일반 사용자 로그인 페이지 (?profileId=xxx)
 * /consult - 프로필 목록 (상담 목록) - 관리자 로그인 필요
 * /consult/create - 새 프로필 생성 - 관리자 로그인 필요
 * /consult/preconsult/:id - 사전 상담 페이지 - 관리자 로그인 필요
 * /consult/dashboard/:id - 프로필별 대시보드 - 로그인 불필요 (view-only 모드 가능)
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* 랜딩 페이지 - 서비스 소개 */}
            <Route path="/" element={<LandingPage />} />

            {/* 로그인 페이지 (관리자용) */}
            <Route path="/login" element={<LoginPage />} />

            {/* 회원가입/로그인 페이지 (일반 사용자용) */}
            <Route path="/signup" element={<SignupPage />} />

            {/* 프로필 목록 페이지 - 관리자 로그인 필요 */}
            <Route
              path="/consult"
              element={
                <ProtectedRoute>
                  <ProfileListPage />
                </ProtectedRoute>
              }
            />

            {/* 새 프로필 생성 페이지 - 로그인 필요 */}
            <Route
              path="/consult/create"
              element={
                <ProtectedRoute>
                  <ProfileCreatePage />
                </ProtectedRoute>
              }
            />

            {/* 사전 상담 페이지 - 관리자 로그인 필요 */}
            <Route
              path="/consult/preconsult/:profileId"
              element={
                <ProtectedRoute>
                  <PreConsultPage />
                </ProtectedRoute>
              }
            />

            {/* 프로필별 대시보드 페이지 - 로그인 불필요 (view-only 모드로 접근 가능) */}
            <Route
              path="/consult/dashboard/:profileId"
              element={<DashboardPage />}
            />
          </Routes>

          {/* 버전 표시 (개발자용) */}
          <VersionDisplay />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
