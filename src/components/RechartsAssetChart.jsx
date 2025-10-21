import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Cell,
} from "recharts";
import { formatAmountForChart } from "../utils/format";
import styles from "./RechartsAssetChart.module.css";

/**
 * Recharts를 사용한 자산 시뮬레이션 차트
 */
function RechartsAssetChart({
  data,
  retirementAge,
  deathAge = 90,
  targetAssets = 50000,
}) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.noData}>데이터가 없습니다.</div>
      </div>
    );
  }

  // 차트 데이터 포맷팅 및 동적 자산 항목 추출
  const chartData = data.map((item) => {
    const processedItem = {
      age: item.age,
      year: item.year,
      totalAmount: item.totalAmount || item.amount,
      formattedAmount: formatAmountForChart(item.totalAmount || item.amount),
    };

    // 자산 항목들을 처리
    Object.keys(item).forEach((key) => {
      if (key !== "year" && key !== "age" && key !== "totalAmount") {
        if (key === "현금") {
          // 현금은 그대로 표시 (양수/음수 자동 처리)
          processedItem[key] = item[key] || 0;
        } else {
          // 다른 자산들은 그대로 표시
          processedItem[key] = item[key] || 0;
        }
      }
    });

    return processedItem;
  });

  // 동적 자산 항목 추출 (기본 필드 제외)
  const allKeys =
    chartData.length > 0
      ? Object.keys(chartData[0]).filter(
          (key) =>
            key !== "year" &&
            key !== "age" &&
            key !== "totalAmount" &&
            key !== "formattedAmount"
        )
      : [];

  // 현금을 맨 앞으로 이동하고, "현금 자산"을 "현금"으로 표시
  const assetKeys = allKeys.sort((a, b) => {
    if (a === "현금" || a === "현금 자산") return -1;
    if (b === "현금" || b === "현금 자산") return 1;
    return 0;
  });

  // 디버깅: chartData와 assetKeys 확인
  console.log("chartData:", chartData);
  console.log("assetKeys:", assetKeys);
  console.log(
    "첫 번째 chartData 항목의 키들:",
    chartData.length > 0 ? Object.keys(chartData[0]) : []
  );
  console.log("현금이 포함되어 있나?", assetKeys.includes("현금"));

  // 현금 값들 확인
  console.log(
    "현금 값들:",
    chartData.map((item) => ({ year: item.year, 현금: item.현금 }))
  );
  console.log(
    "음수 현금이 있나?",
    chartData.some((item) => item.현금 < 0)
  );

  // 색상 팔레트 (푸른 계열 자산, 붉은 계열 부채)
  const assetColors = [
    "#3b82f6", // 파란색
    "#06b6d4", // 청록색
    "#8b5cf6", // 보라색
    "#0ea5e9", // 하늘색
    "#6366f1", // 인디고
    "#14b8a6", // 에메랄드
    "#0d9488", // 틸
    "#0891b2", // 시안
  ];

  const debtColors = [
    "#ef4444", // 빨간색
    "#f97316", // 주황색
    "#dc2626", // 진한 빨간색
    "#ea580c", // 진한 주황색
    "#b91c1c", // 진한 빨간색
    "#c2410c", // 진한 주황색
  ];

  const pensionColors = [
    "#10b981", // 에메랄드
    "#059669", // 진한 에메랄드
    "#34d399", // 연한 에메랄드
    "#6ee7b7", // 매우 연한 에메랄드
    "#047857", // 진한 초록색
    "#16a34a", // 초록색
    "#22c55e", // 연한 초록색
    "#4ade80", // 매우 연한 초록색
  ];

  // 현금 색상 (양수: 노란 계열, 음수: 갈색 계열)
  const positiveCashColor = "#fbbf24"; // 노란색
  const negativeCashColor = "#92400e"; // 갈색

  // 은퇴 시점 찾기
  const retirementData = chartData.find((item) => item.age === retirementAge);

  // Y축 도메인 계산 (음수 포함)
  const allValues = [];
  chartData.forEach((item) => {
    assetKeys.forEach((key) => {
      if (item[key] !== undefined) {
        allValues.push(item[key]);
      }
    });
  });

  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);
  const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue));
  const padding = maxAbsValue * 0.1;
  const yDomain = [-maxAbsValue - padding, maxAbsValue + padding];

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>자산 시뮬레이션</h3>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            stackOffset="sign"
            margin={{
              top: 20,
              right: 30,
              left: 40,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

            {/* X축 - 나이 */}
            <XAxis
              dataKey="age"
              type="number"
              scale="linear"
              domain={["dataMin - 1", "dataMax + 1"]}
              tickFormatter={(value) => `${value}`}
              stroke="#6b7280"
              fontSize={12}
              label={{ value: "(세)", position: "insideBottom", offset: -5 }}
            />

            {/* Y축 - 금액 */}
            <YAxis
              domain={yDomain}
              tickFormatter={(value) => formatAmountForChart(value)}
              stroke="#6b7280"
              fontSize={12}
            />

            {/* 커스텀 툴팁 */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;

                  // 자본 토탈 계산 (양수 자산들)
                  let capitalTotal = 0;
                  let debtTotal = 0;

                  Object.keys(data).forEach((key) => {
                    if (
                      key !== "year" &&
                      key !== "age" &&
                      key !== "totalAmount" &&
                      key !== "formattedAmount"
                    ) {
                      const value = data[key] || 0;
                      if (value > 0) {
                        capitalTotal += value;
                      } else if (value < 0) {
                        debtTotal += Math.abs(value);
                      }
                    }
                  });

                  // 총 자산 = 자본 토탈 - 부채 토탈
                  const totalAssets = capitalTotal - debtTotal;

                  return (
                    <div className={styles.customTooltip}>
                      <div className={styles.tooltipHeader}>
                        <span className={styles.tooltipTitle}>
                          {data.age}세 ({data.year}년)
                        </span>
                      </div>

                      <div className={styles.tooltipBreakdown}>
                        <div className={styles.tooltipItem}>
                          <span className={styles.tooltipLabel}>순자산:</span>
                          <span className={styles.tooltipValue}>
                            {formatAmountForChart(totalAssets)}
                          </span>
                        </div>
                        <div className={styles.tooltipItem}>
                          <span className={styles.tooltipLabel}>자산:</span>
                          <span className={styles.tooltipValue}>
                            +{formatAmountForChart(capitalTotal)}
                          </span>
                        </div>
                        <div className={styles.tooltipItem}>
                          <span className={styles.tooltipLabel}>부채:</span>
                          <span className={styles.tooltipValue}>
                            -{formatAmountForChart(debtTotal)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.tooltipDetails}>
                        {payload.map((entry, index) => (
                          <div key={index} className={styles.tooltipItem}>
                            <span
                              className={styles.tooltipLabel}
                              style={{ color: entry.color }}
                            >
                              {entry.name}:
                            </span>
                            <span className={styles.tooltipValue}>
                              {formatAmountForChart(entry.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* 은퇴 시점 표시 */}
            {retirementData && (
              <ReferenceLine
                x={retirementAge}
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="10 5"
                label={{
                  value: "은퇴",
                  position: "top",
                  style: { fill: "#6b7280" },
                }}
              />
            )}

            {/* Y축 0 기준선 */}
            <ReferenceLine
              y={0}
              stroke="#374151"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: "0",
                position: "top",
                style: { fill: "#374151", fontSize: "12px" },
              }}
            />

            {/* 목표 자산선 */}
            <ReferenceLine
              y={targetAssets}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: "목표 자산",
                position: "right",
                style: { fill: "#f59e0b" },
              }}
            />

            {/* 현금 Bar (별도 처리) - 같은 stackId 사용 */}
            <Bar
              key="현금"
              dataKey="현금"
              stackId="assets"
              name="현금"
              fill={positiveCashColor}
            >
              {chartData.map((entry, entryIndex) => {
                // 현금 값에 따라 그라데이션 결정
                const cashValue = entry.현금 || 0;
                const gradientId =
                  cashValue >= 0
                    ? "positiveCashGradient"
                    : "negativeCashGradient";

                return (
                  <Cell
                    key={`현금-cell-${entryIndex}`}
                    fill={`url(#${gradientId})`}
                  />
                );
              })}
            </Bar>

            {/* 현금 자산 Bar (사용자가 추가한 현금 자산) */}
            {assetKeys.includes("현금 자산") && (
              <Bar
                key="현금 자산"
                dataKey="현금 자산"
                stackId="assets"
                name="현금"
                fill={positiveCashColor}
              >
                {chartData.map((entry, entryIndex) => {
                  // 현금 자산 값에 따라 그라데이션 결정
                  const cashAssetValue = entry["현금 자산"] || 0;
                  const gradientId =
                    cashAssetValue >= 0
                      ? "positiveCashGradient"
                      : "negativeCashGradient";

                  return (
                    <Cell
                      key={`현금자산-cell-${entryIndex}`}
                      fill={`url(#${gradientId})`}
                    />
                  );
                })}
              </Bar>
            )}

            {/* 다른 자산 항목 Bar들 */}
            {assetKeys
              .filter((key) => key !== "현금" && key !== "현금 자산")
              .map((key, index) => {
                // 연금인지 확인
                const isPension =
                  key.includes("연금") ||
                  key.includes("퇴직") ||
                  key.includes("국민연금");

                // 부채인지 확인 (이름과 실제 값 모두 확인)
                const isDebtByName =
                  key.includes("부채") ||
                  key.includes("대출") ||
                  key.includes("빚");
                const isDebtByValue = chartData.some((item) => item[key] < 0);
                const isDebt = isDebtByName || isDebtByValue;

                // 그라데이션 ID 선택
                let gradientId;
                if (isPension) {
                  const gradientIndex = (index % 2) + 1; // 1 또는 2
                  gradientId = `pensionGradient${gradientIndex}`;
                } else if (isDebt) {
                  const gradientIndex = (index % 2) + 1; // 1 또는 2
                  gradientId = `debtGradient${gradientIndex}`;
                } else {
                  const gradientIndex = (index % 3) + 1; // 1, 2, 또는 3
                  gradientId = `assetGradient${gradientIndex}`;
                }

                return (
                  <Bar
                    key={`${key}-${index}`}
                    dataKey={key}
                    stackId="assets"
                    fill={`url(#${gradientId})`}
                    name={key === "현금 자산" ? "현금" : key}
                  />
                );
              })}

            {/* 그라데이션 정의 */}
            <defs>
              {/* 현금 그라데이션 (양수: 노란색, 음수: 갈색) */}
              <linearGradient
                id="positiveCashGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient
                id="negativeCashGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              {/* 연금 그라데이션 */}
              <linearGradient id="pensionGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="pensionGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              {/* 자산 그라데이션 */}
              <linearGradient id="assetGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="assetGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="assetGradient3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>

              {/* 부채 그라데이션 */}
              <linearGradient id="debtGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="debtGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>

            {/* 범례 */}
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ paddingTop: "20px" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RechartsAssetChart;
