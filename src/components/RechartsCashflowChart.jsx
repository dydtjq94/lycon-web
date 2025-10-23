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
  incomes = [],
  expenses = [],
  savings = [],
  pensions = [],
  realEstates = [],
  assets = [],
  debts = [],
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
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={500}>
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
                          data.year >= pension.contributionStartYear &&
                          data.year <= pension.contributionEndYear
                        ) {
                          // 적립 기간: 지출
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
                            pension.paymentEndYear -
                            pension.paymentStartYear +
                            1;
                          const monthlyPayment =
                            totalAccumulated / paymentYears / 12;
                          totalPensionIncome += monthlyPayment * 12;
                        }
                      }
                    });

                    // 총 수입과 총 지출 계산
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
                      (yearData.debtPrincipal || 0);

                    return (
                      <div className={styles.customTooltip}>
                        <div className={styles.tooltipHeader}>
                          <span className={styles.tooltipTitle}>
                            {data.age}세 ({data.year}년)
                          </span>
                        </div>
                        <div className={styles.tooltipBreakdown}>
                          <div className={styles.tooltipItem}>
                            <span className={styles.tooltipLabel}>
                              순 현금흐름:
                            </span>
                            <span
                              className={`${styles.tooltipValue} ${
                                data.amount >= 0
                                  ? styles.positive
                                  : styles.negative
                              }`}
                              style={{
                                color: data.amount >= 0 ? "#059669" : "#dc2626",
                              }}
                            >
                              {data.amount >= 0 ? "+" : ""}
                              {formatAmountForChart(data.amount)}
                            </span>
                          </div>
                          <div className={styles.tooltipItem}>
                            <span className={styles.tooltipLabel}>
                              총 수입:
                            </span>
                            <span className={styles.tooltipValue}>
                              +{formatAmountForChart(totalIncome)}
                            </span>
                          </div>
                          <div className={styles.tooltipItem}>
                            <span className={styles.tooltipLabel}>
                              총 지출:
                            </span>
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
                                const yearsElapsed =
                                  data.year - income.startYear;
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
                                const yearsElapsed =
                                  data.year - expense.startYear;
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
                                  let totalAccumulated =
                                    pension.currentAmount || 0;
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
                                const yearsElapsed =
                                  data.year - saving.startYear;
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
                                    Math.pow(
                                      1 + yearlyGrowthRate,
                                      yearsElapsed
                                    );
                                  const yearlyAmount =
                                    adjustedMonthlyAmount * 12;

                                  allItems.push({
                                    key: `saving-${index}`,
                                    label: saving.title,
                                    value: yearlyAmount,
                                    type: "negative",
                                  });
                                }
                              });

                            // 부채 항목들
                            debts
                              .filter(
                                (debt) =>
                                  data.year >= debt.startYear &&
                                  data.year <= debt.endYear
                              )
                              .forEach((debt, index) => {
                                const yearsElapsed = data.year - debt.startYear;
                                const totalYears =
                                  debt.endYear - debt.startYear + 1;
                                const interestRate = debt.interestRate;
                                let yearlyInterest = 0;
                                let yearlyPrincipal = 0;

                                if (debt.debtType === "bullet") {
                                  if (data.year < debt.endYear) {
                                    yearlyInterest =
                                      debt.debtAmount * interestRate;
                                  } else if (data.year === debt.endYear) {
                                    yearlyInterest =
                                      debt.debtAmount * interestRate;
                                    yearlyPrincipal = debt.debtAmount;
                                  }
                                } else if (debt.debtType === "equal") {
                                  if (totalYears > 0 && interestRate > 0) {
                                    const pmt =
                                      (debt.debtAmount *
                                        (interestRate *
                                          Math.pow(
                                            1 + interestRate,
                                            totalYears
                                          ))) /
                                      (Math.pow(1 + interestRate, totalYears) -
                                        1);
                                    let remainingPrincipal = debt.debtAmount;
                                    for (let i = 0; i < yearsElapsed; i++) {
                                      const interestPayment =
                                        remainingPrincipal * interestRate;
                                      const principalPayment =
                                        pmt - interestPayment;
                                      remainingPrincipal -= principalPayment;
                                    }
                                    yearlyInterest =
                                      remainingPrincipal * interestRate;
                                    yearlyPrincipal = pmt - yearlyInterest;
                                  } else if (interestRate === 0) {
                                    yearlyPrincipal =
                                      debt.debtAmount / totalYears;
                                  }
                                } else if (debt.debtType === "principal") {
                                  const yearlyPrincipalPayment =
                                    debt.debtAmount / totalYears;
                                  const paidPrincipal =
                                    yearlyPrincipalPayment * yearsElapsed;
                                  const remainingPrincipal =
                                    debt.debtAmount - paidPrincipal;
                                  yearlyInterest =
                                    remainingPrincipal * interestRate;
                                  yearlyPrincipal = yearlyPrincipalPayment;
                                } else if (debt.debtType === "grace") {
                                  const gracePeriod = debt.gracePeriod || 0;
                                  const graceEndYear =
                                    debt.startYear + gracePeriod - 1;
                                  const repaymentYears =
                                    debt.endYear - graceEndYear;

                                  if (data.year <= graceEndYear) {
                                    yearlyInterest =
                                      debt.debtAmount * interestRate;
                                  } else if (
                                    data.year > graceEndYear &&
                                    data.year <= debt.endYear
                                  ) {
                                    const yearlyPrincipalPayment =
                                      debt.debtAmount / repaymentYears;
                                    const repaymentYearsElapsed =
                                      data.year - graceEndYear;
                                    const paidPrincipal =
                                      yearlyPrincipalPayment *
                                      (repaymentYearsElapsed - 1);
                                    const remainingPrincipal =
                                      debt.debtAmount - paidPrincipal;
                                    yearlyInterest =
                                      remainingPrincipal * interestRate;
                                    yearlyPrincipal = yearlyPrincipalPayment;
                                  }
                                }

                                const totalDebtPayment =
                                  yearlyInterest + yearlyPrincipal;
                                if (totalDebtPayment > 0) {
                                  allItems.push({
                                    key: `debt-${index}`,
                                    label: debt.title,
                                    value: totalDebtPayment,
                                    type: "negative",
                                  });
                                }
                              });

                            // 부동산 수입
                            if (yearData.realEstateSale > 0) {
                              allItems.push({
                                key: "realEstateSale",
                                label: "부동산 매각",
                                value: yearData.realEstateSale,
                                type: "positive",
                              });
                            }

                            // 자산 수입
                            if (yearData.assetSale > 0) {
                              allItems.push({
                                key: "assetSale",
                                label: "자산 매각",
                                value: yearData.assetSale,
                                type: "positive",
                              });
                            }

                            // 저축 만료
                            if (yearData.savingMaturity > 0) {
                              allItems.push({
                                key: "savingMaturity",
                                label: "저축 만료",
                                value: yearData.savingMaturity,
                                type: "positive",
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
                                    <span
                                      className={styles.tooltipLabel}
                                      style={{ color: "#10b981" }}
                                    >
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
                                    <span
                                      className={styles.tooltipLabel}
                                      style={{ color: "#ef4444" }}
                                    >
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
