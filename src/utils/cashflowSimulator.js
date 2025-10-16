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
  assets = [] // 자산 데이터 추가
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

    // 저축 계산 (현금흐름에서는 월간 저축 상승률만 적용, 이자율 적용 안함)
    savings.forEach((saving) => {
      if (year >= saving.startYear && year <= saving.endYear) {
        const yearsElapsed = year - saving.startYear;
        const monthlyGrowthRate = (saving.monthlyGrowthRate || 0) / 100;

        if (saving.frequency === "one_time") {
          // 일회성 저축: 시작년도에만 현금흐름에 반영
          if (year === saving.startYear) {
            totalSavings += saving.amount;
          }
        } else {
          // 월간/연간 저축
          const monthlyAmount =
            saving.frequency === "monthly" ? saving.amount : saving.amount / 12;

          // 월간 저축 상승률 적용
          const adjustedMonthlyAmount =
            monthlyAmount * Math.pow(1 + monthlyGrowthRate, yearsElapsed);
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
        const paymentStartYear = pension.contributionEndYear + 1;
        const paymentEndYear = paymentStartYear + pension.paymentYears - 1;

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
          const monthlyPayment = totalAccumulated / pension.paymentYears / 12;
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
        const currentAssetValue = asset.currentValue * Math.pow(1 + asset.growthRate, yearsElapsed);
        totalAssetIncome += currentAssetValue * asset.incomeRate;
      }
    });

    // 현금흐름 = 수입 - 지출 - 저축 + 연금 + 임대수입 + 주택연금 + 자산수익 (각 년도별 순현금흐름)
    const netCashflow =
      totalIncome -
      totalExpense -
      totalSavings +
      totalPension +
      totalRentalIncome +
      totalRealEstatePension +
      totalAssetIncome;

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
  assets = []
) {
  // 현재는 더미 데이터 반환
  const currentYear = new Date().getFullYear();
  const startAge = profileData.currentKoreanAge;
  const deathAge = 90;
  const simulationYears = deathAge - startAge + 1;

  const assetData = [];

  // 현재 현금 (프로필에서 가져옴)
  let currentCash = profileData.currentCash || 0;

  // 저축별 누적 자산 (제목별로 분리)
  const savingsByTitle = {};
  savings.forEach((saving) => {
    savingsByTitle[saving.title] = {
      amount: 0,
      startYear: saving.startYear,
      endYear: saving.endYear,
      interestRate: saving.interestRate || 3.0, // 이자율
      monthlyGrowthRate: saving.monthlyGrowthRate || 0, // 월간 저축 상승률
      frequency: saving.frequency,
      originalAmount: saving.amount,
      isActive: true, // 활성 상태 추가
    };
  });

  // 연금별 누적 자산 (제목별로 분리)
  const pensionsByTitle = {};
  pensions.forEach((pension) => {
    if (pension.type !== "national") {
      // 퇴직연금/개인연금만 자산으로 관리
      pensionsByTitle[pension.title] = {
        amount: pension.currentAmount || 0, // 현재 보유액으로 시작
        contributionStartYear: pension.contributionStartYear,
        contributionEndYear: pension.contributionEndYear,
        paymentStartYear: pension.contributionEndYear + 1,
        paymentEndYear: pension.contributionEndYear + pension.paymentYears,
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
      growthRate: realEstate.growthRate || 2.5,
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
      growthRate: asset.growthRate || 0,
      assetType: asset.assetType || "general", // "general" 또는 "income"
      incomeRate: asset.incomeRate || 0, // 수익형 자산의 수익률
      isActive: true,
    };
  });

  for (let i = 0; i < simulationYears; i++) {
    const year = currentYear + i;
    const age = startAge + i;

    // 해당 연도의 저축 계산 (제목별로)
    Object.keys(savingsByTitle).forEach((title) => {
      const saving = savingsByTitle[title];

      if (!saving.isActive) return; // 비활성 저축은 건너뛰기

      if (year >= saving.startYear && year <= saving.endYear) {
        // 저축 기간 중
        const yearsElapsed = year - saving.startYear;
        const interestRate = saving.interestRate / 100;
        const monthlyGrowthRate = saving.monthlyGrowthRate / 100;

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

          // 월간 저축 상승률 적용
          const adjustedMonthlyAmount =
            monthlyAmount * Math.pow(1 + monthlyGrowthRate, yearsElapsed);
          const yearlyAmount = adjustedMonthlyAmount * 12;

          // 작년 자산에 이자율 적용 + 올해 저축 추가
          saving.amount = saving.amount * (1 + interestRate) + yearlyAmount;
        }
      } else if (year === saving.endYear + 1) {
        // 저축 만료 시 현금으로 이동
        currentCash += saving.amount;
        saving.isActive = false; // 저축 비활성화 (차트에서 제거됨)
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
            const growthRate = realEstate.growthRate / 100;
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

    // 자산 데이터 구성
    const assetItem = {
      year,
      age,
      현금: currentCash, // 현금으로 통일
    };

    // 활성 저축별 자산 추가
    Object.keys(savingsByTitle).forEach((title) => {
      const saving = savingsByTitle[title];
      if (saving.isActive) {
        assetItem[title] = saving.amount;
      }
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
        assetItem[title] = asset.amount;
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
