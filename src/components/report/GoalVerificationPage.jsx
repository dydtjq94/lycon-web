import React, { useState, useEffect } from "react";
import { calculateKoreanAge } from "../../utils/koreanAge";
import styles from "./GoalVerificationPage.module.css";

/**
 * 목표 확인 및 데이터 검증 페이지
 * @param {Object} profile - 프로필 데이터
 * @param {Object} financialData - 재무 데이터 (소득, 지출, 자산 등)
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function GoalVerificationPage({ profile, financialData, simulationData }) {
  const [predictedEvents, setPredictedEvents] = useState(null);

  // 현재 나이 계산
  const currentAge = profile?.birthYear
    ? calculateKoreanAge(profile.birthYear)
    : 0;
  const retirementAge = profile?.retirementAge || 65;
  const targetAssets = simulationData?.profile?.targetAssets || profile?.targetAssets || 0;

  // 시뮬레이션 데이터 기반 자동 추출
  const retirementYearIndex = profile?.retirementAge
    ? profile.retirementAge - currentAge
    : 0;
  const retirementAsset = simulationData?.simulation?.assets?.[
    retirementYearIndex
  ]?.totalAmount;

  // 페이지 로드 시 자동으로 시뮬레이션 데이터에서 주요 이벤트 추출
  useEffect(() => {
    if (simulationData && !predictedEvents) {
      extractLifeEventsFromSimulation();
    }
  }, [simulationData]);

  // 시뮬레이션 데이터에서 주요 생애 이벤트 추출
  const extractLifeEventsFromSimulation = () => {
    if (!simulationData?.simulation?.cashflow) {
      setPredictedEvents([]);
      return;
    }

    const events = [];
    const cashflowData = simulationData.simulation.cashflow;

    cashflowData.forEach((yearData) => {
      const { year, age, breakdown } = yearData;

      // positives (수입)
      (breakdown?.positives || []).forEach((item) => {
        const amount = item.amount || 0;

        // 5천만원 이상의 큰 이벤트만 추출
        if (Math.abs(amount) >= 5000) {
          // 일반적인 소득은 제외하고 특별한 이벤트만
          const isRegularItem =
            item.label?.includes("근로소득") ||
            item.label?.includes("비정기수입");

          if (!isRegularItem) {
            events.push({
              year,
              age,
              description: item.label || "기타 수입",
              amount: Math.abs(amount), // 양수로 저장
              category: item.category || "수입",
              isIncome: true,
            });
          }
        }
      });

      // negatives (지출)
      (breakdown?.negatives || []).forEach((item) => {
        const amount = item.amount || 0;

        // 5천만원 이상의 큰 이벤트만 추출
        if (Math.abs(amount) >= 5000) {
          // 일반적인 지출/저축은 제외하고 특별한 이벤트만
          const isRegularItem =
            item.label?.includes("생활비") ||
            item.label?.includes("적립") ||
            item.category === "저축 적립";

          if (!isRegularItem) {
            events.push({
              year,
              age,
              description: item.label || "기타 지출",
              amount: -Math.abs(amount), // 음수로 저장
              category: item.category || "지출",
              isIncome: false,
            });
          }
        }
      });
    });

    // 중복 제거 및 정렬
    const uniqueEvents = events.filter(
      (event, index, self) =>
        index ===
        self.findIndex(
          (e) =>
            e.year === event.year && e.description === event.description
        )
    );

    setPredictedEvents(uniqueEvents);
  };

  return (
    <div className={styles.slideContainer}>
      {/* 배경 텍스처 */}
      <div className={styles.backgroundTexture}></div>

      {/* 헤더 */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerBadges}>
            <span className={styles.stepBadge}>STEP 1-1</span>
            <span className={styles.checklistBadge}>Checklist</span>
          </div>
          <h1 className={styles.headerTitle}>목표 확인 및 데이터 검증</h1>
        </div>
      </div>

      {/* 메인 콘텐츠: 그리드 레이아웃 */}
      <div className={styles.mainContent}>
        <div className={styles.gridContainer}>
          {/* Card 1: 재무 목표 확인 */}
          <div className={styles.card}>
            <div className={styles.cornerAccentTL}></div>
            <span className={styles.cardNumber}>01</span>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>
                <i className="fas fa-bullseye"></i>
              </div>
              <h2 className={styles.cardTitle}>재무 목표 확인</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.checkItem}>
                <i className="fas fa-check"></i>
                <span>
                  <strong>은퇴 시점:</strong> {retirementAge}세 (
                  {new Date().getFullYear() + (retirementAge - currentAge)}년)
                  목표
                </span>
              </div>
              <div className={styles.checkItem}>
                <i className="fas fa-check"></i>
                <span>
                  <strong>목표 자산:</strong> 은퇴 시점 순자산{" "}
                  <span className={styles.goldText}>
                    {profile?.targetAssets
                      ? `${(profile.targetAssets / 10000).toFixed(0)}억원`
                      : "미설정"}
                  </span>{" "}
                  달성
                </span>
              </div>
              <div className={styles.checkItem}>
                <i className="fas fa-check"></i>
                <span>
                  <strong>목표 현금흐름:</strong> 은퇴 후 월{" "}
                  <span className={styles.goldText}>
                    {profile?.currentLivingExpenses
                      ? `${profile.currentLivingExpenses}만원`
                      : "미설정"}
                  </span>{" "}
                  (은퇴시점 기준)
                </span>
              </div>
              <div className={styles.checkItem}>
                <i className="fas fa-check"></i>
                <span>
                  <strong>은퇴 시점 예상 자산:</strong>{" "}
                  <span className={styles.goldText}>
                    {retirementAsset
                      ? `${(retirementAsset / 10000).toFixed(1)}억원`
                      : "시뮬레이션 필요"}
                  </span>
                  {retirementAsset && targetAssets && (
                    <span
                      style={{
                        color:
                          retirementAsset >= targetAssets ? "#10B981" : "#EF4444",
                        fontWeight: "600",
                        marginLeft: "4px",
                      }}
                    >
                      (목표 대비{" "}
                      {((retirementAsset / targetAssets) * 100).toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 기초 데이터 검증 */}
          <div className={styles.card}>
            <span className={styles.cardNumber}>02</span>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>
                <i className="fas fa-clipboard-check"></i>
              </div>
              <h2 className={styles.cardTitle}>기초 데이터 검증</h2>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardDescription}>
                다음 항목들을 점검하고, 추가 할 데이터가 없는지 확인합니다.
              </p>
              <div className={styles.dataCheckList}>
                <div className={styles.dataCheckItem}>
                  <div className={styles.dataCheckLabel}>
                    <i className="fas fa-file-invoice-dollar"></i>
                    <span>
                      소득/지출 ({simulationData?.rawData?.incomes?.length || 0}
                      /{simulationData?.rawData?.expenses?.length || 0})
                    </span>
                  </div>
                  <span
                    className={styles.statusPending}
                    style={{
                      color:
                        simulationData?.rawData?.incomes?.length > 0
                          ? "#4ade80"
                          : "#6b7280",
                    }}
                  >
                    {simulationData?.rawData?.incomes?.length > 0
                      ? "확인됨"
                      : "대기중"}
                  </span>
                </div>
                <div className={styles.dataCheckItem}>
                  <div className={styles.dataCheckLabel}>
                    <i className="fas fa-piggy-bank"></i>
                    <span>
                      저축/적금 ({simulationData?.rawData?.savings?.length || 0})
                    </span>
                  </div>
                  <span
                    className={styles.statusPending}
                    style={{
                      color:
                        simulationData?.rawData?.savings?.length > 0
                          ? "#4ade80"
                          : "#6b7280",
                    }}
                  >
                    {simulationData?.rawData?.savings?.length > 0
                      ? "확인됨"
                      : "대기중"}
                  </span>
                </div>
                <div className={styles.dataCheckItem}>
                  <div className={styles.dataCheckLabel}>
                    <i className="fas fa-chart-line"></i>
                    <span>
                      연금 정보 ({simulationData?.rawData?.pensions?.length || 0})
                    </span>
                  </div>
                  <span
                    className={styles.statusPending}
                    style={{
                      color:
                        simulationData?.rawData?.pensions?.length > 0
                          ? "#4ade80"
                          : "#6b7280",
                    }}
                  >
                    {simulationData?.rawData?.pensions?.length > 0
                      ? "확인됨"
                      : "대기중"}
                  </span>
                </div>
                <div className={styles.dataCheckItem}>
                  <div className={styles.dataCheckLabel}>
                    <i className="fas fa-building"></i>
                    <span>
                      부동산 ({simulationData?.rawData?.realEstates?.length || 0})
                    </span>
                  </div>
                  <span
                    className={styles.statusPending}
                    style={{
                      color:
                        simulationData?.rawData?.realEstates?.length > 0
                          ? "#4ade80"
                          : "#6b7280",
                    }}
                  >
                    {simulationData?.rawData?.realEstates?.length > 0
                      ? "확인됨"
                      : "대기중"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 주요 생애 이벤트 */}
          <div className={styles.card}>
            <span className={styles.cardNumber}>03</span>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>
                <i className="fas fa-calendar-days"></i>
              </div>
              <h2 className={styles.cardTitle}>주요 생애 이벤트(Events)</h2>
            </div>
            <div className={styles.cardContent}>
              {predictedEvents && predictedEvents.length > 0 ? (
                <>
                  <div className={styles.aiPredictionLabel}>
                    <i className="fas fa-chart-line"></i>
                    <span>시뮬레이션 분석 결과 (5천만원 이상)</span>
                  </div>
                  {predictedEvents.map((event, index) => (
                    <div key={index} className={styles.checkItem}>
                      <i
                        className="fas fa-circle"
                        style={{
                          color: event.amount > 0 ? "#10B981" : "#EF4444",
                          fontSize: "8px",
                        }}
                      ></i>
                      <span>
                        <strong>
                          {event.year}년 ({event.age}세):
                        </strong>{" "}
                        {event.description}{" "}
                        <span
                          style={{
                            color: event.amount > 0 ? "#10B981" : "#EF4444",
                            fontWeight: "700",
                          }}
                        >
                          {event.amount > 0 ? "+" : "-"}
                          {(Math.abs(event.amount) / 10000).toFixed(1)}억원
                        </span>
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <p className={styles.emptyText}>
                  5천만원 이상의 주요 생애 이벤트가 없습니다.
                  <br />
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>
                    (저축 수령, 연금 지급 등 특별 이벤트가 표시됩니다)
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Card 4: 시뮬레이션 가정 */}
          <div className={styles.card}>
            <div className={styles.cornerAccentBR}></div>
            <span className={styles.cardNumber}>04</span>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>
                <i className="fas fa-sliders"></i>
              </div>
              <h2 className={styles.cardTitle}>주요 시뮬레이션 가정</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.assumptionGrid}>
                <div className={styles.assumptionItem}>
                  <p className={styles.assumptionLabel}>은퇴 전 생활비</p>
                  <p className={styles.assumptionValue}>
                    월{" "}
                    {simulationData?.rawData?.expenses?.find((e) =>
                      e.name?.includes("생활비")
                    )?.amount || profile?.currentLivingExpenses || 0}
                    만원
                  </p>
                </div>
                <div className={styles.assumptionItem}>
                  <p className={styles.assumptionLabel}>물가 상승률</p>
                  <p className={styles.assumptionValue}>
                    연{" "}
                    {simulationData?.rawData?.expenses?.[0]?.yearlyGrowthRate ||
                      0}
                    % 가정
                  </p>
                </div>
              </div>
              {simulationData?.rawData?.savings &&
                simulationData.rawData.savings.length > 0 && (
                  <div className={styles.checkItem}>
                    <i className="fas fa-check"></i>
                    <span>
                      <strong>저축/적금:</strong>{" "}
                      {simulationData.rawData.savings
                        .map(
                          (s) =>
                            `${s.name} (${s.endYear}년까지 보유 가정, ${s.interestRate * 100}% 이자)`
                        )
                        .join(", ")}
                    </span>
                  </div>
                )}
              {simulationData?.rawData?.debts &&
                simulationData.rawData.debts.length > 0 && (
                  <div className={styles.checkItem}>
                    <i className="fas fa-check"></i>
                    <span>
                      <strong>부채 상환:</strong>{" "}
                      {simulationData.rawData.debts
                        .map((d) => `${d.name} (${d.endYear || d.maturityYear || "?"}년 만기)`)
                        .join(", ")}
                    </span>
                  </div>
                )}
              {simulationData?.rawData?.realEstates &&
                simulationData.rawData.realEstates.length > 0 && (
                  <div className={styles.checkItem}>
                    <i className="fas fa-check"></i>
                    <span>
                      <strong>부동산:</strong>{" "}
                      {simulationData.rawData.realEstates
                        .map(
                          (re) =>
                            `${re.name} (연 ${re.growthRate}% 상승 가정${
                              re.endYear !== 2099
                                ? `, ${re.endYear}년 매도`
                                : ""
                            })`
                        )
                        .join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalVerificationPage;
