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
  pensions = []
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

    // 저축 계산
    savings.forEach((saving) => {
      if (year >= saving.startYear && year <= saving.endYear) {
        const yearsElapsed = year - saving.startYear;
        const growthRate = saving.growthRate / 100;

        // 빈도에 따라 연간 금액 계산
        const yearlyAmount =
          saving.frequency === "monthly" ? saving.amount * 12 : saving.amount;

        const adjustedAmount =
          yearlyAmount * Math.pow(1 + growthRate, yearsElapsed);
        totalSavings += adjustedAmount;
      }
    });

    // 연금 계산 (추후 구현)
    pensions.forEach((pension) => {
      if (year >= pension.startYear && year <= pension.endYear) {
        const yearsElapsed = year - pension.startYear;
        const growthRate = pension.growthRate / 100;
        const adjustedAmount =
          pension.amount * Math.pow(1 + growthRate, yearsElapsed);
        totalPension += adjustedAmount;
      }
    });

    // 현금흐름 = 수입 - 지출 - 저축 + 연금 (각 년도별 순현금흐름)
    const netCashflow =
      totalIncome - totalExpense - totalSavings + totalPension;

    cashflowData.push({
      year,
      age,
      amount: netCashflow,
      income: totalIncome,
      expense: totalExpense,
      savings: totalSavings,
      pension: totalPension,
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
  pensions = []
) {
  // 현재는 더미 데이터 반환
  const currentYear = new Date().getFullYear();
  const startAge = profileData.currentKoreanAge;
  const deathAge = 90;
  const simulationYears = deathAge - startAge + 1;

  const assetData = [];

  // 자산 유형별 누적 자산
  let cumulativeSavings = 0; // 저축 자산
  let cumulativeCash = 0; // 현금성 자산 (기본)
  let cumulativePension = 0; // 연금 자산 (추후 구현)
  let cumulativeRealEstate = 0; // 부동산 자산 (추후 구현)

  for (let i = 0; i < simulationYears; i++) {
    const year = currentYear + i;
    const age = startAge + i;

    // 해당 연도의 저축 계산
    let yearlySavings = 0;
    savings.forEach((saving) => {
      if (year >= saving.startYear && year <= saving.endYear) {
        const yearsElapsed = year - saving.startYear;
        const growthRate = saving.growthRate / 100;

        // 빈도에 따라 연간 금액 계산
        const yearlyAmount =
          saving.frequency === "monthly" ? saving.amount * 12 : saving.amount;

        const adjustedAmount =
          yearlyAmount * Math.pow(1 + growthRate, yearsElapsed);
        yearlySavings += adjustedAmount;
      }
    });

    // 저축 자산에 추가
    cumulativeSavings += yearlySavings;
    
    // 저축 자산 성장률 적용 (3%)
    cumulativeSavings *= 1.03;

    // 현금성 자산 (기본 1000만원에서 시작)
    if (i === 0) {
      cumulativeCash = 1000; // 1000만원
    }
    cumulativeCash *= 1.02; // 2% 성장률

    // 총 자산 계산
    const totalAssets = cumulativeSavings + cumulativeCash + cumulativePension + cumulativeRealEstate;

    assetData.push({
      year,
      age,
      totalAmount: totalAssets,
      savings: cumulativeSavings,
      cash: cumulativeCash,
      pension: cumulativePension,
      realEstate: cumulativeRealEstate,
    });
  }

  return assetData;
}
