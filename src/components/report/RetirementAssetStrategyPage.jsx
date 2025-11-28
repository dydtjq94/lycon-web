import React, { useRef, useEffect } from "react";
import * as echarts from "echarts";
import styles from "./RetirementAssetStrategyPage.module.css";

/**
 * 은퇴 시점 목표 자산 달성 전략 (Page 22)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function RetirementAssetStrategyPage({ profile, simulationData }) {
  const chartRef = useRef(null);

  // 현재 나이와 은퇴 나이
  const currentAge =
    simulationData?.profile?.currentAge || profile?.age || 42;
  const retirementAge =
    simulationData?.profile?.retirementAge || profile?.retirementAge || 65;

  // 목표 자산
  const targetAssets =
    simulationData?.profile?.targetAssets || profile?.targetAssets || 0;

  // 은퇴 시점 자산 (기본 시나리오 - 연 3% 수익률)
  const retirementYearIndex = retirementAge - currentAge;
  const assets = simulationData?.simulation?.assets || [];
  const retirementAssets =
    assets[retirementYearIndex]?.breakdown?.netAssets || 0;

  // 달성률 계산
  const achievementRate =
    targetAssets > 0 ? (retirementAssets / targetAssets) * 100 : 0;

  // 자산 격차
  const gap = retirementAssets - targetAssets;

  // 시나리오별 예상 자산 (수익률 2%, 3%, 4%)
  // 간단한 추정: 현재 자산에 복리 적용
  const currentNetAssets = assets[0]?.breakdown?.netAssets || 0;
  const yearsToRetirement = retirementAge - currentAge;

  const calculateProjectedAsset = (returnRate) => {
    // 간단한 복리 계산 (실제로는 더 복잡한 시뮬레이션 필요)
    return currentNetAssets * Math.pow(1 + returnRate, yearsToRetirement);
  };

  const scenario2 = calculateProjectedAsset(0.02);
  const scenario3 = calculateProjectedAsset(0.03);
  const scenario4 = calculateProjectedAsset(0.04);

  // 민감도 분석 (수익률 vs 물가상승률)
  const calculateSensitivity = (returnRate, inflationRate) => {
    // 실질 수익률 = 명목 수익률 - 물가상승률
    const realReturn = returnRate - inflationRate;
    const projectedAsset =
      currentNetAssets * Math.pow(1 + realReturn, yearsToRetirement);
    return targetAssets > 0 ? (projectedAsset / targetAssets) * 100 : 0;
  };

  const sensitivity = {
    r20i20: calculateSensitivity(0.02, 0.02),
    r20i25: calculateSensitivity(0.02, 0.025),
    r20i30: calculateSensitivity(0.02, 0.03),
    r30i20: calculateSensitivity(0.03, 0.02),
    r30i25: calculateSensitivity(0.03, 0.025),
    r30i30: calculateSensitivity(0.03, 0.03),
    r40i20: calculateSensitivity(0.04, 0.02),
    r40i25: calculateSensitivity(0.04, 0.025),
    r40i30: calculateSensitivity(0.04, 0.03),
  };

  // 차트 초기화
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        textStyle: { color: "#F3F4F6" },
        formatter: function (params) {
          let result = params[0].axisValueLabel + "<br/>";
          params.forEach((item) => {
            result +=
              item.marker +
              " " +
              item.seriesName +
              ": " +
              (item.value / 10000).toFixed(2) +
              "만원<br/>";
          });
          return result;
        },
      },
      legend: {
        data: ["목표 자산 (Target)", "예상 자산 (Projected)"],
        top: 0,
        right: 0,
        textStyle: { color: "#D1D5DB", fontSize: 10 },
        itemWidth: 12,
        itemHeight: 12,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: [
          "보수적 시나리오 (2%)",
          "기준 시나리오 (3%)",
          "적극적 시나리오 (4%)",
        ],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#D1D5DB",
          fontSize: 10,
          fontWeight: 500,
        },
      },
      yAxis: {
        type: "value",
        min: Math.floor((Math.min(scenario2, targetAssets) / 10000) * 0.9),
        max: Math.ceil((Math.max(scenario4, targetAssets) / 10000) * 1.1),
        axisLine: { show: false },
        splitLine: {
          lineStyle: { color: "rgba(75, 85, 99, 0.2)" },
        },
        axisLabel: {
          color: "#9CA3AF",
          fontSize: 10,
          formatter: (value) => value.toLocaleString() + "만원",
        },
      },
      series: [
        {
          name: "목표 자산 (Target)",
          type: "line",
          data: [
            targetAssets / 10000,
            targetAssets / 10000,
            targetAssets / 10000,
          ],
          lineStyle: {
            color: "#9CA3AF",
            width: 2,
            type: "dashed",
          },
          symbol: "none",
          z: 1,
        },
        {
          name: "예상 자산 (Projected)",
          type: "bar",
          data: [
            scenario2 / 10000,
            scenario3 / 10000,
            scenario4 / 10000,
          ],
          itemStyle: {
            color: function (params) {
              const colors = [
                "rgba(16, 185, 129, 0.6)",
                "rgba(16, 185, 129, 0.7)",
                "rgba(16, 185, 129, 0.8)",
              ];
              return colors[params.dataIndex];
            },
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 1,
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: "50%",
          label: {
            show: true,
            position: "top",
            color: "#fff",
            fontSize: 11,
            formatter: (params) => (params.value / 10000).toFixed(2) + "억",
          },
          z: 2,
        },
      ],
    };

    chart.setOption(option);

    return () => chart.dispose();
  }, [scenario2, scenario3, scenario4, targetAssets]);

  const getCellClass = (rate) => {
    if (rate >= 100) return styles.cellHigh;
    if (rate >= 90) return styles.cellMid;
    return styles.cellLow;
  };

  return (
    <div className={styles.slideContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerBadges}>
            <span className={styles.stepBadge}>STEP 2</span>
            <span className={styles.sectionBadge}>
              Retirement Asset Strategy
            </span>
          </div>
          <h1 className={styles.headerTitle}>은퇴 시점 목표 자산 달성 전략</h1>
        </div>
        <div className={styles.headerDescription}>
          <p>
            은퇴 시점({retirementAge}세)의 목표 자산과 예상 자산을 비교
            분석하고,
          </p>
          <p>
            투자 수익률 및 물가 변동 시나리오에 따른 달성 가능성을 진단합니다.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Achievement Rate */}
          <div className={styles.achievementCard}>
            <div className={styles.achievementLabel}>
              목표 달성률 (Achievement Rate)
            </div>
            <div className={styles.achievementCircle}>
              <svg viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#1F2937"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="440"
                  strokeDashoffset={
                    440 - (440 * Math.min(achievementRate, 100)) / 100
                  }
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div className={styles.achievementValue}>
                <p className={styles.achievementNumber}>
                  {achievementRate.toFixed(0)}
                  <span>%</span>
                </p>
              </div>
            </div>
            <div className={styles.achievementStatus}>
              <p className={styles.achievementStatusText}>
                {achievementRate >= 100 ? "초과 달성 (Exceeding)" : "미달 (Below Target)"}
              </p>
              <p className={styles.achievementStatusNote}>
                목표 자산 대비 {(Math.abs(gap) / 100000000).toFixed(2)}억원{" "}
                {gap >= 0 ? "초과" : "부족"}
              </p>
            </div>
          </div>

          {/* Gap Analysis */}
          <div className={styles.gapCard}>
            <div className={styles.gapHeader}>
              <p className={styles.gapLabel}>자산 격차 (Gap Analysis)</p>
              <div
                className={`${styles.gapBadge} ${
                  gap >= 0 ? styles.gapBadgePositive : styles.gapBadgeNegative
                }`}
              >
                {gap >= 0 ? "+" : ""}
                {(gap / 100000000).toFixed(2)}억원
              </div>
            </div>
            <div className={styles.gapContent}>
              <div className={styles.gapRow}>
                <div className={styles.gapRowLabel}>목표 자산 (Target)</div>
                <div className={styles.gapRowValue}>
                  {(targetAssets / 100000000).toFixed(1)}
                  <span>억원</span>
                </div>
              </div>
              <div className={styles.gapDivider}></div>
              <div className={styles.gapRow}>
                <div className={styles.gapRowLabel}>예상 자산 (Projected)</div>
                <div className={styles.gapRowValueHighlight}>
                  {(retirementAssets / 100000000).toFixed(2)}
                  <span>억원</span>
                </div>
              </div>
            </div>
            <p className={styles.gapNote}>
              <i className="fas fa-info-circle"></i>
              {retirementAge}세 시점 기준, 투자수익률 연 3.0% 및 물가상승률 2.5%
              가정 시 시뮬레이션 결과입니다.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>
                <i className="fas fa-chart-bar"></i>
                투자 수익률 시나리오별 예상 자산 ({retirementAge}세 시점)
              </h3>
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendDotGray}></div>
                  <span>목표({(targetAssets / 100000000).toFixed(0)}억)</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDotGreen}></div>
                  <span>예상자산</span>
                </div>
              </div>
            </div>
            <div className={styles.chartContainer} ref={chartRef}></div>
          </div>

          {/* Bottom Row */}
          <div className={styles.bottomRow}>
            {/* Sensitivity Matrix */}
            <div className={styles.sensitivityCard}>
              <h3 className={styles.sensitivityTitle}>
                <i className="fas fa-table"></i>
                민감도 분석 (Sensitivity Analysis)
                <span className={styles.sensitivityUnit}>단위: 달성률(%)</span>
              </h3>
              <div className={styles.sensitivityGrid}>
                {/* Headers */}
                <div className={styles.headerCell}>수익\물가</div>
                <div className={styles.headerColCell}>2.0%(저)</div>
                <div className={`${styles.headerColCell} ${styles.highlight}`}>
                  2.5%(기본)
                </div>
                <div className={styles.headerColCell}>3.0%(고)</div>

                {/* Row 1 */}
                <div className={styles.headerRowCell}>2.0%</div>
                <div className={getCellClass(sensitivity.r20i20)}>
                  {sensitivity.r20i20.toFixed(0)}%
                </div>
                <div className={getCellClass(sensitivity.r20i25)}>
                  {sensitivity.r20i25.toFixed(0)}%
                </div>
                <div className={getCellClass(sensitivity.r20i30)}>
                  {sensitivity.r20i30.toFixed(0)}%
                </div>

                {/* Row 2 */}
                <div className={`${styles.headerRowCell} ${styles.highlight}`}>
                  3.0%
                </div>
                <div className={getCellClass(sensitivity.r30i20)}>
                  {sensitivity.r30i20.toFixed(0)}%
                </div>
                <div
                  className={`${getCellClass(sensitivity.r30i25)} ${
                    styles.baseScenario
                  }`}
                >
                  {sensitivity.r30i25.toFixed(0)}%
                </div>
                <div className={getCellClass(sensitivity.r30i30)}>
                  {sensitivity.r30i30.toFixed(0)}%
                </div>

                {/* Row 3 */}
                <div className={styles.headerRowCell}>4.0%</div>
                <div className={getCellClass(sensitivity.r40i20)}>
                  {sensitivity.r40i20.toFixed(0)}%
                </div>
                <div className={getCellClass(sensitivity.r40i25)}>
                  {sensitivity.r40i25.toFixed(0)}%
                </div>
                <div className={getCellClass(sensitivity.r40i30)}>
                  {sensitivity.r40i30.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Action Guide */}
            <div className={styles.actionCard}>
              <h3 className={styles.actionTitle}>Strategic Insight</h3>
              <p className={styles.actionText}>
                현재 자산구성 유지 시{" "}
                <strong>
                  {achievementRate >= 100
                    ? "목표 초과 달성이 예상"
                    : "목표 미달이 우려"}
                </strong>
                되며, 수익률 및 물가 변동에도{" "}
                {achievementRate >= 100 ? "안정적" : "주의 필요"}입니다.
              </p>
              <div className={styles.actionFooter}>
                <div className={styles.actionLabel}>권장 조치</div>
                <div className={styles.actionRecommend}>
                  <i
                    className={`fas ${
                      achievementRate >= 100
                        ? "fa-check-circle"
                        : "fa-exclamation-circle"
                    }`}
                  ></i>
                  <span>
                    {achievementRate >= 100
                      ? "현재 자산 유지, 유동성 확보"
                      : "추가 저축 또는 수익률 개선 필요"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RetirementAssetStrategyPage;
