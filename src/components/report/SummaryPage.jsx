import React from "react";
import styles from "./SummaryPage.module.css";

/**
 * 종합 진단 결과 요약 (Page 17)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function SummaryPage({ profile, simulationData }) {
  // 현금흐름 및 자산 데이터
  const cashflow = simulationData?.simulation?.cashflow || [];
  const assets = simulationData?.simulation?.assets || [];
  const currentYearCashflow = cashflow[0] || {};

  // 총 소득/지출 계산
  const totalIncome =
    (currentYearCashflow.income || 0) +
    (currentYearCashflow.pension || 0) +
    (currentYearCashflow.rentalIncome || 0) +
    (currentYearCashflow.assetIncome || 0);

  const totalExpense =
    (currentYearCashflow.expense || 0) +
    (currentYearCashflow.savings || 0) +
    Math.abs(currentYearCashflow.debtInterest || 0) +
    Math.abs(currentYearCashflow.debtPrincipal || 0);

  const annualBalance = totalIncome - totalExpense;
  const monthlyBalance = annualBalance / 12;

  // 현재 및 은퇴 시점 자산
  const currentAsset = assets.length > 0 ? assets[0] : {};
  const currentTotalAssets = currentAsset.totalAssets || 0;

  // 은퇴 시점 자산 찾기
  const currentAge = profile?.age || 60;
  const retirementAge = profile?.retirementAge || 65;
  const retirementIndex = retirementAge - currentAge;
  const retirementAsset =
    assets.length > retirementIndex ? assets[retirementIndex] : currentAsset;
  const retirementTotalAssets = retirementAsset.totalAssets || currentTotalAssets;

  // 목표 자산 (은퇴 목표)
  const targetAssets = profile?.retirementGoal || retirementTotalAssets * 0.97;

  // 목표 달성률
  const achievementRate =
    targetAssets > 0 ? (retirementTotalAssets / targetAssets) * 100 : 100;

  // 대규모 유출 이벤트 찾기
  const currentYear = new Date().getFullYear();
  const largeCashOutflows = cashflow
    .map((year, index) => ({
      year: currentYear + index,
      age: currentAge + index,
      realEstateSale: year.realEstateSale || 0,
      debtPrincipal: Math.abs(year.debtPrincipal || 0),
      total: (year.realEstateSale || 0) + Math.abs(year.debtPrincipal || 0),
    }))
    .filter((item) => item.total > totalIncome * 2);

  const criticalYear = largeCashOutflows.length > 0 ? largeCashOutflows[0] : null;

  if (!simulationData || !cashflow || cashflow.length === 0) {
    return (
      <div className={styles.slideContainer}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.slideContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerBadges}>
            <span className={styles.stepBadge}>SUMMARY</span>
            <span className={styles.sectionBadge}>KEY INSIGHTS & NEXT STEPS</span>
          </div>
          <h1 className={styles.headerTitle}>종합 진단 결과 요약</h1>
        </div>
        <div className={styles.headerDescription}>
          <p>진단을 통해 도출된 3가지 핵심 인사이트와</p>
          <p>성공적인 은퇴 준비를 위한 향후 실행 로드맵입니다.</p>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Top 3 Insights */}
        <div className={styles.insightsGrid}>
          {/* Insight 1: 은퇴 자산 목표 */}
          <div
            className={`${styles.insightCard} ${styles.insightCardAccent}`}
            style={{ borderTopColor: achievementRate >= 100 ? "#10B981" : "#F59E0B" }}
          >
            <div className={styles.numberWatermark}>1</div>
            <div className={styles.insightContent}>
              <div
                className={styles.insightIconBox}
                style={{
                  backgroundColor:
                    achievementRate >= 100
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(245, 158, 11, 0.2)",
                  borderColor: achievementRate >= 100 ? "#059669" : "#D97706",
                  color: achievementRate >= 100 ? "#10B981" : "#F59E0B",
                }}
              >
                <i className="fas fa-trophy" style={{ fontSize: "18px" }}></i>
              </div>
              <h3 className={styles.insightTitle}>
                은퇴 자산 목표 {achievementRate >= 100 ? "초과 달성" : "달성 진행 중"}
              </h3>
              <div className={styles.insightTextBox}>
                <p className={styles.insightText}>
                  은퇴 시점 예상 자산 약 {(retirementTotalAssets / 10000).toFixed(1)}억원으로
                  목표 대비{" "}
                  <strong
                    style={{
                      color: achievementRate >= 100 ? "#34D399" : "#FBBF24",
                    }}
                  >
                    {achievementRate.toFixed(1)}%
                  </strong>{" "}
                  {achievementRate >= 100 ? "달성이 예상됩니다" : "진행 중입니다"}.
                </p>
                <div className={styles.insightFooter}>
                  <i
                    className={`fas ${achievementRate >= 100 ? "fa-check" : "fa-arrow-up"}`}
                    style={{
                      color: achievementRate >= 100 ? "#10B981" : "#F59E0B",
                    }}
                  ></i>
                  {achievementRate >= 100
                    ? "자산 성장률 유지 및 관리 필요"
                    : "추가 저축 및 투자 전략 실행 필요"}
                </div>
              </div>
            </div>
          </div>

          {/* Insight 2: 유동성 리스크 */}
          <div
            className={`${styles.insightCard} ${styles.insightCardAccent}`}
            style={{ borderTopColor: criticalYear ? "#EF4444" : "#3B82F6" }}
          >
            <div className={styles.numberWatermark}>2</div>
            <div className={styles.insightContent}>
              <div
                className={styles.insightIconBox}
                style={{
                  backgroundColor: criticalYear
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(59, 130, 246, 0.2)",
                  borderColor: criticalYear ? "#DC2626" : "#2563EB",
                  color: criticalYear ? "#EF4444" : "#3B82F6",
                }}
              >
                <i
                  className="fas fa-triangle-exclamation"
                  style={{ fontSize: "18px" }}
                ></i>
              </div>
              <h3 className={styles.insightTitle}>
                {criticalYear
                  ? `${criticalYear.year}년 유동성 리스크 경고`
                  : "유동성 관리 양호"}
              </h3>
              <div className={styles.insightTextBox}>
                <p className={styles.insightText}>
                  {criticalYear ? (
                    <>
                      재건축 분담금 및 부채 상환으로 약{" "}
                      <strong style={{ color: "#FCA5A5" }}>
                        {(criticalYear.total / 10000).toFixed(1)}억원
                      </strong>
                      의 대규모 현금 유출이 발생합니다.
                    </>
                  ) : (
                    <>
                      향후 10년간 대규모 현금 유출 이벤트가 없어 유동성 관리가 안정적입니다.
                    </>
                  )}
                </p>
                <div className={styles.insightFooter}>
                  <i
                    className={`fas ${criticalYear ? "fa-arrow-right" : "fa-check"}`}
                    style={{ color: criticalYear ? "#EF4444" : "#3B82F6" }}
                  ></i>
                  {criticalYear
                    ? "사전 현금성 자산 확보 필수"
                    : "정기 모니터링 지속"}
                </div>
              </div>
            </div>
          </div>

          {/* Insight 3: 현금흐름 적자 */}
          <div
            className={`${styles.insightCard} ${styles.insightCardAccent}`}
            style={{
              borderTopColor: monthlyBalance < 0 ? "#F59E0B" : "#10B981",
            }}
          >
            <div className={styles.numberWatermark}>3</div>
            <div className={styles.insightContent}>
              <div
                className={styles.insightIconBox}
                style={{
                  backgroundColor:
                    monthlyBalance < 0
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(16, 185, 129, 0.2)",
                  borderColor: monthlyBalance < 0 ? "#D97706" : "#059669",
                  color: monthlyBalance < 0 ? "#F59E0B" : "#10B981",
                }}
              >
                <i className="fas fa-coins" style={{ fontSize: "18px" }}></i>
              </div>
              <h3 className={styles.insightTitle}>
                현재 {monthlyBalance >= 0 ? "흑자" : "적자"} 구조{" "}
                {monthlyBalance < 0 ? "개선 시급" : "양호"}
              </h3>
              <div className={styles.insightTextBox}>
                <p className={styles.insightText}>
                  월 소득 대비 지출{" "}
                  {monthlyBalance < 0 ? (
                    <>
                      과다로{" "}
                      <strong style={{ color: "#FBBF24" }}>구조적 적자</strong> 상태입니다.
                      저축 여력 확보가 시급합니다.
                    </>
                  ) : (
                    <>
                      으로 월 <strong style={{ color: "#34D399" }}>
                        {monthlyBalance.toFixed(1)}만원
                      </strong>{" "}
                      흑자가 발생하고 있습니다.
                    </>
                  )}
                </p>
                <div className={styles.insightFooter}>
                  <i
                    className={`fas ${monthlyBalance < 0 ? "fa-wrench" : "fa-check"}`}
                    style={{
                      color: monthlyBalance < 0 ? "#F59E0B" : "#10B981",
                    }}
                  ></i>
                  {monthlyBalance < 0
                    ? "고정비 구조조정 및 지출 통제"
                    : "현재 수준 유지 및 저축률 제고"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className={styles.bottomRow}>
          {/* Next Steps */}
          <div className={styles.nextStepsSection}>
            <h3 className={styles.sectionLabel}>Next Steps : 실행 로드맵</h3>
            <div className={styles.nextStepsCard}>
              {/* Step 1 */}
              <div className={styles.stepItem}>
                <div
                  className={styles.stepIconBox}
                  style={{
                    backgroundColor: "#374151",
                    color: "#D1D5DB",
                    borderColor: "#4B5563",
                  }}
                >
                  <i className="fas fa-clipboard-list" style={{ fontSize: "14px" }}></i>
                </div>
                <p className={styles.stepTitle} style={{ color: "#E5E7EB" }}>
                  데이터 보완
                </p>
                <p className={styles.stepDescription}>
                  누락된 자산/부채
                  <br />
                  정밀 파악
                </p>
              </div>

              <div className={styles.stepArrow}>
                <i className="fas fa-chevron-right"></i>
              </div>

              {/* Step 2 */}
              <div className={styles.stepItem}>
                <div
                  className={styles.stepIconBox}
                  style={{
                    backgroundColor: "#374151",
                    color: "#D1D5DB",
                    borderColor: "#4B5563",
                  }}
                >
                  <i className="fas fa-calculator" style={{ fontSize: "14px" }}></i>
                </div>
                <p className={styles.stepTitle} style={{ color: "#E5E7EB" }}>
                  정교화 시뮬레이션
                </p>
                <p className={styles.stepDescription}>
                  유동성 리스크
                  <br />
                  대응 시나리오
                </p>
              </div>

              <div className={styles.stepArrow}>
                <i className="fas fa-chevron-right"></i>
              </div>

              {/* Step 3 */}
              <div className={styles.stepItem}>
                <div
                  className={styles.stepIconBox}
                  style={{
                    backgroundColor: "#1E3A8A",
                    color: "#60A5FA",
                    borderColor: "#3B82F6",
                    boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                  }}
                >
                  <i className="fas fa-scroll" style={{ fontSize: "14px" }}></i>
                </div>
                <p className={styles.stepTitle} style={{ color: "#60A5FA" }}>
                  액션플랜 실행
                </p>
                <p className={styles.stepDescription}>
                  지출 구조조정 및
                  <br />
                  현금 확보 전략
                </p>
              </div>

              <div className={styles.stepArrow}>
                <i className="fas fa-chevron-right"></i>
              </div>

              {/* Step 4 */}
              <div className={styles.stepItem}>
                <div
                  className={styles.stepIconBox}
                  style={{
                    backgroundColor: "#374151",
                    color: "#D1D5DB",
                    borderColor: "#4B5563",
                  }}
                >
                  <i
                    className="fas fa-magnifying-glass-chart"
                    style={{ fontSize: "14px" }}
                  ></i>
                </div>
                <p className={styles.stepTitle} style={{ color: "#E5E7EB" }}>
                  정기 모니터링
                </p>
                <p className={styles.stepDescription}>
                  분기별 적자 개선
                  <br />
                  성과 점검
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className={styles.contactSection}>
            <h3 className={styles.sectionLabel}>Contact</h3>
            <div className={styles.contactCard}>
              <div className={styles.contactBackgroundIcon}>
                <i className="fas fa-handshake"></i>
              </div>
              <p className={styles.contactIntro}>성공적인 은퇴를 함께 준비하겠습니다.</p>
              <div className={styles.contactProfile}>
                <div className={styles.contactAvatar}>
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <p className={styles.contactName}>
                    {profile?.name || "고객"}님{" "}
                    <span style={{ fontSize: "10px", fontWeight: 400, color: "#9ca3af" }}>
                      고객님
                    </span>
                  </p>
                  <p className={styles.contactRole}>은퇴 준비 파트너 손균우</p>
                </div>
              </div>
              <div className={styles.contactDetails}>
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <i className="fas fa-phone"></i>
                  </div>
                  <span>010-6657-6155</span>
                </div>
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <i className="fas fa-envelope"></i>
                  </div>
                  <span>lein@lycon.kr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryPage;
