import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";

/**
 * LandingPage 컴포넌트
 * 서비스 메인 소개 페이지
 * 은퇴 재무 상담 서비스 Lycon Retire의 심플한 랜딩 페이지
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

  // 로그인 페이지로 이동
  const handleLogin = () => {
    // Mixpanel 트래킹: 로그인 버튼 클릭
    if (window.mixpanel) {
      window.mixpanel.track("Landing - Login Clicked");
    }

    navigate("/login");
  };

  return (
    <div className={styles.landingContainer}>
      {/* 헤더 섹션 */}
      <header className={styles.header}>
        <div className={styles.logo}>Lycon Retire</div>
        <button className={styles.loginButton} onClick={handleLogin}>
          로그인
        </button>
      </header>

      {/* 메인 섹션 */}
      <main className={styles.main}>
        {/* 타이틀 영역 */}
        <div className={styles.titleSection}>
          <div className={styles.badge}>전문가 은퇴 재무 상담</div>
          <h1 className={styles.mainTitle}>
            은퇴 후 <span className={styles.highlight}>돈이 떨어지지 않을까</span>
            <br />
            걱정되시나요?
          </h1>
          <p className={styles.subtitle}>
            전문가와 함께 은퇴 재무를 체계적으로 준비하세요
          </p>
        </div>

        {/* 시작 버튼 */}
        <button className={styles.startButton} onClick={handleStartService}>
          무료 사전상담 시작하기
        </button>
        <p className={styles.subCta}>먼저 간단히 재무 상태를 확인해보세요</p>

        {/* 상담 프로세스 */}
        <div className={styles.processSection}>
          <div className={styles.processItem}>
            <div className={styles.processStep}>
              <div className={styles.processNumber}>1</div>
              <div className={styles.processLabel}>사전 상담</div>
            </div>
            <div className={styles.processDesc}>
              <div className={styles.processTitle}>무료 재무 진단</div>
              <div className={styles.processDetail}>
                우리 프로그램으로 직접 재무 상태를 입력하고 시뮬레이션해보세요
              </div>
            </div>
          </div>

          <div className={styles.processArrow}>→</div>

          <div className={styles.processItem}>
            <div className={styles.processStep}>
              <div className={styles.processNumber}>2</div>
              <div className={styles.processLabel}>본 상담</div>
            </div>
            <div className={styles.processDesc}>
              <div className={styles.processTitle}>전문가 1:1 상담</div>
              <div className={styles.processDetail}>
                전문가가 맞춤형 은퇴 계획을 함께 수립해드립니다
        </div>
            </div>
          </div>

          <div className={styles.processArrow}>→</div>

          <div className={styles.processItem}>
            <div className={styles.processStep}>
              <div className={styles.processNumber}>3</div>
              <div className={styles.processLabel}>프로그램 이용</div>
            </div>
            <div className={styles.processDesc}>
              <div className={styles.processTitle}>무제한 관리</div>
              <div className={styles.processDetail}>
                상담 후 프로그램을 무제한으로 이용하며 지속 관리하세요
              </div>
            </div>
          </div>
          </div>

        {/* 왜 우리 서비스인가 */}
        <div className={styles.whyUsSection}>
          <h2 className={styles.sectionTitle}>왜 라이콘 은퇴 상담인가요?</h2>
          <div className={styles.benefits}>
            <div className={styles.benefitItem}>
              <div className={styles.benefitTitle}>전문가와 함께</div>
              <div className={styles.benefitDesc}>
                은퇴 재무 전문가가 1:1로 맞춤형 상담을 제공합니다
              </div>
            </div>

            <div className={styles.benefitItem}>
              <div className={styles.benefitTitle}>체계적인 프로그램</div>
              <div className={styles.benefitDesc}>
                상담 후 프로그램을 무제한으로 이용하며 지속적으로 관리할 수 있습니다
              </div>
          </div>

            <div className={styles.benefitItem}>
              <div className={styles.benefitTitle}>데이터 기반 분석</div>
              <div className={styles.benefitDesc}>
                100세까지 시뮬레이션하며 다양한 시나리오를 비교 분석합니다
              </div>
            </div>
          </div>
        </div>

        {/* 프로그램 기능 */}
        <div className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>
            상담 후 이용 가능한 프로그램 기능
          </h2>
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>재무 데이터 관리</div>
              <div className={styles.featureDesc}>
                자산, 부채, 수입, 지출, 연금을 한 곳에서 관리하고 실시간으로
                순자산을 확인하세요
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>현금흐름 시뮬레이션</div>
              <div className={styles.featureDesc}>
                100세까지 나이별 현금흐름을 시뮬레이션하고 자산 고갈 시점을
                미리 확인하세요
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>시나리오 비교</div>
              <div className={styles.featureDesc}>
                다양한 재무 전략을 무제한으로 비교하며 최적의 은퇴 계획을
                수립하세요
              </div>
          </div>

            <div className={styles.featureItem}>
              <div className={styles.featureTitle}>체크리스트 관리</div>
              <div className={styles.featureDesc}>
                은퇴 준비 항목들을 체크하며 놓치는 것 없이 체계적으로
                준비하세요
          </div>
          </div>
          </div>
        </div>

        {/* 마지막 CTA */}
        <div className={styles.finalCta}>
          <h2 className={styles.ctaTitle}>무료 사전상담으로 시작하세요</h2>
          <p className={styles.ctaSubtitle}>
            먼저 프로그램으로 직접 재무 상태를 확인해보세요
            <br />
            전문가 상담이 필요하시면 언제든 연결해드립니다
        </p>
        <button className={styles.ctaButton} onClick={handleStartService}>
            무료 사전상담 시작하기
        </button>
        </div>
      </main>

      {/* 푸터 */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          © 2025 Lycon Retire
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
