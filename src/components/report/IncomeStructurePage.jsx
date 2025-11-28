import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import styles from "./IncomeStructurePage.module.css";

/**
 * 소득 구조 분석 (Page 12)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function IncomeStructurePage({ profile, simulationData }) {
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  // 현금흐름 데이터
  const cashflow = simulationData?.simulation?.cashflow || [];
  const currentYearCashflow = cashflow[0] || {};

  // 현재 소득 구성 요소
  const incomeBreakdown = [
    {
      name: "근로소득",
      value: currentYearCashflow.income || 0,
      color: "#3B82F6",
    },
    {
      name: "연금소득",
      value: currentYearCashflow.pension || 0,
      color: "#8B5CF6",
    },
    {
      name: "임대소득",
      value: currentYearCashflow.rentalIncome || 0,
      color: "#10B981",
    },
    {
      name: "자산운용소득",
      value: currentYearCashflow.assetIncome || 0,
      color: "#F59E0B",
    },
  ];

  // 0이 아닌 소득만 필터링
  const activeIncomeSources = incomeBreakdown.filter(
    (item) => item.value > 0
  );

  // 총 소득
  const totalIncome = activeIncomeSources.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // 비율 계산
  const incomeWithPercentage = activeIncomeSources.map((item) => ({
    ...item,
    percentage: totalIncome > 0 ? (item.value / totalIncome) * 100 : 0,
  }));

  // 주 소득원 찾기
  const primaryIncomeSource =
    incomeWithPercentage.length > 0
      ? incomeWithPercentage.reduce((max, item) =>
          item.value > max.value ? item : max
        )
      : null;

  // 소득 다각화 점수 (소득원 개수와 분산도)
  const diversificationScore =
    activeIncomeSources.length >= 3
      ? "높음"
      : activeIncomeSources.length === 2
      ? "보통"
      : "낮음";

  // 소득 경로 예측 (향후 10년)
  const currentYear = new Date().getFullYear();
  const retirementAge = profile?.retirementAge || 65;
  const currentAge = profile?.age || 40;
  const retirementYear = currentYear + (retirementAge - currentAge);

  const incomeProjection = cashflow.slice(0, 11).map((year, index) => ({
    year: currentYear + index,
    근로소득: year.income || 0,
    연금소득: year.pension || 0,
    임대소득: year.rentalIncome || 0,
    자산운용소득: year.assetIncome || 0,
  }));

  // 주요 이벤트 감지
  const events = [];

  // 은퇴 이벤트
  if (retirementYear <= currentYear + 10) {
    const retirementIndex = retirementYear - currentYear;
    const beforeRetirement =
      retirementIndex > 0 ? cashflow[retirementIndex - 1] : currentYearCashflow;
    const afterRetirement = cashflow[retirementIndex] || {};

    const incomeChange =
      (afterRetirement.income || 0) - (beforeRetirement.income || 0);

    events.push({
      year: retirementYear,
      title: "은퇴",
      description: "근로소득 중단 및 연금 수령 시작",
      impact: incomeChange,
      icon: "fas fa-briefcase",
      color: "#8B5CF6",
      bgColor: "rgba(139, 92, 246, 0.2)",
    });
  }

  // 연금 개시 이벤트
  const pensionStartYear = cashflow.findIndex((year) => (year.pension || 0) > 0);
  if (pensionStartYear > 0 && pensionStartYear <= 10) {
    const pensionAmount = cashflow[pensionStartYear].pension || 0;
    events.push({
      year: currentYear + pensionStartYear,
      title: "연금 개시",
      description: "국민연금 및 퇴직연금 수령 시작",
      impact: pensionAmount,
      icon: "fas fa-hand-holding-usd",
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.2)",
    });
  }

  // 부동산 매각 이벤트
  const realEstateSales = cashflow
    .slice(0, 11)
    .map((year, index) => ({
      year: currentYear + index,
      amount: year.realEstateSale || 0,
      index,
    }))
    .filter((item) => item.amount > 0);

  if (realEstateSales.length > 0) {
    const firstSale = realEstateSales[0];
    events.push({
      year: firstSale.year,
      title: "부동산 매각",
      description: "보유 부동산 매도를 통한 현금 확보",
      impact: firstSale.amount,
      icon: "fas fa-home",
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.2)",
    });
  }

  // 자산 운용 증가 이벤트
  const assetIncomeGrowth = cashflow
    .slice(0, 11)
    .map((year, index) => ({
      year: currentYear + index,
      amount: year.assetIncome || 0,
      index,
    }))
    .filter((item) => item.amount > currentYearCashflow.assetIncome * 1.5);

  if (assetIncomeGrowth.length > 0 && !events.find((e) => e.title === "자산운용 증대")) {
    const firstGrowth = assetIncomeGrowth[0];
    events.push({
      year: firstGrowth.year,
      title: "자산운용 증대",
      description: "적립식 투자 및 금융자산 증가",
      impact: firstGrowth.amount - (currentYearCashflow.assetIncome || 0),
      icon: "fas fa-chart-line",
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.2)",
    });
  }

  // 이벤트를 연도순으로 정렬하고 최대 4개만 표시
  const sortedEvents = events.sort((a, b) => a.year - b.year).slice(0, 4);

  // Pie Chart
  useEffect(() => {
    if (!pieChartRef.current || incomeWithPercentage.length === 0) return;

    const chart = echarts.init(pieChartRef.current);

    const option = {
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          const value = (params.value / 10000).toFixed(1);
          return `${params.name}: ${value}억원 (${params.percent.toFixed(1)}%)`;
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "#d4af37",
        textStyle: { color: "#fff" },
      },
      legend: {
        show: false,
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "outside",
            formatter: "{b}\n{d}%",
            color: "#e5e7eb",
            fontSize: 12,
          },
          labelLine: {
            show: true,
            lineStyle: { color: "#374151" },
          },
          data: incomeWithPercentage.map((item) => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: item.color },
          })),
        },
      ],
    };

    chart.setOption(option);

    return () => chart.dispose();
  }, [incomeWithPercentage]);

  // Line Chart
  useEffect(() => {
    if (!lineChartRef.current || incomeProjection.length === 0) return;

    const chart = echarts.init(lineChartRef.current);

    const option = {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "#d4af37",
        textStyle: { color: "#fff" },
        formatter: (params) => {
          let result = `<strong>${params[0].axisValue}년</strong><br/>`;
          params.forEach((param) => {
            if (param.value > 0) {
              result += `${param.marker} ${param.seriesName}: ${(param.value / 10000).toFixed(1)}억원<br/>`;
            }
          });
          return result;
        },
      },
      legend: {
        data: ["근로소득", "연금소득", "임대소득", "자산운용소득"],
        textStyle: { color: "#9ca3af" },
        top: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: incomeProjection.map((item) => item.year),
        axisLine: { lineStyle: { color: "#374151" } },
        axisLabel: { color: "#9ca3af" },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#374151" } },
        axisLabel: {
          color: "#9ca3af",
          formatter: (value) => `${(value / 10000).toFixed(1)}억`,
        },
        splitLine: { lineStyle: { color: "#1f2937" } },
      },
      series: [
        {
          name: "근로소득",
          type: "line",
          data: incomeProjection.map((item) => item.근로소득),
          smooth: true,
          lineStyle: { width: 2, color: "#3B82F6" },
          itemStyle: { color: "#3B82F6" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
              { offset: 1, color: "rgba(59, 130, 246, 0)" },
            ]),
          },
        },
        {
          name: "연금소득",
          type: "line",
          data: incomeProjection.map((item) => item.연금소득),
          smooth: true,
          lineStyle: { width: 2, color: "#8B5CF6" },
          itemStyle: { color: "#8B5CF6" },
        },
        {
          name: "임대소득",
          type: "line",
          data: incomeProjection.map((item) => item.임대소득),
          smooth: true,
          lineStyle: { width: 2, color: "#10B981" },
          itemStyle: { color: "#10B981" },
        },
        {
          name: "자산운용소득",
          type: "line",
          data: incomeProjection.map((item) => item.자산운용소득),
          smooth: true,
          lineStyle: { width: 2, color: "#F59E0B" },
          itemStyle: { color: "#F59E0B" },
        },
      ],
    };

    chart.setOption(option);

    return () => chart.dispose();
  }, [incomeProjection]);

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
            <span className={styles.stepBadge}>STEP 3-1</span>
            <span className={styles.sectionBadge}>INCOME STRUCTURE</span>
          </div>
          <h1 className={styles.headerTitle}>소득 구조 분석</h1>
        </div>
        <div className={styles.headerDescription}>
          <p>현재의 소득 포트폴리오 구성과 향후 10년 간 소득 경로를 분석합니다.</p>
          <p>주요 이벤트에 따른 소득 변화와 대응 전략을 제시합니다.</p>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Income Portfolio Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>소득 포트폴리오</h2>
              <span className={styles.cardBadge}>Current</span>
            </div>
            <div className={styles.chartContainer} ref={pieChartRef}></div>
            <table className={styles.incomeTable}>
              <thead>
                <tr>
                  <th>소득원</th>
                  <th style={{ textAlign: "right" }}>금액</th>
                  <th style={{ textAlign: "right" }}>비중</th>
                </tr>
              </thead>
              <tbody>
                {incomeWithPercentage.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className={styles.sourceLabel}>
                        <span
                          className={styles.colorDot}
                          style={{ backgroundColor: item.color }}
                        ></span>
                        {item.name}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={styles.amountValue}>
                        {(item.value / 10000).toFixed(1)}억원
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={styles.percentValue}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.insightBox}>
              <p className={styles.insightText}>
                <i className="fas fa-lightbulb"></i>
                {primaryIncomeSource
                  ? `현재 ${primaryIncomeSource.name}이 전체 소득의 ${primaryIncomeSource.percentage.toFixed(1)}%를 차지하고 있습니다. 소득 다각화 수준: ${diversificationScore}`
                  : "소득 데이터가 충분하지 않습니다."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Income Path Card */}
          <div className={styles.card} style={{ flex: 1.2 }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>소득 경로 예측</h2>
              <span className={styles.cardBadge}>10 Years</span>
            </div>
            <div className={styles.chartContainer} ref={lineChartRef}></div>
          </div>

          {/* Event Impact Card */}
          <div className={styles.card} style={{ flex: 0.8 }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>주요 이벤트 영향</h2>
              <span className={styles.cardBadge}>Impact</span>
            </div>
            {sortedEvents.length > 0 ? (
              <div className={styles.eventCardsGrid}>
                {sortedEvents.map((event, index) => (
                  <div className={styles.eventCard} key={index}>
                    <div className={styles.eventHeader}>
                      <div
                        className={styles.eventIcon}
                        style={{
                          backgroundColor: event.bgColor,
                          color: event.color,
                        }}
                      >
                        <i className={event.icon}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 className={styles.eventTitle}>{event.title}</h3>
                        <p className={styles.eventYear}>{event.year}년</p>
                      </div>
                    </div>
                    <p className={styles.eventDescription}>
                      {event.description}
                    </p>
                    <div className={styles.eventImpact}>
                      <span className={styles.impactLabel}>소득 변화</span>
                      <span
                        className={styles.impactValue}
                        style={{
                          color: event.impact >= 0 ? "#10B981" : "#EF4444",
                        }}
                      >
                        {event.impact >= 0 ? "+" : ""}
                        {(event.impact / 10000).toFixed(1)}억원
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#9ca3af",
                  padding: "24px",
                }}
              >
                <i
                  className="fas fa-calendar-check"
                  style={{ fontSize: "32px", marginBottom: "12px" }}
                ></i>
                <p style={{ margin: 0 }}>향후 10년간 주요 이벤트가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomeStructurePage;
