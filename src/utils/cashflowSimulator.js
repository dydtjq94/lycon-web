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

        // 디버깅 로그
        if (year === 2025) {
          console.log(`${year}년 지출 계산:`, {
            title: expense.title,
            amount: expense.amount,
            frequency: expense.frequency,
            yearlyAmount,
            adjustedAmount,
            totalExpense
          });
        }
      }
    });

    // 저축 계산 (추후 구현)
    savings.forEach((saving) => {
      if (year >= saving.startYear && year <= saving.endYear) {
        const yearsElapsed = year - saving.startYear;
        const growthRate = saving.growthRate / 100;
        const adjustedAmount =
          saving.amount * Math.pow(1 + growthRate, yearsElapsed);
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
 * 자산 시뮬레이션 계산 (추후 구현)
 */
export function calculateAssetSimulation(profileData, assets = []) {
  // 현재는 더미 데이터 반환
  const currentYear = new Date().getFullYear();
  const startAge = profileData.currentKoreanAge;
  const deathAge = 90;
  const simulationYears = deathAge - startAge + 1;

  const assetData = [];

  for (let i = 0; i < simulationYears; i++) {
    const year = currentYear + i;
    const age = startAge + i;

    // 기본 자산 계산 (추후 실제 로직 구현)
    const baseAsset = 10000; // 기본 자산 1억원
    const growthRate = 0.03; // 3% 성장률
    const assetAmount = baseAsset * Math.pow(1 + growthRate, i);

    assetData.push({
      year,
      age,
      amount: assetAmount,
    });
  }

  return assetData;
}
