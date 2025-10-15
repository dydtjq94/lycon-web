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

  // 차트 데이터 포맷팅
  const chartData = data.map((item) => ({
    age: item.age,
    year: item.year,
    totalAmount: item.totalAmount || item.amount,
    savings: item.savings || 0,
    cash: item.cash || 0,
    pension: item.pension || 0,
    realEstate: item.realEstate || 0,
    formattedAmount: formatAmountForChart(item.totalAmount || item.amount),
  }));

  // 은퇴 시점 찾기
  const retirementData = chartData.find((item) => item.age === retirementAge);

  // Y축 도메인 계산 (0부터 시작)
  const amounts = data.map((d) => d.totalAmount || d.amount);
  const maxAmount = Math.max(...amounts);
  const padding = maxAmount * 0.1;
  const yDomain = [0, maxAmount + padding];

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
              formatter={(value, name) => [
                formatAmountForChart(value),
                name,
              ]}
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

            {/* 자산 유형별 Bar 그래프 */}
            <Bar dataKey="savings" stackId="assets" fill="#3b82f6" name="저축" />
            <Bar dataKey="cash" stackId="assets" fill="#10b981" name="현금성 자산" />
            <Bar dataKey="pension" stackId="assets" fill="#8b5cf6" name="연금" />
            <Bar dataKey="realEstate" stackId="assets" fill="#f59e0b" name="부동산" />
            
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
