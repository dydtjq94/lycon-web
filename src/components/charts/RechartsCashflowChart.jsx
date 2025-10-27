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

  // 저축/투자 이벤트 추출 (시작/만료/수령 이벤트)
  const getSavingEvents = () => {
    const events = [];
    if (savings && savings.length > 0) {
      savings.forEach((saving) => {
        // 시작 이벤트
        events.push({
          year: saving.startYear,
          age: saving.startYear - (data[0]?.year - data[0]?.age),
          type: "start",
          category: "saving",
          title: `${saving.title} 시작`,
        });

        // 만료 이벤트 (종료년도 + 1)
        if (saving.endYear) {
          events.push({
            year: saving.endYear + 1,
            age: saving.endYear + 1 - (data[0]?.year - data[0]?.age),
            type: "maturity",
            category: "saving",
            title: `${saving.title} 만료`,
          });
        }

        // 수령 이벤트 (만료 후 수령)
        if (saving.endYear) {
          events.push({
            year: saving.endYear + 2,
            age: saving.endYear + 2 - (data[0]?.year - data[0]?.age),
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
    realEstatePurchases: item.realEstatePurchases || [],
    assetSales: item.assetSales || [],
    realEstateSales: item.realEstateSales || [],
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
  const renderChart = (height = 500, isZoomedView = false) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 40,
          bottom: 60,
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
                // 연금 항목들 계산 (개별 표시용)
                let totalPensionIncome = 0;
                let totalPensionExpense = 0;

                pensions.forEach((pension) => {
                  if (pension.type === "national") {
                    // 국민연금: 수령 기간 동안 수입
                    if (
                      data.year >= pension.startYear &&
                      data.year <= pension.endYear
                    ) {
                      const yearsElapsed = data.year - pension.startYear;
                      const inflationRate =
                        (pension.inflationRate || 2.5) / 100;
                      const adjustedAmount =
                        pension.monthlyAmount *
                        12 *
                        Math.pow(1 + inflationRate, yearsElapsed);
                      totalPensionIncome += adjustedAmount;
                    }
                  } else {
                    // 개인연금/퇴직연금
                    if (
                      pension.type === "personal" &&
                      data.year >= pension.contributionStartYear &&
                      data.year <= pension.contributionEndYear
                    ) {
                      // 개인연금 적립 기간: 지출
                      const monthlyAmount =
                        pension.contributionFrequency === "monthly"
                          ? pension.contributionAmount
                          : pension.contributionAmount / 12;
                      totalPensionExpense += monthlyAmount * 12;
                    } else if (
                      data.year >= pension.paymentStartYear &&
                      data.year <= pension.paymentEndYear
                    ) {
                      // 수령 기간: 수입
                      const monthlyAmount =
                        pension.contributionFrequency === "monthly"
                          ? pension.contributionAmount
                          : pension.contributionAmount / 12;
                      const yearlyContribution = monthlyAmount * 12;
                      const returnRate = pension.returnRate / 100;

                      // 현재 보유액을 포함한 총 적립액 계산
                      let totalAccumulated = pension.currentAmount || 0;
                      for (
                        let i = 0;
                        i <
                        pension.contributionEndYear -
                          pension.contributionStartYear +
                          1;
                        i++
                      ) {
                        totalAccumulated =
                          totalAccumulated * (1 + returnRate) +
                          yearlyContribution;
                      }

                      // 월 수령액 계산
                      const paymentYears =
                        pension.paymentEndYear - pension.paymentStartYear + 1;
                      const monthlyPayment =
                        totalAccumulated / paymentYears / 12;
                      totalPensionIncome += monthlyPayment * 12;
                    }
                  }
                });

                // 총 수입과 총 지출 계산
                const totalAssetPurchaseExpense = (
                  data.assetPurchases || []
                ).reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
                const totalRealEstatePurchaseExpense = (
                  data.realEstatePurchases || []
                ).reduce((sum, purchase) => sum + (purchase.amount || 0), 0);

                const totalIncome =
                  yearData.income +
                  totalPensionIncome +
                  (yearData.rentalIncome || 0) +
                  (yearData.realEstatePension || 0) +
                  (yearData.assetIncome || 0) +
                  (yearData.realEstateSale || 0) +
                  (yearData.assetSale || 0) +
                  (yearData.savingMaturity || 0);
                const totalExpense =
                  yearData.expense +
                  totalPensionExpense +
                  (yearData.savings || 0) +
                  (yearData.debtInterest || 0) +
                  (yearData.debtPrincipal || 0) +
                  totalAssetPurchaseExpense +
                  totalRealEstatePurchaseExpense;

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
                            });
                          });

                        // 연금 항목들
                        pensions.forEach((pension, index) => {
                          let displayAmount = 0;
                          let displayLabel = pension.title;
                          let shouldShow = false;

                          if (pension.type === "national") {
                            // 국민연금: 수령 기간 동안만 표시
                            if (
                              data.year >= pension.startYear &&
                              data.year <= pension.endYear
                            ) {
                              const yearsElapsed =
                                data.year - pension.startYear;
                              const inflationRate =
                                (pension.inflationRate || 2.5) / 100;
                              const adjustedAmount =
                                pension.monthlyAmount *
                                12 *
                                Math.pow(1 + inflationRate, yearsElapsed);
                              displayAmount = adjustedAmount;
                              displayLabel = "국민연금";
                              shouldShow = true;
                            }
                          } else {
                            // 개인연금/퇴직연금: 적립 기간과 수령 기간 모두 표시
                            if (
                              pension.type === "personal" &&
                              data.year >= pension.contributionStartYear &&
                              data.year <= pension.contributionEndYear
                            ) {
                              // 적립 기간: 적립액 표시 (마이너스)
                              const monthlyAmount =
                                pension.contributionFrequency === "monthly"
                                  ? pension.contributionAmount
                                  : pension.contributionAmount / 12;
                              const yearlyContribution = monthlyAmount * 12;

                              displayAmount = yearlyContribution; // 양수로 설정 (툴팁에서 - 붙임)
                              displayLabel = `${pension.title} (적립)`;
                              shouldShow = true;
                            } else if (
                              data.year >= pension.paymentStartYear &&
                              data.year <= pension.paymentEndYear
                            ) {
                              // 수령 기간: 수령액 표시 (플러스)
                              const monthlyAmount =
                                pension.contributionFrequency === "monthly"
                                  ? pension.contributionAmount
                                  : pension.contributionAmount / 12;
                              const yearlyContribution = monthlyAmount * 12;
                              const returnRate = pension.returnRate / 100;

                              // 현재 보유액을 포함한 총 적립액 계산
                              let totalAccumulated = pension.currentAmount || 0;
                              for (
                                let i = 0;
                                i <
                                pension.contributionEndYear -
                                  pension.contributionStartYear +
                                  1;
                                i++
                              ) {
                                totalAccumulated =
                                  totalAccumulated * (1 + returnRate) +
                                  yearlyContribution;
                              }

                              // 월 수령액 계산
                              const paymentYears =
                                pension.paymentEndYear -
                                pension.paymentStartYear +
                                1;
                              const monthlyPayment =
                                totalAccumulated / paymentYears / 12;
                              displayAmount = monthlyPayment * 12;
                              displayLabel = `${pension.title} (수령)`;
                              shouldShow = true;
                            }
                          }

                          if (shouldShow) {
                            // 연금 적립은 항상 negative, 수령은 항상 positive
                            const itemType = displayLabel.includes("(적립)")
                              ? "negative"
                              : "positive";

                            allItems.push({
                              key: `pension-${index}`,
                              label: displayLabel,
                              value: Math.abs(displayAmount), // 절댓값으로 저장
                              type: itemType,
                            });
                          }
                        });

                        // 저축/투자 항목들
                        savings
                          .filter(
                            (saving) =>
                              data.year >= saving.startYear &&
                              data.year <= saving.endYear
                          )
                          .forEach((saving, index) => {
                            const yearsElapsed = data.year - saving.startYear;
                            const yearlyGrowthRate =
                              saving.yearlyGrowthRate || 0;

                            if (saving.frequency === "one_time") {
                              // 일회성 저축: 시작년도에만 표시
                              if (data.year === saving.startYear) {
                                allItems.push({
                                  key: `saving-${index}`,
                                  label: saving.title,
                                  value: saving.amount,
                                  type: "negative",
                                });
                              }
                            } else {
                              // 월간/연간 저축
                              const monthlyAmount =
                                saving.frequency === "monthly"
                                  ? saving.amount
                                  : saving.amount / 12;
                              const adjustedMonthlyAmount =
                                monthlyAmount *
                                Math.pow(1 + yearlyGrowthRate, yearsElapsed);
                              const yearlyAmount = adjustedMonthlyAmount * 12;

                              allItems.push({
                                key: `saving-${index}`,
                                label: saving.title,
                                value: yearlyAmount,
                                type: "negative",
                              });
                            }
                          });

                        // 주택 연금 수입
                        if (yearData.realEstatePension > 0) {
                          // 해당 연도에 주택 연금을 받는 부동산 찾기
                          const realEstateWithPension = realEstates.find(
                            (re) =>
                              re.convertToPension === true &&
                              data.year >= re.pensionStartYear
                          );

                          const label = realEstateWithPension
                            ? `주택연금 (${realEstateWithPension.title})`
                            : "주택연금";

                          allItems.push({
                            key: "realEstatePension",
                            label: label,
                            value: yearData.realEstatePension,
                            type: "positive",
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
                            });
                          });
                        }

                        // 자산 수익 (수익형 자산)
                        assets
                          .filter(
                            (asset) =>
                              asset.assetType === "income" &&
                              asset.incomeRate > 0 &&
                              data.year >= asset.startYear &&
                              data.year <= asset.endYear
                          )
                          .forEach((asset, index) => {
                            const yearsElapsed = data.year - asset.startYear;
                            const growthRate = asset.growthRate || 0;

                            // 자산 가치 계산 (상승률 적용)
                            const currentAssetValue =
                              asset.currentValue *
                              Math.pow(1 + growthRate, yearsElapsed);

                            // 연간 수익 계산 (자산 가치 * 수익률)
                            const annualIncome =
                              currentAssetValue * asset.incomeRate;

                            allItems.push({
                              key: `asset-income-${index}`,
                              label: `${asset.title} (수익)`,
                              value: annualIncome,
                              type: "positive",
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
                                  label: `${saving.title} 만료`,
                                  value: saving.amount,
                                  type: "positive",
                                });
                              }
                            );
                          } else {
                            // 상세 정보가 없으면 기본 표시
                            allItems.push({
                              key: "savingMaturity",
                              label: "저축 만료",
                              value: yearData.savingMaturity,
                              type: "positive",
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
                              });
                            }
                          );
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
                            });
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
                              });
                            }
                          });
                        }

                        // +와 -로 분리하여 정렬
                        const positiveItems = allItems
                          .filter((item) => item.type === "positive")
                          .sort((a, b) => b.value - a.value); // 금액 내림차순

                        const negativeItems = allItems
                          .filter((item) => item.type === "negative")
                          .sort((a, b) => b.value - a.value); // 금액 내림차순

                        return (
                          <>
                            {/* 수입 항목들 (+ 표시) */}
                            {positiveItems.map((item) => (
                              <div
                                key={item.key}
                                className={styles.tooltipItem}
                              >
                                <span className={styles.tooltipLabel}>
                                  {item.label}:
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
                                <span className={styles.tooltipLabel}>
                                  {item.label}:
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

        {/* 이벤트 마커를 표시하기 위한 투명한 레이어 */}
        {allEvents.map((event, eventIndex) => {
          const dataIndex = chartData.findIndex((d) => d.age === event.age);
          if (dataIndex === -1) return null;

          // 카테고리별 색상 결정
          const eventColor =
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

  return (
    <>
      <div className={styles.chartContainer}>
        <div className={styles.chartTitleWrapper}>
          <h3 className={styles.chartTitle}>가계 현금흐름</h3>
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
        <div className={styles.chartWrapper}>{renderChart()}</div>
      </div>

      {/* 확대 모달 */}
      <ChartZoomModal
        isOpen={isZoomed}
        onClose={() => setIsZoomed(false)}
        title="가계 현금흐름"
      >
        <div style={{ width: "100%", height: "100%" }}>
          {renderChart("100%", true)}
        </div>
      </ChartZoomModal>
    </>
  );
}

export default RechartsCashflowChart;
