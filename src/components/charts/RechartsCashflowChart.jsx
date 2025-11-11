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
        onClick={(e) => {
          // 클릭한 위치의 년도 데이터 찾기
          if (e && e.activeLabel) {
            const year = parseInt(e.activeLabel);
            const clickedData = chartData.find((d) => d.year === year);
            if (clickedData) {
              handleBarClick({ payload: clickedData });
            }
          } else if (e && e.activePayload && e.activePayload[0]) {
            handleBarClick(e.activePayload[0]);
          }
        }}
        style={{ cursor: "pointer" }}
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

        {/* 툴팁 */}
        <Tooltip
          cursor={{
            fill: "rgba(59, 130, 246, 0.15)",
            stroke: "#3b82f6",
            strokeWidth: 2,
          }}
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload;
              const detailData = detailedData.find(
                (item) => item.year === data.year
              );

              // 카테고리별 색상 설정 (모달과 동일)
              const categoryConfig = {
                소득: { color: "#10b981", name: "소득" },
                지출: { color: "#ef4444", name: "지출" },
                저축: { color: "#3b82f6", name: "저축/투자" },
                "저축 구매": { color: "#3b82f6", name: "저축/투자" },
                "저축 적립": { color: "#3b82f6", name: "저축/투자" },
                "저축 수령": { color: "#3b82f6", name: "저축/투자" },
                "저축 수익": { color: "#3b82f6", name: "저축/투자" },
                "저축 만기": { color: "#3b82f6", name: "저축/투자" },
                "저축 만료": { color: "#3b82f6", name: "저축/투자" },
                국민연금: { color: "#fbbf24", name: "연금" },
                퇴직연금: { color: "#fbbf24", name: "연금" },
                개인연금: { color: "#fbbf24", name: "연금" },
                "퇴직금 IRP": { color: "#fbbf24", name: "연금" },
                "퇴직금 IRP 적립": { color: "#fbbf24", name: "연금" },
                "연금 적립": { color: "#fbbf24", name: "연금" },
                부동산: { color: "#8b5cf6", name: "부동산" },
                임대소득: { color: "#8b5cf6", name: "부동산" },
                "임대 소득": { color: "#8b5cf6", name: "부동산" },
                "부동산 구매": { color: "#8b5cf6", name: "부동산" },
                "부동산 수령": { color: "#8b5cf6", name: "부동산" },
                "부동산 취득세": { color: "#8b5cf6", name: "부동산" },
                주택연금: { color: "#8b5cf6", name: "부동산" },
                취득세: { color: "#8b5cf6", name: "부동산" },
                양도소득세: { color: "#8b5cf6", name: "부동산" },
                양도세: { color: "#ef4444", name: "세금" },
                자산: { color: "#06b6d4", name: "자산" },
                "자산 구매": { color: "#06b6d4", name: "자산" },
                "자산 수령": { color: "#06b6d4", name: "자산" },
                대출: { color: "#374151", name: "부채" },
                "대출 유입": { color: "#374151", name: "부채" },
                이자: { color: "#374151", name: "부채" },
                "부채 이자": { color: "#374151", name: "부채" },
                "원금 상환": { color: "#374151", name: "부채" },
                "부채 원금 상환": { color: "#374151", name: "부채" },
              };

              // breakdown에서 수입/지출 데이터 가져오기 (카테고리별로 그룹화)
              const positivesByCategory = {};
              const negativesByCategory = {};

              if (detailData && detailData.breakdown) {
                (detailData.breakdown.positives || []).forEach((item) => {
                  const categoryName =
                    categoryConfig[item.category]?.name ||
                    categoryConfig[item.label]?.name ||
                    "기타";
                  const color =
                    categoryConfig[item.category]?.color ||
                    categoryConfig[item.label]?.color ||
                    "#9ca3af";

                  if (!positivesByCategory[categoryName]) {
                    positivesByCategory[categoryName] = {
                      color:
                        categoryConfig[item.category]?.color ||
                        categoryConfig[item.label]?.color ||
                        "#9ca3af",
                      items: [],
                    };
                  }
                  positivesByCategory[categoryName].items.push({
                    label: item.label,
                    amount: item.amount,
                    color: color,
                  });
                });

                (detailData.breakdown.negatives || []).forEach((item) => {
                  const categoryName =
                    categoryConfig[item.category]?.name ||
                    categoryConfig[item.label]?.name ||
                    "기타";
                  const color =
                    categoryConfig[item.category]?.color ||
                    categoryConfig[item.label]?.color ||
                    "#9ca3af";

                  if (!negativesByCategory[categoryName]) {
                    negativesByCategory[categoryName] = {
                      color:
                        categoryConfig[item.category]?.color ||
                        categoryConfig[item.label]?.color ||
                        "#9ca3af",
                      items: [],
                    };
                  }
                  negativesByCategory[categoryName].items.push({
                    label: item.label,
                    amount: item.amount,
                    color: color,
                  });
                });
              }

              // 전체 합계를 위한 배열 생성
              const positives = Object.values(positivesByCategory)
                .map((cat) => cat.items)
                .flat();
              const negatives = Object.values(negativesByCategory)
                .map((cat) => cat.items)
                .flat();

              const totalPositive = positives.reduce(
                (sum, item) => sum + item.amount,
                0
              );
              const totalNegative = negatives.reduce(
                (sum, item) => sum + item.amount,
                0
              );
              const netCashflow = data.amount || 0;

              return (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.7)",
                    backdropFilter: "blur(12px)",
                    padding: "14px 18px",
                    borderRadius: "10px",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    color: "#1f2937",
                    fontSize: "13px",
                    pointerEvents: "none",
                    minWidth: "240px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* 년도 */}
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                      borderBottom: "1px solid rgba(0,0,0,0.1)",
                      paddingBottom: "6px",
                      color: "#111827",
                    }}
                  >
                    {data.year}년
                  </div>

                  {/* 가족 구성 */}
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "10px",
                    }}
                  >
                    본인 {data.age}세
                    {profileData?.hasSpouse &&
                      profileData?.spouseBirthYear &&
                      ` • 배우자 ${
                        data.year - parseInt(profileData.spouseBirthYear)
                      }세`}
                    {profileData?.familyMembers &&
                      profileData.familyMembers
                        .filter((member) => member.relationship === "자녀")
                        .map((child) => ({
                          gender: child.gender || "아들",
                          age: data.year - parseInt(child.birthYear),
                        }))
                        .filter((child) => child.age >= 0).length > 0 &&
                      ` • ${profileData.familyMembers
                        .filter((member) => member.relationship === "자녀")
                        .map((child) => ({
                          gender: child.gender || "아들",
                          age: data.year - parseInt(child.birthYear),
                        }))
                        .filter((child) => child.age >= 0)
                        .map((child) => `${child.gender} ${child.age}세`)
                        .join(" • ")}`}
                  </div>

                  {/* 순 현금흐름 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontWeight: "bold",
                      color: "#374151",
                      fontSize: "14px",
                    }}
                  >
                    <span>순 현금흐름</span>
                    <span
                      style={{
                        color: netCashflow >= 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {netCashflow >= 0 ? "+" : ""}
                      {formatAmountForChart(netCashflow)}
                    </span>
                  </div>

                  {/* 수입 */}
                  {positives.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "14px",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        <span style={{ color: "#4b5563" }}>수입</span>
                        <span style={{ color: "#10b981" }}>
                          +{formatAmountForChart(totalPositive)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          paddingLeft: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        {Object.entries(positivesByCategory).map(
                          ([categoryName, categoryData]) =>
                            categoryData.items.map((item, index) => (
                              <div
                                key={`positive-${categoryName}-${index}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: item.color,
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ color: item.color }}>
                                  {item.label}
                                </span>
                                <span
                                  style={{
                                    marginLeft: "auto",
                                    color: item.color,
                                    fontWeight: "500",
                                  }}
                                >
                                  +{formatAmountForChart(item.amount)}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* 지출 */}
                  {negatives.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "14px",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        <span style={{ color: "#4b5563" }}>지출</span>
                        <span style={{ color: "#ef4444" }}>
                          -{formatAmountForChart(totalNegative)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          paddingLeft: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        {Object.entries(negativesByCategory).map(
                          ([categoryName, categoryData]) =>
                            categoryData.items.map((item, index) => (
                              <div
                                key={`negative-${categoryName}-${index}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: item.color,
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ color: item.color }}>
                                  {item.label}
                                </span>
                                <span
                                  style={{
                                    marginLeft: "auto",
                                    color: item.color,
                                    fontWeight: "500",
                                  }}
                                >
                                  -{formatAmountForChart(item.amount)}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          }}
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
              style={{ cursor: "pointer" }}
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

  // 카테고리별 색상 설정 (한글 카테고리를 키로 사용)
  const categoryConfig = {
    소득: { color: "#10b981", order: 1, name: "소득" },
    지출: { color: "#ef4444", order: 2, name: "지출" },
    저축: { color: "#3b82f6", order: 3, name: "저축" },
    "저축 구매": { color: "#3b82f6", order: 3, name: "저축" },
    "저축 적립": { color: "#3b82f6", order: 3, name: "저축" },
    "저축 수령": { color: "#3b82f6", order: 3, name: "저축" },
    "저축 수익": { color: "#3b82f6", order: 3, name: "저축" },
    "저축 만기": { color: "#3b82f6", order: 3, name: "저축" },
    "저축 만료": { color: "#3b82f6", order: 3, name: "저축" },
    국민연금: { color: "#fbbf24", order: 4, name: "연금" },
    퇴직연금: { color: "#fbbf24", order: 4, name: "연금" },
    개인연금: { color: "#fbbf24", order: 4, name: "연금" },
    "퇴직금 IRP": { color: "#fbbf24", order: 4, name: "연금" },
    "퇴직금 IRP 적립": { color: "#fbbf24", order: 4, name: "연금" },
    "연금 적립": { color: "#fbbf24", order: 4, name: "연금" },
    부동산: { color: "#8b5cf6", order: 5, name: "부동산" },
    임대소득: { color: "#8b5cf6", order: 5, name: "부동산" },
    "임대 소득": { color: "#8b5cf6", order: 5, name: "부동산" },
    "부동산 구매": { color: "#8b5cf6", order: 5, name: "부동산" },
    "부동산 수령": { color: "#8b5cf6", order: 5, name: "부동산" },
    "부동산 취득세": { color: "#8b5cf6", order: 5, name: "부동산" },
    주택연금: { color: "#8b5cf6", order: 5, name: "부동산" },
    취득세: { color: "#8b5cf6", order: 5, name: "부동산" },
    양도소득세: { color: "#8b5cf6", order: 5, name: "부동산" },
    양도세: { color: "#ef4444", order: 8, name: "세금" },
    자산: { color: "#06b6d4", order: 6, name: "자산" },
    "자산 구매": { color: "#06b6d4", order: 6, name: "자산" },
    "자산 수령": { color: "#06b6d4", order: 6, name: "자산" },
    대출: { color: "#374151", order: 7, name: "부채" },
    "대출 유입": { color: "#374151", order: 7, name: "부채" },
    이자: { color: "#374151", order: 7, name: "부채" },
    "부채 이자": { color: "#374151", order: 7, name: "부채" },
    "원금 상환": { color: "#374151", order: 7, name: "부채" },
    "부채 원금 상환": { color: "#374151", order: 7, name: "부채" },
  };

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

            {/* 컨텐츠 영역: 그래프 */}
            <div className={styles.chartWrapper}>{renderChart()}</div>
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
          <div style={{ width: "100%", height: "100%" }}>
            {renderChart("100%", true)}
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
