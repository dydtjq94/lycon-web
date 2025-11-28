import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { calculateKoreanAge } from "../../utils/koreanAge";
import { analyzeAssetReadiness } from "../../services/openaiService";
import styles from "./AssetReadinessPage.module.css";

/**
 * 은퇴 자산 준비율 진단 페이지 (Page 5)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function AssetReadinessPage({ profile, simulationData }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hasAnalyzed = useRef(false); // AI 분석 실행 여부 추적

  console.log("AssetReadinessPage 렌더링, aiInsights:", aiInsights ? "있음" : "없음");

  // 현재 나이와 은퇴 나이 (simulationData의 profile 우선 사용)
  const currentAge =
    simulationData?.profile?.currentAge ||
    (profile?.birthYear ? calculateKoreanAge(profile.birthYear) : 42);
  const retirementAge =
    simulationData?.profile?.retirementAge || profile?.retirementAge || 65;
  const targetAssets =
    simulationData?.profile?.targetAssets || profile?.targetAssets || 0;

  // 시뮬레이션 데이터에서 자산 추출 (detailedData 구조 사용)
  const assets = simulationData?.simulation?.assets || [];
  const currentYearIndex = 0; // 현재 시점
  const retirementYearIndex = retirementAge - currentAge;

  // breakdown에서 totalAssets와 netAssets 가져오기
  const currentTotalAssets = assets[currentYearIndex]?.breakdown?.totalAssets || 0;
  const currentTotalDebt = assets[currentYearIndex]?.breakdown?.totalDebt || 0;
  const currentNetAssets = assets[currentYearIndex]?.breakdown?.netAssets || 0;
  const retirementTotalAssets = assets[retirementYearIndex]?.breakdown?.totalAssets || 0;
  const retirementNetAssets = assets[retirementYearIndex]?.breakdown?.netAssets || 0;
  const retirementTotalDebt = assets[retirementYearIndex]?.breakdown?.totalDebt || 0;

  // 목표 달성률 - 순자산 기준
  const achievementRate =
    targetAssets > 0 && retirementNetAssets > 0
      ? (retirementNetAssets / targetAssets) * 100
      : 0;

  // 현재 자산 구성 비율 계산 - assetItems에서 sourceType별로 분류
  const currentAssetItems = assets[currentYearIndex]?.breakdown?.assetItems || [];
  const currentDebtItems = assets[currentYearIndex]?.breakdown?.debtItems || [];
  console.log("AssetReadinessPage - currentAssetItems:", currentAssetItems);
  console.log("AssetReadinessPage - currentDebtItems:", currentDebtItems);
  console.log("AssetReadinessPage - currentTotalAssets:", currentTotalAssets);

  // sourceType별로 그룹화 (자산)
  const assetsByType = {};
  currentAssetItems.forEach(item => {
    const type = item.sourceType || "기타";
    if (!assetsByType[type]) {
      assetsByType[type] = 0;
    }
    assetsByType[type] += item.amount || 0;
  });

  // 자산 카테고리별 분류 및 비율 계산
  const assetBreakdown = Object.entries(assetsByType).map(([type, value]) => {
    // sourceType을 한글로 변환
    const typeNames = {
      "cash": "현금",
      "saving": "저축투자",
      "pension": "연금",
      "realEstate": "부동산",
      "asset": "자산",
      "debt": "부채"
    };

    return {
      name: typeNames[type] || type,
      sourceType: type,
      value: value,
      ratio: currentTotalAssets > 0 ? (value / currentTotalAssets) * 100 : 0
    };
  });

  // 비율이 큰 순서로 정렬
  assetBreakdown.sort((a, b) => b.ratio - a.ratio);

  // 부채 항목 리스트 생성 (현재)
  const debtList = currentDebtItems
    .filter(item => item.label !== "현금") // 음수 현금 제외
    .map(item => item.label);

  // 은퇴 시점 자산/부채 항목 추출
  const retirementAssetItems = assets[retirementYearIndex]?.breakdown?.assetItems || [];
  const retirementDebtItems = assets[retirementYearIndex]?.breakdown?.debtItems || [];

  // 은퇴 시점 자산 구성
  const retirementAssetsByType = {};
  retirementAssetItems.forEach(item => {
    const type = item.sourceType || "기타";
    if (!retirementAssetsByType[type]) {
      retirementAssetsByType[type] = 0;
    }
    retirementAssetsByType[type] += item.amount || 0;
  });

  const retirementAssetBreakdown = Object.entries(retirementAssetsByType).map(([type, value]) => {
    const typeNames = {
      "cash": "현금",
      "saving": "저축투자",
      "pension": "연금",
      "realEstate": "부동산",
      "asset": "자산",
      "debt": "부채"
    };

    return {
      name: typeNames[type] || type,
      sourceType: type,
      value: value,
      ratio: retirementTotalAssets > 0 ? (value / retirementTotalAssets) * 100 : 0
    };
  });

  retirementAssetBreakdown.sort((a, b) => b.ratio - a.ratio);

  // 은퇴 시점 부채 항목
  const retirementDebtList = retirementDebtItems
    .filter(item => item.label !== "현금")
    .map(item => item.label);

  console.log("AssetReadinessPage - assetBreakdown:", assetBreakdown);
  console.log("AssetReadinessPage - debtList:", debtList);
  console.log("AssetReadinessPage - retirementAssetBreakdown:", retirementAssetBreakdown);
  console.log("AssetReadinessPage - retirementDebtList:", retirementDebtList);

  // 자산 성장률 (CAGR) 계산 - 순자산 기준
  const yearsToRetirement = retirementAge - currentAge;
  const cagr =
    yearsToRetirement > 0 && currentNetAssets > 0 && retirementNetAssets > 0
      ? (Math.pow(retirementNetAssets / currentNetAssets, 1 / yearsToRetirement) - 1) * 100
      : 0;

  // 차트 데이터 생성 - 현재부터 은퇴 시점까지
  const chartYears = [];
  const chartAssets = [];
  const chartTarget = [];

  // 현재부터 은퇴 시점까지만 표시
  for (let i = 0; i <= retirementYearIndex && i < assets.length; i++) {
    const age = currentAge + i;
    const year = new Date().getFullYear() + i;
    chartYears.push(`${age}세(${year - 2000}년)`);
    const netAssetAmount = assets[i]?.breakdown?.netAssets || 0;
    chartAssets.push(netAssetAmount ? (netAssetAmount / 10000).toFixed(1) : 0);
    chartTarget.push(targetAssets ? (targetAssets / 10000).toFixed(1) : 0);
  }

  // y축 범위 계산 (데이터에 맞게 자동 조정)
  const allValues = [...chartAssets, ...chartTarget].map(v => parseFloat(v));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // 목표값이 별도로 있는지 확인
  const targetValue = targetAssets / 10000;
  const actualMaxValue = Math.max(maxValue, targetValue);

  // 최소값의 90%, 최대값의 110%로 설정
  const yAxisMin = Math.floor(minValue * 0.9);
  const yAxisMax = Math.ceil(actualMaxValue * 1.1);

  // ECharts 옵션
  const getChartOption = () => ({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(11, 24, 40, 0.9)",
      borderColor: "#374151",
      textStyle: { color: "#fff" },
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
      boundaryGap: false,
      data: chartYears,
      axisLine: { lineStyle: { color: "#4B5563" } },
      axisLabel: { color: "#9CA3AF", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      name: "(단위: 만원)",
      nameTextStyle: { color: "#6B7280", padding: [0, 30, 0, 0] },
      scale: false,
      min: function(value) {
        return yAxisMin;
      },
      max: function(value) {
        return yAxisMax;
      },
      splitLine: { lineStyle: { color: "#1F2937", type: "dashed" } },
      axisLabel: {
        color: "#9CA3AF",
        formatter: (value) => value.toLocaleString()
      },
    },
    series: [
      {
        name: `목표 자산 (${(targetAssets / 10000).toFixed(1)}만원)`,
        type: "line",
        data: chartTarget,
        smooth: false,
        showSymbol: false,
        lineStyle: { width: 2, color: "#D4AF37", type: "dashed" },
        itemStyle: { color: "#D4AF37" },
      },
      {
        name: "예상 자산 경로",
        type: "line",
        data: chartAssets,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: achievementRate >= 100 ? "#10B981" : achievementRate >= 80 ? "#F59E0B" : "#EF4444",
        },
        itemStyle: {
          color: achievementRate >= 100 ? "#10B981" : achievementRate >= 80 ? "#F59E0B" : "#EF4444",
          borderColor: "#fff",
          borderWidth: 1,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color:
                  achievementRate >= 100
                    ? "rgba(16, 185, 129, 0.2)"
                    : achievementRate >= 80
                    ? "rgba(245, 158, 11, 0.2)"
                    : "rgba(239, 68, 68, 0.2)",
              },
              {
                offset: 1,
                color: "rgba(16, 185, 129, 0)",
              },
            ],
          },
        },
        markPoint: {
          data: [
            {
              value: `${(retirementNetAssets / 10000).toFixed(1)}만원`,
              coord: [chartYears.length - 1, chartAssets[chartAssets.length - 1]],
              itemStyle: {
                color: achievementRate >= 100 ? "#10B981" : achievementRate >= 80 ? "#F59E0B" : "#EF4444",
              },
            },
          ],
        },
      },
    ],
  });

  // 상태 결정
  const getStatus = () => {
    if (achievementRate >= 100) return { text: "안정권 진입 (Green)", color: "green", icon: "check-circle" };
    if (achievementRate >= 80) return { text: "주의 필요 (Yellow)", color: "yellow", icon: "exclamation-circle" };
    return { text: "개선 필요 (Red)", color: "red", icon: "times-circle" };
  };

  const status = getStatus();

  // 페이지 로드 시 AI 분석 자동 실행 (한 번만)
  useEffect(() => {
    if (
      simulationData &&
      assets.length > 0 &&
      !hasAnalyzed.current &&
      !isAnalyzing &&
      currentTotalAssets > 0 &&
      retirementNetAssets > 0
    ) {
      hasAnalyzed.current = true; // 실행 플래그 설정
      // AI 분석 대신 기본 인사이트 바로 설정 (CORS 문제로 인해)
      const status = achievementRate >= 100 ? "excellent" : achievementRate >= 70 ? "good" : "warning";
      setAiInsights({
        mainInsight: {
          status: status,
          title: achievementRate >= 100 ? "목표 달성 예상" : achievementRate >= 70 ? "목표에 근접" : "목표 달성 어려움",
          description: `현재 ${currentAge}세이며, ${retirementAge}세 은퇴 예정입니다. 목표 자산 대비 ${achievementRate.toFixed(0)}% 달성 예상입니다.`,
        },
        secondaryInsight: {
          title: "자산 구성",
          description: `현재 자산 구성은 ${assetBreakdown.length > 0 ? assetBreakdown[0].name : "다양한 자산"}으로 이루어져 있습니다.`,
        },
        recommendationInsight: {
          title: "권장사항",
          description: achievementRate < 70 ? "목표 달성을 위해 저축 및 투자 계획을 재검토해야 합니다." : achievementRate < 100 ? "목표에 근접하고 있으나, 추가 노력이 필요합니다." : "목표를 달성할 것으로 예상됩니다.",
        },
      });
      // handleAIAnalysis(); // API 기능 비활성화
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationData, assets.length, currentTotalAssets, retirementNetAssets]);

  // AI 분석 요청
  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      // 부동산 비중 계산
      const realEstateBreakdown = assetBreakdown.find(item => item.sourceType === "realEstate");
      const realEstateRatio = realEstateBreakdown ? realEstateBreakdown.ratio : 0;

      const analysisData = {
        currentAge,
        retirementAge,
        targetAssets,
        currentTotalAssets,
        currentNetAssets,
        retirementNetAssets: retirementNetAssets || 0,
        retirementTotalDebt: retirementTotalDebt || 0,
        achievementRate: achievementRate || 0,
        realEstateRatio,
        cagr: cagr || 0,
        assetBreakdown,
      };

      const result = await analyzeAssetReadiness(analysisData);
      console.log("AI 분석 결과:", result);
      setAiInsights(result);
    } catch (error) {
      console.error("AI 분석 실패:", error);
      // 기본 인사이트 설정 (AI 호출 실패 시)
      const status = achievementRate >= 100 ? "excellent" : achievementRate >= 70 ? "good" : "warning";
      setAiInsights({
        mainInsight: {
          status: status,
          title: achievementRate >= 100 ? "목표 달성 예상" : achievementRate >= 70 ? "목표에 근접" : "목표 달성 어려움",
          description: `현재 ${currentAge}세이며, ${retirementAge}세 은퇴 예정입니다. 목표 자산 대비 ${achievementRate.toFixed(0)}% 달성 예상입니다.`,
        },
        secondaryInsight: {
          title: "자산 구성",
          description: `현재 자산 구성은 ${assetBreakdown.length > 0 ? assetBreakdown[0].name : "다양한 자산"}으로 이루어져 있습니다.`,
        },
        recommendationInsight: {
          title: "권장사항",
          description: achievementRate < 70 ? "목표 달성을 위해 저축 및 투자 계획을 재검토해야 합니다." : achievementRate < 100 ? "목표에 근접하고 있으나, 추가 노력이 필요합니다." : "목표를 달성할 것으로 예상됩니다.",
        },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 데이터 로딩 체크
  if (!simulationData || !assets || assets.length === 0) {
    return (
      <div className={styles.slideContainer}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#9ca3af",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <i
              className="fas fa-spinner fa-spin"
              style={{ fontSize: "48px", marginBottom: "16px" }}
            ></i>
            <p>시뮬레이션 데이터를 불러오는 중...</p>
          </div>
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
            <span className={styles.stepBadge}>STEP 1-2</span>
            <span className={styles.checklistBadge}>Retirement Asset Goal</span>
          </div>
          <h1 className={styles.headerTitle}>은퇴 자산 준비율 진단</h1>
        </div>
        <div className={styles.headerDescription}>
          <p>현재 상태 유지 시 예상되는 은퇴 시점의 자산 규모와</p>
          <p>목표 대비 달성률을 분석한 핵심 지표입니다.</p>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          {/* KPI 1: 예상 은퇴자산 (순자산) */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <i className="fas fa-piggy-bank"></i>
            </div>
            <p className={styles.kpiLabel}>예상 은퇴 순자산 ({retirementAge}세)</p>
            <p className={styles.kpiValue}>
              {(retirementNetAssets / 10000).toFixed(1)}{" "}
              <span className={styles.kpiUnit}>억원</span>
            </p>
            <div className={styles.kpiFooter} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <i className="fas fa-plus-circle" style={{ color: '#10B981', fontSize: '10px' }}></i>
                <span>
                  자산 {(retirementTotalAssets / 10000).toFixed(1)}억
                </span>
                {retirementAssetBreakdown.length > 0 && (
                  <span style={{ color: '#6b7280', fontSize: '10px' }}>
                    ({retirementAssetBreakdown.map(item => `${item.name} ${item.ratio.toFixed(0)}%`).join(', ')})
                  </span>
                )}
              </div>
              {retirementTotalDebt > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <i className="fas fa-minus-circle" style={{ color: '#EF4444', fontSize: '10px' }}></i>
                  <span>
                    부채 {(retirementTotalDebt / 10000).toFixed(1)}억
                  </span>
                  {retirementDebtList.length > 0 && (
                    <span style={{ color: '#6b7280', fontSize: '10px' }}>
                      ({retirementDebtList.join(', ')})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KPI 2: 목표 달성률 */}
          <div className={`${styles.kpiCard} ${styles.kpiCardHighlight}`}>
            <div className={styles.kpiIcon}>
              <i className="fas fa-chart-pie"></i>
            </div>
            <p className={styles.kpiLabel}>목표 달성률</p>
            <div className={styles.kpiValueRow}>
              <p
                className={styles.kpiValue}
                style={{
                  color:
                    achievementRate >= 100 ? "#10B981" : achievementRate >= 80 ? "#F59E0B" : "#EF4444",
                }}
              >
                {achievementRate.toFixed(1)}
              </p>
              <span className={styles.kpiUnit}>%</span>
            </div>
            <div className={styles.kpiFooter} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-bullseye" style={{ color: '#D4AF37', fontSize: '10px' }}></i>
                <span>
                  목표 {(targetAssets / 10000).toFixed(1)}억
                </span>
              </div>
              {achievementRate >= 100 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fas fa-arrow-up" style={{ color: '#10B981', fontSize: '10px' }}></i>
                  <span style={{ color: '#10B981' }}>
                    {((retirementNetAssets - targetAssets) / 10000).toFixed(1)}억 초과 달성
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fas fa-arrow-down" style={{ color: '#EF4444', fontSize: '10px' }}></i>
                  <span style={{ color: '#EF4444' }}>
                    {((targetAssets - retirementNetAssets) / 10000).toFixed(1)}억 부족
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* KPI 3: 현재 총자산 */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <i className="fas fa-wallet"></i>
            </div>
            <p className={styles.kpiLabel}>현재 순자산 ({currentAge}세)</p>
            <p className={styles.kpiValue}>
              {(currentNetAssets / 10000).toFixed(1)}{" "}
              <span className={styles.kpiUnit}>억원</span>
            </p>
            <div className={styles.kpiFooter} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <i className="fas fa-plus-circle" style={{ color: '#10B981', fontSize: '10px' }}></i>
                <span>
                  자산 {(currentTotalAssets / 10000).toFixed(1)}억
                </span>
                {assetBreakdown.length > 0 && (
                  <span style={{ color: '#6b7280', fontSize: '10px' }}>
                    ({assetBreakdown.map(item => `${item.name} ${item.ratio.toFixed(0)}%`).join(', ')})
                  </span>
                )}
              </div>
              {currentTotalDebt > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <i className="fas fa-minus-circle" style={{ color: '#EF4444', fontSize: '10px' }}></i>
                  <span>
                    부채 {(currentTotalDebt / 10000).toFixed(1)}억
                  </span>
                  {debtList.length > 0 && (
                    <span style={{ color: '#6b7280', fontSize: '10px' }}>
                      ({debtList.join(', ')})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KPI 4: 자산 성장률 */}
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <i className="fas fa-chart-line"></i>
            </div>
            <p className={styles.kpiLabel}>자산 성장률 (CAGR)</p>
            <div className={styles.kpiValueRow}>
              <p className={styles.kpiValue} style={{ color: "#D4AF37" }}>
                {cagr.toFixed(1)}
              </p>
              <span className={styles.kpiUnit}>%</span>
            </div>
            <p className={styles.kpiFooter}>안정적 성장세 유지 중</p>
          </div>
        </div>

        {/* Chart & Analysis */}
        <div className={styles.bottomRow}>
          {/* Chart */}
          <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>
                <i className="fas fa-chart-area"></i>
                자산 성장 시뮬레이션 ({currentAge}세~{retirementAge}세)
              </h3>
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ backgroundColor: "#6B7280" }}></span>
                  <span>예상 경로</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ backgroundColor: "#D4AF37" }}></span>
                  <span>목표 자산({(targetAssets / 10000).toFixed(0)}억)</span>
                </div>
              </div>
            </div>
            <ReactECharts option={getChartOption()} style={{ height: "100%", width: "100%" }} />
          </div>

          {/* Analysis */}
          <div className={styles.analysisContainer}>
            <div className={styles.analysisTopBar}></div>
            <div className={styles.analysisContent}>
              <h3 className={styles.analysisTitle}>
                <i className="fas fa-lightbulb"></i>
                <span>진단 및 인사이트</span>
                {isAnalyzing && (
                  <i
                    className="fas fa-spinner fa-spin"
                    style={{ fontSize: "14px", color: "#D4AF37", marginLeft: "8px" }}
                  ></i>
                )}
              </h3>

              <div className={styles.insightsList}>
                {aiInsights ? (
                  <>
                    {/* Main Insight */}
                    <div className={styles.insightItem}>
                      <div
                        className={styles.insightIcon}
                        style={{
                          backgroundColor:
                            aiInsights.mainInsight.status === "excellent" ||
                            aiInsights.mainInsight.status === "good"
                              ? "rgba(16, 185, 129, 0.2)"
                              : aiInsights.mainInsight.status === "warning"
                                ? "rgba(245, 158, 11, 0.2)"
                                : "rgba(239, 68, 68, 0.2)",
                          borderColor:
                            aiInsights.mainInsight.status === "excellent" ||
                            aiInsights.mainInsight.status === "good"
                              ? "#10B981"
                              : aiInsights.mainInsight.status === "warning"
                                ? "#F59E0B"
                                : "#EF4444",
                        }}
                      >
                        <i
                          className={`fas fa-${
                            aiInsights.mainInsight.status === "excellent" ||
                            aiInsights.mainInsight.status === "good"
                              ? "check"
                              : "exclamation"
                          }`}
                          style={{
                            color:
                              aiInsights.mainInsight.status === "excellent" ||
                              aiInsights.mainInsight.status === "good"
                                ? "#10B981"
                                : aiInsights.mainInsight.status === "warning"
                                  ? "#F59E0B"
                                  : "#EF4444",
                          }}
                        ></i>
                      </div>
                      <div>
                        <p
                          className={styles.insightTitle}
                          style={{
                            color:
                              aiInsights.mainInsight.status === "excellent" ||
                              aiInsights.mainInsight.status === "good"
                                ? "#10B981"
                                : aiInsights.mainInsight.status === "warning"
                                  ? "#F59E0B"
                                  : "#EF4444",
                          }}
                        >
                          {aiInsights.mainInsight.title}
                        </p>
                        <p className={styles.insightText}>{aiInsights.mainInsight.description}</p>
                      </div>
                    </div>

                    {/* Secondary Insight */}
                    {aiInsights.secondaryInsight && (
                      <div className={styles.insightItem}>
                        <div
                          className={styles.insightIcon}
                          style={{
                            backgroundColor: "rgba(245, 158, 11, 0.2)",
                            borderColor: "#F59E0B",
                          }}
                        >
                          <i className="fas fa-exclamation" style={{ color: "#F59E0B" }}></i>
                        </div>
                        <div>
                          <p className={styles.insightTitle} style={{ color: "#F59E0B" }}>
                            {aiInsights.secondaryInsight.title}
                          </p>
                          <p className={styles.insightText}>
                            {aiInsights.secondaryInsight.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#6b7280",
                    }}
                  >
                    <i
                      className="fas fa-spinner fa-spin"
                      style={{ fontSize: "24px", marginBottom: "8px" }}
                    ></i>
                    <p style={{ fontSize: "14px" }}>AI 분석 중...</p>
                  </div>
                )}
              </div>
            </div>

            {aiInsights?.recommendation && (
              <div className={styles.actionBox}>
                <p className={styles.actionLabel}>Recommended Action</p>
                <p className={styles.actionText}>
                  <span>{aiInsights.recommendation}</span>
                  <span className={styles.actionArrow}>
                    <i className="fas fa-arrow-right"></i>
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default AssetReadinessPage;
