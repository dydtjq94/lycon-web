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

export default function CashflowChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>현금 흐름 데이터가 없습니다.</p>
        <p>수입, 지출, 부채, 연금 데이터를 추가해보세요.</p>
      </div>
    );
  }

  // Custom Tooltip for combined chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}년</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className={styles.tooltipItem}
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Currency formatting
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Y-axis formatting
  const formatYAxis = (value) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}만`;
    }
    return value.toLocaleString();
  };

  // 차트 데이터 포맷팅 (년 단위)
  const chartData = data.map((item) => ({
    year: item.year,
    income: item.income,
    pension: item.pension,
    expense: item.expense,
    debtPayment: item.debtPayment,
    netCashflow: item.netCashflow,
    cumulative: item.cumulative,
    // 색상을 미리 계산
    fill: item.netCashflow >= 0 ? "#10b981" : "#ef4444",
  }));

  // Y축 도메인 계산 (0원 기준으로 고정)
  const allValues = chartData.map((item) => item.netCashflow);
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 0);

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tick={{ fill: "#6b7280" }}
            tickFormatter={formatYAxis}
            domain={[minValue, maxValue]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* 0원 기준선 */}
          <ReferenceLine
            y={0}
            stroke="#374151"
            strokeWidth={2}
            strokeDasharray="5 5"
          />

          {/* 순현금흐름 바 (양수는 녹색, 음수는 빨간색) */}
          <Bar dataKey="netCashflow" name="순현금흐름">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.netCashflow >= 0 ? "#10b981" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className={styles.chartInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>최근 순현금흐름:</span>
          <span className={styles.infoValue}>
            {formatCurrency(data[data.length - 1]?.netCashflow || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
