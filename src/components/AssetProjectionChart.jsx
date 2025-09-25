// 자산 시뮬레이션 차트 컴포넌트 (년 단위 Bar Chart with 자산 세부 내역)
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
  ComposedChart,
  Line,
} from "recharts";
import styles from "./AssetProjectionChart.module.css";

export default function AssetProjectionChart({ data, assetBreakdown }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>자산 시뮬레이션 데이터가 없습니다.</p>
        <p>자산과 부채 데이터를 추가해보세요.</p>
      </div>
    );
  }

  // 툴팁 커스터마이징
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
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

  // 통화 포맷팅
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Y축 포맷팅
  const formatYAxis = (value) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}만`;
    }
    return value.toLocaleString();
  };

  // 자산 세부 내역을 포함한 차트 데이터 생성
  const chartData = data.map((item) => {
    const yearBreakdown = assetBreakdown[item.year] || {};
    return {
      year: item.year,
      assets: item.assets,
      debt: item.debt,
      netAssets: item.netAssets,
      cumulative: item.cumulative,
      ...yearBreakdown, // 자산 세부 내역 추가
    };
  });

  // 자산 종류별 색상 정의
  const assetColors = {
    예금: "#10b981",
    주식: "#3b82f6",
    부동산: "#f59e0b",
    펀드: "#8b5cf6",
    채권: "#06b6d4",
    기타: "#6b7280",
  };

  // 동적 색상 생성 (자산 종류가 많을 경우)
  const getAssetColor = (assetName, index) => {
    return assetColors[assetName] || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
  };

  // 자산 종류 추출 (모든 년도에서)
  const assetTypes = new Set();
  if (assetBreakdown && typeof assetBreakdown === "object") {
    Object.values(assetBreakdown).forEach((yearData) => {
      if (yearData && typeof yearData === "object") {
        Object.keys(yearData).forEach((assetName) => {
          assetTypes.add(assetName);
        });
      }
    });
  }

  // 디버깅을 위한 로그
  console.log("AssetProjectionChart - assetBreakdown:", assetBreakdown);
  console.log("AssetProjectionChart - assetTypes:", Array.from(assetTypes));
  console.log("AssetProjectionChart - chartData:", chartData);

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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* 자산 세부 내역 바들 */}
          {Array.from(assetTypes).map((assetName, index) => (
            <Bar
              key={assetName}
              dataKey={assetName}
              stackId="assets"
              fill={getAssetColor(assetName, index)}
              name={assetName}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className={styles.chartInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>현재 총 자산:</span>
          <span className={styles.infoValue}>
            {formatCurrency(data[data.length - 1]?.assets || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
