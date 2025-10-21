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
                    // 총 수입과 총 지출 계산
                    const totalIncome =
                      yearData.income +
                      (yearData.pension || 0) +
                      (yearData.rentalIncome || 0) +
                      (yearData.assetIncome || 0);
                    const totalExpense =
                      yearData.expense +
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
                          {/* 수입 항목들 */}
                          {incomes
                            .filter(
                              (income) =>
                                data.year >= income.startYear &&
                                data.year <= income.endYear
                            )
                            .map((income, index) => {
                              const yearsElapsed = data.year - income.startYear;
                              const growthRate = income.growthRate / 100;
                              const yearlyAmount =
                                income.frequency === "monthly"
                                  ? income.amount * 12
                                  : income.amount;
                              const adjustedAmount =
                                yearlyAmount *
                                Math.pow(1 + growthRate, yearsElapsed);

                              return (
                                <div
                                  key={`income-${index}`}
                                  className={styles.tooltipItem}
                                >
                                  <span className={styles.tooltipLabel}>
                                    {income.title}:
                                  </span>
                                  <span className={styles.tooltipValue}>
                                    +{formatAmountForChart(adjustedAmount)}
                                  </span>
                                </div>
                              );
                            })}

                          {/* 지출 항목들 */}
                          {expenses
                            .filter(
                              (expense) =>
                                data.year >= expense.startYear &&
                                data.year <= expense.endYear
                            )
                            .map((expense, index) => {
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

                              return (
                                <div
                                  key={`expense-${index}`}
                                  className={styles.tooltipItem}
                                >
                                  <span className={styles.tooltipLabel}>
                                    {expense.title}:
                                  </span>
                                  <span className={styles.tooltipValue}>
                                    -{formatAmountForChart(adjustedAmount)}
                                  </span>
                                </div>
                              );
                            })}

                          {/* 저축 항목들 */}
                          {savings
                            .filter(
                              (saving) =>
                                data.year >= saving.startYear &&
                                data.year <= saving.endYear
                            )
                            .map((saving, index) => {
                              const yearsElapsed = data.year - saving.startYear;
                              const yearlyAmount =
                                saving.frequency === "monthly"
                                  ? saving.amount * 12
                                  : saving.amount;
                              const adjustedAmount =
                                yearlyAmount *
                                Math.pow(1 + saving.growthRate, yearsElapsed);

                              return (
                                <div
                                  key={`saving-${index}`}
                                  className={styles.tooltipItem}
                                >
                                  <span className={styles.tooltipLabel}>
                                    {saving.title}:
                                  </span>
                                  <span className={styles.tooltipValue}>
                                    -{formatAmountForChart(adjustedAmount)}
                                  </span>
                                </div>
                              );
                            })}
                          {/* 연금 항목들 */}
                          {pensions
                            .filter((pension) => {
                              if (pension.type === "national") {
                                return (
                                  data.year >= pension.startYear &&
                                  data.year <= pension.endYear
                                );
                              } else {
                                return (
                                  data.year >= pension.paymentStartYear &&
                                  data.year <= pension.paymentEndYear
                                );
                              }
                            })
                            .map((pension, index) => {
                              let yearlyAmount = 0;
                              if (pension.type === "national") {
                                const yearsElapsed =
                                  data.year - pension.startYear;
                                const inflationRate =
                                  pension.inflationRate / 100;
                                yearlyAmount =
                                  pension.monthlyAmount *
                                  12 *
                                  Math.pow(1 + inflationRate, yearsElapsed);
                              } else {
                                // 퇴직연금/개인연금의 경우 detailedData에서 가져오기
                                const pensionData = yearData.pension || 0;
                                yearlyAmount = pensionData;
                              }

                              return (
                                <div
                                  key={`pension-${index}`}
                                  className={styles.tooltipItem}
                                >
                                  <span className={styles.tooltipLabel}>
                                    {pension.title}:
                                  </span>
                                  <span className={styles.tooltipValue}>
                                    +{formatAmountForChart(yearlyAmount)}
                                  </span>
                                </div>
                              );
                            })}

                          {/* 부동산 항목들 */}
                          {realEstates
                            .filter(
                              (realEstate) =>
                                realEstate.hasRentalIncome &&
                                data.year >= realEstate.rentalIncomeStartYear &&
                                data.year <= realEstate.rentalIncomeEndYear
                            )
                            .map((realEstate, index) => {
                              // detailedData에서 임대수입 가져오기
                              const rentalIncome = yearData.rentalIncome || 0;
                              const realEstateCount = realEstates.filter(
                                (re) =>
                                  re.hasRentalIncome &&
                                  data.year >= re.rentalIncomeStartYear &&
                                  data.year <= re.rentalIncomeEndYear
                              ).length;

                              // 여러 부동산이 있을 경우 개별 금액 계산
                              const individualAmount =
                                realEstateCount > 0
                                  ? rentalIncome / realEstateCount
                                  : 0;

                              return (
                                <div
                                  key={`realEstate-${index}`}
                                  className={styles.tooltipItem}
                                >
                                  <span className={styles.tooltipLabel}>
                                    {realEstate.title}:
                                  </span>
                                  <span className={styles.tooltipValue}>
                                    +{formatAmountForChart(individualAmount)}
                                  </span>
                                </div>
                              );
                            })}

                          {/* 자산 항목들 */}
                          {assets
                            .filter(
                              (asset) =>
                                asset.assetType === "income" &&
                                asset.incomeRate > 0 &&
                                data.year >= asset.startYear &&
                                data.year <= asset.endYear
                            )
                            .map((asset, index) => {
                              // detailedData에서 자산수익 가져오기
                              const assetIncome = yearData.assetIncome || 0;
                              const assetCount = assets.filter(
                                (a) =>
                                  a.assetType === "income" &&
                                  a.incomeRate > 0 &&
                                  data.year >= a.startYear &&
                                  data.year <= a.endYear
                              ).length;

                              // 여러 자산이 있을 경우 개별 금액 계산
                              const individualAmount =
                                assetCount > 0 ? assetIncome / assetCount : 0;

                              return (
                                <div
                                  key={`asset-${index}`}
                                  className={styles.tooltipItem}
                                >
                                  <span className={styles.tooltipLabel}>
                                    {asset.title}:
                                  </span>
                                  <span className={styles.tooltipValue}>
                                    +{formatAmountForChart(individualAmount)}
                                  </span>
                                </div>
                              );
                            })}

                          {/* 부채 항목들 */}
                          {debts
                            .filter(
                              (debt) =>
                                data.year >= debt.startYear &&
                                data.year <= debt.endYear
                            )
                            .map((debt, index) => {
                              // detailedData에서 부채 관련 금액 가져오기
                              const debtInterest = yearData.debtInterest || 0;
                              const debtPrincipal = yearData.debtPrincipal || 0;
                              const debtCount = debts.filter(
                                (d) =>
                                  data.year >= d.startYear &&
                                  data.year <= d.endYear
                              ).length;

                              // 여러 부채가 있을 경우 개별 금액 계산
                              const individualInterest =
                                debtCount > 0 ? debtInterest / debtCount : 0;
                              const individualPrincipal =
                                debtCount > 0 ? debtPrincipal / debtCount : 0;

                              return (
                                <div
                                  key={`debt-${index}`}
                                  className={styles.tooltipItem}
                                >
                                  <span className={styles.tooltipLabel}>
                                    {debt.title}:
                                  </span>
                                  <span className={styles.tooltipValue}>
                                    -
                                    {formatAmountForChart(
                                      individualInterest + individualPrincipal
                                    )}
                                  </span>
                                </div>
                              );
                            })}
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
