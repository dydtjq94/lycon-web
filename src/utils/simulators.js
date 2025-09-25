// 재무 시뮬레이션 계산 유틸리티

import { getMonthsBetween, addMonths, getTodayString } from "./date.js";

/**
 * 빈도(frequency)를 월 단위로 변환
 * @param {string} frequency - 빈도 ("monthly", "quarterly", "yearly", "daily", "once")
 * @returns {number} 월 단위 빈도
 */
export function frequencyToMonthly(frequency) {
  switch (frequency) {
    case "daily":
      return 30; // 대략적인 월 평균
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "yearly":
      return 12;
    case "once":
      return 0; // 일회성
    default:
      return 1;
  }
}

/**
 * 월별 타임라인 생성
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {Array} 월별 날짜 배열
 */
export function generateMonthlyTimeline(startDate, endDate) {
  const timeline = [];
  const months = getMonthsBetween(startDate, endDate);

  for (let i = 0; i <= months; i++) {
    timeline.push(addMonths(startDate, i));
  }

  return timeline;
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

    // 부채 상환 계산
    debts.forEach((debt) => {
      if (isActiveInMonth(debt, month)) {
        const monthlyPayment = calculateDebtPayment(debt, month);
        totalDebtPayment += monthlyPayment;
      }
    });

    const netCashflow =
      totalIncome + totalPension - totalExpense - totalDebtPayment;

    // 2025년 9월, 2026년 1월, 2027년 9월 데이터만 로그 출력
    if (
      month.includes("2025-09") ||
      month.includes("2026-01") ||
      month.includes("2027-09")
    ) {
      console.log(`=== ${month} ===`);
      console.log("totalIncome:", totalIncome);
      console.log("totalPension:", totalPension);
      console.log("totalExpense:", totalExpense);
      console.log("totalDebtPayment:", totalDebtPayment);
      console.log("netCashflow:", netCashflow);
    }

    cashflow.push({
      month,
      monthIndex: index,
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
  const { assets = [] } = data;
  const assetProjection = [];

  timeline.forEach((month, index) => {
    let totalAssets = 0;
    let totalDebt = 0;

    // 초기 자산
    assets.forEach((asset) => {
      if (isActiveInMonth(asset, month)) {
        const growthRate = (asset.rate || 0) / 100 / 12; // 월별 성장률
        const monthsFromStart = getMonthsBetween(asset.startDate, month);
        const assetValue =
          asset.amount * Math.pow(1 + growthRate, monthsFromStart);
        totalAssets += assetValue;
      }
    });

    // 부채 잔액
    data.debts.forEach((debt) => {
      if (isActiveInMonth(debt, month)) {
        const remainingDebt = calculateRemainingDebt(debt, month);
        totalDebt += remainingDebt;
      }
    });

    // 현금 흐름 반영
    const cumulativeCashflow = cashflow[index]?.cumulativeCashflow || 0;
    const netAssets = totalAssets + cumulativeCashflow - totalDebt;

    assetProjection.push({
      month,
      monthIndex: index,
      assets: totalAssets,
      debt: totalDebt,
      netAssets,
      cumulativeCashflow,
    });
  });

  return assetProjection;
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

  // 빈도 확인
  if (item.frequency === "once") {
    // 일회성인 경우 시작일과 같은 월이면 활성화
    // 월별 타임라인은 보통 해당 월의 1일이므로, 같은 년월이면 활성화
    const isActive =
      currentMonth.getFullYear() === itemStart.getFullYear() &&
      currentMonth.getMonth() === itemStart.getMonth();

    // 2027년 9월 디버깅
    if (month.includes("2027-09")) {
      console.log("일회성 디버깅:", {
        itemTitle: item.title,
        itemStartDate: item.startDate,
        currentMonth: month,
        itemStartYear: itemStart.getFullYear(),
        itemStartMonth: itemStart.getMonth(),
        currentYear: currentMonth.getFullYear(),
        currentMonthNum: currentMonth.getMonth(),
        isActive: isActive,
        frequency: item.frequency,
      });
    }

    return isActive;
  }

  return true;
}

/**
 * 월별 금액 계산
 * @param {Object} item - 재무 항목
 * @returns {number} 월별 금액
 */
function getMonthlyAmount(item) {
  const monthlyFrequency = frequencyToMonthly(item.frequency);

  // 일회성인 경우 0으로 나누기 방지
  if (monthlyFrequency === 0) {
    return item.amount; // 일회성은 전체 금액
  }

  return item.amount / monthlyFrequency;
}

/**
 * 부채 상환금 계산
 * @param {Object} debt - 부채 항목
 * @param {string} month - 계산할 월
 * @returns {number} 월별 상환금
 */
function calculateDebtPayment(debt, month) {
  if (!debt.rate) return 0; // 이자율이 없으면 상환금 없음

  const monthlyRate = debt.rate / 100 / 12;
  const monthsFromStart = getMonthsBetween(debt.startDate, month);

  if (monthsFromStart < 0) return 0;

  // 간단한 원리금 상환 계산 (PMT 공식)
  const principal = debt.amount;
  const totalMonths = debt.repaymentYears * 12;

  if (monthlyRate === 0) {
    return principal / totalMonths;
  }

  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  return monthlyPayment;
}

/**
 * 부채 잔액 계산
 * @param {Object} debt - 부채 항목
 * @param {string} month - 계산할 월
 * @returns {number} 잔액
 */
function calculateRemainingDebt(debt, month) {
  if (!debt.rate) return debt.amount; // 이자율이 없으면 원금 그대로

  const monthlyRate = debt.rate / 100 / 12;
  const monthsFromStart = getMonthsBetween(debt.startDate, month);

  if (monthsFromStart < 0) return debt.amount;
  if (monthsFromStart >= debt.repaymentYears * 12) return 0;

  const principal = debt.amount;
  const totalMonths = debt.repaymentYears * 12;

  if (monthlyRate === 0) {
    return Math.max(0, principal - (principal / totalMonths) * monthsFromStart);
  }

  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const remainingBalance =
    principal * Math.pow(1 + monthlyRate, monthsFromStart) -
    monthlyPayment *
      ((Math.pow(1 + monthlyRate, monthsFromStart) - 1) / monthlyRate);

  return Math.max(0, remainingBalance);
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
      yearData.cumulative = item.cumulativeCashflow;
    } else {
      yearData.assets += item.assets;
      yearData.debt += item.debt;
      yearData.cumulative = item.cumulativeCashflow;
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
 * 자산 세부 내역을 년별로 계산
 * @param {Object} data - 모든 재무 데이터
 * @param {Array} timeline - 월별 타임라인
 * @returns {Object} 년별 자산 세부 내역
 */
export function calculateAssetBreakdown(data, timeline) {
  const yearlyBreakdown = {};
  const { assets = [] } = data;

  // 각 년도별로 처리
  const years = new Set();
  timeline.forEach((month) => {
    const date = new Date(month);
    years.add(date.getFullYear());
  });

  years.forEach((year) => {
    yearlyBreakdown[year] = {};

    assets.forEach((asset) => {
      // 해당 년도의 12월 데이터로 계산
      const yearEndDate = new Date(year, 11, 31); // 12월 31일
      const yearEndStr = yearEndDate.toISOString().split("T")[0];

      if (isActiveInMonth(asset, yearEndStr)) {
        const growthRate = (asset.rate || 0) / 100 / 12; // 월별 성장률
        const monthsFromStart = getMonthsBetween(asset.startDate, yearEndStr);
        const assetValue =
          asset.amount * Math.pow(1 + growthRate, monthsFromStart);

        yearlyBreakdown[year][asset.title] = assetValue;
      }
    });
  });

  return yearlyBreakdown;
}

/**
 * 차트용 데이터 포맷팅 (기존 함수 유지)
 * @param {Array} data - 시뮬레이션 데이터
 * @param {string} type - 차트 타입 ("cashflow" | "assets")
 * @returns {Array} 차트 데이터
 */
export function formatChartData(data, type) {
  return data.map((item) => {
    const date = new Date(item.month);
    const monthLabel = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (type === "cashflow") {
      return {
        month: monthLabel,
        income: item.income,
        pension: item.pension,
        expense: item.expense,
        debtPayment: item.debtPayment,
        netCashflow: item.netCashflow,
        cumulative: item.cumulativeCashflow,
      };
    } else {
      return {
        month: monthLabel,
        assets: item.assets,
        debt: item.debt,
        netAssets: item.netAssets,
        cumulative: item.cumulativeCashflow,
      };
    }
  });
}
