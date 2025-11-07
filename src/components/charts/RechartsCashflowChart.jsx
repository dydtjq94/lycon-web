import React, { useState } from "react";
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
import { formatAmountForChart } from "../../utils/format";
import ChartZoomModal from "./ChartZoomModal";
import styles from "./RechartsCashflowChart.module.css";

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
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.noData}>데이터가 없습니다.</div>
      </div>
    );
  }

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
          title: `${income.title} 시작`,
        });

        // 종료 이벤트
        if (income.endYear) {
          events.push({
            year: income.endYear,
            age: income.endYear - (data[0]?.year - data[0]?.age),
            type: "end",
            category: "income",
            title: `${income.title} 종료`,
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
          title: `${expense.title} 시작`,
        });

        // 종료 이벤트
        if (expense.endYear) {
          events.push({
            year: expense.endYear,
            age: expense.endYear - (data[0]?.year - data[0]?.age),
            type: "end",
            category: "expense",
            title: `${expense.title} 종료`,
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
            title: `${saving.title} 시작`,
          });
        }

        // 종료 이벤트: 종료년도에 "종료" 표시
        if (Number.isFinite(sEnd)) {
          events.push({
            year: sEnd,
            age: sEnd - (data[0]?.year - data[0]?.age),
            type: "end",
            category: "saving",
            title: `${saving.title} 종료`,
          });

          // 수령 이벤트: 종료년도에 바로 "수령" 표시 (종료와 동시에 수령)
          events.push({
            year: sEnd,
            age: sEnd - (data[0]?.year - data[0]?.age),
            type: "withdrawal",
            category: "saving",
            title: `${saving.title} 수령`,
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
            title: `${pension.title} 수령 시작`,
          });

          if (pension.endYear) {
            events.push({
              year: pension.endYear,
              age: pension.endYear - (data[0]?.year - data[0]?.age),
              type: "end",
              category: "pension",
              title: `${pension.title} 수령 종료`,
            });
          }
        } else {
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
            title: `${realEstate.title} 구매`,
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
            title: `${realEstate.title} 임대소득 시작`,
          });

          if (realEstate.rentalIncomeEndYear) {
            events.push({
              year: realEstate.rentalIncomeEndYear,
              age:
                realEstate.rentalIncomeEndYear - (data[0]?.year - data[0]?.age),
              type: "end",
              category: "realEstate",
              title: `${realEstate.title} 임대소득 종료`,
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
            title: `${realEstate.title} 주택연금 전환`,
          });
        }

        // 매각 이벤트 (보유 종료년도)
        if (realEstate.endYear) {
          events.push({
            year: realEstate.endYear,
            age: realEstate.endYear - (data[0]?.year - data[0]?.age),
            type: "sale",
            category: "realEstate",
            title: `${realEstate.title} 매각`,
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
            title: `${asset.title} 구매`,
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
            title: `${asset.title} 매각`,
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
  const chartData = data.map((item) => ({
    age: item.age,
    year: item.year,
    amount: item.amount,
    formattedAmount: formatAmountForChart(item.amount),
    assetPurchases: item.assetPurchases || [],
    savingPurchases: item.savingPurchases || [], // 저축 구매 추가
    savingIncomes: item.savingIncomes || [], // 저축 수익 (배당/이자) 추가
    savingContributions: item.savingContributions || [], // 저축 적립 추가
    realEstatePurchases: item.realEstatePurchases || [],
    realEstateTaxes: item.realEstateTaxes || [], // 부동산 취득세 추가
    capitalGainsTaxes: item.capitalGainsTaxes || [], // 부동산 양도소득세 추가
    assetSales: item.assetSales || [],
    realEstateSales: item.realEstateSales || [],
    debtInjections: item.debtInjections || [],
    debtInterests: item.debtInterests || [],
    debtPrincipals: item.debtPrincipals || [],
    // 이벤트 정보 추가
    events: eventsByYear[item.year] || [],
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

        {/* 커스텀 툴팁 */}
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload;
              const yearData = detailedData.find(
                (item) => item.year === data.year
              );

              if (yearData) {
                // breakdown 데이터에서 연금 항목들 추출
                let totalPensionIncome = 0;
                let totalPensionExpense = 0;

                if (yearData.breakdown) {
                  // 연금 수입 (국민연금, 퇴직연금, 개인연금, 퇴직금 IRP 수령)
                  (yearData.breakdown.positives || []).forEach((item) => {
                    if (
                      item.category === "국민연금" ||
                      item.category === "퇴직연금" ||
                      item.category === "개인연금" ||
                      item.category === "퇴직금 IRP"
                    ) {
                      totalPensionIncome += item.amount || 0;
                    }
                  });

                  // 연금 적립 (개인연금, 퇴직금 IRP 적립)
                  (yearData.breakdown.negatives || []).forEach((item) => {
                    if (item.category === "연금 적립") {
                      totalPensionExpense += item.amount || 0;
                    }
                  });
                }

                // 총 수입과 총 지출 계산
                const totalAssetPurchaseExpense = (
                  data.assetPurchases || []
                ).reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
                const totalRealEstatePurchaseExpense = (
                  data.realEstatePurchases || []
                ).reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
                const totalRealEstateTaxExpense = (
                  data.realEstateTaxes || []
                ).reduce((sum, tax) => sum + (tax.amount || 0), 0);
                const totalCapitalGainsTaxExpense = (
                  data.capitalGainsTaxes || []
                ).reduce((sum, tax) => sum + (tax.amount || 0), 0);

                const totalIncome =
                  yearData.income +
                  totalPensionIncome +
                  (yearData.rentalIncome || 0) +
                  (yearData.realEstatePension || 0) +
                  (yearData.assetIncome || 0) +
                  (yearData.realEstateSale || 0) +
                  (yearData.assetSale || 0) +
                  (yearData.savingMaturity || 0) +
                  (yearData.debtInjection || 0);
                const totalExpense =
                  yearData.expense +
                  (yearData.savings || 0) +
                  (yearData.debtInterest || 0) +
                  (yearData.debtPrincipal || 0) +
                  totalAssetPurchaseExpense +
                  totalRealEstatePurchaseExpense +
                  totalRealEstateTaxExpense +
                  totalCapitalGainsTaxExpense;

                // 배우자 나이 계산
                const spouseAge =
                  profileData?.hasSpouse && profileData?.spouseBirthYear
                    ? data.year - parseInt(profileData.spouseBirthYear)
                    : null;

                // 배우자 은퇴 나이
                const spouseRetirementAge = profileData?.spouseRetirementAge
                  ? parseInt(profileData.spouseRetirementAge)
                  : null;

                // 자녀들 나이 계산
                const childrenAges = profileData?.familyMembers
                  ? profileData.familyMembers
                      .filter((member) => member.relationship === "자녀")
                      .map((child) => ({
                        gender: child.gender || "아들",
                        age: data.year - parseInt(child.birthYear),
                      }))
                      .filter((child) => child.age >= 0) // 태어난 자녀만 표시
                  : [];

                // 자녀 나이 텍스트 생성 (예: "아들 4, 딸 2")
                const childrenAgeText =
                  childrenAges.length > 0
                    ? childrenAges
                        .map((child) => `${child.gender} ${child.age}`)
                        .join(", ")
                    : "";

                return (
                  <div
                    className={styles.customTooltip}
                    data-zoomed={isZoomedView}
                  >
                    <div className={styles.tooltipHeader}>
                      <div className={styles.tooltipYearRow}>
                        <div className={styles.tooltipYear}>{data.year}</div>
                        <div className={styles.tooltipBadges}>
                          {/* 이벤트 표시를 년도 오른쪽으로 이동 */}
                          {data.age === retirementAge && (
                            <div className={styles.retirementWarning}>은퇴</div>
                          )}
                          {spouseAge && spouseAge === spouseRetirementAge && (
                            <div className={styles.spouseRetirementWarning}>
                              배우자 은퇴
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.tooltipAge}>
                        본인 {data.age}
                        {spouseAge && ` • 배우자 ${spouseAge}`}
                      </div>
                      {childrenAgeText && (
                        <div className={styles.tooltipChildren}>
                          {childrenAgeText}
                        </div>
                      )}
                    </div>
                    <div className={styles.tooltipBreakdown}>
                      <div className={styles.tooltipItem}>
                        <span className={styles.tooltipLabel}>
                          순 현금흐름:
                        </span>
                        <span
                          className={`${styles.tooltipValue} ${
                            data.amount >= 0 ? styles.positive : styles.negative
                          } ${styles.tooltipValueBold}`}
                          style={{
                            color: data.amount >= 0 ? "#059669" : "#dc2626",
                          }}
                        >
                          {data.amount >= 0 ? "+" : ""}
                          {formatAmountForChart(data.amount)}
                        </span>
                      </div>
                      <div className={styles.tooltipItem}>
                        <span className={styles.tooltipLabel}>총 수입:</span>
                        <span className={styles.tooltipValue}>
                          +{formatAmountForChart(totalIncome)}
                        </span>
                      </div>
                      <div className={styles.tooltipItem}>
                        <span className={styles.tooltipLabel}>총 지출:</span>
                        <span className={styles.tooltipValue}>
                          -{formatAmountForChart(totalExpense)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.tooltipDetails}>
                      {/* 모든 항목을 수집하고 +와 -로 분리하여 정렬 */}
                      {(() => {
                        const allItems = [];

                        // 수입 항목들
                        incomes
                          .filter(
                            (income) =>
                              data.year >= income.startYear &&
                              data.year <= income.endYear
                          )
                          .forEach((income, index) => {
                            const yearsElapsed = data.year - income.startYear;
                            const growthRate = income.growthRate / 100;
                            const yearlyAmount =
                              income.frequency === "monthly"
                                ? income.amount * 12
                                : income.amount;
                            const adjustedAmount =
                              yearlyAmount *
                              Math.pow(1 + growthRate, yearsElapsed);

                            allItems.push({
                              key: `income-${index}`,
                              label: income.title,
                              value: adjustedAmount,
                              type: "positive",
                              category: "income",
                            });
                          });

                        // 지출 항목들
                        expenses
                          .filter(
                            (expense) =>
                              data.year >= expense.startYear &&
                              data.year <= expense.endYear
                          )
                          .forEach((expense, index) => {
                            const yearsElapsed = data.year - expense.startYear;
                            const growthRate = expense.growthRate / 100;
                            const yearlyAmount =
                              expense.frequency === "monthly"
                                ? expense.amount * 12
                                : expense.amount;
                            const adjustedAmount =
                              yearlyAmount *
                              Math.pow(1 + growthRate, yearsElapsed);

                            allItems.push({
                              key: `expense-${index}`,
                              label: expense.title,
                              value: adjustedAmount,
                              type: "negative",
                              category: "expense",
                            });
                          });

                        // 연금 항목들 (breakdown 데이터에서 추출)
                        if (yearData.breakdown) {
                          // 연금 수입 (국민연금, 퇴직연금, 개인연금, 퇴직금 IRP 수령)
                          (yearData.breakdown.positives || []).forEach(
                            (item) => {
                              if (
                                item.category === "국민연금" ||
                                item.category === "퇴직연금" ||
                                item.category === "개인연금" ||
                                item.category === "퇴직금 IRP"
                              ) {
                                allItems.push({
                                  key:
                                    item.key ||
                                    `pension-positive-${item.label}`,
                                  label: item.label,
                                  value: item.amount || 0,
                                  type: "positive",
                                  category: "pension",
                                });
                              }
                            }
                          );

                          // 연금 적립 (개인연금, 퇴직금 IRP 적립)
                          (yearData.breakdown.negatives || []).forEach(
                            (item) => {
                              if (item.category === "연금 적립") {
                                allItems.push({
                                  key:
                                    item.key ||
                                    `pension-negative-${item.label}`,
                                  label: item.label,
                                  value: item.amount || 0,
                                  type: "negative",
                                  category: "pension",
                                });
                              }
                            }
                          );
                        }

                        // 저축/투자 항목들은 savingContributions, savingIncomes, savingPurchases 배열로 표시됨 (중복 방지)

                        // 부동산 임대 수입
                        if (yearData.rentalIncome > 0) {
                          // 해당 년도에 임대 수입이 있는 부동산들 찾기
                          const rentalRealEstates = realEstates.filter(
                            (re) =>
                              re.hasRentalIncome === true &&
                              data.year >= re.rentalIncomeStartYear &&
                              data.year <= (re.rentalIncomeEndYear || data.year)
                          );

                          if (rentalRealEstates.length > 0) {
                            rentalRealEstates.forEach((re, index) => {
                              // 연간 임대소득 = 월 임대소득 * 12
                              const yearlyRentalIncome =
                                (Number(re.monthlyRentalIncome) || 0) * 12;
                              allItems.push({
                                key: `rentalIncome-${index}`,
                                label: `${re.title} (임대소득)`,
                                value: yearlyRentalIncome,
                                type: "positive",
                                category: "realEstate",
                              });
                            });
                          }
                        }

                        // 주택 연금 수입
                        if (yearData.realEstatePension > 0) {
                          // 해당 연도에 주택 연금을 받는 부동산 찾기
                          const realEstateWithPension = realEstates.find(
                            (re) =>
                              re.convertToPension === true &&
                              data.year >= re.pensionStartYear
                          );

                          const label = realEstateWithPension
                            ? `${realEstateWithPension.title} (주택연금)`
                            : "주택연금";

                          allItems.push({
                            key: "realEstatePension",
                            label: label,
                            value: yearData.realEstatePension,
                            type: "positive",
                            category: "realEstate",
                          });
                        }

                        // 부동산 매각 수입 (상세 정보 표시)
                        if (
                          data.realEstateSales &&
                          data.realEstateSales.length > 0
                        ) {
                          data.realEstateSales.forEach((sale, index) => {
                            allItems.push({
                              key: `realEstateSale-${index}`,
                              label: `${sale.title} (매각)`,
                              value: sale.amount,
                              type: "positive",
                              category: "realEstate",
                            });
                          });
                        }

                        // 자산 수익 (수익형 자산)
                        assets
                          .filter(
                            (asset) =>
                              asset.assetType === "income" &&
                              asset.incomeRate > 0 &&
                              // 연말 기준: 시작 다음 해부터 수익 발생
                              data.year > asset.startYear &&
                              data.year <= asset.endYear
                          )
                          .forEach((asset, index) => {
                            // 전년도 말 자산 가치 기준으로 수익 계산
                            // 전년도 말 자산 가치 = currentValue * (1 + growthRate)^(year - startYear - 1)
                            const yearsElapsed = data.year - asset.startYear; // 시작부터 현재 해까지 경과 년수
                            const growthRate = asset.growthRate || 0;

                            const prevYearEndValue =
                              asset.currentValue *
                              Math.pow(1 + growthRate, yearsElapsed - 1);

                            const annualIncome =
                              prevYearEndValue * asset.incomeRate;

                            allItems.push({
                              key: `asset-income-${index}`,
                              label: `${asset.title} (수익)`,
                              value: annualIncome,
                              type: "positive",
                              category: "asset",
                            });
                          });

                        // 자산 매각 수입 (상세 정보 표시)
                        if (data.assetSales && data.assetSales.length > 0) {
                          data.assetSales.forEach((sale, index) => {
                            allItems.push({
                              key: `assetSale-${index}`,
                              label: `${sale.title} (매각)`,
                              value: sale.amount,
                              type: "positive",
                              category: "asset",
                            });
                          });
                        }

                        // 저축 수익 (배당/이자) - 수익형 저축
                        if (
                          data.savingIncomes &&
                          data.savingIncomes.length > 0
                        ) {
                          data.savingIncomes.forEach((income, index) => {
                            allItems.push({
                              key: `savingIncome-${index}`,
                              label: `${income.title} (배당/이자)`,
                              value: income.amount,
                              type: "positive",
                              category: "saving",
                            });
                          });
                        }

                        // 저축 만료
                        if (yearData.savingMaturity > 0) {
                          // 저축 만료 상세 정보가 있으면 개별 표시
                          if (
                            yearData.savingMaturities &&
                            yearData.savingMaturities.length > 0
                          ) {
                            yearData.savingMaturities.forEach(
                              (saving, index) => {
                                allItems.push({
                                  key: `savingMaturity-${index}`,
                                  label: `${saving.title} (매도/만료)`,
                                  value: saving.amount,
                                  type: "positive",
                                  category: "saving",
                                });
                              }
                            );
                          } else {
                            // 상세 정보가 없으면 기본 표시
                            allItems.push({
                              key: "savingMaturity",
                              label: "저축 (매도/만료)",
                              value: yearData.savingMaturity,
                              type: "positive",
                              category: "saving",
                            });
                          }
                        }

                        // 부동산 구매 (지출)
                        if (
                          data.realEstatePurchases &&
                          data.realEstatePurchases.length > 0
                        ) {
                          data.realEstatePurchases.forEach(
                            (purchase, index) => {
                              allItems.push({
                                key: `realEstatePurchase-${index}`,
                                label: `${purchase.title} (구매)`,
                                value: purchase.amount,
                                type: "negative",
                                category: "realEstate",
                              });
                            }
                          );
                        }

                        // 부동산 취득세 (지출)
                        if (
                          data.realEstateTaxes &&
                          data.realEstateTaxes.length > 0
                        ) {
                          data.realEstateTaxes.forEach((tax, index) => {
                            allItems.push({
                              key: `realEstateTax-${index}`,
                              label: `${tax.title} (취득세 ${tax.taxRate})`,
                              value: tax.amount,
                              type: "negative",
                              category: "realEstate",
                            });
                          });
                        }

                        // 양도소득세 (지출) - 부동산 + 저축 + 자산
                        if (
                          data.capitalGainsTaxes &&
                          data.capitalGainsTaxes.length > 0
                        ) {
                          data.capitalGainsTaxes.forEach((tax, index) => {
                            // 부동산: holdingYears가 있으면 보유기간 표시
                            // 저축/자산: title에 이미 세율 포함
                            let label = tax.title;
                            if (tax.holdingYears) {
                              // 소수점이 있으면 소수점 첫째 자리까지 표시
                              const years =
                                tax.holdingYears % 1 !== 0
                                  ? tax.holdingYears.toFixed(1)
                                  : Math.floor(tax.holdingYears);
                              label = `${tax.title} (양도세, 보유 ${years}년)`;
                            }
                            allItems.push({
                              key: `capitalGainsTax-${index}`,
                              label: label,
                              value: tax.amount,
                              type: "negative",
                              category: tax.holdingYears
                                ? "realEstate"
                                : "saving",
                            });
                          });
                        }

                        // 저축 적립 (지출)
                        if (
                          data.savingContributions &&
                          data.savingContributions.length > 0
                        ) {
                          data.savingContributions.forEach((contrib, index) => {
                            allItems.push({
                              key: `savingContrib-${index}`,
                              label: `${contrib.title} (적립)`,
                              value: contrib.amount,
                              type: "negative",
                              category: "saving",
                            });
                          });
                        }

                        // 저축 구매 (지출)
                        if (
                          data.savingPurchases &&
                          data.savingPurchases.length > 0
                        ) {
                          data.savingPurchases.forEach((purchase, index) => {
                            allItems.push({
                              key: `savingPurchase-${index}`,
                              label: `${purchase.title} (구매)`,
                              value: purchase.amount,
                              type: "negative",
                              category: "saving",
                            });
                          });
                        }

                        // 자산 구매 (지출)
                        if (
                          data.assetPurchases &&
                          data.assetPurchases.length > 0
                        ) {
                          data.assetPurchases.forEach((purchase, index) => {
                            allItems.push({
                              key: `assetPurchase-${index}`,
                              label: `${purchase.title} (구매)`,
                              value: purchase.amount,
                              type: "negative",
                              category: "asset",
                            });
                          });
                        }

                        // 대출 실행으로 유입된 현금
                        if (
                          data.debtInjections &&
                          data.debtInjections.length > 0
                        ) {
                          data.debtInjections.forEach((injection, index) => {
                            if (injection.amount > 0) {
                              allItems.push({
                                key: `debtInjection-${index}`,
                                label: `${injection.title} (대출 유입)`,
                                value: injection.amount,
                                type: "positive",
                                category: "debt",
                              });
                            }
                          });
                        }

                        // 부채 이자 지출
                        if (
                          data.debtInterests &&
                          data.debtInterests.length > 0
                        ) {
                          data.debtInterests.forEach((payment, index) => {
                            if (payment.amount > 0) {
                              allItems.push({
                                key: `debtInterest-${payment.title}-${index}`,
                                label: `${payment.title} (이자)`,
                                value: payment.amount,
                                type: "negative",
                                category: "debt",
                              });
                            }
                          });
                        }

                        // 부채 원금 상환
                        if (
                          data.debtPrincipals &&
                          data.debtPrincipals.length > 0
                        ) {
                          data.debtPrincipals.forEach((payment, index) => {
                            if (payment.amount > 0) {
                              allItems.push({
                                key: `debtPrincipal-${payment.title}-${index}`,
                                label: `${payment.title} (원금 상환)`,
                                value: payment.amount,
                                type: "negative",
                                category: "debt",
                              });
                            }
                          });
                        }

                        // 카테고리별 색상 및 순서 정의
                        const categoryConfig = {
                          income: { color: "#10b981", order: 1, name: "소득" },
                          expense: { color: "#ef4444", order: 2, name: "지출" },
                          saving: { color: "#3b82f6", order: 3, name: "저축" },
                          pension: { color: "#fbbf24", order: 4, name: "연금" },
                          realEstate: {
                            color: "#8b5cf6",
                            order: 5,
                            name: "부동산",
                          },
                          asset: { color: "#06b6d4", order: 6, name: "자산" },
                          debt: { color: "#f97316", order: 7, name: "부채" },
                        };

                        // +와 -로 분리하여 카테고리별, 금액별 정렬 (금액이 0인 항목 제외)
                        const positiveItems = allItems
                          .filter(
                            (item) => item.type === "positive" && item.value > 0
                          )
                          .sort((a, b) => {
                            // 1순위: 카테고리 순서
                            const orderA =
                              categoryConfig[a.category]?.order || 999;
                            const orderB =
                              categoryConfig[b.category]?.order || 999;
                            if (orderA !== orderB) return orderA - orderB;
                            // 2순위: 금액 내림차순
                            return b.value - a.value;
                          });

                        const negativeItems = allItems
                          .filter(
                            (item) => item.type === "negative" && item.value > 0
                          )
                          .sort((a, b) => {
                            // 1순위: 카테고리 순서
                            const orderA =
                              categoryConfig[a.category]?.order || 999;
                            const orderB =
                              categoryConfig[b.category]?.order || 999;
                            if (orderA !== orderB) return orderA - orderB;
                            // 2순위: 금액 내림차순
                            return b.value - a.value;
                          });

                        return (
                          <>
                            {/* 수입 항목들 (+ 표시) */}
                            {positiveItems.map((item) => (
                              <div
                                key={item.key}
                                className={styles.tooltipItem}
                              >
                                <span className={styles.tooltipLabelWithDot}>
                                  <span
                                    className={styles.tooltipCategoryDot}
                                    style={{
                                      backgroundColor:
                                        categoryConfig[item.category]?.color ||
                                        "#9ca3af",
                                    }}
                                  />
                                  <span className={styles.tooltipLabel}>
                                    {item.label}:
                                  </span>
                                </span>
                                <span
                                  className={styles.tooltipValue}
                                  style={{ color: "#10b981" }}
                                >
                                  +{formatAmountForChart(item.value)}
                                </span>
                              </div>
                            ))}

                            {/* 지출 항목들 (- 표시) */}
                            {negativeItems.map((item) => (
                              <div
                                key={item.key}
                                className={styles.tooltipItem}
                              >
                                <span className={styles.tooltipLabelWithDot}>
                                  <span
                                    className={styles.tooltipCategoryDot}
                                    style={{
                                      backgroundColor:
                                        categoryConfig[item.category]?.color ||
                                        "#9ca3af",
                                    }}
                                  />
                                  <span className={styles.tooltipLabel}>
                                    {item.label}:
                                  </span>
                                </span>
                                <span
                                  className={styles.tooltipValue}
                                  style={{ color: "#ef4444" }}
                                >
                                  -{formatAmountForChart(item.value)}
                                </span>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>

                    {/* 이벤트 정보 표시 */}
                    {eventsByYear[data.year] &&
                      eventsByYear[data.year].length > 0 && (
                        <div className={styles.tooltipEvents}>
                          <div className={styles.tooltipDivider}></div>

                          {eventsByYear[data.year].map((event, index) => (
                            <div
                              key={index}
                              className={styles.tooltipEventItem}
                            >
                              <span
                                className={styles.tooltipEventDot}
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
            x={retirementYear}
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="10 5"
            label={{
              value: "은퇴",
              position: "top",
              offset: 10, // 위로 10px 올림
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
              offset: spouseRetirementYear === retirementYear ? 30 : 10, // 은퇴 년도가 같으면 위로 30px, 다르면 10px 올림
              style: { fill: "#a78bfa", fontSize: "12px" },
            }}
          />
        )}

        {/* Bar 그래프 */}
        <Bar dataKey="amount" radius={[0, 0, 0, 0]} strokeWidth={0}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.amount >= 0
                  ? "#10b981" // 초록색 (양수)
                  : "#ef4444" // 빨간색 (음수)
              }
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

  return (
    <>
      <div className={styles.chartContainer}>
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
        <div className={styles.chartWrapper}>{renderChart()}</div>
      </div>

      {/* 확대 모달 */}
      <ChartZoomModal
        isOpen={isZoomed}
        onClose={() => setIsZoomed(false)}
        title="가계 현금 흐름"
      >
        <div style={{ width: "100%", height: "100%" }}>
          {renderChart("100%", true)}
        </div>
      </ChartZoomModal>
    </>
  );
}

export default RechartsCashflowChart;
