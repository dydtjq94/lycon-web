import React, { useState } from "react";
import styles from "./InvestmentSuitabilityPage.module.css";

/**
 * 투자 성향 및 적합성 평가 (Page 24)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function InvestmentSuitabilityPage({ profile, simulationData }) {
  // 체크리스트 상태 관리
  const [checklist, setChecklist] = useState({
    q1: false,  // 원금 손실 감내
    q2: false,  // 장기 투자
    q3: false,  // 비상 예비자금
    q4: false,  // 투자 경험
    q5: false,  // 기대 수익률
  });

  // 현재 나이
  const currentAge =
    simulationData?.profile?.currentAge || profile?.age || 60;
  const retirementAge =
    simulationData?.profile?.retirementAge || profile?.retirementAge || 65;

  // 현재 자산 데이터
  const assets = simulationData?.simulation?.assets || [];
  const currentAssets = assets[0] || {};
  const totalAssets = currentAssets?.breakdown?.totalAssets || 0;
  const assetItems = currentAssets?.breakdown?.assetItems || [];

  // 부동산 비중 계산
  const realEstateAssets = assetItems.filter(
    (item) => item.sourceType === "realEstate"
  );
  const realEstateTotal = realEstateAssets.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const realEstateRatio =
    totalAssets > 0 ? (realEstateTotal / totalAssets) * 100 : 0;

  // 구조적 적자 계산 (간단한 추정)
  const cashflow = simulationData?.simulation?.cashflow || [];
  const retirementStartIndex = retirementAge - currentAge;
  const retirementCashflow = cashflow.slice(retirementStartIndex);

  let totalIncome = 0;
  let totalExpense = 0;

  retirementCashflow.forEach((year) => {
    totalIncome += year.pension || 0;
    totalIncome += year.rentalIncome || 0;
    totalExpense += year.expense || 0;
    totalExpense += Math.abs(year.debtInterest || 0);
  });

  const annualDeficit =
    retirementCashflow.length > 0
      ? (totalIncome - totalExpense) / retirementCashflow.length
      : 0;

  // 체크 토글 함수
  const toggleCheck = (key) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 체크된 항목 수 계산
  const checkedCount = Object.values(checklist).filter(Boolean).length;

  // 위험 성향 매트릭스 결정 (심리적 감내도 + 재무적 수용력)
  // 심리적 감내도: 체크된 항목 수에 따라
  // 재무적 수용력: 비상예비자금(q3) 여부에 따라
  let riskType = "안정형";
  let riskTypeEn = "Conservative";
  let psychologicalLevel = "보통"; // 보통, 높음
  let financialLevel = "낮음"; // 낮음, 높음

  // 심리적 감내도 계산
  if (checkedCount >= 4) {
    psychologicalLevel = "높음";
  } else {
    psychologicalLevel = "보통";
  }

  // 재무적 수용력 계산 (q3 체크 여부)
  if (checklist.q3) {
    financialLevel = "높음";
  } else {
    financialLevel = "낮음";
  }

  // 매트릭스 결정
  if (psychologicalLevel === "높음" && financialLevel === "높음") {
    riskType = "공격형";
    riskTypeEn = "Aggressive";
  } else if (psychologicalLevel === "높음" && financialLevel === "낮음") {
    riskType = "적극형";
    riskTypeEn = "Active";
  } else if (psychologicalLevel === "보통" && financialLevel === "높음") {
    riskType = "중립형";
    riskTypeEn = "Moderate";
  } else {
    riskType = "안정형";
    riskTypeEn = "Conservative";
  }

  // 적합성 등급 계산
  let suitabilityRating = "적합";
  let suitabilityColor = styles.dotGreen;
  let suitabilityText = "적합 (Fit)";

  if (!checklist.q3) {
    suitabilityRating = "주의";
    suitabilityColor = styles.dotRed;
    suitabilityText = "주의 (Attention)";
  } else if (checkedCount >= 4) {
    suitabilityRating = "적합";
    suitabilityColor = styles.dotGreen;
    suitabilityText = "적합 (Fit)";
  } else if (checkedCount >= 3) {
    suitabilityRating = "보통";
    suitabilityColor = styles.dotYellow;
    suitabilityText = "보통 (Moderate)";
  } else {
    suitabilityRating = "주의";
    suitabilityColor = styles.dotRed;
    suitabilityText = "주의 (Attention)";
  }

  // 최종 판단 메시지
  let judgmentMessage = "";
  let suitabilityLabel = "적합";

  if (!checklist.q3) {
    judgmentMessage = "유동성 부족";
    suitabilityLabel = "부적합";
  } else if (realEstateRatio > 60) {
    judgmentMessage = "부동산 편중";
    suitabilityLabel = "부적합";
  } else if (checkedCount >= 4) {
    judgmentMessage = "균형 잡힌 포트폴리오";
    suitabilityLabel = "적합";
  } else {
    judgmentMessage = "일부 개선 필요";
    suitabilityLabel = "보통";
  }

  return (
    <div className={styles.slideContainer}>
      {/* Background Texture */}
      <div className={styles.backgroundTexture}></div>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerBadges}>
            <span className={styles.stepBadge}>STEP 3</span>
            <span className={styles.sectionBadge}>
              Investment Suitability
            </span>
          </div>
          <h1 className={styles.headerTitle}>투자 성향 및 적합성 평가</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.cardsGrid}>
          {/* Card 1: 투자 성향 체크리스트 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <i className="fas fa-list-check"></i>
              </div>
              <h2 className={styles.cardTitle}>
                투자 성향 자가진단 (Checklist)
              </h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.checklistItems}>
                <div
                  className={styles.checklistItem}
                  onClick={() => toggleCheck("q1")}
                  style={{ cursor: "pointer" }}
                >
                  <p className={styles.checklistText}>
                    1. 원금의 <span>1~10% 손실</span>을 감내할 수 있습니까?
                  </p>
                  <i
                    className={
                      checklist.q1
                        ? `fas fa-check-square ${styles.checked}`
                        : `fas fa-square-xmark ${styles.unchecked}`
                    }
                  ></i>
                </div>
                <div
                  className={styles.checklistItem}
                  onClick={() => toggleCheck("q2")}
                  style={{ cursor: "pointer" }}
                >
                  <p className={styles.checklistText}>
                    2. <span>5년 이상</span> 장기 투자가 가능합니까?
                  </p>
                  <i
                    className={
                      checklist.q2
                        ? `fas fa-check-square ${styles.checked}`
                        : `fas fa-square-xmark ${styles.unchecked}`
                    }
                  ></i>
                </div>
                <div
                  className={styles.checklistItem}
                  onClick={() => toggleCheck("q3")}
                  style={{ cursor: "pointer" }}
                >
                  <p className={styles.checklistText}>
                    3. <span>3~6개월 생활비</span>(현금)를 확보했습니까?
                  </p>
                  <i
                    className={
                      checklist.q3
                        ? `fas fa-check-square ${styles.checked}`
                        : `fas fa-square-xmark ${styles.unchecked}`
                    }
                  ></i>
                </div>
                <div
                  className={styles.checklistItem}
                  onClick={() => toggleCheck("q4")}
                  style={{ cursor: "pointer" }}
                >
                  <p className={styles.checklistText}>
                    4. 주식/펀드 투자 경험이 <span>3년 이상</span>입니까?
                  </p>
                  <i
                    className={
                      checklist.q4
                        ? `fas fa-check-square ${styles.checked}`
                        : `fas fa-square-xmark ${styles.unchecked}`
                    }
                  ></i>
                </div>
                <div
                  className={styles.checklistItem}
                  onClick={() => toggleCheck("q5")}
                  style={{ cursor: "pointer" }}
                >
                  <p className={styles.checklistText}>
                    5. 연 <span>5~7% 수준</span>의 기대 수익을 추구합니까?
                  </p>
                  <i
                    className={
                      checklist.q5
                        ? `fas fa-check-square ${styles.checked}`
                        : `fas fa-square-xmark ${styles.unchecked}`
                    }
                  ></i>
                </div>
              </div>

              {/* 동적 경고/안내 메시지 */}
              {!checklist.q3 && (
                <div className={styles.warningBox}>
                  <i className="fas fa-triangle-exclamation"></i>
                  <p>경고: 비상 예비자금(유동성) 확보 미흡</p>
                </div>
              )}
              {checklist.q3 && !checklist.q1 && (
                <div className={`${styles.warningBox} ${styles.infoBox}`}>
                  <i className="fas fa-info-circle"></i>
                  <p>주의: 손실 감내력이 부족합니다</p>
                </div>
              )}
              {checklist.q3 && checklist.q1 && !checklist.q2 && (
                <div className={`${styles.warningBox} ${styles.infoBox}`}>
                  <i className="fas fa-info-circle"></i>
                  <p>주의: 단기 투자는 변동성이 높습니다</p>
                </div>
              )}
              {checklist.q3 && checklist.q1 && checklist.q2 && !checklist.q4 && (
                <div className={`${styles.warningBox} ${styles.cautionBox}`}>
                  <i className="fas fa-exclamation-circle"></i>
                  <p>권장: 투자 경험 쌓기를 추천합니다</p>
                </div>
              )}
              {checkedCount === 5 && (
                <div className={`${styles.warningBox} ${styles.successBox}`}>
                  <i className="fas fa-check-circle"></i>
                  <p>우수: 투자 준비가 잘 되어 있습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: 위험 성향 매트릭스 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <i className="fas fa-chart-pie"></i>
              </div>
              <h2 className={styles.cardTitle}>위험 수용력 vs 감내도 분석</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.matrixContainer}>
                <div className={styles.matrixWrapper}>
                  <div className={styles.axisLabelTop}>위험 감내도 (심리)</div>
                  <div className={styles.axisLabelLeft}>
                    위험 수용력 (재무)
                  </div>

                  <div className={styles.matrixGrid}>
                    <div
                      className={`${styles.matrixCell} ${
                        riskType === "공격형" ? styles.active : ""
                      }`}
                    >
                      <span
                        className={
                          riskType === "공격형" ? styles.activeText : ""
                        }
                      >
                        공격형
                      </span>
                      {riskType === "공격형" && (
                        <div className={styles.activeDot}></div>
                      )}
                    </div>
                    <div
                      className={`${styles.matrixCell} ${
                        riskType === "적극형" ? styles.active : ""
                      }`}
                    >
                      <span
                        className={
                          riskType === "적극형" ? styles.activeText : ""
                        }
                      >
                        적극형
                      </span>
                      {riskType === "적극형" && (
                        <div className={styles.activeDot}></div>
                      )}
                    </div>
                    <div
                      className={`${styles.matrixCell} ${
                        riskType === "중립형" ? styles.active : ""
                      }`}
                    >
                      <span
                        className={
                          riskType === "중립형" ? styles.activeText : ""
                        }
                      >
                        중립형
                      </span>
                      {riskType === "중립형" && (
                        <div className={styles.activeDot}></div>
                      )}
                    </div>
                    <div
                      className={`${styles.matrixCell} ${
                        riskType === "안정형" ? styles.active : ""
                      }`}
                    >
                      <span
                        className={
                          riskType === "안정형" ? styles.activeText : ""
                        }
                      >
                        안정형
                      </span>
                      {riskType === "안정형" && (
                        <div className={styles.activeDot}></div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.matrixSummary}>
                  <div className={styles.resultBox}>
                    <p className={styles.resultLabel}>진단 결과</p>
                    <p className={styles.resultValue}>{riskType}</p>
                    <p className={styles.resultSubtext}>({riskTypeEn})</p>
                  </div>
                  <div className={styles.resultDescription}>
                    <p>심리적 감내도 {psychologicalLevel},</p>
                    <p className={financialLevel === "낮음" ? styles.warning : ""}>
                      재무적 수용력 {financialLevel}
                    </p>
                    <p>
                      {financialLevel === "낮음"
                        ? "보수적 접근 요구됨"
                        : "균형잡힌 투자 가능"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 적합성 진단 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <i className="fas fa-user-shield"></i>
              </div>
              <h2 className={styles.cardTitle}>
                투자 적합성 진단 (Fit Check)
              </h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.fitCheckItems}>
                <div className={styles.fitCheckBox}>
                  <div className={styles.fitCheckHeader}>
                    <i className="fas fa-hourglass-half"></i>
                    <p>
                      생애주기: <span>{currentAge}세 (은퇴 임박)</span>
                    </p>
                  </div>
                  <p className={styles.fitCheckText}>
                    자산 증식보다는{" "}
                    <span>자산 보존 및 현금흐름 창출</span> 우선
                  </p>
                </div>

                <div className={styles.fitCheckBox}>
                  <div className={styles.fitCheckHeader}>
                    <i className="fas fa-wallet"></i>
                    <p>
                      현금흐름:{" "}
                      <span>
                        연 {(Math.abs(annualDeficit) / 10000).toFixed(0)}만원
                        부족
                      </span>
                    </p>
                  </div>
                  <p className={styles.fitCheckText}>
                    적극적 투자보다{" "}
                    <span>확정적 인컴(배당/이자) 확보</span> 시급
                  </p>
                </div>

                <div className={styles.fitCheckBox}>
                  <div className={styles.fitCheckHeader}>
                    <i className="fas fa-building"></i>
                    <p>
                      자산구성:{" "}
                      <span>부동산 {realEstateRatio.toFixed(0)}% 집중</span>
                    </p>
                  </div>
                  <p className={styles.fitCheckText}>
                    환금성 위험 노출, <span>금융자산 비중 확대</span> 필수
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: 최종 판단 */}
          <div className={styles.card}>
            <div className={styles.cornerAccent}></div>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <i className="fas fa-lightbulb"></i>
              </div>
              <h2 className={styles.cardTitle}>최종 판단 및 고려사항</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.finalJudgment}>
                <p className={styles.judgmentIntro}>
                  귀하의 포트폴리오는 <strong>{judgmentMessage}</strong>
                  {!checklist.q3 && "과"}{" "}
                  {realEstateRatio > 60 && (
                    <strong>부동산 편중</strong>
                  )}으로 안정성 기준에{" "}
                  <span
                    className={
                      suitabilityLabel === "부적합" ? styles.unsuitable : ""
                    }
                  >
                    {suitabilityLabel}
                  </span>
                  합니다.
                </p>

                <ul className={styles.actionList}>
                  {!checklist.q3 && (
                    <li>
                      <i className="fas fa-arrow-right"></i>
                      <span>
                        <strong>즉시 조치:</strong> 비상 예비자금(3~6개월)
                        최우선 확보
                      </span>
                    </li>
                  )}
                  {realEstateRatio > 60 && (
                    <li>
                      <i className="fas fa-arrow-right"></i>
                      <span>
                        <strong>자산 배분:</strong> 부동산 유동화 또는
                        담보대출 활용 검토
                      </span>
                    </li>
                  )}
                  <li>
                    <i className="fas fa-arrow-right"></i>
                    <span>
                      <strong>투자 상품:</strong> 월지급식 ETF 등 인컴형 상품
                      편입
                    </span>
                  </li>
                  {checkedCount >= 4 && checklist.q3 && (
                    <li>
                      <i className="fas fa-arrow-right"></i>
                      <span>
                        <strong>리스크 관리:</strong> 정기적 리밸런싱으로
                        목표 비중 유지
                      </span>
                    </li>
                  )}
                </ul>

                <div className={styles.ratingBar}>
                  <span className={styles.ratingLabel}>적합성 등급</span>
                  <div className={styles.ratingIndicator}>
                    <div className={styles.ratingDots}>
                      <div
                        className={styles.dotGreen}
                        style={{
                          opacity:
                            suitabilityRating === "적합" ? 1 : 0.2,
                        }}
                      ></div>
                      <div
                        className={styles.dotYellow}
                        style={{
                          opacity:
                            suitabilityRating === "보통" ? 1 : 0.2,
                        }}
                      ></div>
                      <div
                        className={styles.dotRed}
                        style={{
                          opacity:
                            suitabilityRating === "주의" ? 1 : 0.2,
                        }}
                      ></div>
                    </div>
                    <span className={styles.ratingText}>
                      {suitabilityText}
                    </span>
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

export default InvestmentSuitabilityPage;
