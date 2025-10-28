/**
 * 현금흐름 시뮬레이션 계산 유틸리티
 */
import { calculateKoreanAge } from "./koreanAge";

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

    // 소득 계산
    incomes.forEach((income) => {
      if (year >= income.startYear && year <= income.endYear) {
        const yearsElapsed = year - income.startYear;
        const growthRate = income.growthRate / 100;

        // 빈도에 따라 연간 금액 계산
        const yearlyAmount =
          income.frequency === "monthly" ? income.amount * 12 : income.amount;

        const adjustedAmount =
          yearlyAmount * Math.pow(1 + growthRate, yearsElapsed);
        totalIncome += adjustedAmount;
      }
    });

    // 지출 계산
    expenses.forEach((expense) => {
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
            }
          } else if (year === debtEndYear) {
            // 만기년도: 이자 + 원금 상환
            const yearlyInterest = debtAmount * interestRate;
            if (yearlyInterest > 0) {
              totalDebtInterest += yearlyInterest;
              debtInterestDetails.push({
                title: debt.title,
                amount: yearlyInterest,
              });
            }
            if (debtAmount > 0) {
              totalDebtPrincipal += debtAmount;
              debtPrincipalDetails.push({
                title: debt.title,
                amount: debtAmount,
              });
            }
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
            }
            if (principalPayment > 0) {
              totalDebtPrincipal += principalPayment;
              debtPrincipalDetails.push({
                title: debt.title,
                amount: principalPayment,
              });
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
          }
          if (principalPayment > 0) {
            totalDebtPrincipal += principalPayment;
            debtPrincipalDetails.push({
              title: debt.title,
              amount: principalPayment,
            });
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
          } else if (year > graceEndYear && year <= debtEndYear && repaymentYears > 0) {
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
            }
            if (principalPayment > 0) {
              totalDebtPrincipal += principalPayment;
              debtPrincipalDetails.push({
                title: debt.title,
                amount: principalPayment,
              });
            }
          }
        }
      }
    });

    // 저축 계산 (현금흐름에서는 년간 저축 상승률만 적용, 이자율 적용 안함)
    let totalSavingMaturity = 0; // 저축 만료 수입 (별도 변수)
    let savingMaturities = []; // 저축 만료 상세 정보

    savings.forEach((saving) => {
      if (year >= saving.startYear && year <= saving.endYear) {
        const yearsElapsed = year - saving.startYear;
        const yearlyGrowthRate = saving.yearlyGrowthRate || 0; // 이미 소수로 저장됨

        if (saving.frequency === "one_time") {
          // 일회성 저축: 시작년도에만 현금흐름에 반영
          if (year === saving.startYear) {
            totalSavings += saving.amount;
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
        }
      } else if (year === saving.endYear + 1) {
        // 저축 만료 다음 해: 만료된 저축 금액을 현금흐름에 추가
        // 이자율을 적용한 최종 금액 계산
        const yearsElapsed = saving.endYear - saving.startYear;
        const interestRate = saving.interestRate || 0;
        const yearlyGrowthRate = saving.yearlyGrowthRate || 0;

        let finalAmount = 0;

        if (saving.frequency === "one_time") {
          // 일회성 저축: 원금에 이자율 적용
          finalAmount =
            saving.amount * Math.pow(1 + interestRate, yearsElapsed);
        } else {
          // 월간/연간 저축: 복리 계산
          const monthlyAmount =
            saving.frequency === "monthly" ? saving.amount : saving.amount / 12;

          for (let i = 0; i <= yearsElapsed; i++) {
            const adjustedMonthlyAmount =
              monthlyAmount * Math.pow(1 + yearlyGrowthRate, i);
            const yearlyAmount = adjustedMonthlyAmount * 12;

            if (i === 0) {
              finalAmount = yearlyAmount;
            } else {
              finalAmount = finalAmount * (1 + interestRate) + yearlyAmount;
            }
          }
        }

        // 저축 만료 수입에 추가 (현금흐름에서 플러스로 처리)
        totalSavingMaturity += finalAmount;

        // 저축 만료 상세 정보 추가
        savingMaturities.push({
          title: saving.title,
          amount: finalAmount,
        });
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
        }
      }
    });

    // 부동산 관련 계산
    let totalRentalIncome = 0; // 임대 소득
    let totalRealEstatePension = 0; // 주택연금 수령액
    let totalRealEstateSale = 0; // 부동산 매각 수입
    let totalRealEstatePurchase = 0; // 부동산 구매 비용
    const realEstatePurchases = []; // 부동산 구매 상세 정보
    const realEstateSales = []; // 부동산 매각 상세 정보

    realEstates.forEach((realEstate) => {
      // 부동산 구매 비용 계산 (첫 년도에 현금으로 차감)
      if (realEstate.isPurchase && year === realEstate.startYear) {
        totalRealEstatePurchase += realEstate.currentValue;
        realEstatePurchases.push({
          title: realEstate.title,
          amount: realEstate.currentValue,
        });
      }

      // 임대 소득 계산
      if (
        realEstate.hasRentalIncome &&
        year >= realEstate.rentalIncomeStartYear &&
        year <= realEstate.rentalIncomeEndYear
      ) {
        totalRentalIncome += realEstate.monthlyRentalIncome * 12;
      }

      // 주택연금 수령액 계산
      if (realEstate.convertToPension && year >= realEstate.pensionStartYear) {
        totalRealEstatePension += realEstate.monthlyPensionAmount * 12;
      }

      // 부동산 매각 수입 계산 (만료 다음 해)
      if (year === realEstate.endYear + 1) {
        // 부동산 가치에 상승률을 적용한 최종 가치 계산
        const yearsElapsed = realEstate.endYear - realEstate.startYear;
        const growthRate = (realEstate.growthRate || 0) / 100;
        const finalValue =
          realEstate.currentValue * Math.pow(1 + growthRate, yearsElapsed);
        totalRealEstateSale += finalValue;
        realEstateSales.push({
          title: realEstate.title,
          amount: finalValue,
        });
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
      }

      if (
        asset.assetType === "income" &&
        asset.incomeRate > 0 &&
        year >= startYear &&
        year <= endYear
      ) {
        // 해당 연도의 자산 가치를 계산 (자산 시뮬레이션에서 가져와야 하지만, 여기서는 간단히 계산)
        const yearsElapsed = year - startYear;
        const currentAssetValue =
          asset.currentValue * Math.pow(1 + asset.growthRate, yearsElapsed);
        totalAssetIncome += currentAssetValue * asset.incomeRate;
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
      }
    });

    // 현금흐름 = 소득 - 지출 - 저축 + 연금 + 임대소득 + 주택연금 + 자산수익 + 부동산매각 + 자산매각 + 저축만료 + 대출 현금 유입 - 부채이자 - 부채원금상환 - 자산구매 - 부동산구매 (각 년도별 순현금흐름)
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
      totalRealEstatePurchase;

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
      // 구매와 매각 상세 정보 추가
      assetPurchases: assetPurchases,
      realEstatePurchases: realEstatePurchases,
      debtInjections: debtInjections,
      assetSales: assetSales,
      realEstateSales: realEstateSales,
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
        returnRate: pension.returnRate || 5.0,
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
      monthlyPensionAmount: realEstate.monthlyPensionAmount,
      isPurchase: realEstate.isPurchase || false, // 구매 여부 저장
      isActive: false, // 초기에는 비활성화 (startYear에 활성화)
      _initialValue: initialRealEstateValue, // 초기값 저장
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
          // 일회성 저축 (정기예금 등)
          if (year === saving.startYear) {
            // 현재 보유 금액 + 추가 저축 금액
            saving.amount = saving.amount + saving.originalAmount;
          } else if (year > saving.startYear) {
            // 시작년도 다음 해부터 만료년도까지 이자율만 적용
            saving.amount *= 1 + interestRate;
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
            // 첫 해: 현재 보유 금액 + 올해 저축만 추가 (이자율 미적용)
            saving.amount = saving.amount + yearlyAmount;
          } else {
            // 작년 자산에 이자율 적용 + 올해 저축 추가
            saving.amount = saving.amount * (1 + interestRate) + yearlyAmount;
          }
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
          // 주택연금 수령 중이 아닌 경우에만 상승률 적용
          const isPensionActive =
            realEstate.convertToPension && year >= realEstate.pensionStartYear;
          if (!isPensionActive) {
            const growthRate = realEstate.growthRate / 100; // 백분율을 소수로 변환
            realEstate.amount = realEstate.amount * (1 + growthRate);
          }
        }

        // 주택연금 전환 처리
        if (
          realEstate.convertToPension &&
          year >= realEstate.pensionStartYear
        ) {
          // 주택연금 수령 시: 자산에서 월 수령액만큼 차감 (현금으로 변환하지 않음)
          const yearlyPensionAmount = realEstate.monthlyPensionAmount * 12;
          if (realEstate.amount >= yearlyPensionAmount) {
            realEstate.amount -= yearlyPensionAmount;
            // 현금으로 변환하지 않음 - 현금흐름 시뮬레이션에서만 처리
          } else {
            // 부동산 가치가 부족하면 남은 가치만 차감
            realEstate.amount = 0;
            realEstate.isActive = false;
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

      if (year < debt.startYear) {
        // 보유 시작 전: 부채 비활성화
        debt.isActive = false;
      } else if (
        year >= debt.startYear &&
        year <= debt.endYear &&
        debt.isActive
      ) {
        const yearsElapsed = year - debt.startYear;
        const totalYears = debt.endYear - debt.startYear + 1;
        const interestRate = debt.interestRate;

        if (debt.debtType === "bullet") {
          // 만기일시상환: 만기년도까지 원금 유지, 만기년도에 상환
          if (year < debt.endYear) {
            // 만기 전: 원금 유지 (음수로 표시)
            debt.amount = -debt.originalAmount;
          } else if (year === debt.endYear) {
            // 만기년도: 원금 상환으로 부채 제거
            debt.amount = 0;
            debt.isActive = false;
          }
        } else if (debt.debtType === "equal") {
          // 원리금균등상환: 매년 원금 상환
          if (totalYears > 0 && interestRate > 0) {
            // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
            const pmt =
              (debt.originalAmount *
                (interestRate * Math.pow(1 + interestRate, totalYears))) /
              (Math.pow(1 + interestRate, totalYears) - 1);

            // 남은 원금 계산
            let remainingPrincipal = debt.originalAmount;
            for (let i = 0; i <= yearsElapsed; i++) {
              if (i > 0) {
                const interestPayment = remainingPrincipal * interestRate;
                const principalPayment = pmt - interestPayment;
                remainingPrincipal -= principalPayment;
              }
            }

            debt.amount = -remainingPrincipal;

            if (year === debt.endYear) {
              // 마지막 해: 부채 완전 상환
              debt.amount = 0;
              debt.isActive = false;
            }
          } else if (interestRate === 0) {
            // 이자율이 0%인 경우: 원금을 균등 분할
            const yearlyPrincipalPayment = debt.originalAmount / totalYears;
            const paidPrincipal = yearlyPrincipalPayment * (yearsElapsed + 1);
            debt.amount = -(debt.originalAmount - paidPrincipal);

            if (year === debt.endYear) {
              debt.amount = 0;
              debt.isActive = false;
            }
          }
        } else if (debt.debtType === "principal") {
          // 원금균등상환: 매년 동일한 원금 상환
          const yearlyPrincipalPayment = debt.originalAmount / totalYears;
          const paidPrincipal = yearlyPrincipalPayment * (yearsElapsed + 1);
          debt.amount = -(debt.originalAmount - paidPrincipal);

          if (year === debt.endYear) {
            // 마지막 해: 부채 완전 상환
            debt.amount = 0;
            debt.isActive = false;
          }
        } else if (debt.debtType === "grace") {
          // 거치식상환: 거치기간 동안 원금 유지, 이후 원금을 균등하게 상환
          const gracePeriod = parseInt(debt.gracePeriod, 10) || 0;
          const graceEndYear = debt.startYear + gracePeriod - 1; // 거치기간 마지막 년도
          const repaymentYears = debt.endYear - graceEndYear; // 상환기간 = 종료년도 - 거치기간종료년도

          // 디버깅 로그 (첫 해에만 출력)
          if (year === debt.startYear) {
            console.log(`\n[자산 시뮬레이션 - 거치식 부채]`);
            console.log(
              `  debt.gracePeriod: ${
                debt.gracePeriod
              } (타입: ${typeof debt.gracePeriod})`
            );
            console.log(
              `  gracePeriod (파싱): ${gracePeriod} (타입: ${typeof gracePeriod})`
            );
            console.log(
              `  debt.startYear: ${
                debt.startYear
              } (타입: ${typeof debt.startYear})`
            );
            console.log(
              `  debt.endYear: ${debt.endYear} (타입: ${typeof debt.endYear})`
            );
            console.log(
              `  graceEndYear: ${graceEndYear} (타입: ${typeof graceEndYear})`
            );
            console.log(`  repaymentYears: ${repaymentYears}`);
          }

          if (year <= graceEndYear) {
            // 거치기간 동안은 원금 유지 (이자만 지불)
            debt.amount = -debt.originalAmount;

            // 디버깅 로그
            console.log(
              `  ${year}년: 거치기간 (year ${year} <= graceEndYear ${graceEndYear}) -> 원금 유지`
            );
          } else if (year > graceEndYear && year <= debt.endYear) {
            // 상환기간: 원금을 상환년수로 균등 분할하여 상환
            const yearlyPrincipalPayment = debt.originalAmount / repaymentYears;
            const repaymentYearsElapsed = year - graceEndYear; // 상환 시작 후 경과년수
            const paidPrincipal =
              yearlyPrincipalPayment * repaymentYearsElapsed;
            debt.amount = -(debt.originalAmount - paidPrincipal);

            // 디버깅 로그
            console.log(
              `  ${year}년: 상환기간 (경과 ${repaymentYearsElapsed}년) -> 상환 ${paidPrincipal.toFixed(
                0
              )}, 남은 부채: ${debt.amount.toFixed(0)}`
            );

            if (year === debt.endYear) {
              // 마지막 해: 부채 완전 상환
              debt.amount = 0;
              debt.isActive = false;
            }
          } else if (year > debt.endYear) {
            // 부채 기간 종료 후: 비활성화
            debt.isActive = false;
          }
        }
      } else if (year > debt.endYear) {
        // 부채 기간 종료 후: 비활성화
        debt.isActive = false;
      }
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

    // 활성 부채별 자산 추가 (음수로 표시)
    Object.keys(debtsByTitle).forEach((title) => {
      const debt = debtsByTitle[title];
      if (debt.isActive) {
        assetItem[title] = debt.amount; // 이미 음수로 저장됨
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

      if (debt.isActive && year >= debt.startYear && year <= debt.endYear) {
        const yearsElapsed = year - debt.startYear;
        const totalYears = debt.endYear - debt.startYear + 1;
        const interestRate = debt.interestRate;

        if (debt.debtType === "bullet") {
          // 만기일시상환: 만기년도까지 원금 유지, 만기년도에 상환
          if (year < debt.endYear) {
            debtItem[title] = -debt.originalAmount; // 음수로 표시
          } else if (year === debt.endYear) {
            // 만기년도: 원금 상환으로 부채 제거
            debtItem[title] = 0;
            debt.isActive = false;
          }
        } else if (debt.debtType === "equal") {
          // 원리금균등상환: 매년 원금 상환
          if (totalYears > 0 && interestRate > 0) {
            // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
            const pmt =
              (debt.originalAmount *
                (interestRate * Math.pow(1 + interestRate, totalYears))) /
              (Math.pow(1 + interestRate, totalYears) - 1);

            // 남은 원금 계산
            let remainingPrincipal = debt.originalAmount;
            for (let i = 0; i <= yearsElapsed; i++) {
              if (i > 0) {
                const interestPayment = remainingPrincipal * interestRate;
                const principalPayment = pmt - interestPayment;
                remainingPrincipal -= principalPayment;
              }
            }

            debtItem[title] = -remainingPrincipal; // 음수로 표시

            if (year === debt.endYear) {
              // 마지막 해: 부채 완전 상환
              debtItem[title] = 0;
              debt.isActive = false;
            }
          } else if (interestRate === 0) {
            // 이자율이 0%인 경우: 원금을 균등 분할
            const yearlyPrincipalPayment = debt.originalAmount / totalYears;
            const paidPrincipal = yearlyPrincipalPayment * (yearsElapsed + 1);
            debtItem[title] = -(debt.originalAmount - paidPrincipal); // 음수로 표시

            if (year === debt.endYear) {
              debtItem[title] = 0;
              debt.isActive = false;
            }
          }
        } else if (debt.debtType === "principal") {
          // 원금균등상환: 매년 동일한 원금 상환
          const yearlyPrincipalPayment = debt.originalAmount / totalYears;
          const paidPrincipal = yearlyPrincipalPayment * (yearsElapsed + 1);
          debtItem[title] = -(debt.originalAmount - paidPrincipal); // 음수로 표시

          if (year === debt.endYear) {
            // 마지막 해: 부채 완전 상환
            debtItem[title] = 0;
            debt.isActive = false;
          }
        } else if (debt.debtType === "grace") {
          // 거치식상환: 거치기간 동안 원금 유지, 이후 원금을 균등하게 상환
          const gracePeriod = parseInt(debt.gracePeriod) || 0;
          const graceEndYear = debt.startYear + gracePeriod - 1; // 거치기간 마지막 년도
          const repaymentYears = debt.endYear - graceEndYear; // 상환기간 = 종료년도 - 거치기간종료년도

          if (year <= graceEndYear) {
            // 거치기간: 원금 유지 (이자만 지불, 거치기간 마지막 년도까지 포함)
            debtItem[title] = -debt.originalAmount; // 음수로 표시
          } else if (year > graceEndYear && year <= debt.endYear) {
            // 상환기간: 원금을 상환년수로 균등 분할하여 상환
            const yearlyPrincipalPayment = debt.originalAmount / repaymentYears;
            const repaymentYearsElapsed = year - graceEndYear; // 상환 시작 후 경과년수
            const paidPrincipal =
              yearlyPrincipalPayment * repaymentYearsElapsed;
            debtItem[title] = -(debt.originalAmount - paidPrincipal); // 음수로 표시

            if (year === debt.endYear) {
              // 마지막 해: 부채 완전 상환
              debtItem[title] = 0;
              debt.isActive = false;
            }
          } else if (year > debt.endYear) {
            // 부채 기간 종료 후: 비활성화
            debt.isActive = false;
          }
        } else if (year > debt.endYear) {
          // 부채 기간 종료 후: 비활성화
          debt.isActive = false;
        }
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
      retirementYear: profileData.birthYear + profileData.retirementAge, // 만 나이 기준으로 계산
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
