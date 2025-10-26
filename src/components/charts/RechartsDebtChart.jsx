import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import { formatAmountForChart } from "../../utils/format";
import styles from "./RechartsDebtChart.module.css";

const RechartsDebtChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>부채 데이터가 없습니다.</div>
      </div>
    );
  }

  // 차트 데이터 포맷팅 및 동적 부채 항목 추출
  const chartData = data.map((item) => {
    const processedItem = {
      age: item.age,
      year: item.year,
      totalAmount: item.totalAmount || item.amount,
      formattedAmount: formatAmountForChart(item.totalAmount || item.amount),
    };

    // 부채 항목들을 처리
    Object.keys(item).forEach((key) => {
      if (key !== "year" && key !== "age" && key !== "totalAmount") {
        // 부채 항목들은 음수 값 그대로 표시
        processedItem[key] = item[key] || 0;
      }
    });

    return processedItem;
  });

  // 동적 부채 항목 추출 (기본 필드 제외)
  const debtKeys =
    chartData.length > 0
      ? Object.keys(chartData[0]).filter(
          (key) =>
            key !== "year" &&
            key !== "age" &&
            key !== "totalAmount" &&
            key !== "formattedAmount"
        )
      : [];

  // 부채 색상 팔레트
  const colors = [
    "#ef4444", // 빨간색
    "#f97316", // 주황색
    "#eab308", // 노란색
    "#22c55e", // 초록색
    "#06b6d4", // 청록색
    "#3b82f6", // 파란색
    "#8b5cf6", // 보라색
    "#ec4899", // 분홍색
  ];

  // Y축 도메인 계산 (0을 중심으로 대칭)
  const allValues = chartData.flatMap((item) =>
    debtKeys.map((key) => item[key] || 0)
  );
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);
  const maxAbsValue = Math.max(Math.abs(maxValue), Math.abs(minValue));
  const padding = maxAbsValue * 0.1;
  const yDomain = [-maxAbsValue - padding, maxAbsValue + padding];

  return (
    <div className={styles.container}>
      <div className={styles.chartContainer}>
        <BarChart
          width={800}
          height={400}
          data={chartData}
          margin={{
            top: 20,
            right: 40,
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
            label={{ value: "", position: "insideBottom", offset: -5 }}
          />

          {/* Y축 - 금액 */}
          <YAxis
            domain={yDomain}
            tickFormatter={(value) => formatAmountForChart(value)}
            stroke="#6b7280"
            fontSize={12}
          />

          {/* 0 기준선 */}
          <ReferenceLine y={0} stroke="#374151" strokeWidth={2} />

          {/* 툴팁 */}
          <Tooltip
            formatter={(value, name) => [formatAmountForChart(value), name]}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                const data = payload[0].payload;
                return `${data.age}세 (${data.year}년)`;
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

          {/* 동적 부채 항목 Bar들 */}
          {debtKeys.map((key, index) => {
            return (
              <Bar
                key={`${key}-${index}`}
                dataKey={key}
                stackId="debts"
                fill={colors[index % colors.length]}
                name={key}
                maxBarSize={80}
                radius={[0, 0, 4, 4]}
              />
            );
          })}

          {/* 범례 */}
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="rect"
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "12px",
            }}
          />
        </BarChart>
      </div>
    </div>
  );
};

export default RechartsDebtChart;
