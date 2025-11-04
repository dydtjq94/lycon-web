/**
 * 현금흐름 시뮬레이션 계산 유틸리티
 */
import { calculateKoreanAge } from "./koreanAge";

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
  if (holdingYears === 6) return 0.40;
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
    return { taxRate: 0.40, deduction: 2594 };
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

  const cashflowData = [];

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

    // 소득 계산
    incomes.forEach((income, incomeIndex) => {
      if (year >= income.startYear && year <= income.endYear) {
        const yearsElapsed = year - income.startYear;
        const growthRate = income.growthRate / 100;

        // 빈도에 따라 연간 금액 계산
        const yearlyAmount =
          income.frequency === "monthly" ? income.amount * 12 : income.amount;

        const adjustedAmount =
          yearlyAmount * Math.pow(1 + growthRate, yearsElapsed);
        totalIncome += adjustedAmount;

        addPositive(
          income.title,
          adjustedAmount,
          "소득",
          income.id ? `income-${income.id}` : `income-${incomeIndex}`
        );
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
          `${debt.title} (대출 유입)`,
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

      if (year >= debtStartYear && year <= debtEndYear) {
        const yearsElapsed = year - debtStartYear;
        const totalYears = debtEndYear - debtStartYear + 1;
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
                `${debt.title} (이자)`,
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
                `${debt.title} (이자)`,
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
            let remainingPrincipal = principal;
            for (let i = 0; i < yearsElapsed; i++) {
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
                `${debt.title} (이자)`,
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
                `${debt.title} (원금 상환)`,
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
          let remainingPrincipal = principal;
          for (let i = 0; i < yearsElapsed; i++) {
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
              `${debt.title} (이자)`,
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
              `${debt.title} (원금 상환)`,
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
          const principal = debtAmount;
          const r = interestRate;
          const gracePeriod = parseInt(debt.gracePeriod, 10) || 0;
          const graceEndYear = debtStartYear + gracePeriod - 1; // 거치기간 마지막 년도
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
                `${debt.title} (이자)`,
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
                `${debt.title} (원금 상환)`,
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

    // 저축 계산 (현금흐름에서는 년간 저축 상승률만 적용, 이자율 적용 안함)
    let totalSavingMaturity = 0; // 저축 만료 수입 (별도 변수)
    let savingMaturities = []; // 저축 만료 상세 정보

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

      if (year >= sStartYear && year <= sEndYear) {
        const yearsElapsed = year - sStartYear;
        const yearlyGrowthRate = saving.yearlyGrowthRate || 0; // 이미 소수로 저장됨

        if (saving.frequency === "one_time") {
          // 일회성 저축: 시작년도에만 현금흐름에 반영
          if (year === saving.startYear) {
            totalSavings += saving.amount;
            addNegative(
              saving.title,
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
          addNegative(
            saving.title,
            yearlyAmount,
            "저축 적립",
            `saving-contrib-${saving.id || saving.title}`
          );
        }
      } else if (year === sEndYear + 1) {
        // 저축 만료 다음 해: 만료된 저축 금액을 현금흐름에 추가
        // 이자율을 적용한 최종 금액 계산
        const yearsElapsed = sEndYear - sStartYear;
        const interestRate = saving.interestRate || 0;
        const yearlyGrowthRate = saving.yearlyGrowthRate || 0;

        let finalAmount = 0;
        const currentAmount = Number(saving.currentAmount) || 0; // 현재 보유 금액 포함

        if (saving.frequency === "one_time") {
          // 일회성 저축: (현재 보유 + 일회성 적립 원금)에 해당 연도 수익률까지 포함하여 연말 평가
          // 예: 2025-2025라면 1년치 이자 적용 필요 → yearsElapsed + 1
          finalAmount =
            (currentAmount + (Number(saving.amount) || 0)) *
            Math.pow(1 + interestRate, yearsElapsed + 1);
        } else {
          // 월간/연간 저축: 복리 계산
          const monthlyAmount =
            saving.frequency === "monthly" ? saving.amount : saving.amount / 12;
          // 현재 보유 금액으로 시작하여 매년 [보유 + 해당 해 적립]에 이자 적용 (연말 평가)
          let accumulated = currentAmount;
          for (let i = 0; i <= yearsElapsed; i++) {
            const adjustedMonthlyAmount =
              monthlyAmount * Math.pow(1 + yearlyGrowthRate, i);
            const yearlyAmount = adjustedMonthlyAmount * 12;
            accumulated = (accumulated + yearlyAmount) * (1 + interestRate);
          }
          finalAmount = accumulated;
        }

        // 저축 만료 수입에 추가 (현금흐름에서 플러스로 처리)
        totalSavingMaturity += finalAmount;

        // 저축 만료 상세 정보 추가
        savingMaturities.push({
          title: saving.title,
          amount: finalAmount,
        });

        addPositive(
          saving.title,
          finalAmount,
          "저축 만료",
          `saving-maturity-${saving.id || saving.title}`
        );
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
            pension.title,
            adjustedAmount,
            "국민연금",
            `pension-national-${pension.id || pension.title}`
          );
        }
      } else {
        // 퇴직연금/개인연금: 수령 기간만 현금흐름에 반영
        const paymentStartYear = pension.paymentStartYear;
        const paymentEndYear = pension.paymentEndYear;

        // 적립 기간 처리: 퇴직연금은 현금흐름에 영향 없음, 개인연금은 현금이 빠져나감
        if (
          year >= pension.contributionStartYear &&
          year <= pension.contributionEndYear
        ) {
          // 개인연금만 적립 시 현금이 빠져나감
          if (pension.type === "personal") {
            const monthlyAmount =
              pension.contributionFrequency === "monthly"
                ? pension.contributionAmount
                : pension.contributionAmount / 12;
            const yearlyContribution = monthlyAmount * 12;
            // 개인연금 적립액을 음수로 현금흐름에 반영 (현금이 빠져나감)
            totalExpense += yearlyContribution;
            addNegative(
              `${pension.title} (적립)`,
              yearlyContribution,
              "연금 적립",
              `pension-contrib-${pension.id || pension.title}`
            );
          }
          // 퇴직연금은 적립 시 현금이 빠져나가지 않음
        } else if (year >= paymentStartYear && year <= paymentEndYear) {
          // 수령 기간: 현금흐름에 추가 (플러스)
          // 적립 완료 시점의 총 금액을 직접 계산
          const monthlyAmount =
            pension.contributionFrequency === "monthly"
              ? pension.contributionAmount
              : pension.contributionAmount / 12;
          const yearlyContribution = monthlyAmount * 12;
          const returnRate = pension.returnRate / 100;

          // 현재 보유액을 포함한 총 적립액 계산 (복리 적용)
          let totalAccumulated = pension.currentAmount || 0; // 현재 보유액으로 시작
          for (
            let i = 0;
            i < pension.contributionEndYear - pension.contributionStartYear + 1;
            i++
          ) {
            totalAccumulated =
              totalAccumulated * (1 + returnRate) + yearlyContribution;
          }

          // 월 수령액 계산 (총 적립액 ÷ 수령 년수 ÷ 12)
          const paymentYears = paymentEndYear - paymentStartYear + 1;
          const monthlyPayment = totalAccumulated / paymentYears / 12;
          totalPension += monthlyPayment * 12; // 플러스로 추가
          addPositive(
            pension.title,
            monthlyPayment * 12,
            pension.type === "retirement" ? "퇴직연금" : "개인연금",
            `pension-payment-${pension.id || pension.title}`
          );
        }
      }
    });

    // 부동산 관련 계산
    let totalRentalIncome = 0; // 임대 소득
    let totalRealEstatePension = 0; // 주택연금 수령액
    let totalRealEstateSale = 0; // 부동산 매각 수입
    let totalRealEstatePurchase = 0; // 부동산 구매 비용
    let totalRealEstateTax = 0; // 부동산 취득세
    let totalCapitalGainsTax = 0; // 부동산 양도소득세
    const realEstatePurchases = []; // 부동산 구매 상세 정보
    const realEstateSales = []; // 부동산 매각 상세 정보
    const realEstateTaxes = []; // 부동산 취득세 상세 정보
    const capitalGainsTaxes = []; // 부동산 양도소득세 상세 정보

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
          `${realEstate.title} (구매)`,
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
          `${realEstate.title} (취득세)`,
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
          `${realEstate.title} (임대소득)`,
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
          `${realEstate.title} (주택연금)`,
          yearlyPensionAmount,
          "주택연금",
          `realestate-pension-${realEstate.id || realEstate.title}`
        );
      }

      // 부동산 매각 수입 계산 (만료 다음 해)
      if (
        Number.isFinite(endYear) &&
        Number.isFinite(startYear) &&
        year === endYear + 1 &&
        purchaseAmount > 0
      ) {
        // 부동산 가치에 상승률을 적용한 최종 가치 계산
        const yearsElapsed = endYear - startYear;
        const growthRate = (realEstate.growthRate || 0) / 100;
        const finalValue =
          purchaseAmount * Math.pow(1 + growthRate, yearsElapsed);
        totalRealEstateSale += finalValue;
        realEstateSales.push({
          title: realEstate.title,
          amount: finalValue,
        });
        addPositive(
          `${realEstate.title} (매각)`,
          finalValue,
          "부동산 매각",
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

          // 보유기간 계산: 양도년도(endYear + 1) - 취득년도
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
              `${realEstate.title} (양도세)`,
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
          `${asset.title} (구매)`,
          asset.currentValue,
          "자산 구매",
          `asset-purchase-${asset.id || asset.title}`
        );
      }

      if (
        asset.assetType === "income" &&
        asset.incomeRate > 0 &&
        year > startYear &&
        year <= endYear
      ) {
        // 연말 기준: 수익은 시작 다음 해부터 발생하며, 전년도 말 자산 가치 기준으로 계산
        // 전년도 말 자산 가치 = currentValue * (1 + growthRate)^(year - startYear - 1)
        // 수익 = 전년도 말 자산 가치 * 수익률
        const yearsElapsed = year - startYear; // 시작부터 현재 해까지 경과 년수
        const previousYearEndValue =
          asset.currentValue * Math.pow(1 + asset.growthRate, yearsElapsed - 1);
        const yearlyIncome = previousYearEndValue * asset.incomeRate;
        totalAssetIncome += yearlyIncome;
        addPositive(
          `${asset.title} (수익)`,
          yearlyIncome,
          "자산 수익",
          `asset-income-${asset.id || asset.title}`
        );
      }

      // 자산 매각 수입 계산 (만료 다음 해)
      if (year === endYear + 1) {
        // 자산 가치에 상승률을 적용한 최종 가치 계산
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
          `${asset.title} (매각)`,
          finalValue,
          "자산 매각",
          `asset-sale-${asset.id || asset.title}`
        );
      }
    });

    // 현금흐름 = 소득 - 지출 - 저축 + 연금 + 임대소득 + 주택연금 + 자산수익 + 부동산매각 + 자산매각 + 저축만료 + 대출 현금 유입 - 부채이자 - 부채원금상환 - 자산구매 - 부동산구매 - 부동산취득세 - 양도소득세 (각 년도별 순현금흐름)
    const netCashflow =
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
      totalSavingMaturity -
      totalDebtInterest -
      totalDebtPrincipal -
      totalAssetPurchase -
      totalRealEstatePurchase -
      totalRealEstateTax -
      totalCapitalGainsTax;

    cashflowData.push({
      year,
      age,
      amount: netCashflow,
      income: totalIncome,
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
      debtInterest: totalDebtInterest,
      debtPrincipal: totalDebtPrincipal,
      debtInterests: debtInterestDetails,
      debtPrincipals: debtPrincipalDetails,
      realEstateTax: totalRealEstateTax, // 부동산 취득세
      realEstateTaxes: realEstateTaxes, // 부동산 취득세 상세 정보
      capitalGainsTax: totalCapitalGainsTax, // 부동산 양도소득세
      capitalGainsTaxes: capitalGainsTaxes, // 부동산 양도소득세 상세 정보
      // 구매와 매각 상세 정보 추가
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
        amount: saving.currentAmount || 0, // 현재 보유 금액으로 시작
        startYear: startYear,
        endYear: endYear,
        interestRate: saving.interestRate || 0.03, // 이자율 (소수로 저장됨)
        yearlyGrowthRate: saving.yearlyGrowthRate || 0, // 년간 저축 상승률
        frequency: saving.frequency,
        originalAmount: saving.amount,
        title: saving.title, // 제목도 저장
        isActive: true, // 활성 상태 추가
      };
    });
  }

  // 연금별 누적 자산 (제목별로 분리)
  const pensionsByTitle = {};
  pensions.forEach((pension) => {
    if (pension.type !== "national") {
      // 퇴직연금/개인연금만 자산으로 관리
      pensionsByTitle[pension.title] = {
        amount: pension.currentAmount || 0, // 현재 보유액으로 시작
        contributionStartYear: pension.contributionStartYear,
        contributionEndYear: pension.contributionEndYear,
        paymentStartYear: pension.paymentStartYear,
        paymentEndYear: pension.paymentEndYear,
        returnRate: pension.returnRate !== undefined ? pension.returnRate : 5.0,
        contributionAmount: pension.contributionAmount,
        contributionFrequency: pension.contributionFrequency,
        monthlyPayment: 0, // 월 수령액 (적립 종료 후 계산)
        isActive: true,
      };
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
    Object.keys(savingsById).forEach((id) => {
      const saving = savingsById[id];

      if (!saving.isActive) {
        return; // 비활성 저축은 건너뛰기
      }

      // endYear + 1년에 저축을 현금으로 전환 (현금흐름 시뮬레이션에서만 처리)
      if (year === saving.endYear + 1) {
        // 현금흐름 시뮬레이션에서 이미 계산된 저축 만료 금액이 netCashflow에 포함되어 있으므로
        // 여기서 추가로 currentCash에 더하지 않음 (중복 방지)

        // 저축을 즉시 비활성화 (자산 차트에서 제거됨)
        saving.isActive = false;
        saving.amount = 0; // 전환 후 금액 초기화

        return; // 전환 후 더 이상 처리하지 않음
      }

      if (year >= saving.startYear && year <= saving.endYear) {
        // 저축 기간 중 (endYear 포함)
        const yearsElapsed = year - saving.startYear;
        const interestRate = saving.interestRate; // 이미 소수로 저장됨
        const yearlyGrowthRate = saving.yearlyGrowthRate; // 이미 소수로 저장됨

        if (saving.frequency === "one_time") {
          // 일회성 저축 (정기예금 등): 시작년도에는 (보유+일회성 적립) 후 해당 연도 수익률 적용(연말 평가)
          if (year === saving.startYear) {
            saving.amount =
              (saving.amount + saving.originalAmount) * (1 + interestRate);
          } else if (year > saving.startYear) {
            // 이후 해에는 이자만 적용 (추가 적립 없음)
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

          // 모든 해에 대해 연말 평가 기준 적용: (보유 + 올해 적립) × (1 + 수익률)
          saving.amount = (saving.amount + yearlyAmount) * (1 + interestRate);
        }
      } else if (year > saving.endYear + 1) {
        // endYear + 1 이후: 이미 비활성화된 저축은 건너뛰기
        return;
      }
    });

    // 연금 계산 (퇴직연금/개인연금)
    Object.keys(pensionsByTitle).forEach((title) => {
      const pension = pensionsByTitle[title];

      if (!pension.isActive) return; // 비활성 연금은 건너뛰기

      if (
        year >= pension.contributionStartYear &&
        year <= pension.contributionEndYear
      ) {
        // 적립 기간: 연금 자산에 추가
        const yearsElapsed = year - pension.contributionStartYear;
        const returnRate = pension.returnRate / 100;

        // 월간/연간 적립 금액 계산
        const monthlyAmount =
          pension.contributionFrequency === "monthly"
            ? pension.contributionAmount
            : pension.contributionAmount / 12;
        const yearlyAmount = monthlyAmount * 12;

        // 작년 자산에 수익률 적용 + 올해 적립 추가
        pension.amount = pension.amount * (1 + returnRate) + yearlyAmount;
      } else if (year === pension.paymentStartYear) {
        // 수령 시작년도: 월 수령액 계산
        pension.monthlyPayment =
          pension.amount /
          (pension.paymentEndYear - pension.paymentStartYear + 1) /
          12;
        pension.amount -= pension.monthlyPayment * 12; // 첫 해 수령액 차감
      } else if (
        year > pension.paymentStartYear &&
        year <= pension.paymentEndYear
      ) {
        // 수령 기간: 자산에서 월 수령액만큼 차감
        pension.amount -= pension.monthlyPayment * 12;
      } else if (year > pension.paymentEndYear) {
        // 수령 종료: 연금 비활성화
        pension.isActive = false;
      }
    });

    // 부동산 처리
    Object.keys(realEstatesByTitle).forEach((title) => {
      const realEstate = realEstatesByTitle[title];

      if (year < realEstate.startYear) {
        // 보유 시작 전: 부동산 비활성화
        realEstate.isActive = false;
        realEstate.amount = 0;
      } else if (year >= realEstate.startYear && year <= realEstate.endYear) {
        // 보유 기간 중: 부동산 활성화
        realEstate.isActive = true;

        if (year === realEstate.startYear) {
          // 첫 해: 현재 가치로 시작
          realEstate.amount =
            realEstate._initialValue || realEstate.amount || 0;
        } else {
          const growthRate = realEstate.growthRate / 100; // 월 상승률을 소수로 변환

          const isPensionActive =
            realEstate.convertToPension &&
            year >= realEstate.pensionStartYear &&
            year <= (realEstate.pensionEndYear || 9999);

          if (isPensionActive) {
            // 주택연금 시작 해에 기준 값을 저장 (직전 연도까지 상승률 적용)
            if (year === realEstate.pensionStartYear) {
              const yearsElapsed =
                realEstate.pensionStartYear - 1 - realEstate.startYear;
              realEstate._pensionBaseValue =
                realEstate._initialValue *
                Math.pow(1 + growthRate, yearsElapsed);
            }

            const yearsSinceStart = year - realEstate.pensionStartYear;
            const grownValue =
              realEstate._pensionBaseValue *
              Math.pow(1 + growthRate, yearsSinceStart + 1);

            const yearlyPensionAmount = realEstate.monthlyPensionAmount * 12;
            const totalPensionPaid =
              yearlyPensionAmount * (yearsSinceStart + 1);

            realEstate.amount = Math.max(0, grownValue - totalPensionPaid);

            if (realEstate.amount <= 0) {
              realEstate.isActive = false;
            }
          } else {
            realEstate.amount = realEstate.amount * (1 + growthRate);
          }
        }
      } else if (year === realEstate.endYear + 1) {
        // 보유 종료 다음 해: 부동산 자산을 비활성화
        realEstate.isActive = false;
        realEstate.amount = 0;
      } else if (year > realEstate.endYear + 1) {
        // 보유 종료 이후: 부동산 비활성화
        realEstate.isActive = false;
        realEstate.amount = 0;
      }
    });

    // 자산 계산 (제목별로)
    Object.keys(assetsByTitle).forEach((title) => {
      const asset = assetsByTitle[title];

      // 보유 기간에만 활성화
      if (year >= asset.startYear && year <= asset.endYear) {
        asset.isActive = true;

        if (year === asset.startYear) {
          // 첫 해: 현재 가치로 시작
          asset.amount = asset._initialValue || asset.amount || 0;
        } else {
          // 상승률 적용 (이전 년도의 금액에 적용)
          asset.amount = asset.amount * (1 + asset.growthRate);
        }
      } else {
        // 보유 기간 외: 자산 비활성화
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
  }

  return assetData;
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
 * AI 봇을 위한 시뮬레이션 데이터 추출
 * 현금흐름과 자산 시뮬레이션 데이터를 AI가 분석하기 쉬운 형태로 변환
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
  const assetData = calculateAssetSimulation(
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

  // AI 분석용 데이터 구성 (원시 데이터만)
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

    // 시뮬레이션 데이터 (최대 20년간)
    simulation: {
      cashflow: cashflowData.slice(0, 20), // 최대 20년간
      assets: assetData.slice(0, 20), // 최대 20년간
    },

    // 원시 데이터
    rawData: {
      incomes,
      expenses,
      savings,
      pensions,
      realEstates,
      assets,
      debts,
    },

    // 데이터 생성 시간
    generatedAt: new Date().toISOString(),
  };

  return aiAnalysisData;
}
