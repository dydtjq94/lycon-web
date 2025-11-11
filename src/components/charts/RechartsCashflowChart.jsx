import React, { useState, useMemo, memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  Tooltip,
} from "recharts";
import { formatAmountForChart } from "../../utils/format";
import ChartZoomModal from "./ChartZoomModal";
import styles from "./RechartsCashflowChart.module.css";

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
 * Recharts를 사용한 현금 흐름 시뮬레이션 차트
 */
function RechartsCashflowChart({
  data,
  retirementAge,
  deathAge = 90,
  profileData = null, // 배우자 은퇴 정보를 위해 프로필 데이터 추가
  detailedData = [],
  incomes = [],
  expenses = [],
  savings = [],
  pensions = [],
  realEstates = [],
  assets = [],
  debts = [],
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [hoveredData, setHoveredData] = useState(null); // 마우스 오버된 데이터
  const [distributionEntry, setDistributionEntry] = useState(null);
  const [isDistributionOpen, setIsDistributionOpen] = useState(false);

  const hasData = data && data.length > 0;

  // 은퇴년도 계산
  const retirementYear =
    profileData?.retirementYear || new Date().getFullYear();

  // 배우자 은퇴 년도 계산
  const spouseRetirementYear = (() => {
    if (!profileData?.hasSpouse || !profileData?.spouseIsWorking) {
      return null;
    }

    const spouseBirthYear = parseInt(profileData.spouseBirthYear);
    const spouseRetirement = parseInt(profileData.spouseRetirementAge);

    // 배우자가 은퇴하는 년도 반환
    return spouseBirthYear + spouseRetirement;
  })();

  // 소득 이벤트 추출 (시작/종료 이벤트)
  const getIncomeEvents = () => {
    const events = [];
    if (incomes && incomes.length > 0) {
      incomes.forEach((income) => {
        // 시작 이벤트
        events.push({
          year: income.startYear,
          age: income.startYear - (data[0]?.year - data[0]?.age),
          type: "start",
          category: "income",
          title: `${income.title} | 시작`,
        });

        // 종료 이벤트
        if (income.endYear) {
          events.push({
            year: income.endYear,
            age: income.endYear - (data[0]?.year - data[0]?.age),
            type: "end",
            category: "income",
            title: `${income.title} | 종료`,
          });
        }
      });
    }
    return events;
  };

  const incomeEvents = getIncomeEvents();

  // 지출 이벤트 추출 (시작/종료 이벤트)
  const getExpenseEvents = () => {
    const events = [];
    if (expenses && expenses.length > 0) {
      expenses.forEach((expense) => {
        // 시작 이벤트
        events.push({
          year: expense.startYear,
          age: expense.startYear - (data[0]?.year - data[0]?.age),
          type: "start",
          category: "expense",
          title: `${expense.title} | 시작`,
        });

        // 종료 이벤트
        if (expense.endYear) {
          events.push({
            year: expense.endYear,
            age: expense.endYear - (data[0]?.year - data[0]?.age),
            type: "end",
            category: "expense",
            title: `${expense.title} | 종료`,
          });
        }
      });
    }
    return events;
  };

  const expenseEvents = getExpenseEvents();

  // 저축/투자 이벤트 추출 (시작/종료/수령 이벤트)
  const getSavingEvents = () => {
    const events = [];
    if (savings && savings.length > 0) {
      savings.forEach((saving) => {
        // 숫자형으로 보정 (문자열로 들어오는 경우 방지)
        const sStart = Number(saving.startYear);
        const sEnd = Number(saving.endYear);

        // 시작 이벤트
        if (Number.isFinite(sStart)) {
          events.push({
            year: sStart,
            age: sStart - (data[0]?.year - data[0]?.age),
            type: "start",
            category: "saving",
            title: `${saving.title} | 시작`,
          });
        }

        // 종료 이벤트: 종료년도에 "종료" 표시
        if (Number.isFinite(sEnd)) {
          events.push({
            year: sEnd,
            age: sEnd - (data[0]?.year - data[0]?.age),
            type: "end",
            category: "saving",
            title: `${saving.title} | 종료`,
          });
        }
      });
    }
    return events;
  };

  const savingEvents = getSavingEvents();

  // 연금 이벤트 추출 (국민연금: 시작/종료, 퇴직/개인연금: 수령 시작/종료)
  const getPensionEvents = () => {
    const events = [];
    if (pensions && pensions.length > 0) {
      pensions.forEach((pension) => {
        if (pension.type === "national") {
          // 국민연금: 수령 시작/종료 이벤트
          events.push({
            year: pension.startYear,
            age: pension.startYear - (data[0]?.year - data[0]?.age),
            type: "start",
            category: "pension",
            title: `${pension.title} | 수령 시작`,
          });

          if (pension.endYear) {
            events.push({
              year: pension.endYear,
              age: pension.endYear - (data[0]?.year - data[0]?.age),
              type: "end",
              category: "pension",
              title: `${pension.title} | 수령 종료`,
            });
          }
        } else {
          // 퇴직연금/개인연금: 수령 시작/종료 이벤트
          events.push({
            year: pension.paymentStartYear,
            age: pension.paymentStartYear - (data[0]?.year - data[0]?.age),
            type: "start",
            category: "pension",
            title: `${pension.title} | 수령 시작`,
          });

          if (pension.paymentEndYear) {
            events.push({
              year: pension.paymentEndYear,
              age: pension.paymentEndYear - (data[0]?.year - data[0]?.age),
              type: "end",
              category: "pension",
              title: `${pension.title} | 수령 종료`,
            });
          }
        }
      });
    }
    return events;
  };

  const pensionEvents = getPensionEvents();

  // 부동산 이벤트 추출 (구매, 임대소득 시작/종료, 주택연금 전환, 매각)
  const getRealEstateEvents = () => {
    const events = [];
    if (realEstates && realEstates.length > 0) {
      realEstates.forEach((realEstate) => {
        // 부동산 구매 이벤트
        if (realEstate.isPurchase) {
          events.push({
            year: realEstate.startYear,
            age: realEstate.startYear - (data[0]?.year - data[0]?.age),
            type: "purchase",
            category: "realEstate",
            title: `${realEstate.title} | 구매`,
          });
        }

        // 임대소득 시작/종료 이벤트
        if (realEstate.hasRentalIncome) {
          events.push({
            year: realEstate.rentalIncomeStartYear,
            age:
              realEstate.rentalIncomeStartYear - (data[0]?.year - data[0]?.age),
            type: "start",
            category: "realEstate",
            title: `${realEstate.title} | 임대소득 시작`,
          });

          if (realEstate.rentalIncomeEndYear) {
            events.push({
              year: realEstate.rentalIncomeEndYear,
              age:
                realEstate.rentalIncomeEndYear - (data[0]?.year - data[0]?.age),
              type: "end",
              category: "realEstate",
              title: `${realEstate.title} | 임대소득 종료`,
            });
          }
        }

        // 주택연금 전환 이벤트
        if (realEstate.convertToPension) {
          events.push({
            year: realEstate.pensionStartYear,
            age: realEstate.pensionStartYear - (data[0]?.year - data[0]?.age),
            type: "conversion",
            category: "realEstate",
            title: `${realEstate.title} | 주택연금 전환`,
          });
        }

        // 매각 이벤트 (보유 종료년도)
        if (realEstate.endYear) {
          events.push({
            year: realEstate.endYear,
            age: realEstate.endYear - (data[0]?.year - data[0]?.age),
            type: "sale",
            category: "realEstate",
            title: `${realEstate.title} | 매각`,
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
    if (debts && debts.length > 0) {
      debts.forEach((debt) => {
        // 대출 시작 이벤트
        events.push({
          year: debt.startYear,
          age: debt.startYear - (data[0]?.year - data[0]?.age),
          type: "start",
          category: "debt",
          title: `${debt.title} | 대출 시작`,
        });

        // 상환 완료 이벤트 (부채 타입별 처리)
        if (debt.debtType === "bullet") {
          // 만기일시상환: endYear에 완전 상환
          events.push({
            year: debt.endYear,
            age: debt.endYear - (data[0]?.year - data[0]?.age),
            type: "repayment",
            category: "debt",
            title: `${debt.title} | 만기 상환`,
          });
        } else if (debt.debtType === "equal") {
          // 원리금균등상환: endYear에 상환 완료
          events.push({
            year: debt.endYear,
            age: debt.endYear - (data[0]?.year - data[0]?.age),
            type: "repayment",
            category: "debt",
            title: `${debt.title} | 상환 완료`,
          });
        } else if (debt.debtType === "principal") {
          // 원금균등상환: endYear에 상환 완료
          events.push({
            year: debt.endYear,
            age: debt.endYear - (data[0]?.year - data[0]?.age),
            type: "repayment",
            category: "debt",
            title: `${debt.title} | 상환 완료`,
          });
        } else if (debt.debtType === "grace") {
          // 거치식상환: 거치기간 후 원금 상환 시작
          const principalStartYear = debt.startYear + debt.gracePeriod;
          events.push({
            year: principalStartYear,
            age: principalStartYear - (data[0]?.year - data[0]?.age),
            type: "principal_start",
            category: "debt",
            title: `${debt.title} | 원금 상환 시작`,
          });

          // 원금 상환 완료
          events.push({
            year: debt.endYear,
            age: debt.endYear - (data[0]?.year - data[0]?.age),
            type: "repayment",
            category: "debt",
            title: `${debt.title} | 상환 완료`,
          });
        }
      });
    }
    return events;
  };

  // 자산 이벤트 추출 (수익형 자산 구매, 매각)
  const getAssetEvents = () => {
    const events = [];
    if (assets && assets.length > 0) {
      assets.forEach((asset) => {
        // 모든 자산 이벤트 표시
        // 자산 구매 이벤트
        if (asset.isPurchase) {
          const purchaseEvent = {
            year: asset.startYear,
            age: asset.startYear - (data[0]?.year - data[0]?.age),
            type: "purchase",
            category: "asset",
            title: `${asset.title} | 구매`,
          };
          events.push(purchaseEvent);
        }

        // 자산 매각 이벤트 (종료년도 +1)
        if (asset.endYear) {
          const saleEvent = {
            year: asset.endYear + 1,
            age: asset.endYear + 1 - (data[0]?.year - data[0]?.age),
            type: "sale",
            category: "asset",
            title: `${asset.title} | 매각`,
          };
          events.push(saleEvent);
        }
      });
    }
    return events;
  };

  const assetEvents = getAssetEvents();
  const debtEvents = getDebtEvents();

  // 이벤트를 년도별로 그룹화
  const allEvents = [
    ...incomeEvents,
    ...expenseEvents,
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

  // 차트 데이터 포맷팅
  const chartData = data.map((item) => {
    // 배우자 나이 계산
    const spouseAge =
      profileData?.hasSpouse && profileData?.spouseBirthYear
        ? item.year - parseInt(profileData.spouseBirthYear)
        : null;

    // 자녀들 나이 계산
    const childrenAges = profileData?.familyMembers
      ? profileData.familyMembers
          .filter((member) => member.relationship === "자녀")
          .map((child) => ({
            gender: child.gender || "아들",
            age: item.year - parseInt(child.birthYear),
          }))
          .filter((child) => child.age >= 0)
      : [];

    // 가족 라벨 생성
    let familyLabel = `본인 ${item.age}`;
    if (spouseAge) familyLabel += ` • 배우자 ${spouseAge}`;
    if (childrenAges.length > 0) {
      const childrenText = childrenAges
        .map((child) => `${child.gender} ${child.age}`)
        .join(", ");
      familyLabel += ` • ${childrenText}`;
    }

    return {
      age: item.age,
      year: item.year,
      amount: item.amount,
      formattedAmount: formatAmountForChart(item.amount),
      familyLabel: familyLabel,
      assetPurchases: item.assetPurchases || [],
      savingPurchases: item.savingPurchases || [],
      savingIncomes: item.savingIncomes || [],
      savingContributions: item.savingContributions || [],
      realEstatePurchases: item.realEstatePurchases || [],
      realEstateTaxes: item.realEstateTaxes || [],
      capitalGainsTaxes: item.capitalGainsTaxes || [],
      assetSales: item.assetSales || [],
      realEstateSales: item.realEstateSales || [],
      debtInjections: item.debtInjections || [],
      debtInterests: item.debtInterests || [],
      debtPrincipals: item.debtPrincipals || [],
      events: eventsByYear[item.year] || [],
    };
  });

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

  // 차트 렌더링 함수 (일반 뷰와 확대 모달에서 재사용)
  const renderChart = (height = 600, isZoomedView = false) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{
          top: 40,
          right: 30,
          left: 40,
          bottom: 120,
        }}
        onMouseMove={(state) => {
          // activeTooltipIndex를 사용하여 현재 hover 중인 데이터 찾기
          if (state && state.isTooltipActive !== false) {
            const index = state.activeTooltipIndex;
            if (index !== undefined && index >= 0 && chartData[index]) {
              setHoveredData(chartData[index]);
            }
          }
        }}
        onMouseLeave={() => {
          setHoveredData(null);
        }}
      >
        {/* 그라데이션 정의 */}
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

        {/* X축 - 나이 */}
        <XAxis
          dataKey="year"
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
            x={retirementYear}
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="10 5"
            label={{
              value: "은퇴",
              position: "top",
              offset: 10,
              style: { fill: "#9ca3af", fontSize: "12px" },
            }}
          />
        )}

        {/* 배우자 은퇴 시점 표시 */}
        {spouseRetirementYear && (
          <ReferenceLine
            x={spouseRetirementYear}
            stroke="#a78bfa"
            strokeWidth={1.5}
            strokeDasharray="10 5"
            label={{
              value: "배우자 은퇴",
              position: "top",
              offset: spouseRetirementYear === retirementYear ? 30 : 10,
              style: { fill: "#a78bfa", fontSize: "12px" },
            }}
          />
        )}

        {/* 마우스 위치 표시용 투명 툴팁 (시각적 피드백만 제공) */}
        <Tooltip
          cursor={{
            fill: "rgba(59, 130, 246, 0.1)",
          }}
          content={() => null}
          animationDuration={0}
          isAnimationActive={false}
        />

        {/* Bar 그래프 */}
        <Bar
          dataKey="amount"
          radius={[0, 0, 0, 0]}
          strokeWidth={0}
          onClick={handleBarClick}
          style={{ cursor: "pointer" }}
          animationDuration={0}
          isAnimationActive={false}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.amount >= 0 ? "#10b981" : "#ef4444"}
            />
          ))}
        </Bar>

        {/* 이벤트 마커를 표시하기 위한 투명한 레이어 - 년도별로 작고 화려한 네모 표시 */}
        {Object.keys(eventsByYear).map((year) => {
          const dataPoint = chartData.find((d) => d.year === parseInt(year));
          if (!dataPoint) return null;

          return (
            <ReferenceLine
              key={`event-marker-${year}`}
              x={dataPoint.year}
              stroke="transparent"
              strokeWidth={0}
              label={{
                value: "■",
                position: "bottom",
                offset: 25,
                style: {
                  fill: "url(#blueGradient)",
                  fontSize: "7px",
                  fontWeight: "bold",
                },
              }}
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );

  // 현재 년도 데이터 가져오기 (기본값)
  const currentYearIndex = chartData.findIndex(
    (item) => item.year === new Date().getFullYear()
  );

  // displayData: hoveredData가 있으면 우선 사용, 없으면 현재 년도 또는 첫 번째 데이터
  const displayData = hoveredData
    ? hoveredData
    : currentYearIndex >= 0
    ? chartData[currentYearIndex]
    : chartData[0];

  // 카테고리별 색상 설정 (한글 카테고리를 키로 사용)
  const categoryConfig = {
    소득: { color: "#10b981", order: 1, name: "소득" },
    지출: { color: "#ef4444", order: 2, name: "지출" },
    저축: { color: "#3b82f6", order: 3, name: "저축" },
    "저축 구매": { color: "#2563eb", order: 3, name: "저축" },
    "저축 적립": { color: "#1d4ed8", order: 3, name: "저축" },
    "저축 수령": { color: "#0891b2", order: 3, name: "저축" },
    "저축 수익": { color: "#06b6d4", order: 3, name: "저축" },
    "저축 만기": { color: "#0891b2", order: 3, name: "저축" },
    "저축 만료": { color: "#0891b2", order: 3, name: "저축" },
    국민연금: { color: "#fbbf24", order: 4, name: "연금" },
    퇴직연금: { color: "#f59e0b", order: 4, name: "연금" },
    개인연금: { color: "#eab308", order: 4, name: "연금" },
    "퇴직금 IRP": { color: "#d97706", order: 4, name: "연금" },
    "퇴직금 IRP 적립": { color: "#b45309", order: 4, name: "연금" },
    "연금 적립": { color: "#ca8a04", order: 4, name: "연금" },
    부동산: { color: "#8b5cf6", order: 5, name: "부동산" },
    임대소득: { color: "#a78bfa", order: 5, name: "부동산" },
    "임대 소득": { color: "#a78bfa", order: 5, name: "부동산" },
    "부동산 구매": { color: "#7c3aed", order: 5, name: "부동산" },
    "부동산 수령": { color: "#6d28d9", order: 5, name: "부동산" },
    "부동산 취득세": { color: "#5b21b6", order: 5, name: "부동산" },
    주택연금: { color: "#a78bfa", order: 5, name: "부동산" },
    취득세: { color: "#5b21b6", order: 5, name: "부동산" },
    양도소득세: { color: "#4c1d95", order: 5, name: "부동산" },
    양도세: { color: "#4c1d95", order: 8, name: "세금" },
    자산: { color: "#06b6d4", order: 6, name: "자산" },
    "자산 구매": { color: "#155e75", order: 6, name: "자산" },
    "자산 수령": { color: "#0891b2", order: 6, name: "자산" },
    대출: { color: "#374151", order: 7, name: "부채" },
    "대출 유입": { color: "#4b5563", order: 7, name: "부채" },
    이자: { color: "#6b7280", order: 7, name: "부채" },
    "부채 이자": { color: "#6b7280", order: 7, name: "부채" },
    "원금 상환": { color: "#9ca3af", order: 7, name: "부채" },
    "부채 원금 상환": { color: "#9ca3af", order: 7, name: "부채" },
  };

  // displayData에서 상세 정보 수집
  const yearData = detailedData.find((item) => item.year === displayData.year);
  const allItems = [];

  if (yearData && yearData.breakdown) {
    // breakdown의 positives와 negatives를 allItems에 추가
    (yearData.breakdown.positives || []).forEach((item) => {
      allItems.push({
        ...item,
        type: "positive",
      });
    });
    (yearData.breakdown.negatives || []).forEach((item) => {
      allItems.push({
        ...item,
        type: "negative",
      });
    });
  }

  // 카테고리별로 정렬
  const sortedItems = allItems.sort((a, b) => {
    const orderA = categoryConfig[a.category]?.order || 999;
    const orderB = categoryConfig[b.category]?.order || 999;
    if (orderA !== orderB) return orderA - orderB;
    return b.amount - a.amount;
  });

  // 수입과 지출 분리
  const positiveItems = sortedItems.filter(
    (item) => item.type === "positive" && item.amount > 0
  );
  const negativeItems = sortedItems.filter(
    (item) => item.type === "negative" && item.amount > 0
  );

  // 합계 계산
  const totalPositive = positiveItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalNegative = negativeItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const netCashflow = totalPositive - totalNegative;

  // 수입/지출 분포 데이터 생성 (파이 차트용)
  const allDistributionData = useMemo(() => {
    const distributionByYear = {};

    detailedData.forEach((yearData) => {
      const positives = [];
      const negatives = [];

      if (yearData.breakdown) {
        (yearData.breakdown.positives || []).forEach((item) => {
          positives.push({
            name: item.label,
            value: item.amount,
            originalValue: item.amount,
            color: categoryConfig[item.category]?.color || "#9ca3af",
          });
        });

        (yearData.breakdown.negatives || []).forEach((item) => {
          negatives.push({
            name: item.label,
            value: item.amount,
            originalValue: item.amount,
            color: categoryConfig[item.category]?.color || "#9ca3af",
          });
        });
      }

      distributionByYear[yearData.year] = { positives, negatives };
    });

    return distributionByYear;
  }, [detailedData]);

  const distributionSlices = useMemo(() => {
    if (!distributionEntry || !allDistributionData[distributionEntry.year]) {
      return { positives: [], negatives: [] };
    }
    return allDistributionData[distributionEntry.year];
  }, [distributionEntry, allDistributionData]);

  // 정렬된 분포 데이터 (금액 순)
  const sortedDistribution = useMemo(() => {
    return {
      positives: [...distributionSlices.positives].sort(
        (a, b) => b.value - a.value
      ),
      negatives: [...distributionSlices.negatives].sort(
        (a, b) => b.value - a.value
      ),
    };
  }, [distributionSlices]);

  // 총 합계 계산
  const totalPositiveValue = useMemo(() => {
    return distributionSlices.positives.reduce(
      (sum, item) => sum + item.value,
      0
    );
  }, [distributionSlices.positives]);

  const totalNegativeValue = useMemo(() => {
    return distributionSlices.negatives.reduce(
      (sum, item) => sum + item.value,
      0
    );
  }, [distributionSlices.negatives]);

  // 바 클릭 핸들러
  const handleBarClick = (barData) => {
    if (!barData || !barData.payload) return;
    setDistributionEntry(barData.payload);
    setIsDistributionOpen(true);
  };

  return (
    <>
      <div className={styles.chartContainer}>
        {!hasData ? (
          <div className={styles.noData}>데이터가 없습니다.</div>
        ) : (
          <>
            {/* 타이틀 영역 */}
            <div className={styles.chartHeader}>
              <div className={styles.chartTitleWrapper}>
                <div className={styles.chartTitle}>가계 현금 흐름</div>
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

            {/* 컨텐츠 영역: 그래프(왼쪽) + 상세정보(오른쪽) */}
            <div className={styles.chartContent}>
              {/* 왼쪽: 그래프 */}
              <div className={styles.chartArea}>
                <div className={styles.chartWrapper}>{renderChart()}</div>
              </div>

              {/* 오른쪽: 상세 패널 */}
              <div className={styles.detailPanel}>
                <div className={styles.detailPanelHeader}>
                  <div className={styles.detailPanelInfo}>
                    <div className={styles.detailPanelTitle}>
                      {displayData.year}년 순 현금흐름
                    </div>
                    <div className={styles.detailPanelMeta}>
                      {/* 본인 나이 */}
                      본인 {displayData?.age || 0}세{/* 배우자 나이 */}
                      {profileData?.hasSpouse &&
                        profileData?.spouseBirthYear && (
                          <>
                            {" "}
                            • 배우자{" "}
                            {displayData.year -
                              parseInt(profileData.spouseBirthYear)}
                            세
                          </>
                        )}
                      {/* 자녀 나이 */}
                      {profileData?.familyMembers &&
                        profileData.familyMembers
                          .filter((member) => member.relationship === "자녀")
                          .map((child) => ({
                            gender: child.gender || "아들",
                            age: displayData.year - parseInt(child.birthYear),
                          }))
                          .filter((child) => child.age >= 0).length > 0 && (
                          <>
                            <br />
                            {profileData.familyMembers
                              .filter(
                                (member) => member.relationship === "자녀"
                              )
                              .map((child) => ({
                                gender: child.gender || "아들",
                                age:
                                  displayData.year - parseInt(child.birthYear),
                              }))
                              .filter((child) => child.age >= 0)
                              .map((child) => `${child.gender} ${child.age}세`)
                              .join(", ")}
                          </>
                        )}
                    </div>
                  </div>
                  <div
                    className={styles.detailPanelTotal}
                    style={{
                      color: netCashflow >= 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {netCashflow >= 0 ? "+" : ""}
                    {formatAmountForChart(netCashflow)}
                  </div>
                </div>

                {/* 수입 항목 */}
                {positiveItems.length > 0 && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionHeader}>
                      <div className={styles.detailSectionTitle}>수입</div>
                      <div
                        className={styles.detailSectionTotal}
                        style={{ color: "#10b981" }}
                      >
                        +{formatAmountForChart(totalPositive)}
                      </div>
                    </div>
                    {positiveItems.map((item, index) => (
                      <div
                        key={`positive-${index}`}
                        className={styles.detailItem}
                      >
                        <span className={styles.detailLabelWithDot}>
                          <span
                            className={styles.detailCategoryDot}
                            style={{
                              backgroundColor:
                                categoryConfig[item.category]?.color ||
                                "#9ca3af",
                            }}
                          />
                          <span className={styles.detailLabel}>
                            {item.label}
                          </span>
                        </span>
                        <span
                          className={styles.detailValue}
                          style={{ color: "#10b981" }}
                        >
                          +{formatAmountForChart(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 지출 항목 */}
                {negativeItems.length > 0 && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionHeader}>
                      <div className={styles.detailSectionTitle}>지출</div>
                      <div
                        className={styles.detailSectionTotal}
                        style={{ color: "#ef4444" }}
                      >
                        -{formatAmountForChart(totalNegative)}
                      </div>
                    </div>
                    {negativeItems.map((item, index) => (
                      <div
                        key={`negative-${index}`}
                        className={styles.detailItem}
                      >
                        <span className={styles.detailLabelWithDot}>
                          <span
                            className={styles.detailCategoryDot}
                            style={{
                              backgroundColor:
                                categoryConfig[item.category]?.color ||
                                "#9ca3af",
                            }}
                          />
                          <span className={styles.detailLabel}>
                            {item.label}
                          </span>
                        </span>
                        <span
                          className={styles.detailValue}
                          style={{ color: "#ef4444" }}
                        >
                          -{formatAmountForChart(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 이벤트 */}
                {displayData.events && displayData.events.length > 0 && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailDivider} />
                    <div className={styles.detailSectionTitle}>이벤트</div>
                    {displayData.events.map((event, index) => (
                      <div
                        key={`event-${index}`}
                        className={styles.detailEventItem}
                      >
                        <span
                          className={styles.detailEventDot}
                          style={{
                            backgroundColor:
                              event.category === "income"
                                ? "#10b981"
                                : event.category === "expense"
                                ? "#ef4444"
                                : event.category === "saving"
                                ? "#3b82f6"
                                : event.category === "pension"
                                ? "#fbbf24"
                                : event.category === "realEstate"
                                ? "#8b5cf6"
                                : event.category === "asset"
                                ? "#06b6d4"
                                : event.category === "debt"
                                ? "#374151"
                                : "#374151",
                          }}
                        />
                        <span className={styles.detailEventText}>
                          {event.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {positiveItems.length === 0 && negativeItems.length === 0 && (
                  <div className={styles.detailEmptyState}>
                    마우스를 차트에 올려보세요
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 확대 모달 */}
      {hasData && (
        <ChartZoomModal
          isOpen={isZoomed}
          onClose={() => setIsZoomed(false)}
          title="가계 현금 흐름"
        >
          <div className={styles.chartContent} style={{ height: "100%" }}>
            {/* 왼쪽: 그래프 */}
            <div className={styles.chartArea}>
              <div style={{ width: "100%", height: "100%" }}>
                {renderChart("100%", true)}
              </div>
            </div>

            {/* 오른쪽: 상세 패널 */}
            <div className={styles.detailPanel}>
              <div className={styles.detailPanelHeader}>
                <div className={styles.detailPanelTitle}>
                  {displayData.year}년 순 현금흐름
                </div>
                <div
                  className={styles.detailPanelTotal}
                  style={{
                    color: netCashflow >= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  {netCashflow >= 0 ? "+" : ""}
                  {formatAmountForChart(netCashflow)}
                </div>
              </div>

              {/* 수입 항목 */}
              {positiveItems.length > 0 && (
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionHeader}>
                    <div className={styles.detailSectionTitle}>수입</div>
                    <div
                      className={styles.detailSectionTotal}
                      style={{ color: "#10b981" }}
                    >
                      +{formatAmountForChart(totalPositive)}
                    </div>
                  </div>
                  {positiveItems.map((item, index) => (
                    <div
                      key={`positive-${index}`}
                      className={styles.detailItem}
                    >
                      <span className={styles.detailLabelWithDot}>
                        <span
                          className={styles.detailCategoryDot}
                          style={{
                            backgroundColor:
                              categoryConfig[item.category]?.color || "#9ca3af",
                          }}
                        />
                        <span className={styles.detailLabel}>{item.label}</span>
                      </span>
                      <span
                        className={styles.detailValue}
                        style={{ color: "#10b981" }}
                      >
                        +{formatAmountForChart(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 지출 항목 */}
              {negativeItems.length > 0 && (
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionHeader}>
                    <div className={styles.detailSectionTitle}>지출</div>
                    <div
                      className={styles.detailSectionTotal}
                      style={{ color: "#ef4444" }}
                    >
                      -{formatAmountForChart(totalNegative)}
                    </div>
                  </div>
                  {negativeItems.map((item, index) => (
                    <div
                      key={`negative-${index}`}
                      className={styles.detailItem}
                    >
                      <span className={styles.detailLabelWithDot}>
                        <span
                          className={styles.detailCategoryDot}
                          style={{
                            backgroundColor:
                              categoryConfig[item.category]?.color || "#9ca3af",
                          }}
                        />
                        <span className={styles.detailLabel}>{item.label}</span>
                      </span>
                      <span
                        className={styles.detailValue}
                        style={{ color: "#ef4444" }}
                      >
                        -{formatAmountForChart(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 이벤트 */}
              {displayData.events && displayData.events.length > 0 && (
                <div className={styles.detailSection}>
                  <div className={styles.detailDivider} />
                  <div className={styles.detailSectionTitle}>이벤트</div>
                  {displayData.events.map((event, index) => (
                    <div
                      key={`event-${index}`}
                      className={styles.detailEventItem}
                    >
                      <span
                        className={styles.detailEventDot}
                        style={{
                          backgroundColor:
                            event.category === "income"
                              ? "#10b981"
                              : event.category === "expense"
                              ? "#ef4444"
                              : event.category === "saving"
                              ? "#3b82f6"
                              : event.category === "pension"
                              ? "#fbbf24"
                              : event.category === "realEstate"
                              ? "#8b5cf6"
                              : event.category === "asset"
                              ? "#06b6d4"
                              : event.category === "debt"
                              ? "#374151"
                              : "#374151",
                        }}
                      />
                      <span className={styles.detailEventText}>
                        {event.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {positiveItems.length === 0 && negativeItems.length === 0 && (
                <div className={styles.detailEmptyState}>
                  마우스를 차트에 올려보세요
                </div>
              )}
            </div>
          </div>
        </ChartZoomModal>
      )}

      {/* 수입/지출 분포 모달 (파이 차트) */}
      {hasData && (
        <ChartZoomModal
          isOpen={isDistributionOpen}
          onClose={() => {
            setIsDistributionOpen(false);
            setDistributionEntry(null);
          }}
          title={
            distributionEntry
              ? `${distributionEntry.year}년 현금 흐름 구성`
              : "현금 흐름 구성"
          }
        >
          <div className={styles.distributionModalContent}>
            {distributionSlices.positives.length === 0 &&
            distributionSlices.negatives.length === 0 ? (
              <div className={styles.noDistributionData}>
                해당 연도의 현금 흐름 구성을 계산할 수 없습니다.
              </div>
            ) : (
              <>
                {/* 수입 섹션 */}
                {sortedDistribution.positives.length > 0 && (
                  <div className={styles.distributionSection}>
                    <h4>수입</h4>
                    <OptimizedPieChart
                      data={sortedDistribution.positives}
                      title="수입"
                    />
                    <div className={styles.totalValue}>
                      총 수입: +{formatAmountForChart(totalPositiveValue)}
                    </div>
                    <div className={styles.distributionList}>
                      {sortedDistribution.positives.map((slice) => {
                        const percent =
                          totalPositiveValue > 0
                            ? (
                                (slice.value / totalPositiveValue) *
                                100
                              ).toFixed(1)
                            : "0.0";
                        return (
                          <div
                            key={`positive-list-${slice.name}`}
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
                              +
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
                  </div>
                )}

                {/* 지출 섹션 */}
                {sortedDistribution.negatives.length > 0 && (
                  <div className={styles.distributionSection}>
                    <h4>지출</h4>
                    <OptimizedPieChart
                      data={sortedDistribution.negatives}
                      title="지출"
                    />
                    <div className={styles.totalValue}>
                      총 지출: -{formatAmountForChart(totalNegativeValue)}
                    </div>
                    <div className={styles.distributionList}>
                      {sortedDistribution.negatives.map((slice) => {
                        const percent =
                          totalNegativeValue > 0
                            ? (
                                (slice.value / totalNegativeValue) *
                                100
                              ).toFixed(1)
                            : "0.0";
                        return (
                          <div
                            key={`negative-list-${slice.name}`}
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
                  </div>
                )}
              </>
            )}
          </div>
        </ChartZoomModal>
      )}
    </>
  );
}

export default RechartsCashflowChart;
