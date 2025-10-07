/**
 * 부채 상환 계산 함수들
 */

// 원리금균등상환 월 상환액 계산 (PMT 공식)
function calculatePMT(principal, annualRate, months) {
  if (annualRate === 0) return principal / months;
  const monthlyRate = annualRate / 100 / 12;
  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

// 원금균등상환 월 상환액 계산
function calculateEqualPrincipal(
  principal,
  months,
  remainingPrincipal,
  annualRate
) {
  const principalPayment = principal / months;
  const interestPayment = remainingPrincipal * (annualRate / 100 / 12);
  return principalPayment + interestPayment;
}

// 최소상환 월 상환액 계산
function calculateMinimumPayment(remainingPrincipal, annualRate, minimumRate) {
  const interestPayment = remainingPrincipal * (annualRate / 100 / 12);
  const principalPayment = remainingPrincipal * (minimumRate / 100);
  return Math.max(interestPayment + principalPayment, interestPayment);
}

// 부채 활성화 여부 확인
function isDebtActive(debt, month) {
  const currentDate = new Date(month + "-01");
  const repaymentType = debt.repaymentType || "equal_payment";

  if (repaymentType === "lump_sum") {
    // 일시상환: 종료일만 있고, 그 날짜에만 활성화
    if (!debt.endDate) return false;
    const endDate = new Date(debt.endDate);
    return (
      currentDate.getFullYear() === endDate.getFullYear() &&
      currentDate.getMonth() === endDate.getMonth()
    );
  }

  if (repaymentType === "minimum_payment") {
    // 최소상환: 시작일부터 계속 활성화
    if (!debt.startDate) return false;
    const startDate = new Date(debt.startDate);
    return currentDate >= startDate;
  }

  // 원리금균등, 원금균등, 고정월상환: 시작일과 종료일 사이
  if (!debt.startDate) return false;
  const startDate = new Date(debt.startDate);
  if (currentDate < startDate) return false;

  if (debt.endDate) {
    const endDate = new Date(debt.endDate);
    if (currentDate > endDate) return false;
  }

  return true;
}

// 부채 상환액 계산
function calculateDebtPayment(debt, month, timeline) {
  const principalAmount = parseFloat(debt.principalAmount) || 0;
  const interestRate =
    parseFloat(debt.interestRate) || parseFloat(debt.rate) || 0;
  const repaymentType = debt.repaymentType || "equal_payment";

  // 부채 활성화 여부 확인 (상환방식에 따라)
  if (!isDebtActive(debt, month)) return 0;

  if (repaymentType === "lump_sum") {
    // 일시상환: 만료일에만 상환 (이미 isDebtActive에서 확인됨)
    return principalAmount;
  }

  if (repaymentType === "equal_payment") {
    // 원리금균등상환
    const startDate = new Date(debt.startDate);
    const endDate = new Date(debt.endDate);
    const currentDate = new Date(month + "-01");

    // 총 개월수 계산
    const totalMonths =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    // 경과 개월수 계산
    const monthsPassed = Math.max(
      0,
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
        (currentDate.getMonth() - startDate.getMonth())
    );

    if (monthsPassed >= totalMonths) return 0; // 상환 완료

    return calculatePMT(principalAmount, interestRate, totalMonths);
  }

  if (repaymentType === "equal_principal") {
    // 원금균등상환
    const startDate = new Date(debt.startDate);
    const endDate = new Date(debt.endDate);
    const currentDate = new Date(month + "-01");

    // 총 개월수 계산
    const totalMonths =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    // 경과 개월수 계산
    const monthsPassed = Math.max(
      0,
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
        (currentDate.getMonth() - startDate.getMonth())
    );

    if (monthsPassed >= totalMonths) return 0; // 상환 완료

    const remainingPrincipal =
      principalAmount * (1 - monthsPassed / totalMonths);
    return calculateEqualPrincipal(
      principalAmount,
      totalMonths,
      remainingPrincipal,
      interestRate
    );
  }

  if (repaymentType === "minimum_payment") {
    // 최소상환
    const minimumRate = parseFloat(debt.minimumPaymentRate) || 2; // 기본 2%
    const startDate = new Date(debt.startDate);
    const currentDate = new Date(month + "-01");

    // 경과 개월수 계산
    const monthsPassed = Math.max(
      0,
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
        (currentDate.getMonth() - startDate.getMonth())
    );

    const remainingPrincipal =
      principalAmount * Math.pow(1 - minimumRate / 100, monthsPassed);
    return calculateMinimumPayment(
      remainingPrincipal,
      interestRate,
      minimumRate
    );
  }

  // 고정 월 상환액
  const monthlyPayment = parseFloat(debt.monthlyPayment) || 0;
  return monthlyPayment;
}

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
  console.log("pensions:", pensions);
  console.log("expenses:", expenses);

  timeline.forEach((month, index) => {
    let totalIncome = 0;
    let totalPension = 0;
    let totalExpense = 0;
    let totalDebtPayment = 0;

    // 수입 계산 (상승률 적용)
    incomes.forEach((income) => {
      if (isActiveInMonth(income, month)) {
        const monthlyAmount = getMonthlyAmount(income);
        const adjustedAmount = applyGrowthRate(
          monthlyAmount,
          income,
          month,
          index
        );
        totalIncome += adjustedAmount;

        // 2027년 9월 디버깅
        if (month.includes("2027-09")) {
          console.log(
            `수입 활성화: ${income.title}, amount: ${
              income.amount
            }, monthlyAmount: ${monthlyAmount}, adjustedAmount: ${adjustedAmount}, growthRate: ${
              income.growthRate || 0
            }`
          );
        }
      }
    });

    // 연금 계산 (날짜 기반 수령, 상승률 적용)
    pensions.forEach((pension) => {
      if (isActiveInMonth(pension, month)) {
        const monthlyAmount = getMonthlyAmount(pension);
        const adjustedAmount = applyGrowthRate(
          monthlyAmount,
          pension,
          month,
          index
        );
        totalPension += adjustedAmount;

        // 연금 디버깅 로그
        console.log(
          `연금 활성화: ${
            pension.title
          }, ${month}, ${adjustedAmount.toLocaleString()}원`
        );
      }
    });

    // 지출 계산 (물가 상승률 적용)
    expenses.forEach((expense) => {
      if (isActiveInMonth(expense, month)) {
        const monthlyAmount = getMonthlyAmount(expense);
        const adjustedAmount = applyGrowthRate(
          monthlyAmount,
          expense,
          month,
          index
        );
        totalExpense += adjustedAmount;
      }
    });

    // 부채 상환 계산 (새로운 상환 로직 적용)
    debts.forEach((debt) => {
      const debtPayment = calculateDebtPayment(debt, month, timeline);
      totalDebtPayment += debtPayment;

      // 부채 디버깅 로그
      if (debtPayment > 0) {
        console.log(
          `부채 상환: ${
            debt.title
          }, ${month}, ${debtPayment.toLocaleString()}원`
        );
      }
    });

    const netCashflow =
      totalIncome + totalPension - totalExpense - totalDebtPayment;

    // 연금 디버깅 (매월 첫 번째에만)
    if (index < 3) {
      console.log(`=== ${month} ===`);
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
 * 상승률 적용 계산
 * @param {number} baseAmount - 기본 금액
 * @param {Object} item - 재무 항목
 * @param {string} month - 현재 월
 * @param {number} monthIndex - 월 인덱스
 * @returns {number} 상승률이 적용된 금액
 */
function applyGrowthRate(baseAmount, item, month, monthIndex) {
  if (!item.growthRate || item.growthRate === 0) {
    return baseAmount;
  }

  // 시작일부터 경과된 년수 계산
  const startDate = new Date(item.startDate);
  const currentDate = new Date(month);
  const yearsElapsed =
    currentDate.getFullYear() -
    startDate.getFullYear() +
    (currentDate.getMonth() - startDate.getMonth()) / 12;

  // 상승률 적용 (복리)
  const growthRate = item.growthRate / 100;
  const adjustedAmount = baseAmount * Math.pow(1 + growthRate, yearsElapsed);

  return adjustedAmount;
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
  const currentMonth = new Date(month + "-01"); // YYYY-MM 형식을 YYYY-MM-01로 변환

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

  const isActive =
    currentDate >= itemStartDate &&
    (!itemEndDate || currentDate <= itemEndDate);

  // 디버깅 로그 (처음 몇 개만)
  if (Math.random() < 0.01) {
    // 1% 확률로만 로그 출력
    console.log("isActiveInMonth 체크:", {
      itemTitle: item.title,
      month,
      itemStart: itemStartDate.toISOString().split("T")[0],
      itemEnd: itemEndDate?.toISOString().split("T")[0],
      currentDate: currentDate.toISOString().split("T")[0],
      isActive,
    });
  }

  return isActive;
}

/**
 * 연금이 해당 월에 활성화되어 있는지 확인 (나이 기반)
 * @param {Object} pension - 연금 항목
 * @param {string} month - 확인할 월 (YYYY-MM-DD)
 * @param {string} birthDate - 사용자 생년월일 (YYYY-MM-DD)
 * @returns {boolean} 활성화 여부
 */
function isPensionActiveInMonth(pension, month, birthDate = null) {
  // 연금 관련 필드가 없으면 기존 로직 사용
  if (!pension.startAge) {
    return isActiveInMonth(pension, month);
  }

  // 생년월일이 제공된 경우 사용, 없으면 현재 나이 30세로 추정
  let birthYear, birthMonth;
  if (birthDate) {
    const birth = new Date(birthDate);
    birthYear = birth.getFullYear();
    birthMonth = birth.getMonth() + 1;
  } else {
    const currentDate = new Date();
    birthYear = currentDate.getFullYear() - 30;
    birthMonth = currentDate.getMonth() + 1;
  }

  // 현재 월의 나이 계산
  const currentMonth = new Date(month);
  const currentAge =
    currentMonth.getFullYear() -
    birthYear +
    (currentMonth.getMonth() + 1 - birthMonth) / 12;

  // 수령 시작/종료 나이 확인
  const startAge = pension.startAge || 65;
  const endAge = pension.endAge || 100;

  return currentAge >= startAge && currentAge <= endAge;
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
  console.log("monthlyData sample:", monthlyData.slice(0, 3));
  console.log(
    "2027년 데이터:",
    monthlyData.filter((item) => item.month.includes("2027"))
  );

  monthlyData.forEach((item) => {
    // YYYY-MM 형식을 YYYY-MM-01로 변환하여 유효한 날짜로 만들기
    const monthStr =
      item.month.includes("-") && item.month.length === 7
        ? item.month + "-01"
        : item.month;
    const date = new Date(monthStr);
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

      // 연금이 있는 년도 디버깅
      if (yearData.pension > 0) {
        console.log(`${yearData.year}년 연금 집계:`, {
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
