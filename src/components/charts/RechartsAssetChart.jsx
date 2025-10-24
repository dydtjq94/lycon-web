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
import { formatAmountForChart } from "../../utils/format";
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

  // 현금이 마이너스로 변하는 시점 감지
  const findCashNegativeTransition = () => {
    for (let i = 0; i < data.length - 1; i++) {
      const currentCash = data[i]["현금"] || 0;
      const nextCash = data[i + 1]["현금"] || 0;

      // 양수에서 음수로 변하는 시점 감지
      if (currentCash >= 0 && nextCash < 0) {
        return {
          year: data[i + 1].year,
          age: data[i + 1].age,
          cashAmount: nextCash,
        };
      }
    }
    return null;
  };

  const cashNegativeTransition = findCashNegativeTransition();

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
  const positiveCashColor = "#10b981"; // 초록색
  const negativeCashColor = "#374151"; // 검은색

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
      <h3 className={styles.chartTitle}>가계 자산 규모</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={500}>
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
                        {data.age === retirementAge && (
                          <div className={styles.retirementWarning}>은퇴</div>
                        )}
                        {cashNegativeTransition &&
                          data.age === cashNegativeTransition.age && (
                            <div className={styles.cashWarning}>현금 위험</div>
                          )}
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
                        {payload.map((entry, index) => {
                          // 각 항목별 색상 결정
                          const getItemColor = (name) => {
                            // 현금 관련
                            if (name === "현금") {
                              return entry.value >= 0 ? "#10b981" : "#374151";
                            }

                            // 연금 관련 (노란 계열) - 10개
                            if (
                              name.includes("연금") ||
                              name.includes("퇴직") ||
                              name.includes("국민연금")
                            ) {
                              const pensionColors = [
                                "#fbbf24",
                                "#f59e0b",
                                "#eab308",
                                "#d97706",
                                "#f59e0b",
                                "#fbbf24",
                                "#ca8a04",
                                "#a16207",
                                "#d97706",
                                "#ca8a04",
                              ];
                              const colorIndex = index % pensionColors.length;
                              return pensionColors[colorIndex];
                            }

                            // 부채 관련 (빨간/갈색 계열) - 10개
                            if (
                              name.includes("부채") ||
                              name.includes("대출") ||
                              name.includes("빚") ||
                              entry.value < 0
                            ) {
                              const debtColors = [
                                "#ef4444",
                                "#f97316",
                                "#dc2626",
                                "#e53e3e",
                                "#e11d48",
                                "#f43f5e",
                                "#92400e",
                                "#78350f",
                                "#d97706",
                                "#b45309",
                              ];
                              const colorIndex = index % debtColors.length;
                              return debtColors[colorIndex];
                            }

                            // 일반 자산 (파란 계열) - 10개
                            const assetColors = [
                              "#3b82f6",
                              "#06b6d4",
                              "#8b5cf6",
                              "#6366f1",
                              "#0ea5e9",
                              "#2563eb",
                              "#7c3aed",
                              "#4f46e5",
                              "#1d4ed8",
                              "#0284c7",
                            ];
                            const colorIndex = index % assetColors.length;
                            return assetColors[colorIndex];
                          };

                          return (
                            <div key={index} className={styles.tooltipItem}>
                              <span
                                className={styles.tooltipLabel}
                                style={{ color: getItemColor(entry.name) }}
                              >
                                {entry.name}:
                              </span>
                              <span className={styles.tooltipValue}>
                                {formatAmountForChart(entry.value)}
                              </span>
                            </div>
                          );
                        })}
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
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="10 5"
                label={{
                  value: "은퇴",
                  position: "top",
                  style: { fill: "#9ca3af", fontSize: "12px" },
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
              stroke="#fbbf24"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              label={{
                value: "목표 자산",
                position: "right",
                style: { fill: "#fbbf24", fontSize: "12px" },
              }}
            />

            {/* 현금 위험 시점 표시 */}
            {cashNegativeTransition && (
              <ReferenceLine
                x={cashNegativeTransition.age}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: "현금 위험",
                  position: "top",
                  style: {
                    fill: "#ef4444",
                    fontSize: "12px",
                    fontWeight: "bold",
                  },
                }}
              />
            )}

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
                  const gradientIndex = (index % 10) + 1; // 1~10
                  gradientId = `pensionGradient${gradientIndex}`;
                } else if (isDebt) {
                  const gradientIndex = (index % 10) + 1; // 1~10
                  gradientId = `debtGradient${gradientIndex}`;
                } else {
                  const gradientIndex = (index % 10) + 1; // 1~10
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
              {/* 현금 그라데이션 (양수: 초록색, 음수: 검은계열) */}
              <linearGradient
                id="positiveCashGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient
                id="negativeCashGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>

              {/* 연금 그라데이션 (노란 계열) - 10개 */}
              <linearGradient id="pensionGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="pensionGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="pensionGradient3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
              <linearGradient id="pensionGradient4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="pensionGradient5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="pensionGradient6" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="pensionGradient7" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="pensionGradient8" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
              <linearGradient id="pensionGradient9" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient
                id="pensionGradient10"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>

              {/* 자산 그라데이션 (파란 계열) - 10개 */}
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
              <linearGradient id="assetGradient4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="assetGradient5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="assetGradient6" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="assetGradient7" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ddd6fe" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="assetGradient8" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0e7ff" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="assetGradient9" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="assetGradient10" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* 부채 그라데이션 (빨간/갈색 계열) - 10개 */}
              <linearGradient id="debtGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="debtGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="debtGradient3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fecaca" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="debtGradient4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fed7d7" />
                <stop offset="100%" stopColor="#e53e3e" />
              </linearGradient>
              <linearGradient id="debtGradient5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbb6ce" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
              <linearGradient id="debtGradient6" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="debtGradient7" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <linearGradient id="debtGradient8" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a16207" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="debtGradient9" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="debtGradient10" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
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
