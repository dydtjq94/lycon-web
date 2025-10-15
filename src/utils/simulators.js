/**
 * 시뮬레이션 설정 변수들
 */

// 기본 설정값들 (대시보드에서 변경 가능)
let WAGE_GROWTH_RATE = 3.0; // 임금상승률 (연간, %)
let BUSINESS_GROWTH_RATE = 2.5; // 사업소득상승률 (연간, %)
let RENTAL_GROWTH_RATE = 2.0; // 임대소득상승률 (연간, %)
let DEFAULT_INCOME_GROWTH_RATE = 2.0; // 기본 수입상승률 (연간, %)
let INFLATION_RATE = 2.5; // 물가상승률 (연간, %)
let DEFAULT_RETURN_RATE = 5.0; // 기본 수익률 (연간, %)
let PENSION_RETURN_RATE = 5.0; // 연금 수익률 (연간, %)

// 동적 상승률 관리 (사용자 항목별)
let DYNAMIC_GROWTH_RATES = {}; // { "교육비": 2.5, "의료비": 3.0, ... }

// 설정값 업데이트 함수들
export function updateWageGrowthRate(rate) {
  WAGE_GROWTH_RATE = rate;
}

export function updateBusinessGrowthRate(rate) {
  BUSINESS_GROWTH_RATE = rate;
}

export function updateRentalGrowthRate(rate) {
  RENTAL_GROWTH_RATE = rate;
}

export function updateDefaultIncomeGrowthRate(rate) {
  DEFAULT_INCOME_GROWTH_RATE = rate;
}

export function updateInflationRate(rate) {
  INFLATION_RATE = rate;
}

export function updateDefaultReturnRate(rate) {
  DEFAULT_RETURN_RATE = rate;
}

export function updatePensionReturnRate(rate) {
  PENSION_RETURN_RATE = rate;
}

// 현재 설정값 조회 함수들
export function getWageGrowthRate() {
  return WAGE_GROWTH_RATE;
}

export function getBusinessGrowthRate() {
  return BUSINESS_GROWTH_RATE;
}

export function getRentalGrowthRate() {
  return RENTAL_GROWTH_RATE;
}

export function getDefaultIncomeGrowthRate() {
  return DEFAULT_INCOME_GROWTH_RATE;
}

export function getInflationRate() {
  return INFLATION_RATE;
}

export function getDefaultReturnRate() {
  return DEFAULT_RETURN_RATE;
}

export function getPensionReturnRate() {
  return PENSION_RETURN_RATE;
}

// 연금 적립금액 계산 함수 (자산 계산과 동일한 로직 사용)
function calculatePensionAccumulatedAmount(
  pension,
  endYear,
  rateSettings = null
) {
  const startYear = pension.startYear;
  const annualRate =
    (rateSettings?.pensionReturnRate || PENSION_RETURN_RATE) / 100;
  let accumulated = 0;

  console.log(`연금 적립금액 계산: ${pension.title}`, {
    startYear,
    endYear,
    annualRate,
    pensionRate: pension.pensionRate,
  });

  for (let year = startYear; year <= endYear; year++) {
    // 이전 년도 값에 수익률 적용 (올해 원금 추가 전)
    if (year > startYear) {
      accumulated *= 1 + annualRate;
    }

    // 새로운 적립금 추가 (올해 넣는 원금)
    const yearlyAmount = getYearlyAmount(pension);
    const adjustedAmount = applyYearlyGrowthRate(
      yearlyAmount,
      pension,
      year,
      "pensions",
      rateSettings
    );
    accumulated += adjustedAmount;

    console.log(
      `  ${year}년: ${accumulated.toFixed(
        0
      )}만원 (yearlyAmount: ${yearlyAmount}, adjustedAmount: ${adjustedAmount})`
    );
  }

  console.log(`최종 적립금액: ${accumulated.toFixed(0)}만원`);
  return accumulated;
}

// 동적 상승률 관리 함수들
export function setDynamicGrowthRate(title, rate) {
  DYNAMIC_GROWTH_RATES[title] = rate;
}

export function getDynamicGrowthRate(title) {
  return DYNAMIC_GROWTH_RATES[title] || 2.5; // 기본값 2.5%
}

export function getAllDynamicGrowthRates() {
  return DYNAMIC_GROWTH_RATES;
}

export function removeDynamicGrowthRate(title) {
  delete DYNAMIC_GROWTH_RATES[title];
}

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
 * 년별 현금 흐름 시뮬레이션 계산 (효율적인 점진적 계산)
 * @param {Object} data - 모든 재무 데이터
 * @param {number} startYear - 시작 년도
 * @param {number} endYear - 종료 년도
 * @param {string} birthDate - 생년월일
 * @returns {Array} 년별 현금 흐름 데이터
 */
export function calculateYearlyCashflow(
  data,
  startYear,
  endYear,
  birthDate,
  rateSettings = null
) {
  const {
    incomes = [],
    pensions = [],
    expenses = [],
    savings = [],
    debts = [],
  } = data;
  const cashflow = [];

  // 디버깅 로그 제거
  // console.log("calculateYearlyCashflow 데이터 확인:", {
  //   incomes: incomes.length,
  //   expenses: expenses.length,
  //   pensions: pensions.length,
  //   savings: savings.length,
  //   debts: debts.length,
  // });

  // 디버깅 로그 제거
  // console.log(
  //   `현금흐름 계산 시작 - 연금 데이터:`,
  //   pensions.map((p) => ({
  //     title: p.title,
  //     pensionType: p.pensionType,
  //     startYear: p.startYear,
  //     endYear: p.endYear,
  //     monthlyAmount: p.monthlyAmount,
  //     pensionRate: p.pensionRate,
  //     receiptYears: p.receiptYears,
  //   }))
  // );

  // console.log(
  //   `현금흐름 계산 시작 - 지출 데이터:`,
  //   expenses.map((e) => ({
  //     title: e.title,
  //     amount: e.amount,
  //     startDate: e.startDate,
  //     endDate: e.endDate,
  //     frequency: e.frequency,
  //   }))
  // );

  // console.log(`지출 데이터 개수: ${expenses.length}`);

  // console.log("=== calculateYearlyCashflow 시작 ===");
  // console.log("시작년도:", startYear, "종료년도:", endYear);

  for (let year = startYear; year <= endYear; year++) {
    const currentAge = birthDate ? getAgeFromYear(year, birthDate) : null;

    let totalIncome = 0;
    let totalPension = 0;
    let totalExpense = 0;
    let totalDebtPayment = 0;

    // 수입 계산 (연 단위)
    incomes.forEach((income) => {
      if (isActiveInYear(income, year)) {
        const yearlyAmount = getYearlyAmount(income);
        const adjustedAmount = applyYearlyGrowthRate(
          yearlyAmount,
          income,
          year,
          "incomes",
          rateSettings
        );
        totalIncome += adjustedAmount;
      }
    });

    // 연금 계산 (타입별)
    pensions.forEach((pension) => {
      if (pension.pensionType === "national") {
        // 국민연금: 수령시작년도부터 현금흐름에만 영향
        if (pension.startYear && year >= pension.startYear) {
          const yearlyAmount = getYearlyAmount(pension);
          const adjustedAmount = applyYearlyGrowthRate(
            yearlyAmount,
            pension,
            year,
            "pensions",
            rateSettings
          );

          console.log(`국민연금 현금흐름: ${pension.title}`, {
            year,
            startYear: pension.startYear,
            yearlyAmount: yearlyAmount.toFixed(0),
            adjustedAmount: adjustedAmount.toFixed(0),
            beforeTotal: totalPension.toFixed(0),
          });

          totalPension += adjustedAmount;
        }
      } else if (
        pension.pensionType === "retirement" ||
        pension.pensionType === "private"
      ) {
        // 퇴직연금/개인연금: 수령기간에만 현금흐름에 영향
        // 자산 시뮬레이션에서 이미 계산된 값을 사용 (별도 계산 불필요)
        const endYear = pension.endYear;
        const receiptStartYear = endYear + 1; // 적립 종료 다음년부터 수령
        const receiptEndYear = receiptStartYear + pension.receiptYears - 1;

        // 수령기간: 자산 시뮬레이션과 동일한 방식으로 적립 종료 시점 총 자산 계산 후 수령기간으로 나눈 금액
        if (year >= receiptStartYear && year <= receiptEndYear) {
          // 자산 시뮬레이션과 동일한 로직으로 적립 종료 시점 총 자산 계산
          const totalAccumulated = calculatePensionAccumulatedAmount(
            pension,
            endYear,
            rateSettings
          );
          const yearlyReceiptAmount = totalAccumulated / pension.receiptYears;

          console.log(`현금흐름 수령: ${pension.title}`, {
            year,
            totalAccumulated: totalAccumulated.toFixed(0),
            receiptYears: pension.receiptYears,
            yearlyReceiptAmount: yearlyReceiptAmount.toFixed(0),
          });

          totalPension += yearlyReceiptAmount;
        }
      }
    });

    // 지출 계산 (물가 상승률 적용)
    console.log(`${year}년 지출 계산 시작 - 총 ${expenses.length}개 항목`);
    expenses.forEach((expense, index) => {
      const isActive = isActiveInYear(expense, year);
      console.log(`지출 ${index + 1}: ${expense.title}`, {
        year,
        startDate: expense.startDate,
        endDate: expense.endDate,
        isActive,
        amount: expense.amount,
        frequency: expense.frequency,
      });

      if (isActive) {
        const yearlyAmount = getYearlyAmount(expense);
        const adjustedAmount = applyYearlyGrowthRate(
          yearlyAmount,
          expense,
          year,
          "expenses",
          rateSettings
        );
        totalExpense += adjustedAmount;

        console.log(`지출 계산: ${expense.title}`, {
          year,
          yearlyAmount: yearlyAmount.toFixed(0),
          adjustedAmount: adjustedAmount.toFixed(0),
          totalExpense: totalExpense.toFixed(0),
        });
      }
    });
    console.log(`${year}년 총 지출: ${totalExpense.toFixed(0)}만원`);

    // 저축 계산 (연 단위) - 현금흐름에서는 지출로 처리
    let totalSavings = 0;
    savings.forEach((saving) => {
      if (isActiveInYear(saving, year)) {
        const yearlyAmount = getYearlyAmount(saving);
        const adjustedAmount = applyYearlyGrowthRate(
          yearlyAmount,
          saving,
          year,
          "savings",
          rateSettings
        );
        totalSavings += adjustedAmount;
      }
    });

    // 부채 상환 계산 (연 단위)
    debts.forEach((debt) => {
      const debtPayment = calculateYearlyDebtPayment(debt, year);
      totalDebtPayment += debtPayment;
    });

    const netCashflow =
      totalIncome +
      totalPension -
      totalExpense -
      totalSavings -
      totalDebtPayment;
    const cumulativeCashflow =
      cashflow.length === 0
        ? netCashflow
        : cashflow[cashflow.length - 1].cumulativeCashflow + netCashflow;

    // 연금 현금흐름 디버깅 로그
    if (totalPension > 0) {
      console.log(`현금흐름 연금 합계: ${year}년`, {
        totalIncome: totalIncome.toFixed(0),
        totalPension: totalPension.toFixed(0),
        totalExpense: totalExpense.toFixed(0),
        totalSavings: totalSavings.toFixed(0),
        totalDebtPayment: totalDebtPayment.toFixed(0),
        netCashflow: netCashflow.toFixed(0),
      });
    }

    // 만원 미만 버림 처리
    cashflow.push({
      year,
      age: currentAge,
      income: Math.floor(totalIncome),
      pension: Math.floor(totalPension),
      expense: Math.floor(totalExpense),
      debtPayment: Math.floor(totalDebtPayment),
      netCashflow: Math.floor(netCashflow),
      cumulativeCashflow: Math.floor(cumulativeCashflow),
    });
  }

  return cashflow;
}

/**
 * 년별 자산 시뮬레이션 계산 (효율적인 점진적 계산)
 * @param {Object} data - 모든 재무 데이터
 * @param {number} startYear - 시작 년도
 * @param {number} endYear - 종료 년도
 * @param {Array} cashflow - 현금 흐름 데이터
 * @param {string} birthDate - 생년월일
 * @returns {Array} 년별 자산 데이터
 */
export function calculateYearlyAssets(
  data,
  startYear,
  endYear,
  cashflow,
  birthDate,
  rateSettings = null
) {
  const { assets = [], savings = [], pensions = [], debts = [] } = data;
  const assetData = [];

  // 자산별 누적 값 추적
  const assetValues = {};
  const debtValues = {};

  for (let year = startYear; year <= endYear; year++) {
    const currentAge = birthDate ? getAgeFromYear(year, birthDate) : null;

    // 자산 계산 (효율적 점진적) - 죽을 때까지 유지
    assets.forEach((asset) => {
      const assetKey = asset.title;
      const yearlyAmount = getYearlyAmount(asset);
      const annualRate = (asset.rate || 0) / 100;
      const startYear = new Date(asset.startDate).getFullYear();
      const endYear = asset.endDate
        ? new Date(asset.endDate).getFullYear()
        : null;
      const isActiveThisYear = isActiveInYear(asset, year);

      // 자산이 한 번이라도 활성화되었거나, 이전에 생성된 자산이 있으면 처리
      if (isActiveThisYear || assetValues[assetKey]) {
        if (!assetValues[assetKey]) {
          assetValues[assetKey] = {
            principal: 0,
            accumulated: 0,
            lastContributionYear: null,
          };
        }

        if (asset.frequency === "once") {
          // 일회성 자산: 시작년도에만 추가, 이후 수익률만 적용
          if (year === startYear) {
            assetValues[assetKey].principal = yearlyAmount;
            assetValues[assetKey].accumulated = yearlyAmount;
          } else if (year > startYear) {
            // 이전 년도 값에 수익률만 적용 (죽을 때까지 유지)
            assetValues[assetKey].accumulated *= 1 + annualRate;
          }
        } else {
          // 정기적 자산: 활성화된 년도에는 추가, 비활성화된 년도에는 수익률만 적용
          if (year > startYear) {
            // 이전 년도 값에 수익률 적용
            assetValues[assetKey].accumulated *= 1 + annualRate;
          }

          if (isActiveThisYear) {
            // 올해 활성화된 경우에만 새로 추가할 금액
            assetValues[assetKey].accumulated += yearlyAmount;
            assetValues[assetKey].principal += yearlyAmount;
            assetValues[assetKey].lastContributionYear = year;
          }
        }
      }
    });

    // 부채 계산 (점진적)
    debts.forEach((debt) => {
      if (isActiveInYear(debt, year)) {
        const debtKey = debt.title;

        if (!debtValues[debtKey]) {
          debtValues[debtKey] = {
            principal: 0,
            accumulated: 0,
          };
        }

        const yearlyAmount = getYearlyAmount(debt);
        const annualRate = (debt.rate || 0) / 100;

        // 부채는 이전 년도 값에 이자 적용 후 새 금액 추가 (효율적)
        if (year > startYear) {
          // 이전 년도 값에 이자 적용
          debtValues[debtKey].accumulated *= 1 + annualRate;
        }
        // 올해 새로 추가할 금액
        debtValues[debtKey].accumulated += yearlyAmount;
        debtValues[debtKey].principal += yearlyAmount;
      }
    });

    // 현금 자산 처리 (기본 자산 + 저축)
    const cashKey = "현금";

    // 기본 현금 자산이 있는지 확인
    const defaultCashAsset = assets.find((asset) => asset.title === "현금");

    // 저축이 있거나 기본 현금 자산이 있으면 현금 처리
    if (savings.length > 0 || defaultCashAsset) {
      if (!assetValues[cashKey]) {
        assetValues[cashKey] = {
          principal: 0,
          accumulated: 0,
          lastContributionYear: null,
        };
      }

      const annualRate = 0; // 현금은 수익률 0%

      // 이전 년도 값에 수익률 적용 (현금은 0%이지만 일관성 유지)
      if (year > startYear) {
        assetValues[cashKey].accumulated *= 1 + annualRate;
      }

      // 저축이 활성화된 경우 추가
      savings.forEach((saving) => {
        if (isActiveInYear(saving, year)) {
          const yearlyAmount = getYearlyAmount(saving);
          const adjustedAmount = applyYearlyGrowthRate(
            yearlyAmount,
            saving,
            year,
            "savings",
            rateSettings
          );

          assetValues[cashKey].accumulated += adjustedAmount;
          assetValues[cashKey].principal += adjustedAmount;
          assetValues[cashKey].lastContributionYear = year;
        }
      });
    }

    // 연금 자산 처리 (퇴직연금/개인연금만)
    pensions.forEach((pension) => {
      if (
        pension.pensionType === "retirement" ||
        pension.pensionType === "private"
      ) {
        const pensionKey = pension.title;

        if (!assetValues[pensionKey]) {
          assetValues[pensionKey] = {
            principal: 0,
            accumulated: 0,
            lastContributionYear: null,
            totalAccumulatedAtEnd: null, // 적립 종료 시점의 총 자산 저장
          };
        }

        const annualRate =
          (rateSettings?.pensionReturnRate || PENSION_RETURN_RATE) / 100;
        const startYear = pension.startYear;
        const endYear = pension.endYear;
        const receiptStartYear = endYear + 1;
        const receiptEndYear = receiptStartYear + pension.receiptYears - 1;

        // 적립 기간: 수익률 적용 + 자산 추가
        if (year >= startYear && year <= endYear) {
          // 이전 년도 값에 수익률 적용 (올해 원금 추가 전)
          if (year > startYear) {
            assetValues[pensionKey].accumulated *= 1 + annualRate;
          }

          // 새로운 적립금 추가 (올해 넣는 원금)
          const yearlyAmount = getYearlyAmount(pension);
          const adjustedAmount = applyYearlyGrowthRate(
            yearlyAmount,
            pension,
            year,
            "pensions",
            rateSettings
          );
          assetValues[pensionKey].accumulated += adjustedAmount;
          assetValues[pensionKey].principal += adjustedAmount;
          assetValues[pensionKey].lastContributionYear = year;

          // 적립 종료 시점의 총 자산 저장
          if (year === endYear) {
            assetValues[pensionKey].totalAccumulatedAtEnd =
              assetValues[pensionKey].accumulated;
            console.log(`적립 종료 시점 자산 저장: ${pension.title}`, {
              endYear,
              totalAccumulated: assetValues[pensionKey].accumulated.toFixed(0),
            });
          }
        }

        // 수령 기간: 수익률 없이 N분의 1로 차감
        if (year >= receiptStartYear && year <= receiptEndYear) {
          // 적립 종료 시점의 실제 자산을 수령기간으로 나눈 금액만큼 차감
          const totalAccumulated =
            assetValues[pensionKey].totalAccumulatedAtEnd;
          if (totalAccumulated) {
            const yearlyReceiptAmount = totalAccumulated / pension.receiptYears;

            console.log(`자산 차감: ${pension.title}`, {
              year,
              totalAccumulated: totalAccumulated.toFixed(0),
              receiptYears: pension.receiptYears,
              yearlyReceiptAmount: yearlyReceiptAmount.toFixed(0),
              beforeAccumulated: assetValues[pensionKey].accumulated.toFixed(0),
            });

            assetValues[pensionKey].accumulated -= yearlyReceiptAmount;
          }
        }
      }
    });

    // 총 자산 및 부채 계산
    let totalAssets = 0;
    let totalDebt = 0;

    Object.values(assetValues).forEach((asset) => {
      totalAssets += asset.accumulated;
    });

    Object.values(debtValues).forEach((debt) => {
      totalDebt += debt.accumulated;
    });

    const netAssets = totalAssets - totalDebt;
    const currentCashflow = cashflow.find((cf) => cf.year === year);
    const cumulativeCashflow = currentCashflow?.cumulativeCashflow || 0;

    // 만원 미만 버림 처리
    assetData.push({
      year,
      age: currentAge,
      assets: Math.floor(totalAssets),
      debt: Math.floor(totalDebt),
      netAssets: Math.floor(netAssets),
      cumulativeCashflow: Math.floor(cumulativeCashflow),
    });
  }

  return assetData;
}

/**
 * 현금 흐름 시뮬레이션 계산 (기존 함수 - 호환성 유지)
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

    // 자산 계산 (빈도별 처리)
    data.assets.forEach((asset) => {
      if (isActiveInMonth(asset, month)) {
        const annualRate = (asset.rate || 0) / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

        if (asset.frequency === "once") {
          // 일회성 자산: 시작년도에 원금 추가, 이후 모든 년도에 수익률로 계속 증가
          const startYear = new Date(asset.startDate).getFullYear();
          const currentYear = new Date(month).getFullYear();

          // 시작년도 이후부터는 계속 수익률 적용
          if (currentYear >= startYear) {
            const startYearIndex = timeline.findIndex(
              (m) => new Date(m).getFullYear() === startYear
            );
            if (startYearIndex !== -1) {
              const monthsElapsed = index - startYearIndex;
              if (monthsElapsed >= 0) {
                const currentValue =
                  asset.amount * Math.pow(1 + monthlyRate, monthsElapsed);
                totalAssets += currentValue;
              }
            }
          }
        } else {
          // 정기적 자산: 매년 추가되는 금액을 모두 누적 계산
          const startDate = new Date(asset.startDate);
          const endDate = asset.endDate
            ? new Date(asset.endDate)
            : new Date(month);
          const currentDate = new Date(month);

          let totalValue = 0;

          // 시작일부터 현재까지의 모든 추가 시점을 계산
          let addDate = new Date(startDate);
          let addCount = 0;
          const maxAdditions = 100; // 안전장치: 최대 100회 추가로 제한

          // 시작일이 현재 월보다 이전이거나 같은 경우에만 계산
          if (addDate <= currentDate) {
            while (
              addDate <= currentDate &&
              addDate <= endDate &&
              addCount < maxAdditions
            ) {
              const addMonthIndex = timeline.findIndex((m) => {
                const timelineDate = new Date(m);
                return (
                  timelineDate.getFullYear() === addDate.getFullYear() &&
                  timelineDate.getMonth() === addDate.getMonth()
                );
              });

              if (addMonthIndex !== -1) {
                const monthsElapsed = index - addMonthIndex;
                if (monthsElapsed >= 0) {
                  const currentValue =
                    asset.amount * Math.pow(1 + monthlyRate, monthsElapsed);
                  totalValue += currentValue;
                }
              }

              // 다음 추가일 계산
              switch (asset.frequency) {
                case "monthly":
                  addDate.setMonth(addDate.getMonth() + 1);
                  break;
                case "quarterly":
                  addDate.setMonth(addDate.getMonth() + 3);
                  break;
                case "yearly":
                  addDate.setFullYear(addDate.getFullYear() + 1);
                  break;
                default:
                  addDate.setFullYear(addDate.getFullYear() + 100); // 무한 루프 방지
                  break;
              }
              addCount++;
            }
          }

          totalAssets += totalValue;
        }
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
  if (!pension.startYear) {
    return isActiveInMonth(pension, month);
  }

  const currentMonth = new Date(month);
  const currentYear = currentMonth.getFullYear();

  // 수령 시작/종료 년도 확인
  const startYear = pension.startYear || 0;
  const endYear = pension.endYear || 9999;

  return currentYear >= startYear && currentYear <= endYear;
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
 * 나이 기반 연도 변환 함수
 * @param {string} month - 월 문자열 (YYYY-MM)
 * @param {string} birthDate - 생년월일 (YYYY-MM-DD)
 * @returns {number} 해당 월의 나이
 */
export function getAgeFromMonth(month, birthDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const currentMonth = new Date(month + "-01");

  // 한국 나이 계산 (년도만 고려)
  const currentYear = currentMonth.getFullYear();
  const birthYear = birth.getFullYear();

  return currentYear - birthYear + 1;
}

/**
 * 년도에서 나이 계산
 * @param {number} year - 년도
 * @param {string} birthDate - 생년월일 (YYYY-MM-DD)
 * @returns {number} 해당 년도의 나이
 */
export function getAgeFromYear(year, birthDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const birthYear = birth.getFullYear();

  // 한국 나이 계산 (년도만 고려)
  return year - birthYear + 1;
}

/**
 * 해당 년도에 항목이 활성화되어 있는지 확인
 * @param {Object} item - 재무 항목
 * @param {number} year - 확인할 년도
 * @returns {boolean} 활성화 여부
 */
function isActiveInYear(item, year) {
  const itemStart = new Date(item.startDate);
  const itemEnd = item.endDate ? new Date(item.endDate) : null;

  const startYear = itemStart.getFullYear();
  const endYear = itemEnd ? itemEnd.getFullYear() : null;

  const isActive = year >= startYear && (!endYear || year <= endYear);

  // 근로소득 디버깅 로그
  if (
    item.title &&
    (item.title.includes("근로소득") || item.title.includes("급여"))
  ) {
    console.log(`isActiveInYear 체크: ${item.title}`, {
      year,
      startDate: item.startDate,
      endDate: item.endDate,
      startYear,
      endYear,
      isActive,
    });
  }

  // 지출 데이터 디버깅 로그
  if (item.title && item.title.includes("생활비")) {
    console.log(`isActiveInYear 체크: ${item.title}`, {
      year,
      startDate: item.startDate,
      endDate: item.endDate,
      startYear,
      endYear,
      isActive,
    });
  }

  return isActive;
}

/**
 * 연금이 해당 년도에 활성화되어 있는지 확인 (나이 기반)
 * @param {Object} pension - 연금 항목
 * @param {number} year - 확인할 년도
 * @param {number} currentAge - 현재 나이
 * @returns {boolean} 활성화 여부
 */
function isPensionActiveInYear(pension, year, currentAge) {
  // 연금 관련 필드가 없으면 기존 로직 사용
  if (!pension.startYear) {
    return isActiveInYear(pension, year);
  }

  // 수령 시작/종료 년도 확인
  const startYear = pension.startYear || 0;
  const endYear = pension.endYear || 9999;

  return year >= startYear && year <= endYear;
}

/**
 * 연 단위 금액 계산
 * @param {Object} item - 재무 항목
 * @returns {number} 연별 금액
 */
function getYearlyAmount(item) {
  const frequency = item.frequency || "yearly";

  // 연금의 경우 monthlyAmount 사용, 그 외에는 amount 사용
  let amount;
  if (item.monthlyAmount !== undefined && item.monthlyAmount !== null) {
    amount = item.monthlyAmount;
  } else if (item.amount !== undefined && item.amount !== null) {
    amount = item.amount;
  } else {
    amount = 0; // 기본값 0
  }

  const yearlyAmount = (() => {
    switch (frequency) {
      case "daily":
        return amount * 365;
      case "monthly":
        return amount * 12;
      case "quarterly":
        return amount * 4;
      case "yearly":
        return amount;
      case "once":
        return amount;
      default:
        return amount;
    }
  })();

  // 근로소득 디버깅 로그
  if (
    item.title &&
    (item.title.includes("근로소득") || item.title.includes("급여"))
  ) {
    console.log(`getYearlyAmount: ${item.title}`, {
      amount,
      frequency,
      yearlyAmount,
      monthlyAmount: item.monthlyAmount,
      originalAmount: item.amount,
    });
  }

  // 연금 디버깅 로그
  if (item.title && (item.title.includes("연금") || item.pensionType)) {
    console.log(`getYearlyAmount: ${item.title} (연금)`, {
      amount,
      frequency,
      yearlyAmount,
      monthlyAmount: item.monthlyAmount,
      originalAmount: item.amount,
      pensionType: item.pensionType,
    });
  }

  return yearlyAmount;
}

/**
 * 연 단위 상승률 적용 계산 (전역 설정 사용)
 * @param {number} baseAmount - 기본 금액
 * @param {Object} item - 재무 항목
 * @param {number} year - 현재 년도
 * @param {string} category - 카테고리 (incomes, expenses, assets, debts, pensions)
 * @returns {number} 상승률이 적용된 금액
 */
function applyYearlyGrowthRate(
  baseAmount,
  item,
  year,
  category = "incomes",
  rateSettings = null
) {
  let growthRate = 0;

  // 1. 먼저 동적 상승률 확인 (사용자 정의 항목)
  if (DYNAMIC_GROWTH_RATES[item.title]) {
    growthRate = DYNAMIC_GROWTH_RATES[item.title];
  } else {
    // 2. 기본 상승률 적용
    if (rateSettings) {
      // rateSettings가 제공된 경우 사용
      switch (category) {
        case "incomes":
          if (item.title === "근로소득" || item.title === "급여") {
            growthRate = rateSettings.wageGrowthRate || WAGE_GROWTH_RATE;
          } else if (item.title === "사업소득") {
            growthRate =
              rateSettings.businessGrowthRate || BUSINESS_GROWTH_RATE;
          } else if (item.title === "임대소득") {
            growthRate = rateSettings.rentalGrowthRate || RENTAL_GROWTH_RATE;
          } else {
            growthRate =
              rateSettings.defaultIncomeGrowthRate ||
              DEFAULT_INCOME_GROWTH_RATE;
          }
          break;
        case "expenses":
          growthRate = rateSettings.inflationRate || INFLATION_RATE;
          break;
        case "savings":
          growthRate = rateSettings.inflationRate || INFLATION_RATE; // 저축도 물가상승률 적용
          break;
        case "assets":
          growthRate =
            item.rate || rateSettings.defaultReturnRate || DEFAULT_RETURN_RATE;
          break;
        case "debts":
          growthRate = item.rate || 0;
          break;
        case "pensions":
          // 연금 타입별 상승률 적용
          if (item.pensionType === "national") {
            // 국민연금: 동적 상승률 사용 (연금명 기준)
            const pensionRate = rateSettings.dynamicRates?.[item.title];
            growthRate = pensionRate !== undefined ? pensionRate : 2.5; // 기본값 2.5%
          } else if (
            item.pensionType === "retirement" ||
            item.pensionType === "private"
          ) {
            // 퇴직연금/개인연금: 올해 넣는 원금에는 상승률 적용 안함
            growthRate = 0;
          }
          break;
        default:
          growthRate = 0;
      }
    } else {
      // 기존 전역 변수 사용
      switch (category) {
        case "incomes":
          if (item.title === "근로소득" || item.title === "급여") {
            growthRate = WAGE_GROWTH_RATE;
          } else if (item.title === "사업소득") {
            growthRate = BUSINESS_GROWTH_RATE;
          } else if (item.title === "임대소득") {
            growthRate = RENTAL_GROWTH_RATE;
          } else {
            growthRate = DEFAULT_INCOME_GROWTH_RATE;
          }
          break;
        case "expenses":
          growthRate = INFLATION_RATE;
          break;
        case "savings":
          growthRate = INFLATION_RATE; // 저축도 물가상승률 적용
          break;
        case "assets":
          growthRate = item.rate || DEFAULT_RETURN_RATE;
          break;
        case "debts":
          growthRate = item.rate || 0;
          break;
        case "pensions":
          // 연금은 동적 상승률 사용 (연금명 기준)
          const pensionRate = DYNAMIC_GROWTH_RATES[item.title];
          growthRate = pensionRate !== undefined ? pensionRate : 2.5; // 기본값 2.5%
          break;
        default:
          growthRate = 0;
      }
    }
  }

  if (growthRate === 0) {
    return baseAmount;
  }

  // 시작일부터 경과된 년수 계산
  const startDate = new Date(item.startDate);
  const startYear = startDate.getFullYear();
  const yearsElapsed = year - startYear;

  // 상승률 적용 (매년 작년 기준 × 상승률)
  const rate = growthRate / 100;
  const adjustedAmount = baseAmount * Math.pow(1 + rate, yearsElapsed);

  // 근로소득 디버깅 로그
  if (
    item.title &&
    (item.title.includes("근로소득") || item.title.includes("급여"))
  ) {
    console.log(`applyYearlyGrowthRate: ${item.title}`, {
      baseAmount,
      growthRate,
      yearsElapsed,
      rate,
      adjustedAmount,
    });
  }

  return adjustedAmount;
}

/**
 * 연 단위 부채 상환액 계산
 * @param {Object} debt - 부채 항목
 * @param {number} year - 현재 년도
 * @returns {number} 연별 상환액
 */
function calculateYearlyDebtPayment(debt, year) {
  if (!isActiveInYear(debt, year)) {
    return 0;
  }

  const principalAmount = parseFloat(debt.principalAmount) || 0;
  const interestRate =
    parseFloat(debt.interestRate) || parseFloat(debt.rate) || 0;
  const repaymentType = debt.repaymentType || "equal_payment";

  if (repaymentType === "lump_sum") {
    // 일시상환: 만료일에만 상환
    const endYear = debt.endDate ? new Date(debt.endDate).getFullYear() : null;
    return year === endYear ? principalAmount : 0;
  }

  if (repaymentType === "equal_payment") {
    // 원리금균등상환
    const startYear = new Date(debt.startDate).getFullYear();
    const endYear = debt.endDate ? new Date(debt.endDate).getFullYear() : null;

    if (!endYear || year < startYear || year > endYear) return 0;

    const totalYears = endYear - startYear + 1;
    return calculatePMT(principalAmount, interestRate, totalYears);
  }

  if (repaymentType === "minimum_payment") {
    // 최소상환
    const minimumRate = parseFloat(debt.minimumPaymentRate) || 2;
    return principalAmount * (minimumRate / 100);
  }

  // 고정 연 상환액
  const yearlyPayment = parseFloat(debt.yearlyPayment) || 0;
  return yearlyPayment;
}

/**
 * 은퇴 시점 월 찾기
 * @param {Array} timeline - 월별 타임라인
 * @param {string} birthDate - 생년월일
 * @param {number} retirementAge - 은퇴 나이
 * @returns {string|null} 은퇴 시점 월 (YYYY-MM)
 */
export function findRetirementMonth(timeline, birthDate, retirementAge) {
  if (!birthDate || !retirementAge) return null;

  for (const month of timeline) {
    const age = getAgeFromMonth(month, birthDate);
    if (age && age >= retirementAge) {
      return month;
    }
  }
  return null;
}

/**
 * 년 단위 데이터로 변환 (나이 기반) - 새로운 효율적인 방식
 * @param {Array} yearlyData - 년별 시뮬레이션 데이터
 * @param {string} type - 차트 타입 ("cashflow" | "assets")
 * @returns {Array} 년별 차트 데이터 (나이 정보 포함)
 */
export function formatYearlyChartData(yearlyData, type) {
  // 이미 년별 데이터이므로 그대로 반환
  return yearlyData.map((item) => ({
    year: item.year,
    age: item.age,
    income: item.income || 0,
    pension: item.pension || 0,
    expense: item.expense || 0,
    debtPayment: item.debtPayment || 0,
    netCashflow: item.netCashflow || 0,
    assets: item.assets || 0,
    debt: item.debt || 0,
    netAssets: item.netAssets || 0,
    cumulative: item.cumulativeCashflow || 0,
  }));
}

/**
 * 월별 데이터를 년별로 변환 (기존 방식 - 호환성 유지)
 * @param {Array} monthlyData - 월별 시뮬레이션 데이터
 * @param {string} type - 차트 타입 ("cashflow" | "assets")
 * @param {string} birthDate - 생년월일 (선택사항)
 * @returns {Array} 년별 차트 데이터 (나이 정보 포함)
 */
export function formatMonthlyToYearlyData(monthlyData, type, birthDate = null) {
  const yearlyData = {};

  monthlyData.forEach((item) => {
    // YYYY-MM 형식을 YYYY-MM-01로 변환하여 유효한 날짜로 만들기
    const monthStr =
      item.month.includes("-") && item.month.length === 7
        ? item.month + "-01"
        : item.month;
    const date = new Date(monthStr);
    const year = date.getFullYear();

    // 나이 계산 (생년월일이 제공된 경우)
    const age = birthDate ? getAgeFromMonth(item.month, birthDate) : null;

    if (!yearlyData[year]) {
      yearlyData[year] = {
        year: year,
        age: age, // 나이 정보 추가
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
    } else {
      yearData.netAssets = yearData.assets - yearData.debt;
    }
  });

  return Object.values(yearlyData).sort((a, b) => a.year - b.year);
}

/**
 * 년별 자산 세부 내역 계산 (효율적인 방식)
 * @param {Object} data - 모든 재무 데이터
 * @param {number} startYear - 시작 년도
 * @param {number} endYear - 종료 년도
 * @param {string} birthDate - 생년월일
 * @returns {Object} 년별 자산 세부 내역
 */
export function calculateYearlyAssetBreakdown(
  data,
  startYear,
  endYear,
  birthDate,
  rateSettings = null
) {
  const { assets = [], savings = [], pensions = [] } = data;
  const yearlyBreakdown = {};

  // 자산별 누적 값 추적 (세부 내역용)
  const assetDetails = {};

  for (let year = startYear; year <= endYear; year++) {
    const currentAge = birthDate ? getAgeFromYear(year, birthDate) : null;

    if (!yearlyBreakdown[year]) {
      yearlyBreakdown[year] = {};
    }

    // 각 자산의 년말 가치 계산 (점진적) - 죽을 때까지 유지
    assets.forEach((asset) => {
      const assetKey = asset.title;
      const yearlyAmount = getYearlyAmount(asset);
      const annualRate = (asset.rate || 0) / 100;
      const startYear = new Date(asset.startDate).getFullYear();
      const isActiveThisYear = isActiveInYear(asset, year);

      // 자산이 한 번이라도 활성화되었거나, 이전에 생성된 자산이 있으면 처리
      if (isActiveThisYear || assetDetails[assetKey]) {
        if (!assetDetails[assetKey]) {
          assetDetails[assetKey] = {
            accumulated: 0,
            lastContributionYear: null,
          };
        }

        if (asset.frequency === "once") {
          // 일회성 자산: 시작년도에만 추가, 이후 수익률만 적용
          if (year === startYear) {
            assetDetails[assetKey].accumulated = yearlyAmount;
          } else if (year > startYear) {
            // 이전 년도 값에 수익률만 적용 (죽을 때까지 유지)
            assetDetails[assetKey].accumulated *= 1 + annualRate;
          }
        } else {
          // 정기적 자산: 활성화된 년도에는 추가, 비활성화된 년도에는 수익률만 적용
          if (year > startYear) {
            // 이전 년도 값에 수익률 적용
            assetDetails[assetKey].accumulated *= 1 + annualRate;
          }

          if (isActiveThisYear) {
            // 올해 활성화된 경우에만 새로 추가할 금액
            assetDetails[assetKey].accumulated += yearlyAmount;
          }
        }

        // 해당 년도의 자산 가치 저장 (만원 미만 버림)
        yearlyBreakdown[year][assetKey] = Math.floor(
          assetDetails[assetKey].accumulated
        );
      }
    });

    // 현금 자산 처리 (기본 자산 + 저축)
    const cashKey = "현금";

    // 기본 현금 자산이 있는지 확인
    const defaultCashAsset = assets.find((asset) => asset.title === "현금");

    // 저축이 있거나 기본 현금 자산이 있으면 현금 처리
    if (savings.length > 0 || defaultCashAsset) {
      if (!assetDetails[cashKey]) {
        assetDetails[cashKey] = {
          accumulated: 0,
        };
      }

      const annualRate = 0; // 현금은 수익률 0%

      // 이전 년도 값에 수익률 적용 (현금은 0%이지만 일관성 유지)
      if (year > startYear) {
        assetDetails[cashKey].accumulated *= 1 + annualRate;
      }

      // 저축이 활성화된 경우 추가
      savings.forEach((saving) => {
        if (isActiveInYear(saving, year)) {
          const yearlyAmount = getYearlyAmount(saving);
          const adjustedAmount = applyYearlyGrowthRate(
            yearlyAmount,
            saving,
            year,
            "savings",
            rateSettings
          );

          assetDetails[cashKey].accumulated += adjustedAmount;
        }
      });

      // 해당 년도의 자산 가치 저장 (만원 미만 버림)
      yearlyBreakdown[year][cashKey] = Math.floor(
        assetDetails[cashKey].accumulated
      );
    }

    // 연금 자산 처리 (퇴직연금/개인연금만)
    pensions.forEach((pension) => {
      if (
        pension.pensionType === "retirement" ||
        pension.pensionType === "private"
      ) {
        const pensionKey = pension.title;

        if (!assetDetails[pensionKey]) {
          assetDetails[pensionKey] = {
            accumulated: 0,
            totalAccumulatedAtEnd: null, // 적립 종료 시점의 총 자산 저장
          };
        }

        const annualRate =
          (rateSettings?.pensionReturnRate || PENSION_RETURN_RATE) / 100;
        const startYear = pension.startYear;
        const endYear = pension.endYear;
        const receiptStartYear = endYear + 1;
        const receiptEndYear = receiptStartYear + pension.receiptYears - 1;

        // 적립 기간: 수익률 적용 + 자산 추가
        if (year >= startYear && year <= endYear) {
          // 이전 년도 값에 수익률 적용 (올해 원금 추가 전)
          if (year > startYear) {
            assetDetails[pensionKey].accumulated *= 1 + annualRate;
          }

          // 새로운 적립금 추가 (올해 넣는 원금)
          const yearlyAmount = getYearlyAmount(pension);
          const adjustedAmount = applyYearlyGrowthRate(
            yearlyAmount,
            pension,
            year,
            "pensions",
            rateSettings
          );
          assetDetails[pensionKey].accumulated += adjustedAmount;

          // 적립 종료 시점의 총 자산 저장
          if (year === endYear) {
            assetDetails[pensionKey].totalAccumulatedAtEnd =
              assetDetails[pensionKey].accumulated;
          }
        }

        // 수령 기간: 수익률 없이 N분의 1로 차감
        if (year >= receiptStartYear && year <= receiptEndYear) {
          // 적립 종료 시점의 실제 자산을 수령기간으로 나눈 금액만큼 차감
          const totalAccumulated =
            assetDetails[pensionKey].totalAccumulatedAtEnd;
          if (totalAccumulated) {
            const yearlyReceiptAmount = totalAccumulated / pension.receiptYears;
            assetDetails[pensionKey].accumulated -= yearlyReceiptAmount;
          }
        }

        // 해당 년도의 자산 가치 저장 (만원 미만 버림)
        yearlyBreakdown[year][pensionKey] = Math.floor(
          assetDetails[pensionKey].accumulated
        );
      }
    });
  }

  return yearlyBreakdown;
}

/**
 * 자산 세부 내역 계산 (기존 방식 - 호환성 유지)
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

    // 각 자산의 년말 가치 계산 (빈도별 처리)
    assets.forEach((asset) => {
      if (isActiveInMonth(asset, month)) {
        const annualRate = (asset.rate || 0) / 100;
        const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

        if (asset.frequency === "once") {
          // 일회성 자산: 시작년도에 원금 추가, 이후 모든 년도에 수익률로 계속 증가
          const startYear = new Date(asset.startDate).getFullYear();
          const currentYear = new Date(month).getFullYear();

          // 시작년도 이후부터는 계속 수익률 적용
          if (currentYear >= startYear) {
            const startYearIndex = timeline.findIndex(
              (m) => new Date(m).getFullYear() === startYear
            );
            if (startYearIndex !== -1) {
              const monthsElapsed = index - startYearIndex;
              if (monthsElapsed >= 0) {
                const currentValue =
                  asset.amount * Math.pow(1 + monthlyRate, monthsElapsed);

                if (!yearlyBreakdown[year][asset.title]) {
                  yearlyBreakdown[year][asset.title] = 0;
                }
                yearlyBreakdown[year][asset.title] = currentValue;
              }
            }
          }
        } else {
          // 정기적 자산: 매년 추가되는 금액을 모두 누적 계산
          const startDate = new Date(asset.startDate);
          const endDate = asset.endDate
            ? new Date(asset.endDate)
            : new Date(month);
          const currentDate = new Date(month);

          let totalValue = 0;

          // 시작일부터 현재까지의 모든 추가 시점을 계산
          let addDate = new Date(startDate);
          let addCount = 0;
          const maxAdditions = 100; // 안전장치: 최대 100회 추가로 제한

          // 시작일이 현재 월보다 이전이거나 같은 경우에만 계산
          if (addDate <= currentDate) {
            while (
              addDate <= currentDate &&
              addDate <= endDate &&
              addCount < maxAdditions
            ) {
              const addMonthIndex = timeline.findIndex((m) => {
                const timelineDate = new Date(m);
                return (
                  timelineDate.getFullYear() === addDate.getFullYear() &&
                  timelineDate.getMonth() === addDate.getMonth()
                );
              });

              if (addMonthIndex !== -1) {
                const monthsElapsed = index - addMonthIndex;
                if (monthsElapsed >= 0) {
                  const currentValue =
                    asset.amount * Math.pow(1 + monthlyRate, monthsElapsed);
                  totalValue += currentValue;
                }
              }

              // 다음 추가일 계산
              switch (asset.frequency) {
                case "monthly":
                  addDate.setMonth(addDate.getMonth() + 1);
                  break;
                case "quarterly":
                  addDate.setMonth(addDate.getMonth() + 3);
                  break;
                case "yearly":
                  addDate.setFullYear(addDate.getFullYear() + 1);
                  break;
                default:
                  addDate.setFullYear(addDate.getFullYear() + 100); // 무한 루프 방지
                  break;
              }
              addCount++;
            }
          }

          if (!yearlyBreakdown[year][asset.title]) {
            yearlyBreakdown[year][asset.title] = 0;
          }
          yearlyBreakdown[year][asset.title] = totalValue;
        }
      }
    });
  });

  return yearlyBreakdown;
}

/**
 * 기본 수입 항목들 생성 함수
 * @param {Object} profile - 프로필 정보
 * @returns {Array} 기본 수입 항목들
 */
export function createDefaultIncomes(profile) {
  const currentYear = new Date().getFullYear();
  const birthYear = new Date(profile.birthDate).getFullYear();
  const retirementAge = parseInt(profile.retirementAge); // 숫자로 변환
  const retirementYear = birthYear + retirementAge;
  const deathYear = birthYear + 89; // 90세까지 (89 + 1 = 90)

  // 디버깅용 로그
  console.log("createDefaultIncomes 디버깅:", {
    birthDate: profile.birthDate,
    birthYear,
    retirementAge: profile.retirementAge,
    retirementAgeParsed: retirementAge,
    retirementYear,
    deathYear,
    currentYear,
  });

  const baseTime = new Date();

  return [
    {
      title: "근로소득",
      amount: 0, // 기본값 0원
      startDate: `${currentYear}-01-01`,
      endDate: `${retirementYear - 1}-12-31`, // 은퇴 전년도까지
      frequency: "monthly", // 월급
      note: "임금상승률 적용",
      category: "incomes",
      createdAt: new Date(baseTime.getTime() - 2000), // 가장 먼저 (오래된 시간)
    },
    {
      title: "사업소득",
      amount: 0, // 기본값 0원
      startDate: `${currentYear}-01-01`,
      endDate: `${deathYear}-12-31`, // 90세까지
      frequency: "monthly", // 월급
      note: "사업소득상승률 적용",
      category: "incomes",
      createdAt: new Date(baseTime.getTime() - 1000), // 두 번째
    },
    {
      title: "임대소득",
      amount: 0, // 기본값 0원
      startDate: `${currentYear}-01-01`,
      endDate: `${deathYear}-12-31`, // 90세까지
      frequency: "monthly", // 월급
      note: "임대소득상승률 적용",
      category: "incomes",
      createdAt: new Date(baseTime.getTime() - 500), // 세 번째 (가장 최근)
    },
  ];
}

/**
 * 기본 지출 항목들 생성 함수
 * @param {Object} profile - 프로필 정보
 * @returns {Array} 기본 지출 항목들
 */
export function createDefaultExpenses(profile) {
  const currentYear = new Date().getFullYear();
  const birthYear = new Date(profile.birthDate).getFullYear();
  const retirementYear = birthYear + profile.retirementAge;
  const deathYear = birthYear + 89; // 90세까지 (89 + 1 = 90)

  const baseTime = new Date();

  return [
    {
      title: "은퇴 전 생활비",
      amount: 0, // 기본값 0원
      startDate: `${currentYear}-01-01`,
      endDate: `${retirementYear - 1}-12-31`, // 은퇴 전까지
      frequency: "monthly", // 월 단위
      note: "물가상승률 적용",
      category: "expenses",
      createdAt: new Date(baseTime.getTime() - 2000), // 기본 지출
    },
    {
      title: "은퇴 후 생활비",
      amount: 0, // 기본값 0원
      startDate: `${retirementYear}-01-01`,
      endDate: `${deathYear}-12-31`, // 90세까지
      frequency: "monthly", // 월 단위
      note: "물가상승률 적용",
      category: "expenses",
      createdAt: new Date(baseTime.getTime() - 1000), // 기본 지출
    },
  ];
}

/**
 * 나이 계산 함수 (simulators.js 내부용)
 * @param {string} birthDate - 생년월일 (YYYY-MM-DD)
 * @returns {number} 나이
 */
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 연금 적립 금액 계산
 * @param {Object} pension - 연금 데이터
 * @param {number} endYear - 적립 종료 년도
 * @param {Object} rateSettings - 비율 설정
 * @returns {number} 적립된 연금 금액
 */
function calculatePensionAccumulated(pension, endYear, rateSettings) {
  const monthlyAmount = pension.monthlyAmount || 0;
  const annualRate = (pension.pensionRate || 0) / 100;
  const startYear = pension.startYear || 0;

  let accumulated = 0;

  for (let year = startYear; year < endYear; year++) {
    const yearlyAmount = monthlyAmount * 12;
    accumulated = (accumulated + yearlyAmount) * (1 + annualRate);
  }

  return accumulated;
}

/**
 * 기본 현금 자산 생성
 * @param {string} birthDate - 생년월일
 * @param {number} retirementAge - 은퇴 나이
 * @returns {Array} 기본 현금 자산 배열
 */
export function createDefaultAssets(birthDate, retirementAge) {
  const currentYear = new Date().getFullYear();
  const birthYear = new Date(birthDate).getFullYear();
  const deathYear = birthYear + 89; // 90세까지

  const baseTime = new Date();

  return [
    {
      title: "현금",
      amount: 0, // 기본값 0원
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`, // 현재 년도만
      frequency: "yearly", // 년 단위
      note: "기본 수익률 적용",
      rate: 0, // 현금은 수익률 0%
      category: "assets",
      createdAt: new Date(baseTime.getTime() - 3000), // 가장 먼저
    },
  ];
}
