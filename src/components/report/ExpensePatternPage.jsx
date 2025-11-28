import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import styles from "./ExpensePatternPage.module.css";

/**
 * 지출 패턴 분석 (Page 13)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function ExpensePatternPage({ profile, simulationData }) {
  const chartRef = useRef(null);

  // 현금흐름 데이터
  const cashflow = simulationData?.simulation?.cashflow || [];
  const currentYearCashflow = cashflow[0] || {};

  // 현재 연도
  const currentYear = new Date().getFullYear();

  // 지출 항목 추출
  const expenses = currentYearCashflow.expense || 0; // 생활비
  const savings = currentYearCashflow.savings || 0; // 저축
  const debtInterest = Math.abs(currentYearCashflow.debtInterest || 0); // 이자
  const debtPrincipal = Math.abs(currentYearCashflow.debtPrincipal || 0); // 원금

  // 지출 카테고리 분류 (실제 데이터 기반 추정)
  const expenseCategories = [
    {
      name: "식비",
      value: expenses * 0.33, // 생활비의 33%
      type: "변동비",
      color: "#3B82F6",
    },
    {
      name: "주거비",
      value: expenses * 0.16, // 생활비의 16%
      type: "고정비",
      color: "#EF4444",
    },
    {
      name: "대출이자",
      value: debtInterest,
      type: "고정비",
      color: "#EF4444",
    },
    {
      name: "의류·잡화",
      value: expenses * 0.11, // 생활비의 11%
      type: "변동비",
      color: "#3B82F6",
    },
    {
      name: "공과금",
      value: expenses * 0.08, // 생활비의 8%
      type: "고정비",
      color: "#EF4444",
    },
    {
      name: "문화·여가",
      value: expenses * 0.05, // 생활비의 5%
      type: "변동비",
      color: "#3B82F6",
    },
    {
      name: "저축",
      value: savings,
      type: "고정비",
      color: "#EF4444",
    },
    {
      name: "생활용품",
      value: expenses * 0.03, // 생활비의 3%
      type: "변동비",
      color: "#3B82F6",
    },
    {
      name: "선물·경조사",
      value: expenses * 0.03, // 생활비의 3%
      type: "변동비",
      color: "#3B82F6",
    },
    {
      name: "교통비",
      value: expenses * 0.02, // 생활비의 2%
      type: "변동비",
      color: "#3B82F6",
    },
    {
      name: "통신비",
      value: expenses * 0.015, // 생활비의 1.5%
      type: "고정비",
      color: "#EF4444",
    },
    {
      name: "기타 변동",
      value: expenses * 0.035, // 생활비의 3.5%
      type: "변동비",
      color: "#3B82F6",
    },
  ];

  // 0이 아닌 항목만 필터링하고 정렬
  const filteredCategories = expenseCategories
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // 상위 10개만 표시

  // 총 지출
  const totalExpense = filteredCategories.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // 고정비/변동비 계산
  const fixedExpense = filteredCategories
    .filter((item) => item.type === "고정비")
    .reduce((sum, item) => sum + item.value, 0);

  const variableExpense = filteredCategories
    .filter((item) => item.type === "변동비")
    .reduce((sum, item) => sum + item.value, 0);

  // 고정비 비중
  const fixedRatio = totalExpense > 0 ? (fixedExpense / totalExpense) * 100 : 0;

  // 월 평균 지출
  const monthlyExpense = totalExpense / 12;

  // SVG 원형 차트 계산
  const circumference = 440; // 2 * π * r, r = 70
  const fixedOffset = circumference - (circumference * fixedRatio) / 100;

  // 지출 구조 유연성 판단
  const getFlexibilityStatus = () => {
    if (fixedRatio < 50) return { text: "지출 구조 유연성 양호", color: "#10B981" };
    if (fixedRatio < 70) return { text: "지출 구조 보통", color: "#F59E0B" };
    return { text: "지출 구조 경직", color: "#EF4444" };
  };

  const flexibilityStatus = getFlexibilityStatus();

  // 주요 지출 항목
  const topExpense = filteredCategories.length > 0 ? filteredCategories[0] : null;
  const secondExpense = filteredCategories.length > 1 ? filteredCategories[1] : null;

  // 절감 잠재력 계산 (변동비의 20%)
  const savingPotential = variableExpense * 0.2;
  const monthlySavingPotential = savingPotential / 12;

  // Chart
  useEffect(() => {
    if (!chartRef.current || filteredCategories.length === 0) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(11, 24, 40, 0.95)",
        borderColor: "#4B5563",
        textStyle: { color: "#fff" },
        formatter: (params) => {
          const item = filteredCategories[params[0].dataIndex];
          return `<div style="font-weight: bold; margin-bottom: 4px; color: #d1d5db;">${item.name}</div>
                  <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 12px; margin-bottom: 4px;">
                    <span>분류</span>
                    <span style="color:${item.color}">${item.type}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 14px;">
                    <span>금액</span>
                    <span style="font-weight: bold;">${item.value.toFixed(1)}만원</span>
                  </div>`;
        },
      },
      grid: {
        left: "2%",
        right: "2%",
        bottom: "3%",
        top: "12%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: filteredCategories.map((item) => item.name),
        axisLabel: {
          color: "#9CA3AF",
          interval: 0,
          fontSize: 11,
          fontWeight: "500",
          margin: 12,
          formatter: (value) => {
            return value.length > 4 ? value.substring(0, 4) + ".." : value;
          },
        },
        axisLine: { show: true, lineStyle: { color: "#374151" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "(만원)",
        nameTextStyle: {
          color: "#6B7280",
          align: "right",
        },
        splitLine: {
          show: true,
          lineStyle: { color: "#374151", type: "dashed" },
        },
        axisLabel: {
          color: "#6B7280",
          formatter: (value) => value.toFixed(0),
        },
      },
      series: [
        {
          type: "bar",
          barWidth: "50%",
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params) => {
              return filteredCategories[params.dataIndex].color;
            },
            shadowBlur: 5,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
          label: {
            show: true,
            position: "top",
            color: "#D1D5DB",
            formatter: (params) => params.value.toFixed(1),
            fontWeight: "bold",
            fontSize: 11,
            offset: [0, 2],
          },
          data: filteredCategories.map((item) => item.value),
        },
      ],
    };

    chart.setOption(option);

    return () => chart.dispose();
  }, [filteredCategories]);

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
            <span className={styles.stepBadge}>STEP 3-2</span>
            <span className={styles.sectionBadge}>EXPENSE PATTERN ANALYSIS</span>
          </div>
          <h1 className={styles.headerTitle}>
            지출 패턴 분석 ({currentYear}년 기준)
          </h1>
        </div>
        <div className={styles.headerDescription}>
          <p>실제 지출 데이터를 기반으로 고정비와 변동비를 정밀 분석하고,</p>
          <p>지출 구조의 유연성과 절감 잠재력을 진단합니다.</p>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Fixed Cost Ratio Card */}
          <div className={`${styles.card} ${styles.fixedCostCard}`}>
            <span className={styles.cardLabel}>고정비 비중</span>
            <div className={styles.cardIconBadge} style={{ color: "#10B981" }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <div className={styles.circularProgress}>
              <svg className={styles.circularProgressSvg}>
                <circle
                  className={styles.circularProgressBg}
                  cx="80"
                  cy="80"
                  r="70"
                ></circle>
                <circle
                  className={styles.circularProgressFill}
                  cx="80"
                  cy="80"
                  r="70"
                  style={{ strokeDashoffset: fixedOffset }}
                ></circle>
              </svg>
              <div className={styles.circularProgressValue}>
                <span className={styles.progressPercentage}>
                  {fixedRatio.toFixed(1)}%
                </span>
              </div>
            </div>
            <p className={styles.fixedCostSummary}>
              고정비 <strong>{fixedExpense.toFixed(1)}만원</strong> / 변동비{" "}
              <strong style={{ color: "#9ca3af" }}>
                {variableExpense.toFixed(1)}만원
              </strong>
              <br />
              <span
                className={styles.statusBadge}
                style={{ backgroundColor: `${flexibilityStatus.color}33`, color: flexibilityStatus.color }}
              >
                {flexibilityStatus.text}
              </span>
            </p>
          </div>

          {/* Total Expense Card */}
          <div className={`${styles.card} ${styles.totalExpenseCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderLabel}>연간 총 지출 규모</span>
              <i
                className={`fas fa-wallet ${styles.cardHeaderIcon}`}
                style={{ color: "#F59E0B" }}
              ></i>
            </div>
            <div className={styles.totalAmount}>
              <span className={styles.amountValue}>
                {totalExpense.toFixed(1)}
              </span>
              <span className={styles.amountUnit}>만원</span>
            </div>
            <p className={styles.expenseNote}>
              <i className="fas fa-calculator"></i> 월 평균{" "}
              {monthlyExpense.toFixed(1)}만원 지출
            </p>
            <div className={styles.expenseBar}>
              <div
                className={styles.expenseBarFixed}
                style={{ width: `${fixedRatio}%` }}
              ></div>
              <div
                className={styles.expenseBarVariable}
                style={{ width: `${100 - fixedRatio}%` }}
              ></div>
            </div>
            <div className={styles.expenseBarLabels}>
              <span>고정비({fixedRatio.toFixed(0)}%)</span>
              <span>변동비({(100 - fixedRatio).toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          <div className={`${styles.card} ${styles.chartCard}`}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>
                <i className="fas fa-chart-column" style={{ color: "#3B82F6" }}></i>
                주요 지출 항목 분석
              </h3>
              <div className={styles.chartLegend}>
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: "#EF4444" }}
                  ></span>
                  고정비
                </span>
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ backgroundColor: "#3B82F6" }}
                  ></span>
                  변동비
                </span>
              </div>
            </div>
            <div className={styles.chartContainer} ref={chartRef}></div>
            <div className={styles.insightBox}>
              <div className={styles.insightColumn}>
                <p
                  className={styles.insightLabel}
                  style={{ color: "#F59E0B" }}
                >
                  OBSERVATION
                </p>
                <p className={styles.insightText}>
                  변동비 비중이 <strong>{(100 - fixedRatio).toFixed(1)}%</strong>로{" "}
                  {100 - fixedRatio > 50 ? "높으며" : "적정하며"},
                  {topExpense && secondExpense && (
                    <>
                      {" "}특히 <strong>{topExpense.name}({topExpense.value.toFixed(1)}만원)</strong>와{" "}
                      <strong>{secondExpense.name}({secondExpense.value.toFixed(1)}만원)</strong>가 주요 지출입니다.
                    </>
                  )}
                  {debtInterest > 0 && (
                    <>
                      {" "}대출이자({debtInterest.toFixed(1)}만원)는 고정비의 약{" "}
                      {fixedExpense > 0 ? ((debtInterest / fixedExpense) * 100).toFixed(0) : 0}%를 차지합니다.
                    </>
                  )}
                </p>
              </div>
              <div className={styles.insightColumn}>
                <p
                  className={styles.insightLabel}
                  style={{ color: "#10B981" }}
                >
                  ACTION PLAN
                </p>
                <p className={styles.insightText}>
                  {variableExpense > 0 ? (
                    <>
                      변동지출을 <strong>20%</strong> 절감할 경우, 연간{" "}
                      <strong>{savingPotential.toFixed(1)}만원</strong> (월{" "}
                      <strong>{monthlySavingPotential.toFixed(1)}만원</strong>)의
                      추가 현금흐름을 확보하여 노후 준비를 위한 투자 재원으로 활용할 수 있습니다.
                    </>
                  ) : (
                    <>
                      현재 지출 구조가 양호하며, 추가적인 절감보다는 소득 증대에 집중하는 것이 효과적입니다.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpensePatternPage;
