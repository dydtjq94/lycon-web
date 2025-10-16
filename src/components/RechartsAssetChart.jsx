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

    // 자산 항목들을 처리 (부채는 음수로 변환)
    Object.keys(item).forEach((key) => {
      if (key !== "year" && key !== "age" && key !== "totalAmount") {
        if (key === "현금부족") {
          // 현금부족은 음수로 표시
          processedItem[key] = -(item[key] || 0);
        } else {
          // 다른 자산들은 양수로 표시
          processedItem[key] = item[key] || 0;
        }
      }
    });

    return processedItem;
  });

  // 동적 자산 항목 추출 (기본 필드 제외)
  const assetKeys =
    chartData.length > 0
      ? Object.keys(chartData[0]).filter(
          (key) =>
            key !== "year" &&
            key !== "age" &&
            key !== "totalAmount" &&
            key !== "formattedAmount"
        )
      : [];

  // 색상 팔레트
  const colors = [
    "#3b82f6", // 파란색
    "#10b981", // 초록색
    "#8b5cf6", // 보라색
    "#f59e0b", // 주황색
    "#ef4444", // 빨간색
    "#06b6d4", // 청록색
    "#84cc16", // 라임색
    "#f97316", // 오렌지색
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
  const padding = Math.max(maxValue, Math.abs(minValue)) * 0.1;
  const yDomain = [minValue - padding, maxValue + padding];

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>자산 시뮬레이션</h3>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
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

            {/* 툴팁 */}
            <Tooltip
              formatter={(value, name) => [formatAmountForChart(value), name]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `${payload[0].payload.age}세 (${payload[0].payload.year}년)`;
                }
                return `${label}세`;
              }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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

            {/* 동적 자산 항목 Bar들 */}
            {assetKeys.map((key, index) => {
              // 부채 항목은 빨간색 계열로 표시
              const isDebt = key === "현금부족";
              const color = isDebt ? "#ef4444" : colors[index % colors.length];
              
              return (
                <Bar
                  key={`${key}-${index}`}
                  dataKey={key}
                  stackId="assets"
                  fill={color}
                  name={key}
                />
              );
            })}

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
