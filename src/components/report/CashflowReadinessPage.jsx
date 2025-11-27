import React, { useEffect, useRef } from "react";
import { calculateKoreanAge } from "../../utils/koreanAge";
import { calculateLifetimeCashFlowTotals } from "../../utils/presentValueCalculator";
import styles from "./CashflowReadinessPage.module.css";

/**
 * 은퇴 현금흐름 준비율 진단 페이지 (Page 6)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function CashflowReadinessPage({ profile, simulationData }) {
  const canvasRef = useRef(null);

  // 현재 나이와 은퇴 나이
  const currentAge =
    simulationData?.profile?.currentAge ||
    (profile?.birthYear ? calculateKoreanAge(profile.birthYear) : 42);
  const retirementAge =
    simulationData?.profile?.retirementAge || profile?.retirementAge || 65;

  // 은퇴 후 현금흐름 데이터 추출 (은퇴 이후, 은퇴 시점 제외)
  const cashflowData = simulationData?.simulation?.cashflow || [];
  const retirementYear = simulationData?.profile?.retirementYear || profile?.retirementYear;
  const retirementCashflows = cashflowData.filter(
    (cf) => cf.year > retirementYear
  );

  // calculateLifetimeCashFlowTotals 사용하여 정확한 계산
  const cashflowTotals = calculateLifetimeCashFlowTotals(retirementCashflows);

  console.log("===== Page 6 현금흐름 분석 =====");
  console.log("은퇴 연도:", retirementYear);
  console.log("은퇴 후 cashflow 개수:", retirementCashflows.length);
  console.log("총공급 (만원):", cashflowTotals.totalSupply);
  console.log("총수요 (만원):", cashflowTotals.totalDemand);
  console.log("Supply 항목:", cashflowTotals.supply);
  console.log("Demand 항목:", cashflowTotals.demand);

  // 카테고리별 분류 (supply)
  const categorizeSupply = () => {
    let pension = 0;
    let realEstateInflow = 0;
    let others = 0;

    cashflowTotals.supply.forEach((item) => {
      const amount = item.amount / 10000; // 억원 단위
      const label = item.name || "";
      const category = item.category || "";

      if (label.includes("연금") || category === "연금") {
        pension += amount;
      } else if (
        label.includes("부동산") ||
        label.includes("전세") ||
        label.includes("임대") ||
        label.includes("매도") ||
        category === "부동산"
      ) {
        realEstateInflow += amount;
      } else {
        others += amount;
      }
    });

    return { pension, realEstateInflow, others };
  };

  // 카테고리별 분류 (demand)
  const categorizeDemand = () => {
    let realEstateOutflow = 0;
    let living = 0;
    let medical = 0;
    let finance = 0;

    cashflowTotals.demand.forEach((item) => {
      const amount = item.amount / 10000; // 억원 단위
      const label = item.name || "";
      const category = item.category || "";

      if (
        label.includes("재건축") ||
        label.includes("분담금") ||
        label.includes("전세") ||
        label.includes("상환") ||
        label.includes("반환") ||
        category === "부동산"
      ) {
        realEstateOutflow += amount;
      } else if (label.includes("의료비") || category === "의료비") {
        medical += amount;
      } else if (
        label.includes("이자") ||
        label.includes("금융") ||
        category === "금융비용"
      ) {
        finance += amount;
      } else if (
        label.includes("생활비") ||
        label.includes("관리비") ||
        category === "생활비"
      ) {
        living += amount;
      } else {
        // 기타 지출은 생활비로 분류
        living += amount;
      }
    });

    return { realEstateOutflow, living, medical, finance };
  };

  const supply = categorizeSupply();
  const demand = categorizeDemand();

  const totalSupply = cashflowTotals.totalSupply / 10000; // 억원
  const totalDemand = cashflowTotals.totalDemand / 10000; // 억원
  const shortfall = totalDemand - totalSupply;
  const readinessRate =
    totalDemand > 0 ? (totalSupply / totalDemand) * 100 : 0;

  // 차트 그리기
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set Canvas Resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;

    // Data
    const supplyData = [
      { value: supply.pension, label: "연금소득", color: "#1E3A8A" },
      { value: supply.realEstateInflow, label: "부동산유입", color: "#3B82F6" },
      { value: supply.others, label: "기타자산", color: "#60A5FA" },
      { value: shortfall, label: "부족자금", color: "pattern" },
    ];

    const demandData = [
      {
        value: demand.realEstateOutflow,
        label: "부동산/상환",
        color: "#D97706",
      },
      { value: demand.living, label: "생활/관리비", color: "#F59E0B" },
      { value: demand.medical, label: "의료비", color: "#FBBF24" },
      { value: demand.finance, label: "금융비용", color: "#FDE68A" },
    ];

    // Chart Config
    const padding = { top: 40, bottom: 30, left: 40, right: 120 };
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;
    const barWidth = 80;
    const spacing = (chartWidth - barWidth * 2) / 3;
    const maxValue = Math.ceil(Math.max(totalDemand, totalSupply + shortfall) / 10) * 10;

    // Create Stripe Pattern
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 10;
    pCanvas.height = 10;
    const pCtx = pCanvas.getContext("2d");
    pCtx.strokeStyle = "rgba(239, 68, 68, 0.5)";
    pCtx.lineWidth = 1;
    pCtx.beginPath();
    pCtx.moveTo(0, 10);
    pCtx.lineTo(10, 0);
    pCtx.stroke();
    const stripePattern = ctx.createPattern(pCanvas, "repeat");

    // Drawing Function
    function drawBar(x, data) {
      let currentY = height - padding.bottom;
      data.forEach((item) => {
        const barH = (item.value / maxValue) * chartHeight;
        const y = currentY - barH;

        // Draw Rect
        ctx.fillStyle = item.color === "pattern" ? stripePattern : item.color;
        ctx.fillRect(x, y, barWidth, barH);

        // Border for pattern
        if (item.color === "pattern") {
          ctx.strokeStyle = "#EF4444";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(x, y, barWidth, barH);
          ctx.setLineDash([]);
        }

        // Label
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 11px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (barH > 15) {
          ctx.fillText(item.value.toFixed(1), x + barWidth / 2, y + barH / 2);
        }

        currentY -= barH;
      });
    }

    // Draw Axis Lines
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= maxValue; i += Math.ceil(maxValue / 6)) {
      const y =
        height - padding.bottom - (i / maxValue) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-Axis Labels
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "10px Inter";
      ctx.textAlign = "right";
      ctx.fillText(i, padding.left - 10, y + 3);
    }
    ctx.setLineDash([]);

    // Draw Bars
    const x1 = padding.left + spacing;
    const x2 = x1 + barWidth + spacing;

    drawBar(x1, supplyData);
    drawBar(x2, demandData);

    // X-Axis Labels
    ctx.fillStyle = "#D1D5DB";
    ctx.font = "bold 12px Inter";
    ctx.textAlign = "center";
    ctx.fillText("총공급 (Sources)", x1 + barWidth / 2, height - 10);
    ctx.fillText("총수요 (Uses)", x2 + barWidth / 2, height - 10);

    // Legend
    const legendX = width - 110;
    let legendY = padding.top + 10;

    const allItems = [
      ...supplyData.slice().reverse(),
      { spacer: true },
      ...demandData.slice().reverse(),
    ];

    allItems.forEach((item) => {
      if (item.spacer) {
        legendY += 10;
        return;
      }

      // Box
      ctx.fillStyle = item.color === "pattern" ? stripePattern : item.color;
      ctx.fillRect(legendX, legendY, 12, 12);
      if (item.color === "pattern") {
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, 12, 12);
      }

      // Text
      ctx.fillStyle = "#9CA3AF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "11px Inter";
      ctx.fillText(item.label, legendX + 20, legendY + 6);

      legendY += 20;
    });
  }, [supply, demand, totalDemand, totalSupply, shortfall]);

  return (
    <div className={styles.slideContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerBadges}>
            <span className={styles.stepBadge}>STEP 1-3</span>
            <span className={styles.checklistBadge}>Cashflow Analysis</span>
          </div>
          <h1 className={styles.headerTitle}>은퇴 현금흐름 준비율 진단</h1>
        </div>
        <div className={styles.headerDescription}>
          <p>은퇴 후 발생하는 자금 총수요(생활비, 의료비, 대출상환 등)와 자금 총공급(연금, 부동산 유입 등)을</p>
          <p>정밀 분석하여 생애 주기별 현금흐름 과부족 및 유동성 리스크를 진단합니다.</p>
        </div>
      </div>

      <div className={styles.divider}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column: KPI Cards */}
        <div className={styles.leftColumn}>
          {/* KPI 1: 은퇴 자금 준비율 */}
          <div className={styles.kpiCardCircle}>
            <div className={styles.cardTopBar}>
              <span className={styles.cardTopLabel}>
                은퇴 자금 준비율 (총액)
              </span>
              <i
                className={`fas fa-${readinessRate >= 80 ? "check" : "exclamation"}-circle`}
                style={{
                  color: readinessRate >= 80 ? "#10B981" : "#EAB308",
                }}
              ></i>
            </div>
            <div className={styles.circleChartContainer}>
              <svg className={styles.circleSvg} viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="#1F2937"
                  strokeWidth="10"
                ></circle>
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={readinessRate >= 80 ? "#10B981" : "#EAB308"}
                  strokeWidth="10"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * readinessRate) / 100}
                  transform="rotate(-90 70 70)"
                ></circle>
              </svg>
              <div className={styles.circleCenter}>
                <p className={styles.circleValue}>
                  {readinessRate.toFixed(1)}
                  <span className={styles.circleUnit}>%</span>
                </p>
              </div>
            </div>
            <p className={styles.circleDescription}>
              총수요 {totalDemand.toFixed(1)}억원 대비
              <br />
              <strong>{totalSupply.toFixed(1)}억원</strong> 확보 (
              {shortfall > 0
                ? `부족 ${shortfall.toFixed(1)}억`
                : `초과 ${Math.abs(shortfall).toFixed(1)}억`}
              )
            </p>
          </div>

          {/* KPI 2: 현금흐름 위기 요인 */}
          <div className={styles.kpiCardRisk}>
            <div className={styles.cardTopBar}>
              <span className={styles.cardTopLabel}>현금흐름 위기 요인</span>
              <i className="fas fa-exclamation-triangle" style={{ color: "#EF4444" }}></i>
            </div>
            <div className={styles.riskTitle}>
              {demand.realEstateOutflow > demand.living
                ? "부동산 유동성"
                : "생활비 부담"}
            </div>
            <p className={styles.riskDescription}>
              {demand.realEstateOutflow > demand.living ? (
                <>
                  재건축 분담금, 전세금 반환 등
                  <br />
                  대규모 자금 수요가 약{" "}
                  <strong>{demand.realEstateOutflow.toFixed(1)}억원</strong>에
                  달해
                  <br />
                  현금 유동성 압박이 심각합니다.
                </>
              ) : (
                <>
                  생활비 및 의료비 등
                  <br />
                  고정 지출이 약{" "}
                  <strong>
                    {(demand.living + demand.medical).toFixed(1)}억원
                  </strong>
                  에 달해
                  <br />
                  현금흐름 부담이 있습니다.
                </>
              )}
            </p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${readinessRate > 100 ? 100 : readinessRate}%` }}
              ></div>
            </div>
            <div className={styles.progressLabels}>
              <span>자금공급</span>
              <span>자금수요</span>
            </div>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className={styles.rightColumn}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <i className="fas fa-chart-pie"></i>
              은퇴 후 자금 총수요 vs 총공급 세부 구성
            </h3>
            <div className={styles.chartUnit}>단위: 억원</div>
          </div>

          {/* Summary Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>은퇴 자금 총수요</span>
                <i className="fas fa-shopping-cart" style={{ color: "#EAB308" }}></i>
              </div>
              <div className={styles.statValue} style={{ color: "#EAB308" }}>
                {totalDemand.toFixed(1)}억원
              </div>
              <div className={styles.statLabel}>
                재건축/상환 + 생활/의료비
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>은퇴 자금 총공급</span>
                <i className="fas fa-hand-holding-dollar" style={{ color: "#3B82F6" }}></i>
              </div>
              <div className={styles.statValue} style={{ color: "#3B82F6" }}>
                {totalSupply.toFixed(1)}억원
              </div>
              <div className={styles.statLabel}>연금 + 부동산유입 + 기타</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>부족 자금 (Shortfall)</span>
                <i className="fas fa-minus-circle" style={{ color: "#EF4444" }}></i>
              </div>
              <div className={styles.statValue} style={{ color: "#EF4444" }}>
                {shortfall > 0 ? shortfall.toFixed(1) : "0.0"}억원
              </div>
              <div className={styles.statLabel}>순현금흐름 적자 발생</div>
            </div>
          </div>

          {/* Canvas Chart */}
          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef}></canvas>
          </div>

          {/* Insight */}
          <div className={styles.insightBox}>
            <div className={styles.insightSection}>
              <p className={styles.insightLabel} style={{ color: "#EF4444" }}>
                RISK POINT
              </p>
              <p className={styles.insightText}>
                {demand.realEstateOutflow > 10 ? (
                  <>
                    재건축 분담금, 전세자금 반환 등{" "}
                    <strong>
                      부동산 관련 대규모 지출(
                      {demand.realEstateOutflow.toFixed(1)}억)
                    </strong>
                    과 생활/의료비로 인해{" "}
                    <strong style={{ color: "#EF4444" }}>
                      약 {shortfall.toFixed(1)}억원의 심각한 자금 부족
                    </strong>
                    이 예상됩니다.
                  </>
                ) : (
                  <>
                    생활비와 의료비 등 고정 지출로 인해{" "}
                    <strong style={{ color: "#EF4444" }}>
                      약 {shortfall.toFixed(1)}억원의 자금 부족
                    </strong>
                    이 예상됩니다.
                  </>
                )}
              </p>
            </div>
            <div className={styles.insightSection}>
              <p className={styles.insightLabel} style={{ color: "#10B981" }}>
                SOLUTION
              </p>
              <p className={styles.insightText}>
                {demand.realEstateOutflow > 10 ? (
                  <>
                    <strong>
                      부동산 자산 유동화(담보대출 또는 다운사이징)
                    </strong>
                    가 필수적이며, 재건축 시기 전세 자금 운용 계획과 의료비(
                    {demand.medical.toFixed(1)}억)에 대한 점검이 필요합니다.
                  </>
                ) : (
                  <>
                    <strong>연금 소득 확대 및 지출 최적화</strong>가
                    필요하며, 의료비({demand.medical.toFixed(1)}억) 대비 보험
                    점검이 필요합니다.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default CashflowReadinessPage;
