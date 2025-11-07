import React from "react";
import { formatAmountForChart } from "../../utils/format";
import styles from "./CashflowChart.module.css";

/**
 * 현금 흐름 시뮬레이션 차트 컴포넌트
 */
function CashflowChart({ data, retirementAge, deathAge = 90 }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.noData}>데이터가 없습니다.</div>
      </div>
    );
  }

  // 차트 크기 설정
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };

  // 데이터 범위 계산
  const amounts = data.map((d) => d.amount);
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const amountRange = maxAmount - minAmount;

  // 0을 포함하도록 범위 조정
  const yMin = Math.min(minAmount, 0) - amountRange * 0.1;
  const yMax = Math.max(maxAmount, 0) + amountRange * 0.1;
  const yRange = yMax - yMin;

  // 스케일 계산
  const xScale =
    (chartWidth - padding.left - padding.right) / (data.length - 1);
  const yScale = (chartHeight - padding.top - padding.bottom) / yRange;

  // 좌표 변환 함수
  const getX = (index) => padding.left + index * xScale;
  const getY = (amount) => padding.top + (yMax - amount) * yScale;

  // 0선 그리기
  const zeroY = getY(0);

  // 은퇴 시점 찾기
  const retirementIndex = data.findIndex((d) => d.age === retirementAge);

  // SVG 경로 생성
  const pathData = data
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.amount);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // 영역 채우기 경로
  const areaData = `${pathData} L ${getX(data.length - 1)} ${zeroY} L ${getX(
    0
  )} ${zeroY} Z`;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>현금 흐름 시뮬레이션</div>
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: "#10b981" }}
            ></div>
            <span>수입</span>
          </div>
          <div className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: "#ef4444" }}
            ></div>
            <span>지출</span>
          </div>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <svg width={chartWidth} height={chartHeight} className={styles.chart}>
          {/* 격자 배경 */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* 0선 */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={chartWidth - padding.right}
            y2={zeroY}
            stroke="#6b7280"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* 영역 채우기 */}
          <path d={areaData} fill="url(#gradient)" opacity="0.3" />

          {/* 선 그래프 */}
          <path d={pathData} fill="none" stroke="#111827" strokeWidth="3" />

          {/* 데이터 포인트 */}
          {data.map((point, index) => (
            <circle
              key={index}
              cx={getX(index)}
              cy={getY(point.amount)}
              r="4"
              fill={point.amount >= 0 ? "#10b981" : "#ef4444"}
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* 은퇴 시점 표시 */}
          {retirementIndex >= 0 && (
            <line
              x1={getX(retirementIndex)}
              y1={padding.top}
              x2={getX(retirementIndex)}
              y2={chartHeight - padding.bottom}
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="10,5"
            />
          )}

          {/* 그라디언트 정의 */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y축 레이블 */}
        <div className={styles.yAxis}>
          {[yMax, yMax * 0.5, 0, yMin * 0.5, yMin].map((value, index) => (
            <div
              key={index}
              className={styles.yLabel}
              style={{ top: getY(value) - 10 }}
            >
              {formatAmountForChart(value)}
            </div>
          ))}
        </div>

        {/* X축 레이블 */}
        <div className={styles.xAxis}>
          {data
            .filter((_, index) => index % Math.ceil(data.length / 8) === 0)
            .map((point, index) => (
              <div
                key={index}
                className={styles.xLabel}
                style={{ left: getX(data.indexOf(point)) - 20 }}
              >
                {point.age}세
              </div>
            ))}
        </div>
      </div>

      {/* 은퇴 시점 표시 */}
      {retirementIndex >= 0 && (
        <div className={styles.retirementMarker}>
          <div className={styles.retirementLine}></div>
          <span className={styles.retirementLabel}>
            은퇴 ({retirementAge}세)
          </span>
        </div>
      )}
    </div>
  );
}

export default CashflowChart;
