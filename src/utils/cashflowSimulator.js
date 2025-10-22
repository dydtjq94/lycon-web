/**
 * 현금흐름 시뮬레이션 계산 유틸리티
 */

/**
 * 수입 데이터를 기반으로 현금흐름 시뮬레이션을 계산합니다.
 * @param {Object} profileData - 프로필 데이터
 * @param {Array} incomes - 수입 데이터 배열
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
  const startAge = profileData.currentKoreanAge;
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

    // 수입 계산
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

    debts.forEach((debt) => {
      if (year >= debt.startYear && year <= debt.endYear) {
        const yearsElapsed = year - debt.startYear;
        const totalYears = debt.endYear - debt.startYear + 1;
        const interestRate = debt.interestRate; // 이미 소수로 저장됨

        if (debt.debtType === "bullet") {
          // 만기일시상환: 매년 이자만 지불, 만기일에 원금 상환
          if (year < debt.endYear) {
            // 만기 전: 이자만 지불
            const yearlyInterest = debt.debtAmount * interestRate;
            totalDebtInterest += yearlyInterest;
          } else if (year === debt.endYear) {
            // 만기년도: 이자 + 원금 상환
            const yearlyInterest = debt.debtAmount * interestRate;
            totalDebtInterest += yearlyInterest;
            totalDebtPrincipal += debt.debtAmount;
          }
        } else if (debt.debtType === "equal") {
          // 원리금균등상환: 매년 동일한 금액 상환
          // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
          const principal = debt.debtAmount;
          const r = interestRate;
          const n = totalYears;

          if (n > 0 && r > 0) {
            const pmt =
              (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
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

            totalDebtInterest += interestPayment;
            totalDebtPrincipal += principalPayment;
          } else if (r === 0) {
            // 이자율이 0%인 경우: 원금을 균등 분할
            const yearlyPayment = principal / n;
            totalDebtPrincipal += yearlyPayment;
          }
        } else if (debt.debtType === "principal") {
          // 원금균등상환: 매년 동일한 원금 상환, 이자는 남은 원금에 대해 계산
          const principal = debt.debtAmount;
          const r = interestRate;
          const n = totalYears;
          const yearlyPrincipalPayment = principal / n;

          // 이자 부분 계산: 남은 원금 * 이자율
          let remainingPrincipal = principal;
          for (let i = 0; i < yearsElapsed; i++) {
            remainingPrincipal -= yearlyPrincipalPayment;
          }

          const interestPayment = remainingPrincipal * r;
          const principalPayment = yearlyPrincipalPayment;

          totalDebtInterest += interestPayment;
          totalDebtPrincipal += principalPayment;
        } else if (debt.debtType === "grace") {
          // 거치식상환: 거치기간 동안 이자만 지불, 이후 원리금균등상환
          const principal = debt.debtAmount;
          const r = interestRate;
          const gracePeriod = debt.gracePeriod || 0;
          const repaymentYears = totalYears - gracePeriod;

          if (year < debt.startYear + gracePeriod) {
            // 거치기간: 이자만 지불
            const yearlyInterest = principal * r;
            totalDebtInterest += yearlyInterest;
          } else {
            // 상환기간: 원리금균등상환
            if (repaymentYears > 0 && r > 0) {
              const pmt =
                (principal * (r * Math.pow(1 + r, repaymentYears))) /
                (Math.pow(1 + r, repaymentYears) - 1);
              const yearlyPayment = pmt;

              // 이자 부분 계산: 남은 원금 * 이자율
              let remainingPrincipal = principal;
              for (let i = 0; i < yearsElapsed - gracePeriod; i++) {
                const interestPayment = remainingPrincipal * r;
                const principalPayment = yearlyPayment - interestPayment;
                remainingPrincipal -= principalPayment;
              }

              const interestPayment = remainingPrincipal * r;
              const principalPayment = yearlyPayment - interestPayment;

              totalDebtInterest += interestPayment;
              totalDebtPrincipal += principalPayment;
            }
          }
        }
      }
    });

    // 저축 계산 (현금흐름에서는 년간 저축 상승률만 적용, 이자율 적용 안함)
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
        // 퇴직연금/개인연금: 적립 기간과 수령 기간 모두 현금흐름에 반영
        const paymentStartYear = pension.paymentStartYear;
        const paymentEndYear = pension.paymentEndYear;

        if (
          year >= pension.contributionStartYear &&
          year <= pension.contributionEndYear
        ) {
          // 적립 기간: 현금흐름에서 차감 (마이너스)
          const monthlyAmount =
            pension.contributionFrequency === "monthly"
              ? pension.contributionAmount
              : pension.contributionAmount / 12;
          const yearlyContribution = monthlyAmount * 12;
          totalPension -= yearlyContribution; // 마이너스로 차감
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
    let totalRentalIncome = 0; // 임대 수입
    let totalRealEstatePension = 0; // 주택연금 수령액

    realEstates.forEach((realEstate) => {
      // 임대 수입 계산
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
    });

    // 자산 수익 계산 (수익형 자산의 이자/배당)
    let totalAssetIncome = 0;
    assets.forEach((asset) => {
      if (
        asset.assetType === "income" &&
        asset.incomeRate > 0 &&
        year >= asset.startYear &&
        year <= asset.endYear
      ) {
        // 해당 연도의 자산 가치를 계산 (자산 시뮬레이션에서 가져와야 하지만, 여기서는 간단히 계산)
        const yearsElapsed = year - asset.startYear;
        const currentAssetValue =
          asset.currentValue * Math.pow(1 + asset.growthRate, yearsElapsed);
        totalAssetIncome += currentAssetValue * asset.incomeRate;
      }
    });

    // 현금흐름 = 수입 - 지출 - 저축 + 연금 + 임대수입 + 주택연금 + 자산수익 - 부채이자 - 부채원금상환 (각 년도별 순현금흐름)
    const netCashflow =
      totalIncome -
      totalExpense -
      totalSavings +
      totalPension +
      totalRentalIncome +
      totalRealEstatePension +
      totalAssetIncome -
      totalDebtInterest -
      totalDebtPrincipal;

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
      debtInterest: totalDebtInterest,
      debtPrincipal: totalDebtPrincipal,
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
  const startAge = profileData.currentKoreanAge;
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
        amount: 0,
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
    realEstatesByTitle[realEstate.title] = {
      amount: realEstate.currentValue, // 현재 가치로 시작
      startYear: currentYear,
      endYear: realEstate.endYear,
      growthRate: realEstate.growthRate || 2.5, // 백분율 그대로 사용
      convertToPension: realEstate.convertToPension || false,
      pensionStartYear: realEstate.pensionStartYear,
      monthlyPensionAmount: realEstate.monthlyPensionAmount,
      isActive: true,
    };
  });

  // 자산별 자산 (제목별로 분리)
  const assetsByTitle = {};
  assets.forEach((asset) => {
    assetsByTitle[asset.title] = {
      amount: asset.currentValue, // 현재 가치로 시작
      startYear: asset.startYear,
      endYear: asset.endYear,
      growthRate: asset.growthRate || 0, // 이미 소수로 저장됨
      assetType: asset.assetType || "general", // "general" 또는 "income"
      incomeRate: asset.incomeRate || 0, // 수익형 자산의 수익률
      isActive: true,
    };
  });

  // 부채별 자산 (제목별로 분리) - 음수로 표시
  const debtsByTitle = {};
  debts.forEach((debt) => {
    debtsByTitle[debt.title] = {
      amount: -debt.debtAmount, // 부채는 음수로 표시
      startYear: debt.startYear,
      endYear: debt.endYear,
      debtType: debt.debtType, // "bullet" 또는 "equal"
      interestRate: debt.interestRate,
      originalAmount: debt.debtAmount,
      isActive: true,
    };
  });

  for (let i = 0; i < simulationYears; i++) {
    const year = currentYear + i;
    const age = startAge + i;

    // 해당 연도의 현금 흐름 가져오기
    const yearCashflow = cashflowData.find((cf) => cf.year === year);
    const netCashflow = yearCashflow ? yearCashflow.amount : 0;

    // 현금 흐름을 현재 현금에 적용
    currentCash += netCashflow;

    // 해당 연도의 저축 계산 (ID별로)
    Object.keys(savingsById).forEach((id) => {
      const saving = savingsById[id];

      if (!saving.isActive) {
        return; // 비활성 저축은 건너뛰기
      }

      // endYear + 1년에 저축을 현금으로 전환
      if (year === saving.endYear + 1) {
        currentCash += saving.amount;
        // 저축을 비활성화 (자산 차트에서 제거됨)
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
            saving.amount = saving.originalAmount;
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

          // 작년 자산에 이자율 적용 + 올해 저축 추가
          saving.amount = saving.amount * (1 + interestRate) + yearlyAmount;
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

      if (
        year >= realEstate.startYear &&
        year <= realEstate.endYear &&
        realEstate.isActive
      ) {
        if (year === realEstate.startYear) {
          // 첫 해: 현재 가치로 시작
          realEstate.amount = realEstate.amount;
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
        // 보유 종료 다음 해: 부동산 자산을 현금으로 변환
        if (realEstate.isActive && realEstate.amount > 0) {
          currentCash += realEstate.amount;
          realEstate.amount = 0;
        }
        realEstate.isActive = false;
      } else if (year > realEstate.endYear + 1) {
        // 보유 종료 이후: 부동산 비활성화
        realEstate.isActive = false;
      }
    });

    // 자산 계산 (제목별로)
    Object.keys(assetsByTitle).forEach((title) => {
      const asset = assetsByTitle[title];

      if (year >= asset.startYear && year <= asset.endYear && asset.isActive) {
        if (year === asset.startYear) {
          // 첫 해: 현재 가치로 시작
          asset.amount = asset.amount;
        } else {
          // 상승률 적용
          asset.amount *= 1 + asset.growthRate;
        }
      } else if (year === asset.endYear + 1) {
        // 보유 종료 다음 해: 자산을 현금으로 변환
        if (asset.isActive && asset.amount > 0) {
          currentCash += asset.amount;
          asset.amount = 0;
        }
        asset.isActive = false;
      } else if (year > asset.endYear + 1) {
        // 보유 종료 이후: 자산 비활성화
        asset.isActive = false;
      }
    });

    // 부채 계산 (제목별로) - 음수로 표시
    Object.keys(debtsByTitle).forEach((title) => {
      const debt = debtsByTitle[title];

      if (year >= debt.startYear && year <= debt.endYear && debt.isActive) {
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
  const startAge = profileData.currentKoreanAge;
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
      debtType: debt.debtType, // "bullet" 또는 "equal"
      interestRate: debt.interestRate || 0, // 이미 소수로 저장됨
      originalAmount: debt.debtAmount,
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
          // 거치식상환: 거치기간 동안 원금 유지, 이후 원리금균등상환
          const gracePeriod = debt.gracePeriod || 0;
          const repaymentYears = totalYears - gracePeriod;

          if (year < debt.startYear + gracePeriod) {
            // 거치기간: 원금 유지
            debtItem[title] = -debt.originalAmount; // 음수로 표시
          } else {
            // 상환기간: 원리금균등상환
            if (repaymentYears > 0 && interestRate > 0) {
              // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
              const pmt =
                (debt.originalAmount *
                  (interestRate * Math.pow(1 + interestRate, repaymentYears))) /
                (Math.pow(1 + interestRate, repaymentYears) - 1);

              // 남은 원금 계산 (거치기간 이후부터)
              let remainingPrincipal = debt.originalAmount;
              const repaymentYearsElapsed = yearsElapsed - gracePeriod;
              for (let i = 0; i <= repaymentYearsElapsed; i++) {
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
              const yearlyPrincipalPayment =
                debt.originalAmount / repaymentYears;
              const paidPrincipal =
                yearlyPrincipalPayment * (repaymentYearsElapsed + 1);
              debtItem[title] = -(debt.originalAmount - paidPrincipal); // 음수로 표시

              if (year === debt.endYear) {
                debtItem[title] = 0;
                debt.isActive = false;
              }
            }
          }
        }
      } else if (year > debt.endYear) {
        // 부채 기간 종료 후: 비활성화
        debt.isActive = false;
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
