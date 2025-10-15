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
  Cell,
} from "recharts";
import { formatAmountForChart } from "../utils/format";
import styles from "./RechartsCashflowChart.module.css";

/**
 * Recharts를 사용한 현금 흐름 시뮬레이션 차트
 */
function RechartsCashflowChart({ data, retirementAge, deathAge = 90 }) {
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
    amount: item.amount,
    formattedAmount: formatAmountForChart(item.amount),
  }));

  // 은퇴 시점 찾기
  const retirementData = chartData.find((item) => item.age === retirementAge);

  // Y축 도메인 계산 (0을 중심으로 대칭)
  const amounts = data.map((d) => d.amount);
  const maxAbsAmount = Math.max(...amounts.map(Math.abs));

  // 깔끔한 Y축을 위해 1000만원 단위로 반올림
  const roundedMax = Math.ceil(maxAbsAmount / 1000) * 1000;
  const yDomain = [-roundedMax, roundedMax];

  // Y축 틱 생성 (깔끔한 간격으로)
  const tickStep = roundedMax / 4; // 4개 구간으로 나누기
  const ticks = [];
  for (let i = -4; i <= 4; i++) {
    ticks.push(i * tickStep);
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>현금 흐름 시뮬레이션</h3>
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: "#10b981" }}
            ></div>
            <span>흑자 (수입 > 지출)</span>
          </div>
          <div className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: "#ef4444" }}
            ></div>
            <span>적자 (지출 > 수입)</span>
          </div>
        </div>
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
              ticks={ticks}
              tickFormatter={(value) => {
                if (value === 0) return "0";
                const absValue = Math.abs(value);
                const formatted = formatAmountForChart(absValue);
                return value > 0 ? `+${formatted}` : `-${formatted}`;
              }}
              stroke="#6b7280"
              fontSize={12}
              label={{ value: "(만원)", angle: -90, position: "insideLeft" }}
            />

            {/* 툴팁 */}
            <Tooltip
              formatter={(value, name) => [
                formatAmountForChart(value),
                name === "amount" ? "현금 흐름" : name,
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

            {/* 0선 */}
            <ReferenceLine
              y={0}
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="5 5"
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

            {/* Bar 그래프 */}
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} strokeWidth={0}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.amount >= 0
                      ? `url(#positiveGradient)`
                      : `url(#negativeGradient)`
                  }
                />
              ))}
            </Bar>

            {/* 그라데이션 정의 */}
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RechartsCashflowChart;
