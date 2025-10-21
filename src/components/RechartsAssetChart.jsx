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

  // 색상 팔레트 (부드럽고 예쁜 색상)
  const colors = [
    "#34d399", // 연한 초록색
    "#60a5fa", // 연한 파란색
    "#fbbf24", // 연한 노란색
    "#f472b6", // 연한 핑크색
    "#a78bfa", // 연한 보라색
    "#34d399", // 연한 청록색
    "#fbbf24", // 연한 주황색
    "#fb7185", // 연한 로즈색
  ];

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
              fill="#000000"
            >
              {chartData.map((entry, entryIndex) => (
                <Cell key={`현금-cell-${entryIndex}`} fill="#000000" />
              ))}
            </Bar>

            {/* 현금 자산 Bar (사용자가 추가한 현금 자산) */}
            {assetKeys.includes("현금 자산") && (
              <Bar
                key="현금 자산"
                dataKey="현금 자산"
                stackId="assets"
                name="현금"
                fill={colors[0]}
              />
            )}

            {/* 다른 자산 항목 Bar들 */}
            {assetKeys
              .filter((key) => key !== "현금" && key !== "현금 자산")
              .map((key, index) => (
                <Bar
                  key={`${key}-${index}`}
                  dataKey={key}
                  stackId="assets"
                  fill={colors[index % colors.length]}
                  name={key === "현금 자산" ? "현금" : key}
                />
              ))}

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
