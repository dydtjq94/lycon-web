import React from "react";
import styles from "./DeficitSolutionPage.module.css";

/**
 * 적자 유형별 해결 방안 (Page 21)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function DeficitSolutionPage({ profile, simulationData }) {
  // 현재 나이와 은퇴 나이
  const currentAge =
    simulationData?.profile?.currentAge || profile?.age || 42;
  const retirementAge =
    simulationData?.profile?.retirementAge || profile?.retirementAge || 65;

  // 은퇴 후 기간 계산
  const retirementYears = 90 - retirementAge;
  const retirementStartIndex = retirementAge - currentAge;

  // 현금흐름 데이터
  const cashflow = simulationData?.simulation?.cashflow || [];
  const retirementCashflow = cashflow.slice(
    retirementStartIndex,
    retirementStartIndex + retirementYears
  );

  // 구조적 수입/지출 계산
  let totalStructuralIncome = 0;
  let totalStructuralExpense = 0;

  retirementCashflow.forEach((year) => {
    // 구조적 수입
    totalStructuralIncome += year.pension || 0;
    totalStructuralIncome += year.rentalIncome || 0;

    // 구조적 지출
    totalStructuralExpense += year.expense || 0;
    totalStructuralExpense += Math.abs(year.debtInterest || 0);
  });

  const structuralDeficit = totalStructuralIncome - totalStructuralExpense;
  const annualStructuralDeficit = structuralDeficit / retirementYears;
  const monthlyStructuralDeficit = annualStructuralDeficit / 12;

  // 배당/이자 소득으로 해결 시 필요 자산
  const requiredAsset35 = Math.abs(annualStructuralDeficit) / 0.035; // 3.5% 수익률
  const requiredAsset40 = Math.abs(annualStructuralDeficit) / 0.04; // 4.0% 수익률

  // SWR 기반 필요 자산
  const requiredAssetSWR30 = Math.abs(annualStructuralDeficit) / 0.03; // 3.0% SWR
  const requiredAssetSWR35 = Math.abs(annualStructuralDeficit) / 0.035; // 3.5% SWR
  const requiredAssetSWR40 = Math.abs(annualStructuralDeficit) / 0.04; // 4.0% SWR

  return (
    <div className={styles.slideContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerBadges}>
            <span className={styles.stepBadge}>STEP 2-3</span>
            <span className={styles.sectionBadge}>
              Deficit Solutions &amp; Strategies
            </span>
          </div>
          <h1 className={styles.headerTitle}>적자 유형별 해결 방안</h1>
        </div>
        <div className={styles.headerDescription}>
          <p>
            이벤트성 적자는 심플한 유동성 확보 전략으로, 구조적 적자는 정교한
            자산 인출 전략으로 대응합니다.
          </p>
          <p>
            목표 수익률과 SWR(안전 인출률)에 따른 구체적인 필요 자산 규모를
            제시합니다.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column: Event Deficit Solutions */}
        <div className={styles.leftColumn}>
          <div className={styles.eventCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitleYellow}>
                <i className="fas fa-bolt"></i> 이벤트성 적자 대응
              </h3>
            </div>
            <div className={styles.eventContent}>
              <p className={styles.eventInfo}>
                <i className="fas fa-info-circle"></i> 예측 가능한 대규모 지출을
                위한 핵심 전략 2가지
              </p>

              <div className={styles.strategies}>
                {/* Strategy 1 */}
                <div className={styles.strategyCard}>
                  <h4 className={styles.strategyTitle}>
                    <span className={styles.stepCircle}>1</span>
                    별도 '이벤트 지출 대비 계좌'
                  </h4>
                  <p className={styles.strategyText}>
                    재건축/결혼자금 등 목적자금은
                    <br />
                    MMF/단기채 등 <strong>안전자산으로 분리</strong>하여 관리
                  </p>
                </div>

                {/* Strategy 2 */}
                <div className={styles.strategyCard}>
                  <h4 className={styles.strategyTitle}>
                    <span className={styles.stepCircle}>2</span>
                    보유 자산 활용
                  </h4>
                  <p className={styles.strategyText}>
                    자산 매각이 불리할 경우, 자산<strong> 담보대출</strong>(LTV)
                    활용하여 유동성 확보
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Structural Deficit Solutions */}
        <div className={styles.rightColumn}>
          <div className={styles.structuralCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitleBlue}>
                <i className="fas fa-layer-group"></i> 구조적 적자 대응 상세
                가이드
              </h3>
              <span className={styles.cardBadge}>Cashflow Solution</span>
            </div>

            <div className={styles.structuralContent}>
              {/* Section 1: Deficit Analysis */}
              <div className={styles.deficitAnalysis}>
                <div className={styles.analysisLeft}>
                  <div className={styles.analysisIcon}>
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div>
                    <h4 className={styles.analysisTitle}>
                      ① 연간 평균 구조적 부족액
                    </h4>
                    <p className={styles.analysisSubtitle}>
                      은퇴 기간({retirementYears}년) 동안 매년 부족한 필수 생활비
                      규모
                    </p>
                  </div>
                </div>
                <div className={styles.analysisRight}>
                  <p className={styles.analysisValue}>
                    {(Math.abs(annualStructuralDeficit) / 10000).toFixed(0)}{" "}
                    <span>만원/년</span>
                  </p>
                  <p className={styles.analysisNote}>
                    (월 약 {(Math.abs(monthlyStructuralDeficit) / 10000).toFixed(0)}
                    만원 부족)
                  </p>
                </div>
              </div>

              {/* Section 2 & 3: Solutions Grid */}
              <div className={styles.solutionsGrid}>
                {/* Dividend/Interest Solution */}
                <div className={styles.solutionCard}>
                  <h4 className={styles.solutionTitle}>
                    <span>② 배당/이자 소득으로 해결 시</span>
                    <i className="fas fa-hand-holding-dollar"></i>
                  </h4>
                  <p className={styles.solutionInfo}>
                    <i className="fas fa-info-circle"></i> 원금 보존, 발생
                    수익(Income)만으로 부족액 충당 시<br />
                    필요 자산 규모
                  </p>

                  <div className={styles.solutionOptions}>
                    <div className={styles.optionCard}>
                      <div className={styles.optionHeader}>
                        <span className={styles.optionRate}>
                          목표 수익률 3.5%
                        </span>
                        <span className={styles.optionType}>
                          안정형 (배당+채권)
                        </span>
                      </div>
                      <div className={styles.optionFooter}>
                        <span className={styles.optionLabel}>필요 금융자산</span>
                        <span className={styles.optionValue}>
                          {(requiredAsset35 / 100000000).toFixed(2)}{" "}
                          <span>억원</span>
                        </span>
                      </div>
                    </div>

                    <div className={styles.optionCard}>
                      <div className={styles.optionHeader}>
                        <span className={styles.optionRate}>
                          목표 수익률 4.0%
                        </span>
                        <span className={styles.optionType}>성장형 (배당주)</span>
                      </div>
                      <div className={styles.optionFooter}>
                        <span className={styles.optionLabel}>필요 금융자산</span>
                        <span className={styles.optionValue}>
                          {(requiredAsset40 / 100000000).toFixed(2)}{" "}
                          <span>억원</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SWR Solution */}
                <div className={styles.solutionCard}>
                  <h4 className={styles.solutionTitleGreen}>
                    <span>③ SWR 기반 인출 시 (원금 활용)</span>
                    <i className="fas fa-chart-line"></i>
                  </h4>
                  <p className={styles.solutionInfo}>
                    <i className="fas fa-info-circle"></i>{" "}
                    <strong className={styles.swrHighlight}>SWR</strong>: 자산
                    고갈 없이 은퇴 기간 안전하게 인출 가능한 비율 (예: 4% 룰)
                  </p>

                  <div className={styles.swrOptions}>
                    <div className={styles.swrCard}>
                      <div className={styles.swrLeft}>
                        <span className={styles.swrRate}>SWR 3.0%</span>
                        <span className={styles.swrType}>
                          보수적 (장수 리스크 대비)
                        </span>
                      </div>
                      <div className={styles.swrRight}>
                        <span className={styles.swrValue}>
                          {(requiredAssetSWR30 / 100000000).toFixed(2)}{" "}
                          <span>억원</span>
                        </span>
                      </div>
                    </div>

                    <div className={styles.swrCard}>
                      <div className={styles.swrLeft}>
                        <span className={styles.swrRate}>SWR 3.5%</span>
                        <span className={styles.swrType}>중립적 (균형 접근)</span>
                      </div>
                      <div className={styles.swrRight}>
                        <span className={styles.swrValue}>
                          {(requiredAssetSWR35 / 100000000).toFixed(2)}{" "}
                          <span>억원</span>
                        </span>
                      </div>
                    </div>

                    <div className={styles.swrCard}>
                      <div className={styles.swrLeft}>
                        <span className={styles.swrRate}>SWR 4.0%</span>
                        <span className={styles.swrType}>
                          전통적 (Trinity Study)
                        </span>
                      </div>
                      <div className={styles.swrRight}>
                        <span className={styles.swrValue}>
                          {(requiredAssetSWR40 / 100000000).toFixed(2)}{" "}
                          <span>억원</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeficitSolutionPage;
