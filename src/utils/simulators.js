/**
 * 시뮬레이션 설정 변수들
 */

// 임금상승률 (연간, %)
const WAGE_GROWTH_RATE = 3.0; // 3% (쉽게 변경 가능)

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
export function calculateYearlyCashflow(data, startYear, endYear, birthDate) {
  const { incomes = [], pensions = [], expenses = [], debts = [] } = data;
  const cashflow = [];

  console.log("=== calculateYearlyCashflow 시작 ===");
  console.log("시작년도:", startYear, "종료년도:", endYear);

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
          year
        );
        totalIncome += adjustedAmount;
      }
    });

    // 연금 계산 (나이 기반)
    pensions.forEach((pension) => {
      if (isPensionActiveInYear(pension, year, currentAge)) {
        const yearlyAmount = getYearlyAmount(pension);
        const adjustedAmount = applyYearlyGrowthRate(
          yearlyAmount,
          pension,
          year
        );
        totalPension += adjustedAmount;
      }
    });

    // 지출 계산 (물가 상승률 적용)
    expenses.forEach((expense) => {
      if (isActiveInYear(expense, year)) {
        const yearlyAmount = getYearlyAmount(expense);
        const adjustedAmount = applyYearlyGrowthRate(
          yearlyAmount,
          expense,
          year
        );
        totalExpense += adjustedAmount;
      }
    });

    // 부채 상환 계산 (연 단위)
    debts.forEach((debt) => {
      const debtPayment = calculateYearlyDebtPayment(debt, year);
      totalDebtPayment += debtPayment;
    });

    const netCashflow =
      totalIncome + totalPension - totalExpense - totalDebtPayment;
    const cumulativeCashflow =
      cashflow.length === 0
        ? netCashflow
        : cashflow[cashflow.length - 1].cumulativeCashflow + netCashflow;

    cashflow.push({
      year,
      age: currentAge,
      income: totalIncome,
      pension: totalPension,
      expense: totalExpense,
      debtPayment: totalDebtPayment,
      netCashflow,
      cumulativeCashflow,
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
  birthDate
) {
  const { assets = [], debts = [] } = data;
  const assetData = [];

  // 자산별 누적 값 추적
  const assetValues = {};
  const debtValues = {};

  for (let year = startYear; year <= endYear; year++) {
    const currentAge = birthDate ? getAgeFromYear(year, birthDate) : null;

    // 자산 계산 (점진적)
    assets.forEach((asset) => {
      if (isActiveInYear(asset, year)) {
        const assetKey = asset.title;

        if (!assetValues[assetKey]) {
          assetValues[assetKey] = {
            principal: 0,
            accumulated: 0,
            lastContributionYear: null,
          };
        }

        const yearlyAmount = getYearlyAmount(asset);
        const annualRate = (asset.rate || 0) / 100;

        if (asset.frequency === "once") {
          // 일회성 자산: 시작년도에만 추가
          const startYear = new Date(asset.startDate).getFullYear();
          if (year === startYear) {
            assetValues[assetKey].principal = yearlyAmount;
            assetValues[assetKey].accumulated = yearlyAmount;
          } else if (year > startYear) {
            // 이전 년도 값에 수익률 적용
            assetValues[assetKey].accumulated *= 1 + annualRate;
          }
        } else {
          // 정기적 자산: 매년 추가 + 이전 값에 수익률 적용
          assetValues[assetKey].accumulated =
            (assetValues[assetKey].accumulated + yearlyAmount) *
            (1 + annualRate);
          assetValues[assetKey].principal += yearlyAmount;
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

        // 부채는 원금에 이자 적용
        debtValues[debtKey].accumulated =
          (debtValues[debtKey].accumulated + yearlyAmount) * (1 + annualRate);
        debtValues[debtKey].principal += yearlyAmount;
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

    assetData.push({
      year,
      age: currentAge,
      assets: totalAssets,
      debt: totalDebt,
      netAssets,
      cumulativeCashflow,
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

  return year >= startYear && (!endYear || year <= endYear);
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
  if (!pension.startAge) {
    return isActiveInYear(pension, year);
  }

  if (!currentAge) return false;

  // 수령 시작/종료 나이 확인
  const startAge = pension.startAge || 65;
  const endAge = pension.endAge || 100;

  return currentAge >= startAge && currentAge <= endAge;
}

/**
 * 연 단위 금액 계산
 * @param {Object} item - 재무 항목
 * @returns {number} 연별 금액
 */
function getYearlyAmount(item) {
  const frequency = item.frequency || "yearly";

  switch (frequency) {
    case "daily":
      return item.amount * 365;
    case "monthly":
      return item.amount * 12;
    case "quarterly":
      return item.amount * 4;
    case "yearly":
      return item.amount;
    case "once":
      return item.amount;
    default:
      return item.amount;
  }
}

/**
 * 연 단위 상승률 적용 계산 (작년 기준 × 상승률)
 * @param {number} baseAmount - 기본 금액
 * @param {Object} item - 재무 항목
 * @param {number} year - 현재 년도
 * @returns {number} 상승률이 적용된 금액
 */
function applyYearlyGrowthRate(baseAmount, item, year) {
  if (!item.growthRate || item.growthRate === 0) {
    return baseAmount;
  }

  // 시작일부터 경과된 년수 계산
  const startDate = new Date(item.startDate);
  const startYear = startDate.getFullYear();
  const yearsElapsed = year - startYear;

  // 상승률 적용 (매년 작년 기준 × 상승률)
  const growthRate = item.growthRate / 100;
  const adjustedAmount = baseAmount * Math.pow(1 + growthRate, yearsElapsed);

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
  birthDate
) {
  const { assets = [] } = data;
  const yearlyBreakdown = {};

  // 자산별 누적 값 추적 (세부 내역용)
  const assetDetails = {};

  for (let year = startYear; year <= endYear; year++) {
    const currentAge = birthDate ? getAgeFromYear(year, birthDate) : null;

    if (!yearlyBreakdown[year]) {
      yearlyBreakdown[year] = {};
    }

    // 각 자산의 년말 가치 계산 (점진적)
    assets.forEach((asset) => {
      if (isActiveInYear(asset, year)) {
        const assetKey = asset.title;

        if (!assetDetails[assetKey]) {
          assetDetails[assetKey] = {
            accumulated: 0,
            lastContributionYear: null,
          };
        }

        const yearlyAmount = getYearlyAmount(asset);
        const annualRate = (asset.rate || 0) / 100;

        if (asset.frequency === "once") {
          // 일회성 자산: 시작년도에만 추가
          const startYear = new Date(asset.startDate).getFullYear();
          if (year === startYear) {
            assetDetails[assetKey].accumulated = yearlyAmount;
          } else if (year > startYear) {
            // 이전 년도 값에 수익률 적용
            assetDetails[assetKey].accumulated *= 1 + annualRate;
          }
        } else {
          // 정기적 자산: 매년 추가 + 이전 값에 수익률 적용
          assetDetails[assetKey].accumulated =
            (assetDetails[assetKey].accumulated + yearlyAmount) *
            (1 + annualRate);
        }

        // 해당 년도의 자산 가치 저장
        yearlyBreakdown[year][assetKey] = assetDetails[assetKey].accumulated;
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
 * 근로소득 기본값 생성 함수
 * @param {Object} profile - 프로필 정보
 * @returns {Object} 근로소득 기본 데이터
 */
export function createDefaultWageIncome(profile) {
  const currentYear = new Date().getFullYear();
  const currentAge = calculateAge(profile.birthDate);
  const retirementYear = new Date(profile.birthDate).getFullYear() + profile.retirementAge;
  
  return {
    title: "근로소득",
    amount: 5000, // 5,000만원 (만원 단위)
    startDate: `${currentYear}-01-01`,
    endDate: `${retirementYear}-12-31`,
    frequency: "monthly", // 월급
    growthRate: WAGE_GROWTH_RATE, // 임금상승률 적용
    note: "기본 근로소득 (임금상승률 자동 적용)",
    category: "incomes"
  };
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
