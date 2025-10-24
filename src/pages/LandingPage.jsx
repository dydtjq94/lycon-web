import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";

/**
 * LandingPage 컴포넌트
 * 서비스 메인 소개 페이지
 * 은퇴 재무 상담 서비스 Lycon Retire의 랜딩 페이지
 */
function LandingPage() {
  const navigate = useNavigate();

  // 서비스 시작 버튼 클릭 핸들러
  const handleStartService = () => {
    // Mixpanel 트래킹: 서비스 시작 버튼 클릭
    if (window.mixpanel) {
      window.mixpanel.track("Landing - Start Service Clicked");
    }

    navigate("/consult");
  };

  return (
    <div className={styles.landingContainer}>
      {/* 헤더 섹션 */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <h1>Lycon Retire</h1>
        </div>
      </header>

      {/* 메인 히어로 섹션 */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h2 className={styles.mainTitle}>
            은퇴 후 삶,
            <br />
            <span className={styles.highlight}>제대로 준비하고 계신가요?</span>
          </h2>

          <p className={styles.description}>
            은퇴자와 은퇴 준비자를 위한 재무 상태 분석 및 시뮬레이션 서비스
          </p>

          <button className={styles.startButton} onClick={handleStartService}>
            무료로 시작하기
          </button>

          <p className={styles.subText}>
            회원가입 없이 바로 시작할 수 있습니다
          </p>
        </div>

        {/* 히어로 이미지 또는 일러스트 영역 */}
        <div className={styles.heroImage}>
          <div className={styles.imagePlaceholder}>
            {/* 추후 실제 이미지나 일러스트로 교체 */}
            <div className={styles.mockChart}>
              <div className={styles.chartBar} style={{ height: "60%" }}></div>
              <div className={styles.chartBar} style={{ height: "80%" }}></div>
              <div className={styles.chartBar} style={{ height: "70%" }}></div>
              <div className={styles.chartBar} style={{ height: "90%" }}></div>
              <div className={styles.chartBar} style={{ height: "75%" }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className={styles.features}>
        <h3 className={styles.sectionTitle}>주요 기능</h3>

        <div className={styles.featureGrid}>
          {/* 기능 1: 재무 상태 분석 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span className={styles.iconEmoji}>📊</span>
            </div>
            <h4>재무 상태 한눈에 분석</h4>
            <p>
              자산, 부채, 수입, 지출을 체계적으로 입력하고 한눈에 파악할 수 있는
              대시보드를 제공합니다.
            </p>
          </div>

          {/* 기능 2: 은퇴 시뮬레이션 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span className={styles.iconEmoji}>📈</span>
            </div>
            <h4>은퇴 후 현금흐름 시뮬레이션</h4>
            <p>
              연령대별 수입/지출 변화를 시뮬레이션하여 은퇴 후 재무 상태를 미리
              예측할 수 있습니다.
            </p>
          </div>

          {/* 기능 3: 시각화 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span className={styles.iconEmoji}>📉</span>
            </div>
            <h4>직관적인 차트와 그래프</h4>
            <p>
              복잡한 재무 데이터를 알기 쉬운 차트로 시각화하여 이해하기 쉽게
              제공합니다.
            </p>
          </div>

          {/* 기능 4: 데이터 관리 */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span className={styles.iconEmoji}>💾</span>
            </div>
            <h4>안전한 데이터 저장</h4>
            <p>
              브라우저 로컬 스토리지에 데이터를 안전하게 보관하고 언제든지
              불러와서 수정할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 사용 대상 섹션 */}
      <section className={styles.targetUsers}>
        <h3 className={styles.sectionTitle}>이런 분들께 추천합니다</h3>

        <div className={styles.userList}>
          <div className={styles.userItem}>
            <span className={styles.userIcon}>👴</span>
            <p>이미 은퇴하셨고 재무 관리가 필요하신 분</p>
          </div>
          <div className={styles.userItem}>
            <span className={styles.userIcon}>👨‍💼</span>
            <p>은퇴를 앞두고 계획을 세우시는 분</p>
          </div>
          <div className={styles.userItem}>
            <span className={styles.userIcon}>👨‍👩‍👧‍👦</span>
            <p>부모님의 재무 상태를 관리해드리고 싶으신 분</p>
          </div>
          <div className={styles.userItem}>
            <span className={styles.userIcon}>💼</span>
            <p>재무 상담사로 고객 관리가 필요하신 분</p>
          </div>
        </div>
      </section>

      {/* CTA(Call To Action) 섹션 */}
      <section className={styles.cta}>
        <h3 className={styles.ctaTitle}>지금 바로 시작해보세요</h3>
        <p className={styles.ctaDescription}>
          복잡한 가입 절차 없이 바로 사용할 수 있습니다
        </p>
        <button className={styles.ctaButton} onClick={handleStartService}>
          무료로 시작하기
        </button>
      </section>

      {/* 푸터 */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            © 2025 Lycon Retire. All rights reserved.
          </p>
          <p className={styles.footerVersion}>Version 0.25.0</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
