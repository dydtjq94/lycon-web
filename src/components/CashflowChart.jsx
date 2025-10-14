// 현금 흐름 시뮬레이션 차트 컴포넌트 (년 단위 Bar Chart)
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell, // Cell import
  ReferenceLine, // ReferenceLine import
} from "recharts";
import styles from "./CashflowChart.module.css";

export default function CashflowChart({ data, profile = null }) {
  console.log("CashflowChart - 받은 데이터:", data);

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>현금 흐름 데이터가 없습니다.</p>
        <p>수입, 지출, 부채, 연금 데이터를 추가해보세요.</p>
      </div>
    );
  }

  // 데이터 유효성 검사
  const validData = data.filter(
    (item) => item && typeof item.year === "number" && !isNaN(item.year)
  );

  if (validData.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>유효한 현금 흐름 데이터가 없습니다.</p>
        <p>데이터를 확인해주세요.</p>
      </div>
    );
  }

  // 은퇴 시점 찾기
  const retirementYear =
    profile && profile.retirementAge
      ? data.find((item) => item.age && item.age >= profile.retirementAge)?.year
      : null;

  // Custom Tooltip for net cashflow only
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const dataItem = data.find((item) => item.year === label);
      const ageText = dataItem && dataItem.age ? ` (${dataItem.age}세)` : "";
      const isRetirementYear = label === retirementYear;

      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>
            {label}년{ageText}
            {isRetirementYear && (
              <span className={styles.retirementLabel}> - 은퇴</span>
            )}
          </p>
          <p
            className={styles.tooltipItem}
            style={{
              color: entry.color,
              "--tooltip-color": entry.color,
            }}
          >
            순현금흐름: {formatCurrency(entry.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Currency formatting (만원 단위)
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0만원";
    return new Intl.NumberFormat("ko-KR").format(value) + "만원";
  };

  // Y-axis formatting (만원 단위)
  const formatYAxis = (value) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}억`;
    } else if (value >= 1) {
      return `${value.toFixed(0)}만`;
    } else if (value <= -10000) {
      return `-${Math.abs(value / 10000).toFixed(0)}억`;
    } else if (value <= -1) {
      return `-${Math.abs(value).toFixed(0)}만`;
    } else {
      return "0";
    }
  };

  // 차트 데이터 포맷팅 (순현금흐름만, 나이 정보 포함)
  const chartData = validData.map((item) => ({
    year: item.year,
    age: item.age, // 나이 정보 추가
    netCashflow: Number(item.netCashflow) || 0,
  }));

  // X축 라벨 포맷팅 함수 (나이 기반)
  const formatXAxisLabel = (value) => {
    const dataItem = chartData.find((item) => item.year === value);
    if (dataItem && dataItem.age) {
      return `${value}\n(${dataItem.age}세)`;
    }
    return value;
  };

  console.log("CashflowChart - 포맷팅된 차트 데이터:", chartData);

  // Y축 도메인 계산 (순현금흐름만) - 더 균형잡힌 범위
  const netCashflowValues = chartData
    .map((item) => item.netCashflow)
    .filter((val) => !isNaN(val));

  if (netCashflowValues.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>유효한 현금 흐름 데이터가 없습니다.</p>
        <p>데이터를 확인해주세요.</p>
      </div>
    );
  }

  // 양수와 음수 값을 분리하여 계산
  const positiveValues = netCashflowValues.filter((val) => val > 0);
  const negativeValues = netCashflowValues.filter((val) => val < 0);

  let minValue = 0;
  let maxValue = 1000000;

  if (positiveValues.length > 0) {
    const maxPositive = Math.max(...positiveValues);
    maxValue = maxPositive * 1.1; // 최대값의 110%로 여유 공간 확보
  }

  if (negativeValues.length > 0) {
    const minNegative = Math.min(...negativeValues);
    minValue = minNegative * 1.1; // 최소값의 110%로 여유 공간 확보
  }

  // 0을 포함하도록 조정
  if (minValue > 0) minValue = 0;
  if (maxValue < 0) maxValue = 0;

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 50, right: 10, left: 40, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            stroke="#6b7280"
            fontSize={11}
            tick={{ fill: "#6b7280" }}
            tickLine={{ stroke: "#6b7280" }}
            axisLine={{ stroke: "#6b7280" }}
            interval="preserveStartEnd"
            tickCount={8}
            domain={["dataMin", 2100]}
            tickFormatter={formatXAxisLabel}
            label={{
              value: "년도 (나이)",
              position: "insideBottom",
              offset: -5,
              style: {
                textAnchor: "middle",
                fill: "#374151",
                fontSize: "12px",
                fontWeight: "500",
              },
            }}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={10}
            tick={{ fill: "#6b7280" }}
            tickLine={{ stroke: "#6b7280" }}
            axisLine={{ stroke: "#6b7280" }}
            tickFormatter={formatYAxis}
            domain={[minValue, maxValue]}
            width={50}
            tickCount={8}
            allowDecimals={false}
            label={{
              value: "순현금흐름 (원)",
              angle: -90,
              position: "insideLeft",
              offset: -10,
              style: {
                textAnchor: "middle",
                fill: "#374151",
                fontSize: "12px",
                fontWeight: "500",
              },
            }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* 0원 기준선 */}
          <ReferenceLine
            y={0}
            stroke="#374151"
            strokeWidth={2}
            strokeDasharray="5 5"
          />

          {/* 은퇴 시점 강조선 */}
          {retirementYear && (
            <ReferenceLine
              x={retirementYear}
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="6 4"
              label={{
                value: "은퇴",
                position: "top",
                offset: 5,
                style: {
                  fill: "#6b7280",
                  fontSize: "14px",
                  fontWeight: "600",
                  textAnchor: "middle",
                },
              }}
            />
          )}

          {/* 순현금흐름 바 (양수는 녹색, 음수는 빨간색) */}
          <Bar
            dataKey="netCashflow"
            name="순현금흐름"
            maxBarSize={50}
            radius={[2, 2, 2, 2]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`netcashflow-cell-${entry.year}-${index}-${entry.netCashflow}`}
                fill={entry.netCashflow >= 0 ? "#10b981" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
