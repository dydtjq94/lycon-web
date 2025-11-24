/**
 * 현금흐름 시뮬레이션 계산 유틸리티
 */
import { calculateKoreanAge } from "./koreanAge";

/**
 * PMT 계산 함수 (정기 지불액 계산)
 * @param {number} pv - 현재 가치 (Present Value)
 * @param {number} rate - 기간당 이자율 (연수익률)
 * @param {number} nper - 총 지불/수령 횟수 (기간)
 * @returns {number} 매년 수령액
 */
function calculatePMT(pv, rate, nper) {
  if (rate === 0) {
    // 이자율이 0이면 단순히 원금을 기간으로 나눔
    return pv / nper;
  }
  // PMT = (PV × r × (1 + r)^n) / ((1 + r)^n - 1)
  const pow = Math.pow(1 + rate, nper);
  return (pv * rate * pow) / (pow - 1);
}

/**
 * 연간 이자율을 월간 이자율로 변환 (복리 기준)
 * @param {number} annualRate - 연간 이자율 (소수, 예: 0.12 = 12%)
 * @returns {number} 월간 이자율 (소수)
 * @example
 * convertAnnualToMonthlyRate(0.12) // 0.009488... (약 0.9488%)
 */
function convertAnnualToMonthlyRate(annualRate) {
  if (annualRate === 0) return 0;
  // 복리 변환: (1 + r_annual)^(1/12) - 1 = r_monthly
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * 연간 상승률을 월간 상승률로 변환 (복리 기준)
 * @param {number} annualGrowthRate - 연간 상승률 (소수, 예: 0.03 = 3%)
 * @returns {number} 월간 상승률 (소수)
 */
function convertAnnualToMonthlyGrowthRate(annualGrowthRate) {
  return convertAnnualToMonthlyRate(annualGrowthRate);
}

/**
 * 날짜가 지정된 범위 내에 있는지 확인
 * @param {Date} currentDate - 확인할 날짜
 * @param {number} startYear - 시작 년도
 * @param {number} startMonth - 시작 월 (1-12)
 * @param {number} endYear - 종료 년도
 * @param {number} endMonth - 종료 월 (1-12)
 * @returns {boolean} 범위 내에 있으면 true
 */
function isDateInRange(currentDate, startYear, startMonth, endYear, endMonth) {
  const startDate = new Date(startYear, (startMonth || 1) - 1);
  const endDate = new Date(endYear, (endMonth || 12) - 1);
  return currentDate >= startDate && currentDate <= endDate;
}

/**
 * 월 단위 PMT 계산 함수 (정기 지불액 계산)
 * @param {number} pv - 현재 가치 (Present Value)
 * @param {number} monthlyRate - 월간 이자율 (소수)
 * @param {number} months - 총 지불/수령 개월 수
 * @returns {number} 매월 지불액
 * @example
 * calculateMonthlyPMT(10000, 0.01, 120) // 월간 PMT 계산
 */
function calculateMonthlyPMT(pv, monthlyRate, months) {
  if (monthlyRate === 0) {
    // 이자율이 0이면 단순히 원금을 개월 수로 나눔
    return pv / months;
  }
  // PMT = (PV × r × (1 + r)^n) / ((1 + r)^n - 1)
  const pow = Math.pow(1 + monthlyRate, months);
  return (pv * monthlyRate * pow) / (pow - 1);
}

/**
 * 경과 개월 수 계산
 * @param {number} startYear - 시작 년도
 * @param {number} startMonth - 시작 월 (1-12)
 * @param {number} endYear - 종료 년도
 * @param {number} endMonth - 종료 월 (1-12)
 * @returns {number} 경과 개월 수
 */
function calculateMonthsElapsed(startYear, startMonth, endYear, endMonth) {
  return (endYear - startYear) * 12 + ((endMonth || 12) - (startMonth || 1));
}

/**
 * 년도와 월을 Date 객체로 변환
 * @param {number} year - 년도
 * @param {number} month - 월 (1-12)
 * @returns {Date} Date 객체
 */
function createDateFromYearMonth(year, month) {
  return new Date(year, (month || 1) - 1);
}

/**
 * 부동산 취득세 계산 함수
 * @param {number} propertyValue - 부동산 가치 (만원 단위)
 * @returns {number} 취득세 (만원 단위)
 */
function calculateAcquisitionTax(propertyValue) {
  // 6억원 = 60000만원
  // 9억원 = 90000만원
  if (propertyValue <= 60000) {
    // 6억원 이하: 1.1%
    return propertyValue * 0.011;
  } else if (propertyValue <= 90000) {
    // 6억원 초과 9억원 이하: 2.2%
    return propertyValue * 0.022;
  } else {
    // 9억원 초과: 3.3%
    return propertyValue * 0.033;
  }
}

/**
 * 보유기간에 따른 장기보유특별공제율 계산
 * @param {number} holdingYears - 보유기간 (년)
 * @returns {number} 공제율 (0~0.8)
 */
function getLongTermDeductionRate(holdingYears) {
  if (holdingYears <= 4) return 0.24;
  if (holdingYears === 5) return 0.32;
  if (holdingYears === 6) return 0.4;
  if (holdingYears === 7) return 0.48;
  if (holdingYears === 8) return 0.56;
  if (holdingYears === 9) return 0.64;
  if (holdingYears === 10) return 0.72;
  return 0.8; // 10년 초과
}

/**
 * 과세표준에 따른 양도소득세율 및 누진공제 계산
 * @param {number} taxableIncome - 과세표준 (만원 단위)
 * @returns {Object} {taxRate: 세율, deduction: 누진공제}
 */
function getCapitalGainsTaxRate(taxableIncome) {
  if (taxableIncome <= 1400) {
    return { taxRate: 0.06, deduction: 0 };
  } else if (taxableIncome <= 5000) {
    return { taxRate: 0.15, deduction: 126 };
  } else if (taxableIncome <= 8800) {
    return { taxRate: 0.24, deduction: 576 };
  } else if (taxableIncome <= 15000) {
    return { taxRate: 0.35, deduction: 1544 };
  } else if (taxableIncome <= 30000) {
    return { taxRate: 0.38, deduction: 1994 };
  } else if (taxableIncome <= 50000) {
    return { taxRate: 0.4, deduction: 2594 };
  } else if (taxableIncome <= 100000) {
    return { taxRate: 0.42, deduction: 3594 };
  } else {
    // 10억원 초과
    return { taxRate: 0.45, deduction: 6594 };
  }
}

/**
 * 부동산 양도소득세 계산 함수 (거주용 1주택)
 * @param {number} salePrice - 양도가액 (만원 단위)
 * @param {number} acquisitionPrice - 취득가액 (만원 단위)
 * @param {number} holdingYears - 보유기간 (년)
 * @returns {Object} {capitalGainsTax: 양도소득세, totalTax: 총납부금액}
 */
function calculateCapitalGainsTax(salePrice, acquisitionPrice, holdingYears) {
  // 12억원 = 120000만원
  const EXEMPTION_THRESHOLD = 120000;

  // 양도가액이 12억원 이하면 양도세 없음
  if (salePrice <= EXEMPTION_THRESHOLD) {
    return { capitalGainsTax: 0, totalTax: 0 };
  }

  // 양도차익 = 양도가액 - 취득가액
  const capitalGain = salePrice - acquisitionPrice;

  // 1. 과세 대상 양도차익 = 양도차익 × (양도가액 - 12억원) / 양도가액
  const taxableCapitalGain =
    capitalGain * ((salePrice - EXEMPTION_THRESHOLD) / salePrice);

  // 2. 장기보유특별공제액 = 과세 대상 양도차익 × 공제율
  const deductionRate = getLongTermDeductionRate(holdingYears);
  const longTermDeduction = taxableCapitalGain * deductionRate;

  // 3. 과세표준 = (과세 대상 양도차익 - 장기보유특별공제액) - 250만원
  const taxableIncome = taxableCapitalGain - longTermDeduction - 250;

  // 과세표준이 음수면 세금 없음
  if (taxableIncome <= 0) {
    return { capitalGainsTax: 0, totalTax: 0 };
  }

  // 4. 양도소득세 = (과세표준 × 세율) - 누진공제
  const { taxRate, deduction } = getCapitalGainsTaxRate(taxableIncome);
  const capitalGainsTax = taxableIncome * taxRate - deduction;

  // 5. 총 납부금액 = 양도소득세 × 1.1 (지방소득세 10% 포함)
  const totalTax = capitalGainsTax * 1.1;

  return { capitalGainsTax, totalTax };
}

/**
 * 소득 데이터를 기반으로 현금흐름 시뮬레이션을 계산합니다.
 * @param {Object} profileData - 프로필 데이터
 * @param {Array} incomes - 소득 데이터 배열
 * @param {Array} expenses - 지출 데이터 배열 (추후 구현)
 * @param {Array} savings - 저축 데이터 배열 (추후 구현)
 * @param {Array} pensions - 연금 데이터 배열 (추후 구현)
 * @returns {Array} 현금흐름 시뮬레이션 데이터
 */
export function calculateCashflowSimulation(
  profileData,
  incomes = [],
  expenses = [],
  savings = [],
  pensions = [],
  realEstates = [], // 부동산 데이터 추가
  assets = [], // 자산 데이터 추가
  debts = [] // 부채 데이터 추가
) {
  const currentYear = new Date().getFullYear();
  const startAge = calculateKoreanAge(profileData.birthYear, currentYear); // 만 나이로 실시간 계산
  const deathAge = 90;
  const simulationYears = deathAge - startAge + 1;

  // 은퇴년도 가져오기
  const retirementYear = profileData.retirementYear || currentYear;

  const cashflowData = [];

  // 저축별 연도별 투자 금액 추적 (저축 ID별, 년도별)
  const savingInvestments = {}; // { savingId: { year: amount } }

  for (let i = 0; i < simulationYears; i++) {
    const year = currentYear + i;
    const age = startAge + i;

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;
    let totalPension = 0;
    let totalDebtInjection = 0;
    const debtInjections = [];
    const positiveBreakdown = [];
    const negativeBreakdown = [];

    const addPositive = (label, amount, category, keyBase) => {
      const value = Number(amount) || 0;
      if (value <= 0) return;
      positiveBreakdown.push({
        key: `${keyBase || category}-${year}`,
        label,
        category,
        amount: value,
      });
    };

    const addNegative = (label, amount, category, keyBase) => {
      const value = Number(amount) || 0;
      if (value <= 0) return;
      negativeBreakdown.push({
        key: `${keyBase || category}-${year}`,
        label,
        category,
        amount: value,
      });
    };

    // 소득 계산 (월 단위 기준)
    incomes.forEach((income, incomeIndex) => {
      const startYear = income.startYear;
      const startMonth = income.startMonth || 1; // 기본값: 1월 (월초)
      const endYear = income.endYear;
      const endMonth = income.endMonth || 12; // 기본값: 12월 (월말)

      // 해당 년도에 소득이 발생하는지 확인
      if (year >= startYear && year <= endYear) {
        // 해당 년도에 포함된 개월 수 계산
        let monthsInYear = 0;
        let firstMonthInYear = 1;
        let lastMonthInYear = 12;

        if (year === startYear && year === endYear) {
          // 시작년도와 종료년도가 같은 경우
          firstMonthInYear = startMonth;
          lastMonthInYear = endMonth;
          monthsInYear = endMonth - startMonth + 1;
        } else if (year === startYear) {
          // 시작년도인 경우
          firstMonthInYear = startMonth;
          lastMonthInYear = 12;
          monthsInYear = 12 - startMonth + 1;
        } else if (year === endYear) {
          // 종료년도인 경우
          firstMonthInYear = 1;
          lastMonthInYear = endMonth;
          monthsInYear = endMonth;
        } else {
          // 중간 년도인 경우 (전체 12개월)
          firstMonthInYear = 1;
          lastMonthInYear = 12;
          monthsInYear = 12;
        }

        if (monthsInYear > 0) {
          const growthRate = income.growthRate / 100;
          const monthlyGrowthRate =
            convertAnnualToMonthlyGrowthRate(growthRate);

          let yearTotalIncome = 0;

          if (income.frequency === "monthly") {
            // 월간 빈도: 각 월마다 개별 계산
            const monthlyAmount = income.amount;

            // 해당 년도의 첫 월부터 시작하는 기준으로 경과 개월 수 계산
            const baseMonthsElapsed =
              (year - startYear) * 12 + (firstMonthInYear - startMonth);

            // 각 월마다 소득 계산 및 합산
            for (let m = firstMonthInYear; m <= lastMonthInYear; m++) {
              // 현재 월까지의 경과 개월 수
              const monthsElapsed = baseMonthsElapsed + (m - firstMonthInYear);

              // 월 단위 상승률 적용
              const adjustedMonthlyAmount =
                monthlyAmount * Math.pow(1 + monthlyGrowthRate, monthsElapsed);
              yearTotalIncome += adjustedMonthlyAmount;
            }
          } else {
            // 연간 빈도: 해당 년도에 포함된 개월 수만큼 비율로 계산
            // 예: 연간 120만원, 10개월이면 120만원 * (10/12) = 100만원
            const annualAmount = income.amount;
            const ratioInYear = monthsInYear / 12; // 해당 년도에 포함된 비율

            // 시작 시점부터 현재 년도까지의 경과 년 수 계산
            const yearsElapsed = year - startYear;

            // 연간 상승률 적용 (년 단위)
            const adjustedAnnualAmount =
              annualAmount * Math.pow(1 + growthRate, yearsElapsed);

            // 해당 년도에 포함된 개월 수만큼 비율로 계산
            yearTotalIncome = adjustedAnnualAmount * ratioInYear;
          }

          totalIncome += yearTotalIncome;

          addPositive(
            income.title,
            yearTotalIncome,
            "소득",
            income.id ? `income-${income.id}` : `income-${incomeIndex}`
          );
        }
      }
    });

    // 지출 계산
    expenses.forEach((expense, expenseIndex) => {
      if (year >= expense.startYear && year <= expense.endYear) {
        const yearsElapsed = year - expense.startYear;
        const growthRate = expense.growthRate / 100;

        // 빈도에 따라 연간 금액 계산
        const yearlyAmount =
          expense.frequency === "monthly"
            ? expense.amount * 12
            : expense.amount;

        const adjustedAmount =
          yearlyAmount * Math.pow(1 + growthRate, yearsElapsed);
        totalExpense += adjustedAmount;

        addNegative(
          expense.title,
          adjustedAmount,
          "지출",
          expense.id ? `expense-${expense.id}` : `expense-${expenseIndex}`
        );
      }
    });

    // 부채 이자 및 원금 상환 계산
    let totalDebtInterest = 0;
    let totalDebtPrincipal = 0;
    const debtInterestDetails = [];
    const debtPrincipalDetails = [];

    debts.forEach((debt) => {
      const debtStartYear =
        typeof debt.startYear === "string"
          ? parseInt(debt.startYear, 10)
          : debt.startYear;
      const debtEndYear =
        typeof debt.endYear === "string"
          ? parseInt(debt.endYear, 10)
          : debt.endYear;
      const rawDebtAmount =
        typeof debt.debtAmount === "string"
          ? parseFloat(debt.debtAmount)
          : debt.debtAmount;
      const debtAmount = Number.isFinite(rawDebtAmount) ? rawDebtAmount : 0;

      if (
        debt.addCashToFlow &&
        debtAmount > 0 &&
        Number.isFinite(debtStartYear) &&
        year === debtStartYear
      ) {
        totalDebtInjection += debtAmount;
        debtInjections.push({
          title: debt.title,
          amount: debtAmount,
        });

        addPositive(
          `${debt.title} | 대출 유입`,
          debtAmount,
          "대출 유입",
          `debtInjection-${debt.id || debt.title}`
        );
      }

      if (
        !Number.isFinite(debtStartYear) ||
        !Number.isFinite(debtEndYear) ||
        debtStartYear === undefined ||
        debtEndYear === undefined
      ) {
        return;
      }

      // 연말 기준: 대출 받은 첫 해는 이자 없음
      if (year === debtStartYear) {
        // 첫 해: 대출만 받고 이자 발생 안 함
        debt.amount = -debtAmount;
        debt.isActive = true;
      } else if (year > debtStartYear && year <= debtEndYear) {
        const yearsElapsed = year - debtStartYear; // 1년부터 시작
        const totalYears = debtEndYear - debtStartYear; // 총 이자 발생 기간
        const interestRate = debt.interestRate || 0; // 이미 소수로 저장됨

        if (debt.debtType === "bullet") {
          // 만기일시상환: 매년 이자만 지불, 만기일에 원금 상환
          if (year < debtEndYear) {
            // 만기 전: 이자만 지불
            const yearlyInterest = debtAmount * interestRate;
            if (yearlyInterest > 0) {
              totalDebtInterest += yearlyInterest;
              debtInterestDetails.push({
                title: debt.title,
                amount: yearlyInterest,
              });
              addNegative(
                `${debt.title} | 이자`,
                yearlyInterest,
                "부채 이자",
                `debt-interest-${debt.id || debt.title}`
              );
            }

            debt.amount = -debtAmount;
          } else if (year === debtEndYear) {
            // 만기년도: 이자 + 원금 상환
            const yearlyInterest = debtAmount * interestRate;
            if (yearlyInterest > 0) {
              totalDebtInterest += yearlyInterest;
              debtInterestDetails.push({
                title: debt.title,
                amount: yearlyInterest,
              });
              addNegative(
                `${debt.title} | 이자`,
                yearlyInterest,
                "부채 이자",
                `debt-interest-${debt.id || debt.title}`
              );
            }
            if (debtAmount > 0) {
              totalDebtPrincipal += debtAmount;
              debtPrincipalDetails.push({
                title: debt.title,
                amount: debtAmount,
              });
              addNegative(
                `${debt.title} | 원금 상환`,
                debtAmount,
                "부채 원금 상환",
                `debt-principal-${debt.id || debt.title}`
              );
            }

            debt.amount = 0;
            debt.isActive = false;
          }
        } else if (debt.debtType === "equal") {
          // 원리금균등상환: 매년 동일한 금액 상환
          // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
          const principal = debtAmount;
          const r = interestRate;
          const n = totalYears;

          if (n > 0 && r > 0) {
            const denominator = Math.pow(1 + r, n) - 1;
            const pmt =
              denominator !== 0
                ? (principal * (r * Math.pow(1 + r, n))) / denominator
                : 0;
            const yearlyPayment = pmt;

            // 이자 부분 계산: 남은 원금 * 이자율
            // yearsElapsed는 1부터 시작 (첫 해는 이자 없음)
            let remainingPrincipal = principal;
            for (let i = 1; i < yearsElapsed; i++) {
              const interestPayment = remainingPrincipal * r;
              const principalPayment = yearlyPayment - interestPayment;
              remainingPrincipal -= principalPayment;
            }

            const interestPayment = remainingPrincipal * r;
            const principalPayment = yearlyPayment - interestPayment;

            if (interestPayment > 0) {
              totalDebtInterest += interestPayment;
              debtInterestDetails.push({
                title: debt.title,
                amount: interestPayment,
              });
              addNegative(
                `${debt.title} | 이자`,
                interestPayment,
                "부채 이자",
                `debt-interest-${debt.id || debt.title}`
              );
            }
            if (principalPayment > 0) {
              totalDebtPrincipal += principalPayment;
              debtPrincipalDetails.push({
                title: debt.title,
                amount: principalPayment,
              });
              addNegative(
                `${debt.title} | 원금 상환`,
                principalPayment,
                "부채 원금 상환",
                `debt-principal-${debt.id || debt.title}`
              );
            }

            const remainingAfterPayment = Math.max(
              remainingPrincipal - principalPayment,
              0
            );
            debt.amount = -remainingAfterPayment;
            if (remainingAfterPayment <= 0) {
              debt.amount = 0;
              debt.isActive = false;
            }
          } else if (r === 0 && n > 0) {
            // 이자율이 0%인 경우: 원금을 균등 분할
            const yearlyPayment = principal / n;
            if (yearlyPayment > 0) {
              totalDebtPrincipal += yearlyPayment;
              debtPrincipalDetails.push({
                title: debt.title,
                amount: yearlyPayment,
              });
            }

            const remainingAfterPayment = Math.max(
              principal - yearlyPayment * (yearsElapsed + 1),
              0
            );
            debt.amount = -remainingAfterPayment;
            if (remainingAfterPayment <= 0) {
              debt.amount = 0;
              debt.isActive = false;
            }
          }
        } else if (debt.debtType === "principal") {
          // 원금균등상환: 매년 동일한 원금 상환, 이자는 남은 원금에 대해 계산
          const principal = debtAmount;
          const r = interestRate;
          const n = totalYears;
          const yearlyPrincipalPayment = n > 0 ? principal / n : 0;

          // 이자 부분 계산: 남은 원금 * 이자율
          // yearsElapsed는 1부터 시작 (첫 해는 이자 없음)
          let remainingPrincipal = principal;
          for (let i = 1; i < yearsElapsed; i++) {
            remainingPrincipal -= yearlyPrincipalPayment;
          }

          const interestPayment = remainingPrincipal * r;
          const principalPayment = yearlyPrincipalPayment;

          if (interestPayment > 0) {
            totalDebtInterest += interestPayment;
            debtInterestDetails.push({
              title: debt.title,
              amount: interestPayment,
            });
            addNegative(
              `${debt.title} | 이자`,
              interestPayment,
              "부채 이자",
              `debt-interest-${debt.id || debt.title}`
            );
          }
          if (principalPayment > 0) {
            totalDebtPrincipal += principalPayment;
            debtPrincipalDetails.push({
              title: debt.title,
              amount: principalPayment,
            });
            addNegative(
              `${debt.title} | 원금 상환`,
              principalPayment,
              "부채 원금 상환",
              `debt-principal-${debt.id || debt.title}`
            );
          }

          const remainingAfterPayment = Math.max(
            remainingPrincipal - principalPayment,
            0
          );
          debt.amount = -remainingAfterPayment;
          if (remainingAfterPayment <= 0) {
            debt.amount = 0;
            debt.isActive = false;
          }
        } else if (debt.debtType === "grace") {
          // 거치식상환: 거치기간 동안 이자만 지불, 이후 원금 균등상환 + 남은 원금의 이자
          // 연말 기준: 대출 첫 해는 이자 없으므로 gracePeriod 조정
          const principal = debtAmount;
          const r = interestRate;
          const gracePeriod = parseInt(debt.gracePeriod, 10) || 0;
          // 연말 기준: 대출년도(이자 없음) + 거치기간
          const graceEndYear = debtStartYear + gracePeriod; // 거치기간 마지막 년도
          const repaymentYears = debtEndYear - graceEndYear; // 상환기간 = 종료년도 - 거치기간종료년도

          if (year <= graceEndYear) {
            // 거치기간: 이자만 지불 (거치기간 마지막 년도까지 포함)
            const yearlyInterest = principal * r;
            if (yearlyInterest > 0) {
              totalDebtInterest += yearlyInterest;
              debtInterestDetails.push({
                title: debt.title,
                amount: yearlyInterest,
              });
            }

            debt.amount = -principal;
          } else if (
            year > graceEndYear &&
            year <= debtEndYear &&
            repaymentYears > 0
          ) {
            // 상환기간: 원금을 균등하게 상환 + 남은 원금의 이자
            const yearlyPrincipalPayment = principal / repaymentYears;
            const repaymentYearsElapsed = year - graceEndYear; // 상환 시작 후 경과년수 (1부터 시작)

            // 현재 년도의 남은 원금 계산 (이전 해까지 갚은 금액 제외)
            const paidPrincipal =
              yearlyPrincipalPayment * (repaymentYearsElapsed - 1);
            const remainingPrincipal = principal - paidPrincipal;

            // 현재 년도의 이자와 원금
            const interestPayment = remainingPrincipal * r;
            const principalPayment = yearlyPrincipalPayment;

            if (interestPayment > 0) {
              totalDebtInterest += interestPayment;
              debtInterestDetails.push({
                title: debt.title,
                amount: interestPayment,
              });
              addNegative(
                `${debt.title} | 이자`,
                interestPayment,
                "부채 이자",
                `debt-interest-${debt.id || debt.title}`
              );
            }
            if (principalPayment > 0) {
              totalDebtPrincipal += principalPayment;
              debtPrincipalDetails.push({
                title: debt.title,
                amount: principalPayment,
              });
              addNegative(
                `${debt.title} | 원금 상환`,
                principalPayment,
                "부채 원금 상환",
                `debt-principal-${debt.id || debt.title}`
              );
            }

            const remainingAfterPayment = Math.max(
              remainingPrincipal - principalPayment,
              0
            );
            debt.amount = -remainingAfterPayment;
            if (remainingAfterPayment <= 0) {
              debt.amount = 0;
              debt.isActive = false;
            }
          }
        }
      }

      if (year > debtEndYear) {
        debt.amount = 0;
        debt.isActive = false;
      }
    });

    // 양도소득세 관련 변수 (저축 + 부동산)
    let totalCapitalGainsTax = 0; // 양도소득세 총액
    const capitalGainsTaxes = []; // 양도소득세 상세 정보

    // 저축 계산 (현금흐름에서는 년간 저축 상승률만 적용, 이자율 적용 안함)
    let totalSavingMaturity = 0; // 저축 만료 수입 (별도 변수)
    let totalSavingIncome = 0; // 저축 수익 (배당/이자) - 별도 변수
    let savingMaturities = []; // 저축 만료 상세 정보
    const savingPurchases = []; // 저축 구매 상세 정보
    const savingIncomes = []; // 저축 수익 상세 정보 (배당/이자)
    const savingContributions = []; // 저축 적립 상세 정보

    savings.forEach((saving) => {
      // 년도 데이터 타입 확인 및 변환(문자열 → 숫자)
      const sStartYear =
        typeof saving.startYear === "string"
          ? parseInt(saving.startYear, 10)
          : saving.startYear;
      const sEndYear =
        typeof saving.endYear === "string"
          ? parseInt(saving.endYear, 10)
          : saving.endYear;

      // 구매로 처리: 시작년도에 현재 보유 금액 차감
      if (year === sStartYear && saving.treatAsInitialPurchase) {
        const currentAmount = Number(saving.currentAmount) || 0;
        if (currentAmount > 0) {
          totalSavings += currentAmount;

          // 저축 구매 상세 정보 추가
          savingPurchases.push({
            title: saving.title,
            amount: currentAmount,
          });

          addNegative(
            `${saving.title} | 추가`,
            currentAmount,
            "저축 구매",
            `saving-purchase-${saving.id || saving.title}`
          );
        }
      }

      if (year >= sStartYear && year <= sEndYear) {
        // 종료년도 연말까지 적립 (연말 기준)
        const yearsElapsed = year - sStartYear;
        const yearlyGrowthRate = saving.yearlyGrowthRate || 0; // 이미 소수로 저장됨

        if (saving.frequency === "one_time") {
          // 일회성 저축: 시작년도에만 현금흐름에 반영
          if (year === saving.startYear) {
            totalSavings += saving.amount;

            // 저축 적립 상세 정보 추가
            savingContributions.push({
              title: saving.title,
              amount: saving.amount,
            });

            addNegative(
              `${saving.title} | 적립`,
              saving.amount,
              "저축 적립",
              `saving-contrib-${saving.id || saving.title}`
            );
          }
        } else {
          // 월간/연간 저축
          const monthlyAmount =
            saving.frequency === "monthly" ? saving.amount : saving.amount / 12;

          // 년간 저축 상승률 적용 (월간 금액에 년간 상승률을 적용)
          const adjustedMonthlyAmount =
            monthlyAmount * Math.pow(1 + yearlyGrowthRate, yearsElapsed);
          const yearlyAmount = adjustedMonthlyAmount * 12;

          totalSavings += yearlyAmount;

          // 저축 적립 상세 정보 추가
          savingContributions.push({
            title: saving.title,
            amount: yearlyAmount,
          });

          addNegative(
            `${saving.title} | 적립`,
            yearlyAmount,
            "저축 적립",
            `saving-contrib-${saving.id || saving.title}`
          );
        }
      }

      if (year === sEndYear) {
        // 종료년도: 종료년도까지 수익률 계산하고 현금흐름에 추가
        const yearsElapsed = sEndYear - sStartYear;
        const interestRate = saving.interestRate || 0;
        const yearlyGrowthRate = saving.yearlyGrowthRate || 0;

        let finalAmount = 0;
        const currentAmount = Number(saving.currentAmount) || 0; // 현재 보유 금액 포함

        // 잉여 현금 투자 금액 계산 (년도별로 수익률 적용)
        let totalInvestedValue = 0;
        let totalInvestedAmount = 0;
        if (savingInvestments[saving.id]) {
          Object.keys(savingInvestments[saving.id]).forEach((investYear) => {
            const investAmount = savingInvestments[saving.id][investYear];
            const yearsFromInvestment = sEndYear - parseInt(investYear);
            // 투자한 해의 다음 해부터 수익률 적용 (연말 투자이므로 투자한 해는 수익률 X)
            const investmentValue =
              investAmount * Math.pow(1 + interestRate, yearsFromInvestment);
            totalInvestedValue += investmentValue;
            totalInvestedAmount += investAmount;
          });
        }

        if (saving.frequency === "one_time") {
          // 일회성 저축: 시작년도에 원금, 다음 해부터 수익률 적용
          // 예: 2025-2030이라면 5년치 이자 (2026~2030)
          finalAmount =
            (currentAmount + (Number(saving.amount) || 0)) *
              Math.pow(1 + interestRate, yearsElapsed) +
            totalInvestedValue;
        } else {
          // 월간/연간 저축: 각 년도에 적립, 다음 해부터 수익률 적용
          const monthlyAmount =
            saving.frequency === "monthly" ? saving.amount : saving.amount / 12;

          let accumulated = currentAmount;
          for (let i = 0; i <= yearsElapsed; i++) {
            const adjustedMonthlyAmount =
              monthlyAmount * Math.pow(1 + yearlyGrowthRate, i);
            const yearlyAmount = adjustedMonthlyAmount * 12;

            if (i === 0) {
              // 시작년도: 적립금만 (수익률 X)
              accumulated = accumulated + yearlyAmount;
            } else {
              // 다음 해부터: 작년 말 잔액에 수익률 + 올해 적립금
              accumulated = accumulated * (1 + interestRate) + yearlyAmount;
            }
          }
          // 투자 금액은 년도별로 수익률 계산하여 합산
          finalAmount = accumulated + totalInvestedValue;
        }

        if (totalInvestedAmount > 0) {
          console.log(
            `${year}년: ${saving.title} 만기 - 원금+이자: ${
              Math.round((finalAmount - totalInvestedValue) * 100) / 100
            }만원, 투자 원금: ${totalInvestedAmount}만원, 투자 수익: ${
              Math.round((totalInvestedValue - totalInvestedAmount) * 100) / 100
            }만원, 총: ${Math.round(finalAmount * 100) / 100}만원`
          );
        }

        // 저축 만료 수입에 추가 (전액 수령 - 양도세 차감 전)
        totalSavingMaturity += finalAmount;

        // 저축 만료 상세 정보 추가
        savingMaturities.push({
          title: saving.title,
          amount: finalAmount,
        });

        addPositive(
          `${saving.title} | 수령`,
          finalAmount,
          "저축 수령",
          `saving-maturity-${saving.id || saving.title}`
        );

        // 양도세 계산 (종료년도에 바로 처리)
        // 간단 방식: 수령액에 대해 양도세율만큼 세금 납부
        const taxRate = saving.capitalGainsTaxRate || 0;
        if (taxRate > 0 && finalAmount > 0) {
          // 양도세 = 수령액 × 세율
          const capitalGainsTax = finalAmount * taxRate;

          if (capitalGainsTax > 0) {
            // 소수점이 있으면 소수점 첫째 자리까지 표시
            const taxRatePercent = taxRate * 100;
            const taxRateFormatted =
              taxRatePercent % 1 !== 0
                ? taxRatePercent.toFixed(1)
                : Math.floor(taxRatePercent);

            totalCapitalGainsTax += capitalGainsTax;

            // capitalGainsTaxes 배열에 추가 (툴팁 표시용)
            capitalGainsTaxes.push({
              title: `${saving.title} | 양도세 ${taxRateFormatted}%`,
              amount: capitalGainsTax,
            });

            addNegative(
              `${saving.title} | 양도세 ${taxRateFormatted}%`,
              capitalGainsTax,
              "양도세",
              `saving-tax-${saving.id || saving.title}`
            );
          }
        }
      }
    });

    // 수익형 저축: 매년 현금 수입 발생 (자산 가치에 대한 수익률)
    savings.forEach((saving) => {
      const sStartYear =
        typeof saving.startYear === "string"
          ? parseInt(saving.startYear, 10)
          : saving.startYear;
      const sEndYear =
        typeof saving.endYear === "string"
          ? parseInt(saving.endYear, 10)
          : saving.endYear;

      if (
        saving.savingType === "income" &&
        saving.incomeRate > 0 &&
        year > sStartYear &&
        year <= sEndYear
      ) {
        // 연말 기준: 수익은 시작 다음 해부터 종료년도 연말까지 발생
        // 전년도 말 저축 자산 가치 계산
        const yearsElapsed = year - sStartYear;
        const interestRate = saving.interestRate || 0;
        const yearlyGrowthRate = saving.yearlyGrowthRate || 0;

        let previousYearEndValue = 0;
        const currentAmount = Number(saving.currentAmount) || 0;

        if (saving.frequency === "one_time") {
          // 일회성 저축: 원금 + 수익률 복리
          previousYearEndValue =
            (currentAmount + (Number(saving.amount) || 0)) *
            Math.pow(1 + interestRate, yearsElapsed - 1);
        } else {
          // 월간/연간 저축: 각 년도 적립 + 수익률 복리
          const monthlyAmount =
            saving.frequency === "monthly" ? saving.amount : saving.amount / 12;

          let accumulated = currentAmount;
          for (let i = 0; i < yearsElapsed; i++) {
            const adjustedMonthlyAmount =
              monthlyAmount * Math.pow(1 + yearlyGrowthRate, i);
            const yearlyAmount = adjustedMonthlyAmount * 12;

            if (i === 0) {
              accumulated = accumulated + yearlyAmount;
            } else {
              accumulated = accumulated * (1 + interestRate) + yearlyAmount;
            }
          }
          previousYearEndValue = accumulated;
        }

        // ⚠️ 중요: 잉여 현금 투자 금액도 배당/이자 계산에 포함
        // 전년도까지 투자한 금액에 대한 가치 계산 (전년도 말 기준)
        let investedValue = 0;
        if (savingInvestments[saving.id]) {
          Object.keys(savingInvestments[saving.id]).forEach((investYear) => {
            const investYearNum = parseInt(investYear);
            if (investYearNum < year) {
              // 전년도까지 투자한 금액만 포함
              const investAmount = savingInvestments[saving.id][investYear];
              const yearsFromInvestment = year - investYearNum - 1; // 전년도 말 기준
              // 투자한 해의 다음 해부터 수익률 적용
              const investmentValue =
                investAmount * Math.pow(1 + interestRate, yearsFromInvestment);
              investedValue += investmentValue;
            }
          });
        }

        // 전년도 말 총 자산 가치 = 정기 적립 자산 + 잉여 현금 투자 자산
        const totalPreviousYearEndValue = previousYearEndValue + investedValue;

        // 매년 수익 = 전년도 말 총 자산 가치 * 수익률
        const yearlyIncome = totalPreviousYearEndValue * saving.incomeRate;
        if (yearlyIncome > 0) {
          totalSavingIncome += yearlyIncome; // 저축 수익 합계에 추가

          // 저축 수익 상세 정보 추가 (배당/이자)
          savingIncomes.push({
            title: saving.title,
            amount: yearlyIncome,
          });

          addPositive(
            `${saving.title} | 배당/이자`,
            yearlyIncome,
            "저축 수익",
            `saving-income-${saving.id || saving.title}`
          );
        }
      }
    });

    // 연금 계산
    pensions.forEach((pension) => {
      if (pension.type === "national") {
        // 국민연금: 수령 기간 동안 현금흐름에 추가
        if (year >= pension.startYear && year <= pension.endYear) {
          const yearsElapsed = year - pension.startYear;
          const inflationRate = (pension.inflationRate || 2.5) / 100; // 물가상승률
          const adjustedAmount =
            pension.monthlyAmount *
            12 *
            Math.pow(1 + inflationRate, yearsElapsed);
          totalPension += adjustedAmount;
          addPositive(
            `${pension.title} | 수령`,
            adjustedAmount,
            "국민연금",
            `pension-national-${pension.id || pension.title}`
          );
        }
      } else {
        // 퇴직연금/개인연금: PMT 방식으로 수령
        const paymentStartYear = pension.paymentStartYear;
        const paymentYears = pension.paymentYears || 10; // 수령 기간(년)
        const paymentEndYear = paymentStartYear + paymentYears - 1; // 종료년도 계산

        // 적립/수령 기간 처리
        // 추가 적립 안함인 경우 적립 기간 건너뛰기 (즉시 수령 처리)
        // 적립 종료년도 = 수령 시작년도인 경우 수령 로직 우선 (year < paymentStartYear)
        if (
          !pension.noAdditionalContribution &&
          year >= pension.contributionStartYear &&
          year <= pension.contributionEndYear &&
          year < paymentStartYear
        ) {
          // 적립 기간 처리
          // 퇴직금/DB만 추가 적립 시 현금이 빠져나감 (실제 내 현금을 사용)
          if (
            pension.type === "severance" &&
            pension.contributionAmount &&
            pension.contributionAmount > 0
          ) {
            const monthlyAmount =
              pension.contributionFrequency === "monthly"
                ? pension.contributionAmount
                : pension.contributionAmount / 12;
            const yearlyContribution = monthlyAmount * 12;
            // 적립액을 음수로 현금흐름에 반영 (현금이 빠져나감)
            totalExpense += yearlyContribution;
            addNegative(
              `${pension.title} | 추가 적립`,
              yearlyContribution,
              "퇴직금 IRP 적립",
              `pension-contrib-${pension.id || pension.title}`
            );
          }
          // 개인연금은 적립 시 현금이 빠져나감
          else if (pension.type === "personal") {
            const monthlyAmount =
              pension.contributionFrequency === "monthly"
                ? pension.contributionAmount
                : pension.contributionAmount / 12;
            const yearlyContribution = monthlyAmount * 12;
            // 적립액을 음수로 현금흐름에 반영 (현금이 빠져나감)
            totalExpense += yearlyContribution;
            addNegative(
              `${pension.title} | 적립`,
              yearlyContribution,
              "연금 적립",
              `pension-contrib-${pension.id || pension.title}`
            );
          }
          // 퇴직연금은 적립 시 현금이 빠져나가지 않음 (회사에서 적립)
        } else if (year === paymentStartYear) {
          // PMT 방식: 수령 시작년도에 PMT 금액 계산 (한 번만)
          const returnRate = pension.returnRate / 100;

          // 적립 완료 시점의 총 금액 계산
          let totalAccumulated = pension.currentAmount || 0;

          // 적립 기간 동안 현재 보유액 + 추가 적립액에 수익률 적용 (연말 기준)
          const contributionYears =
            pension.contributionEndYear - pension.contributionStartYear + 1;

          // 추가 적립 금액 계산 (있는 경우만)
          let yearlyContribution = 0;
          if (
            !pension.noAdditionalContribution &&
            pension.contributionAmount &&
            pension.contributionAmount > 0
          ) {
            const monthlyAmount =
              pension.contributionFrequency === "monthly"
                ? pension.contributionAmount
                : pension.contributionAmount / 12;
            yearlyContribution = monthlyAmount * 12;
          }

          // 적립 기간 동안 수익률 적용 (추가 적립 여부와 무관하게 현재 보유액은 수익률 적용)
          for (let i = 0; i < contributionYears; i++) {
            if (i === 0) {
              // 시작년도: 현재 보유액 + 적립금 (수익률 X)
              totalAccumulated = totalAccumulated + yearlyContribution;
            } else {
              // 다음 해부터: 수익률 + 적립금
              totalAccumulated =
                totalAccumulated * (1 + returnRate) + yearlyContribution;
            }
          }

          // 적립 종료 후 ~ 수령 시작 전 공백 기간의 수익률 적용
          const gapYears = paymentStartYear - pension.contributionEndYear - 1;
          for (let i = 0; i < gapYears; i++) {
            totalAccumulated = totalAccumulated * (1 + returnRate);
          }

          // 잉여 현금 투자 금액 추가 (년도별로 수익률 적용)
          let totalInvestedValue = 0;
          if (savingInvestments[pension.id]) {
            Object.keys(savingInvestments[pension.id]).forEach((investYear) => {
              const investAmount = savingInvestments[pension.id][investYear];
              const yearsFromInvestment =
                paymentStartYear - parseInt(investYear);
              // 투자한 해의 다음 해부터 수익률 적용 (연말 투자이므로 투자한 해는 수익률 X)
              const investmentValue =
                investAmount * Math.pow(1 + returnRate, yearsFromInvestment);
              totalInvestedValue += investmentValue;
            });
          }
          totalAccumulated += totalInvestedValue;

          // 즉시 수령 판단 (수익률 적용 안 함):
          // 적립 종료년도 = 수령 시작년도이고, 추가 적립이 있는 경우만 (연말 기준, 같은 해에 적립하고 바로 수령)
          // 단, 퇴직금은 이미 보유한 금액이므로 항상 수익률 적용
          // 기 보유 금액만 있는 경우(추가 적립 없음)는 일반 수령으로 처리 (수익률 적용)
          const hasAdditionalContribution =
            !pension.noAdditionalContribution && yearlyContribution > 0;
          const isImmediateWithdrawal =
            pension.type !== "severance" &&
            pension.contributionEndYear === paymentStartYear &&
            hasAdditionalContribution;

          // PMT 계산: 매년 동일한 금액 수령 (한 번만 계산하고 저장)
          if (isImmediateWithdrawal) {
            // 즉시 수령: 수익률 적용 없이 그대로 수령
            pension._cashflowPMT = calculatePMT(
              totalAccumulated,
              0, // 수익률 0
              paymentYears
            );
            pension._cashflowIsImmediateWithdrawal = true; // 저장
          } else {
            // 일반 수령: 수익률 적용
            pension._cashflowPMT = calculatePMT(
              totalAccumulated,
              returnRate,
              paymentYears
            );
            pension._cashflowIsImmediateWithdrawal = false; // 저장
          }

          totalPension += pension._cashflowPMT;

          const pensionTypeLabel =
            pension.type === "retirement"
              ? "퇴직연금"
              : pension.type === "severance"
              ? "퇴직금 IRP"
              : "개인연금";

          addPositive(
            `${pension.title} | 수령`,
            pension._cashflowPMT,
            pensionTypeLabel,
            `pension-payment-${pension.id || pension.title}`
          );
        } else if (year > paymentStartYear && year <= paymentEndYear) {
          // PMT 방식: 수령 기간 중 (이미 계산된 PMT 사용)
          const yearlyPayment = pension._cashflowPMT || 0;

          totalPension += yearlyPayment;

          const pensionTypeLabel =
            pension.type === "retirement"
              ? "퇴직연금"
              : pension.type === "severance"
              ? "퇴직금 IRP"
              : "개인연금";

          addPositive(
            `${pension.title} | 수령`,
            yearlyPayment,
            pensionTypeLabel,
            `pension-payment-${pension.id || pension.title}`
          );
        }
        // PMT 방식에서는 year <= paymentEndYear 조건에서 모든 수령 처리 완료
      }
    });

    // 부동산 관련 계산
    let totalRentalIncome = 0; // 임대 소득
    let totalRealEstatePension = 0; // 주택연금 수령액
    let totalRealEstateSale = 0; // 부동산 매각 수입
    let totalRealEstatePurchase = 0; // 부동산 구매 비용
    let totalRealEstateTax = 0; // 부동산 취득세
    // totalCapitalGainsTax와 capitalGainsTaxes는 이미 위에서 선언됨 (저축 + 부동산 공통 사용)
    const realEstatePurchases = []; // 부동산 구매 상세 정보
    const realEstateSales = []; // 부동산 매각 상세 정보
    const realEstateTaxes = []; // 부동산 취득세 상세 정보

    const normalizeYear = (value) => {
      if (value === null || value === undefined || value === "") {
        return undefined;
      }
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : undefined;
      }
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    realEstates.forEach((realEstate) => {
      const startYear = normalizeYear(realEstate.startYear);
      const endYear = normalizeYear(realEstate.endYear);
      const rentalStartYear = normalizeYear(realEstate.rentalIncomeStartYear);
      const rentalEndYear = normalizeYear(realEstate.rentalIncomeEndYear);
      const pensionStartYear = normalizeYear(realEstate.pensionStartYear);
      const pensionEndYear = normalizeYear(realEstate.pensionEndYear);
      const purchaseAmount = Number(realEstate.currentValue) || 0;
      const rentalMonthly = Number(realEstate.monthlyRentalIncome) || 0;
      const pensionMonthly = Number(realEstate.monthlyPensionAmount) || 0;

      // 부동산 구매 비용 계산 (첫 년도에 현금으로 차감)
      if (
        realEstate.isPurchase &&
        Number.isFinite(startYear) &&
        year === startYear &&
        purchaseAmount > 0
      ) {
        totalRealEstatePurchase += purchaseAmount;
        realEstatePurchases.push({
          title: realEstate.title,
          amount: purchaseAmount,
        });
        addNegative(
          `${realEstate.title} | 추가`,
          purchaseAmount,
          "부동산 구매",
          `realestate-purchase-${realEstate.id || realEstate.title}`
        );

        // 부동산 취득세 계산 및 적용
        const acquisitionTax = calculateAcquisitionTax(purchaseAmount);
        totalRealEstateTax += acquisitionTax;
        realEstateTaxes.push({
          title: realEstate.title,
          amount: acquisitionTax,
          taxRate:
            purchaseAmount <= 60000
              ? "1.1%"
              : purchaseAmount <= 90000
              ? "2.2%"
              : "3.3%",
        });
        addNegative(
          `${realEstate.title} | 취득세`,
          acquisitionTax,
          "부동산 취득세",
          `realestate-tax-${realEstate.id || realEstate.title}`
        );
      }

      // 임대 소득 계산
      if (
        realEstate.hasRentalIncome &&
        Number.isFinite(rentalStartYear) &&
        year >= rentalStartYear &&
        (rentalEndYear === undefined || year <= rentalEndYear) &&
        rentalMonthly > 0
      ) {
        const yearlyRentalIncome = rentalMonthly * 12;
        totalRentalIncome += yearlyRentalIncome;
        addPositive(
          `${realEstate.title} | 임대소득`,
          yearlyRentalIncome,
          "임대소득",
          `realestate-rent-${realEstate.id || realEstate.title}`
        );
      }

      // 주택연금 수령액 계산
      if (
        realEstate.convertToPension &&
        Number.isFinite(pensionStartYear) &&
        year >= pensionStartYear &&
        (pensionEndYear === undefined || year <= pensionEndYear) &&
        pensionMonthly > 0
      ) {
        const yearlyPensionAmount = pensionMonthly * 12;
        totalRealEstatePension += yearlyPensionAmount;
        addPositive(
          `${realEstate.title} | 주택연금`,
          yearlyPensionAmount,
          "주택연금",
          `realestate-pension-${realEstate.id || realEstate.title}`
        );
      }

      // 부동산 매각 수입 계산 (연말 기준: endYear에 매각)
      if (
        Number.isFinite(endYear) &&
        Number.isFinite(startYear) &&
        year === endYear &&
        purchaseAmount > 0
      ) {
        // 부동산 가치에 상승률을 적용한 최종 가치 계산
        const growthRate = (realEstate.growthRate || 0) / 100;
        let finalValue;

        // 주택연금을 받았다면, 연말 기준으로 매년 상승하고 차감
        if (
          realEstate.convertToPension &&
          Number.isFinite(pensionStartYear) &&
          pensionStartYear <= endYear &&
          pensionMonthly > 0
        ) {
          const yearlyPensionAmount = pensionMonthly * 12;

          // 1. 주택연금 시작 전까지 상승
          let currentValue = purchaseAmount;
          for (let y = startYear + 1; y < pensionStartYear; y++) {
            currentValue = currentValue * (1 + growthRate);
          }

          // 2. 주택연금 시작부터 매각 전까지: 매년 상승 후 주택연금 차감
          const actualPensionEndYear = pensionEndYear || endYear;
          for (let y = pensionStartYear; y < endYear; y++) {
            currentValue = currentValue * (1 + growthRate);
            // 주택연금 수령 중이면 차감
            if (y >= pensionStartYear && y <= actualPensionEndYear) {
              currentValue = currentValue - yearlyPensionAmount;
            }
            // 자산이 0 이하가 되면 0으로 설정
            if (currentValue < 0) {
              currentValue = 0;
              break;
            }
          }

          // 3. 매각년도의 상승률 적용
          if (currentValue > 0) {
            currentValue = currentValue * (1 + growthRate);
            // 매각년도에도 주택연금 수령 중이면 차감
            if (
              endYear >= pensionStartYear &&
              endYear <= actualPensionEndYear
            ) {
              currentValue = currentValue - yearlyPensionAmount;
            }
          }

          finalValue = Math.max(0, currentValue);
        } else {
          // 주택연금 없는 경우: 단순 상승률 적용
          const yearsElapsed = endYear - startYear;
          finalValue = purchaseAmount * Math.pow(1 + growthRate, yearsElapsed);
        }

        totalRealEstateSale += finalValue;
        realEstateSales.push({
          title: realEstate.title,
          amount: finalValue,
        });
        addPositive(
          `${realEstate.title} | 수령`,
          finalValue,
          "부동산 수령",
          `realestate-sale-${realEstate.id || realEstate.title}`
        );

        // 거주용 부동산의 경우 양도소득세 계산
        if (realEstate.isResidential) {
          // 취득가액 결정: acquisitionPrice가 있으면 사용, 없으면 currentValue 사용
          const acquisitionPrice = realEstate.acquisitionPrice
            ? Number(realEstate.acquisitionPrice)
            : purchaseAmount;

          // 취득년도 결정: acquisitionYear가 있으면 사용, 없으면 startYear 사용
          const acquisitionYear = realEstate.acquisitionYear
            ? Number(realEstate.acquisitionYear)
            : startYear;

          // 보유기간 계산: 양도년도(endYear) - 취득년도
          const holdingYears = year - acquisitionYear;

          // 양도소득세 계산 (양도가액 = 매각 시 최종 가치)
          const { totalTax } = calculateCapitalGainsTax(
            finalValue,
            acquisitionPrice,
            holdingYears
          );

          // 양도소득세가 있으면 차감
          if (totalTax > 0) {
            totalCapitalGainsTax += totalTax;
            capitalGainsTaxes.push({
              title: realEstate.title,
              amount: totalTax,
              salePrice: finalValue,
              acquisitionPrice: acquisitionPrice,
              holdingYears: holdingYears,
            });
            addNegative(
              `${realEstate.title} | 양도세`,
              totalTax,
              "양도소득세",
              `realestate-capitalgains-${realEstate.id || realEstate.title}`
            );
          }
        }
      }
    });

    // 자산 수익 계산 (수익형 자산의 이자/배당)
    let totalAssetIncome = 0;
    let totalAssetSale = 0; // 자산 매각 수입
    let totalAssetPurchase = 0; // 자산 구매 비용
    const assetPurchases = []; // 자산 구매 상세 정보
    const assetSales = []; // 자산 매각 상세 정보

    assets.forEach((asset) => {
      // 년도 데이터 타입 확인 및 변환
      const startYear =
        typeof asset.startYear === "string"
          ? parseInt(asset.startYear)
          : asset.startYear;
      const endYear =
        typeof asset.endYear === "string"
          ? parseInt(asset.endYear)
          : asset.endYear;

      // 자산 구매 비용 계산 (첫 년도에 현금으로 차감)
      if (asset.isPurchase && year === startYear) {
        totalAssetPurchase += asset.currentValue;
        assetPurchases.push({
          title: asset.title,
          amount: asset.currentValue,
        });
        addNegative(
          `${asset.title} | 추가`,
          asset.currentValue,
          "자산 구매",
          `asset-purchase-${asset.id || asset.title}`
        );
      }

      if (
        asset.assetType === "income" &&
        asset.incomeRate > 0 &&
        year > startYear &&
        year < endYear
      ) {
        // 연말 기준: 수익은 시작 다음 해부터 종료 전까지 발생
        // 전년도 말 자산 가치 = currentValue * (1 + growthRate)^(year - startYear - 1)
        // 수익 = 전년도 말 자산 가치 * 수익률
        const yearsElapsed = year - startYear; // 시작부터 현재 해까지 경과 년수
        const previousYearEndValue =
          asset.currentValue * Math.pow(1 + asset.growthRate, yearsElapsed - 1);
        const yearlyIncome = previousYearEndValue * asset.incomeRate;
        totalAssetIncome += yearlyIncome;
        addPositive(
          `${asset.title} | 수령`,
          yearlyIncome,
          "자산 수령",
          `asset-income-${asset.id || asset.title}`
        );
      }

      // 자산 매각 수입 계산 (종료년도에 매각)
      if (year === endYear) {
        // 자산 가치에 상승률을 적용한 최종 가치 계산
        // 시작년도: 원금, 다음 해부터 상승률 적용
        const yearsElapsed = endYear - startYear;
        const growthRate = asset.growthRate || 0;
        const finalValue =
          asset.currentValue * Math.pow(1 + growthRate, yearsElapsed);
        totalAssetSale += finalValue;
        assetSales.push({
          title: asset.title,
          amount: finalValue,
        });
        addPositive(
          `${asset.title} | 수령`,
          finalValue,
          "자산 수령",
          `asset-sale-${asset.id || asset.title}`
        );

        // 양도세 계산 (종료년도에 바로 처리)
        const taxRate = asset.capitalGainsTaxRate || 0;
        if (taxRate > 0) {
          // 양도소득 = 최종가치 - 초기가치
          const capitalGain = Math.max(0, finalValue - asset.currentValue);
          const capitalGainsTax = capitalGain * taxRate;

          // 양도세를 종료년도에 바로 지출 처리
          if (capitalGainsTax > 0) {
            // 소수점이 있으면 소수점 첫째 자리까지 표시
            const taxRatePercent = taxRate * 100;
            const taxRateFormatted =
              taxRatePercent % 1 !== 0
                ? taxRatePercent.toFixed(1)
                : Math.floor(taxRatePercent);

            totalCapitalGainsTax += capitalGainsTax;

            // capitalGainsTaxes 배열에 추가 (툴팁 표시용)
            capitalGainsTaxes.push({
              title: `${asset.title} | 양도세 ${taxRateFormatted}%`,
              amount: capitalGainsTax,
            });

            addNegative(
              `${asset.title} | 양도세 ${taxRateFormatted}%`,
              capitalGainsTax,
              "양도세",
              `asset-tax-${asset.id || asset.title}`
            );
          }
        }
      }
    });

    // 현금흐름 = 소득 - 지출 - 저축 + 연금 + 임대소득 + 주택연금 + 자산수익 + 부동산매각 + 자산매각 + 저축만료 + 저축수익 + 대출 현금 유입 - 부채이자 - 부채원금상환 - 자산구매 - 부동산구매 - 부동산취득세 - 양도소득세 (각 년도별 순현금흐름)
    let netCashflow =
      totalIncome -
      totalExpense -
      totalSavings +
      totalPension +
      totalRentalIncome +
      totalRealEstatePension +
      totalAssetIncome +
      totalRealEstateSale +
      totalAssetSale +
      totalDebtInjection +
      totalSavingMaturity +
      totalSavingIncome -
      totalDebtInterest -
      totalDebtPrincipal -
      totalAssetPurchase -
      totalRealEstatePurchase -
      totalRealEstateTax -
      totalCapitalGainsTax;

    // 잉여 현금 투자 규칙 처리 (현금흐름이 양수인 경우)
    // ⚠️ 중요: 잉여 현금 투자는 지출이 아니라 자산 이동이므로 현금 흐름에 영향 없음
    // 자산 시뮬레이션에서만 처리 (1869-1908번 줄)

    if (netCashflow > 0 && profileData.cashflowInvestmentRules) {
      const investmentRule = profileData.cashflowInvestmentRules[year];

      if (investmentRule && investmentRule.allocations) {
        // 각 배분 항목에 대해 투자 금액 계산 및 누적
        investmentRule.allocations.forEach((allocation) => {
          if (allocation.ratio <= 0) return;

          const investAmount =
            Math.round(netCashflow * (allocation.ratio / 100) * 100) / 100;

          if (investAmount > 0 && allocation.targetId) {
            if (allocation.targetType === "saving") {
              // 저축 상품에 대한 년도별 투자 금액 기록만 함 (현금 흐름에는 반영 안 함)
              if (!savingInvestments[allocation.targetId]) {
                savingInvestments[allocation.targetId] = {};
              }
              if (!savingInvestments[allocation.targetId][year]) {
                savingInvestments[allocation.targetId][year] = 0;
              }
              savingInvestments[allocation.targetId][year] =
                Math.round(
                  (savingInvestments[allocation.targetId][year] +
                    investAmount) *
                    100
                ) / 100;
            } else if (allocation.targetType === "pension") {
              // 연금 상품에 대한 년도별 투자 금액 기록 (현금 흐름에는 반영 안 함)
              // 연금은 savingInvestments 대신 별도 추적이 필요하지만,
              // 현재는 저축과 동일하게 처리 (추후 개선 가능)
              if (!savingInvestments[allocation.targetId]) {
                savingInvestments[allocation.targetId] = {};
              }
              if (!savingInvestments[allocation.targetId][year]) {
                savingInvestments[allocation.targetId][year] = 0;
              }
              savingInvestments[allocation.targetId][year] =
                Math.round(
                  (savingInvestments[allocation.targetId][year] +
                    investAmount) *
                    100
                ) / 100;
            }
          }
        });
      }
    }

    // ⚠️ 투자 금액은 savingContributions에 포함하지 않음 (지출이 아니므로)
    const allSavingContributions = [...savingContributions];

    cashflowData.push({
      year,
      age,
      amount: netCashflow,
      income: totalIncome + totalSavingIncome, // 저축 수익을 총 수입에 포함
      expense: totalExpense,
      savings: totalSavings,
      pension: totalPension,
      rentalIncome: totalRentalIncome,
      realEstatePension: totalRealEstatePension,
      assetIncome: totalAssetIncome,
      realEstateSale: totalRealEstateSale,
      assetSale: totalAssetSale,
      debtInjection: totalDebtInjection,
      savingMaturity: totalSavingMaturity,
      savingMaturities: savingMaturities, // 저축 만료 상세 정보
      savingIncomes: savingIncomes, // 저축 수익 상세 정보 (배당/이자)
      savingContributions: allSavingContributions, // 저축 적립 상세 정보 (투자로 인한 적립 포함)
      debtInterest: totalDebtInterest,
      debtPrincipal: totalDebtPrincipal,
      debtInterests: debtInterestDetails,
      debtPrincipals: debtPrincipalDetails,
      realEstateTax: totalRealEstateTax, // 부동산 취득세
      realEstateTaxes: realEstateTaxes, // 부동산 취득세 상세 정보
      capitalGainsTax: totalCapitalGainsTax, // 부동산 양도소득세
      capitalGainsTaxes: capitalGainsTaxes, // 부동산 양도소득세 상세 정보
      // 구매와 매각 상세 정보 추가
      savingPurchases: savingPurchases, // 저축 구매 상세 정보
      assetPurchases: assetPurchases,
      realEstatePurchases: realEstatePurchases,
      debtInjections: debtInjections,
      assetSales: assetSales,
      realEstateSales: realEstateSales,
      breakdown: {
        positives: positiveBreakdown,
        negatives: negativeBreakdown,
      },
    });
  }

  return cashflowData;
}

/**
 * 자산 시뮬레이션 계산
 */
export function calculateAssetSimulation(
  profileData,
  incomes = [],
  expenses = [],
  savings = [],
  pensions = [],
  realEstates = [],
  assets = [],
  cashflowData = [],
  debts = []
) {
  // 현재는 더미 데이터 반환
  const currentYear = new Date().getFullYear();
  const startAge = calculateKoreanAge(profileData.birthYear, currentYear); // 만 나이로 실시간 계산
  const deathAge = 90;
  const simulationYears = deathAge - startAge + 1;

  const assetData = [];

  // 현재 현금 (프로필에서 가져옴)
  let currentCash = profileData.currentCash || 0;

  // 저축별 누적 자산 (ID별로 분리)
  const savingsById = {};

  // 저축 데이터가 없어도 자산과 부채만으로 시뮬레이션 생성 가능
  if (savings && Array.isArray(savings) && savings.length > 0) {
    savings.forEach((saving, index) => {
      if (!saving.id) {
        console.error("저축에 ID가 없습니다:", saving);
        return;
      }

      // 년도 데이터 타입 확인 및 변환
      const startYear =
        typeof saving.startYear === "string"
          ? parseInt(saving.startYear)
          : saving.startYear;
      const endYear =
        typeof saving.endYear === "string"
          ? parseInt(saving.endYear)
          : saving.endYear;

      savingsById[saving.id] = {
        amount: 0, // 시작년도 전에는 0, 시작년도에 currentAmount 추가
        currentAmount: saving.currentAmount || 0, // 현재 보유 금액 저장
        startYear: startYear,
        endYear: endYear,
        interestRate:
          saving.interestRate !== undefined && saving.interestRate !== null
            ? saving.interestRate
            : 0.03, // 이자율 (0 허용)
        yearlyGrowthRate:
          saving.yearlyGrowthRate !== undefined &&
          saving.yearlyGrowthRate !== null
            ? saving.yearlyGrowthRate
            : 0, // 년간 저축 상승률 (0 허용)
        frequency: saving.frequency,
        originalAmount: saving.amount,
        title: saving.title, // 제목도 저장
        savingType: saving.savingType || "standard", // "standard" 또는 "income"
        incomeRate:
          saving.incomeRate !== undefined && saving.incomeRate !== null
            ? saving.incomeRate
            : 0, // 수익형 저축의 수익률 (0 허용)
        isActive: false, // 시작년도 전에는 비활성
        totalInvested: 0, // 잉여 현금 투자 누적액 (자산 시뮬레이션에서 추가됨)
      };
    });
  }

  // 은퇴년도 가져오기
  const retirementYear = profileData.retirementYear || currentYear;

  // 연금별 누적 자산 (제목별로 분리)
  const pensionsByTitle = {};
  // 연금별 누적 자산 (ID별로 분리 - 투자 배분용)
  const pensionsById = {};

  pensions.forEach((pension) => {
    if (pension.type !== "national") {
      // 퇴직연금/개인연금만 자산으로 관리

      const isActive = pension.type !== "severance";

      const pensionData = {
        // 퇴직금/DB는 초기 amount를 0으로 설정 (은퇴년도에 currentAmount 설정)
        // 퇴직연금/개인연금은 처음부터 currentAmount 설정
        amount: pension.type === "severance" ? 0 : pension.currentAmount || 0,
        initialAmount: pension.currentAmount || 0, // 원래 보유액 저장
        contributionStartYear: pension.contributionStartYear,
        contributionEndYear: pension.contributionEndYear,
        paymentStartYear: pension.paymentStartYear,
        paymentYears: pension.paymentYears || 10, // 수령 기간(년)
        paymentEndYear:
          pension.paymentStartYear + (pension.paymentYears || 10) - 1, // 종료년도 계산
        returnRate: pension.returnRate !== undefined ? pension.returnRate : 5.0,
        contributionAmount: pension.contributionAmount,
        contributionFrequency: pension.contributionFrequency,
        noAdditionalContribution: pension.noAdditionalContribution || false, // 추가 적립 안함 여부
        type: pension.type, // 연금 타입 저장
        monthlyPayment: 0, // 월 수령액 (적립 종료 후 계산)
        retirementYear: retirementYear, // 은퇴년도 저장
        // 퇴직금/DB는 은퇴년도 전까지 자산 차트에 표시 안함
        // 퇴직연금/개인연금은 처음부터 자산 차트에 표시
        isActive: isActive,
        title: pension.title, // 제목 저장
      };

      pensionsByTitle[pension.title] = pensionData;

      // ID로도 접근 가능하도록 (투자 배분 시 사용)
      if (pension.id) {
        pensionsById[pension.id] = pensionData;
      }
    }
  });

  // 부동산별 자산 (제목별로 분리)
  const realEstatesByTitle = {};
  realEstates.forEach((realEstate) => {
    // 년도 데이터 타입 확인 및 변환
    const startYear =
      typeof realEstate.startYear === "string"
        ? parseInt(realEstate.startYear)
        : realEstate.startYear || currentYear;
    const endYear =
      typeof realEstate.endYear === "string"
        ? parseInt(realEstate.endYear)
        : realEstate.endYear;

    const initialRealEstateValue = realEstate.currentValue || 0;
    realEstatesByTitle[realEstate.title] = {
      amount: initialRealEstateValue, // 현재 가치로 시작
      startYear: startYear,
      endYear: endYear,
      growthRate: realEstate.growthRate || 2.5, // 백분율 그대로 사용
      convertToPension: realEstate.convertToPension || false,
      pensionStartYear: realEstate.pensionStartYear,
      pensionEndYear: realEstate.pensionEndYear,
      monthlyPensionAmount: realEstate.monthlyPensionAmount,
      isPurchase: realEstate.isPurchase || false, // 구매 여부 저장
      isActive: false, // 초기에는 비활성화 (startYear에 활성화)
      _initialValue: initialRealEstateValue, // 초기값 저장
      _pensionBaseValue: 0, // 주택연금 시작 직전 가치 (상승률 적용 기준)
    };
  });

  // 자산별 자산 (제목별로 분리)
  const assetsByTitle = {};
  assets.forEach((asset) => {
    // 년도 데이터 타입 확인 및 변환
    const startYear =
      typeof asset.startYear === "string"
        ? parseInt(asset.startYear)
        : asset.startYear;
    const endYear =
      typeof asset.endYear === "string"
        ? parseInt(asset.endYear)
        : asset.endYear;

    const initialValue = asset.currentValue || 0;
    assetsByTitle[asset.title] = {
      amount: initialValue, // 현재 가치로 시작
      startYear: startYear,
      endYear: endYear,
      growthRate: asset.growthRate || 0, // 이미 소수로 저장됨 (예: 0.0286)
      assetType: asset.assetType || "general", // "general" 또는 "income"
      incomeRate: asset.incomeRate || 0, // 수익형 자산의 수익률
      capitalGainsTaxRate: asset.capitalGainsTaxRate || 0, // 양도세율 저장
      isPurchase: asset.isPurchase || false, // 구매 여부 저장
      isActive: true,
      _initialValue: initialValue, // 초기값 저장
    };
  });

  // 부채별 자산 (제목별로 분리) - 음수로 표시
  const debtsByTitle = {};
  debts.forEach((debt) => {
    // 년도 데이터 타입 확인 및 변환
    const startYear =
      typeof debt.startYear === "string"
        ? parseInt(debt.startYear)
        : debt.startYear;
    const endYear =
      typeof debt.endYear === "string" ? parseInt(debt.endYear) : debt.endYear;

    debtsByTitle[debt.title] = {
      amount: -debt.debtAmount, // 부채는 음수로 표시
      startYear: startYear,
      endYear: endYear,
      debtType: debt.debtType, // "bullet", "equal", "principal", "grace"
      interestRate: debt.interestRate,
      originalAmount: debt.debtAmount,
      gracePeriod: debt.gracePeriod, // 거치기간 추가 (거치식 상환에 필요)
      isActive: true,
    };
  });

  // detailedData 배열 추가 (년도별 breakdown 정보)
  const detailedData = [];

  // 카테고리별 색상 매핑 함수
  const getCategoryColor = (key, value = 0) => {
    // 현금
    if (key === "현금") {
      return value < 0 ? "#ef4444" : "#10b981";
    }
    // 연금
    if (
      key.includes("연금") ||
      key.includes("퇴직") ||
      key.includes("국민연금")
    ) {
      const pensionColors = [
        "#fbbf24",
        "#f59e0b",
        "#eab308",
        "#d97706",
        "#ca8a04",
      ];
      const hash = key.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return pensionColors[Math.abs(hash) % pensionColors.length];
    }
    // 부채
    if (
      key.includes("부채") ||
      key.includes("대출") ||
      key.includes("빚") ||
      value < 0
    ) {
      const debtColors = [
        "#111827",
        "#1f2937",
        "#374151",
        "#4b5563",
        "#6b7280",
      ];
      const hash = key.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return debtColors[Math.abs(hash) % debtColors.length];
    }
    // 저축/투자
    if (
      key.includes("저축") ||
      key.includes("투자") ||
      key.includes("예금") ||
      key.includes("적금")
    ) {
      const savingColors = [
        "#3b82f6",
        "#2563eb",
        "#1d4ed8",
        "#06b6d4",
        "#0891b2",
      ];
      const hash = key.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return savingColors[Math.abs(hash) % savingColors.length];
    }
    // 부동산
    if (
      key.includes("부동산") ||
      key.includes("아파트") ||
      key.includes("자택") ||
      key.includes("임대")
    ) {
      const realEstateColors = [
        "#8b5cf6",
        "#7c3aed",
        "#6d28d9",
        "#5b21b6",
        "#a78bfa",
      ];
      const hash = key.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return realEstateColors[Math.abs(hash) % realEstateColors.length];
    }
    // 일반 자산
    const assetColors = ["#3b82f6", "#06b6d4", "#8b5cf6", "#6366f1", "#0ea5e9"];
    const hash = key.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return assetColors[Math.abs(hash) % assetColors.length];
  };

  for (let i = 0; i < simulationYears; i++) {
    const year = currentYear + i;
    const age = startAge + i;

    // 해당 연도의 현금 흐름 가져오기
    const yearCashflow = cashflowData.find((cf) => cf.year === year);
    const netCashflow = yearCashflow ? yearCashflow.amount : 0;

    // 현금 흐름을 현재 현금에 적용 (부동소수점 오류 방지)
    const previousCash = currentCash;
    currentCash = Math.round((currentCash + netCashflow) * 100) / 100;

    // 해당 연도의 저축 계산 (ID별로)
    // ⚠️ 중요: 저축 계산(수익률 적용)을 먼저 실행하고, 이후에 잉여 현금 투자를 처리해야
    //         연말에 투자한 금액이 해당 년도 수익률을 받지 않음 (연말 기준)
    Object.keys(savingsById).forEach((id) => {
      const saving = savingsById[id];

      // 시작년도 이전: 자산 차트에 표시 안함
      if (year < saving.startYear) {
        return;
      }

      // endYear 이상이면 저축을 비활성화 (자산 차트에서 제거)
      // 종료년도부터는 현금으로 전환되므로 자산에서 제거
      if (year >= saving.endYear) {
        // 현금흐름 시뮬레이션에서 이미 계산된 저축 만료 금액이 netCashflow에 포함되어 있으므로
        // 여기서 추가로 currentCash에 더하지 않음 (중복 방지)

        // 저축을 즉시 비활성화 (자산 차트에서 제거됨)
        saving.isActive = false;
        saving.amount = 0; // 전환 후 금액 초기화

        return; // 전환 후 더 이상 처리하지 않음
      }

      // 시작년도: 활성화 및 현재 보유액 설정
      if (year === saving.startYear && !saving.isActive) {
        saving.isActive = true;
        saving.amount = saving.currentAmount; // 현재 보유액으로 시작
      }

      // 비활성 상태면 건너뛰기
      if (!saving.isActive) {
        return;
      }

      if (year >= saving.startYear && year < saving.endYear) {
        // 저축 기간 중 (endYear 전까지만 - 종료년도에는 자산에서 제거)
        const yearsElapsed = year - saving.startYear;
        const interestRate = saving.interestRate; // 이미 소수로 저장됨
        const yearlyGrowthRate = saving.yearlyGrowthRate; // 이미 소수로 저장됨

        if (saving.frequency === "one_time") {
          // 일회성 저축 (정기예금 등)
          if (year === saving.startYear) {
            // 시작년도: 현재 보유액 + 원금 (수익률 적용 X)
            saving.amount = saving.amount + saving.originalAmount;
          } else if (year > saving.startYear) {
            // 다음 해부터 수익률 적용
            saving.amount = saving.amount * (1 + interestRate);
          }
        } else {
          // 월간/연간 저축
          const monthlyAmount =
            saving.frequency === "monthly"
              ? saving.originalAmount
              : saving.originalAmount / 12;

          // 년간 저축 상승률 적용
          const adjustedMonthlyAmount =
            monthlyAmount * Math.pow(1 + yearlyGrowthRate, yearsElapsed);
          const yearlyAmount = adjustedMonthlyAmount * 12;

          if (year === saving.startYear) {
            // 시작년도: 현재 보유액 + 적립금 (수익률 적용 X)
            saving.amount = saving.amount + yearlyAmount;
          } else {
            // 다음 해부터: 작년 말 잔액에 수익률 적용 + 올해 적립금
            saving.amount = saving.amount * (1 + interestRate) + yearlyAmount;
          }
        }
      }
    });

    // 잉여 현금 자동 투자 처리 (고급 버전: 여러 자산에 비율로 분배)
    // 저축 계산 이후 실행 - 연말 기준으로 이번 해 수익률 적용 X
    const investmentInfo = {}; // 투자 정보 저장 (자산별)
    if (netCashflow > 0 && profileData.cashflowInvestmentRules) {
      const investmentRule = profileData.cashflowInvestmentRules[year];

      if (investmentRule && investmentRule.allocations) {
        // 각 배분 항목에 대해 투자 실행
        investmentRule.allocations.forEach((allocation) => {
          if (allocation.ratio <= 0) return;

          const investAmount =
            Math.round(netCashflow * (allocation.ratio / 100) * 100) / 100;

          if (investAmount > 0) {
            if (allocation.targetType === "saving" && allocation.targetId) {
              // 저축 상품에 투자
              const targetSaving = savingsById[allocation.targetId];

              if (targetSaving && targetSaving.isActive) {
                // 저축 자산에 투자 금액 추가 (연말 투자이므로 이번 해 수익률 적용 안 됨)
                targetSaving.amount =
                  Math.round((targetSaving.amount + investAmount) * 100) / 100;

                // 이번 해 투자 금액 누적 (현금흐름 시뮬레이션에서 이미 계산하므로 여기서는 표시용만)
                targetSaving.totalInvested =
                  Math.round(
                    (targetSaving.totalInvested + investAmount) * 100
                  ) / 100;

                // 현금에서 투자 금액 차감
                currentCash =
                  Math.round((currentCash - investAmount) * 100) / 100;

                // 투자 정보 저장 (자산 차트에서 표시용 - 이번 해 투자 금액만)
                investmentInfo[targetSaving.title] = investAmount;
              }
            } else if (
              allocation.targetType === "pension" &&
              allocation.targetId
            ) {
              // 연금 상품에 투자 (퇴직연금, 개인연금)
              const targetPension = pensionsById[allocation.targetId];

              if (targetPension && targetPension.isActive) {
                // 연금 자산에 투자 금액 추가 (추가 납입)
                targetPension.amount =
                  Math.round((targetPension.amount + investAmount) * 100) / 100;

                // 이번 해 투자 금액 누적
                if (!targetPension.totalInvested) {
                  targetPension.totalInvested = 0;
                }
                targetPension.totalInvested =
                  Math.round(
                    (targetPension.totalInvested + investAmount) * 100
                  ) / 100;

                // 현금에서 투자 금액 차감
                currentCash =
                  Math.round((currentCash - investAmount) * 100) / 100;

                // 투자 정보 저장 (자산 차트에서 표시용 - 이번 해 투자 금액만)
                investmentInfo[targetPension.title] = investAmount;
              }
            } else if (allocation.targetType === "cash") {
              // 현금 유지: 아무것도 안 함 (이미 currentCash에 포함됨)
            }
          }
        });
      }
    }

    // 연금 계산 (퇴직연금/개인연금)
    Object.keys(pensionsByTitle).forEach((title) => {
      const pension = pensionsByTitle[title];

      // 퇴직금/DB: 은퇴년도 처리
      if (
        !pension.isActive &&
        pension.type === "severance" &&
        year === pension.retirementYear
      ) {
        // 은퇴년도: 자산에 표시 (수령 여부는 아래에서 처리)
        pension.isActive = true;
        pension.amount = pension.initialAmount; // 은퇴년도에 퇴직금 자산으로 설정
      }

      if (!pension.isActive) return; // 비활성 연금은 건너뛰기

      // 퇴직금/DB인 경우: 은퇴년도가 수령년도가 아니면 자산으로만 표시
      if (
        pension.type === "severance" &&
        year === pension.retirementYear &&
        year !== pension.paymentStartYear
      ) {
        // 은퇴년도: 퇴직금 그대로 자산으로만 표시
        // 수익률 X, 적립 X, 수령 X (나중에 수령)
        // 다음 해부터 계산 시작
        return;
      }

      // 퇴직금/DB인 경우: 적립 기간 처리 (은퇴 다음해부터)
      if (
        pension.type === "severance" &&
        year > pension.retirementYear && // 은퇴 다음해부터만
        year >= pension.contributionStartYear && // 적립 시작년도부터
        year <= pension.contributionEndYear && // 적립 종료년도까지
        year < pension.paymentStartYear // 수령 시작 전까지
      ) {
        // 적립 기간 동안 처리
        const returnRate = pension.returnRate / 100;
        const isFirstContributionYear = year === pension.contributionStartYear;

        // 추가 적립이 있는 경우
        if (
          !pension.noAdditionalContribution &&
          pension.contributionAmount &&
          pension.contributionAmount > 0
        ) {
          const monthlyAmount =
            pension.contributionFrequency === "monthly"
              ? pension.contributionAmount
              : pension.contributionAmount / 12;
          const yearlyAmount = monthlyAmount * 12;

          if (isFirstContributionYear) {
            // 첫 적립년도: 보유액 + 적립금 (수익률 X)
            pension.amount = pension.amount + yearlyAmount;
          } else {
            // 다음 해부터: 보유액 × 수익률 + 적립금
            pension.amount = pension.amount * (1 + returnRate) + yearlyAmount;
          }
        } else {
          // 추가 적립 없으면 수익률만 적용
          if (!isFirstContributionYear) {
            pension.amount = pension.amount * (1 + returnRate);
          }
        }
      } else if (
        pension.type === "severance" &&
        year > pension.retirementYear && // 은퇴 다음해부터
        year < pension.contributionStartYear // 적립 시작 전까지
      ) {
        // 은퇴 후 ~ 적립 시작 전: 보유액에만 수익률 적용 (단, 은퇴 다음해는 첫 해이므로 수익률 X)
        if (year > pension.retirementYear + 1) {
          const returnRate = pension.returnRate / 100;
          pension.amount = pension.amount * (1 + returnRate);
        }
      }

      // 퇴직연금/개인연금: 적립 기간 처리
      // 적립 종료년도 = 수령 시작년도인 경우 수령 로직 우선 (year < paymentStartYear)
      if (
        pension.type !== "severance" && // 퇴직금/DB는 위에서 이미 처리
        year >= pension.contributionStartYear &&
        year <= pension.contributionEndYear &&
        year < pension.paymentStartYear
      ) {
        // 적립 기간: 연금 자산에 추가 (현재 보유액도 수익률 적용)
        const returnRate = pension.returnRate / 100;

        // 추가 적립 금액 계산 (있는 경우만)
        let yearlyAmount = 0;
        if (pension.contributionAmount && pension.contributionAmount > 0) {
          const monthlyAmount =
            pension.contributionFrequency === "monthly"
              ? pension.contributionAmount
              : pension.contributionAmount / 12;
          yearlyAmount = monthlyAmount * 12;
        }

        if (year === pension.contributionStartYear) {
          // 시작년도: 현재 보유액 + 적립금 (수익률 X)
          pension.amount = pension.amount + yearlyAmount;
        } else {
          // 다음 해부터: 작년 말 잔액에 수익률 적용 + 올해 적립금
          pension.amount = pension.amount * (1 + returnRate) + yearlyAmount;
        }
      } else if (
        pension.type !== "severance" &&
        year > pension.contributionEndYear &&
        year < pension.paymentStartYear
      ) {
        // 적립 종료 후 ~ 수령 시작 전: 수익률만 적용 (공백 기간)
        const returnRate = pension.returnRate / 100;
        pension.amount = pension.amount * (1 + returnRate);
      } else if (year === pension.paymentStartYear) {
        // PMT 방식: 수령 시작년도에 매년 수령액 계산
        const returnRate = pension.returnRate / 100;
        const paymentYears = pension.paymentYears || 10;
        const paymentEndYear = pension.paymentStartYear + paymentYears - 1;

        // 즉시 수령 판단 (수익률 적용 안 함):
        // 적립 종료년도 = 수령 시작년도이고, 추가 적립이 있는 경우만 (연말 기준, 같은 해에 적립하고 바로 수령)
        // 단, 퇴직금은 이미 보유한 금액이므로 항상 수익률 적용
        // 기 보유 금액만 있는 경우(추가 적립 없음)는 일반 수령으로 처리 (수익률 적용)
        const hasAdditionalContribution =
          !pension.noAdditionalContribution && pension.contributionAmount > 0;
        const isImmediateWithdrawal =
          pension.type !== "severance" &&
          pension.contributionEndYear === pension.paymentStartYear &&
          hasAdditionalContribution;

        if (isImmediateWithdrawal) {
          // 즉시 수령: 수익률 적용 없이 그대로 수령
          pension._pmtAmount = calculatePMT(
            pension.amount,
            0, // 수익률 0
            paymentYears
          );
          pension._isImmediateWithdrawal = true; // 저장
          // 수익률 적용 없이 PMT 차감
          pension.amount = pension.amount - pension._pmtAmount;
        } else {
          // 일반 수령: 수익률 적용
          pension._pmtAmount = calculatePMT(
            pension.amount,
            returnRate,
            paymentYears
          );
          pension._isImmediateWithdrawal = false; // 저장
          // 수익률 적용 후 PMT 차감
          pension.amount =
            pension.amount * (1 + returnRate) - pension._pmtAmount;
        }

        // 수령 기간이 1년인 경우 (시작 = 종료): 즉시 비활성화
        if (pension.paymentStartYear === paymentEndYear) {
          pension.isActive = false;
          pension.amount = 0;
        }
      } else if (
        year > pension.paymentStartYear &&
        year < pension.paymentEndYear
      ) {
        // PMT 방식: 수령 기간 중
        const returnRate = pension.returnRate / 100;

        if (pension._isImmediateWithdrawal) {
          // 즉시 수령: 수익률 적용 없이 PMT 차감
          pension.amount = pension.amount - pension._pmtAmount;
        } else {
          // 일반 수령: 수익률 적용 후 PMT 차감
          pension.amount =
            pension.amount * (1 + returnRate) - pension._pmtAmount;
        }
      } else if (year === pension.paymentEndYear) {
        // PMT 방식: 수령 종료년도 (마지막 수령 후 비활성화)
        const returnRate = pension.returnRate / 100;

        if (pension._isImmediateWithdrawal) {
          // 즉시 수령: 수익률 적용 없이 마지막 PMT 차감
          pension.amount = pension.amount - pension._pmtAmount;
        } else {
          // 일반 수령: 수익률 적용 후 마지막 PMT 차감
          pension.amount =
            pension.amount * (1 + returnRate) - pension._pmtAmount;
        }

        // 수령 완료 후 비활성화
        pension.isActive = false;
        pension.amount = 0;
      } else if (year > pension.paymentEndYear) {
        // 수령 종료 이후: 연금 비활성화
        pension.isActive = false;
        pension.amount = 0;
      }
    });

    // 부동산 처리
    Object.keys(realEstatesByTitle).forEach((title) => {
      const realEstate = realEstatesByTitle[title];

      if (year < realEstate.startYear) {
        // 보유 시작 전: 부동산 비활성화
        realEstate.isActive = false;
        realEstate.amount = 0;
      } else if (year >= realEstate.endYear) {
        // 연말 기준: endYear에 매각하므로 endYear부터 비활성화
        realEstate.isActive = false;
        realEstate.amount = 0;
      } else if (year >= realEstate.startYear && year < realEstate.endYear) {
        // 보유 기간 중 (endYear 전까지만): 부동산 활성화
        realEstate.isActive = true;

        if (year === realEstate.startYear) {
          // 첫 해: 현재 가치로 시작 (상승률 적용 X)
          realEstate.amount =
            realEstate._initialValue || realEstate.amount || 0;
        } else {
          const growthRate = realEstate.growthRate / 100; // 상승률을 소수로 변환

          const isPensionActive =
            realEstate.convertToPension &&
            year >= realEstate.pensionStartYear &&
            year <= (realEstate.pensionEndYear || 9999);

          if (isPensionActive) {
            // 연말 기준: 매년 상승률 적용 후 주택연금 차감
            const yearlyPensionAmount = realEstate.monthlyPensionAmount * 12;

            if (year === realEstate.pensionStartYear) {
              // 주택연금 시작 년도: 작년 말 잔액에 상승률 적용 후 주택연금 차감
              realEstate.amount =
                realEstate.amount * (1 + growthRate) - yearlyPensionAmount;
            } else {
              // 주택연금 수령 중: 작년 말 잔액(이미 주택연금 차감된 상태)에 상승률 적용 후 주택연금 차감
              realEstate.amount =
                realEstate.amount * (1 + growthRate) - yearlyPensionAmount;
            }

            // 자산이 0 이하가 되면 비활성화
            if (realEstate.amount <= 0) {
              realEstate.amount = 0;
              realEstate.isActive = false;
            }
          } else {
            // 주택연금 없는 경우: 작년 말 잔액에 상승률 적용
            realEstate.amount = realEstate.amount * (1 + growthRate);
          }
        }
      }
    });

    // 자산 계산 (제목별로)
    Object.keys(assetsByTitle).forEach((title) => {
      const asset = assetsByTitle[title];

      // endYear 이상이면 자산 비활성화 (현금으로 전환)
      if (year >= asset.endYear) {
        asset.isActive = false;
        asset.amount = 0;
        return;
      }

      // 보유 기간 중 (endYear 전까지만)
      if (year >= asset.startYear && year < asset.endYear) {
        asset.isActive = true;

        if (year === asset.startYear) {
          // 첫 해: 현재 가치로 시작 (상승률 적용 X)
          asset.amount = asset._initialValue || asset.amount || 0;
        } else {
          // 다음 해부터: 상승률 적용
          asset.amount = asset.amount * (1 + asset.growthRate);
        }
      } else {
        // 보유 시작 전: 자산 비활성화
        asset.isActive = false;
        asset.amount = 0;
      }
    });

    // 부채 계산 (제목별로) - 음수로 표시
    Object.keys(debtsByTitle).forEach((title) => {
      const debt = debtsByTitle[title];
      const { startYear, endYear, debtType, originalAmount } = debt;
      const interestRate = debt.interestRate || 0;
      const gracePeriod = parseInt(debt.gracePeriod, 10) || 0;

      let outstanding = 0;

      // 연말 기준: 첫 해는 대출만, 다음 해부터 이자 발생
      if (year === startYear) {
        // 첫 해: 원금만 (이자 미발생)
        outstanding = -originalAmount;
      } else if (year > startYear && year <= endYear) {
        const yearsElapsed = year - startYear; // 1년부터 시작
        const totalYears = endYear - startYear; // 총 이자 발생 기간

        if (debtType === "bullet") {
          outstanding = year < endYear ? -originalAmount : 0;
        } else if (debtType === "equal") {
          if (totalYears > 0 && interestRate > 0) {
            const denominator = Math.pow(1 + interestRate, totalYears) - 1;
            const pmt =
              denominator !== 0
                ? (originalAmount *
                    (interestRate * Math.pow(1 + interestRate, totalYears))) /
                  denominator
                : 0;

            let remainingPrincipal = originalAmount;
            // yearsElapsed는 1부터 시작하므로 1부터 yearsElapsed까지 반복
            for (let i = 1; i <= yearsElapsed; i++) {
              const interestPayment = remainingPrincipal * interestRate;
              const principalPayment = pmt - interestPayment;
              remainingPrincipal -= principalPayment;
            }

            remainingPrincipal = Math.max(remainingPrincipal, 0);
            outstanding = -remainingPrincipal;
          } else if (totalYears > 0) {
            const yearlyPrincipalPayment = originalAmount / totalYears;
            const paidPrincipal = yearlyPrincipalPayment * yearsElapsed;
            const remainingPrincipal = Math.max(
              originalAmount - paidPrincipal,
              0
            );
            outstanding = -remainingPrincipal;
          }
        } else if (debtType === "principal") {
          if (totalYears > 0) {
            const yearlyPrincipalPayment = originalAmount / totalYears;
            const paidPrincipal = yearlyPrincipalPayment * yearsElapsed;
            const remainingPrincipal = Math.max(
              originalAmount - paidPrincipal,
              0
            );
            outstanding = -remainingPrincipal;
          }
        } else if (debtType === "grace") {
          // 연말 기준: 대출년도(이자 없음) + 거치기간
          const graceEndYear = startYear + gracePeriod;
          const repaymentYears = endYear - graceEndYear;

          if (year <= graceEndYear) {
            outstanding = -originalAmount;
          } else if (repaymentYears > 0) {
            const yearlyPrincipalPayment = originalAmount / repaymentYears;
            const repaymentYearsElapsed = year - graceEndYear;
            const paidPrincipal =
              yearlyPrincipalPayment * Math.max(repaymentYearsElapsed, 0);
            const remainingPrincipal = Math.max(
              originalAmount - paidPrincipal,
              0
            );
            outstanding = -remainingPrincipal;
          }
        }
      }

      debt.amount = outstanding;
      debt.isActive = outstanding !== 0;
    });

    // 자산 데이터 구성
    const assetItem = {
      year,
      age,
    };

    // 현금을 그대로 표시 (양수면 자산, 음수면 부채)
    assetItem.현금 = currentCash;

    // 활성 저축별 자산 추가 (같은 제목의 저축은 합계 계산)
    const savingsByTitle = {};
    Object.keys(savingsById).forEach((id) => {
      const saving = savingsById[id];
      if (saving.isActive) {
        if (savingsByTitle[saving.title]) {
          savingsByTitle[saving.title] += saving.amount;
        } else {
          savingsByTitle[saving.title] = saving.amount;
        }
      }
    });

    // 합계된 저축을 자산 아이템에 추가
    Object.keys(savingsByTitle).forEach((title) => {
      assetItem[title] = savingsByTitle[title];
    });

    // 활성 연금별 자산 추가
    Object.keys(pensionsByTitle).forEach((title) => {
      const pension = pensionsByTitle[title];
      if (pension.isActive) {
        assetItem[title] = pension.amount;
      }
    });

    // 활성 부동산별 자산 추가
    Object.keys(realEstatesByTitle).forEach((title) => {
      const realEstate = realEstatesByTitle[title];
      if (realEstate.isActive) {
        assetItem[title] = realEstate.amount;
      }
    });

    // 활성 자산별 자산 추가
    Object.keys(assetsByTitle).forEach((title) => {
      const asset = assetsByTitle[title];
      if (asset.isActive) {
        // "현금"이라는 이름은 시스템 예약어이므로 "현금 자산"으로 변경
        const displayTitle = title === "현금" ? "현금 자산" : title;
        assetItem[displayTitle] = asset.amount;
      }
    });

    // 부채(음수) 추가
    Object.keys(debtsByTitle).forEach((title) => {
      const debt = debtsByTitle[title];
      if (debt.amount && debt.amount !== 0) {
        assetItem[title] = debt.amount;
      }
    });

    // 총 자산 계산
    const totalAmount = Object.values(assetItem).reduce((sum, value) => {
      return typeof value === "number" ? sum + value : sum;
    }, 0);

    assetItem.totalAmount = totalAmount;
    assetData.push(assetItem);

    // detailedData 생성 (breakdown 정보)
    const assetItems = [];
    const debtItems = [];

    // 현금 (양수면 자산, 음수면 부채로 분류)
    if (currentCash > 0) {
      assetItems.push({
        label: "현금",
        amount: currentCash,
        originalValue: currentCash,
        sourceType: "cash", // 데이터 출처
      });
    } else if (currentCash < 0) {
      debtItems.push({
        label: "현금",
        amount: Math.abs(currentCash),
        originalValue: currentCash,
        sourceType: "cash", // 데이터 출처
      });
    }

    // 저축
    Object.keys(savingsById).forEach((id) => {
      const saving = savingsById[id];
      if (saving.isActive && saving.amount > 0) {
        assetItems.push({
          label: saving.title,
          amount: saving.amount,
          originalValue: saving.amount,
          sourceType: "saving", // 데이터 출처
        });
      }
    });

    // 연금
    Object.keys(pensionsByTitle).forEach((title) => {
      const pension = pensionsByTitle[title];
      if (pension.isActive && pension.amount > 0) {
        assetItems.push({
          label: title,
          amount: pension.amount,
          originalValue: pension.amount,
          sourceType: "pension", // 데이터 출처
        });
      }
    });

    // 부동산
    Object.keys(realEstatesByTitle).forEach((title) => {
      const realEstate = realEstatesByTitle[title];
      if (realEstate.isActive && realEstate.amount > 0) {
        assetItems.push({
          label: title,
          amount: realEstate.amount,
          originalValue: realEstate.amount,
          sourceType: "realEstate", // 데이터 출처
        });
      }
    });

    // 자산
    Object.keys(assetsByTitle).forEach((title) => {
      const asset = assetsByTitle[title];
      if (asset.isActive && asset.amount > 0) {
        const displayTitle = title === "현금" ? "현금 자산" : title;
        assetItems.push({
          label: displayTitle,
          amount: asset.amount,
          originalValue: asset.amount,
          sourceType: "asset", // 데이터 출처
        });
      }
    });

    // 부채
    Object.keys(debtsByTitle).forEach((title) => {
      const debt = debtsByTitle[title];
      if (debt.amount && debt.amount !== 0) {
        debtItems.push({
          label: title,
          amount: Math.abs(debt.amount),
          originalValue: debt.amount,
          sourceType: "debt", // 데이터 출처
        });
      }
    });

    // 색상 매핑 함수 (bar 차트와 동일한 색상)
    const getAssetColor = (assetName) => {
      switch (assetName) {
        case "저축투자":
          return "#3b82f6"; // 파랑
        case "연금":
          return "#fbbf24"; // 노랑
        case "부동산":
          return "#8b5cf6"; // 보라
        case "자산":
          return "#06b6d4"; // 청록
        case "양수현금":
          return "#10b981"; // 초록
        case "음수현금":
          return "#ef4444"; // 빨강
        case "부채":
          return "#374151"; // 회색
        default:
          return "#6b7280"; // 기본 회색
      }
    };

    // 카테고리 판별 및 색상 반환 함수
    const getCategoryAndColor = (label) => {
      if (label.includes("현금") || label.includes("cash")) {
        return { category: "현금", color: getAssetColor("양수현금") };
      } else if (
        label.includes("저축") ||
        label.includes("투자") ||
        label.includes("예금") ||
        label.includes("적금") ||
        label.includes("채권") ||
        label.includes("주식") ||
        label.includes("펀드") ||
        label.includes("ETF")
      ) {
        return { category: "저축투자", color: getAssetColor("저축투자") };
      } else if (
        label.includes("연금") ||
        label.includes("퇴직") ||
        label.includes("국민연금") ||
        label.includes("IRP") ||
        label.includes("DB")
      ) {
        return { category: "연금", color: getAssetColor("연금") };
      } else if (
        label.includes("부동산") ||
        label.includes("아파트") ||
        label.includes("자택") ||
        label.includes("주택") ||
        label.includes("토지") ||
        label.includes("건물") ||
        label.includes("상가")
      ) {
        return { category: "부동산", color: getAssetColor("부동산") };
      } else {
        return { category: "자산", color: getAssetColor("자산") };
      }
    };

    // bar 차트와 동일한 순서로 정렬 (미리 계산하여 hover 시 렉 방지)
    // 1. 카테고리별 분류 + 색상 할당
    const categorizedAssets = {
      현금: [],
      연금: [],
      자산: [],
    };

    const categorizedDebts = {
      현금: [],
      기타: [],
    };

    assetItems.forEach((item) => {
      const { category, color } = getCategoryAndColor(item.label);
      const itemWithColor = { ...item, color };

      if (item.label === "현금" || item.label === "현금 자산") {
        categorizedAssets.현금.push(itemWithColor);
      } else if (
        item.label.includes("연금") ||
        item.label.includes("퇴직") ||
        item.label.includes("국민연금")
      ) {
        categorizedAssets.연금.push(itemWithColor);
      } else {
        categorizedAssets.자산.push(itemWithColor);
      }
    });

    debtItems.forEach((item) => {
      const color =
        item.label === "현금"
          ? getAssetColor("음수현금")
          : getAssetColor("부채");
      const itemWithColor = { ...item, color };

      if (item.label === "현금") {
        categorizedDebts.현금.push(itemWithColor);
      } else {
        categorizedDebts.기타.push(itemWithColor);
      }
    });

    // 2. 각 카테고리 내에서 금액이 작은 순서대로 정렬 (작은 금액이 위로)
    Object.keys(categorizedAssets).forEach((category) => {
      categorizedAssets[category].sort((a, b) => a.amount - b.amount); // 오름차순 (작은 금액 → 큰 금액)
    });

    // 부채도 모두 오름차순 정렬 (작은 금액 → 큰 금액)
    if (categorizedDebts.현금.length > 0) {
      categorizedDebts.현금.sort((a, b) => a.amount - b.amount);
    }
    if (categorizedDebts.기타.length > 0) {
      categorizedDebts.기타.sort((a, b) => a.amount - b.amount);
    }

    // 3. bar 차트와 반대 순서로 결합
    // bar 쌓이는 순서: 자산 큰 것(맨 아래) → 연금 큰 것 → 현금(맨 위)
    // 상세 패널 순서: 자산 작은 것(맨 위) → 연금 작은 것 → 현금(맨 아래)
    // 각 카테고리 내에서 작은 금액 → 큰 금액 순서로 정렬됨
    const sortedAssetItems = [
      ...categorizedAssets.자산,
      ...categorizedAssets.연금,
      ...categorizedAssets.현금,
    ];

    // 부채: 기타 부채(리스트 맨 위) → 현금(리스트 맨 아래)
    const sortedDebtItems = [
      ...categorizedDebts.기타,
      ...categorizedDebts.현금,
    ];

    // 합계 계산
    const totalAssets = sortedAssetItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalDebt = sortedDebtItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // detailedData에 추가 (이미 정렬된 데이터)
    detailedData.push({
      year: year,
      age: age,
      breakdown: {
        assetItems: sortedAssetItems, // 이미 정렬됨
        debtItems: sortedDebtItems, // 이미 정렬됨
        totalAssets: totalAssets, // 합계도 미리 계산
        totalDebt: totalDebt,
        netAssets: totalAssets - totalDebt,
      },
      investmentInfo: investmentInfo, // 잉여 현금 투자 정보 (자산명: 투자금액)
    });
  }

  return {
    data: assetData,
    detailedData: detailedData,
  };
}

/**
 * 부채 시뮬레이션 계산
 */
export function calculateDebtSimulation(profileData, debts = []) {
  const currentYear = new Date().getFullYear();
  const startAge = calculateKoreanAge(profileData.birthYear, currentYear); // 만 나이로 실시간 계산
  const deathAge = 90;
  const simulationYears = deathAge - startAge + 1;

  const debtData = [];

  // 부채별 자산 (제목별로 분리)
  const debtsByTitle = {};
  debts.forEach((debt) => {
    debtsByTitle[debt.title] = {
      amount: debt.debtAmount, // 부채 금액
      startYear: debt.startYear,
      endYear: debt.endYear,
      debtType: debt.debtType, // "bullet", "equal", "principal", "grace"
      interestRate: debt.interestRate || 0, // 이미 소수로 저장됨
      originalAmount: debt.debtAmount,
      gracePeriod: debt.gracePeriod, // 거치기간 추가 (거치식 상환에 필요)
      isActive: true,
    };
  });

  for (let i = 0; i < simulationYears; i++) {
    const year = currentYear + i;
    const age = startAge + i;

    const debtItem = { year, age };

    // 부채 상환 처리
    Object.keys(debtsByTitle).forEach((title) => {
      const debt = debtsByTitle[title];
      const { startYear, endYear, debtType, originalAmount } = debt;
      const interestRate = debt.interestRate || 0;
      const gracePeriod = parseInt(debt.gracePeriod, 10) || 0;

      let outstanding = 0;

      if (year >= startYear && year <= endYear) {
        const yearsElapsed = year - startYear;
        const totalYears = endYear - startYear + 1;

        if (debtType === "bullet") {
          outstanding = year < endYear ? -originalAmount : 0;
        } else if (debtType === "equal") {
          if (totalYears > 0 && interestRate > 0) {
            const denominator = Math.pow(1 + interestRate, totalYears) - 1;
            const pmt =
              denominator !== 0
                ? (originalAmount *
                    (interestRate * Math.pow(1 + interestRate, totalYears))) /
                  denominator
                : 0;

            let remainingPrincipal = originalAmount;
            for (let i = 0; i <= yearsElapsed; i++) {
              if (i > 0) {
                const interestPayment = remainingPrincipal * interestRate;
                const principalPayment = pmt - interestPayment;
                remainingPrincipal -= principalPayment;
              }
            }

            remainingPrincipal = Math.max(remainingPrincipal, 0);
            outstanding = -remainingPrincipal;
          } else if (totalYears > 0) {
            const yearlyPrincipalPayment = originalAmount / totalYears;
            const paidPrincipal = yearlyPrincipalPayment * (yearsElapsed + 1);
            const remainingPrincipal = Math.max(
              originalAmount - paidPrincipal,
              0
            );
            outstanding = -remainingPrincipal;
          }
        } else if (debtType === "principal") {
          if (totalYears > 0) {
            const yearlyPrincipalPayment = originalAmount / totalYears;
            const paidPrincipal = yearlyPrincipalPayment * (yearsElapsed + 1);
            const remainingPrincipal = Math.max(
              originalAmount - paidPrincipal,
              0
            );
            outstanding = -remainingPrincipal;
          }
        } else if (debtType === "grace") {
          const graceEndYear = startYear + gracePeriod - 1;
          const repaymentYears = endYear - graceEndYear;

          if (year <= graceEndYear) {
            outstanding = -originalAmount;
          } else if (repaymentYears > 0) {
            const yearlyPrincipalPayment = originalAmount / repaymentYears;
            const repaymentYearsElapsed = year - graceEndYear;
            const paidPrincipal =
              yearlyPrincipalPayment * Math.max(repaymentYearsElapsed, 0);
            const remainingPrincipal = Math.max(
              originalAmount - paidPrincipal,
              0
            );
            outstanding = -remainingPrincipal;
          }
        }
      }

      if (outstanding !== 0) {
        debt.isActive = true;
        debt.amount = outstanding;
        debtItem[title] = outstanding;
      } else {
        debt.isActive = false;
        debt.amount = 0;
      }
    });

    // 총 부채 계산
    const totalAmount = Object.values(debtItem).reduce((sum, value) => {
      return typeof value === "number" ? sum + value : sum;
    }, 0);

    debtItem.totalAmount = totalAmount;
    debtData.push(debtItem);
  }

  return debtData;
}

/**
 * AI 분석에 필요한 핵심 필드만 추출하는 헬퍼 함수들
 * createdAt, updatedAt 등 메타데이터는 제외
 */

// 소득 데이터 정제
function cleanIncomeData(incomes) {
  return incomes.map((income) => ({
    name: income.name,
    amount: income.amount,
    frequency: income.frequency,
    startYear: income.startYear,
    endYear: income.endYear,
    yearlyGrowthRate: income.yearlyGrowthRate,
    fixedToRetirement: income.fixedToRetirement,
  }));
}

// 지출 데이터 정제
function cleanExpenseData(expenses) {
  return expenses.map((expense) => ({
    name: expense.name,
    amount: expense.amount,
    frequency: expense.frequency,
    startYear: expense.startYear,
    endYear: expense.endYear,
    yearlyGrowthRate: expense.yearlyGrowthRate,
    fixedToRetirement: expense.fixedToRetirement,
  }));
}

// 저축/투자 데이터 정제
function cleanSavingData(savings) {
  return savings.map((saving) => ({
    name: saving.name,
    amount: saving.amount,
    frequency: saving.frequency,
    currentAmount: saving.currentAmount,
    startYear: saving.startYear,
    endYear: saving.endYear,
    interestRate: saving.interestRate,
    yearlyGrowthRate: saving.yearlyGrowthRate,
    capitalGainsTaxRate: saving.capitalGainsTaxRate,
    treatAsPurchase: saving.treatAsPurchase,
    savingType: saving.savingType,
    incomeRate: saving.incomeRate,
    fixedToRetirement: saving.fixedToRetirement,
  }));
}

// 연금 데이터 정제
function cleanPensionData(pensions) {
  return pensions.map((pension) => ({
    name: pension.name,
    type: pension.type,
    currentAmount: pension.currentAmount,
    contributionAmount: pension.contributionAmount,
    frequency: pension.frequency,
    interestRate: pension.interestRate,
    contributionStartYear: pension.contributionStartYear,
    contributionEndYear: pension.contributionEndYear,
    paymentStartYear: pension.paymentStartYear,
    paymentYears: pension.paymentYears,
    monthlyPayment: pension.monthlyPayment,
    averageMonthlyWage: pension.averageMonthlyWage,
    yearsOfService: pension.yearsOfService,
    noAdditionalContribution: pension.noAdditionalContribution,
    fixedContributionEndToRetirement: pension.fixedContributionEndToRetirement,
  }));
}

// 부동산 데이터 정제
function cleanRealEstateData(realEstates) {
  return realEstates.map((realEstate) => ({
    name: realEstate.name,
    currentValue: realEstate.currentValue,
    annualAppreciationRate: realEstate.annualAppreciationRate,
    startYear: realEstate.startYear,
    endYear: realEstate.endYear,
    monthlyRentalIncome: realEstate.monthlyRentalIncome,
    rentalIncomeStartYear: realEstate.rentalIncomeStartYear,
    rentalIncomeEndYear: realEstate.rentalIncomeEndYear,
    reverseMonthlyPayment: realEstate.reverseMonthlyPayment,
    reverseMortgageStartYear: realEstate.reverseMortgageStartYear,
    reverseMortgageEndYear: realEstate.reverseMortgageEndYear,
    isResidential: realEstate.isResidential,
    purchasePrice: realEstate.purchasePrice,
    purchaseDate: realEstate.purchaseDate,
    acquisitionBeforeThisYear: realEstate.acquisitionBeforeThisYear,
  }));
}

// 자산 데이터 정제
function cleanAssetData(assets) {
  return assets.map((asset) => ({
    name: asset.name,
    currentValue: asset.currentValue,
    annualAppreciationRate: asset.annualAppreciationRate,
    startYear: asset.startYear,
    endYear: asset.endYear,
    assetType: asset.assetType,
    incomeRate: asset.incomeRate,
    capitalGainsTaxRate: asset.capitalGainsTaxRate,
  }));
}

// 부채 데이터 정제
function cleanDebtData(debts) {
  return debts.map((debt) => ({
    name: debt.name,
    debtAmount: debt.debtAmount,
    annualInterestRate: debt.annualInterestRate,
    startYear: debt.startYear,
    endYear: debt.endYear,
    repaymentType: debt.repaymentType,
    graceYears: debt.graceYears,
  }));
}

/**
 * 시뮬레이션 데이터 정제: 0이나 빈 배열 제거
 * 핵심 필드(year, age, amount, breakdown)는 항상 유지
 */
function cleanSimulationYearData(yearData) {
  const cleaned = {
    year: yearData.year,
    age: yearData.age,
    amount: yearData.amount,
  };

  // breakdown이 있으면 항상 포함 (중요한 정보)
  if (yearData.breakdown) {
    cleaned.breakdown = yearData.breakdown;
  }

  // 나머지 필드들은 0이 아니거나 빈 배열이 아닐 때만 포함
  Object.keys(yearData).forEach((key) => {
    // 이미 처리한 필드들은 건너뛰기
    if (
      key === "year" ||
      key === "age" ||
      key === "amount" ||
      key === "breakdown"
    ) {
      return;
    }

    const value = yearData[key];

    // 숫자이고 0이 아닌 경우
    if (typeof value === "number" && value !== 0) {
      cleaned[key] = value;
    }
    // 배열이고 비어있지 않은 경우
    else if (Array.isArray(value) && value.length > 0) {
      cleaned[key] = value;
    }
    // 객체인 경우 (breakdown 외)
    else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0
    ) {
      cleaned[key] = value;
    }
  });

  return cleaned;
}

/**
 * 시뮬레이션 데이터 배열 정제
 */
function cleanSimulationData(simulationData) {
  return simulationData.map((yearData) => cleanSimulationYearData(yearData));
}

/**
 * AI 봇을 위한 시뮬레이션 데이터 추출
 * 현금흐름과 자산 시뮬레이션 데이터를 AI가 분석하기 쉬운 형태로 변환
 * createdAt, updatedAt 등 메타데이터 제외, 0과 빈 배열도 제거
 */
export function extractAIAnalysisData(
  profileData,
  incomes = [],
  expenses = [],
  savings = [],
  pensions = [],
  realEstates = [],
  assets = [],
  debts = []
) {
  // 현금흐름 시뮬레이션 계산
  const cashflowData = calculateCashflowSimulation(
    profileData,
    incomes,
    expenses,
    savings,
    pensions,
    realEstates,
    assets,
    debts
  );

  // 자산 시뮬레이션 계산
  const assetSimulationResult = calculateAssetSimulation(
    profileData,
    incomes,
    expenses,
    savings,
    pensions,
    realEstates,
    assets,
    cashflowData,
    debts
  );

  // calculateAssetSimulation은 { data: [...], detailedData: [...] } 객체를 반환
  const assetData = assetSimulationResult.data || assetSimulationResult;

  // AI 분석용 데이터 구성 (핵심 필드만 추출, 0과 빈 배열 제거)
  const aiAnalysisData = {
    // 기본 정보
    profile: {
      name: profileData.name,
      currentAge: calculateKoreanAge(profileData.birthYear), // 만 나이로 실시간 계산
      retirementAge: profileData.retirementAge,
      retirementYear:
        new Date().getFullYear() +
        (parseInt(profileData.retirementAge, 10) -
          calculateKoreanAge(parseInt(profileData.birthYear, 10))),
      currentCash: profileData.currentCash || 0,
      targetAssets: profileData.targetAssets,
    },

    // 시뮬레이션 데이터 (최대 20년간, 0과 빈 배열 제거)
    simulation: {
      cashflow: cleanSimulationData(cashflowData.slice(0, 20)),
      assets: cleanSimulationData(
        Array.isArray(assetData) ? assetData.slice(0, 20) : []
      ),
    },

    // 원시 데이터 (핵심 필드만 포함, 메타데이터 제외)
    rawData: {
      incomes: cleanIncomeData(incomes),
      expenses: cleanExpenseData(expenses),
      savings: cleanSavingData(savings),
      pensions: cleanPensionData(pensions),
      realEstates: cleanRealEstateData(realEstates),
      assets: cleanAssetData(assets),
      debts: cleanDebtData(debts),
    },

    // 데이터 생성 시간
    generatedAt: new Date().toISOString(),
  };

  return aiAnalysisData;
}
