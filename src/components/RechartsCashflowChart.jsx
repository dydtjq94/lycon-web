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
function RechartsCashflowChart({
  data,
  retirementAge,
  deathAge = 90,
  detailedData = [],
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
    const tickValue = i * tickStep;
    if (!ticks.includes(tickValue)) {
      ticks.push(tickValue);
    }
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>현금 흐름 시뮬레이션</h3>
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
            />

            {/* 커스텀 툴팁 */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  const yearData = detailedData.find(
                    (item) => item.year === data.year
                  );

                  if (yearData) {
                    return (
                      <div className={styles.customTooltip}>
                        <div className={styles.tooltipHeader}>
                          <span className={styles.tooltipTitle}>
                            {data.age}세 ({data.year}년)
                          </span>
                          <span
                            className={`${styles.tooltipAmount} ${
                              data.amount >= 0
                                ? styles.positive
                                : styles.negative
                            }`}
                          >
                            {data.amount >= 0 ? "+" : ""}
                            {formatAmountForChart(data.amount)}
                          </span>
                        </div>
                        <div className={styles.tooltipBreakdown}>
                          <div className={styles.tooltipItem}>
                            <span className={styles.tooltipLabel}>수입:</span>
                            <span className={styles.tooltipValue}>
                              +{formatAmountForChart(yearData.income)}
                            </span>
                          </div>
                          <div className={styles.tooltipItem}>
                            <span className={styles.tooltipLabel}>지출:</span>
                            <span className={styles.tooltipValue}>
                              -{formatAmountForChart(yearData.expense)}
                            </span>
                          </div>
                          <div className={styles.tooltipItem}>
                            <span className={styles.tooltipLabel}>저축:</span>
                            <span className={styles.tooltipValue}>
                              -{formatAmountForChart(yearData.savings)}
                            </span>
                          </div>
                          {yearData.pension > 0 && (
                            <div className={styles.tooltipItem}>
                              <span className={styles.tooltipLabel}>
                                연금수령:
                              </span>
                              <span className={styles.tooltipValue}>
                                +{formatAmountForChart(yearData.pension)}
                              </span>
                            </div>
                          )}
                          {yearData.rentalIncome > 0 && (
                            <div className={styles.tooltipItem}>
                              <span className={styles.tooltipLabel}>
                                임대수입:
                              </span>
                              <span className={styles.tooltipValue}>
                                +{formatAmountForChart(yearData.rentalIncome)}
                              </span>
                            </div>
                          )}
                          {yearData.assetIncome > 0 && (
                            <div className={styles.tooltipItem}>
                              <span className={styles.tooltipLabel}>
                                자산수익:
                              </span>
                              <span className={styles.tooltipValue}>
                                +{formatAmountForChart(yearData.assetIncome)}
                              </span>
                            </div>
                          )}
                          {yearData.debtInterest > 0 && (
                            <div className={styles.tooltipItem}>
                              <span className={styles.tooltipLabel}>
                                부채이자:
                              </span>
                              <span className={styles.tooltipValue}>
                                -{formatAmountForChart(yearData.debtInterest)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
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
