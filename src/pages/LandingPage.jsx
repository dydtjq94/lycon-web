import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";

/**
 * LandingPage 컴포넌트
 * 서비스 메인 소개 페이지
 * Life is Confidence 심플 랜딩 페이지
 */
function LandingPage() {
  const navigate = useNavigate();

  // 서비스 시작 버튼 클릭 핸들러
  const handleStartService = () => {
    // Mixpanel 트래킹: 서비스 시작 버튼 클릭
    if (window.mixpanel) {
      window.mixpanel.track("랜딩 - 서비스 시작 클릭");
    }

    navigate("/consult");
  };

  return (
    <div className={styles.landingContainer}>
      <h1 className={styles.mainTitle}>Lycon Planning</h1>
      <button className={styles.startButton} onClick={handleStartService}>
        시작하기
      </button>
    </div>
  );
}

export default LandingPage;
