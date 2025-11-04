import React, { useEffect, useMemo, useState, memo } from "react";
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
  PieChart,
  Pie,
} from "recharts";
import { formatAmountForChart } from "../../utils/format";
import ChartZoomModal from "./ChartZoomModal";
import styles from "./RechartsAssetChart.module.css";

// 파이차트 컴포넌트 최적화
const OptimizedPieChart = memo(({ data, title }) => {
  if (!data || data.length === 0) {
    return <div className={styles.noDistributionData}>{title} 데이터 없음</div>;
  }

  return (
    <div className={styles.distributionChart}>
      <PieChart
        width={280}
        height={280}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={120}
          paddingAngle={1}
          animationDuration={0}
          animationBegin={0}
          animationEasing="ease"
          isAnimationActive={false}
        >
          {data.map((slice, index) => (
            <Cell
              key={`${title}-slice-${slice.name}-${index}`}
              fill={slice.color}
            />
          ))}
        </Pie>
      </PieChart>
    </div>
  );
});

OptimizedPieChart.displayName = "OptimizedPieChart";

/**
 * Recharts를 사용한 자산 시뮬레이션 차트
 */
function RechartsAssetChart({
  data,
  retirementAge,
  spouseRetirementAge,
  deathAge = 90,
  targetAssets = 50000,
  savings = [],
  pensions = [],
  realEstates = [],
  assets = [],
  debts = [],
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [distributionEntry, setDistributionEntry] = useState(null);
  const [isDistributionOpen, setIsDistributionOpen] = useState(false);
  const hasData = Array.isArray(data) && data.length > 0;

  useEffect(() => {
    if (!hasData) {
      setIsZoomed(false);
      setIsDistributionOpen(false);
      setDistributionEntry(null);
    }
  }, [hasData]);

  // 현금이 마이너스로 변하는 시점 감지
  const findCashNegativeTransition = () => {
    if (!hasData) return null;
    for (let i = 0; i < data.length - 1; i++) {
      const currentCash = data[i]["현금"] || 0;
      const nextCash = data[i + 1]["현금"] || 0;

      // 양수에서 음수로 변하는 시점 감지
      if (currentCash >= 0 && nextCash < 0) {
        return {
          year: data[i + 1].year,
          age: data[i + 1].age,
          cashAmount: nextCash,
        };
      }
    }
    return null;
  };

  const cashNegativeTransition = findCashNegativeTransition();

  // 저축/투자 이벤트 추출 (시작/종료 이벤트)
  const getSavingEvents = () => {
    const events = [];
    if (hasData && savings && savings.length > 0) {
      savings.forEach((saving) => {
        // 시작 이벤트
        events.push({
          year: saving.startYear,
          age: saving.startYear - (data[0]?.year - data[0]?.age),
          type: "start",
          category: "saving",
          title: `${saving.title} 시작`,
        });

        // 종료 이벤트
        if (saving.endYear) {
          events.push({
            year: saving.endYear,
            age: saving.endYear - (data[0]?.year - data[0]?.age),
            type: "end",
            category: "saving",
            title: `${saving.title} 종료`,
          });
        }
      });
    }
    return events;
  };

  const savingEvents = getSavingEvents();

  // 연금 이벤트 추출 (퇴직/개인연금: 적립 시작/종료, 수령 시작/종료)
  const getPensionEvents = () => {
    const events = [];
    if (hasData && pensions && pensions.length > 0) {
      pensions.forEach((pension) => {
        if (pension.type !== "national") {
          // 퇴직연금/개인연금: 적립 시작/종료 이벤트
          events.push({
            year: pension.contributionStartYear,
            age: pension.contributionStartYear - (data[0]?.year - data[0]?.age),
            type: "start",
            category: "pension",
            title: `${pension.title} 적립 시작`,
          });

          if (pension.contributionEndYear) {
            events.push({
              year: pension.contributionEndYear,
              age: pension.contributionEndYear - (data[0]?.year - data[0]?.age),
              type: "end",
              category: "pension",
              title: `${pension.title} 적립 종료`,
            });
          }

          // 퇴직연금/개인연금: 수령 시작/종료 이벤트
          events.push({
            year: pension.paymentStartYear,
            age: pension.paymentStartYear - (data[0]?.year - data[0]?.age),
            type: "start",
            category: "pension",
            title: `${pension.title} 수령 시작`,
          });

          if (pension.paymentEndYear) {
            events.push({
              year: pension.paymentEndYear,
              age: pension.paymentEndYear - (data[0]?.year - data[0]?.age),
              type: "end",
              category: "pension",
              title: `${pension.title} 수령 종료`,
            });
          }
        }
      });
    }
    return events;
  };

  const pensionEvents = getPensionEvents();

  // 부동산 이벤트 추출 (보유 시작/종료, 주택연금 전환)
  const getRealEstateEvents = () => {
    const events = [];
    if (hasData && realEstates && realEstates.length > 0) {
      realEstates.forEach((realEstate) => {
        // 부동산 보유 시작 이벤트
        events.push({
          year: realEstate.startYear,
          age: realEstate.startYear - (data[0]?.year - data[0]?.age),
          type: "start",
          category: "realEstate",
          title: `${realEstate.title} 보유 시작`,
        });

        // 주택연금 전환 이벤트
        if (realEstate.convertToPension) {
          events.push({
            year: realEstate.pensionStartYear,
            age: realEstate.pensionStartYear - (data[0]?.year - data[0]?.age),
            type: "conversion",
            category: "realEstate",
            title: `${realEstate.title} 주택연금 전환`,
          });
        }

        // 부동산 보유 종료 이벤트 (매각 또는 주택연금 전환)
        if (realEstate.endYear) {
          events.push({
            year: realEstate.endYear,
            age: realEstate.endYear - (data[0]?.year - data[0]?.age),
            type: "end",
            category: "realEstate",
            title: `${realEstate.title} 보유 종료`,
          });
        }
      });
    }
    return events;
  };

  const realEstateEvents = getRealEstateEvents();

  // 부채 이벤트 추출 (대출 시작, 상환 완료)
  const getDebtEvents = () => {
    const events = [];
    if (hasData && debts && debts.length > 0) {
      debts.forEach((debt) => {
        // 대출 시작 이벤트
        events.push({
          year: debt.startYear,
          age: debt.startYear - (data[0]?.year - data[0]?.age),
          type: "start",
          category: "debt",
          title: `${debt.title} 대출 시작`,
        });

        // 상환 완료 이벤트 (부채 타입별 처리)
        if (debt.debtType === "bullet") {
          // 만기일시상환: endYear에 완전 상환
          events.push({
            year: debt.endYear,
            age: debt.endYear - (data[0]?.year - data[0]?.age),
            type: "repayment",
            category: "debt",
            title: `${debt.title} 만기 상환`,
          });
        } else if (debt.debtType === "equal") {
          // 원리금균등상환: endYear에 상환 완료
          events.push({
            year: debt.endYear,
            age: debt.endYear - (data[0]?.year - data[0]?.age),
            type: "repayment",
            category: "debt",
            title: `${debt.title} 상환 완료`,
          });
        } else if (debt.debtType === "principal") {
          // 원금균등상환: endYear에 상환 완료
          events.push({
            year: debt.endYear,
            age: debt.endYear - (data[0]?.year - data[0]?.age),
            type: "repayment",
            category: "debt",
            title: `${debt.title} 상환 완료`,
          });
        } else if (debt.debtType === "grace") {
          // 거치식상환: 거치기간 후 원금 상환 시작
          const principalStartYear = debt.startYear + debt.gracePeriod;
          events.push({
            year: principalStartYear,
            age: principalStartYear - (data[0]?.year - data[0]?.age),
            type: "principal_start",
            category: "debt",
            title: `${debt.title} 원금 상환 시작`,
          });

          // 원금 상환 완료
          events.push({
            year: debt.endYear,
            age: debt.endYear - (data[0]?.year - data[0]?.age),
            type: "repayment",
            category: "debt",
            title: `${debt.title} 상환 완료`,
          });
        }
      });
    }
    return events;
  };

  // 자산 이벤트 추출 (수익형 자산 보유 시작, 매각)
  const getAssetEvents = () => {
    const events = [];
    if (assets && assets.length > 0) {
      assets.forEach((asset) => {
        // 모든 자산 이벤트 표시
        // 자산 보유 시작 이벤트
        events.push({
          year: asset.startYear,
          age: asset.startYear - (data[0]?.year - data[0]?.age),
          type: "start",
          category: "asset",
          title: `${asset.title} 보유 시작`,
        });

        // 자산 매각 이벤트 (종료년도 +1)
        if (asset.endYear) {
          events.push({
            year: asset.endYear + 1,
            age: asset.endYear + 1 - (data[0]?.year - data[0]?.age),
            type: "sale",
            category: "asset",
            title: `${asset.title} 매각`,
          });
        }
      });
    }
    return events;
  };

  const assetEvents = getAssetEvents();
  const debtEvents = getDebtEvents();

  // 이벤트를 년도별로 그룹화
  const allEvents = [
    ...savingEvents,
    ...pensionEvents,
    ...realEstateEvents,
    ...assetEvents,
    ...debtEvents,
  ];

  const eventsByYear = allEvents.reduce((acc, event) => {
    if (!acc[event.year]) {
      acc[event.year] = [];
    }
    acc[event.year].push(event);
    return acc;
  }, {});

  // 차트 데이터 포맷팅 및 동적 자산 항목 추출
  const chartData = hasData
    ? data.map((item) => {
        const processedItem = {
          age: item.age,
          year: item.year,
          totalAmount: item.totalAmount || item.amount,
          formattedAmount: formatAmountForChart(
            item.totalAmount || item.amount
          ),
        };

        // 자산 항목들을 처리
        Object.keys(item).forEach((key) => {
          if (key !== "year" && key !== "age" && key !== "totalAmount") {
            const value = item[key] || 0;

            if (key === "현금") {
              // 현금은 그대로 표시 (양수/음수 자동 처리)
              processedItem[key] = value;
            } else {
              // 다른 자산들은 그대로 표시
              processedItem[key] = value;
            }
          }
        });

        return processedItem;
      })
    : [];

  // 동적 자산 항목 추출 (기본 필드 제외)
  const { allKeys, sampleData } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { allKeys: [], sampleData: {} };
    }

    const keysSet = new Set();
    const sample = {};

    chartData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (
          key === "year" ||
          key === "age" ||
          key === "totalAmount" ||
          key === "formattedAmount"
        ) {
          return;
        }
        keysSet.add(key);
        if (sample[key] === undefined && item[key] !== undefined) {
          sample[key] = item[key];
        }
      });
    });

    return { allKeys: Array.from(keysSet), sampleData: sample };
  }, [chartData]);

  // 툴팁과 동일한 카테고리별 정렬 로직 적용
  const categorizeAndSortKeys = (keys, sampleDataForSort) => {
    const categories = {
      현금: [],
      연금: [],
      자산: [],
      부채: [],
    };

    // 각 키를 카테고리별로 분류
    keys.forEach((key) => {
      if (key === "현금" || key === "현금 자산") {
        categories.현금.push(key);
      } else if (
        key.includes("연금") ||
        key.includes("퇴직") ||
        key.includes("국민연금")
      ) {
        categories.연금.push(key);
      } else if (
        key.includes("부채") ||
        key.includes("대출") ||
        key.includes("빚") ||
        (sampleDataForSort && sampleDataForSort[key] < 0)
      ) {
        categories.부채.push(key);
      } else {
        categories.자산.push(key);
      }
    });

    // 각 카테고리 내에서 금액이 큰 순서대로 정렬 (바 차트에서 높은 금액이 위에 오도록)
    Object.keys(categories).forEach((category) => {
      categories[category].sort((a, b) => {
        const valueA = sampleDataForSort
          ? Math.abs(sampleDataForSort[a] || 0)
          : 0;
        const valueB = sampleDataForSort
          ? Math.abs(sampleDataForSort[b] || 0)
          : 0;
        return valueB - valueA; // 큰 값이 먼저 (바 차트에서 위에)
      });
    });

    // 바 차트 렌더링 순서: 부채(위) → 자산 → 연금 → 현금(아래)
    // 툴팁 순서는 나중에 reverse로 조정
    return [
      ...categories.현금,
      ...categories.연금,
      ...categories.자산,
      ...categories.부채,
    ];
  };

  const assetKeys = categorizeAndSortKeys(allKeys, sampleData);

  // 자산별 고정 색상 매핑
  const getAssetColor = (assetName, value = 0) => {
    // 현금 관련 - 값이 음수이면 검은색, 양수는 초록 계열
    if (assetName === "현금" || assetName === "현금 자산") {
      return value < 0 ? "#ef4444" : "#10b981"; // 음수: 검은색, 양수: 초록색
    }

    // 연금 관련 (노란 계열) - 10가지 색상
    if (
      assetName.includes("연금") ||
      assetName.includes("퇴직") ||
      assetName.includes("국민연금")
    ) {
      const pensionColors = [
        "#fbbf24",
        "#f59e0b",
        "#eab308",
        "#d97706",
        "#ca8a04",
        "#a16207",
        "#92400e",
        "#78350f",
        "#713f12",
        "#fcd34d",
      ];
      const hash = assetName.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return pensionColors[Math.abs(hash) % pensionColors.length];
    }

    // 부채 관련 (회색 계열) - 10가지 색상
    if (
      assetName.includes("부채") ||
      assetName.includes("대출") ||
      assetName.includes("빚") ||
      (sampleData && sampleData[assetName] < 0)
    ) {
      const debtColors = [
        "#111827",
        "#1f2937",
        "#374151",
        "#4b5563",
        "#6b7280",
        "#9ca3af",
        "#d1d5db",
        "#0f172a",
        "#312e81",
        "#0b1120",
      ];
      const hash = assetName.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return debtColors[Math.abs(hash) % debtColors.length];
    }

    // 저축/투자 관련 (파랑 계열) - 10가지 색상
    if (
      assetName.includes("저축") ||
      assetName.includes("투자") ||
      assetName.includes("예금") ||
      assetName.includes("적금")
    ) {
      const savingColors = [
        "#3b82f6",
        "#2563eb",
        "#1d4ed8",
        "#1e40af",
        "#1e3a8a",
        "#06b6d4",
        "#0891b2",
        "#0e7490",
        "#155e75",
        "#164e63",
      ];
      const hash = assetName.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return savingColors[Math.abs(hash) % savingColors.length];
    }

    // 부동산 관련 (보라 계열) - 10가지 색상
    if (
      assetName.includes("부동산") ||
      assetName.includes("아파트") ||
      assetName.includes("자택") ||
      assetName.includes("임대")
    ) {
      const realEstateColors = [
        "#8b5cf6",
        "#7c3aed",
        "#6d28d9",
        "#5b21b6",
        "#4c1d95",
        "#a78bfa",
        "#9261f5",
        "#8162f0",
        "#7153eb",
        "#6043d6",
      ];
      const hash = assetName.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return realEstateColors[Math.abs(hash) % realEstateColors.length];
    }

    // 자산 관련 (청록 계열) - 10가지 색상
    const assetColors = [
      "#3b82f6",
      "#06b6d4",
      "#8b5cf6",
      "#6366f1",
      "#0ea5e9",
      "#2563eb",
      "#7c3aed",
      "#4f46e5",
      "#0284c7",
      "#0891b2",
    ];
    const hash = assetName.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return assetColors[Math.abs(hash) % assetColors.length];
  };

  // 색상 팔레트 (사용하지 않는 변수 제거)

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

  // 모든 연도별 분포 데이터를 미리 계산
  const allDistributionData = useMemo(() => {
    if (!hasData) return {};

    const keysToExclude = [
      "year",
      "age",
      "totalAmount",
      "formattedAmount",
      "events",
    ];

    const distributionMap = {};

    chartData.forEach((entry) => {
      const assetSlices = [];
      const debtSlices = [];

      assetKeys.forEach((key) => {
        if (keysToExclude.includes(key)) return;
        const value = entry[key];
        if (value === undefined || value === 0) return;

        const slice = {
          name: key,
          value: Math.abs(value),
          originalValue: value,
          color: getAssetColor(key, value),
        };

        if (value < 0) {
          debtSlices.push(slice);
        } else {
          assetSlices.push(slice);
        }
      });

      distributionMap[entry.year] = { assetSlices, debtSlices };
    });

    return distributionMap;
  }, [chartData, assetKeys, hasData]);

  const distributionSlices = useMemo(() => {
    if (!distributionEntry || !allDistributionData[distributionEntry.year]) {
      return { assetSlices: [], debtSlices: [] };
    }
    return allDistributionData[distributionEntry.year];
  }, [distributionEntry, allDistributionData]);

  const sortedDistribution = useMemo(() => {
    if (!distributionSlices.assetSlices || !distributionSlices.debtSlices) {
      return { assetSlices: [], debtSlices: [] };
    }

    const assetSlices = [...distributionSlices.assetSlices].sort(
      (a, b) => b.value - a.value
    );
    const debtSlices = [...distributionSlices.debtSlices].sort(
      (a, b) => b.value - a.value
    );
    return { assetSlices, debtSlices };
  }, [distributionSlices]);

  const totalAssetValue = useMemo(() => {
    return distributionSlices.assetSlices?.reduce(
      (sum, slice) => sum + slice.value,
      0
    );
  }, [distributionSlices]);

  const totalDebtValue = useMemo(() => {
    return distributionSlices.debtSlices?.reduce(
      (sum, slice) => sum + slice.value,
      0
    );
  }, [distributionSlices]);

  const handleBarSegmentClick = (barData, isZoomedView) => {
    if (!hasData || isZoomedView) return;
    if (!barData || !barData.payload) return;
    setDistributionEntry(barData.payload);
    setIsDistributionOpen(true);
  };

  // 차트 렌더링 함수 (일반 뷰와 확대 모달에서 재사용)
  const renderChart = (height = 600, isZoomedView = false) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        stackOffset="sign"
        margin={{
          top: 40,
          right: 30,
          left: 40,
          bottom: 120,
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
                <div
                  className={styles.customTooltip}
                  data-zoomed={isZoomedView}
                >
                  <div className={styles.tooltipHeader}>
                    <span className={styles.tooltipTitle}>
                      {data.age}세 ({data.year}년)
                    </span>
                    {data.age === retirementAge && (
                      <div className={styles.retirementWarning}>은퇴</div>
                    )}
                    {cashNegativeTransition &&
                      data.age === cashNegativeTransition.age && (
                        <div className={styles.cashWarning}>현금 위험</div>
                      )}
                  </div>

                  <div className={styles.tooltipBreakdown}>
                    <div className={styles.tooltipItem}>
                      <span className={styles.tooltipLabel}>순자산:</span>
                      <span
                        className={`${styles.tooltipValue} ${styles.tooltipValueBold}`}
                        style={{
                          color: totalAssets >= 0 ? "#059669" : "#dc2626",
                        }}
                      >
                        {totalAssets >= 0 ? "+" : ""}
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
                    {(() => {
                      // 카테고리별로 분류하고 정렬
                      const categorizeItems = (items) => {
                        const categories = {
                          현금: [],
                          연금: [],
                          자산: [],
                          부채: [],
                        };

                        items.forEach((entry) => {
                          const name = entry.displayName || entry.name;
                          const value = entry.value;

                          if (name === "현금") {
                            categories.현금.push(entry);
                          } else if (
                            name.includes("연금") ||
                            name.includes("퇴직") ||
                            name.includes("국민연금")
                          ) {
                            categories.연금.push(entry);
                          } else if (
                            name.includes("부채") ||
                            name.includes("대출") ||
                            name.includes("빚") ||
                            value < 0
                          ) {
                            categories.부채.push(entry);
                          } else {
                            categories.자산.push(entry);
                          }
                        });

                        // 각 카테고리 내에서 금액이 큰 순서대로 정렬 (바 차트와 동일한 순서)
                        Object.keys(categories).forEach((category) => {
                          categories[category].sort(
                            (a, b) => Math.abs(b.value) - Math.abs(a.value)
                          );
                        });

                        return categories;
                      };

                      const tooltipEntries = assetKeys
                        .map((key) => {
                          const rawValue = data[key];
                          const value =
                            typeof rawValue === "number" ? rawValue : 0;
                          if (!value) return null;
                          return {
                            key,
                            value,
                            displayName: key === "현금 자산" ? "현금" : key,
                          };
                        })
                        .filter(Boolean);

                      const categorizedItems = categorizeItems(tooltipEntries);
                      // 바 차트와 동일한 순서로 정렬 (아래부터 위로 쌓이는 순서)
                      const sortedItems = [
                        ...[...categorizedItems.자산].reverse(), // 바 차트에서 중간 - 순서 반대
                        ...[...categorizedItems.연금].reverse(), // 바 차트에서 중간 - 순서 반대
                        ...[...categorizedItems.현금].reverse(), // 바 차트에서 가장 아래 (툴팁에서 가장 위) - 순서 반대
                        ...categorizedItems.부채, // 바 차트에서 가장 위 (툴팁에서 가장 아래) - 순서 유지
                      ];

                      const totalItems = sortedItems.length;

                      return (
                        <>
                          {sortedItems.map((entry, index) => {
                            // 바 차트와 동일한 색상 사용 - entry의 value도 함께 전달
                            const colorKey = entry.key || entry.displayName;
                            const itemColor = getAssetColor(
                              colorKey,
                              entry.value
                            );

                            return (
                              <div key={index} className={styles.tooltipItem}>
                                <span
                                  className={styles.tooltipLabel}
                                  style={{ color: itemColor }}
                                >
                                  {(entry.displayName || entry.name) + ":"}
                                </span>
                                <span className={styles.tooltipValue}>
                                  {formatAmountForChart(entry.value)}
                                </span>
                              </div>
                            );
                          })}
                          {/* {totalItems > 12 && (
                            <div className={styles.tooltipHint}>
                              항목이 많으면 아래로 스크롤하거나 막대를 클릭해 자세히 볼 수 있어요.
                            </div>
                          )} */}
                        </>
                      );
                    })()}
                  </div>

                  {/* 이벤트 섹션 */}
                  {eventsByYear[data.year] &&
                    eventsByYear[data.year].length > 0 && (
                      <div className={styles.tooltipEvents}>
                        <div className={styles.tooltipDivider}></div>

                        {eventsByYear[data.year].map((event, index) => (
                          <div key={index} className={styles.tooltipEventItem}>
                            <span
                              className={styles.tooltipEventDot}
                              style={{
                                backgroundColor:
                                  event.category === "saving"
                                    ? "#3b82f6"
                                    : event.category === "pension"
                                    ? "#fbbf24"
                                    : event.category === "realEstate"
                                    ? "#8b5cf6"
                                    : event.category === "asset"
                                    ? "#06b6d4"
                                    : event.category === "debt"
                                    ? "#374151"
                                    : "#374151", // 기본값
                                width: "6px",
                                height: "6px",
                              }}
                            ></span>
                            <span className={styles.tooltipEventText}>
                              {event.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="10 5"
            label={{
              value: "은퇴",
              position: "top",
              style: { fill: "#9ca3af", fontSize: "12px" },
            }}
          />
        )}

        {/* 배우자 은퇴 시점 표시 */}
        {spouseRetirementAge && (
          <ReferenceLine
            x={spouseRetirementAge}
            stroke="#a78bfa"
            strokeWidth={1.5}
            strokeDasharray="10 5"
            label={{
              value: "배우자 은퇴",
              position: "top",
              offset: spouseRetirementAge === retirementAge ? 20 : 0, // 은퇴 나이가 같으면 위로 15px 올림
              style: { fill: "#a78bfa", fontSize: "12px" },
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
          stroke="#fbbf24"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          label={{
            value: "목표 자산",
            position: "right",
            style: { fill: "#fbbf24", fontSize: "12px" },
          }}
        />

        {/* 현금 위험 시점 표시 */}
        {cashNegativeTransition && (
          <ReferenceLine
            x={cashNegativeTransition.age}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="8 4"
            label={{
              value: "현금 위험",
              position: "top",
              style: {
                fill: "#ef4444",
                fontSize: "12px",
                fontWeight: "bold",
              },
            }}
          />
        )}

        {/* 현금 Bar (별도 처리) - 툴팁 순서 1순위 */}
        <Bar
          key="현금"
          dataKey="현금"
          stackId="assets"
          name="현금"
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth={1}
          className={!isZoomedView ? styles.clickableBar : undefined}
          onClick={(data, index) => handleBarSegmentClick(data, isZoomedView)}
        >
          {chartData.map((entry, entryIndex) => {
            const cashValue = entry.현금 || 0;
            const cashColor = getAssetColor("현금", cashValue);

            return (
              <Cell
                key={`현금-cell-${entryIndex}`}
                fill={cashColor}
                stroke="#ffffff"
                strokeWidth={1}
              />
            );
          })}
        </Bar>

        {/* 현금 자산 Bar (사용자가 추가한 현금 자산) - 툴팁 순서 1순위 */}
        {assetKeys.includes("현금 자산") && (
          <Bar
            key="현금 자산"
            dataKey="현금 자산"
            stackId="assets"
            name="현금"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth={1}
            className={!isZoomedView ? styles.clickableBar : undefined}
            onClick={(data, index) => handleBarSegmentClick(data, isZoomedView)}
          >
            {chartData.map((entry, entryIndex) => {
              const cashAssetValue = entry["현금 자산"] || 0;
              const cashAssetColor = getAssetColor("현금 자산", cashAssetValue);

              return (
                <Cell
                  key={`현금자산-cell-${entryIndex}`}
                  fill={cashAssetColor}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              );
            })}
          </Bar>
        )}

        {/* 다른 자산 항목 Bar들 - 렌더링 순서 조정 (부채 → 자산 → 연금 → 현금) */}
        {(() => {
          const pensionKeys = assetKeys.filter(
            (key) =>
              key !== "현금" &&
              key !== "현금 자산" &&
              (key.includes("연금") ||
                key.includes("퇴직") ||
                key.includes("국민연금"))
          );
          const debtKeys = assetKeys.filter(
            (key) =>
              key !== "현금" &&
              key !== "현금 자산" &&
              (key.includes("부채") ||
                key.includes("대출") ||
                key.includes("빚"))
          );
          const assetOnlyKeys = assetKeys.filter(
            (key) =>
              key !== "현금" &&
              key !== "현금 자산" &&
              !key.includes("연금") &&
              !key.includes("퇴직") &&
              !key.includes("국민연금") &&
              !key.includes("부채") &&
              !key.includes("대출") &&
              !key.includes("빚")
          );

          // 렌더링 순서: 연금 → 자산 → 부채 (바 차트에서 위에서 아래로)
          const orderedKeys = [...pensionKeys, ...assetOnlyKeys, ...debtKeys];

          return orderedKeys.map((key, index) => {
            const assetColor = getAssetColor(key);

            return (
              <Bar
                key={`${key}-${index}`}
                dataKey={key}
                stackId="assets"
                fill={assetColor}
                name={key === "현금 자산" ? "현금" : key}
                stroke="#ffffff"
                strokeWidth={1}
                className={!isZoomedView ? styles.clickableBar : undefined}
                onClick={(data, barIndex) =>
                  handleBarSegmentClick(data, isZoomedView)
                }
              />
            );
          });
        })()}

        {/* 이벤트 마커 */}
        {allEvents.map((event, eventIndex) => {
          const dataIndex = chartData.findIndex((d) => d.age === event.age);
          if (dataIndex === -1) return null;

          const eventColor =
            event.category === "saving"
              ? "#3b82f6"
              : event.category === "pension"
              ? "#fbbf24"
              : event.category === "realEstate"
              ? "#8b5cf6"
              : event.category === "asset"
              ? "#06b6d4"
              : event.category === "debt"
              ? "#374151"
              : "#374151"; // 기본값

          // 같은 년도의 이벤트 인덱스 계산 (수직으로 쌓기 위해)
          const eventsInSameYear = allEvents.filter((e) => e.age === event.age);
          const eventVerticalIndex = eventsInSameYear.findIndex(
            (e) => e.year === event.year && e.title === event.title
          );
          const offset = 25 + eventVerticalIndex * 7.5; // 각 이벤트마다 7.5px씩 아래로

          return (
            <ReferenceLine
              key={`event-${eventIndex}`}
              x={event.age}
              stroke="transparent"
              strokeWidth={0}
              label={{
                value: "●",
                position: "bottom",
                offset: offset,
                style: {
                  fill: eventColor,
                  fontSize: "8px",
                  fontWeight: "bold",
                },
              }}
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );

  // 범례 데이터 추출
  const getLegendData = () => {
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

    const sampleData = chartData.length > 0 ? chartData[0] : {};
    const assetKeys = categorizeAndSortKeys(allKeys, sampleData);

    const filteredKeys = assetKeys.filter(
      (key) => key !== "현금" && key !== "현금 자산"
    );

    return filteredKeys.map((key) => ({
      value: key,
      color: getAssetColor(key),
    }));
  };

  const legendData = getLegendData();

  return (
    <>
      <div className={styles.chartContainer}>
        {hasData ? (
          <>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitleWrapper}>
                <h3 className={styles.chartTitle}>가계 자산 규모</h3>
                <button
                  className={styles.zoomButton}
                  onClick={() => setIsZoomed(true)}
                  title="크게 보기"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={styles.chartWrapper}>{renderChart()}</div>
          </>
        ) : (
          <div className={styles.noData}>데이터가 없습니다.</div>
        )}
      </div>

      {hasData && (
        <ChartZoomModal
          isOpen={isZoomed}
          onClose={() => setIsZoomed(false)}
          title="가계 자산 규모"
        >
          <div style={{ width: "100%", height: "100%" }}>
            {renderChart("100%", true)}
          </div>
        </ChartZoomModal>
      )}

      {hasData && (
        <ChartZoomModal
          isOpen={isDistributionOpen}
          onClose={() => {
            setIsDistributionOpen(false);
            setDistributionEntry(null);
          }}
          title={
            distributionEntry
              ? `${distributionEntry.year}년 자산 구성`
              : "자산 구성"
          }
        >
          <div className={styles.distributionModalContent}>
            {distributionSlices.assetSlices.length === 0 &&
            distributionSlices.debtSlices.length === 0 ? (
              <div className={styles.noDistributionData}>
                해당 연도의 자산 구성을 계산할 수 없습니다.
              </div>
            ) : (
              <>
                <div className={styles.distributionSection}>
                  <h4>자산</h4>
                  <OptimizedPieChart
                    data={sortedDistribution.assetSlices}
                    title="자산"
                  />
                  {sortedDistribution.assetSlices.length > 0 && (
                    <>
                      <div className={styles.totalValue}>
                        총 자산: {formatAmountForChart(totalAssetValue)}
                      </div>
                      <div className={styles.distributionList}>
                        {sortedDistribution.assetSlices.map((slice) => {
                          const percent =
                            totalAssetValue > 0
                              ? ((slice.value / totalAssetValue) * 100).toFixed(
                                  1
                                )
                              : "0.0";
                          return (
                            <div
                              key={`asset-list-${slice.name}`}
                              className={styles.distributionRow}
                            >
                              <span className={styles.distributionLabel}>
                                <span
                                  className={styles.distributionDot}
                                  style={{ backgroundColor: slice.color }}
                                />
                                {slice.name}
                              </span>
                              <span className={styles.distributionValue}>
                                {formatAmountForChart(
                                  Math.abs(slice.originalValue)
                                )}
                                <span className={styles.distributionPercent}>
                                  {percent}%
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.distributionSection}>
                  <h4>부채</h4>
                  <OptimizedPieChart
                    data={sortedDistribution.debtSlices}
                    title="부채"
                  />
                  {sortedDistribution.debtSlices.length > 0 && (
                    <>
                      <div className={styles.totalValue}>
                        총 부채: -{formatAmountForChart(totalDebtValue)}
                      </div>
                      <div className={styles.distributionList}>
                        {sortedDistribution.debtSlices.map((slice) => {
                          const percent =
                            totalDebtValue > 0
                              ? ((slice.value / totalDebtValue) * 100).toFixed(
                                  1
                                )
                              : "0.0";
                          return (
                            <div
                              key={`debt-list-${slice.name}`}
                              className={styles.distributionRow}
                            >
                              <span className={styles.distributionLabel}>
                                <span
                                  className={styles.distributionDot}
                                  style={{ backgroundColor: slice.color }}
                                />
                                {slice.name}
                              </span>
                              <span className={styles.distributionValue}>
                                -
                                {formatAmountForChart(
                                  Math.abs(slice.originalValue)
                                )}
                                <span className={styles.distributionPercent}>
                                  {percent}%
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </ChartZoomModal>
      )}
    </>
  );
}

export default RechartsAssetChart;
