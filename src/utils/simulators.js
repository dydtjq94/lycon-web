/**
 * 현금 흐름 시뮬레이션 계산
 * @param {Object} data - 모든 재무 데이터
 * @param {Array} timeline - 월별 타임라인
 * @returns {Array} 월별 현금 흐름 데이터
 */
export function calculateCashflow(data, timeline) {
  const { incomes = [], pensions = [], expenses = [], debts = [] } = data;
  const cashflow = [];

  console.log("=== calculateCashflow 시작 ===");
  console.log("incomes:", incomes);
  console.log("expenses:", expenses);

  timeline.forEach((month, index) => {
    let totalIncome = 0;
    let totalPension = 0;
    let totalExpense = 0;
    let totalDebtPayment = 0;

    // 수입 계산
    incomes.forEach((income) => {
      if (isActiveInMonth(income, month)) {
        const monthlyAmount = getMonthlyAmount(income);
        totalIncome += monthlyAmount;

        // 2027년 9월 디버깅
        if (month.includes("2027-09")) {
          console.log(
            `수입 활성화: ${income.title}, amount: ${income.amount}, monthlyAmount: ${monthlyAmount}, frequency: ${income.frequency}`
          );
        }
      }
    });

    // 연금 계산 (은퇴 후부터)
    pensions.forEach((pension) => {
      if (isActiveInMonth(pension, month)) {
        const monthlyAmount = getMonthlyAmount(pension);
        totalPension += monthlyAmount;
      }
    });

    // 지출 계산
    expenses.forEach((expense) => {
      if (isActiveInMonth(expense, month)) {
        const monthlyAmount = getMonthlyAmount(expense);
        totalExpense += monthlyAmount;
      }
    });

    // 부채 계산
    debts.forEach((debt) => {
      if (isActiveInMonth(debt, month)) {
        const monthlyAmount = getMonthlyAmount(debt);
        totalDebtPayment += monthlyAmount;
      }
    });

    const netCashflow =
      totalIncome + totalPension - totalExpense - totalDebtPayment;

    // 2027년 9월 디버깅
    if (month.includes("2027-09")) {
      console.log("=== 2027-09 ===");
      console.log("totalIncome:", totalIncome);
      console.log("totalPension:", totalPension);
      console.log("totalExpense:", totalExpense);
      console.log("totalDebtPayment:", totalDebtPayment);
      console.log("netCashflow:", netCashflow);
    }

    cashflow.push({
      month,
      income: totalIncome,
      pension: totalPension,
      expense: totalExpense,
      debtPayment: totalDebtPayment,
      netCashflow,
      cumulativeCashflow:
        index === 0
          ? netCashflow
          : cashflow[index - 1].cumulativeCashflow + netCashflow,
    });
  });

  return cashflow;
}

/**
 * 자산 시뮬레이션 계산
 * @param {Object} data - 모든 재무 데이터
 * @param {Array} timeline - 월별 타임라인
 * @param {Array} cashflow - 현금 흐름 데이터
 * @returns {Array} 월별 자산 데이터
 */
export function calculateAssets(data, timeline, cashflow) {
  const { assets = [], debts = [] } = data;
  const assetData = [];

  timeline.forEach((month, index) => {
    let totalAssets = 0;
    let totalDebt = 0;

    // 자산 계산
    data.assets.forEach((asset) => {
      if (isActiveInMonth(asset, month)) {
        const monthlyAmount = getMonthlyAmount(asset);
        const monthsElapsed = index;
        const annualRate = (asset.rate || 0) / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        const currentValue =
          monthlyAmount * Math.pow(1 + monthlyRate, monthsElapsed);
        totalAssets += currentValue;
      }
    });

    // 부채 계산
    data.debts.forEach((debt) => {
      if (isActiveInMonth(debt, month)) {
        const monthlyAmount = getMonthlyAmount(debt);
        const monthsElapsed = index;
        const annualRate = (debt.rate || 0) / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        const currentValue =
          monthlyAmount * Math.pow(1 + monthlyRate, monthsElapsed);
        totalDebt += currentValue;
      }
    });

    const netAssets = totalAssets - totalDebt;
    const cumulativeCashflow = cashflow[index]?.cumulativeCashflow || 0;

    assetData.push({
      month,
      assets: totalAssets,
      debt: totalDebt,
      netAssets,
      cumulativeCashflow,
    });
  });

  return assetData;
}

/**
 * 빈도를 월 단위로 변환
 * @param {string} frequency - 빈도
 * @returns {number} 월 단위 배수
 */
function frequencyToMonthly(frequency) {
  switch (frequency) {
    case "daily":
      return 30; // 대략적인 월 일수
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "yearly":
      return 12;
    case "once":
      return 12; // 일회성은 해당 년도의 12개월에 분산
    default:
      return 1;
  }
}

/**
 * 해당 월에 항목이 활성화되어 있는지 확인
 * @param {Object} item - 재무 항목
 * @param {string} month - 확인할 월 (YYYY-MM-DD)
 * @returns {boolean} 활성화 여부
 */
function isActiveInMonth(item, month) {
  const itemStart = new Date(item.startDate);
  const itemEnd = item.endDate ? new Date(item.endDate) : null;
  const currentMonth = new Date(month);

  // 날짜만 비교 (시간 제외)
  const itemStartDate = new Date(
    itemStart.getFullYear(),
    itemStart.getMonth(),
    itemStart.getDate()
  );
  const currentDate = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    currentMonth.getDate()
  );
  const itemEndDate = itemEnd
    ? new Date(itemEnd.getFullYear(), itemEnd.getMonth(), itemEnd.getDate())
    : null;

  if (currentDate < itemStartDate) return false;
  if (itemEndDate && currentDate > itemEndDate) return false;

  return true;
}

/**
 * 월별 금액 계산
 * @param {Object} item - 재무 항목
 * @returns {number} 월별 금액
 */
function getMonthlyAmount(item) {
  const monthlyFrequency = frequencyToMonthly(item.frequency);
  return item.amount / monthlyFrequency;
}

/**
 * 년 단위 데이터로 변환
 * @param {Array} monthlyData - 월별 시뮬레이션 데이터
 * @param {string} type - 차트 타입 ("cashflow" | "assets")
 * @returns {Array} 년별 차트 데이터
 */
export function formatYearlyChartData(monthlyData, type) {
  const yearlyData = {};

  console.log("=== formatYearlyChartData 디버깅 ===");
  console.log("monthlyData length:", monthlyData.length);
  console.log(
    "2027년 데이터:",
    monthlyData.filter((item) => item.month.includes("2027"))
  );

  monthlyData.forEach((item) => {
    const date = new Date(item.month);
    const year = date.getFullYear();

    if (!yearlyData[year]) {
      yearlyData[year] = {
        year: year,
        income: 0,
        pension: 0,
        expense: 0,
        debtPayment: 0,
        netCashflow: 0,
        assets: 0,
        debt: 0,
        netAssets: 0,
        assetBreakdown: {},
        cumulative: 0,
        monthCount: 0,
      };
    }

    const yearData = yearlyData[year];
    yearData.monthCount++;

    if (type === "cashflow") {
      yearData.income += item.income;
      yearData.pension += item.pension;
      yearData.expense += item.expense;
      yearData.debtPayment += item.debtPayment;
      yearData.cumulative = item.cumulativeCashflow; // Keep cumulative for reference if needed
    } else {
      yearData.assets += item.assets;
      yearData.debt += item.debt;
      yearData.cumulative = item.cumulativeCashflow; // Keep cumulative for reference if needed
    }
  });

  // 년별 netCashflow와 netAssets 계산
  Object.values(yearlyData).forEach((yearData) => {
    if (type === "cashflow") {
      yearData.netCashflow =
        yearData.income +
        yearData.pension -
        yearData.expense -
        yearData.debtPayment;

      // 2027년 디버깅
      if (yearData.year === 2027) {
        console.log("2027년 집계:", {
          income: yearData.income,
          pension: yearData.pension,
          expense: yearData.expense,
          debtPayment: yearData.debtPayment,
          netCashflow: yearData.netCashflow,
        });
      }
    } else {
      yearData.netAssets = yearData.assets - yearData.debt;
    }
  });

  return Object.values(yearlyData).sort((a, b) => a.year - b.year);
}

/**
 * 자산 세부 내역 계산
 * @param {Object} data - 모든 재무 데이터
 * @param {Array} timeline - 월별 타임라인
 * @returns {Object} 년별 자산 세부 내역
 */
export function calculateAssetBreakdown(data, timeline) {
  const { assets = [] } = data;
  const yearlyBreakdown = {};

  timeline.forEach((month, index) => {
    const date = new Date(month);
    const year = date.getFullYear();

    if (!yearlyBreakdown[year]) {
      yearlyBreakdown[year] = {};
    }

    // 각 자산의 년말 가치 계산
    assets.forEach((asset) => {
      if (isActiveInMonth(asset, month)) {
        const monthlyAmount = getMonthlyAmount(asset);
        const monthsElapsed = index;
        const annualRate = (asset.rate || 0) / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
        const currentValue =
          monthlyAmount * Math.pow(1 + monthlyRate, monthsElapsed);

        if (!yearlyBreakdown[year][asset.title]) {
          yearlyBreakdown[year][asset.title] = 0;
        }
        yearlyBreakdown[year][asset.title] = currentValue;
      }
    });
  });

  return yearlyBreakdown;
}
